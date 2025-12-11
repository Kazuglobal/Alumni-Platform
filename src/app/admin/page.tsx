import Link from "next/link";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

async function getStats() {
  const [totalTenants, activeTenants, pendingTenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenant.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalTenants,
    activeTenants,
    pendingTenants,
    suspendedTenants: totalTenants - activeTenants - pendingTenants,
  };
}

async function getRecentTenants() {
  return prisma.tenant.findMany({
    where: { status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      subdomain: true,
      status: true,
      createdAt: true,
    },
  });
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const recentTenants = await getRecentTenants();

  const statCards = [
    {
      label: "総テナント数",
      value: stats.totalTenants,
      icon: Building2,
      color: "brand",
      change: "+12%",
    },
    {
      label: "アクティブ",
      value: stats.activeTenants,
      icon: Activity,
      color: "emerald",
      change: "+8%",
    },
    {
      label: "ユーザー数",
      value: "—",
      icon: Users,
      color: "blue",
      change: "—",
    },
    {
      label: "月間アクセス",
      value: "—",
      icon: TrendingUp,
      color: "violet",
      change: "—",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-surface-900">
            ダッシュボード
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            プラットフォームの概要と最新のアクティビティ
          </p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          新規テナント作成
        </Link>
      </div>

      {/* 統計カード */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold text-surface-900">
                  {stat.value}
                </p>
              </div>
              <div
                className={`rounded-lg p-2.5 ${
                  stat.color === "brand"
                    ? "bg-brand-100 text-brand-600"
                    : stat.color === "emerald"
                      ? "bg-emerald-100 text-emerald-600"
                      : stat.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-violet-100 text-violet-600"
                }`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <span className="font-medium text-emerald-600">{stat.change}</span>
              <span className="text-surface-500">前月比</span>
            </div>
            {/* 装飾 */}
            <div
              className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 ${
                stat.color === "brand"
                  ? "bg-brand-500"
                  : stat.color === "emerald"
                    ? "bg-emerald-500"
                    : stat.color === "blue"
                      ? "bg-blue-500"
                      : "bg-violet-500"
              }`}
            />
          </div>
        ))}
      </div>

      {/* 最近のテナント */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-200 p-6">
          <h3 className="font-display text-lg font-semibold text-surface-900">
            最近のテナント
          </h3>
          <Link
            href="/admin/tenants"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            すべて表示
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {recentTenants.length > 0 ? (
          <div className="divide-y divide-surface-100">
            {recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-4 transition-colors hover:bg-surface-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 font-display text-sm font-semibold text-brand-700">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{tenant.name}</p>
                    <p className="text-sm text-surface-500">
                      {tenant.subdomain}.localhost:3000
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tenant.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : tenant.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-surface-100 text-surface-600"
                    }`}
                  >
                    {tenant.status === "ACTIVE"
                      ? "有効"
                      : tenant.status === "PENDING"
                        ? "準備中"
                        : "停止中"}
                  </span>
                  <span className="text-sm text-surface-500">
                    {new Date(tenant.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-surface-100 p-4">
              <Building2 className="h-8 w-8 text-surface-400" />
            </div>
            <p className="mt-4 font-medium text-surface-700">
              テナントがまだありません
            </p>
            <p className="mt-1 text-sm text-surface-500">
              最初のテナントを作成して始めましょう
            </p>
            <Link
              href="/admin/tenants/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              テナントを作成
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

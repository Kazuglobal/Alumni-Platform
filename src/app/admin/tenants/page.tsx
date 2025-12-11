import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

async function getTenants() {
  return prisma.tenant.findMany({
    where: { status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
      status: true,
      contactEmail: true,
      contactName: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export default async function TenantsPage() {
  const tenants = await getTenants();

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-surface-900">
            テナント管理
          </h2>
          <p className="mt-1 text-sm text-surface-500">
            同窓会テナントの作成・編集・管理を行います
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

      {/* 検索・フィルター */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="テナント名、サブドメインで検索..."
            className="h-10 w-full rounded-lg border border-surface-200 bg-white pl-10 pr-4 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50">
          <Filter className="h-4 w-4" />
          フィルター
        </button>
      </div>

      {/* テナントテーブル */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        {tenants.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                  テナント名
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                  サブドメイン
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                  ステータス
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                  連絡先
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                  作成日
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="transition-colors hover:bg-surface-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 font-display text-sm font-semibold text-brand-700">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">
                          {tenant.name}
                        </p>
                        {tenant.description && (
                          <p className="max-w-[200px] truncate text-sm text-surface-500">
                            {tenant.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-surface-100 px-2 py-1 text-sm text-surface-700">
                        {tenant.subdomain}
                      </code>
                      <a
                        href={`http://${tenant.subdomain}.localhost:3000`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-surface-400 transition-colors hover:text-brand-500"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
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
                  </td>
                  <td className="px-6 py-4">
                    {tenant.contactEmail ? (
                      <div>
                        <p className="text-sm text-surface-900">
                          {tenant.contactName || "—"}
                        </p>
                        <p className="text-sm text-surface-500">
                          {tenant.contactEmail}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-surface-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500">
                    {new Date(tenant.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="rounded-lg p-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
                        title="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {tenant.status === "ACTIVE" ? (
                        <button
                          className="rounded-lg p-2 text-amber-500 transition-colors hover:bg-amber-50 hover:text-amber-600"
                          title="停止"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          className="rounded-lg p-2 text-emerald-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                          title="有効化"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-surface-100 p-4">
              <Search className="h-8 w-8 text-surface-400" />
            </div>
            <p className="mt-4 font-medium text-surface-700">
              テナントが見つかりません
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

      {/* ページネーション */}
      {tenants.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            全 <span className="font-medium text-surface-700">{tenants.length}</span> 件
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-400"
            >
              前へ
            </button>
            <button
              disabled
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-400"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Users, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { TenantRole, hasRoleOrHigher, isPlatformAdmin } from "@/lib/auth/permissions";
import type { AuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";

export const dynamic = "force-dynamic";

async function getStats(tenantId: string) {
  const [postsCount, publishedCount, membersCount, recentPosts] = await Promise.all([
    prisma.post.count({ where: { tenantId } }),
    prisma.post.count({ where: { tenantId, status: "PUBLISHED" } }),
    prisma.tenantMembership.count({ where: { tenantId } }),
    prisma.post.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return { postsCount, publishedCount, membersCount, recentPosts };
}

export default async function TenantAdminDashboard({
  params,
}: {
  params: { domain: string };
}) {
  const domain = params.domain;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentUser = session.user as AuthUser;
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const membership = currentUser.memberships?.find(
    (m) => m.tenantId === tenant.id
  );
  const isAdminOrHigher =
    isPlatformAdmin(currentUser) ||
    (membership ? hasRoleOrHigher(membership.role, TenantRole.ADMIN) : false);

  if (!isAdminOrHigher) {
    notFound();
  }

  const stats = await getStats(tenant.id);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">
          ダッシュボード
        </h1>
        <p className="mt-1 text-surface-500">
          {tenant.name} の管理画面
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* TODO: replace hardcoded count with real events count */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-brand-100 p-3">
              <FileText className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-surface-900">
                {stats.postsCount}
              </p>
              <p className="text-sm text-surface-500">総記事数</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-100 p-3">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-surface-900">
                {stats.publishedCount}
              </p>
              <p className="text-sm text-surface-500">公開中</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-surface-900">
                {stats.membersCount}
              </p>
              <p className="text-sm text-surface-500">会員数</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-surface-900">0</p>
              <p className="text-sm text-surface-500">今月のイベント</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
          <h2 className="font-semibold text-surface-900">最近の記事</h2>
          <Link
            href={`/${domain}/admin/posts`}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            すべて見る
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {stats.recentPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-10 w-10 text-surface-300" />
            <p className="mt-3 text-surface-500">まだ記事がありません</p>
            <Link
              href={`/${domain}/admin/posts/new`}
              className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              最初の記事を作成
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {stats.recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/${domain}/admin/posts/${post.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-50"
              >
                <div>
                  <p className="font-medium text-surface-900">{post.title}</p>
                  <p className="text-sm text-surface-500">
                    {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    post.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-700"
                      : post.status === "DRAFT"
                        ? "bg-surface-100 text-surface-600"
                        : post.status === "SCHEDULED"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-surface-100 text-surface-500"
                  }`}
                >
                  {post.status === "PUBLISHED"
                    ? "公開中"
                    : post.status === "DRAFT"
                      ? "下書き"
                      : post.status === "SCHEDULED"
                        ? "予約"
                        : "アーカイブ"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/${domain}/admin/posts/new`}
          className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
        >
          <div className="rounded-lg bg-brand-100 p-3">
            <FileText className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">新規記事作成</p>
            <p className="text-sm text-surface-500">会報記事を作成</p>
          </div>
        </Link>

        <Link
          href={`/${domain}/admin/members`}
          className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
        >
          <div className="rounded-lg bg-blue-100 p-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">会員管理</p>
            <p className="text-sm text-surface-500">会員の確認・管理</p>
          </div>
        </Link>

        <Link
          href={`/${domain}/admin/settings`}
          className="flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
        >
          <div className="rounded-lg bg-surface-100 p-3">
            <Calendar className="h-6 w-6 text-surface-600" />
          </div>
          <div>
            <p className="font-medium text-surface-900">サイト設定</p>
            <p className="text-sm text-surface-500">テンプレート・設定</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

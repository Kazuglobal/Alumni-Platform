import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  FileText,
  Calendar,
  Eye,
  EyeOff,
  Clock,
  Archive,
  Edit,
} from "lucide-react";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";

export const dynamic = "force-dynamic";

const statusLabels = {
  DRAFT: { label: "下書き", color: "bg-surface-100 text-surface-600" },
  SCHEDULED: { label: "予約", color: "bg-amber-100 text-amber-700" },
  PUBLISHED: { label: "公開中", color: "bg-emerald-100 text-emerald-700" },
  ARCHIVED: { label: "アーカイブ", color: "bg-surface-100 text-surface-500" },
};

const visibilityIcons = {
  PUBLIC: Eye,
  MEMBERS: EyeOff,
  PRIVATE: EyeOff,
};

async function getPosts(tenantId: string) {
  return prisma.post.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
    include: {
      category: {
        select: { name: true },
      },
    },
  });
}

export default async function PostsListPage({
  params,
}: {
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const posts = await getPosts(tenant.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">記事管理</h1>
          <p className="mt-1 text-sm text-surface-500">
            会報記事の作成・編集・公開管理
          </p>
        </div>
        <Link
          href={`/${params.domain}/admin/posts/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-surface-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {posts.filter((p) => p.status === "PUBLISHED").length}
              </p>
              <p className="text-xs text-surface-500">公開中</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-surface-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-surface-100 p-2">
              <Edit className="h-5 w-5 text-surface-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {posts.filter((p) => p.status === "DRAFT").length}
              </p>
              <p className="text-xs text-surface-500">下書き</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-surface-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {posts.filter((p) => p.status === "SCHEDULED").length}
              </p>
              <p className="text-xs text-surface-500">予約中</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-surface-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-surface-100 p-2">
              <Archive className="h-5 w-5 text-surface-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {posts.filter((p) => p.status === "ARCHIVED").length}
              </p>
              <p className="text-xs text-surface-500">アーカイブ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts list */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-sm">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-surface-300" />
            <p className="mt-4 text-surface-500">まだ記事がありません</p>
            <Link
              href={`/${params.domain}/admin/posts/new`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              最初の記事を作成
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-200">
            {posts.map((post) => {
              const StatusIcon = visibilityIcons[post.visibility];
              const status = statusLabels[post.status];

              return (
                <Link
                  key={post.id}
                  href={`/${params.domain}/admin/posts/${post.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-50"
                >
                  {/* Cover image or placeholder */}
                  <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-surface-100">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-6 w-6 text-surface-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium text-surface-900">
                        {post.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-surface-500">
                      {post.category && (
                        <span className="flex items-center gap-1">
                          {post.category.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <StatusIcon className="h-3.5 w-3.5" />
                        {post.visibility === "PUBLIC"
                          ? "全員"
                          : post.visibility === "MEMBERS"
                            ? "会員のみ"
                            : "非公開"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.updatedAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    {post.excerpt && (
                      <p className="mt-1 line-clamp-1 text-sm text-surface-400">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* View count */}
                  <div className="flex items-center gap-1 text-sm text-surface-400">
                    <Eye className="h-4 w-4" />
                    {post.viewCount}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

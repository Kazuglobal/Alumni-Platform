import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Eye, AlertTriangle, Edit } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { auth } from "@/auth";
import { sanitizePostContent } from "@/lib/posts/sanitize";

async function getPost(tenantId: string, postId: string) {
  return prisma.post.findUnique({
    where: { id: postId, tenantId },
    include: {
      category: {
        select: { name: true, slug: true },
      },
    },
  });
}

export default async function PostPreviewPage({
  params,
}: {
  params: { domain: string; id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  // Check user has access to this tenant
  const userId = session.user.id;
  if (!userId) {
    redirect("/login");
  }

  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId: tenant.id,
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const post = await getPost(tenant.id, params.id);

  if (!post) {
    notFound();
  }

  const sanitizedContent = sanitizePostContent(post.content);

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "下書き", color: "bg-amber-100 text-amber-800" },
    SCHEDULED: { label: "予約公開", color: "bg-blue-100 text-blue-800" },
    PUBLISHED: { label: "公開中", color: "bg-emerald-100 text-emerald-800" },
    ARCHIVED: { label: "アーカイブ", color: "bg-surface-100 text-surface-800" },
  };

  const visibilityLabels: Record<string, string> = {
    PUBLIC: "全員に公開",
    MEMBERS: "会員のみ",
    PRIVATE: "非公開",
  };

  const statusInfo = statusLabels[post.status] || statusLabels.DRAFT;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Preview banner */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">プレビューモード</p>
            <p className="text-sm text-amber-600">
              この記事は{visibilityLabels[post.visibility]}で{statusInfo.label}の状態です
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/posts/${post.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
          >
            <Edit className="h-4 w-4" />
            編集
          </Link>
        </div>
      </div>

      <article className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
        {/* Back link */}
        <Link
          href="/admin/posts"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
        >
          <ArrowLeft className="h-4 w-4" />
          記事一覧に戻る
        </Link>

        {/* Status badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-700">
            {visibilityLabels[post.visibility]}
          </span>
        </div>

        {/* Header */}
        <header className="mb-8">
          {post.category && (
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              {post.category.name}
            </span>
          )}

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-surface-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.status === "SCHEDULED" && post.scheduledAt
                ? `予約: ${new Date(post.scheduledAt).toLocaleString("ja-JP")}`
                : post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "未公開"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.viewCount} views
            </span>
          </div>
        </header>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mb-8 overflow-hidden rounded-xl">
            <img
              src={post.coverImage}
              alt=""
              className="h-auto w-full"
            />
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <div className="mb-8 rounded-lg bg-surface-50 p-4">
            <p className="text-surface-600">{post.excerpt}</p>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </article>
    </div>
  );
}

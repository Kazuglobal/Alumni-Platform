import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { ShareButton } from "@/components/share-button";

export const revalidate = 60;

async function getPost(tenantId: string, slug: string) {
  const post = await prisma.post.findUnique({
    where: {
      tenantId_slug: { tenantId, slug },
    },
    include: {
      category: {
        select: { name: true, slug: true },
      },
    },
  });

  if (!post || post.status !== "PUBLISHED" || post.visibility !== "PUBLIC") {
    return null;
  }

  // Increment view count
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return post;
}

async function getRelatedPosts(tenantId: string, currentPostId: string, categoryId: string | null) {
  return prisma.post.findMany({
    where: {
      tenantId,
      id: { not: currentPostId },
      status: "PUBLISHED",
      visibility: "PUBLIC",
      ...(categoryId && { categoryId }),
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { domain: string; slug: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);
  if (!tenant) return { title: "Not Found" };

  const post = await prisma.post.findUnique({
    where: { tenantId_slug: { tenantId: tenant.id, slug: params.slug } },
    select: { title: true, excerpt: true },
  });

  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: { domain: string; slug: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const post = await getPost(tenant.id, params.slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(tenant.id, post.id, post.categoryId);

  return (
    <article className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/news"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: "var(--template-text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        お知らせ一覧に戻る
      </Link>

      {/* Header */}
      <header className="mb-8">
        {post.category && (
          <Link
            href={`/news?category=${post.category.slug}`}
            className="inline-block rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: "var(--template-bg-secondary)",
              color: "var(--template-primary)",
            }}
          >
            {post.category.name}
          </Link>
        )}

        <h1
          className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
          style={{
            fontFamily: "var(--template-font-heading)",
            color: "var(--template-text-primary)",
          }}
        >
          {post.title}
        </h1>

        <div
          className="mt-4 flex flex-wrap items-center gap-4 text-sm"
          style={{ color: "var(--template-text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
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

      {/* Content */}
      <div
        className="prose prose-lg max-w-none"
        style={{
          "--tw-prose-body": "var(--template-text-primary)",
          "--tw-prose-headings": "var(--template-text-primary)",
          "--tw-prose-links": "var(--template-primary)",
        } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Share */}
      <div
        className="mt-12 flex items-center justify-between border-t pt-6"
        style={{ borderColor: "var(--template-border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm"
            style={{ color: "var(--template-text-secondary)" }}
          >
            この記事をシェア
          </span>
          <ShareButton title={post.title} />
        </div>
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <h2
            className="mb-6 text-xl font-bold"
            style={{
              fontFamily: "var(--template-font-heading)",
              color: "var(--template-text-primary)",
            }}
          >
            関連記事
          </h2>

          <div className="grid gap-6 sm:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/news/${related.slug}`}
                className="group overflow-hidden rounded-lg transition-all hover:shadow-md"
                style={{
                  backgroundColor: "var(--template-bg-primary)",
                  border: "1px solid var(--template-border)",
                }}
              >
                <div className="aspect-video overflow-hidden">
                  {related.coverImage ? (
                    <img
                      src={related.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="flex h-full items-center justify-center"
                      style={{ backgroundColor: "var(--template-bg-secondary)" }}
                    >
                      <span
                        className="text-2xl font-bold"
                        style={{ color: "var(--template-primary)", opacity: 0.3 }}
                      >
                        {tenant.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3
                    className="line-clamp-2 text-sm font-medium group-hover:underline"
                    style={{ color: "var(--template-text-primary)" }}
                  >
                    {related.title}
                  </h3>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--template-text-muted)" }}
                  >
                    {related.publishedAt
                      ? new Date(related.publishedAt).toLocaleDateString("ja-JP")
                      : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

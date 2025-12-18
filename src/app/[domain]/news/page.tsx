import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";

export const revalidate = 60; // ISR: revalidate every 60 seconds

async function getPublishedPosts(tenantId: string) {
  return prisma.post.findMany({
    where: {
      tenantId,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      category: {
        select: { name: true, slug: true },
      },
    },
  });
}

export default async function NewsListPage({
  params,
}: {
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const posts = await getPublishedPosts(tenant.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{
            fontFamily: "var(--template-font-heading)",
            color: "var(--template-text-primary)",
          }}
        >
          お知らせ・会報
        </h1>
        <p
          className="mt-3 text-lg"
          style={{ color: "var(--template-text-secondary)" }}
        >
          {tenant.name}の最新情報をお届けします
        </p>
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: "var(--template-text-secondary)" }}>
            まだ記事がありません
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/${encodeURIComponent(params.domain)}/news/${post.slug}`}
              className="group overflow-hidden rounded-xl transition-all hover:shadow-lg"
              style={{
                backgroundColor: "var(--template-bg-primary)",
                border: "1px solid var(--template-border)",
              }}
            >
              {/* Cover image */}
              <div className="aspect-video overflow-hidden">
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center"
                    style={{ backgroundColor: "var(--template-bg-secondary)" }}
                  >
                    <span
                      className="text-4xl font-bold"
                      style={{ color: "var(--template-primary)", opacity: 0.3 }}
                    >
                      {tenant.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                {post.category && (
                  <span
                    className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--template-bg-secondary)",
                      color: "var(--template-primary)",
                    }}
                  >
                    {post.category.name}
                  </span>
                )}

                <h2
                  className="mt-3 line-clamp-2 text-lg font-bold group-hover:underline"
                  style={{
                    fontFamily: "var(--template-font-heading)",
                    color: "var(--template-text-primary)",
                  }}
                >
                  {post.title}
                </h2>

                {post.excerpt && (
                  <p
                    className="mt-2 line-clamp-2 text-sm"
                    style={{ color: "var(--template-text-secondary)" }}
                  >
                    {post.excerpt}
                  </p>
                )}

                <div
                  className="mt-4 flex items-center gap-4 text-sm"
                  style={{ color: "var(--template-text-muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("ja-JP")
                      : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

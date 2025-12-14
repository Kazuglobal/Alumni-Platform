import { NextRequest, NextResponse } from "next/server";
import { Feed } from "feed";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";

export const revalidate = 3600; // Cache for 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const protocol = rootDomain.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${tenant.subdomain}.${rootDomain}`;

  const feed = new Feed({
    title: `${tenant.name} - お知らせ`,
    description: tenant.description || `${tenant.name}の最新情報`,
    id: baseUrl,
    link: baseUrl,
    language: "ja",
    image: tenant.logoUrl || undefined,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${tenant.name}`,
    feedLinks: {
      rss2: `${baseUrl}/feed.xml`,
    },
    author: {
      name: tenant.name,
    },
  });

  const posts = await prisma.post.findMany({
    where: {
      tenantId: tenant.id,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      category: {
        select: { name: true },
      },
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${baseUrl}/news/${post.slug}`,
      link: `${baseUrl}/news/${post.slug}`,
      description: post.excerpt || "",
      content: post.content,
      image: post.coverImage || undefined,
      date: post.publishedAt || new Date(),
      category: post.category ? [{ name: post.category.name }] : [],
    });
  }

  return new NextResponse(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

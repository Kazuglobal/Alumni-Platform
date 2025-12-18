"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sanitizePostContent, generateExcerpt } from "@/lib/posts/sanitize";
import {
  createPostSchema,
  updatePostSchema,
  createCategorySchema,
  type CreatePostInput,
  type UpdatePostInput,
  type CreateCategoryInput,
} from "./schema";

// Create post
export async function createPost(tenantId: string, authorId: string, input: CreatePostInput) {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const {
    title,
    slug,
    content,
    excerpt,
    coverImage,
    status,
    visibility,
    scheduledAt,
    categoryId,
  } = parsed.data;

  // Check slug uniqueness
  const existing = await prisma.post.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });

  if (existing) {
    return {
      success: false,
      error: {
        fieldErrors: { slug: ["このスラッグは既に使用されています"] },
      },
    };
  }

  // Sanitize content
  const sanitizedContent = sanitizePostContent(content);

  // Generate excerpt if not provided
  const finalExcerpt = excerpt || generateExcerpt(sanitizedContent);

  // Determine publish date
  let publishedAt: Date | null = null;
  if (status === "PUBLISHED") {
    publishedAt = new Date();
  }

  try {
    const post = await prisma.post.create({
      data: {
        tenantId,
        title,
        slug,
        content: sanitizedContent,
        excerpt: finalExcerpt,
        coverImage: coverImage || null,
        status,
        visibility,
        publishedAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        categoryId: categoryId || null,
        authorId,
      },
    });

    revalidatePath(`/admin/posts`);
    revalidatePath(`/news`);

    return { success: true, data: post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return {
      success: false,
      error: {
        formErrors: ["記事の作成に失敗しました"],
      },
    };
  }
}

// Update post
export async function updatePost(tenantId: string, input: UpdatePostInput) {
  const parsed = updatePostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const {
    id,
    title,
    slug,
    content,
    excerpt,
    coverImage,
    status,
    visibility,
    scheduledAt,
    categoryId,
  } = parsed.data;

  // Check post exists and belongs to tenant
  const existingPost = await prisma.post.findFirst({
    where: { id, tenantId },
  });

  if (!existingPost) {
    return {
      success: false,
      error: { formErrors: ["記事が見つかりません"] },
    };
  }

  // Check slug uniqueness (if changed)
  if (slug !== existingPost.slug) {
    const slugExists = await prisma.post.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });

    if (slugExists) {
      return {
        success: false,
        error: {
          fieldErrors: { slug: ["このスラッグは既に使用されています"] },
        },
      };
    }
  }

  // Sanitize content
  const sanitizedContent = sanitizePostContent(content);

  // Generate excerpt if not provided
  const finalExcerpt = excerpt || generateExcerpt(sanitizedContent);

  // Determine publish date
  let publishedAt = existingPost.publishedAt;
  if (status === "PUBLISHED" && !publishedAt) {
    publishedAt = new Date();
  } else if (status !== "PUBLISHED") {
    publishedAt = null;
  }

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        content: sanitizedContent,
        excerpt: finalExcerpt,
        coverImage: coverImage || null,
        status,
        visibility,
        publishedAt,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        categoryId: categoryId || null,
      },
    });

    revalidatePath(`/admin/posts`);
    revalidatePath(`/admin/posts/${id}`);
    revalidatePath(`/news`);
    revalidatePath(`/news/${slug}`);

    return { success: true, data: post };
  } catch (error) {
    console.error("Failed to update post:", error);
    return {
      success: false,
      error: {
        formErrors: ["記事の更新に失敗しました"],
      },
    };
  }
}

// Delete post
export async function deletePost(tenantId: string, postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, tenantId },
  });

  if (!post) {
    return { success: false, error: "記事が見つかりません" };
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath(`/admin/posts`);
  revalidatePath(`/news`);

  return { success: true };
}

// Create category
export async function createCategory(tenantId: string, input: CreateCategoryInput) {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { name, slug, description } = parsed.data;

  try {
    const category = await prisma.category.create({
      data: {
        tenantId,
        name,
        slug,
        description: description || null,
      },
    });

    revalidatePath(`/admin/posts`);

    return { success: true, data: category };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes("tenantId_slug")
    ) {
      return {
        success: false,
        error: {
          fieldErrors: { slug: ["このスラッグは既に使用されています"] },
        },
      };
    }

    console.error("Failed to create category:", error);
    return {
      success: false,
      error: {
        formErrors: ["カテゴリの作成に失敗しました"],
      },
    };
  }
}

// Get categories for tenant
export async function getCategories(tenantId: string) {
  return prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

// Publish scheduled posts (to be called by cron job)
export async function publishScheduledPosts() {
  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        lte: now,
      },
    },
  });

  for (const post of posts) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: post.scheduledAt,
      },
    });
  }

  return { published: posts.length };
}

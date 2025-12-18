import { z } from "zod";

// Post create schema
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "タイトルを入力してください")
    .max(200, "200文字以下で入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(100, "100文字以下で入力してください")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "小文字英数字とハイフンのみ使用可能です"
    ),
  content: z
    .string()
    .min(1, "本文を入力してください")
    .max(100000, "100000文字以下で入力してください"),
  excerpt: z
    .string()
    .max(300, "300文字以下で入力してください")
    .optional()
    .or(z.literal("")),
  coverImage: z
    .string()
    .url("有効なURLを入力してください")
    .optional()
    .or(z.literal("")),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  visibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]).default("PUBLIC"),
  scheduledAt: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().datetime().optional()
  ),
  categoryId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().cuid().optional()
  ),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

// Post update schema
export const updatePostSchema = createPostSchema.extend({
  id: z.string().cuid(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// Category create schema
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "カテゴリ名を入力してください")
    .max(50, "50文字以下で入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(50, "50文字以下で入力してください")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "小文字英数字とハイフンのみ使用可能です"
    ),
  description: z
    .string()
    .max(200, "200文字以下で入力してください")
    .optional()
    .or(z.literal("")),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

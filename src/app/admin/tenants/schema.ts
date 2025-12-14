import { z } from "zod";

// 予約済みサブドメイン
const RESERVED_SUBDOMAINS = [
  "admin",
  "api",
  "www",
  "app",
  "dashboard",
  "static",
  "assets",
  "cdn",
  "mail",
  "email",
  "support",
  "help",
  "docs",
  "blog",
];

// サブドメインのバリデーション
const subdomainSchema = z
  .string()
  .min(3, "3文字以上で入力してください")
  .max(63, "63文字以下で入力してください")
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    "小文字英数字とハイフンのみ使用可能です（先頭・末尾にハイフン不可）"
  )
  .refine(
    (val) => !RESERVED_SUBDOMAINS.includes(val),
    "この名前は予約されています"
  );

// テナント作成スキーマ
export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(200, "200文字以下で入力してください"),
  subdomain: subdomainSchema,
  description: z
    .string()
    .max(1000, "1000文字以下で入力してください")
    .optional()
    .or(z.literal("")),
  contactEmail: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  contactName: z
    .string()
    .max(100, "100文字以下で入力してください")
    .optional()
    .or(z.literal("")),
  templateId: z.string().optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

// テナント更新スキーマ
export const updateTenantSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactName: z.string().max(100).optional().or(z.literal("")),
  settings: z.record(z.unknown()).optional(),
  templateId: z.string().max(50).optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// カスタムドメイン設定スキーマ
export const setCustomDomainSchema = z.object({
  tenantId: z.string().cuid(),
  customDomain: z
    .string()
    .regex(/^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/, "有効なドメイン名を入力してください")
    .optional()
    .or(z.literal("")),
});

import { prisma } from "@/lib/db/client";
import { cache } from "react";

// 予約済みサブドメイン（これらはテナントとして使用不可）
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
] as const;

export type ReservedSubdomain = (typeof RESERVED_SUBDOMAINS)[number];

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(
    subdomain.toLowerCase() as ReservedSubdomain
  );
}

// テナント取得（Reactのcacheでリクエスト単位でキャッシュ）
export const getTenantBySubdomain = cache(async (subdomain: string) => {
  if (isReservedSubdomain(subdomain)) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: subdomain.toLowerCase() },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
      status: true,
      settings: true,
      logoUrl: true,
      description: true,
      contactEmail: true,
      contactName: true,
      templateId: true,
    },
  });

  // ACTIVEステータス以外は表示しない
  if (tenant && tenant.status !== "ACTIVE") {
    return null;
  }

  return tenant;
});

// カスタムドメインからテナント取得
export const getTenantByCustomDomain = cache(async (domain: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { customDomain: domain.toLowerCase() },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
      status: true,
      settings: true,
      logoUrl: true,
      description: true,
      contactEmail: true,
      contactName: true,
      templateId: true,
    },
  });

  if (tenant && tenant.status !== "ACTIVE") {
    return null;
  }

  return tenant;
});

// ホスト名からサブドメインを抽出
export function extractSubdomain(hostname: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  // localhostの場合の処理
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[parts.length - 1].startsWith("localhost")) {
      return parts[0];
    }
    return null;
  }

  // 本番環境（ポートを除外）
  const hostnameWithoutPort = hostname.split(":")[0];
  const rootDomainWithoutPort = rootDomain.split(":")[0];

  if (hostnameWithoutPort.endsWith(`.${rootDomainWithoutPort}`)) {
    const subdomain = hostnameWithoutPort.replace(
      `.${rootDomainWithoutPort}`,
      ""
    );
    return subdomain || null;
  }

  return null;
}

// サブドメインのバリデーション
export function validateSubdomain(subdomain: string): {
  valid: boolean;
  error?: string;
} {
  if (subdomain.length < 3) {
    return { valid: false, error: "3文字以上で入力してください" };
  }

  if (subdomain.length > 63) {
    return { valid: false, error: "63文字以下で入力してください" };
  }

  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!pattern.test(subdomain)) {
    return {
      valid: false,
      error:
        "小文字英数字とハイフンのみ使用可能です（先頭・末尾にハイフン不可）",
    };
  }

  if (isReservedSubdomain(subdomain)) {
    return { valid: false, error: "この名前は予約されています" };
  }

  return { valid: true };
}

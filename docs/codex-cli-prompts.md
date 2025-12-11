# 同窓会マルチテナントプラットフォーム Codex CLI プロンプト集

> Vercel for Platformsを活用した同窓会向けマルチテナントプラットフォームの完全実装ガイド

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [プロンプト1: プロジェクト基盤セットアップ](#プロンプト1-プロジェクト基盤セットアップ)
4. [プロンプト2: テナント管理システム](#プロンプト2-テナント管理システム)
5. [プロンプト3: テンプレートシステム](#プロンプト3-テンプレートシステム)
6. [プロンプト4: コンテンツ管理（デジタル会報）](#プロンプト4-コンテンツ管理デジタル会報)
7. [プロンプト5: 決済機能（会費・寄付）](#プロンプト5-決済機能会費寄付)
8. [プロンプト6: AIチャットボット（対話型アーカイブ）](#プロンプト6-aiチャットボット対話型アーカイブ)
9. [プロンプト7: 認証・アクセス制御](#プロンプト7-認証アクセス制御)
10. [プロンプト8: QRコード・イベント管理](#プロンプト8-qrコードイベント管理)
11. [実装順序と依存関係](#実装順序と依存関係)
12. [進捗管理](#進捗管理)
13. [環境変数一覧](#環境変数一覧)
14. [完了後チェックリスト](#完了後チェックリスト)

---

## プロジェクト概要

本プロジェクトは、Vercel for Platformsを活用した同窓会向けマルチテナントプラットフォームです。以下の課題を解決します：

- **若手会員のエンゲージメント低下**: モダンなUI/UXとAIチャットボットで利便性向上
- **ボランティア幹事の負担**: 自動化されたテナント管理と決済処理
- **セキュリティ懸念**: プライバシーファーストの設計、個人情報の最小化

### 主要機能

| 機能 | 説明 |
|------|------|
| マルチテナント | サブドメインベースのテナント分離 |
| テンプレート | 3種類のWebサイトテンプレート |
| CMS | リッチテキストエディタによる会報作成 |
| 決済 | Stripe連携の会費・寄付管理 |
| AIチャット | RAGベースの会報検索チャットボット |
| 認証 | ソーシャルログイン + ロールベースアクセス制御 |
| イベント | QRコード受付 + オフライン対応PWA |

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript 5.4 |
| スタイリング | Tailwind CSS |
| データベース | Vercel Postgres (Prisma ORM) |
| 認証 | NextAuth.js v5 (Auth.js) |
| 決済 | Stripe |
| ストレージ | Vercel Blob |
| AI | Vercel AI SDK, OpenAI |
| モノレポ | Turborepo |
| テスト | Playwright |
| バリデーション | Zod |
| フォーム | react-hook-form |

---

## プロンプト1: プロジェクト基盤セットアップ

### タスク概要

Next.js 14 + TypeScript + Tailwind CSSでマルチテナント対応の基盤を構築する。サブドメインベースのテナント識別ミドルウェアを実装し、Vercel for Platformsの土台を作る。

### 事前調査（実装前に必ず実行）

```bash
# 既存のNext.jsプロジェクトがないか確認
ls -la
cat package.json 2>/dev/null || echo "No package.json found"

# Node.jsバージョン確認
node -v

# pnpmがインストールされているか確認
pnpm -v || npm install -g pnpm
```

### 実装要件

#### 1. プロジェクト初期化

```bash
# Next.js 14プロジェクト作成
pnpm create next-app@latest alumni-platform --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd alumni-platform

# 追加パッケージ
pnpm add @t3-oss/env-nextjs zod
pnpm add @prisma/client
pnpm add -D prisma
```

#### 2. ディレクトリ構造

```
alumni-platform/
├── src/
│   ├── app/
│   │   ├── (platform)/              # admin.alumni-platform.com
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # 管理ダッシュボード
│   │   │   └── tenants/
│   │   │       └── page.tsx
│   │   ├── [domain]/                # {tenant}.alumni-platform.com
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                 # ランディングページ
│   ├── components/
│   │   └── ui/
│   ├── lib/
│   │   ├── db/
│   │   │   └── client.ts            # Prismaクライアント
│   │   └── tenant/
│   │       └── resolve.ts           # テナント解決ロジック
│   ├── middleware.ts                # サブドメインルーティング
│   └── env.ts                       # 環境変数バリデーション
├── prisma/
│   └── schema.prisma
├── public/
├── .env.local
├── next.config.js
└── package.json
```

#### 3. 環境変数設定（src/env.ts）

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    VERCEL_API_TOKEN: z.string().min(1),
    VERCEL_TEAM_ID: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
  },
});
```

#### 4. Prisma初期スキーマ（prisma/schema.prisma）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Tenant {
  id              String       @id @default(cuid())
  name            String       @db.VarChar(200)
  subdomain       String       @unique @db.VarChar(63)
  customDomain    String?      @unique
  status          TenantStatus @default(PENDING)
  
  // Vercel連携
  vercelProjectId String?
  
  // 設定
  settings        Json         @default("{}")
  
  // メタデータ
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([subdomain])
  @@index([customDomain])
  @@map("tenants")
}

enum TenantStatus {
  PENDING    // 作成中
  ACTIVE     // 有効
  SUSPENDED  // 停止中
  DELETED    // 削除済み（論理削除）
}
```

#### 5. テナント解決ロジック（src/lib/tenant/resolve.ts）

```typescript
import { prisma } from "@/lib/db/client";
import { env } from "@/env";
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
  return RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase() as ReservedSubdomain);
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
    },
  });

  if (tenant && tenant.status !== "ACTIVE") {
    return null;
  }

  return tenant;
});

// ホスト名からサブドメインを抽出
export function extractSubdomain(hostname: string): string | null {
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN;
  
  // localhostの場合の処理
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[parts.length - 1].startsWith("localhost")) {
      return parts[0];
    }
    return null;
  }

  // 本番環境
  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.replace(`.${rootDomain}`, "");
    return subdomain || null;
  }

  return null;
}
```

#### 6. ミドルウェア（src/middleware.ts）

```typescript
import { NextRequest, NextResponse } from "next/server";
import { extractSubdomain, isReservedSubdomain } from "@/lib/tenant/resolve";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - static files
     * - _next
     * - favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  
  // サブドメインを抽出
  const subdomain = extractSubdomain(hostname);
  
  // ルートドメイン（サブドメインなし）の場合はランディングページ
  if (!subdomain) {
    return NextResponse.next();
  }
  
  // 管理画面（admin.xxx）
  if (subdomain === "admin") {
    // /admin 配下は (platform) グループにルーティング
    url.pathname = `/(platform)${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  // 予約済みサブドメインは404
  if (isReservedSubdomain(subdomain)) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }
  
  // テナントサブドメインの場合、[domain]にルーティング
  url.pathname = `/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}
```

#### 7. Prismaクライアント（src/lib/db/client.ts）

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

#### 8. Next.js設定（next.config.js）

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actionsを有効化
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
    ],
  },
  // サブドメインルーティング用
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

module.exports = nextConfig;
```

### 技術的制約

- ミドルウェアはEdge Runtime必須（Node.js APIは使用不可）
- 予約済みサブドメイン（admin, api, www等）は404を返す
- テナントステータスがACTIVE以外はアクセス拒否
- localhost開発時は`test.localhost:3000`形式でテスト

### 完了条件

1. `pnpm dev`でエラーなく起動
2. `http://localhost:3000` → ランディングページ表示
3. `http://test.localhost:3000` → テナントページ表示（DBデータなしで"Tenant not found"）
4. `http://admin.localhost:3000` → 管理画面表示
5. `http://api.localhost:3000` → 404（予約済み）
6. `pnpm build`が成功
7. `pnpm lint`でエラーゼロ

### 検証コマンド

```bash
# Prismaマイグレーション
npx prisma migrate dev --name init

# 開発サーバー起動
pnpm dev &

# 各エンドポイント確認
curl -s http://localhost:3000 | grep -q "Alumni Platform" && echo "✓ Landing OK"
curl -s -o /dev/null -w "%{http_code}" http://api.localhost:3000 | grep -q "404" && echo "✓ Reserved subdomain OK"

# ビルド確認
pnpm build
```

### テストケース（tests/middleware.spec.ts）

```typescript
import { test, expect } from "@playwright/test";

test.describe("サブドメインルーティング", () => {
  test("ルートドメインでランディングページ表示", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await expect(page.locator("h1")).toContainText("Alumni Platform");
  });

  test("予約済みサブドメインは404", async ({ page }) => {
    const response = await page.goto("http://api.localhost:3000");
    expect(response?.status()).toBe(404);
  });

  test("adminサブドメインで管理画面表示", async ({ page }) => {
    await page.goto("http://admin.localhost:3000");
    await expect(page.locator("h1")).toContainText("管理");
  });

  test("存在しないテナントは404", async ({ page }) => {
    await page.goto("http://nonexistent.localhost:3000");
    await expect(page.locator("text=Tenant not found")).toBeVisible();
  });
});
```

---

## プロンプト2: テナント管理システム

### タスク概要

プラットフォーム管理者がテナント（同窓会）を作成・編集・停止・削除できる管理システムを実装する。テナント作成時にVercel SDKを使用してプロジェクトを自動生成し、サブドメインを設定する。

### 事前調査（実装前に必ず実行）

```bash
# 既存のテナント関連コードを確認
rg -l "tenant|Tenant" --type ts src/

# Prismaスキーマの現状確認
cat prisma/schema.prisma

# 環境変数の確認
cat src/env.ts
```

### 実装要件

#### 1. パッケージ追加

```bash
# Vercel SDK
pnpm add @vercel/sdk

# フォーム関連
pnpm add react-hook-form @hookform/resolvers zod

# UI
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-alert-dialog @radix-ui/react-toast
pnpm add lucide-react
pnpm add class-variance-authority clsx tailwind-merge
```

#### 2. Prismaスキーマ拡張

```prisma
model Tenant {
  id              String       @id @default(cuid())
  name            String       @db.VarChar(200)
  subdomain       String       @unique @db.VarChar(63)
  customDomain    String?      @unique
  status          TenantStatus @default(PENDING)
  
  // Vercel連携
  vercelProjectId String?
  vercelDomainId  String?
  
  // 設定
  settings        Json         @default("{}")
  templateId      String?      @db.VarChar(50)
  
  // 連絡先
  contactEmail    String?      @db.VarChar(255)
  contactName     String?      @db.VarChar(100)
  
  // メタデータ
  description     String?      @db.Text
  logoUrl         String?      @db.VarChar(500)
  
  // 監査
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  createdBy       String?
  
  // リレーション
  auditLogs       TenantAuditLog[]

  @@index([subdomain])
  @@index([customDomain])
  @@index([status])
  @@map("tenants")
}

model TenantAuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  action    String   // created, updated, suspended, activated, deleted
  actor     String   // 実行者のユーザーID
  changes   Json     // 変更内容
  ipAddress String?
  userAgent String?
  
  createdAt DateTime @default(now())

  @@index([tenantId, createdAt])
  @@map("tenant_audit_logs")
}
```

#### 3. ファイル構成

```
src/
├── app/(platform)/
│   ├── layout.tsx                    # 管理画面レイアウト
│   ├── page.tsx                      # ダッシュボード
│   └── tenants/
│       ├── page.tsx                  # テナント一覧
│       ├── new/
│       │   └── page.tsx              # 新規作成
│       ├── [id]/
│       │   ├── page.tsx              # 詳細・編集
│       │   └── settings/
│       │       └── page.tsx          # 詳細設定
│       ├── actions.ts                # Server Actions
│       └── schema.ts                 # バリデーションスキーマ
├── components/
│   ├── tenants/
│   │   ├── tenant-form.tsx           # 作成・編集フォーム
│   │   ├── tenant-table.tsx          # 一覧テーブル
│   │   ├── tenant-card.tsx           # カード表示
│   │   ├── tenant-status-badge.tsx   # ステータスバッジ
│   │   └── tenant-actions-menu.tsx   # アクションメニュー
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── form.tsx
│       ├── dialog.tsx
│       ├── toast.tsx
│       └── data-table.tsx
└── lib/
    └── vercel/
        ├── client.ts                 # Vercel SDKクライアント
        └── projects.ts               # プロジェクト操作
```

#### 4. バリデーションスキーマ（src/app/(platform)/tenants/schema.ts）

```typescript
import { z } from "zod";

// サブドメインのバリデーション
const subdomainSchema = z
  .string()
  .min(3, "3文字以上で入力してください")
  .max(63, "63文字以下で入力してください")
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, "小文字英数字とハイフンのみ使用可能です（先頭・末尾にハイフン不可）")
  .refine(
    (val) => !["admin", "api", "www", "app", "dashboard", "static", "assets", "cdn", "mail", "email", "support", "help", "docs", "blog"].includes(val),
    "この名前は予約されています"
  );

// テナント作成スキーマ
export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(200, "200文字以下で入力してください"),
  subdomain: subdomainSchema,
  description: z.string().max(1000, "1000文字以下で入力してください").optional(),
  contactEmail: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),
  contactName: z.string().max(100, "100文字以下で入力してください").optional(),
  templateId: z.string().optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

// テナント更新スキーマ
export const updateTenantSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactName: z.string().max(100).optional(),
  settings: z.record(z.unknown()).optional(),
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
```

#### 5. Vercel SDK操作（src/lib/vercel/projects.ts）

```typescript
import { Vercel } from "@vercel/sdk";
import { env } from "@/env";

const vercel = new Vercel({
  bearerToken: env.VERCEL_API_TOKEN,
});

export type ProvisionResult = {
  projectId: string;
  domainId?: string;
};

// テナント用プロジェクト作成
export async function provisionTenantProject(
  subdomain: string,
  name: string
): Promise<ProvisionResult> {
  const rootDomain = env.NEXT_PUBLIC_ROOT_DOMAIN;
  const teamId = env.VERCEL_TEAM_ID;

  // プロジェクト作成
  const project = await vercel.projects.createProject({
    requestBody: {
      name: `tenant-${subdomain}`,
      framework: "nextjs",
      ...(teamId && { teamId }),
    },
  });

  // サブドメイン追加
  const domain = await vercel.projects.addProjectDomain({
    idOrName: project.id,
    requestBody: {
      name: `${subdomain}.${rootDomain}`,
    },
    ...(teamId && { teamId }),
  });

  return {
    projectId: project.id,
    domainId: domain.name,
  };
}

// カスタムドメイン設定
export async function configureTenantDomain(
  projectId: string,
  customDomain: string
): Promise<{ domainId: string }> {
  const teamId = env.VERCEL_TEAM_ID;

  const domain = await vercel.projects.addProjectDomain({
    idOrName: projectId,
    requestBody: {
      name: customDomain,
    },
    ...(teamId && { teamId }),
  });

  return { domainId: domain.name };
}

// ドメイン削除
export async function removeTenantDomain(
  projectId: string,
  domain: string
): Promise<void> {
  const teamId = env.VERCEL_TEAM_ID;

  await vercel.projects.removeProjectDomain({
    idOrName: projectId,
    domain,
    ...(teamId && { teamId }),
  });
}

// プロジェクト削除
export async function deleteTenantProject(projectId: string): Promise<void> {
  const teamId = env.VERCEL_TEAM_ID;

  await vercel.projects.deleteProject({
    idOrName: projectId,
    ...(teamId && { teamId }),
  });
}
```

#### 6. Server Actions（src/app/(platform)/tenants/actions.ts）

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { auth } from "@/auth";
import { 
  provisionTenantProject, 
  configureTenantDomain,
  deleteTenantProject 
} from "@/lib/vercel/projects";
import { 
  createTenantSchema, 
  updateTenantSchema,
  type CreateTenantInput,
  type UpdateTenantInput 
} from "./schema";

// 管理者チェック
async function requirePlatformAdmin() {
  const session = await auth();
  if (!session?.user?.isPlatformAdmin) {
    throw new Error("プラットフォーム管理者権限が必要です");
  }
  return session;
}

// 監査ログ記録
async function logAudit(
  tenantId: string,
  action: string,
  actor: string,
  changes: Record<string, unknown>
) {
  await prisma.tenantAuditLog.create({
    data: {
      tenantId,
      action,
      actor,
      changes,
    },
  });
}

// テナント作成
export async function createTenant(input: CreateTenantInput) {
  const session = await requirePlatformAdmin();
  
  // バリデーション
  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }
  
  const { name, subdomain, description, contactEmail, contactName, templateId } = parsed.data;
  
  // サブドメイン重複チェック
  const existing = await prisma.tenant.findUnique({
    where: { subdomain },
  });
  
  if (existing) {
    return { 
      success: false, 
      error: { fieldErrors: { subdomain: ["このサブドメインは既に使用されています"] } } 
    };
  }
  
  try {
    // Vercelプロジェクト作成
    const { projectId, domainId } = await provisionTenantProject(subdomain, name);
    
    // DB作成
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        description,
        contactEmail: contactEmail || null,
        contactName: contactName || null,
        templateId: templateId || null,
        vercelProjectId: projectId,
        vercelDomainId: domainId,
        status: "ACTIVE",
        createdBy: session.user.id,
      },
    });
    
    // 監査ログ
    await logAudit(tenant.id, "created", session.user.id, {
      name,
      subdomain,
      templateId,
    });
    
    revalidatePath("/tenants");
    
    return { success: true, data: tenant };
    
  } catch (error) {
    console.error("Failed to create tenant:", error);
    return { 
      success: false, 
      error: { formErrors: ["テナントの作成に失敗しました。しばらくしてから再試行してください。"] } 
    };
  }
}

// テナント更新
export async function updateTenant(input: UpdateTenantInput) {
  const session = await requirePlatformAdmin();
  
  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }
  
  const { id, ...data } = parsed.data;
  
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return { success: false, error: { formErrors: ["テナントが見つかりません"] } };
  }
  
  const updated = await prisma.tenant.update({
    where: { id },
    data: {
      ...data,
      contactEmail: data.contactEmail || null,
    },
  });
  
  await logAudit(id, "updated", session.user.id, data);
  
  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  
  return { success: true, data: updated };
}

// テナント停止
export async function suspendTenant(tenantId: string) {
  const session = await requirePlatformAdmin();
  
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { success: false, error: "テナントが見つかりません" };
  }
  
  if (tenant.status === "SUSPENDED") {
    return { success: false, error: "既に停止されています" };
  }
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "SUSPENDED" },
  });
  
  await logAudit(tenantId, "suspended", session.user.id, {
    previousStatus: tenant.status,
  });
  
  revalidatePath("/tenants");
  
  return { success: true };
}

// テナント有効化
export async function activateTenant(tenantId: string) {
  const session = await requirePlatformAdmin();
  
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { success: false, error: "テナントが見つかりません" };
  }
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "ACTIVE" },
  });
  
  await logAudit(tenantId, "activated", session.user.id, {
    previousStatus: tenant.status,
  });
  
  revalidatePath("/tenants");
  
  return { success: true };
}

// テナント削除（論理削除）
export async function deleteTenant(tenantId: string) {
  const session = await requirePlatformAdmin();
  
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { success: false, error: "テナントが見つかりません" };
  }
  
  // Vercelプロジェクト削除
  if (tenant.vercelProjectId) {
    try {
      await deleteTenantProject(tenant.vercelProjectId);
    } catch (error) {
      console.error("Failed to delete Vercel project:", error);
      // 続行（Vercel側で既に削除済みの可能性）
    }
  }
  
  // 論理削除
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      status: "DELETED",
      subdomain: `deleted-${tenant.subdomain}-${Date.now()}`, // 重複防止
    },
  });
  
  await logAudit(tenantId, "deleted", session.user.id, {});
  
  revalidatePath("/tenants");
  redirect("/tenants");
}
```

### 技術的制約

- Server Actionsでは必ずセッションチェックを行う
- プラットフォーム管理者（`isPlatformAdmin`）のみがテナント操作可能
- すべての操作は監査ログに記録
- Vercel API呼び出しは非同期で行い、失敗時はDBをロールバック

### 完了条件

1. テナント一覧ページが表示される
2. 新規テナント作成 → Vercelプロジェクトが自動生成 → サブドメインでアクセス可能
3. テナント編集（名前、説明、連絡先）が正常に動作
4. テナント停止 → ステータス変更 → サブドメインアクセス不可
5. テナント削除（論理削除）→ Vercelプロジェクト削除 → 一覧から非表示
6. 重複サブドメインでバリデーションエラー
7. 予約済みサブドメインでバリデーションエラー
8. 監査ログに操作履歴が記録される

### エラーハンドリング

| エラー | 対応 |
|-------|------|
| Vercel API rate limit | 3回リトライ（exponential backoff）後、ユーザーに再試行を促す |
| Vercel API タイムアウト | 30秒でタイムアウト、失敗時はDBをロールバック |
| サブドメイン重複 | フォームにインラインエラー表示 |
| 権限不足 | 403エラーページにリダイレクト |

---

## プロンプト3: テンプレートシステム

### タスク概要

同窓会サイト用の3種類のWebサイトテンプレートを作成する。各テンプレートはTurborepoモノレポ内のパッケージとして管理し、テナント作成時に選択できるようにする。

### 事前調査（実装前に必ず実行）

```bash
# 現在のプロジェクト構造を確認
ls -la

# モノレポ構成の確認
cat turbo.json 2>/dev/null || echo "Not a Turborepo project yet"
cat pnpm-workspace.yaml 2>/dev/null || echo "No pnpm workspace"

# 既存のテンプレート関連コードを確認
rg -l "template|Template" --type ts src/
```

### 実装要件

#### 1. Turborepoセットアップ

```bash
# ルートにpnpm-workspace.yamlを作成
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
EOF

# turbo.jsonを作成
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
EOF
```

#### 2. ディレクトリ構造

```
alumni-platform/
├── apps/
│   └── platform/                    # 既存のNext.jsアプリをここに移動
├── packages/
│   ├── ui/                          # 共通UIコンポーネント
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── header.tsx
│   │   │   │   ├── footer.tsx
│   │   │   │   ├── navigation.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   └── index.ts
│   │   │   ├── styles/
│   │   │   │   └── variables.css
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── templates/
│       ├── standard/                # スタンダードテンプレート
│       │   ├── src/
│       │   │   ├── components/
│       │   │   ├── layouts/
│       │   │   └── pages/
│       │   ├── template.json        # メタデータ
│       │   └── package.json
│       ├── gallery/                 # ギャラリーテンプレート
│       │   ├── src/
│       │   ├── template.json
│       │   └── package.json
│       └── simple/                  # シンプルテンプレート
│           ├── src/
│           ├── template.json
│           └── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

#### 3. テンプレート種類

| テンプレート | 用途 | 特徴 | カラー |
|-------------|------|------|--------|
| Standard | 大規模校の同窓会 | ニュース+イベント+会員情報 | 紺×白 |
| Gallery | 若手OB会 | 写真・動画中心 | オレンジ×白 |
| Simple | 部活動同窓会 | 掲示板+連絡先のみ | グレースケール |

#### 4. CSS変数設計（packages/ui/src/styles/variables.css）

```css
:root {
  /* 基本カラー（テンプレートで上書き可能） */
  --color-primary: var(--template-primary, #1a365d);
  --color-primary-hover: var(--template-primary-hover, #2c4a7c);
  --color-secondary: var(--template-secondary, #718096);
  --color-accent: var(--template-accent, #ed8936);
  
  /* テキスト */
  --color-text-primary: var(--template-text-primary, #1a202c);
  --color-text-secondary: var(--template-text-secondary, #4a5568);
  --color-text-muted: var(--template-text-muted, #a0aec0);
  
  /* 背景 */
  --color-bg-primary: var(--template-bg-primary, #ffffff);
  --color-bg-secondary: var(--template-bg-secondary, #f7fafc);
  --color-bg-accent: var(--template-bg-accent, #edf2f7);
  
  /* ボーダー */
  --color-border: var(--template-border, #e2e8f0);
  
  /* フォント */
  --font-heading: var(--template-font-heading, 'Noto Sans JP', sans-serif);
  --font-body: var(--template-font-body, 'Noto Sans JP', sans-serif);
  
  /* スペーシング */
  --spacing-header-height: var(--template-header-height, 64px);
  --spacing-footer-height: var(--template-footer-height, 200px);
  --spacing-container-max: var(--template-container-max, 1200px);
  
  /* アニメーション */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

#### 5. テンプレートメタデータ（packages/templates/standard/template.json）

```json
{
  "id": "standard",
  "name": "スタンダード",
  "description": "ニュース、イベント、会員情報など充実した機能を備えた大規模同窓会向けテンプレート",
  "thumbnail": "/templates/standard/thumbnail.png",
  "previewUrl": "/templates/standard/preview",
  "features": [
    "ニュースセクション",
    "イベントカレンダー",
    "会員ディレクトリ",
    "お知らせ一覧",
    "お問い合わせフォーム"
  ],
  "theme": {
    "primaryColor": "#1a365d",
    "primaryHoverColor": "#2c4a7c",
    "secondaryColor": "#718096",
    "accentColor": "#ed8936",
    "fontHeading": "Noto Sans JP",
    "fontBody": "Noto Sans JP"
  },
  "layouts": [
    {
      "id": "default",
      "name": "標準レイアウト",
      "thumbnail": "/templates/standard/layouts/default.png"
    },
    {
      "id": "sidebar",
      "name": "サイドバー付き",
      "thumbnail": "/templates/standard/layouts/sidebar.png"
    }
  ],
  "version": "1.0.0",
  "minPlatformVersion": "1.0.0"
}
```

#### 6. テンプレート選択UI（apps/platform/src/components/tenants/template-selector.tsx）

```typescript
"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Template = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  previewUrl: string;
  features: string[];
  theme: {
    primaryColor: string;
  };
};

type TemplateSelectorProps = {
  templates: Template[];
  value?: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
};

export function TemplateSelector({
  templates,
  value,
  onChange,
  disabled,
}: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        テンプレートを選択
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = value === template.id;
          const isHovered = hoveredId === template.id;
          
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={disabled}
              className={cn(
                "relative rounded-lg border-2 overflow-hidden transition-all text左",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-pressed={isSelected}
              aria-label={`${template.name}テンプレートを選択`}
            >
              {/* サムネイル */}
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={template.thumbnail}
                  alt={`${template.name}のプレビュー`}
                  fill
                  className="object-cover"
                />
                
                {/* 選択インジケーター */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* ホバーオーバーレイ */}
                {isHovered && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                    <p className="text-white text-sm text-center mb-2">
                      機能一覧
                    </p>
                    <ul className="text-white/90 text-xs space-y-1">
                      {template.features.slice(0, 4).map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                    <a
                      href={template.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1"
                    >
                      プレビュー <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
              
              {/* 情報 */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: template.theme.primaryColor }}
                    aria-hidden="true"
                  />
                  <h3 className="font-medium text-sm">{template.name}</h3>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### 技術的制約

- テンプレートはTurborepoのパッケージとして管理
- CSS変数でテーマカスタマイズを実現
- テンプレートメタデータは`template.json`で定義
- 各テンプレートは単独で開発サーバー起動可能

### 完了条件

1. `pnpm --filter @alumni-platform/template-standard dev`で各テンプレート単独起動
2. テナント作成画面でテンプレート選択UIが表示
3. 選択したテンプレートIDがDBに保存される
4. テナントサイトが選択テンプレートのデザインで表示
5. 3テンプレートすべてモバイル対応（320px〜）
6. Lighthouseスコア: Performance 90+, Accessibility 90+

---

## プロンプト4: コンテンツ管理（デジタル会報）

### タスク概要

リッチテキストエディタ（Tiptap）を使用した記事作成・編集機能を実装する。画像アップロード、HTMLサニタイズ、予約公開、RSS配信などデジタル会報に必要な機能を備える。

### 事前調査（実装前に必ず実行）

```bash
# 既存のエディタ実装を確認
rg -l "tiptap|editor|rich-text|wysiwyg" --type ts src/

# 画像アップロード関連を確認
rg -l "upload|blob|storage" --type ts src/

# 既存のPostモデルを確認
cat prisma/schema.prisma | grep -A 30 "model Post"
```

### 実装要件

#### 1. パッケージ追加

```bash
# Tiptapエディタ
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit
pnpm add @tiptap/extension-image @tiptap/extension-link
pnpm add @tiptap/extension-placeholder @tiptap/extension-character-count

# 画像アップロード
pnpm add @vercel/blob

# サニタイズ
pnpm add sanitize-html dompurify
pnpm add -D @types/sanitize-html @types/dompurify

# RSS生成
pnpm add feed@4.2.2
```

#### 2. Prismaスキーマ

```prisma
model Post {
  id          String         @id @default(cuid())
  tenantId    String
  tenant      Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // コンテンツ
  title       String         @db.VarChar(200)
  slug        String         @db.VarChar(100)
  content     String         @db.Text        // サニタイズ済みHTML
  excerpt     String?        @db.VarChar(300)
  coverImage  String?        @db.VarChar(500)
  
  // ステータス
  status      PostStatus     @default(DRAFT)
  visibility  PostVisibility @default(PUBLIC)
  publishedAt DateTime?
  scheduledAt DateTime?      // 予約公開日時
  
  // 作成者
  authorId    String
  
  // カテゴリ・タグ
  categoryId  String?
  category    Category?      @relation(fields: [categoryId], references: [id])
  tags        PostTag[]
  
  // メタデータ
  viewCount   Int            @default(0)
  
  // 監査
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, status, publishedAt])
  @@map("posts")
}

enum PostStatus {
  DRAFT       // 下書き
  SCHEDULED   // 予約公開
  PUBLISHED   // 公開中
  ARCHIVED    // アーカイブ
}

enum PostVisibility {
  PUBLIC      // 全員に公開
  MEMBERS     // 会員のみ
  PRIVATE     // 非公開（プレビュー用）
}

model Category {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   @db.VarChar(50)
  slug        String   @db.VarChar(50)
  description String?  @db.VarChar(200)
  posts       Post[]
  
  @@unique([tenantId, slug])
  @@map("categories")
}

model Tag {
  id       String    @id @default(cuid())
  tenantId String
  name     String    @db.VarChar(50)
  slug     String    @db.VarChar(50)
  posts    PostTag[]
  
  @@unique([tenantId, slug])
  @@map("tags")
}

model PostTag {
  postId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tagId  String
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
  @@map("post_tags")
}

model Media {
  id        String   @id @default(cuid())
  tenantId  String
  
  filename  String   @db.VarChar(255)
  url       String   @db.VarChar(500)
  mimeType  String   @db.VarChar(100)
  size      Int
  width     Int?
  height    Int?
  
  createdAt DateTime @default(now())
  createdBy String

  @@index([tenantId, createdAt])
  @@map("media")
}
```

#### 3. HTMLサニタイズ（src/lib/posts/sanitize.ts）

```typescript
import sanitizeHtml from "sanitize-html";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// サーバーサイド用DOMPurify
const window = new JSDOM("").window;
const purify = DOMPurify(window as unknown as Window);

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "ul", "ol", "li",
  "blockquote",
  "a",
  "img",
  "strong", "b", "em", "i", "u", "s", "strike",
  "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption",
  "div", "span",
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "width", "height", "loading"],
  "*": ["class", "id"],
};

const ALLOWED_URL_SCHEMES = ["https", "mailto"];

const ALLOWED_IMAGE_DOMAINS = [
  "blob.vercel-storage.com",
  // 追加の許可ドメイン
];

export function sanitizePostContent(html: string): string {
  // 第1段階: sanitize-html
  let clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_URL_SCHEMES,
    allowedSchemesByTag: {
      img: ["https"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        // 外部リンクにrel属性を追加
        if (attribs.href && !attribs.href.startsWith("/")) {
          return {
            tagName,
            attribs: {
              ...attribs,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          };
        }
        return { tagName, attribs };
      },
      img: (tagName, attribs) => {
        // 画像ドメインチェック
        if (attribs.src) {
          try {
            const url = new URL(attribs.src);
            if (!ALLOWED_IMAGE_DOMAINS.some((d) => url.hostname.endsWith(d))) {
              return { tagName: "", attribs: {} }; // 不許可ドメインは削除
            }
          } catch {
            return { tagName: "", attribs: {} }; // 無効なURLは削除
          }
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            loading: "lazy",
          },
        };
      },
    },
  });

  // 第2段階: DOMPurify
  clean = purify.sanitize(clean, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "class", "id", "target", "rel", "width", "height", "loading", "title"],
    ALLOWED_URI_REGEXP: /^(?:(?:https|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });

  return clean;
}

// XSSペイロードのテスト用
export function containsXSSPayload(html: string): boolean {
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
  ];
  
  return patterns.some((pattern) => pattern.test(html));
}
```

#### 4. RSSフィード生成（src/app/[domain]/feed.xml/route.ts）

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Feed } from "feed";
import { prisma } from "@/lib/db/client";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { env } from "@/env";

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const tenant = await getTenantBySubdomain(params.domain);
  
  if (!tenant) {
    return new NextResponse("Not Found", { status: 404 });
  }
  
  const baseUrl = `https://${tenant.subdomain}.${env.NEXT_PUBLIC_ROOT_DOMAIN}`;
  
  const feed = new Feed({
    title: `${tenant.name} - 会報`,
    description: `${tenant.name}の最新情報`,
    id: baseUrl,
    link: baseUrl,
    language: "ja",
    image: tenant.logoUrl || undefined,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${tenant.name}`,
    feedLinks: {
      rss2: `${baseUrl}/feed.xml`,
      atom: `${baseUrl}/atom.xml`,
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
      authorId: true,
      category: {
        select: { name: true },
      },
    },
  });
  
  for (const post of posts) {
    feed.addItem({
      title: post.title,
      id: `${baseUrl}/posts/${post.slug}`,
      link: `${baseUrl}/posts/${post.slug}`,
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
```

### 技術的制約

- すべてのコンテンツはサニタイズ後に保存
- 画像は許可ドメインのみ表示
- 会員限定記事は認証チェック必須
- ISRでキャッシュ（revalidate=60秒）

### セキュリティ要件

- XSS対策: `<script>`タグ、`javascript:`スキーム、イベントハンドラを除去
- 画像ドメイン制限: Vercel Blobのみ許可
- 他テナントの記事編集は403エラー

### 完了条件

1. 記事作成 → 下書き → プレビュー → 公開フロー動作
2. 予約公開（scheduledAt設定）→ 指定時刻に自動公開
3. 画像ドラッグ&ドロップ → 自動アップロード＆挿入
4. `/feed.xml`で有効なRSSフィード出力
5. `<script>alert(1)</script>`が無害化される
6. 他テナント記事編集で403エラー

---

## プロンプト5: 決済機能（会費・寄付）

### タスク概要

Stripe Checkout連携による会費徴収・寄付受付機能を実装する。カード情報は一切保持せず、Stripeに処理を委譲する設計とし、収支ダッシュボードでリアルタイムに入金状況を可視化する。

### 事前調査（実装前に必ず実行）

```bash
# 既存の決済関連コードがないか確認
rg -l "stripe|payment|checkout|billing" --type ts --type tsx src/

# 環境変数の既存定義を確認
cat src/env.ts | grep -i stripe

# 既存のWebhook実装を確認
find src/app/api -name "route.ts" | xargs grep -l "webhook" 2>/dev/null

# Prismaスキーマの決済関連モデルを確認
cat prisma/schema.prisma | grep -A 30 "payment\\|Payment\\|billing"
```

### 実装要件

#### 1. パッケージ追加

```bash
# Stripe SDK
pnpm add stripe@^15.0.0 @stripe/stripe-js@^3.0.0

# グラフ表示
pnpm add recharts@^2.12.0

# CSV出力
pnpm add papaparse@^5.4.1
pnpm add -D @types/papaparse
```

#### 2. 環境変数追加（src/env.ts）

```typescript
// serverセクションに追加
STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

// clientセクションに追加
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
```

#### 3. Prismaスキーマ

```prisma
model Payment {
  id                    String          @id @default(cuid())
  tenantId              String
  tenant                Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Stripe情報（参照IDのみ保存、詳細はStripe側）
  stripeSessionId       String          @unique
  stripePaymentIntentId String?         @unique
  stripeCustomerId      String?
  
  // 支払い情報
  type                  PaymentType
  amount                Int                      // 金額（円）
  currency              String          @default("jpy")
  status                PaymentStatus   @default(PENDING)
  
  // 支払者情報（Stripeから取得、匿名の場合はnull）
  payerEmail            String?         @db.VarChar(255)
  payerName             String?         @db.VarChar(100)
  isAnonymous           Boolean         @default(false)
  
  // メタデータ
  description           String?         @db.VarChar(500)
  metadata              Json            @default("{}")
  
  // 関連（イベント参加費の場合）
  eventId               String?
  event                 Event?          @relation(fields: [eventId], references: [id], onDelete: SetNull)
  
  // タイムスタンプ
  completedAt           DateTime?
  refundedAt            DateTime?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@index([tenantId, status, createdAt])
  @@index([tenantId, type, createdAt])
  @@index([stripeCustomerId])
  @@map("payments")
}

enum PaymentType {
  ANNUAL_FEE      // 年会費
  DONATION        // 寄付
  EVENT_FEE       // イベント参加費
  OTHER           // その他
}

enum PaymentStatus {
  PENDING         // セッション作成済み、未完了
  PROCESSING      // 処理中
  COMPLETED       // 支払い完了
  FAILED          // 失敗
  REFUNDED        // 返金済み
  PARTIALLY_REFUNDED  // 一部返金
  EXPIRED         // セッション期限切れ
  CANCELED        // キャンセル
}

model PaymentSettings {
  id                    String   @id @default(cuid())
  tenantId              String   @unique
  tenant                Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // 年会費設定
  annualFeeEnabled      Boolean  @default(false)
  annualFeeAmount       Int      @default(5000)
  annualFeeDescription  String?  @db.VarChar(500)
  
  // 寄付設定
  donationEnabled       Boolean  @default(false)
  donationMinAmount     Int      @default(1000)
  donationMaxAmount     Int      @default(1000000)
  donationPresets       Json     @default("[1000, 3000, 5000, 10000]")
  
  // 表示設定
  showDonorList         Boolean  @default(true)
  allowAnonymous        Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("payment_settings")
}
```

#### 4. Stripeクライアント（src/lib/stripe/client.ts）

```typescript
import Stripe from 'stripe';
import { env } from '@/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
  typescript: true,
});

export function validateAmount(
  amount: number,
  type: 'ANNUAL_FEE' | 'DONATION' | 'EVENT_FEE',
  settings?: { min?: number; max?: number }
): { valid: boolean; error?: string } {
  if (!Number.isInteger(amount) || amount < 0) {
    return { valid: false, error: '金額は0以上の整数で指定してください' };
  }
  
  const limits = {
    ANNUAL_FEE: { min: 100, max: 1000000 },
    DONATION: { min: settings?.min || 1000, max: settings?.max || 1000000 },
    EVENT_FEE: { min: 0, max: 1000000 },
  };
  
  const { min, max } = limits[type];
  
  if (amount < min) {
    return { valid: false, error: `金額は${min.toLocaleString()}円以上で指定してください` };
  }
  
  if (amount > max) {
    return { valid: false, error: `金額は${max.toLocaleString()}円以下で指定してください` };
  }
  
  return { valid: true };
}
```

#### 5. Webhookハンドラ（src/app/api/webhooks/stripe/route.ts）

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/db/client';
import { env } from '@/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: session.id },
  });
  
  if (!payment || payment.status === 'COMPLETED') return;
  
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      stripePaymentIntentId: session.payment_intent as string,
      stripeCustomerId: session.customer as string | null,
      payerEmail: session.customer_details?.email,
      payerName: payment.isAnonymous ? null : session.customer_details?.name,
      completedAt: new Date(),
    },
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  await prisma.payment.updateMany({
    where: { stripeSessionId: session.id, status: 'PENDING' },
    data: { status: 'EXPIRED' },
  });
}

async function handleRefund(charge: Stripe.Charge) {
  if (!charge.payment_intent) return;
  
  const status = charge.amount_refunded >= charge.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: charge.payment_intent as string },
    data: { status, refundedAt: new Date() },
  });
}
```

### 技術的制約

- PCI DSS準拠のため、カード情報は一切サーバーに送信しない
- Stripe Checkout Session方式（Stripe Elementsは使用しない）
- Webhookの署名検証必須
- 金額は日本円（JPY）のみ対応

### セキュリティ要件

- Webhookエンドポイントは署名検証必須
- 金額上限: 年会費100万円、寄付1000万円
- 不正な金額はサーバーサイドでバリデーション

### 完了条件

1. 年会費支払いボタン → Stripeチェックアウト → 完了画面の遷移確認
2. 任意金額の寄付（1000円〜100万円）が正常に処理される
3. Webhookで`checkout.session.completed`を受信 → DBの`status`が`COMPLETED`に更新
4. 収支ダッシュボードにグラフと一覧が表示される
5. CSVエクスポートが正常に動作

---

## プロンプト6: AIチャットボット（対話型アーカイブ）

### タスク概要

Vercel AI SDKを使用し、同窓会の会報アーカイブに対して自然言語で質問できるRAGチャットボットを実装する。過去の会報記事をベクトル化してpgvectorに保存し、質問に関連するコンテンツを検索してコンテキストとしてLLMに渡す。

### 事前調査（実装前に必ず実行）

```bash
# AI関連の既存実装を確認
rg -l "openai|anthropic|ai-sdk|embedding|vector" --type ts src/

# pgvector拡張の確認
cat prisma/schema.prisma | grep -i "vector\\|pgvector"

# 既存のPrismaスキーマでPostモデルを確認
cat prisma/schema.prisma | grep -A 20 "model Post"

# 環境変数の確認
cat src/env.ts | grep -i "openai\\|anthropic"
```

### 実装要件

#### 1. パッケージ追加

```bash
# Vercel AI SDK
pnpm add ai@^3.1.0 @ai-sdk/openai@^0.0.30

# ベクトル操作
pnpm add pgvector@^0.1.8

# テキスト分割
pnpm add langchain@^0.2.0 @langchain/textsplitters@^0.0.2
```

#### 2. 環境変数追加

```typescript
// serverセクションに追加
OPENAI_API_KEY: z.string().startsWith('sk-'),
```

#### 3. Prismaスキーマ

```prisma
model PostEmbedding {
  id        String   @id @default(cuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  tenantId  String
  
  chunkIndex Int
  content   String   @db.Text
  embedding Unsupported("vector(1536)")
  
  createdAt DateTime @default(now())

  @@unique([postId, chunkIndex])
  @@index([tenantId])
  @@map("post_embeddings")
}

model ChatSession {
  id        String        @id @default(cuid())
  tenantId  String
  tenant    Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId    String?
  
  title     String?       @db.VarChar(200)
  messages  ChatMessage[]
  
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@index([tenantId, userId, updatedAt])
  @@map("chat_sessions")
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  role      String
  content   String      @db.Text
  sources   Json        @default("[]")
  tokenCount Int?
  latencyMs Int?
  
  createdAt DateTime    @default(now())

  @@index([sessionId, createdAt])
  @@map("chat_messages")
}

model ChatbotSettings {
  id                String   @id @default(cuid())
  tenantId          String   @unique
  tenant            Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  enabled           Boolean  @default(false)
  model             String   @default("gpt-4o-mini")
  temperature       Float    @default(0.7)
  maxTokens         Int      @default(1000)
  similarityThreshold Float  @default(0.7)
  maxSources        Int      @default(5)
  systemPrompt      String?  @db.Text
  welcomeMessage    String?  @db.VarChar(500)
  maxMessagesPerSession Int  @default(50)
  blockedKeywords   Json     @default("[]")
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("chatbot_settings")
}
```

#### 4. システムプロンプト（src/lib/ai/prompts.ts）

```typescript
export function buildSystemPrompt(tenantName: string, customPrompt?: string | null): string {
  const basePrompt = `あなたは「${tenantName}」の同窓会アシスタントです。

## 役割
- 同窓会の歴史、イベント、会報記事についての質問に親切に答える
- 提供されたコンテキスト（会報記事の抜粋）に基づいて回答する
- コンテキストにない情報については正直に「その情報は見つかりませんでした」と伝える

## 回答ルール
1. 必ず日本語で回答する
2. 回答の根拠となる記事がある場合は、その記事のタイトルを明記する
3. 推測や不確かな情報には「〜と思われますが、詳細は事務局にお確認ください」と付記する
4. 簡潔で読みやすい回答を心がける
5. 敬語を使用し、親しみやすいトーンを保つ

## 絶対に守るべきこと
- 会報記事に書かれていない内容を捏造しない
- 個人の住所、電話番号、メールアドレスなどの連絡先情報は回答しない
- 特定の個人に関する否定的な情報や噂話は回答しない
- 政治的・宗教的な話題には中立的な立場を保つ
- 同窓会に無関係な質問には「申し訳ありませんが、${tenantName}に関する質問にのみお答えしています」と回答する`;

  return customPrompt ? `${basePrompt}\n\n## 追加の指示\n${customPrompt}` : basePrompt;
}
```

### 技術的制約

- Edge Runtimeでストリーミング処理
- テナントごとにベクトルストアを分離（tenantIdフィルタ必須）
- 個人情報を含む可能性のある記事は自動除外
- チャットログは30日後に自動削除

### セキュリティ要件

- プロンプトインジェクション対策: ユーザー入力は`user`ロールで分離
- 禁止ワードフィルタリング
- 個人情報の回答禁止（システムプロンプトで指示）

### 完了条件

1. `/chat`でチャットUIが表示され、質問を入力できる
2. 会報に関する質問に回答できる（ストリーミング表示）
3. 回答に引用元記事へのリンクが表示される
4. 会報にない質問には「見つかりませんでした」と回答
5. 個人情報を聞いても回答しない
6. 管理画面からインデックス再構築が可能

---

## プロンプト7: 認証・アクセス制御

### タスク概要

NextAuth.js v5（Auth.js）を使用し、ソーシャルログイン（Google/LINE）+ マジックリンク認証と、テナント×ロールベースのアクセス制御を実装する。

### 事前調査（実装前に必ず実行）

```bash
# 既存の認証実装を確認
rg -l "next-auth|auth|session|jwt" --type ts src/

# 既存のユーザーモデルを確認
cat prisma/schema.prisma | grep -A 30 "model User"

# 環境変数の確認
cat src/env.ts | grep -i "auth\\|google\\|line"
```

### 実装要件

#### 1. パッケージ追加

```bash
# Auth.js (NextAuth.js v5)
pnpm add next-auth@beta @auth/prisma-adapter

# メール送信（マジックリンク用）
pnpm add resend@^3.2.0
```

#### 2. 環境変数追加

```typescript
// serverセクションに追加
AUTH_SECRET: z.string().min(32),
GOOGLE_CLIENT_ID: z.string().min(1),
GOOGLE_CLIENT_SECRET: z.string().min(1),
LINE_CLIENT_ID: z.string().min(1),
LINE_CLIENT_SECRET: z.string().min(1),
RESEND_API_KEY: z.string().startsWith('re_'),
EMAIL_FROM: z.string().email().default('noreply@alumni-platform.com'),
```

#### 3. Prismaスキーマ

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?   @db.VarChar(100)
  email         String    @unique @db.VarChar(255)
  emailVerified DateTime?
  image         String?   @db.VarChar(500)
  
  accounts      Account[]
  sessions      Session[]
  memberships   TenantMembership[]
  platformAdmin PlatformAdmin?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model TenantMembership {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenantId  String
  tenant    Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  role      TenantRole  @default(MEMBER)
  displayName String?   @db.VarChar(100)
  graduationYear Int?
  
  joinedAt  DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@unique([userId, tenantId])
  @@index([tenantId, role])
  @@map("tenant_memberships")
}

enum TenantRole {
  ADMIN
  EDITOR
  MEMBER
}

model PlatformAdmin {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  level     Int      @default(1)
  createdAt DateTime @default(now())
  createdBy String?

  @@map("platform_admins")
}
```

#### 4. 権限マトリクス

| 操作 | guest | member | editor | admin | platform_admin |
|------|-------|--------|--------|-------|----------------|
| 公開記事閲覧 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 会員限定記事 | - | ✓ | ✓ | ✓ | ✓ |
| 記事作成 | - | - | ✓ | ✓ | ✓ |
| 記事編集（他者） | - | - | - | ✓ | ✓ |
| メンバー管理 | - | - | - | ✓ | ✓ |
| テナント作成 | - | - | - | - | ✓ |

### 技術的制約

- JWTセッション（DBセッション不使用でスケーラビリティ確保）
- テナント所属情報はJWTクレームに含める
- セッション有効期限: 7日

### 完了条件

1. Googleログイン → セッション取得 → ユーザー情報表示
2. LINEログイン → セッション取得
3. マジックリンク → メール受信 → ログイン完了
4. 権限のないページアクセス → ログインページにリダイレクト
5. 異なるテナントの管理画面アクセス → 403エラー
6. メンバー管理画面で役割変更が可能

---

## プロンプト8: QRコード・イベント管理

### タスク概要

同窓会イベントの作成・参加受付機能と、当日の受付用QRコードスキャン機能を実装する。オフライン環境でも動作するPWA対応の受付アプリを含む。

### 事前調査（実装前に必ず実行）

```bash
# 既存のイベント関連実装を確認
rg -l "event|registration|attendee|qr" --type ts src/

# カレンダー関連ライブラリの確認
cat package.json | grep -i calendar

# PWA関連の設定を確認
find public -name "manifest*" 2>/dev/null
```

### 実装要件

#### 1. パッケージ追加

```bash
# QRコード生成・読取
pnpm add qrcode@^1.5.3 @zxing/browser@^0.1.4 @zxing/library@^0.20.0
pnpm add -D @types/qrcode

# カレンダー生成
pnpm add ical-generator@^7.0.0

# PWA
pnpm add next-pwa@^5.6.0

# 日付処理
pnpm add date-fns@^3.6.0 date-fns-tz@^3.1.0
```

#### 2. Prismaスキーマ

```prisma
model Event {
  id            String          @id @default(cuid())
  tenantId      String
  tenant        Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  title         String          @db.VarChar(200)
  description   String?         @db.Text
  coverImage    String?         @db.VarChar(500)
  
  startAt       DateTime
  endAt         DateTime
  timezone      String          @default("Asia/Tokyo")
  
  location      String?         @db.VarChar(500)
  locationUrl   String?         @db.VarChar(500)
  isOnline      Boolean         @default(false)
  onlineUrl     String?         @db.VarChar(500)
  
  capacity      Int?
  fee           Int             @default(0)
  feeRequired   Boolean         @default(false)
  
  registrationStartAt DateTime?
  registrationEndAt   DateTime?
  
  status        EventStatus     @default(DRAFT)
  visibility    EventVisibility @default(PUBLIC)
  
  registrations Registration[]
  payments      Payment[]
  
  createdBy     String
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([tenantId, startAt])
  @@index([tenantId, status])
  @@map("events")
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELLED
  COMPLETED
}

enum EventVisibility {
  PUBLIC
  MEMBERS
  PRIVATE
}

model Registration {
  id            String              @id @default(cuid())
  eventId       String
  event         Event               @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  userId        String?
  name          String              @db.VarChar(100)
  email         String              @db.VarChar(255)
  phone         String?             @db.VarChar(20)
  
  qrToken       String              @unique @default(cuid())
  status        RegistrationStatus  @default(PENDING)
  paymentId     String?
  
  checkedInAt   DateTime?
  checkedInBy   String?
  
  notes         String?             @db.Text
  guestCount    Int                 @default(0)
  
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([eventId, status])
  @@index([qrToken])
  @@map("registrations")
}

enum RegistrationStatus {
  PENDING
  CONFIRMED
  CANCELLED
  CHECKED_IN
  NO_SHOW
}

model CheckinLog {
  id            String   @id @default(cuid())
  registrationId String
  qrToken       String
  checkedInAt   DateTime
  checkedInBy   String
  deviceId      String?
  synced        Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([synced])
  @@map("checkin_logs")
}
```

#### 3. PWAマニフェスト（public/manifest.json）

```json
{
  "name": "同窓会受付アプリ",
  "short_name": "受付",
  "description": "同窓会イベントの受付用アプリ",
  "start_url": "/checkin",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a365d",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 技術的制約

- QRコードは誤り訂正レベルH（30%復元可能）で生成
- オフライン時のデータはIndexedDBに保存
- Service Workerでキャッシュ戦略を実装

### セキュリティ要件

- QRトークンは予測不能（cuid使用）
- 同一トークンでの重複チェックイン防止
- 受付アプリはEDITOR以上の権限が必要

### パフォーマンス目標

- QRスキャン → 受付完了: 2秒以内
- オフラインキュー同期: オンライン復帰後5秒以内

### 完了条件

1. イベント作成 → 公開 → 参加申込フローが動作
2. 申込完了メールにQRコード付きチケットが添付される
3. `/checkin`でカメラが起動し、QRスキャンが可能
4. スキャン → 「受付完了」表示 → DBの`checkedInAt`が更新
5. 同じQRの再スキャン → 「すでに受付済み」表示
6. オフライン状態でスキャン → ローカル保存 → オンライン復帰後に同期
7. イベント詳細ページに「カレンダーに追加」ボタンが表示
8. PWAとしてホーム画面に追加可能

---

## 実装順序と依存関係

### 推奨実装順序

```mermaid
graph TD
    A[プロンプト1: 基盤] --> B[プロンプト2: テナント管理]
    B --> C[プロンプト7: 認証]
    C --> D[プロンプト4: CMS]
    B --> E[プロンプト3: テンプレート]
    C --> F[プロンプト5: 決済]
    D --> G[プロンプト6: AIチャット]
    C --> H[プロンプト8: イベント・QR]
    F --> H
```

### 依存関係

| プロンプト | 依存先 | 必須/推奨 |
|-----------|--------|----------|
| 1. 基盤 | なし | - |
| 2. テナント管理 | 1 | 必須 |
| 3. テンプレート | 1, 2 | 必須 |
| 4. CMS | 1, 2, 7 | 必須 |
| 5. 決済 | 1, 2, 7 | 必須 |
| 6. AIチャット | 1, 2, 4, 7 | 必須 |
| 7. 認証 | 1, 2 | 必須 |
| 8. イベント・QR | 1, 2, 5, 7 | 必須 |

---

## 進捗管理

### ステータス定義
- `Not started`: 着手前
- `In progress`: 実装/レビュー中
- `Blocked`: 依存タスク・環境・権限待ち
- `Done`: マージ/デプロイ完了、検証済み

### 進行トラッキング
- WBS: プロンプト1〜8を親タスク、主要サブタスク（DB/UI/Server Actions/テスト/デプロイ）を子として分解
- カンバン: `Backlog -> In progress -> Review -> Ready for QA -> Done` の5列を基本。Blockedは明示的にフラグを付ける
- スプリント: 1週間サイクルを推奨。週頭に計画、週末にバーンダウンを確認
- メトリクス: バーンダウン（理想線/実績線）、リードタイム、バグ件数（重大度別）

### マイルストーン例
1. M1: プロンプト1（基盤）完了 + pnpm build/lint成功
2. M2: プロンプト2 + 7（テナント管理・認証）で管理者フロー成立
3. M3: プロンプト3 + 4（テンプレート/CMS）でサイト表示と会報配信が可能
4. M4: プロンプト5（決済）で年会費/寄付のStripeフロー完了
5. M5: プロンプト6（AIチャット）でRAG応答と引用表示
6. M6: プロンプト8（イベント・QR）で受付PWAとQRチェックイン

### 運用リズム（サンプル）
- 月/水/金スタンドアップ（15分）: Blocker共有と優先度調整
- 週次レビュー: デモ + バーンダウン確認 + リスク棚卸し
- QAゲート: M3/M5/M6達成時に回帰テストチェックリスト実施

### リスクとエスカレーション
- 依存待ち >24h は即日エスカレーション
- 外部APIレートリミット/認証失敗はリトライ戦略と代替手順をIssueに記録
- 環境差異（local/stg/prod）は.envテンプレートとデプロイ手順を必ず同期

---

## 環境変数一覧

```env
# ===================
# データベース
# ===================
DATABASE_URL=postgresql://user:password@host:5432/alumni_platform
DIRECT_URL=postgresql://user:password@host:5432/alumni_platform

# ===================
# Vercel
# ===================
VERCEL_API_TOKEN=your_vercel_api_token
VERCEL_TEAM_ID=your_team_id

# ===================
# 認証
# ===================
AUTH_SECRET=your_auth_secret_min_32_chars

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# LINE Login
LINE_CLIENT_ID=your_line_client_id
LINE_CLIENT_SECRET=your_line_client_secret

# ===================
# Stripe
# ===================
STRIPE_SECRET_KEY=sk_live_or_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_xxx

# ===================
# OpenAI
# ===================
OPENAI_API_KEY=sk-xxx

# ===================
# メール（Resend）
# ===================
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@alumni-platform.com

# ===================
# アプリケーション
# ===================
NEXT_PUBLIC_APP_URL=https://alumni-platform.com
NEXT_PUBLIC_ROOT_DOMAIN=alumni-platform.com
NODE_ENV=production
```

---

## 完了後チェックリスト

すべてのプロンプトを実行した後、以下を確認してください：

```bash
# 1. 全体ビルド確認
pnpm build

# 2. 型チェック
pnpm typecheck

# 3. リント
pnpm lint

# 4. テスト実行
pnpm test

# 5. Prismaスキーマ検証
npx prisma validate

# 6. E2Eテスト
pnpm test:e2e

# 7. Lighthouse監査
npx lighthouse http://localhost:3000 --view
```

### 機能チェックリスト

- [ ] ランディングページが表示される
- [ ] 管理画面（admin.xxx）にアクセスできる
- [ ] テナント作成 → サブドメインでアクセス可能
- [ ] ソーシャルログイン（Google/LINE）が動作
- [ ] 記事の作成・編集・公開ができる
- [ ] 決済フロー（年会費/寄付）が完了する
- [ ] AIチャットボットが質問に回答する
- [ ] イベント作成・参加申込ができる
- [ ] QRスキャンで受付が完了する
- [ ] オフライン受付が動作する

---

## ライセンス

このドキュメントはAlumni Platform プロジェクトの一部として作成されました。

---

*最終更新: 2025年12月*


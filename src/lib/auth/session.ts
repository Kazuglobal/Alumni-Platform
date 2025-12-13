/**
 * セッション管理ユーティリティ
 * サーバーサイドでの認証チェックヘルパー
 */

import { auth } from "@/auth";
import { TenantRole, hasRoleOrHigher, isPlatformAdmin } from "./permissions";

export type AuthUser = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  memberships?: { tenantId: string; role: TenantRole }[];
  platformAdmin?: { id: string; level: number } | null;
};

export type AuthSession = {
  user: AuthUser;
};

/**
 * 現在のユーザーを取得（未認証の場合はnull）
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user as AuthUser;
}

/**
 * 認証を要求（未認証の場合はエラー）
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("認証が必要です");
  }

  return session as AuthSession;
}

/**
 * テナントメンバーシップを要求
 */
export async function requireTenantMembership(
  tenantId: string
): Promise<{ session: AuthSession; membership: { tenantId: string; role: TenantRole } }> {
  const session = await requireAuth();

  const membership = session.user.memberships?.find(
    (m) => m.tenantId === tenantId
  );

  if (!membership) {
    throw new Error("このテナントへのアクセス権がありません");
  }

  return { session, membership };
}

/**
 * 特定のテナントロールを要求
 */
export async function requireTenantRole(
  tenantId: string,
  requiredRole: TenantRole
): Promise<{ session: AuthSession; membership: { tenantId: string; role: TenantRole } }> {
  const { session, membership } = await requireTenantMembership(tenantId);

  if (!hasRoleOrHigher(membership.role, requiredRole)) {
    throw new Error("この操作を行う権限がありません");
  }

  return { session, membership };
}

/**
 * プラットフォーム管理者を要求
 */
export async function requirePlatformAdmin(): Promise<AuthSession> {
  const session = await requireAuth();

  if (!isPlatformAdmin(session.user)) {
    throw new Error("プラットフォーム管理者権限が必要です");
  }

  return session;
}

/**
 * テナント管理者を要求（プラットフォーム管理者もOK）
 */
export async function requireTenantAdmin(
  tenantId: string
): Promise<{ session: AuthSession; membership?: { tenantId: string; role: TenantRole } }> {
  const session = await requireAuth();

  // プラットフォーム管理者は全テナントにアクセス可能
  if (isPlatformAdmin(session.user)) {
    return { session };
  }

  // テナント管理者かチェック
  const { membership } = await requireTenantRole(tenantId, TenantRole.ADMIN);
  return { session, membership };
}

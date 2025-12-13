/**
 * 権限管理システム
 * テナントロールベースのアクセス制御（RBAC）
 */

// PrismaのTenantRoleと同期
export enum TenantRole {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  MEMBER = "MEMBER",
}

// 権限の定義
export enum Permission {
  // 記事関連
  VIEW_PUBLIC_ARTICLE = "VIEW_PUBLIC_ARTICLE",
  VIEW_MEMBER_ARTICLE = "VIEW_MEMBER_ARTICLE",
  CREATE_ARTICLE = "CREATE_ARTICLE",
  EDIT_OWN_ARTICLE = "EDIT_OWN_ARTICLE",
  EDIT_OTHER_ARTICLE = "EDIT_OTHER_ARTICLE",
  DELETE_ARTICLE = "DELETE_ARTICLE",

  // メンバー管理
  MANAGE_MEMBERS = "MANAGE_MEMBERS",
  INVITE_MEMBERS = "INVITE_MEMBERS",

  // テナント管理
  MANAGE_TENANT_SETTINGS = "MANAGE_TENANT_SETTINGS",

  // プラットフォーム管理
  CREATE_TENANT = "CREATE_TENANT",
  MANAGE_ALL_TENANTS = "MANAGE_ALL_TENANTS",
}

// ロールごとの権限マッピング
const ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  [TenantRole.MEMBER]: [
    Permission.VIEW_PUBLIC_ARTICLE,
    Permission.VIEW_MEMBER_ARTICLE,
  ],
  [TenantRole.EDITOR]: [
    Permission.VIEW_PUBLIC_ARTICLE,
    Permission.VIEW_MEMBER_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.EDIT_OWN_ARTICLE,
  ],
  [TenantRole.ADMIN]: [
    Permission.VIEW_PUBLIC_ARTICLE,
    Permission.VIEW_MEMBER_ARTICLE,
    Permission.CREATE_ARTICLE,
    Permission.EDIT_OWN_ARTICLE,
    Permission.EDIT_OTHER_ARTICLE,
    Permission.DELETE_ARTICLE,
    Permission.MANAGE_MEMBERS,
    Permission.INVITE_MEMBERS,
    Permission.MANAGE_TENANT_SETTINGS,
  ],
};

// ゲスト（未認証）の権限
const GUEST_PERMISSIONS: Permission[] = [Permission.VIEW_PUBLIC_ARTICLE];

// ロールの階層（数値が大きいほど権限が高い）
const ROLE_HIERARCHY: Record<TenantRole, number> = {
  [TenantRole.MEMBER]: 1,
  [TenantRole.EDITOR]: 2,
  [TenantRole.ADMIN]: 3,
};

/**
 * 指定されたロールが特定の権限を持つかチェック
 */
export function hasPermission(
  role: TenantRole | null,
  permission: Permission
): boolean {
  if (role === null) {
    return GUEST_PERMISSIONS.includes(permission);
  }

  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * ユーザーが特定のテナントにアクセスできるかチェック
 */
export function canAccessTenant(
  userId: string,
  tenantId: string,
  memberships: { tenantId: string; role: TenantRole }[]
): boolean {
  return memberships.some((m) => m.tenantId === tenantId);
}

/**
 * ユーザーのテナント内でのロールを取得
 */
export function getTenantRole(
  tenantId: string,
  memberships: { tenantId: string; role: TenantRole }[]
): TenantRole | null {
  const membership = memberships.find((m) => m.tenantId === tenantId);
  return membership?.role ?? null;
}

/**
 * ロールが要求されたロール以上かチェック
 */
export function hasRoleOrHigher(
  userRole: TenantRole,
  requiredRole: TenantRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * メンバー管理権限をチェック
 */
export function canManageMembers(role: TenantRole): boolean {
  return hasPermission(role, Permission.MANAGE_MEMBERS);
}

/**
 * 記事作成権限をチェック
 */
export function canCreateArticle(role: TenantRole): boolean {
  return hasPermission(role, Permission.CREATE_ARTICLE);
}

/**
 * 記事編集権限をチェック（他者の記事を含む）
 */
export function canEditArticle(
  role: TenantRole,
  currentUserId: string,
  articleAuthorId: string
): boolean {
  // 自分の記事
  if (currentUserId === articleAuthorId) {
    return hasPermission(role, Permission.EDIT_OWN_ARTICLE);
  }

  // 他者の記事
  return hasPermission(role, Permission.EDIT_OTHER_ARTICLE);
}

/**
 * プラットフォーム管理者かチェック
 */
export function isPlatformAdmin(
  user: { platformAdmin?: { id: string; level: number } | null } | undefined | null
): boolean {
  return user?.platformAdmin != null;
}

/**
 * テナント作成権限をチェック（プラットフォーム管理者のみ）
 */
export function canCreateTenant(
  user: { platformAdmin?: { id: string; level: number } | null } | undefined | null
): boolean {
  return isPlatformAdmin(user);
}

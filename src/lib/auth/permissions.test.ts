import { describe, it, expect } from "vitest";
import {
  TenantRole,
  hasPermission,
  canAccessTenant,
  canManageMembers,
  canCreateArticle,
  canEditArticle,
  isPlatformAdmin,
  Permission,
} from "./permissions";

describe("hasPermission", () => {
  describe("guest (no role)", () => {
    it("should allow viewing public articles", () => {
      expect(hasPermission(null, Permission.VIEW_PUBLIC_ARTICLE)).toBe(true);
    });

    it("should deny viewing member-only articles", () => {
      expect(hasPermission(null, Permission.VIEW_MEMBER_ARTICLE)).toBe(false);
    });

    it("should deny creating articles", () => {
      expect(hasPermission(null, Permission.CREATE_ARTICLE)).toBe(false);
    });
  });

  describe("MEMBER role", () => {
    it("should allow viewing public articles", () => {
      expect(hasPermission(TenantRole.MEMBER, Permission.VIEW_PUBLIC_ARTICLE)).toBe(true);
    });

    it("should allow viewing member-only articles", () => {
      expect(hasPermission(TenantRole.MEMBER, Permission.VIEW_MEMBER_ARTICLE)).toBe(true);
    });

    it("should deny creating articles", () => {
      expect(hasPermission(TenantRole.MEMBER, Permission.CREATE_ARTICLE)).toBe(false);
    });

    it("should deny managing members", () => {
      expect(hasPermission(TenantRole.MEMBER, Permission.MANAGE_MEMBERS)).toBe(false);
    });
  });

  describe("EDITOR role", () => {
    it("should allow creating articles", () => {
      expect(hasPermission(TenantRole.EDITOR, Permission.CREATE_ARTICLE)).toBe(true);
    });

    it("should deny editing others' articles", () => {
      expect(hasPermission(TenantRole.EDITOR, Permission.EDIT_OTHER_ARTICLE)).toBe(false);
    });

    it("should deny managing members", () => {
      expect(hasPermission(TenantRole.EDITOR, Permission.MANAGE_MEMBERS)).toBe(false);
    });
  });

  describe("ADMIN role", () => {
    it("should allow all tenant permissions", () => {
      expect(hasPermission(TenantRole.ADMIN, Permission.VIEW_PUBLIC_ARTICLE)).toBe(true);
      expect(hasPermission(TenantRole.ADMIN, Permission.VIEW_MEMBER_ARTICLE)).toBe(true);
      expect(hasPermission(TenantRole.ADMIN, Permission.CREATE_ARTICLE)).toBe(true);
      expect(hasPermission(TenantRole.ADMIN, Permission.EDIT_OTHER_ARTICLE)).toBe(true);
      expect(hasPermission(TenantRole.ADMIN, Permission.MANAGE_MEMBERS)).toBe(true);
    });

    it("should deny creating tenants", () => {
      expect(hasPermission(TenantRole.ADMIN, Permission.CREATE_TENANT)).toBe(false);
    });
  });
});

describe("canAccessTenant", () => {
  const userId = "user-123";
  const tenantId = "tenant-abc";

  it("should return false if user has no memberships", () => {
    const memberships: { tenantId: string; role: TenantRole }[] = [];
    expect(canAccessTenant(userId, tenantId, memberships)).toBe(false);
  });

  it("should return true if user is member of the tenant", () => {
    const memberships = [{ tenantId: "tenant-abc", role: TenantRole.MEMBER }];
    expect(canAccessTenant(userId, tenantId, memberships)).toBe(true);
  });

  it("should return false if user is member of different tenant", () => {
    const memberships = [{ tenantId: "tenant-other", role: TenantRole.ADMIN }];
    expect(canAccessTenant(userId, tenantId, memberships)).toBe(false);
  });
});

describe("canManageMembers", () => {
  it("should return true for ADMIN role", () => {
    expect(canManageMembers(TenantRole.ADMIN)).toBe(true);
  });

  it("should return false for EDITOR role", () => {
    expect(canManageMembers(TenantRole.EDITOR)).toBe(false);
  });

  it("should return false for MEMBER role", () => {
    expect(canManageMembers(TenantRole.MEMBER)).toBe(false);
  });
});

describe("canCreateArticle", () => {
  it("should return true for EDITOR role", () => {
    expect(canCreateArticle(TenantRole.EDITOR)).toBe(true);
  });

  it("should return true for ADMIN role", () => {
    expect(canCreateArticle(TenantRole.ADMIN)).toBe(true);
  });

  it("should return false for MEMBER role", () => {
    expect(canCreateArticle(TenantRole.MEMBER)).toBe(false);
  });
});

describe("canEditArticle", () => {
  const currentUserId = "user-123";
  const articleAuthorId = "user-456";

  it("should allow editing own article for EDITOR", () => {
    expect(canEditArticle(TenantRole.EDITOR, currentUserId, currentUserId)).toBe(true);
  });

  it("should deny editing others' article for EDITOR", () => {
    expect(canEditArticle(TenantRole.EDITOR, currentUserId, articleAuthorId)).toBe(false);
  });

  it("should allow editing others' article for ADMIN", () => {
    expect(canEditArticle(TenantRole.ADMIN, currentUserId, articleAuthorId)).toBe(true);
  });

  it("should deny editing for MEMBER", () => {
    expect(canEditArticle(TenantRole.MEMBER, currentUserId, currentUserId)).toBe(false);
  });
});

describe("isPlatformAdmin", () => {
  it("should return true if user has platformAdmin property", () => {
    const user = {
      id: "user-123",
      platformAdmin: { id: "pa-1", level: 1 },
    };
    expect(isPlatformAdmin(user)).toBe(true);
  });

  it("should return false if user has no platformAdmin property", () => {
    const user = {
      id: "user-123",
      platformAdmin: null,
    };
    expect(isPlatformAdmin(user)).toBe(false);
  });

  it("should return false for undefined user", () => {
    expect(isPlatformAdmin(undefined)).toBe(false);
  });
});

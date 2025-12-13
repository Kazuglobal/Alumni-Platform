import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrentUser,
  requireAuth,
  requireTenantMembership,
  requireTenantRole,
  requirePlatformAdmin,
} from "./session";
import { TenantRole } from "./permissions";

// Mock auth function
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValue(null);

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it("should return user when authenticated", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    const user = await getCurrentUser();
    expect(user).toEqual(mockSession.user);
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when not authenticated", async () => {
    const { auth } = await import("@/auth");
    vi.mocked(auth).mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("認証が必要です");
  });

  it("should return session when authenticated", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    const session = await requireAuth();
    expect(session).toEqual(mockSession);
  });
});

describe("requireTenantMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when user has no membership in tenant", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        memberships: [{ tenantId: "other-tenant", role: TenantRole.MEMBER }],
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    await expect(requireTenantMembership("target-tenant")).rejects.toThrow(
      "このテナントへのアクセス権がありません"
    );
  });

  it("should return membership when user is member of tenant", async () => {
    const { auth } = await import("@/auth");
    const membership = { tenantId: "target-tenant", role: TenantRole.MEMBER };
    const mockSession = {
      user: {
        id: "user-123",
        memberships: [membership],
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    const result = await requireTenantMembership("target-tenant");
    expect(result.membership).toEqual(membership);
  });
});

describe("requireTenantRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when user role is insufficient", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        memberships: [{ tenantId: "tenant-1", role: TenantRole.MEMBER }],
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    await expect(
      requireTenantRole("tenant-1", TenantRole.ADMIN)
    ).rejects.toThrow("この操作を行う権限がありません");
  });

  it("should pass when user has required role", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        memberships: [{ tenantId: "tenant-1", role: TenantRole.ADMIN }],
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    await expect(
      requireTenantRole("tenant-1", TenantRole.ADMIN)
    ).resolves.not.toThrow();
  });

  it("should pass when user has higher role than required", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        memberships: [{ tenantId: "tenant-1", role: TenantRole.ADMIN }],
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    // ADMIN should be able to do EDITOR tasks
    await expect(
      requireTenantRole("tenant-1", TenantRole.EDITOR)
    ).resolves.not.toThrow();
  });
});

describe("requirePlatformAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when user is not platform admin", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        platformAdmin: null,
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    await expect(requirePlatformAdmin()).rejects.toThrow(
      "プラットフォーム管理者権限が必要です"
    );
  });

  it("should return session when user is platform admin", async () => {
    const { auth } = await import("@/auth");
    const mockSession = {
      user: {
        id: "user-123",
        platformAdmin: { id: "pa-1", level: 1 },
      },
    };
    vi.mocked(auth).mockResolvedValue(mockSession);

    const session = await requirePlatformAdmin();
    expect(session.user.platformAdmin).toBeDefined();
  });
});

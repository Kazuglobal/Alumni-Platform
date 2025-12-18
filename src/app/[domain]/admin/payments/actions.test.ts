import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getPayments,
  getPaymentById,
  updatePaymentSettingsAction,
  getPaymentSettingsAction,
  exportPaymentsCsv,
  getPaymentStats,
} from "./actions";

// Mock Prisma
vi.mock("@/lib/db/client", () => ({
  prisma: {
    payment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    paymentSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth/session", () => ({
  requireTenantRole: vi.fn(),
}));

// Mock revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("getPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated payments for tenant", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const mockPayments = [
      {
        id: "payment_1",
        tenantId: "tenant_123",
        type: "ANNUAL_FEE",
        amount: 5000,
        status: "COMPLETED",
        payerName: "山田太郎",
        createdAt: new Date("2024-01-15"),
      },
      {
        id: "payment_2",
        tenantId: "tenant_123",
        type: "DONATION",
        amount: 10000,
        status: "COMPLETED",
        payerName: "田中花子",
        createdAt: new Date("2024-01-10"),
      },
    ];

    vi.mocked(prisma.payment.findMany).mockResolvedValue(mockPayments as never);
    vi.mocked(prisma.payment.count).mockResolvedValue(2);

    const result = await getPayments("tenant_123", {
      page: 1,
      limit: 10,
    });

    expect(result.success).toBe(true);
    expect(result.data?.payments).toHaveLength(2);
    expect(result.data?.total).toBe(2);
    expect(result.data?.page).toBe(1);
  });

  it("filters payments by status", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.payment.count).mockResolvedValue(0);

    await getPayments("tenant_123", {
      page: 1,
      limit: 10,
      status: "COMPLETED",
    });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "COMPLETED",
        }),
      })
    );
  });

  it("filters payments by type", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.payment.count).mockResolvedValue(0);

    await getPayments("tenant_123", {
      page: 1,
      limit: 10,
      type: "DONATION",
    });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: "DONATION",
        }),
      })
    );
  });

  it("filters payments by date range", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.payment.count).mockResolvedValue(0);

    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-12-31");

    await getPayments("tenant_123", {
      page: 1,
      limit: 10,
      startDate,
      endDate,
    });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
      })
    );
  });

  it("requires ADMIN or EDITOR role", async () => {
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockRejectedValue(new Error("Unauthorized"));

    const result = await getPayments("tenant_123", { page: 1, limit: 10 });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unauthorized/i);
  });
});

describe("getPaymentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns payment details", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const mockPayment = {
      id: "payment_123",
      tenantId: "tenant_123",
      type: "ANNUAL_FEE",
      amount: 5000,
      status: "COMPLETED",
      payerName: "山田太郎",
      payerEmail: "yamada@example.com",
      stripeSessionId: "cs_test_123",
      createdAt: new Date(),
      completedAt: new Date(),
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue(mockPayment as never);

    const result = await getPaymentById("tenant_123", "payment_123");

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("payment_123");
  });

  it("returns error for non-existent payment", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);

    const result = await getPaymentById("tenant_123", "nonexistent");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it("prevents access to other tenant's payments", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    // Payment belongs to different tenant
    const mockPayment = {
      id: "payment_123",
      tenantId: "other_tenant",
    };

    vi.mocked(prisma.payment.findUnique).mockResolvedValue(mockPayment as never);

    const result = await getPaymentById("tenant_123", "payment_123");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });
});

describe("updatePaymentSettingsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates payment settings", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const updatedSettings = {
      id: "settings_123",
      tenantId: "tenant_123",
      annualFeeEnabled: true,
      annualFeeAmount: 8000,
      donationEnabled: true,
    };

    vi.mocked(prisma.paymentSettings.upsert).mockResolvedValue(
      updatedSettings as never
    );

    const result = await updatePaymentSettingsAction("tenant_123", {
      annualFeeEnabled: true,
      annualFeeAmount: 8000,
      donationEnabled: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.annualFeeEnabled).toBe(true);
  });

  it("validates annual fee amount", async () => {
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const result = await updatePaymentSettingsAction("tenant_123", {
      annualFeeAmount: -1000, // Invalid
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/amount/i);
  });

  it("validates donation amount range", async () => {
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const result = await updatePaymentSettingsAction("tenant_123", {
      donationMinAmount: 50000,
      donationMaxAmount: 10000, // Min > Max
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/range|amount/i);
  });

  it("requires ADMIN role", async () => {
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockRejectedValue(new Error("Admin required"));

    const result = await updatePaymentSettingsAction("tenant_123", {
      annualFeeEnabled: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("getPaymentSettingsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns payment settings", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const mockSettings = {
      id: "settings_123",
      tenantId: "tenant_123",
      annualFeeEnabled: true,
      annualFeeAmount: 5000,
      donationEnabled: false,
    };

    vi.mocked(prisma.paymentSettings.findUnique).mockResolvedValue(
      mockSettings as never
    );

    const result = await getPaymentSettingsAction("tenant_123");

    expect(result.success).toBe(true);
    expect(result.data?.annualFeeEnabled).toBe(true);
  });

  it("returns defaults when settings not found", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.paymentSettings.findUnique).mockResolvedValue(null);

    const result = await getPaymentSettingsAction("tenant_123");

    expect(result.success).toBe(true);
    expect(result.data?.annualFeeEnabled).toBe(false);
    expect(result.data?.annualFeeAmount).toBe(5000);
  });
});

describe("exportPaymentsCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports payments as CSV string", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const mockPayments = [
      {
        id: "payment_1",
        type: "ANNUAL_FEE",
        amount: 5000,
        status: "COMPLETED",
        payerName: "山田太郎",
        payerEmail: "yamada@example.com",
        createdAt: new Date("2024-01-15"),
        completedAt: new Date("2024-01-15"),
      },
    ];

    vi.mocked(prisma.payment.findMany).mockResolvedValue(mockPayments as never);

    const result = await exportPaymentsCsv("tenant_123", {});

    expect(result.success).toBe(true);
    expect(result.data).toContain("山田太郎");
    expect(result.data).toContain("5000");
  });

  it("applies date filters to export", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);

    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-03-31");

    await exportPaymentsCsv("tenant_123", { startDate, endDate });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
      })
    );
  });

  it("masks anonymous donor information", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    const mockPayments = [
      {
        id: "payment_1",
        type: "DONATION",
        amount: 10000,
        status: "COMPLETED",
        payerName: "Anonymous",
        payerEmail: "anon@example.com",
        isAnonymous: true,
        createdAt: new Date(),
      },
    ];

    vi.mocked(prisma.payment.findMany).mockResolvedValue(mockPayments as never);

    const result = await exportPaymentsCsv("tenant_123", {});

    expect(result.success).toBe(true);
    // Should not contain actual name/email for anonymous donations
    expect(result.data).not.toContain("anon@example.com");
  });
});

describe("getPaymentStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns payment statistics", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.payment.aggregate).mockResolvedValue({
      _sum: { amount: 150000 },
      _count: { id: 25 },
    } as never);

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([
      { type: "ANNUAL_FEE", _sum: { amount: 100000 }, _count: { id: 20 } },
      { type: "DONATION", _sum: { amount: 50000 }, _count: { id: 5 } },
    ] as never);

    const result = await getPaymentStats("tenant_123", {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    expect(result.success).toBe(true);
    expect(result.data?.totalAmount).toBe(150000);
    expect(result.data?.totalCount).toBe(25);
    expect(result.data?.byType).toHaveLength(2);
  });

  it("returns monthly breakdown", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    vi.mocked(prisma.payment.aggregate).mockResolvedValue({
      _sum: { amount: 100000 },
      _count: { id: 10 },
    } as never);

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([]);

    const result = await getPaymentStats("tenant_123", {
      groupBy: "month",
    });

    expect(result.success).toBe(true);
    expect(result.data?.byMonth).toBeDefined();
  });

  it("calculates comparison with previous period", async () => {
    const { prisma } = await import("@/lib/db/client");
    const { requireTenantRole } = await import("@/lib/auth/session");

    vi.mocked(requireTenantRole).mockResolvedValue({
      id: "user_123",
      role: "ADMIN",
    } as never);

    // Current period
    vi.mocked(prisma.payment.aggregate)
      .mockResolvedValueOnce({
        _sum: { amount: 100000 },
        _count: { id: 20 },
      } as never)
      // Previous period
      .mockResolvedValueOnce({
        _sum: { amount: 80000 },
        _count: { id: 16 },
      } as never);

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([]);

    const result = await getPaymentStats("tenant_123", {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
      comparePrevious: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.comparison).toBeDefined();
    expect(result.data?.comparison?.amountChange).toBe(25); // 25% increase
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calculatePaymentStats,
  calculateMonthlyBreakdown,
  calculateTypeBreakdown,
  calculateDonorStats,
  formatCurrency,
  getDateRangeForPeriod,
} from "./stats";
import type { Payment, PaymentType, PaymentStatus } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/db/client", () => ({
  prisma: {
    payment: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Helper to create mock payments
function createMockPayment(
  overrides: Partial<Payment> = {}
): Payment {
  return {
    id: `payment_${Math.random().toString(36).slice(2)}`,
    tenantId: "tenant_123",
    stripeSessionId: `cs_${Math.random().toString(36).slice(2)}`,
    stripePaymentIntentId: null,
    stripeCustomerId: null,
    type: "ANNUAL_FEE" as PaymentType,
    amount: 5000,
    currency: "jpy",
    status: "COMPLETED" as PaymentStatus,
    payerEmail: "test@example.com",
    payerName: "Test User",
    isAnonymous: false,
    description: null,
    metadata: {},
    eventId: null,
    completedAt: new Date(),
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("calculatePaymentStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates total amount and count", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.aggregate).mockResolvedValue({
      _sum: { amount: 250000 },
      _count: { id: 50 },
    } as never);

    const stats = await calculatePaymentStats("tenant_123", {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    });

    expect(stats.totalAmount).toBe(250000);
    expect(stats.totalCount).toBe(50);
  });

  it("calculates average payment amount", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.aggregate).mockResolvedValue({
      _sum: { amount: 100000 },
      _count: { id: 20 },
      _avg: { amount: 5000 },
    } as never);

    const stats = await calculatePaymentStats("tenant_123", {});

    expect(stats.averageAmount).toBe(5000);
  });

  it("handles empty results", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.aggregate).mockResolvedValue({
      _sum: { amount: null },
      _count: { id: 0 },
    } as never);

    const stats = await calculatePaymentStats("tenant_123", {});

    expect(stats.totalAmount).toBe(0);
    expect(stats.totalCount).toBe(0);
  });

  it("filters by status", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.aggregate).mockResolvedValue({
      _sum: { amount: 50000 },
      _count: { id: 10 },
    } as never);

    await calculatePaymentStats("tenant_123", {
      status: "COMPLETED",
    });

    expect(prisma.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "COMPLETED",
        }),
      })
    );
  });
});

describe("calculateMonthlyBreakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns monthly totals", async () => {
    const { prisma } = await import("@/lib/db/client");

    const mockPayments = [
      createMockPayment({
        amount: 5000,
        completedAt: new Date("2024-01-15"),
      }),
      createMockPayment({
        amount: 10000,
        completedAt: new Date("2024-01-20"),
      }),
      createMockPayment({
        amount: 7000,
        completedAt: new Date("2024-02-10"),
      }),
    ];

    vi.mocked(prisma.payment.findMany).mockResolvedValue(mockPayments as never);

    const breakdown = await calculateMonthlyBreakdown("tenant_123", 2024);

    expect(breakdown).toHaveLength(12);
    expect(breakdown[0]).toEqual({
      month: "2024-01",
      label: "1月",
      amount: 15000,
      count: 2,
    });
    expect(breakdown[1]).toEqual({
      month: "2024-02",
      label: "2月",
      amount: 7000,
      count: 1,
    });
  });

  it("handles months with no payments", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);

    const breakdown = await calculateMonthlyBreakdown("tenant_123", 2024);

    expect(breakdown).toHaveLength(12);
    breakdown.forEach((month) => {
      expect(month.amount).toBe(0);
      expect(month.count).toBe(0);
    });
  });

  it("only includes completed payments", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);

    await calculateMonthlyBreakdown("tenant_123", 2024);

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "COMPLETED",
        }),
      })
    );
  });
});

describe("calculateTypeBreakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns breakdown by payment type", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([
      { type: "ANNUAL_FEE", _sum: { amount: 100000 }, _count: { id: 20 } },
      { type: "DONATION", _sum: { amount: 50000 }, _count: { id: 10 } },
      { type: "EVENT_FEE", _sum: { amount: 30000 }, _count: { id: 10 } },
    ] as never);

    const breakdown = await calculateTypeBreakdown("tenant_123", {});

    expect(breakdown).toHaveLength(3);
    expect(breakdown).toContainEqual({
      type: "ANNUAL_FEE",
      label: "年会費",
      amount: 100000,
      count: 20,
      percentage: expect.any(Number),
    });
  });

  it("calculates correct percentages", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([
      { type: "ANNUAL_FEE", _sum: { amount: 75000 }, _count: { id: 15 } },
      { type: "DONATION", _sum: { amount: 25000 }, _count: { id: 5 } },
    ] as never);

    const breakdown = await calculateTypeBreakdown("tenant_123", {});

    const annualFee = breakdown.find((b) => b.type === "ANNUAL_FEE");
    const donation = breakdown.find((b) => b.type === "DONATION");

    expect(annualFee?.percentage).toBe(75);
    expect(donation?.percentage).toBe(25);
  });

  it("handles empty results", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([]);

    const breakdown = await calculateTypeBreakdown("tenant_123", {});

    expect(breakdown).toEqual([]);
  });
});

describe("calculateDonorStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns top donors", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([
      {
        payerEmail: "donor1@example.com",
        _sum: { amount: 50000 },
        _count: { id: 5 },
      },
      {
        payerEmail: "donor2@example.com",
        _sum: { amount: 30000 },
        _count: { id: 3 },
      },
    ] as never);

    vi.mocked(prisma.payment.findMany).mockResolvedValue([
      createMockPayment({
        payerEmail: "donor1@example.com",
        payerName: "Top Donor",
      }),
    ] as never);

    const stats = await calculateDonorStats("tenant_123", {
      limit: 10,
    });

    expect(stats.topDonors).toHaveLength(2);
    expect(stats.topDonors[0].totalAmount).toBe(50000);
  });

  it("excludes anonymous donors from list", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([
      {
        payerEmail: "donor@example.com",
        _sum: { amount: 50000 },
        _count: { id: 5 },
      },
    ] as never);

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);

    await calculateDonorStats("tenant_123", {
      excludeAnonymous: true,
    });

    expect(prisma.payment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAnonymous: false,
        }),
      })
    );
  });

  it("returns unique donor count", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.payment.groupBy).mockResolvedValue([
      { payerEmail: "a@example.com", _sum: { amount: 10000 }, _count: { id: 1 } },
      { payerEmail: "b@example.com", _sum: { amount: 20000 }, _count: { id: 2 } },
      { payerEmail: "c@example.com", _sum: { amount: 5000 }, _count: { id: 1 } },
    ] as never);

    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);

    const stats = await calculateDonorStats("tenant_123", {});

    expect(stats.uniqueDonorCount).toBe(3);
  });
});

describe("formatCurrency", () => {
  it("formats JPY correctly", () => {
    expect(formatCurrency(5000, "jpy")).toBe("¥5,000");
    expect(formatCurrency(1000000, "jpy")).toBe("¥1,000,000");
    expect(formatCurrency(0, "jpy")).toBe("¥0");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-5000, "jpy")).toBe("-¥5,000");
  });
});

describe("getDateRangeForPeriod", () => {
  it("returns correct range for current month", () => {
    // Use local timezone constructor (month is 0-indexed)
    const now = new Date(2024, 5, 15); // June 15, 2024
    const { startDate, endDate } = getDateRangeForPeriod("month", now);

    expect(startDate).toEqual(new Date(2024, 5, 1)); // June 1, 2024
    expect(endDate.getMonth()).toBe(5); // June
  });

  it("returns correct range for current year", () => {
    const now = new Date(2024, 5, 15); // June 15, 2024
    const { startDate, endDate } = getDateRangeForPeriod("year", now);

    expect(startDate).toEqual(new Date(2024, 0, 1)); // January 1, 2024
    expect(endDate.getFullYear()).toBe(2024);
  });

  it("returns correct range for last 30 days", () => {
    const now = new Date(2024, 5, 15); // June 15, 2024
    const { startDate, endDate } = getDateRangeForPeriod("last30days", now);

    const diffDays = Math.round(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(30);
  });

  it("returns correct range for fiscal year (April start)", () => {
    const now = new Date(2024, 5, 15); // June 15, 2024
    const { startDate, endDate } = getDateRangeForPeriod("fiscalYear", now);

    expect(startDate).toEqual(new Date(2024, 3, 1)); // April 1, 2024
    expect(endDate.getFullYear()).toBe(2025);
    expect(endDate.getMonth()).toBe(2); // March
  });

  it("handles fiscal year crossing calendar year boundary", () => {
    const now = new Date(2024, 1, 15); // February 15, 2024 (before April)
    const { startDate } = getDateRangeForPeriod("fiscalYear", now);

    expect(startDate).toEqual(new Date(2023, 3, 1)); // April 1, 2023
  });
});

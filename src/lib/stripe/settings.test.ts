import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getPaymentSettings,
  updatePaymentSettings,
  getDefaultPaymentSettings,
  PaymentSettingsError,
} from "./settings";

// Mock Prisma
vi.mock("@/lib/db/client", () => ({
  prisma: {
    paymentSettings: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("getDefaultPaymentSettings", () => {
  it("returns default settings structure", () => {
    const defaults = getDefaultPaymentSettings();

    expect(defaults).toEqual({
      annualFeeEnabled: false,
      annualFeeAmount: 5000,
      annualFeeDescription: null,
      donationEnabled: false,
      donationMinAmount: 1000,
      donationMaxAmount: 1_000_000,
      donationPresets: [1000, 3000, 5000, 10000],
      showDonorList: true,
      allowAnonymous: true,
    });
  });
});

describe("getPaymentSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing settings for tenant", async () => {
    const { prisma } = await import("@/lib/db/client");

    const mockSettings = {
      id: "settings_123",
      tenantId: "tenant_123",
      annualFeeEnabled: true,
      annualFeeAmount: 8000,
      annualFeeDescription: "年会費（社会人）",
      donationEnabled: true,
      donationMinAmount: 500,
      donationMaxAmount: 500_000,
      donationPresets: [1000, 5000, 10000, 50000],
      showDonorList: false,
      allowAnonymous: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.paymentSettings.findUnique).mockResolvedValue(
      mockSettings as never
    );

    const result = await getPaymentSettings("tenant_123");

    expect(result).toEqual(mockSettings);
    expect(prisma.paymentSettings.findUnique).toHaveBeenCalledWith({
      where: { tenantId: "tenant_123" },
    });
  });

  it("returns default settings when tenant has no settings", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.paymentSettings.findUnique).mockResolvedValue(null);

    const result = await getPaymentSettings("tenant_new");

    expect(result).toEqual(
      expect.objectContaining({
        annualFeeEnabled: false,
        annualFeeAmount: 5000,
        donationEnabled: false,
      })
    );
  });

  it("throws error for empty tenantId", async () => {
    await expect(getPaymentSettings("")).rejects.toThrow(PaymentSettingsError);
  });
});

describe("updatePaymentSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates settings if not exists (upsert)", async () => {
    const { prisma } = await import("@/lib/db/client");

    const newSettings = {
      annualFeeEnabled: true,
      annualFeeAmount: 6000,
    };

    vi.mocked(prisma.paymentSettings.upsert).mockResolvedValue({
      id: "settings_new",
      tenantId: "tenant_123",
      ...getDefaultPaymentSettings(),
      ...newSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await updatePaymentSettings("tenant_123", newSettings);

    expect(result.annualFeeEnabled).toBe(true);
    expect(result.annualFeeAmount).toBe(6000);
    expect(prisma.paymentSettings.upsert).toHaveBeenCalledWith({
      where: { tenantId: "tenant_123" },
      update: newSettings,
      create: expect.objectContaining({
        tenantId: "tenant_123",
        ...newSettings,
      }),
    });
  });

  it("updates existing settings", async () => {
    const { prisma } = await import("@/lib/db/client");

    const updates = {
      donationEnabled: true,
      donationMinAmount: 2000,
      donationPresets: [2000, 5000, 10000],
    };

    vi.mocked(prisma.paymentSettings.upsert).mockResolvedValue({
      id: "settings_123",
      tenantId: "tenant_123",
      ...getDefaultPaymentSettings(),
      ...updates,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const result = await updatePaymentSettings("tenant_123", updates);

    expect(result.donationEnabled).toBe(true);
    expect(result.donationMinAmount).toBe(2000);
    expect(result.donationPresets).toEqual([2000, 5000, 10000]);
  });

  it("validates annual fee amount range", async () => {
    const invalidAmount = { annualFeeAmount: -1000 };

    await expect(
      updatePaymentSettings("tenant_123", invalidAmount)
    ).rejects.toThrow(PaymentSettingsError);

    const tooHighAmount = { annualFeeAmount: 100_000_000 };

    await expect(
      updatePaymentSettings("tenant_123", tooHighAmount)
    ).rejects.toThrow(PaymentSettingsError);
  });

  it("validates donation amount range", async () => {
    const invalidMin = { donationMinAmount: 0 };

    await expect(
      updatePaymentSettings("tenant_123", invalidMin)
    ).rejects.toThrow(PaymentSettingsError);

    const minGreaterThanMax = {
      donationMinAmount: 100_000,
      donationMaxAmount: 10_000,
    };

    await expect(
      updatePaymentSettings("tenant_123", minGreaterThanMax)
    ).rejects.toThrow(PaymentSettingsError);
  });

  it("validates donation presets are within range", async () => {
    const presetsOutOfRange = {
      donationMinAmount: 1000,
      donationMaxAmount: 50_000,
      donationPresets: [500, 1000, 5000, 100_000], // 500 and 100000 out of range
    };

    await expect(
      updatePaymentSettings("tenant_123", presetsOutOfRange)
    ).rejects.toThrow(PaymentSettingsError);
  });

  it("validates presets array format", async () => {
    const invalidPresets = {
      donationPresets: "not an array",
    };

    await expect(
      updatePaymentSettings("tenant_123", invalidPresets as never)
    ).rejects.toThrow(PaymentSettingsError);
  });

  it("throws error for empty tenantId", async () => {
    await expect(
      updatePaymentSettings("", { annualFeeEnabled: true })
    ).rejects.toThrow(PaymentSettingsError);
  });
});

describe("PaymentSettings edge cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles concurrent updates gracefully", async () => {
    const { prisma } = await import("@/lib/db/client");

    // First update succeeds
    vi.mocked(prisma.paymentSettings.upsert).mockResolvedValueOnce({
      id: "settings_123",
      tenantId: "tenant_123",
      annualFeeEnabled: true,
      annualFeeAmount: 5000,
    } as never);

    // Second update also succeeds (upsert handles race conditions)
    vi.mocked(prisma.paymentSettings.upsert).mockResolvedValueOnce({
      id: "settings_123",
      tenantId: "tenant_123",
      annualFeeEnabled: true,
      annualFeeAmount: 6000,
    } as never);

    const [result1, result2] = await Promise.all([
      updatePaymentSettings("tenant_123", { annualFeeAmount: 5000 }),
      updatePaymentSettings("tenant_123", { annualFeeAmount: 6000 }),
    ]);

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });

  it("preserves unmodified fields during partial update", async () => {
    const { prisma } = await import("@/lib/db/client");

    const existingSettings = {
      id: "settings_123",
      tenantId: "tenant_123",
      annualFeeEnabled: true,
      annualFeeAmount: 8000,
      annualFeeDescription: "既存の説明",
      donationEnabled: true,
      donationMinAmount: 1000,
      donationMaxAmount: 100_000,
      donationPresets: [1000, 5000, 10000],
      showDonorList: true,
      allowAnonymous: false,
    };

    vi.mocked(prisma.paymentSettings.upsert).mockResolvedValue({
      ...existingSettings,
      annualFeeAmount: 10000, // Only this changed
    } as never);

    const result = await updatePaymentSettings("tenant_123", {
      annualFeeAmount: 10000,
    });

    // Other fields should remain unchanged
    expect(prisma.paymentSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { annualFeeAmount: 10000 },
      })
    );
  });

  it("sanitizes string inputs", async () => {
    const { prisma } = await import("@/lib/db/client");

    vi.mocked(prisma.paymentSettings.upsert).mockResolvedValue({
      id: "settings_123",
      tenantId: "tenant_123",
      annualFeeDescription: "安全な説明文",
    } as never);

    // XSS attempt in description
    await updatePaymentSettings("tenant_123", {
      annualFeeDescription: '<script>alert("xss")</script>年会費説明',
    });

    expect(prisma.paymentSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          annualFeeDescription: expect.not.stringContaining("<script>"),
        }),
      })
    );
  });
});

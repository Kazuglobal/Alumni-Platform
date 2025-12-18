import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock checkout session creation
vi.mock("@/lib/stripe/checkout", () => ({
  createCheckoutSession: vi.fn(),
  CheckoutSessionError: class CheckoutSessionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CheckoutSessionError";
    }
  },
}));

// Mock authentication
vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Prisma
vi.mock("@/lib/db/client", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock validation
vi.mock("@/lib/stripe/validation", () => ({
  validateDonationAmount: vi.fn().mockReturnValue(true),
}));

function createMockRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authentication", () => {
    it("allows unauthenticated users for donations", async () => {
      const { createCheckoutSession } = await import("@/lib/stripe/checkout");
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(getCurrentUser).mockResolvedValue(null);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
        paymentSettings: null,
      } as never);
      vi.mocked(createCheckoutSession).mockResolvedValue({
        sessionId: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      const request = createMockRequest({
        type: "DONATION",
        amount: 5000,
        tenantId: "tenant_123",
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("requires authentication for annual fee payments", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");

      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        amount: 5000,
        tenantId: "tenant_123",
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toMatch(/authentication/i);
    });

    it("requires authentication for event fee payments", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");

      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const request = createMockRequest({
        type: "EVENT_FEE",
        amount: 3000,
        tenantId: "tenant_123",
        eventId: "event_123",
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("input validation", () => {
    it("returns 400 for missing type", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user_123" } as never);

      const request = createMockRequest({
        amount: 5000,
        tenantId: "tenant_123",
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toMatch(/type/i);
    });

    it("returns 400 for missing amount", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user_123" } as never);

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        tenantId: "tenant_123",
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toMatch(/amount/i);
    });

    it("returns 400 for invalid payment type", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user_123" } as never);

      const request = createMockRequest({
        type: "INVALID_TYPE",
        amount: 5000,
        tenantId: "tenant_123",
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toMatch(/type/i);
    });

    it("returns 400 for negative amount", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user_123" } as never);

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        amount: -1000,
        tenantId: "tenant_123",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 for amount exceeding maximum", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user_123" } as never);

      const request = createMockRequest({
        type: "DONATION",
        amount: 100_000_000, // 1億円
        tenantId: "tenant_123",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 for missing tenantId", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      vi.mocked(getCurrentUser).mockResolvedValue({ id: "user_123" } as never);

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        amount: 5000,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toMatch(/tenant/i);
    });
  });

  describe("checkout session creation", () => {
    it("creates checkout session for annual fee", async () => {
      const { createCheckoutSession } = await import("@/lib/stripe/checkout");
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user_123",
        email: "user@example.com",
      } as never);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
        paymentSettings: null,
      } as never);
      vi.mocked(createCheckoutSession).mockResolvedValue({
        sessionId: "cs_annual_123",
        url: "https://checkout.stripe.com/pay/cs_annual_123",
      });

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        amount: 5000,
        tenantId: "tenant_123",
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.sessionId).toBe("cs_annual_123");
      expect(json.url).toContain("checkout.stripe.com");
    });

    it("creates checkout session for donation with custom amount", async () => {
      const { createCheckoutSession } = await import("@/lib/stripe/checkout");
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(getCurrentUser).mockResolvedValue(null);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
        paymentSettings: null,
      } as never);
      vi.mocked(createCheckoutSession).mockResolvedValue({
        sessionId: "cs_donation_123",
        url: "https://checkout.stripe.com/pay/cs_donation_123",
      });

      const request = createMockRequest({
        type: "DONATION",
        amount: 10000,
        tenantId: "tenant_123",
        description: "50周年記念寄付",
        isAnonymous: true,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.sessionId).toBe("cs_donation_123");
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DONATION",
          amount: 10000,
          description: "50周年記念寄付",
          isAnonymous: true,
        })
      );
    });

    it("creates checkout session for event fee with eventId", async () => {
      const { createCheckoutSession } = await import("@/lib/stripe/checkout");
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user_123",
        email: "user@example.com",
      } as never);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
        paymentSettings: null,
      } as never);
      vi.mocked(createCheckoutSession).mockResolvedValue({
        sessionId: "cs_event_123",
        url: "https://checkout.stripe.com/pay/cs_event_123",
      });

      const request = createMockRequest({
        type: "EVENT_FEE",
        amount: 3000,
        tenantId: "tenant_123",
        eventId: "event_456",
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "EVENT_FEE",
          eventId: "event_456",
        })
      );
    });

    it("includes success and cancel URLs", async () => {
      const { createCheckoutSession } = await import("@/lib/stripe/checkout");
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user_123",
      } as never);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        subdomain: "test",
        paymentSettings: null,
      } as never);
      vi.mocked(createCheckoutSession).mockResolvedValue({
        sessionId: "cs_test",
        url: "https://checkout.stripe.com/pay/cs_test",
      });

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        amount: 5000,
        tenantId: "tenant_123",
      });

      await POST(request);

      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          successUrl: expect.stringContaining("/payment/success"),
          cancelUrl: expect.stringContaining("/payment/cancel"),
        })
      );
    });
  });

  describe("error handling", () => {
    it("returns 404 if tenant not found", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user_123",
      } as never);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        amount: 5000,
        tenantId: "nonexistent_tenant",
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toMatch(/tenant/i);
    });

    it("returns 500 for Stripe API errors", async () => {
      const { createCheckoutSession } = await import("@/lib/stripe/checkout");
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(getCurrentUser).mockResolvedValue({
        id: "user_123",
      } as never);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        subdomain: "test",
        paymentSettings: null,
      } as never);
      vi.mocked(createCheckoutSession).mockRejectedValue(
        new Error("Stripe API error")
      );

      const request = createMockRequest({
        type: "ANNUAL_FEE",
        amount: 5000,
        tenantId: "tenant_123",
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe("tenant settings validation", () => {
    it("validates donation amount against tenant settings", async () => {
      const { getCurrentUser } = await import("@/lib/auth/session");
      const { prisma } = await import("@/lib/db/client");
      const { validateDonationAmount } = await import(
        "@/lib/stripe/validation"
      );

      vi.mocked(getCurrentUser).mockResolvedValue(null);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        subdomain: "test",
        paymentSettings: {
          donationMinAmount: 1000,
          donationMaxAmount: 100000,
        },
      } as never);
      vi.mocked(validateDonationAmount).mockImplementation(() => {
        throw new Error("Amount below minimum");
      });

      // Amount below minimum
      const request = createMockRequest({
        type: "DONATION",
        amount: 500, // Below minimum
        tenantId: "tenant_123",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});

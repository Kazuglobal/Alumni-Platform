import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createCheckoutSession,
  CreateCheckoutSessionParams,
  CheckoutSessionError,
} from "./checkout";
import type { PaymentType } from "@prisma/client";

// Mock Stripe
vi.mock("./client", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
    },
  },
}));

// Mock Prisma
vi.mock("@/lib/db/client", () => ({
  prisma: {
    payment: {
      create: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

describe("createCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validParams: CreateCheckoutSessionParams = {
    tenantId: "tenant_123",
    type: "ANNUAL_FEE" as PaymentType,
    amount: 5000,
    successUrl: "https://example.com/success",
    cancelUrl: "https://example.com/cancel",
  };

  describe("parameter validation", () => {
    it("throws error for missing tenantId", async () => {
      const params = { ...validParams, tenantId: "" };
      await expect(createCheckoutSession(params)).rejects.toThrow(
        CheckoutSessionError
      );
    });

    it("throws error for invalid amount", async () => {
      const params = { ...validParams, amount: -100 };
      await expect(createCheckoutSession(params)).rejects.toThrow(
        CheckoutSessionError
      );
    });

    it("throws error for zero amount", async () => {
      const params = { ...validParams, amount: 0 };
      await expect(createCheckoutSession(params)).rejects.toThrow(
        CheckoutSessionError
      );
    });

    it("throws error for invalid payment type", async () => {
      const params = { ...validParams, type: "INVALID_TYPE" as PaymentType };
      await expect(createCheckoutSession(params)).rejects.toThrow(
        CheckoutSessionError
      );
    });

    it("throws error for missing success URL", async () => {
      const params = { ...validParams, successUrl: "" };
      await expect(createCheckoutSession(params)).rejects.toThrow(
        CheckoutSessionError
      );
    });

    it("throws error for missing cancel URL", async () => {
      const params = { ...validParams, cancelUrl: "" };
      await expect(createCheckoutSession(params)).rejects.toThrow(
        CheckoutSessionError
      );
    });
  });

  describe("session creation", () => {
    it("creates checkout session with correct parameters for annual fee", async () => {
      const { stripe } = await import("./client");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
      } as never);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      } as never);

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: "payment_123",
        stripeSessionId: "cs_test_123",
      } as never);

      const result = await createCheckoutSession(validParams);

      expect(result).toEqual({
        sessionId: "cs_test_123",
        url: "https://checkout.stripe.com/pay/cs_test_123",
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "payment",
          payment_method_types: ["card"],
          currency: "jpy",
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: "jpy",
                unit_amount: 5000,
              }),
              quantity: 1,
            }),
          ],
          success_url: expect.stringContaining("https://example.com/success"),
          cancel_url: "https://example.com/cancel",
          metadata: expect.objectContaining({
            tenantId: "tenant_123",
            type: "ANNUAL_FEE",
          }),
        })
      );
    });

    it("creates checkout session for donation with custom description", async () => {
      const { stripe } = await import("./client");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
      } as never);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: "cs_test_456",
        url: "https://checkout.stripe.com/pay/cs_test_456",
      } as never);

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: "payment_456",
        stripeSessionId: "cs_test_456",
      } as never);

      const donationParams: CreateCheckoutSessionParams = {
        ...validParams,
        type: "DONATION" as PaymentType,
        amount: 10000,
        description: "50周年記念寄付",
      };

      await createCheckoutSession(donationParams);

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.objectContaining({
                  name: expect.stringContaining("寄付"),
                  description: "50周年記念寄付",
                }),
              }),
            }),
          ],
        })
      );
    });

    it("supports anonymous donations", async () => {
      const { stripe } = await import("./client");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
      } as never);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: "cs_test_789",
        url: "https://checkout.stripe.com/pay/cs_test_789",
      } as never);

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: "payment_789",
        stripeSessionId: "cs_test_789",
      } as never);

      const anonParams: CreateCheckoutSessionParams = {
        ...validParams,
        type: "DONATION" as PaymentType,
        isAnonymous: true,
      };

      await createCheckoutSession(anonParams);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isAnonymous: true,
          }),
        })
      );
    });

    it("handles event fee payments with eventId", async () => {
      const { stripe } = await import("./client");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
      } as never);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: "cs_test_event",
        url: "https://checkout.stripe.com/pay/cs_test_event",
      } as never);

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: "payment_event",
        stripeSessionId: "cs_test_event",
      } as never);

      const eventParams: CreateCheckoutSessionParams = {
        ...validParams,
        type: "EVENT_FEE" as PaymentType,
        amount: 3000,
        eventId: "event_123",
      };

      await createCheckoutSession(eventParams);

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId: "event_123",
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("throws CheckoutSessionError when tenant not found", async () => {
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      await expect(createCheckoutSession(validParams)).rejects.toThrow(
        CheckoutSessionError
      );
      await expect(createCheckoutSession(validParams)).rejects.toThrow(
        /tenant not found/i
      );
    });

    it("throws CheckoutSessionError when Stripe API fails", async () => {
      const { stripe } = await import("./client");
      const { prisma } = await import("@/lib/db/client");

      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "tenant_123",
        name: "Test Alumni",
        subdomain: "test",
      } as never);

      vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(
        new Error("Stripe API error")
      );

      await expect(createCheckoutSession(validParams)).rejects.toThrow(
        CheckoutSessionError
      );
    });
  });
});

describe("getCheckoutSession", () => {
  it("retrieves session details by ID", async () => {
    const { getCheckoutSession } = await import("./checkout");
    const { stripe } = await import("./client");

    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      id: "cs_test_123",
      status: "complete",
      payment_status: "paid",
      amount_total: 5000,
      currency: "jpy",
      customer_details: {
        email: "test@example.com",
        name: "Test User",
      },
    } as never);

    const session = await getCheckoutSession("cs_test_123");

    expect(session).toEqual(
      expect.objectContaining({
        id: "cs_test_123",
        status: "complete",
        payment_status: "paid",
      })
    );
  });

  it("throws error for invalid session ID", async () => {
    const { getCheckoutSession } = await import("./checkout");

    await expect(getCheckoutSession("")).rejects.toThrow();
  });
});

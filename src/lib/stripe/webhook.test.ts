import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  constructWebhookEvent,
  handleWebhookEvent,
  WebhookError,
} from "./webhook";
import type Stripe from "stripe";

// Mock Stripe
vi.mock("./client", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  },
}));

// Mock Prisma
vi.mock("@/lib/db/client", () => ({
  prisma: {
    payment: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("constructWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("constructs event from valid signature", async () => {
    const { stripe } = await import("./client");
    const mockEvent = {
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: { object: {} },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(
      mockEvent as Stripe.Event
    );

    const result = await constructWebhookEvent(
      "raw_body",
      "sig_header",
      "whsec_test"
    );

    expect(result).toEqual(mockEvent);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      "raw_body",
      "sig_header",
      "whsec_test"
    );
  });

  it("throws WebhookError for invalid signature", async () => {
    const { stripe } = await import("./client");

    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    await expect(
      constructWebhookEvent("raw_body", "invalid_sig", "whsec_test")
    ).rejects.toThrow(WebhookError);
  });

  it("throws WebhookError for missing signature header", async () => {
    await expect(
      constructWebhookEvent("raw_body", "", "whsec_test")
    ).rejects.toThrow(WebhookError);
  });
});

describe("handleWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkout.session.completed", () => {
    it("updates payment status to COMPLETED on successful payment", async () => {
      const { prisma } = await import("@/lib/db/client");

      const event: Stripe.Event = {
        id: "evt_test_123",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            payment_status: "paid",
            amount_total: 5000,
            currency: "jpy",
            customer_details: {
              email: "customer@example.com",
              name: "Test Customer",
            },
            payment_intent: "pi_test_123",
            metadata: {
              tenantId: "tenant_123",
              type: "ANNUAL_FEE",
            },
          } as Stripe.Checkout.Session,
        },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "payment_123",
        stripeSessionId: "cs_test_123",
        status: "PENDING",
      } as never);

      vi.mocked(prisma.payment.update).mockResolvedValue({
        id: "payment_123",
        status: "COMPLETED",
      } as never);

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { stripeSessionId: "cs_test_123" },
        data: expect.objectContaining({
          status: "COMPLETED",
          stripePaymentIntentId: "pi_test_123",
          payerEmail: "customer@example.com",
          payerName: "Test Customer",
          completedAt: expect.any(Date),
        }),
      });
    });

    it("handles unpaid session (e.g., invoice pending)", async () => {
      const { prisma } = await import("@/lib/db/client");

      const event: Stripe.Event = {
        id: "evt_test_456",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_456",
            payment_status: "unpaid",
            metadata: {
              tenantId: "tenant_123",
              type: "ANNUAL_FEE",
            },
          } as Stripe.Checkout.Session,
        },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "payment_456",
        stripeSessionId: "cs_test_456",
        status: "PENDING",
      } as never);

      vi.mocked(prisma.payment.update).mockResolvedValue({
        id: "payment_456",
        status: "PROCESSING",
      } as never);

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { stripeSessionId: "cs_test_456" },
        data: expect.objectContaining({
          status: "PROCESSING",
        }),
      });
    });
  });

  describe("checkout.session.expired", () => {
    it("updates payment status to EXPIRED", async () => {
      const { prisma } = await import("@/lib/db/client");

      const event: Stripe.Event = {
        id: "evt_test_expired",
        type: "checkout.session.expired",
        data: {
          object: {
            id: "cs_test_expired",
            metadata: {
              tenantId: "tenant_123",
              type: "DONATION",
            },
          } as Stripe.Checkout.Session,
        },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "payment_expired",
        stripeSessionId: "cs_test_expired",
        status: "PENDING",
      } as never);

      vi.mocked(prisma.payment.update).mockResolvedValue({
        id: "payment_expired",
        status: "EXPIRED",
      } as never);

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { stripeSessionId: "cs_test_expired" },
        data: expect.objectContaining({
          status: "EXPIRED",
        }),
      });
    });
  });

  describe("charge.refunded", () => {
    it("updates payment status to REFUNDED for full refund", async () => {
      const { prisma } = await import("@/lib/db/client");

      const event: Stripe.Event = {
        id: "evt_test_refund",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_test_123",
            payment_intent: "pi_test_123",
            amount: 5000,
            amount_refunded: 5000,
            refunded: true,
          } as Stripe.Charge,
        },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "payment_refund",
        stripePaymentIntentId: "pi_test_123",
        status: "COMPLETED",
      } as never);

      vi.mocked(prisma.payment.update).mockResolvedValue({
        id: "payment_refund",
        status: "REFUNDED",
      } as never);

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: "pi_test_123" },
        data: expect.objectContaining({
          status: "REFUNDED",
          refundedAt: expect.any(Date),
        }),
      });
    });

    it("updates payment status to PARTIALLY_REFUNDED for partial refund", async () => {
      const { prisma } = await import("@/lib/db/client");

      const event: Stripe.Event = {
        id: "evt_test_partial_refund",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_test_456",
            payment_intent: "pi_test_456",
            amount: 5000,
            amount_refunded: 2000,
            refunded: false,
          } as Stripe.Charge,
        },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "payment_partial",
        stripePaymentIntentId: "pi_test_456",
        status: "COMPLETED",
      } as never);

      vi.mocked(prisma.payment.update).mockResolvedValue({
        id: "payment_partial",
        status: "PARTIALLY_REFUNDED",
      } as never);

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: "pi_test_456" },
        data: expect.objectContaining({
          status: "PARTIALLY_REFUNDED",
        }),
      });
    });
  });

  describe("payment_intent.payment_failed", () => {
    it("updates payment status to FAILED", async () => {
      const { prisma } = await import("@/lib/db/client");

      const event: Stripe.Event = {
        id: "evt_test_failed",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test_failed",
            last_payment_error: {
              message: "Your card was declined.",
              code: "card_declined",
            },
          } as Stripe.PaymentIntent,
        },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "payment_failed",
        stripePaymentIntentId: "pi_test_failed",
        status: "PROCESSING",
      } as never);

      vi.mocked(prisma.payment.update).mockResolvedValue({
        id: "payment_failed",
        status: "FAILED",
      } as never);

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: "pi_test_failed" },
        data: expect.objectContaining({
          status: "FAILED",
          metadata: expect.objectContaining({
            failureReason: "Your card was declined.",
            failureCode: "card_declined",
          }),
        }),
      });
    });
  });

  describe("unhandled events", () => {
    it("returns handled: false for unknown event types", async () => {
      const event: Stripe.Event = {
        id: "evt_unknown",
        type: "unknown.event.type" as Stripe.Event.Type,
        data: { object: {} as Stripe.Event.Data.Object },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(false);
    });

    it("does not throw for unhandled events", async () => {
      const event: Stripe.Event = {
        id: "evt_unhandled",
        type: "customer.created" as Stripe.Event.Type,
        data: { object: {} as Stripe.Event.Data.Object },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      await expect(handleWebhookEvent(event)).resolves.not.toThrow();
    });
  });

  describe("idempotency", () => {
    it("handles duplicate events gracefully", async () => {
      const { prisma } = await import("@/lib/db/client");

      const event: Stripe.Event = {
        id: "evt_duplicate",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_dup",
            payment_status: "paid",
            metadata: {
              tenantId: "tenant_123",
              type: "ANNUAL_FEE",
            },
          } as Stripe.Checkout.Session,
        },
        object: "event",
        api_version: "2024-04-10",
        created: Date.now(),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      };

      // Payment already completed
      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "payment_dup",
        stripeSessionId: "cs_test_dup",
        status: "COMPLETED",
        completedAt: new Date(),
      } as never);

      const result = await handleWebhookEvent(event);

      expect(result.handled).toBe(true);
      expect(result.skipped).toBe(true);
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });
  });
});

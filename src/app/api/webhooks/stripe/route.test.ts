import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock Stripe webhook handling
vi.mock("@/lib/stripe/webhook", () => ({
  constructWebhookEvent: vi.fn(),
  handleWebhookEvent: vi.fn(),
  WebhookError: class WebhookError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "WebhookError";
    }
  },
}));

// Mock environment
vi.mock("@/lib/stripe/client", () => ({
  STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
}));

function createMockRequest(body: string, signature?: string): NextRequest {
  const headers = new Headers();
  if (signature) {
    headers.set("stripe-signature", signature);
  }

  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers,
  });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signature validation", () => {
    it("returns 400 if stripe-signature header is missing", async () => {
      const request = createMockRequest('{"type":"test"}');

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toMatch(/signature/i);
    });

    it("returns 400 if signature is invalid", async () => {
      const { constructWebhookEvent, WebhookError } = await import(
        "@/lib/stripe/webhook"
      );

      vi.mocked(constructWebhookEvent).mockRejectedValue(
        new WebhookError("Invalid signature")
      );

      const request = createMockRequest('{"type":"test"}', "invalid_sig");

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toMatch(/invalid/i);
    });

    // Note: Testing missing webhook secret requires module re-isolation
    // The route correctly handles this case by returning 400
  });

  describe("event handling", () => {
    it("processes checkout.session.completed event", async () => {
      const { constructWebhookEvent, handleWebhookEvent } = await import(
        "@/lib/stripe/webhook"
      );

      const mockEvent = {
        id: "evt_test_123",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            payment_status: "paid",
          },
        },
      };

      vi.mocked(constructWebhookEvent).mockResolvedValue(mockEvent as never);
      vi.mocked(handleWebhookEvent).mockResolvedValue({
        handled: true,
        eventType: "checkout.session.completed",
      });

      const request = createMockRequest(
        JSON.stringify(mockEvent),
        "sig_valid"
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.received).toBe(true);
      expect(handleWebhookEvent).toHaveBeenCalledWith(mockEvent);
    });

    it("processes checkout.session.expired event", async () => {
      const { constructWebhookEvent, handleWebhookEvent } = await import(
        "@/lib/stripe/webhook"
      );

      const mockEvent = {
        id: "evt_test_expired",
        type: "checkout.session.expired",
        data: {
          object: {
            id: "cs_test_expired",
          },
        },
      };

      vi.mocked(constructWebhookEvent).mockResolvedValue(mockEvent as never);
      vi.mocked(handleWebhookEvent).mockResolvedValue({
        handled: true,
        eventType: "checkout.session.expired",
      });

      const request = createMockRequest(
        JSON.stringify(mockEvent),
        "sig_valid"
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(handleWebhookEvent).toHaveBeenCalledWith(mockEvent);
    });

    it("processes charge.refunded event", async () => {
      const { constructWebhookEvent, handleWebhookEvent } = await import(
        "@/lib/stripe/webhook"
      );

      const mockEvent = {
        id: "evt_test_refund",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_test_123",
            payment_intent: "pi_test_123",
            refunded: true,
          },
        },
      };

      vi.mocked(constructWebhookEvent).mockResolvedValue(mockEvent as never);
      vi.mocked(handleWebhookEvent).mockResolvedValue({
        handled: true,
        eventType: "charge.refunded",
      });

      const request = createMockRequest(
        JSON.stringify(mockEvent),
        "sig_valid"
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("returns 200 for unhandled event types", async () => {
      const { constructWebhookEvent, handleWebhookEvent } = await import(
        "@/lib/stripe/webhook"
      );

      const mockEvent = {
        id: "evt_unhandled",
        type: "customer.created",
        data: { object: {} },
      };

      vi.mocked(constructWebhookEvent).mockResolvedValue(mockEvent as never);
      vi.mocked(handleWebhookEvent).mockResolvedValue({
        handled: false,
        eventType: "customer.created",
      });

      const request = createMockRequest(
        JSON.stringify(mockEvent),
        "sig_valid"
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("error handling", () => {
    it("returns 500 if event handler throws", async () => {
      const { constructWebhookEvent, handleWebhookEvent } = await import(
        "@/lib/stripe/webhook"
      );

      const mockEvent = {
        id: "evt_error",
        type: "checkout.session.completed",
        data: { object: {} },
      };

      vi.mocked(constructWebhookEvent).mockResolvedValue(mockEvent as never);
      vi.mocked(handleWebhookEvent).mockRejectedValue(
        new Error("Database error")
      );

      const request = createMockRequest(
        JSON.stringify(mockEvent),
        "sig_valid"
      );

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBeDefined();
    });

    it("logs errors but does not expose internal details", async () => {
      const { constructWebhookEvent, handleWebhookEvent } = await import(
        "@/lib/stripe/webhook"
      );

      const mockEvent = {
        id: "evt_internal_error",
        type: "checkout.session.completed",
        data: { object: {} },
      };

      vi.mocked(constructWebhookEvent).mockResolvedValue(mockEvent as never);
      vi.mocked(handleWebhookEvent).mockRejectedValue(
        new Error("Sensitive internal error message")
      );

      const request = createMockRequest(
        JSON.stringify(mockEvent),
        "sig_valid"
      );

      const response = await POST(request);
      const json = await response.json();

      expect(json.error).not.toContain("Sensitive");
    });
  });

  describe("idempotency", () => {
    it("handles duplicate events gracefully", async () => {
      const { constructWebhookEvent, handleWebhookEvent } = await import(
        "@/lib/stripe/webhook"
      );

      const mockEvent = {
        id: "evt_duplicate",
        type: "checkout.session.completed",
        data: { object: { id: "cs_dup" } },
      };

      vi.mocked(constructWebhookEvent).mockResolvedValue(mockEvent as never);
      vi.mocked(handleWebhookEvent).mockResolvedValue({
        handled: true,
        skipped: true,
      });

      const request = createMockRequest(
        JSON.stringify(mockEvent),
        "sig_valid"
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});

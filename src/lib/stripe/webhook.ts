import type Stripe from "stripe";
import { stripe } from "./client";
import { prisma } from "@/lib/db/client";

export class WebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookError";
  }
}

export interface WebhookResult {
  handled: boolean;
  skipped?: boolean;
  eventType?: string;
}

/**
 * Constructs and verifies a Stripe webhook event
 */
export async function constructWebhookEvent(
  rawBody: string,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  if (!signature) {
    throw new WebhookError("Missing signature header");
  }

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    throw new WebhookError(
      `Invalid webhook signature: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Handles a Stripe webhook event
 */
export async function handleWebhookEvent(
  event: Stripe.Event
): Promise<WebhookResult> {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      );

    case "checkout.session.expired":
      return handleCheckoutSessionExpired(
        event.data.object as Stripe.Checkout.Session
      );

    case "charge.refunded":
      return handleChargeRefunded(event.data.object as Stripe.Charge);

    case "payment_intent.payment_failed":
      return handlePaymentIntentFailed(
        event.data.object as Stripe.PaymentIntent
      );

    default:
      return { handled: false, eventType: event.type };
  }
}

/**
 * Handles checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<WebhookResult> {
  const stripeSessionId = session.id;

  // Check if payment exists and is already processed
  const existingPayment = await prisma.payment.findUnique({
    where: { stripeSessionId },
  });

  if (!existingPayment) {
    // Payment record not found - might have been created by a different flow
    return { handled: true, skipped: true };
  }

  // Skip if already completed (idempotency)
  if (existingPayment.status === "COMPLETED" && existingPayment.completedAt) {
    return { handled: true, skipped: true };
  }

  const isPaid = session.payment_status === "paid";

  await prisma.payment.update({
    where: { stripeSessionId },
    data: {
      status: isPaid ? "COMPLETED" : "PROCESSING",
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null,
      payerEmail: session.customer_details?.email || null,
      payerName: session.customer_details?.name || null,
      completedAt: isPaid ? new Date() : null,
    },
  });

  return { handled: true, eventType: "checkout.session.completed" };
}

/**
 * Handles checkout.session.expired event
 */
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session
): Promise<WebhookResult> {
  const stripeSessionId = session.id;

  const existingPayment = await prisma.payment.findUnique({
    where: { stripeSessionId },
  });

  if (!existingPayment) {
    return { handled: true, skipped: true };
  }

  await prisma.payment.update({
    where: { stripeSessionId },
    data: {
      status: "EXPIRED",
    },
  });

  return { handled: true, eventType: "checkout.session.expired" };
}

/**
 * Handles charge.refunded event
 */
async function handleChargeRefunded(
  charge: Stripe.Charge
): Promise<WebhookResult> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return { handled: true, skipped: true };
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!existingPayment) {
    return { handled: true, skipped: true };
  }

  const isFullyRefunded = charge.refunded;
  const status = isFullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await prisma.payment.update({
    where: { stripePaymentIntentId: paymentIntentId },
    data: {
      status,
      refundedAt: new Date(),
    },
  });

  return { handled: true, eventType: "charge.refunded" };
}

/**
 * Handles payment_intent.payment_failed event
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<WebhookResult> {
  const paymentIntentId = paymentIntent.id;

  const existingPayment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!existingPayment) {
    return { handled: true, skipped: true };
  }

  const failureMessage = paymentIntent.last_payment_error?.message || null;
  const failureCode = paymentIntent.last_payment_error?.code || null;

  await prisma.payment.update({
    where: { stripePaymentIntentId: paymentIntentId },
    data: {
      status: "FAILED",
      metadata: {
        ...(existingPayment.metadata as object),
        failureReason: failureMessage,
        failureCode: failureCode,
      },
    },
  });

  return { handled: true, eventType: "payment_intent.payment_failed" };
}

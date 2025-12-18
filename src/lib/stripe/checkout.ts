import { stripe } from "./client";
import { prisma } from "@/lib/db/client";
import { validatePaymentAmount } from "./validation";
import type { PaymentType } from "@prisma/client";

export class CheckoutSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutSessionError";
  }
}

const VALID_PAYMENT_TYPES: PaymentType[] = [
  "ANNUAL_FEE",
  "DONATION",
  "EVENT_FEE",
  "OTHER",
];

export interface CreateCheckoutSessionParams {
  tenantId: string;
  type: PaymentType;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  description?: string;
  isAnonymous?: boolean;
  eventId?: string;
  customerEmail?: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

/**
 * Gets product name based on payment type
 */
function getProductName(type: PaymentType, tenantName: string): string {
  switch (type) {
    case "ANNUAL_FEE":
      return `${tenantName} - 年会費`;
    case "DONATION":
      return `${tenantName} - 寄付`;
    case "EVENT_FEE":
      return `${tenantName} - イベント参加費`;
    default:
      return `${tenantName} - お支払い`;
  }
}

/**
 * Creates a Stripe Checkout Session
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  const {
    tenantId,
    type,
    amount,
    successUrl,
    cancelUrl,
    description,
    isAnonymous = false,
    eventId,
    customerEmail,
  } = params;

  // Validate required params
  if (!tenantId) {
    throw new CheckoutSessionError("tenantId is required");
  }

  if (!successUrl) {
    throw new CheckoutSessionError("successUrl is required");
  }

  if (!cancelUrl) {
    throw new CheckoutSessionError("cancelUrl is required");
  }

  if (!VALID_PAYMENT_TYPES.includes(type)) {
    throw new CheckoutSessionError(`Invalid payment type: ${type}`);
  }

  // Validate amount
  try {
    validatePaymentAmount(amount);
  } catch (error) {
    throw new CheckoutSessionError(
      error instanceof Error ? error.message : "Invalid amount"
    );
  }

  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, subdomain: true },
  });

  if (!tenant) {
    throw new CheckoutSessionError("Tenant not found");
  }

  // Create Stripe session
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      currency: "jpy",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            unit_amount: amount,
            product_data: {
              name: getProductName(type, tenant.name),
              description: description || undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      metadata: {
        tenantId,
        type,
        eventId: eventId || "",
        isAnonymous: String(isAnonymous),
      },
    });
  } catch (error) {
    throw new CheckoutSessionError(
      `Failed to create Stripe session: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Create payment record
  await prisma.payment.create({
    data: {
      tenantId,
      stripeSessionId: session.id,
      type,
      amount,
      currency: "jpy",
      status: "PENDING",
      isAnonymous,
      description,
      eventId: eventId || null,
      metadata: {},
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Retrieves a Checkout Session from Stripe
 */
export async function getCheckoutSession(sessionId: string) {
  if (!sessionId) {
    throw new CheckoutSessionError("sessionId is required");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCheckoutSession,
  CheckoutSessionError,
} from "@/lib/stripe/checkout";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { validateDonationAmount } from "@/lib/stripe/validation";

const VALID_PAYMENT_TYPES = ["ANNUAL_FEE", "DONATION", "EVENT_FEE", "OTHER"];

const checkoutSchema = z.object({
  type: z.enum(["ANNUAL_FEE", "DONATION", "EVENT_FEE", "OTHER"]),
  amount: z.number().int().positive().max(10_000_000),
  tenantId: z.string().min(1),
  description: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  eventId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate input
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return NextResponse.json(
      { error: `Invalid ${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 }
    );
  }

  const { type, amount, tenantId, description, isAnonymous, eventId } = parsed.data;

  // Check authentication for non-donation payments
  const user = await getCurrentUser();
  if (type !== "DONATION" && !user) {
    return NextResponse.json(
      { error: "Authentication required for this payment type" },
      { status: 401 }
    );
  }

  // Get tenant with payment settings
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { paymentSettings: true },
  });

  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    );
  }

  // Validate donation amount against tenant settings
  if (type === "DONATION" && tenant.paymentSettings) {
    try {
      validateDonationAmount(amount, {
        minAmount: tenant.paymentSettings.donationMinAmount,
        maxAmount: tenant.paymentSettings.donationMaxAmount,
        presets: tenant.paymentSettings.donationPresets as number[],
      });
    } catch {
      return NextResponse.json(
        { error: "Amount is outside the allowed donation range" },
        { status: 400 }
      );
    }
  }

  // Build URLs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl = `${baseUrl}/${tenant.subdomain}/payment/success`;
  const cancelUrl = `${baseUrl}/${tenant.subdomain}/payment/cancel`;

  try {
    const result = await createCheckoutSession({
      tenantId,
      type,
      amount,
      successUrl,
      cancelUrl,
      description,
      isAnonymous,
      eventId,
      customerEmail: user?.email || undefined,
    });

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (error) {
    if (error instanceof CheckoutSessionError) {
      if (error.message.toLowerCase().includes("tenant")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Checkout session creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

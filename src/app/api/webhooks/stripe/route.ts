import { NextRequest, NextResponse } from "next/server";
import {
  constructWebhookEvent,
  handleWebhookEvent,
  WebhookError,
} from "@/lib/stripe/webhook";
import { STRIPE_WEBHOOK_SECRET } from "@/lib/stripe/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 400 }
    );
  }

  const body = await request.text();

  let event;
  try {
    event = await constructWebhookEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    if (error instanceof WebhookError) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }

  try {
    const result = await handleWebhookEvent(event);

    return NextResponse.json({
      received: true,
      handled: result.handled,
      eventType: result.eventType,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

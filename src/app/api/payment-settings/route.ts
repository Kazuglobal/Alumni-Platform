import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getDefaultPaymentSettings } from "@/lib/stripe/settings";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId is required" },
      { status: 400 }
    );
  }

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Get payment settings
  const settings = await prisma.paymentSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    return NextResponse.json(getDefaultPaymentSettings());
  }

  return NextResponse.json({
    annualFeeEnabled: settings.annualFeeEnabled,
    annualFeeAmount: settings.annualFeeAmount,
    annualFeeDescription: settings.annualFeeDescription,
    donationEnabled: settings.donationEnabled,
    donationMinAmount: settings.donationMinAmount,
    donationMaxAmount: settings.donationMaxAmount,
    donationPresets: settings.donationPresets,
    showDonorList: settings.showDonorList,
    allowAnonymous: settings.allowAnonymous,
  });
}

import { prisma } from "@/lib/db/client";
import type { PaymentSettings } from "@prisma/client";

export class PaymentSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentSettingsError";
  }
}

export interface DefaultPaymentSettings {
  annualFeeEnabled: boolean;
  annualFeeAmount: number;
  annualFeeDescription: string | null;
  donationEnabled: boolean;
  donationMinAmount: number;
  donationMaxAmount: number;
  donationPresets: number[];
  showDonorList: boolean;
  allowAnonymous: boolean;
}

/**
 * Returns default payment settings
 */
export function getDefaultPaymentSettings(): DefaultPaymentSettings {
  return {
    annualFeeEnabled: false,
    annualFeeAmount: 5000,
    annualFeeDescription: null,
    donationEnabled: false,
    donationMinAmount: 1000,
    donationMaxAmount: 1_000_000,
    donationPresets: [1000, 3000, 5000, 10000],
    showDonorList: true,
    allowAnonymous: true,
  };
}

/**
 * Gets payment settings for a tenant
 * @param tenantId - The tenant ID
 * @returns Payment settings or defaults if not configured
 */
export async function getPaymentSettings(
  tenantId: string
): Promise<PaymentSettings | DefaultPaymentSettings> {
  if (!tenantId) {
    throw new PaymentSettingsError("tenantId is required");
  }

  const settings = await prisma.paymentSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    return getDefaultPaymentSettings();
  }

  return settings;
}

export interface UpdatePaymentSettingsInput {
  annualFeeEnabled?: boolean;
  annualFeeAmount?: number;
  annualFeeDescription?: string | null;
  donationEnabled?: boolean;
  donationMinAmount?: number;
  donationMaxAmount?: number;
  donationPresets?: number[];
  showDonorList?: boolean;
  allowAnonymous?: boolean;
}

/**
 * Sanitizes a string to remove potential XSS
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Validates and updates payment settings for a tenant
 * @param tenantId - The tenant ID
 * @param input - Settings to update
 * @returns Updated settings
 */
export async function updatePaymentSettings(
  tenantId: string,
  input: UpdatePaymentSettingsInput
): Promise<PaymentSettings> {
  if (!tenantId) {
    throw new PaymentSettingsError("tenantId is required");
  }

  // Validate annual fee amount
  if (input.annualFeeAmount !== undefined) {
    if (input.annualFeeAmount < 0) {
      throw new PaymentSettingsError("Annual fee amount cannot be negative");
    }
    if (input.annualFeeAmount > 10_000_000) {
      throw new PaymentSettingsError(
        "Annual fee amount cannot exceed 10,000,000 yen"
      );
    }
  }

  // Validate donation amounts
  if (input.donationMinAmount !== undefined && input.donationMinAmount <= 0) {
    throw new PaymentSettingsError(
      "Donation minimum amount must be greater than 0"
    );
  }

  // Get current settings or defaults for comparison
  const currentSettings = await getPaymentSettings(tenantId);
  const effectiveMinAmount =
    input.donationMinAmount ?? currentSettings.donationMinAmount;
  const effectiveMaxAmount =
    input.donationMaxAmount ?? currentSettings.donationMaxAmount;

  if (effectiveMinAmount > effectiveMaxAmount) {
    throw new PaymentSettingsError(
      "Donation minimum amount cannot be greater than maximum amount"
    );
  }

  // Validate donation presets
  if (input.donationPresets !== undefined) {
    if (!Array.isArray(input.donationPresets)) {
      throw new PaymentSettingsError("Donation presets must be an array");
    }

    for (const preset of input.donationPresets) {
      if (preset < effectiveMinAmount || preset > effectiveMaxAmount) {
        throw new PaymentSettingsError(
          `Donation preset ${preset} is outside the allowed range (${effectiveMinAmount} - ${effectiveMaxAmount})`
        );
      }
    }
  }

  // Sanitize description if provided
  const sanitizedInput = { ...input };
  if (sanitizedInput.annualFeeDescription) {
    sanitizedInput.annualFeeDescription = sanitizeString(
      sanitizedInput.annualFeeDescription
    );
  }

  // Prepare data for upsert
  const defaults = getDefaultPaymentSettings();
  const createData = {
    tenantId,
    annualFeeEnabled: sanitizedInput.annualFeeEnabled ?? defaults.annualFeeEnabled,
    annualFeeAmount: sanitizedInput.annualFeeAmount ?? defaults.annualFeeAmount,
    annualFeeDescription: sanitizedInput.annualFeeDescription ?? defaults.annualFeeDescription,
    donationEnabled: sanitizedInput.donationEnabled ?? defaults.donationEnabled,
    donationMinAmount: sanitizedInput.donationMinAmount ?? defaults.donationMinAmount,
    donationMaxAmount: sanitizedInput.donationMaxAmount ?? defaults.donationMaxAmount,
    donationPresets: sanitizedInput.donationPresets ?? defaults.donationPresets,
    showDonorList: sanitizedInput.showDonorList ?? defaults.showDonorList,
    allowAnonymous: sanitizedInput.allowAnonymous ?? defaults.allowAnonymous,
  };

  // Build update data (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (sanitizedInput.annualFeeEnabled !== undefined) {
    updateData.annualFeeEnabled = sanitizedInput.annualFeeEnabled;
  }
  if (sanitizedInput.annualFeeAmount !== undefined) {
    updateData.annualFeeAmount = sanitizedInput.annualFeeAmount;
  }
  if (sanitizedInput.annualFeeDescription !== undefined) {
    updateData.annualFeeDescription = sanitizedInput.annualFeeDescription;
  }
  if (sanitizedInput.donationEnabled !== undefined) {
    updateData.donationEnabled = sanitizedInput.donationEnabled;
  }
  if (sanitizedInput.donationMinAmount !== undefined) {
    updateData.donationMinAmount = sanitizedInput.donationMinAmount;
  }
  if (sanitizedInput.donationMaxAmount !== undefined) {
    updateData.donationMaxAmount = sanitizedInput.donationMaxAmount;
  }
  if (sanitizedInput.donationPresets !== undefined) {
    updateData.donationPresets = sanitizedInput.donationPresets;
  }
  if (sanitizedInput.showDonorList !== undefined) {
    updateData.showDonorList = sanitizedInput.showDonorList;
  }
  if (sanitizedInput.allowAnonymous !== undefined) {
    updateData.allowAnonymous = sanitizedInput.allowAnonymous;
  }

  const settings = await prisma.paymentSettings.upsert({
    where: { tenantId },
    update: updateData,
    create: createData,
  });

  return settings;
}

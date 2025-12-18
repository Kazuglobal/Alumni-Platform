/**
 * Payment amount validation utilities
 */

// Stripe minimum for JPY
const STRIPE_MIN_AMOUNT_JPY = 50;
// Maximum allowed payment (10 million yen)
const MAX_PAYMENT_AMOUNT = 10_000_000;

// Zero-decimal currencies (no cents)
const ZERO_DECIMAL_CURRENCIES = [
  "jpy",
  "krw",
  "vnd",
  "bif",
  "clp",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vuv",
  "xaf",
  "xof",
  "xpf",
];

export class PaymentAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentAmountError";
  }
}

/**
 * Validates a payment amount
 * @param amount - Amount in the currency's standard unit (e.g., yen for JPY)
 * @returns true if valid
 * @throws PaymentAmountError if invalid
 */
export function validatePaymentAmount(amount: number): boolean {
  if (!Number.isInteger(amount)) {
    throw new PaymentAmountError("Amount must be an integer");
  }

  if (amount <= 0) {
    throw new PaymentAmountError("Amount must be positive");
  }

  if (amount < STRIPE_MIN_AMOUNT_JPY) {
    throw new PaymentAmountError(
      `Amount must be at least ${STRIPE_MIN_AMOUNT_JPY} yen`
    );
  }

  if (amount > MAX_PAYMENT_AMOUNT) {
    throw new PaymentAmountError(
      `Amount cannot exceed ${MAX_PAYMENT_AMOUNT.toLocaleString()} yen`
    );
  }

  return true;
}

export interface DonationSettings {
  minAmount: number;
  maxAmount: number;
  presets: number[];
}

/**
 * Validates a donation amount against tenant settings
 * @param amount - Donation amount
 * @param settings - Tenant donation settings
 * @returns true if valid
 * @throws PaymentAmountError if invalid
 */
export function validateDonationAmount(
  amount: number,
  settings: DonationSettings
): boolean {
  // First validate basic amount constraints
  validatePaymentAmount(amount);

  if (amount < settings.minAmount) {
    throw new PaymentAmountError(
      `Donation amount must be at least ${settings.minAmount.toLocaleString()} yen`
    );
  }

  if (amount > settings.maxAmount) {
    throw new PaymentAmountError(
      `Donation amount cannot exceed ${settings.maxAmount.toLocaleString()} yen`
    );
  }

  return true;
}

/**
 * Formats amount for Stripe API (handles zero-decimal currencies)
 * @param amount - Amount in standard currency units
 * @param currency - Currency code (e.g., 'jpy', 'usd')
 * @returns Amount in smallest currency unit (e.g., cents for USD, yen for JPY)
 */
export function formatAmountForStripe(amount: number, currency: string): number {
  const normalizedCurrency = currency.toLowerCase();

  if (ZERO_DECIMAL_CURRENCIES.includes(normalizedCurrency)) {
    return amount;
  }

  // For two-decimal currencies, multiply by 100
  return Math.round(amount * 100);
}

/**
 * Formats amount from Stripe API (handles zero-decimal currencies)
 * @param amount - Amount in smallest currency unit
 * @param currency - Currency code
 * @returns Amount in standard currency units
 */
export function formatAmountFromStripe(
  amount: number,
  currency: string
): number {
  const normalizedCurrency = currency.toLowerCase();

  if (ZERO_DECIMAL_CURRENCIES.includes(normalizedCurrency)) {
    return amount;
  }

  // For two-decimal currencies, divide by 100
  return amount / 100;
}

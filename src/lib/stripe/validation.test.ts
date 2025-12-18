import { describe, expect, it } from "vitest";
import {
  validatePaymentAmount,
  validateDonationAmount,
  formatAmountForStripe,
  formatAmountFromStripe,
  PaymentAmountError,
} from "./validation";

describe("validatePaymentAmount", () => {
  it("accepts valid positive integer amounts", () => {
    expect(validatePaymentAmount(1000)).toBe(true);
    expect(validatePaymentAmount(5000)).toBe(true);
    expect(validatePaymentAmount(100000)).toBe(true);
  });

  it("rejects zero or negative amounts", () => {
    expect(() => validatePaymentAmount(0)).toThrow(PaymentAmountError);
    expect(() => validatePaymentAmount(-1000)).toThrow(PaymentAmountError);
  });

  it("rejects non-integer amounts", () => {
    expect(() => validatePaymentAmount(1000.5)).toThrow(PaymentAmountError);
    expect(() => validatePaymentAmount(99.99)).toThrow(PaymentAmountError);
  });

  it("rejects amounts exceeding maximum (10,000,000 yen)", () => {
    expect(() => validatePaymentAmount(10_000_001)).toThrow(PaymentAmountError);
    expect(() => validatePaymentAmount(100_000_000)).toThrow(PaymentAmountError);
  });

  it("accepts maximum allowed amount", () => {
    expect(validatePaymentAmount(10_000_000)).toBe(true);
  });

  it("rejects amounts below minimum (50 yen for Stripe Japan)", () => {
    expect(() => validatePaymentAmount(49)).toThrow(PaymentAmountError);
    expect(validatePaymentAmount(50)).toBe(true);
  });
});

describe("validateDonationAmount", () => {
  const defaultSettings = {
    minAmount: 1000,
    maxAmount: 1_000_000,
    presets: [1000, 3000, 5000, 10000],
  };

  it("accepts amounts within configured range", () => {
    expect(validateDonationAmount(1000, defaultSettings)).toBe(true);
    expect(validateDonationAmount(5000, defaultSettings)).toBe(true);
    expect(validateDonationAmount(500000, defaultSettings)).toBe(true);
  });

  it("rejects amounts below minimum", () => {
    expect(() => validateDonationAmount(999, defaultSettings)).toThrow(
      PaymentAmountError
    );
    expect(() => validateDonationAmount(500, defaultSettings)).toThrow(
      PaymentAmountError
    );
  });

  it("rejects amounts above maximum", () => {
    expect(() => validateDonationAmount(1_000_001, defaultSettings)).toThrow(
      PaymentAmountError
    );
  });

  it("accepts preset amounts", () => {
    defaultSettings.presets.forEach((preset) => {
      expect(validateDonationAmount(preset, defaultSettings)).toBe(true);
    });
  });

  it("handles custom min/max settings", () => {
    const customSettings = {
      minAmount: 500,
      maxAmount: 50000,
      presets: [1000, 5000],
    };

    expect(validateDonationAmount(500, customSettings)).toBe(true);
    expect(validateDonationAmount(50000, customSettings)).toBe(true);
    expect(() => validateDonationAmount(499, customSettings)).toThrow();
    expect(() => validateDonationAmount(50001, customSettings)).toThrow();
  });
});

describe("formatAmountForStripe", () => {
  it("returns the same value for JPY (zero-decimal currency)", () => {
    expect(formatAmountForStripe(1000, "jpy")).toBe(1000);
    expect(formatAmountForStripe(5000, "jpy")).toBe(5000);
    expect(formatAmountForStripe(100, "jpy")).toBe(100);
  });

  it("converts to cents for USD (two-decimal currency)", () => {
    expect(formatAmountForStripe(10, "usd")).toBe(1000);
    expect(formatAmountForStripe(99, "usd")).toBe(9900);
  });

  it("handles currency case-insensitively", () => {
    expect(formatAmountForStripe(1000, "JPY")).toBe(1000);
    expect(formatAmountForStripe(1000, "Jpy")).toBe(1000);
  });
});

describe("formatAmountFromStripe", () => {
  it("returns the same value for JPY (zero-decimal currency)", () => {
    expect(formatAmountFromStripe(1000, "jpy")).toBe(1000);
    expect(formatAmountFromStripe(5000, "jpy")).toBe(5000);
  });

  it("converts from cents for USD (two-decimal currency)", () => {
    expect(formatAmountFromStripe(1000, "usd")).toBe(10);
    expect(formatAmountFromStripe(9900, "usd")).toBe(99);
  });
});

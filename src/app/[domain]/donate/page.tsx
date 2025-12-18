"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/stripe/stats";

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
}

interface PaymentSettings {
  donationEnabled: boolean;
  donationMinAmount: number;
  donationMaxAmount: number;
  donationPresets: number[];
  allowAnonymous: boolean;
}

export default function DonatePage() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tenant and settings
  useEffect(() => {
    async function loadData() {
      try {
        // Get tenant
        const tenantRes = await fetch(`/api/tenant?domain=${domain}`);
        if (!tenantRes.ok) {
          router.push(`/${domain}`);
          return;
        }
        const tenantData = await tenantRes.json();
        setTenant(tenantData);

        // Get payment settings
        const settingsRes = await fetch(
          `/api/payment-settings?tenantId=${tenantData.id}`
        );
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);

          if (!settingsData.donationEnabled) {
            router.push(`/${domain}`);
            return;
          }

          // Set default amount to first preset
          if (settingsData.donationPresets?.length > 0) {
            setSelectedAmount(settingsData.donationPresets[0]);
          }
        }
      } catch {
        console.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [domain, router]);

  const getAmount = () => {
    if (selectedAmount === -1) {
      return parseInt(customAmount, 10) || 0;
    }
    return selectedAmount || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const amount = getAmount();
    if (amount <= 0) {
      setError("金額を入力してください");
      return;
    }

    if (settings) {
      if (amount < settings.donationMinAmount) {
        setError(`最小金額は${formatCurrency(settings.donationMinAmount)}です`);
        return;
      }
      if (amount > settings.donationMaxAmount) {
        setError(`最大金額は${formatCurrency(settings.donationMaxAmount)}です`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DONATION",
          amount,
          tenantId: tenant.id,
          description: message || undefined,
          isAnonymous,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!settings?.donationEnabled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
              <Heart className="h-7 w-7 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900">
              {tenant?.name}への寄付
            </h1>
            <p className="mt-2 text-surface-600">
              皆様のご支援が活動の力になります
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-surface-700">
                寄付金額を選択
              </label>
              <div className="grid grid-cols-2 gap-3">
                {settings?.donationPresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={`rounded-lg border-2 py-3 text-center font-medium transition-colors ${
                      selectedAmount === amount
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 text-surface-700 hover:border-surface-300"
                    }`}
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedAmount(-1)}
                  className={`col-span-2 rounded-lg border-2 py-3 text-center font-medium transition-colors ${
                    selectedAmount === -1
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-surface-200 text-surface-700 hover:border-surface-300"
                  }`}
                >
                  その他の金額
                </button>
              </div>

              {selectedAmount === -1 && (
                <div className="mt-3">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500">
                      ¥
                    </span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="金額を入力"
                      min={settings?.donationMinAmount || 0}
                      max={settings?.donationMaxAmount || 10000000}
                      className="w-full rounded-lg border border-surface-300 py-3 pl-8 pr-4 text-lg focus:border-brand-500 focus:ring-brand-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-surface-500">
                    {formatCurrency(settings?.donationMinAmount || 0)} 〜{" "}
                    {formatCurrency(settings?.donationMaxAmount || 10000000)}
                  </p>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700">
                メッセージ（任意）
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-surface-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500"
                placeholder="応援メッセージがあればお書きください"
              />
            </div>

            {/* Anonymous option */}
            {settings?.allowAnonymous && (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-700">
                  匿名で寄付する
                </span>
              </label>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || getAmount() <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-4 font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5" />
                  {getAmount() > 0
                    ? `${formatCurrency(getAmount())} を寄付する`
                    : "寄付する"}
                </>
              )}
            </button>

            <p className="text-center text-xs text-surface-400">
              Stripeによる安全な決済
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

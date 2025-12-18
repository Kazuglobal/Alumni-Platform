"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/stripe/stats";

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
}

interface PaymentSettings {
  annualFeeEnabled: boolean;
  annualFeeAmount: number;
  annualFeeDescription: string | null;
}

export default function AnnualFeePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
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

          if (!settingsData.annualFeeEnabled) {
            router.push(`/${domain}`);
            return;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !settings) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ANNUAL_FEE",
          amount: settings.annualFeeAmount,
          tenantId: tenant.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/${domain}/login?redirect=/membership/pay`);
          return;
        }
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

  if (!settings?.annualFeeEnabled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-50 py-12">
      <div className="mx-auto max-w-lg px-4">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
              <CreditCard className="h-7 w-7 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900">
              年会費のお支払い
            </h1>
            <p className="mt-2 text-surface-600">{tenant?.name}</p>
          </div>

          {/* Payment details */}
          <div className="mb-8 rounded-xl bg-surface-50 p-6">
            <div className="flex items-center justify-between">
              <span className="text-surface-600">年会費</span>
              <span className="text-2xl font-bold text-surface-900">
                {formatCurrency(settings.annualFeeAmount)}
              </span>
            </div>
            {settings.annualFeeDescription && (
              <p className="mt-4 text-sm text-surface-500">
                {settings.annualFeeDescription}
              </p>
            )}
          </div>

          {/* Notice */}
          <div className="mb-6 flex gap-3 rounded-lg bg-amber-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">ログインが必要です</p>
              <p className="mt-1">
                年会費のお支払いにはログインが必要です。
                未ログインの場合はログイン画面に移動します。
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Error */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-4 font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  {formatCurrency(settings.annualFeeAmount)} を支払う
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-surface-400">
              Stripeによる安全な決済
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

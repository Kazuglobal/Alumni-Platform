"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import {
  getPaymentSettingsAction,
  updatePaymentSettingsAction,
} from "../actions";

interface PaymentSettings {
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

const DEFAULT_SETTINGS: PaymentSettings = {
  annualFeeEnabled: false,
  annualFeeAmount: 5000,
  annualFeeDescription: null,
  donationEnabled: false,
  donationMinAmount: 1000,
  donationMaxAmount: 1000000,
  donationPresets: [1000, 3000, 5000, 10000],
  showDonorList: false,
  allowAnonymous: true,
};

export default function PaymentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get tenantId from domain
  useEffect(() => {
    async function fetchTenantId() {
      try {
        const res = await fetch(`/api/tenant?domain=${domain}`);
        if (res.ok) {
          const data = await res.json();
          setTenantId(data.id);
        }
      } catch {
        console.error("Failed to fetch tenant");
      }
    }
    fetchTenantId();
  }, [domain]);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      if (!tenantId) return;

      try {
        const result = await getPaymentSettingsAction(tenantId);
        if (result.success && result.data) {
          setSettings(result.data as PaymentSettings);
        }
      } catch {
        console.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updatePaymentSettingsAction(tenantId, settings);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "保存に失敗しました");
      }
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handlePresetChange = (index: number, value: string) => {
    const newPresets = [...settings.donationPresets];
    newPresets[index] = parseInt(value, 10) || 0;
    setSettings({ ...settings, donationPresets: newPresets });
  };

  const addPreset = () => {
    if (settings.donationPresets.length < 6) {
      setSettings({
        ...settings,
        donationPresets: [...settings.donationPresets, 10000],
      });
    }
  };

  const removePreset = (index: number) => {
    if (settings.donationPresets.length > 1) {
      const newPresets = settings.donationPresets.filter((_, i) => i !== index);
      setSettings({ ...settings, donationPresets: newPresets });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/${domain}/admin/payments`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          支払い管理に戻る
        </Link>
        <h1 className="text-2xl font-bold text-surface-900">支払い設定</h1>
        <p className="mt-1 text-surface-500">
          年会費・寄付の受付設定を管理します
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Annual Fee Settings */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-surface-900">
            年会費設定
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.annualFeeEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    annualFeeEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-surface-700">
                年会費の受付を有効にする
              </span>
            </label>

            {settings.annualFeeEnabled && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">
                    年会費金額
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                      ¥
                    </span>
                    <input
                      type="number"
                      value={settings.annualFeeAmount}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          annualFeeAmount: parseInt(e.target.value, 10) || 0,
                        })
                      }
                      min={0}
                      className="w-full rounded-lg border border-surface-300 py-2 pl-8 pr-4 focus:border-brand-500 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-surface-700">
                    説明文（任意）
                  </label>
                  <textarea
                    value={settings.annualFeeDescription || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        annualFeeDescription: e.target.value || null,
                      })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-surface-300 px-4 py-2 focus:border-brand-500 focus:ring-brand-500"
                    placeholder="支払いページに表示する説明文"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Donation Settings */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-surface-900">
            寄付設定
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.donationEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    donationEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-surface-700">
                寄付の受付を有効にする
              </span>
            </label>

            {settings.donationEnabled && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-surface-700">
                      最小金額
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                        ¥
                      </span>
                      <input
                        type="number"
                        value={settings.donationMinAmount}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            donationMinAmount: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        min={0}
                        className="w-full rounded-lg border border-surface-300 py-2 pl-8 pr-4 focus:border-brand-500 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-surface-700">
                      最大金額
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
                        ¥
                      </span>
                      <input
                        type="number"
                        value={settings.donationMaxAmount}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            donationMaxAmount:
                              parseInt(e.target.value, 10) || 0,
                          })
                        }
                        min={0}
                        className="w-full rounded-lg border border-surface-300 py-2 pl-8 pr-4 focus:border-brand-500 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-surface-700">
                    金額プリセット
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {settings.donationPresets.map((preset, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-surface-500">
                            ¥
                          </span>
                          <input
                            type="number"
                            value={preset}
                            onChange={(e) =>
                              handlePresetChange(index, e.target.value)
                            }
                            className="w-28 rounded-lg border border-surface-300 py-1.5 pl-6 pr-2 text-sm focus:border-brand-500 focus:ring-brand-500"
                          />
                        </div>
                        {settings.donationPresets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePreset(index)}
                            className="text-surface-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {settings.donationPresets.length < 6 && (
                      <button
                        type="button"
                        onClick={addPreset}
                        className="rounded-lg border border-dashed border-surface-300 px-3 py-1.5 text-sm text-surface-500 hover:border-brand-500 hover:text-brand-500"
                      >
                        + 追加
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t border-surface-100 pt-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.allowAnonymous}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          allowAnonymous: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-surface-700">
                      匿名での寄付を許可する
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={settings.showDonorList}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          showDonorList: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm font-medium text-surface-700">
                      寄付者一覧を公開する
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-600">
            設定を保存しました
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${domain}/admin/payments`)}
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存
          </button>
        </div>
      </form>
    </div>
  );
}

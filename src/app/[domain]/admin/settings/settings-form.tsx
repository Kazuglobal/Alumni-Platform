"use client";

import { useState } from "react";
import { Loader2, CheckCircle, Save } from "lucide-react";
import { updateTenant, type UpdateTenantInput } from "./actions";

type SettingsFormProps = {
  tenantId: string;
  initialData: {
    name: string;
    description: string | null;
    contactEmail: string | null;
    contactName: string | null;
    logoUrl: string | null;
  };
};

export function SettingsForm({ tenantId, initialData }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description || "");
  const [contactEmail, setContactEmail] = useState(initialData.contactEmail || "");
  const [contactName, setContactName] = useState(initialData.contactName || "");
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError(null);
    setSuccess(false);

    const data: UpdateTenantInput = {
      name,
      description,
      contactEmail,
      contactName,
      logoUrl,
    };

    const result = await updateTenant(tenantId, data);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      if (result.error && "fieldErrors" in result.error) {
        setErrors(result.error.fieldErrors as Record<string, string[]>);
      }
      if (result.error && "formErrors" in result.error) {
        setFormError((result.error.formErrors as string[])[0]);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4" />
          設定を保存しました
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-surface-900">基本情報</h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              同窓会名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`h-10 w-full rounded-lg border px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                errors.name
                  ? "border-red-300 focus:border-red-300"
                  : "border-surface-200 focus:border-brand-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="同窓会の紹介文を入力してください"
              className="w-full rounded-lg border border-surface-200 px-4 py-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="logoUrl"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              ロゴURL
            </label>
            <input
              type="url"
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="h-10 w-full rounded-lg border border-surface-200 px-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {errors.logoUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.logoUrl[0]}</p>
            )}
            {logoUrl && (
              <div className="mt-2">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-16 w-auto rounded border border-surface-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-surface-900">連絡先情報</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contactName"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              担当者名
            </label>
            <input
              type="text"
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="山田太郎"
              className="h-10 w-full rounded-lg border border-surface-200 px-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {errors.contactName && (
              <p className="mt-1 text-sm text-red-600">{errors.contactName[0]}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              連絡先メールアドレス
            </label>
            <input
              type="email"
              id="contactEmail"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
              className="h-10 w-full rounded-lg border border-surface-200 px-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactEmail[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          保存
        </button>
      </div>
    </form>
  );
}

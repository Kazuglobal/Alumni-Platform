"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { updateTenant } from "../actions";
import { TemplateSelector } from "@/components/templates";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates/definitions";
import type { Tenant } from "@prisma/client";

export function TenantEditForm({ tenant }: { tenant: Tenant }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(
    tenant.templateId ?? DEFAULT_TEMPLATE_ID
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: tenant.id,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactName: formData.get("contactName") as string,
      templateId: selectedTemplate,
    };

    const result = await updateTenant(data);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      if (result.error && "fieldErrors" in result.error) {
        setErrors(result.error.fieldErrors as Record<string, string[]>);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-lg font-semibold text-surface-900">
          基本情報
        </h3>

        <div className="space-y-4">
          {/* テナント名 */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              テナント名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={tenant.name}
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

          {/* サブドメイン（変更不可） */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700">
              サブドメイン
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={tenant.subdomain}
                disabled
                className="h-10 flex-1 rounded-l-lg border-y border-l border-surface-200 bg-surface-50 px-4 text-sm text-surface-500"
              />
              <span className="flex h-10 items-center rounded-r-lg border border-surface-200 bg-surface-50 px-3 text-sm text-surface-500">
                .localhost:3000
              </span>
            </div>
            <p className="mt-1 text-sm text-surface-500">
              サブドメインは変更できません
            </p>
          </div>

          {/* 説明 */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              説明
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={tenant.description || ""}
              placeholder="同窓会の概要を入力してください..."
              className="w-full rounded-lg border border-surface-200 px-4 py-3 text-sm transition-colors focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>

      {/* テンプレート選択 */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-lg font-semibold text-surface-900">
          テンプレート
        </h3>
        <p className="mb-4 text-sm text-surface-500">
          同窓会サイトのデザインテンプレートを変更できます
        </p>
        <TemplateSelector
          value={selectedTemplate}
          onChange={setSelectedTemplate}
          disabled={isSubmitting}
        />
      </div>

      {/* 連絡先 */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-display text-lg font-semibold text-surface-900">
          連絡先情報
        </h3>

        <div className="space-y-4">
          {/* 担当者名 */}
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
              name="contactName"
              defaultValue={tenant.contactName || ""}
              placeholder="山田 太郎"
              className="h-10 w-full rounded-lg border border-surface-200 px-4 text-sm transition-colors focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label
              htmlFor="contactEmail"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              メールアドレス
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              defaultValue={tenant.contactEmail || ""}
              placeholder="contact@example.com"
              className={`h-10 w-full rounded-lg border px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                errors.contactEmail
                  ? "border-red-300 focus:border-red-300"
                  : "border-surface-200 focus:border-brand-300"
              }`}
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactEmail[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex items-center justify-between">
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            保存しました
          </div>
        )}
        <div className="ml-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "変更を保存"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

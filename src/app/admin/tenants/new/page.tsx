"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2, CheckCircle } from "lucide-react";
import { createTenant } from "../actions";
import { createTenantSchema } from "../schema";
import { TemplateSelector } from "@/components/templates";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates/definitions";

export default function NewTenantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE_ID);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      subdomain: formData.get("subdomain") as string,
      description: formData.get("description") as string,
      contactEmail: formData.get("contactEmail") as string,
      contactName: formData.get("contactName") as string,
      templateId: selectedTemplate,
    };

    // クライアントサイドバリデーション
    const validated = createTenantSchema.safeParse(data);
    if (!validated.success) {
      setErrors(validated.error.flatten().fieldErrors as Record<string, string[]>);
      setIsSubmitting(false);
      return;
    }

    const result = await createTenant(data);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/tenants");
      }, 1500);
    } else {
      if (result.error && "fieldErrors" in result.error) {
        setErrors(result.error.fieldErrors as Record<string, string[]>);
      }
      if (result.error && "formErrors" in result.error) {
        setFormError((result.error.formErrors as string[])[0]);
      }
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="animate-fade-in flex flex-col items-center text-center">
          <div className="rounded-full bg-emerald-100 p-4">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-surface-900">
            テナントを作成しました
          </h2>
          <p className="mt-2 text-surface-500">一覧ページにリダイレクトします...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* 戻るボタン */}
      <Link
        href="/admin/tenants"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
      >
        <ArrowLeft className="h-4 w-4" />
        テナント一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-surface-900">
              新規テナント作成
            </h2>
            <p className="mt-1 text-sm text-surface-500">
              新しい同窓会テナントを作成します
            </p>
          </div>
        </div>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {formError}
          </div>
        )}

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
                placeholder="〇〇高校同窓会"
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

            {/* サブドメイン */}
            <div>
              <label
                htmlFor="subdomain"
                className="mb-1.5 block text-sm font-medium text-surface-700"
              >
                サブドメイン <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  required
                  placeholder="example-alumni"
                  pattern="^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
                  className={`h-10 flex-1 rounded-l-lg border-y border-l px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                    errors.subdomain
                      ? "border-red-300 focus:border-red-300"
                      : "border-surface-200 focus:border-brand-300"
                  }`}
                />
                <span className="flex h-10 items-center rounded-r-lg border border-surface-200 bg-surface-50 px-3 text-sm text-surface-500">
                  .localhost:3000
                </span>
              </div>
              {errors.subdomain ? (
                <p className="mt-1 text-sm text-red-600">{errors.subdomain[0]}</p>
              ) : (
                <p className="mt-1 text-sm text-surface-500">
                  小文字英数字とハイフンのみ使用可能
                </p>
              )}
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
                placeholder="同窓会の概要を入力してください..."
                className="w-full rounded-lg border border-surface-200 px-4 py-3 text-sm transition-colors focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>

        {/* テンプレート選択 */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-surface-900">
            テンプレート選択
          </h3>
          <p className="mb-4 text-sm text-surface-500">
            同窓会サイトのデザインテンプレートを選択してください
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
                placeholder="contact@example.com"
                className={`h-10 w-full rounded-lg border px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                  errors.contactEmail
                    ? "border-red-300 focus:border-red-300"
                    : "border-surface-200 focus:border-brand-300"
                }`}
              />
              {errors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactEmail[0]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/tenants"
            className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                作成中...
              </>
            ) : (
              "テナントを作成"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

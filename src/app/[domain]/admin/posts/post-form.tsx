"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Save,
  Eye,
  Clock,
  Send,
} from "lucide-react";
import { RichTextEditor } from "@/components/editor";
import { generateSlug } from "@/lib/posts/sanitize";
import { createPost, updatePost } from "./actions";
import type { Post, Category } from "@prisma/client";

type PostFormProps = {
  tenantId: string;
  authorId: string;
  categories: Category[];
  post?: Post | null;
};

export function PostForm({ tenantId, authorId, categories, post }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [status, setStatus] = useState<"DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED">(
    post?.status ?? "DRAFT"
  );
  const [visibility, setVisibility] = useState<"PUBLIC" | "MEMBERS" | "PRIVATE">(
    post?.visibility ?? "PUBLIC"
  );
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "");

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing && !slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (submitStatus?: "DRAFT" | "PUBLISHED") => {
    setIsSubmitting(true);
    setErrors({});
    setFormError(null);

    const finalStatus = submitStatus ?? status;

    const data = {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      status: finalStatus,
      visibility,
      scheduledAt: finalStatus === "SCHEDULED" ? scheduledAt : "",
      categoryId,
    };

    const result = isEditing
      ? await updatePost(tenantId, { ...data, id: post.id })
      : await createPost(tenantId, authorId, data);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/posts");
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
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-emerald-100 p-4">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-surface-900">
            {isEditing ? "記事を更新しました" : "記事を作成しました"}
          </h2>
          <p className="mt-2 text-surface-500">
            一覧ページにリダイレクトします...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/posts"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
      >
        <ArrowLeft className="h-4 w-4" />
        記事一覧に戻る
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">
          {isEditing ? "記事を編集" : "新規記事作成"}
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          {isEditing ? "記事の内容を編集します" : "新しい会報記事を作成します"}
        </p>
      </div>

      {formError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-1.5 block text-sm font-medium text-surface-700"
              >
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="記事のタイトルを入力"
                className={`h-12 w-full rounded-lg border px-4 text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                  errors.title
                    ? "border-red-300 focus:border-red-300"
                    : "border-surface-200 focus:border-brand-300"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title[0]}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="slug"
                className="mb-1.5 block text-sm font-medium text-surface-700"
              >
                スラッグ <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-surface-200 bg-surface-50 px-3 text-sm text-surface-500">
                  /news/
                </span>
                <input
                  type="text"
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="article-slug"
                  className={`h-10 flex-1 rounded-r-lg border px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 ${
                    errors.slug
                      ? "border-red-300 focus:border-red-300"
                      : "border-surface-200 focus:border-brand-300"
                  }`}
                />
              </div>
              {errors.slug ? (
                <p className="mt-1 text-sm text-red-600">{errors.slug[0]}</p>
              ) : (
                <p className="mt-1 text-sm text-surface-500">
                  URLに使用される識別子（小文字英数字とハイフンのみ）
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <label className="mb-3 block text-sm font-medium text-surface-700">
            本文 <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="記事の本文を入力してください..."
            disabled={isSubmitting}
          />
          {errors.content && (
            <p className="mt-2 text-sm text-red-600">{errors.content[0]}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            記事設定
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="mb-1.5 block text-sm font-medium text-surface-700"
              >
                カテゴリ
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-lg border border-surface-200 px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">カテゴリなし</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label
                htmlFor="visibility"
                className="mb-1.5 block text-sm font-medium text-surface-700"
              >
                公開範囲
              </label>
              <select
                id="visibility"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "PUBLIC" | "MEMBERS" | "PRIVATE")
                }
                className="h-10 w-full rounded-lg border border-surface-200 px-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="PUBLIC">全員に公開</option>
                <option value="MEMBERS">会員のみ</option>
                <option value="PRIVATE">非公開（プレビュー用）</option>
              </select>
            </div>

            {/* Cover Image */}
            <div className="sm:col-span-2">
              <label
                htmlFor="coverImage"
                className="mb-1.5 block text-sm font-medium text-surface-700"
              >
                カバー画像URL
              </label>
              <input
                type="url"
                id="coverImage"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="h-10 w-full rounded-lg border border-surface-200 px-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {/* Excerpt */}
            <div className="sm:col-span-2">
              <label
                htmlFor="excerpt"
                className="mb-1.5 block text-sm font-medium text-surface-700"
              >
                抜粋
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="記事の概要（空欄の場合は自動生成）"
                className="w-full rounded-lg border border-surface-200 px-4 py-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>

        {/* Scheduling */}
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            公開設定
          </h3>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={status === "DRAFT"}
                  onChange={() => setStatus("DRAFT")}
                  className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-700">下書き</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={status === "PUBLISHED"}
                  onChange={() => setStatus("PUBLISHED")}
                  className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-700">すぐに公開</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="SCHEDULED"
                  checked={status === "SCHEDULED"}
                  onChange={() => setStatus("SCHEDULED")}
                  className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-surface-700">予約公開</span>
              </label>
            </div>

            {status === "SCHEDULED" && (
              <div>
                <label
                  htmlFor="scheduledAt"
                  className="mb-1.5 block text-sm font-medium text-surface-700"
                >
                  公開日時
                </label>
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="h-10 w-full max-w-xs rounded-lg border border-surface-200 px-4 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <Link
            href="/admin/posts"
            className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            キャンセル
          </Link>

          <div className="flex items-center gap-3">
            {/* Save as draft */}
            <button
              type="button"
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              下書き保存
            </button>

            {/* Publish */}
            <button
              type="button"
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              公開する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

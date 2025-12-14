import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Calendar,
  Mail,
  User,
  Clock,
  Palette,
} from "lucide-react";
import { prisma } from "@/lib/db/client";
import { TenantEditForm } from "./tenant-edit-form";
import { TenantActions } from "./tenant-actions";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "@/lib/templates/definitions";

export const dynamic = "force-dynamic";

async function getTenant(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const tenant = await getTenant(params.id);

  if (!tenant || tenant.status === "DELETED") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 戻るボタン */}
      <Link
        href="/admin/tenants"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
      >
        <ArrowLeft className="h-4 w-4" />
        テナント一覧に戻る
      </Link>

      {/* ヘッダー */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 font-display text-xl font-semibold text-brand-700">
            {tenant.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-surface-900">
              {tenant.name}
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <code className="rounded bg-surface-100 px-2 py-0.5 text-sm text-surface-700">
                {tenant.subdomain}.localhost:3000
              </code>
              <a
                href={`http://${tenant.subdomain}.localhost:3000`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand-600 transition-colors hover:text-brand-700"
              >
                サイトを表示
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              tenant.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700"
                : tenant.status === "PENDING"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-surface-100 text-surface-600"
            }`}
          >
            {tenant.status === "ACTIVE"
              ? "有効"
              : tenant.status === "PENDING"
                ? "準備中"
                : "停止中"}
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* メイン（左側） */}
        <div className="space-y-6 lg:col-span-2">
          {/* 編集フォーム */}
          <TenantEditForm tenant={tenant} />
        </div>

        {/* サイドバー（右側） */}
        <div className="space-y-6">
          {/* テナント情報 */}
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-display text-lg font-semibold text-surface-900">
              テナント情報
            </h3>
            <div className="space-y-4">
              {/* テンプレート */}
              {(() => {
                const template = getTemplateById(tenant.templateId ?? DEFAULT_TEMPLATE_ID);
                return template ? (
                  <div className="flex items-center gap-3 text-sm">
                    <Palette className="h-4 w-4 text-surface-400" />
                    <div>
                      <p className="text-surface-500">テンプレート</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: template.theme.primaryColor }}
                        />
                        <p className="font-medium text-surface-900">
                          {template.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-surface-400" />
                <div>
                  <p className="text-surface-500">作成日</p>
                  <p className="font-medium text-surface-900">
                    {new Date(tenant.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-surface-400" />
                <div>
                  <p className="text-surface-500">最終更新</p>
                  <p className="font-medium text-surface-900">
                    {new Date(tenant.updatedAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              {tenant.contactName && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-surface-500">担当者</p>
                    <p className="font-medium text-surface-900">
                      {tenant.contactName}
                    </p>
                  </div>
                </div>
              )}
              {tenant.contactEmail && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="text-surface-500">メール</p>
                    <p className="font-medium text-surface-900">
                      {tenant.contactEmail}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* アクション */}
          <TenantActions tenant={tenant} />

          {/* 監査ログ */}
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-display text-lg font-semibold text-surface-900">
              最近のアクティビティ
            </h3>
            {tenant.auditLogs.length > 0 ? (
              <div className="space-y-3">
                {tenant.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 border-b border-surface-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full ${
                        log.action === "created"
                          ? "bg-emerald-500"
                          : log.action === "updated"
                            ? "bg-blue-500"
                            : log.action === "suspended"
                              ? "bg-amber-500"
                              : log.action === "activated"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-surface-700">
                        {log.action === "created"
                          ? "テナントが作成されました"
                          : log.action === "updated"
                            ? "テナント情報が更新されました"
                            : log.action === "suspended"
                              ? "テナントが停止されました"
                              : log.action === "activated"
                                ? "テナントが有効化されました"
                                : "テナントが削除されました"}
                      </p>
                      <p className="text-xs text-surface-500">
                        {new Date(log.createdAt).toLocaleDateString("ja-JP", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500">アクティビティはありません</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { suspendTenant, activateTenant, deleteTenant } from "../actions";
import type { Tenant } from "@prisma/client";

export function TenantActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSuspend = async () => {
    setIsLoading("suspend");
    await suspendTenant(tenant.id);
    setIsLoading(null);
    router.refresh();
  };

  const handleActivate = async () => {
    setIsLoading("activate");
    await activateTenant(tenant.id);
    setIsLoading(null);
    router.refresh();
  };

  const handleDelete = async () => {
    setIsLoading("delete");
    await deleteTenant(tenant.id);
    // リダイレクトはサーバーアクションで行われる
  };

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-surface-900">
        アクション
      </h3>
      <div className="space-y-3">
        {tenant.status === "ACTIVE" ? (
          <button
            onClick={handleSuspend}
            disabled={isLoading !== null}
            className="flex w-full items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading === "suspend" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
            テナントを停止
          </button>
        ) : (
          <button
            onClick={handleActivate}
            disabled={isLoading !== null}
            className="flex w-full items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading === "activate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            テナントを有効化
          </button>
        )}

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading !== null}
            className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            テナントを削除
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-800">本当に削除しますか？</p>
                <p className="mt-1 text-sm text-red-600">
                  この操作は取り消せません。テナントのすべてのデータが削除されます。
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "削除する"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

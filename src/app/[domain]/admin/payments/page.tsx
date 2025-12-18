"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Download,
  Filter,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getPayments, getPaymentStats, exportPaymentsCsv } from "./actions";
import { formatCurrency } from "@/lib/stripe/stats";
import type { PaymentStatus, PaymentType, Payment } from "@prisma/client";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "処理待ち",
  PROCESSING: "処理中",
  COMPLETED: "完了",
  FAILED: "失敗",
  REFUNDED: "返金済",
  PARTIALLY_REFUNDED: "一部返金",
  EXPIRED: "期限切れ",
  CANCELED: "キャンセル",
};

const TYPE_LABELS: Record<PaymentType, string> = {
  ANNUAL_FEE: "年会費",
  DONATION: "寄付",
  EVENT_FEE: "イベント参加費",
  OTHER: "その他",
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
  PARTIALLY_REFUNDED: "bg-purple-100 text-purple-700",
  EXPIRED: "bg-surface-100 text-surface-600",
  CANCELED: "bg-surface-100 text-surface-600",
};

interface StatsData {
  totalAmount: number;
  totalCount: number;
  byType?: Array<{
    type: PaymentType;
    amount: number;
    count: number;
  }>;
  comparison?: {
    amountChange: number;
    countChange: number;
  };
}

export default function PaymentsPage() {
  const params = useParams();
  const domain = params.domain as string;
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "">("");
  const [loading, setLoading] = useState(true);

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

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    try {
      const [paymentsResult, statsResult] = await Promise.all([
        getPayments(tenantId, {
          page,
          limit: 20,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
        }),
        getPaymentStats(tenantId, {
          comparePrevious: true,
        }),
      ]);

      if (paymentsResult.success && paymentsResult.data) {
        setPayments(paymentsResult.data.payments);
        setTotalPages(paymentsResult.data.totalPages);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    if (!tenantId) return;
    const result = await exportPaymentsCsv(tenantId, {
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    });

    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">支払い管理</h1>
          <p className="mt-1 text-surface-500">
            年会費・寄付・イベント参加費の管理
          </p>
        </div>
        <Link
          href={`/${domain}/admin/payments/settings`}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50"
        >
          <Settings className="h-4 w-4" />
          支払い設定
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-emerald-100 p-3">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
                <p className="text-sm text-surface-500">総収入</p>
                {stats.comparison && stats.comparison.amountChange !== 0 && (
                  <p
                    className={`text-xs ${
                      stats.comparison.amountChange > 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {stats.comparison.amountChange > 0 ? "+" : ""}
                    {stats.comparison.amountChange}% 前期比
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {stats.totalCount}
                </p>
                <p className="text-sm text-surface-500">総取引数</p>
              </div>
            </div>
          </div>

          {stats.byType?.find((t) => t.type === "ANNUAL_FEE") && (
            <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-brand-100 p-3">
                  <Users className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">
                    {formatCurrency(
                      stats.byType.find((t) => t.type === "ANNUAL_FEE")
                        ?.amount || 0
                    )}
                  </p>
                  <p className="text-sm text-surface-500">年会費</p>
                </div>
              </div>
            </div>
          )}

          {stats.byType?.find((t) => t.type === "DONATION") && (
            <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-100 p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">
                    {formatCurrency(
                      stats.byType.find((t) => t.type === "DONATION")?.amount ||
                        0
                    )}
                  </p>
                  <p className="text-sm text-surface-500">寄付</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-surface-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PaymentStatus | "");
              setPage(1);
            }}
            className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">すべてのステータス</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as PaymentType | "");
              setPage(1);
            }}
            className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">すべての種別</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExport}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50"
        >
          <Download className="h-4 w-4" />
          CSVエクスポート
        </button>
      </div>

      {/* Payments table */}
      <div className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-surface-200">
          <thead className="bg-surface-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                日付
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                種別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                支払者
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-surface-500">
                金額
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-surface-500">
                ステータス
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-surface-300" />
                  <p className="mt-3 text-surface-500">
                    まだ支払い履歴がありません
                  </p>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-surface-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-surface-900">
                    {new Date(payment.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-surface-600">
                    {TYPE_LABELS[payment.type]}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600">
                    {payment.isAnonymous ? (
                      <span className="italic text-surface-400">匿名</span>
                    ) : (
                      <div>
                        <p className="font-medium text-surface-900">
                          {payment.payerName || "-"}
                        </p>
                        <p className="text-xs text-surface-500">
                          {payment.payerEmail}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-surface-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[payment.status]}`}
                    >
                      {STATUS_LABELS[payment.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-200 bg-surface-50 px-6 py-3">
            <p className="text-sm text-surface-500">
              ページ {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                前へ
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-surface-300 bg-white px-3 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-50"
              >
                次へ
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use server";

import { prisma } from "@/lib/db/client";
import { requireTenantRole } from "@/lib/auth/session";
import { TenantRole } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import {
  getDefaultPaymentSettings,
  updatePaymentSettings,
  PaymentSettingsError,
} from "@/lib/stripe/settings";
import {
  calculatePaymentStats,
  calculateTypeBreakdown,
  calculateMonthlyBreakdown,
} from "@/lib/stripe/stats";
import type { PaymentStatus, PaymentType, Payment } from "@prisma/client";

// Types
interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface GetPaymentsOptions {
  page: number;
  limit: number;
  status?: PaymentStatus;
  type?: PaymentType;
  startDate?: Date;
  endDate?: Date;
}

interface PaymentsResult {
  payments: Payment[];
  total: number;
  page: number;
  totalPages: number;
}

// Actions
export async function getPayments(
  tenantId: string,
  options: GetPaymentsOptions
): Promise<ActionResult<PaymentsResult>> {
  try {
    await requireTenantRole(tenantId, TenantRole.EDITOR);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { page, limit, status, type, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { tenantId };

  if (status) where.status = status;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    success: true,
    data: {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPaymentById(
  tenantId: string,
  paymentId: string
): Promise<ActionResult<Payment>> {
  try {
    await requireTenantRole(tenantId, TenantRole.EDITOR);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment || payment.tenantId !== tenantId) {
    return { success: false, error: "Payment not found" };
  }

  return { success: true, data: payment };
}

interface UpdatePaymentSettingsInput {
  annualFeeEnabled?: boolean;
  annualFeeAmount?: number;
  annualFeeDescription?: string | null;
  donationEnabled?: boolean;
  donationMinAmount?: number;
  donationMaxAmount?: number;
  donationPresets?: number[];
  showDonorList?: boolean;
  allowAnonymous?: boolean;
}

export async function updatePaymentSettingsAction(
  tenantId: string,
  input: UpdatePaymentSettingsInput
): Promise<ActionResult> {
  try {
    await requireTenantRole(tenantId, TenantRole.ADMIN);
  } catch {
    return { success: false, error: "Admin role required" };
  }

  // Validate
  if (input.annualFeeAmount !== undefined && input.annualFeeAmount < 0) {
    return { success: false, error: "Annual fee amount cannot be negative" };
  }

  if (
    input.donationMinAmount !== undefined &&
    input.donationMaxAmount !== undefined &&
    input.donationMinAmount > input.donationMaxAmount
  ) {
    return {
      success: false,
      error: "Donation min amount cannot exceed max amount",
    };
  }

  try {
    const settings = await updatePaymentSettings(tenantId, input);
    revalidatePath(`/admin/payments/settings`);
    return { success: true, data: settings };
  } catch (error) {
    if (error instanceof PaymentSettingsError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update settings" };
  }
}

export async function getPaymentSettingsAction(
  tenantId: string
): Promise<ActionResult> {
  try {
    await requireTenantRole(tenantId, TenantRole.EDITOR);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const settings = await prisma.paymentSettings.findUnique({
    where: { tenantId },
  });

  if (!settings) {
    return { success: true, data: getDefaultPaymentSettings() };
  }

  return { success: true, data: settings };
}

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  status?: PaymentStatus;
  type?: PaymentType;
}

export async function exportPaymentsCsv(
  tenantId: string,
  options: ExportOptions
): Promise<ActionResult<string>> {
  try {
    await requireTenantRole(tenantId, TenantRole.ADMIN);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { startDate, endDate, status, type } = options;

  const where: Record<string, unknown> = { tenantId };

  if (status) where.status = status;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Generate CSV
  const headers = [
    "ID",
    "種別",
    "金額",
    "ステータス",
    "支払者名",
    "メール",
    "作成日",
    "完了日",
  ];

  const rows = payments.map((p) => [
    p.id,
    p.type,
    p.amount.toString(),
    p.status,
    p.isAnonymous ? "匿名" : (p.payerName || ""),
    p.isAnonymous ? "" : (p.payerEmail || ""),
    p.createdAt.toISOString(),
    p.completedAt?.toISOString() || "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return { success: true, data: csv };
}

interface GetPaymentStatsOptions {
  startDate?: Date;
  endDate?: Date;
  groupBy?: "month" | "type";
  comparePrevious?: boolean;
}

interface StatsResult {
  totalAmount: number;
  totalCount: number;
  byType?: Array<{
    type: PaymentType;
    amount: number;
    count: number;
  }>;
  byMonth?: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  comparison?: {
    amountChange: number;
    countChange: number;
  };
}

export async function getPaymentStats(
  tenantId: string,
  options: GetPaymentStatsOptions
): Promise<ActionResult<StatsResult>> {
  try {
    await requireTenantRole(tenantId, TenantRole.EDITOR);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const { startDate, endDate, groupBy, comparePrevious } = options;

  // Get current period stats
  const currentStats = await calculatePaymentStats(tenantId, {
    startDate,
    endDate,
  });

  const result: StatsResult = {
    totalAmount: currentStats.totalAmount,
    totalCount: currentStats.totalCount,
  };

  // Get type breakdown
  if (groupBy === "type" || !groupBy) {
    const typeBreakdown = await calculateTypeBreakdown(tenantId, {
      startDate,
      endDate,
    });
    result.byType = typeBreakdown.map((t) => ({
      type: t.type,
      amount: t.amount,
      count: t.count,
    }));
  }

  // Get monthly breakdown
  if (groupBy === "month") {
    const year = startDate?.getFullYear() || new Date().getFullYear();
    const monthlyBreakdown = await calculateMonthlyBreakdown(tenantId, year);
    result.byMonth = monthlyBreakdown.map((m) => ({
      month: m.month,
      amount: m.amount,
      count: m.count,
    }));
  }

  // Compare with previous period
  if (comparePrevious && startDate && endDate) {
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

    const prevStats = await calculatePaymentStats(tenantId, {
      startDate: prevStartDate,
      endDate: prevEndDate,
    });

    const amountChange =
      prevStats.totalAmount > 0
        ? Math.round(
            ((currentStats.totalAmount - prevStats.totalAmount) /
              prevStats.totalAmount) *
              100
          )
        : 0;

    const countChange =
      prevStats.totalCount > 0
        ? Math.round(
            ((currentStats.totalCount - prevStats.totalCount) /
              prevStats.totalCount) *
              100
          )
        : 0;

    result.comparison = { amountChange, countChange };
  }

  return { success: true, data: result };
}

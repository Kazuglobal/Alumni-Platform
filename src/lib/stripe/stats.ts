import { prisma } from "@/lib/db/client";
import type { PaymentStatus, PaymentType } from "@prisma/client";

export interface PaymentStatsOptions {
  startDate?: Date;
  endDate?: Date;
  status?: PaymentStatus;
}

export interface PaymentStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
}

export interface MonthlyBreakdown {
  month: string;
  label: string;
  amount: number;
  count: number;
}

export interface TypeBreakdown {
  type: PaymentType;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface DonorStats {
  topDonors: Array<{
    email: string;
    name: string | null;
    totalAmount: number;
    count: number;
  }>;
  uniqueDonorCount: number;
}

const TYPE_LABELS: Record<PaymentType, string> = {
  ANNUAL_FEE: "年会費",
  DONATION: "寄付",
  EVENT_FEE: "イベント参加費",
  OTHER: "その他",
};

const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

/**
 * Calculates aggregate payment statistics
 */
export async function calculatePaymentStats(
  tenantId: string,
  options: PaymentStatsOptions = {}
): Promise<PaymentStats> {
  const { startDate, endDate, status } = options;

  const where: Record<string, unknown> = {
    tenantId,
    status: status || "COMPLETED",
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const result = await prisma.payment.aggregate({
    where,
    _sum: { amount: true },
    _count: { id: true },
    _avg: { amount: true },
  });

  return {
    totalAmount: result._sum.amount || 0,
    totalCount: result._count.id || 0,
    averageAmount: result._avg?.amount || 0,
  };
}

/**
 * Calculates monthly breakdown for a year
 */
export async function calculateMonthlyBreakdown(
  tenantId: string,
  year: number
): Promise<MonthlyBreakdown[]> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      completedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      completedAt: true,
    },
  });

  // Initialize all months
  const monthlyData: MonthlyBreakdown[] = MONTH_LABELS.map((label, index) => ({
    month: `${year}-${String(index + 1).padStart(2, "0")}`,
    label,
    amount: 0,
    count: 0,
  }));

  // Aggregate payments by month
  for (const payment of payments) {
    if (payment.completedAt) {
      const monthIndex = payment.completedAt.getMonth();
      monthlyData[monthIndex].amount += payment.amount;
      monthlyData[monthIndex].count += 1;
    }
  }

  return monthlyData;
}

/**
 * Calculates breakdown by payment type
 */
export async function calculateTypeBreakdown(
  tenantId: string,
  options: PaymentStatsOptions = {}
): Promise<TypeBreakdown[]> {
  const { startDate, endDate } = options;

  const where: Record<string, unknown> = {
    tenantId,
    status: "COMPLETED",
  };

  if (startDate || endDate) {
    where.completedAt = {};
    if (startDate) (where.completedAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.completedAt as Record<string, Date>).lte = endDate;
  }

  const results = await prisma.payment.groupBy({
    by: ["type"],
    where,
    _sum: { amount: true },
    _count: { id: true },
  });

  if (results.length === 0) {
    return [];
  }

  const totalAmount = results.reduce(
    (sum, r) => sum + (r._sum.amount || 0),
    0
  );

  return results.map((r) => ({
    type: r.type,
    label: TYPE_LABELS[r.type],
    amount: r._sum.amount || 0,
    count: r._count.id,
    percentage:
      totalAmount > 0
        ? Math.round(((r._sum.amount || 0) / totalAmount) * 100)
        : 0,
  }));
}

export interface DonorStatsOptions {
  limit?: number;
  excludeAnonymous?: boolean;
}

/**
 * Calculates donor statistics
 */
export async function calculateDonorStats(
  tenantId: string,
  options: DonorStatsOptions = {}
): Promise<DonorStats> {
  const { limit = 10, excludeAnonymous = false } = options;

  const where: Record<string, unknown> = {
    tenantId,
    status: "COMPLETED",
    payerEmail: { not: null },
  };

  if (excludeAnonymous) {
    where.isAnonymous = false;
  }

  const groupedResults = await prisma.payment.groupBy({
    by: ["payerEmail"],
    where,
    _sum: { amount: true },
    _count: { id: true },
    orderBy: {
      _sum: {
        amount: "desc",
      },
    },
    take: limit,
  });

  // Get donor names
  const emails = groupedResults
    .map((r) => r.payerEmail)
    .filter((e): e is string => e !== null);

  const payments = await prisma.payment.findMany({
    where: {
      payerEmail: { in: emails },
      tenantId,
    },
    select: {
      payerEmail: true,
      payerName: true,
    },
    distinct: ["payerEmail"],
  });

  const nameMap = new Map(
    payments.map((p) => [p.payerEmail, p.payerName])
  );

  const topDonors = groupedResults.map((r) => ({
    email: r.payerEmail || "",
    name: nameMap.get(r.payerEmail || "") || null,
    totalAmount: r._sum.amount || 0,
    count: r._count.id,
  }));

  return {
    topDonors,
    uniqueDonorCount: groupedResults.length,
  };
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number, currency: string = "jpy"): string {
  if (currency.toLowerCase() === "jpy") {
    const formatted = Math.abs(amount).toLocaleString("ja-JP");
    return amount < 0 ? `-¥${formatted}` : `¥${formatted}`;
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

export type DateRangePeriod = "month" | "year" | "last30days" | "fiscalYear";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Gets date range for a given period
 */
export function getDateRangeForPeriod(
  period: DateRangePeriod,
  referenceDate: Date = new Date()
): DateRange {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (period) {
    case "month":
      return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 1, 0, 23, 59, 59),
      };

    case "year":
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59),
      };

    case "last30days": {
      const endDate = new Date(referenceDate);
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - 30);
      return { startDate, endDate };
    }

    case "fiscalYear": {
      // Japanese fiscal year starts April 1
      const fiscalYearStart = month >= 3 ? year : year - 1;
      return {
        startDate: new Date(fiscalYearStart, 3, 1), // April 1
        endDate: new Date(fiscalYearStart + 1, 2, 31, 23, 59, 59), // March 31
      };
    }

    default:
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59),
      };
  }
}

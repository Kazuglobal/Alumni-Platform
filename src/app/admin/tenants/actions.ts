"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantInput,
  type UpdateTenantInput,
} from "./schema";

// 監査ログ記録
async function logAudit(
  tenantId: string,
  action: string,
  actor: string,
  changes: Record<string, unknown>
) {
  await prisma.tenantAuditLog.create({
    data: {
      tenantId,
      action,
      actor,
      changes: changes as object,
    },
  });
}

// テナント作成
export async function createTenant(input: CreateTenantInput) {
  // バリデーション
  const parsed = createTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { name, subdomain, description, contactEmail, contactName, templateId } =
    parsed.data;

  // サブドメイン重複チェック
  const existing = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  if (existing) {
    return {
      success: false,
      error: {
        fieldErrors: { subdomain: ["このサブドメインは既に使用されています"] },
      },
    };
  }

  try {
    // DB作成
    const tenant = await prisma.tenant.create({
      data: {
        name,
        subdomain,
        description: description || null,
        contactEmail: contactEmail || null,
        contactName: contactName || null,
        templateId: templateId || null,
        status: "ACTIVE",
        createdBy: "admin", // TODO: 認証後に実際のユーザーIDを使用
      },
    });

    // 監査ログ
    await logAudit(tenant.id, "created", "admin", {
      name,
      subdomain,
      templateId,
    });

    revalidatePath("/admin/tenants");
    revalidatePath("/admin");

    return { success: true, data: tenant };
  } catch (error) {
    console.error("Failed to create tenant:", error);
    return {
      success: false,
      error: {
        formErrors: [
          "テナントの作成に失敗しました。しばらくしてから再試行してください。",
        ],
      },
    };
  }
}

// テナント更新
export async function updateTenant(input: UpdateTenantInput) {
  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { id, settings, ...data } = parsed.data;

  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    return { success: false, error: { formErrors: ["テナントが見つかりません"] } };
  }

  const updateData: {
    name?: string;
    description?: string | null;
    contactEmail?: string | null;
    contactName?: string | null;
    settings?: object;
  } = {
    ...(data.name && { name: data.name }),
    description: data.description || null,
    contactEmail: data.contactEmail || null,
    contactName: data.contactName || null,
  };

  if (settings) {
    updateData.settings = settings as object;
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: updateData,
  });

  await logAudit(id, "updated", "admin", { ...data, settings });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${id}`);
  revalidatePath("/admin");

  return { success: true, data: updated };
}

// テナント停止
export async function suspendTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { success: false, error: "テナントが見つかりません" };
  }

  if (tenant.status === "SUSPENDED") {
    return { success: false, error: "既に停止されています" };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "SUSPENDED" },
  });

  await logAudit(tenantId, "suspended", "admin", {
    previousStatus: tenant.status,
  });

  revalidatePath("/admin/tenants");
  revalidatePath("/admin");

  return { success: true };
}

// テナント有効化
export async function activateTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { success: false, error: "テナントが見つかりません" };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "ACTIVE" },
  });

  await logAudit(tenantId, "activated", "admin", {
    previousStatus: tenant.status,
  });

  revalidatePath("/admin/tenants");
  revalidatePath("/admin");

  return { success: true };
}

// テナント削除（論理削除）
export async function deleteTenant(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return { success: false, error: "テナントが見つかりません" };
  }

  // 論理削除
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      status: "DELETED",
      subdomain: `deleted-${tenant.subdomain}-${Date.now()}`, // 重複防止
    },
  });

  await logAudit(tenantId, "deleted", "admin", {});

  revalidatePath("/admin/tenants");
  revalidatePath("/admin");
  redirect("/admin/tenants");
}

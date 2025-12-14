"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

// Schema for updating tenant basic info
const updateTenantSchema = z.object({
  name: z
    .string()
    .min(1, "名前を入力してください")
    .max(200, "200文字以下で入力してください"),
  description: z
    .string()
    .max(1000, "1000文字以下で入力してください")
    .optional()
    .or(z.literal("")),
  contactEmail: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .optional()
    .or(z.literal("")),
  contactName: z
    .string()
    .max(100, "100文字以下で入力してください")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .url("有効なURLを入力してください")
    .optional()
    .or(z.literal("")),
});

// Schema for updating template settings
const updateTemplateSchema = z.object({
  templateId: z.string().max(50).optional().or(z.literal("")),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

// Get tenant details
export async function getTenantDetails(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      subdomain: true,
      customDomain: true,
      description: true,
      contactEmail: true,
      contactName: true,
      logoUrl: true,
      templateId: true,
      settings: true,
      status: true,
      createdAt: true,
    },
  });
}

// Update tenant basic info
export async function updateTenant(tenantId: string, input: UpdateTenantInput) {
  const parsed = updateTenantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { name, description, contactEmail, contactName, logoUrl } = parsed.data;

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        description: description || null,
        contactEmail: contactEmail || null,
        contactName: contactName || null,
        logoUrl: logoUrl || null,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update tenant:", error);
    return {
      success: false,
      error: { formErrors: ["設定の更新に失敗しました"] },
    };
  }
}

// Update template settings
export async function updateTemplate(tenantId: string, input: UpdateTemplateInput) {
  const parsed = updateTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { templateId, settings } = parsed.data;

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        templateId: templateId || null,
        settings: settings ? JSON.parse(JSON.stringify(settings)) : {},
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update template:", error);
    return {
      success: false,
      error: { formErrors: ["テンプレートの更新に失敗しました"] },
    };
  }
}

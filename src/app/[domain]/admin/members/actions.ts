"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

// Schema for updating member role
const updateMemberRoleSchema = z.object({
  membershipId: z.string().cuid(),
  role: z.enum(["ADMIN", "EDITOR", "MEMBER"]),
});

// Schema for updating member details
const updateMemberSchema = z.object({
  membershipId: z.string().cuid(),
  displayName: z.string().max(100).optional().or(z.literal("")),
  graduationYear: z.number().int().min(1900).max(2100).optional().nullable(),
});

// Get all members for a tenant
export async function getMembers(tenantId: string) {
  return prisma.tenantMembership.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          lastLoginAt: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { joinedAt: "desc" },
    ],
  });
}

// Update member role
export async function updateMemberRole(
  tenantId: string,
  input: z.infer<typeof updateMemberRoleSchema>
) {
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { membershipId, role } = parsed.data;

  // Verify membership belongs to tenant
  const membership = await prisma.tenantMembership.findFirst({
    where: { id: membershipId, tenantId },
  });

  if (!membership) {
    return { success: false, error: "メンバーが見つかりません" };
  }

  // Check if this is the last admin
  if (membership.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.tenantMembership.count({
      where: { tenantId, role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return {
        success: false,
        error: "最後の管理者の権限を変更することはできません",
      };
    }
  }

  await prisma.tenantMembership.update({
    where: { id: membershipId },
    data: { role },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

// Update member details
export async function updateMember(
  tenantId: string,
  input: z.infer<typeof updateMemberSchema>
) {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { membershipId, displayName, graduationYear } = parsed.data;

  // Verify membership belongs to tenant
  const membership = await prisma.tenantMembership.findFirst({
    where: { id: membershipId, tenantId },
  });

  if (!membership) {
    return { success: false, error: "メンバーが見つかりません" };
  }

  await prisma.tenantMembership.update({
    where: { id: membershipId },
    data: {
      displayName: displayName || null,
      graduationYear,
    },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

// Remove member from tenant
export async function removeMember(tenantId: string, membershipId: string) {
  // Verify membership belongs to tenant
  const membership = await prisma.tenantMembership.findFirst({
    where: { id: membershipId, tenantId },
  });

  if (!membership) {
    return { success: false, error: "メンバーが見つかりません" };
  }

  // Check if this is the last admin
  if (membership.role === "ADMIN") {
    const adminCount = await prisma.tenantMembership.count({
      where: { tenantId, role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return {
        success: false,
        error: "最後の管理者を削除することはできません",
      };
    }
  }

  await prisma.tenantMembership.delete({
    where: { id: membershipId },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

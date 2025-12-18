"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
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
  // Authorization check: only authenticated tenant admins can manage members
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user is a tenant admin
  const adminMembership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId,
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  if (!adminMembership) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { membershipId, role } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.tenantMembership.findFirst({
        where: { id: membershipId, tenantId },
      });

      if (!membership) {
        throw new Error("MEMBERSHIP_NOT_FOUND");
      }

      // Check if this is the last admin inside the same transaction
      if (membership.role === "ADMIN" && role !== "ADMIN") {
        const adminCount = await tx.tenantMembership.count({
          where: { tenantId, role: "ADMIN" },
        });

        if (adminCount <= 1) {
          throw new Error("LAST_ADMIN");
        }
      }

      await tx.tenantMembership.update({
        where: { id: membershipId },
        data: { role },
      });

      return { success: true as const };
    });

    revalidatePath("/admin/members");
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MEMBERSHIP_NOT_FOUND") {
        return { success: false, error: "メンバーが見つかりません" };
      }
      if (error.message === "LAST_ADMIN") {
        return {
          success: false,
          error: "最後の管理者の権限を変更することはできません",
        };
      }
    }
    throw error;
  }
}

// Update member details
export async function updateMember(
  tenantId: string,
  input: z.infer<typeof updateMemberSchema>
) {
  // Authorization check: only authenticated tenant admins can manage members
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user is a tenant admin
  const adminMembership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId,
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  if (!adminMembership) {
    return { success: false, error: "Unauthorized" };
  }

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
    where: { id: membershipId, tenantId },
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
  // Authorization check: only authenticated tenant admins can manage members
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user is a tenant admin
  const adminMembership = await prisma.tenantMembership.findFirst({
    where: {
      tenantId,
      userId: session.user.id,
      role: "ADMIN",
    },
  });

  if (!adminMembership) {
    return { success: false, error: "Unauthorized" };
  }

  // tenantId はセッション経由で検証済みのものを使用する
  const validatedTenantId = adminMembership.tenantId;

  // Verify membership belongs to tenant
  const membership = await prisma.tenantMembership.findFirst({
    where: { id: membershipId, tenantId: validatedTenantId },
  });

  if (!membership) {
    return { success: false, error: "メンバーが見つかりません" };
  }

  // Check if this is the last admin
  if (membership.role === "ADMIN") {
    const adminCount = await prisma.tenantMembership.count({
      where: { tenantId: validatedTenantId, role: "ADMIN" },
    });

    if (adminCount <= 1) {
      return {
        success: false,
        error: "最後の管理者を削除することはできません",
      };
    }
  }

  await prisma.tenantMembership.delete({
    where: { id: membershipId, tenantId: validatedTenantId },
  });

  revalidatePath("/admin/members");
  return { success: true };
}

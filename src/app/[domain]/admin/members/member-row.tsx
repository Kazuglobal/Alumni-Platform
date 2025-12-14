"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Shield,
  Edit3,
  UserMinus,
  Loader2,
} from "lucide-react";
import { updateMemberRole, removeMember } from "./actions";

type MemberRowProps = {
  tenantId: string;
  membership: {
    id: string;
    role: "ADMIN" | "EDITOR" | "MEMBER";
    displayName: string | null;
    graduationYear: number | null;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      lastLoginAt: Date | null;
    };
  };
  currentUserId: string;
};

const roleLabels = {
  ADMIN: { label: "管理者", color: "bg-purple-100 text-purple-700" },
  EDITOR: { label: "編集者", color: "bg-blue-100 text-blue-700" },
  MEMBER: { label: "メンバー", color: "bg-surface-100 text-surface-600" },
};

export function MemberRow({ tenantId, membership, currentUserId }: MemberRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentUser = membership.user.id === currentUserId;
  const role = roleLabels[membership.role];

  const handleRoleChange = async (newRole: "ADMIN" | "EDITOR" | "MEMBER") => {
    setIsLoading(true);
    setError(null);

    const result = await updateMemberRole(tenantId, {
      membershipId: membership.id,
      role: newRole,
    });

    if (!result.success) {
      setError(typeof result.error === "string" ? result.error : "エラーが発生しました");
    }

    setIsLoading(false);
    setIsRoleMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleRemove = async () => {
    if (!confirm("このメンバーを削除してもよろしいですか？")) return;

    setIsLoading(true);
    setError(null);

    const result = await removeMember(tenantId, membership.id);

    if (!result.success) {
      setError(result.error || "エラーが発生しました");
      setIsLoading(false);
    }

    setIsMenuOpen(false);
  };

  return (
    <tr className="border-b border-surface-100 last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {membership.user.image ? (
            <img
              src={membership.user.image}
              alt=""
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {(membership.displayName || membership.user.name || membership.user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-surface-900">
              {membership.displayName || membership.user.name || "未設定"}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-surface-400">(あなた)</span>
              )}
            </p>
            <p className="text-sm text-surface-500">{membership.user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
          {role.label}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-surface-500">
        {membership.graduationYear ? `${membership.graduationYear}年卒` : "-"}
      </td>
      <td className="px-6 py-4 text-sm text-surface-500">
        {new Date(membership.joinedAt).toLocaleDateString("ja-JP")}
      </td>
      <td className="px-6 py-4 text-sm text-surface-500">
        {membership.user.lastLoginAt
          ? new Date(membership.user.lastLoginAt).toLocaleDateString("ja-JP")
          : "-"}
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            disabled={isLoading}
            className="rounded p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsRoleMenuOpen(false);
                }}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-surface-200 bg-white py-1 shadow-lg">
                {error && (
                  <div className="border-b border-surface-100 px-3 py-2 text-xs text-red-600">
                    {error}
                  </div>
                )}

                {/* Role change submenu */}
                <div className="relative">
                  <button
                    onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                  >
                    <Shield className="h-4 w-4" />
                    役割を変更
                  </button>

                  {isRoleMenuOpen && (
                    <div className="absolute left-full top-0 ml-1 w-36 rounded-lg border border-surface-200 bg-white py-1 shadow-lg">
                      {(["ADMIN", "EDITOR", "MEMBER"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(r)}
                          disabled={membership.role === r}
                          className={`flex w-full items-center px-3 py-2 text-sm hover:bg-surface-50 ${
                            membership.role === r
                              ? "text-surface-400"
                              : "text-surface-700"
                          }`}
                        >
                          {roleLabels[r].label}
                          {membership.role === r && " (現在)"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!isCurrentUser && (
                  <button
                    onClick={handleRemove}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <UserMinus className="h-4 w-4" />
                    メンバーを削除
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

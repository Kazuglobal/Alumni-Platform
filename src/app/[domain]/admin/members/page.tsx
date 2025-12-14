import { notFound } from "next/navigation";
import { Users, Shield, Edit3, UserPlus } from "lucide-react";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { auth } from "@/auth";
import { getMembers } from "./actions";
import { MemberRow } from "./member-row";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  params,
}: {
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const session = await auth();
  const members = await getMembers(tenant.id);

  const stats = {
    total: members.length,
    admins: members.filter((m) => m.role === "ADMIN").length,
    editors: members.filter((m) => m.role === "EDITOR").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">会員管理</h1>
          <p className="mt-1 text-sm text-surface-500">
            メンバーの管理・権限設定
          </p>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
          title="招待機能は準備中です"
        >
          <UserPlus className="h-4 w-4" />
          メンバーを招待
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-surface-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-surface-100 p-2">
              <Users className="h-5 w-5 text-surface-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stats.total}</p>
              <p className="text-xs text-surface-500">総メンバー数</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-surface-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stats.admins}</p>
              <p className="text-xs text-surface-500">管理者</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-surface-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stats.editors}</p>
              <p className="text-xs text-surface-500">編集者</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members table */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-surface-300" />
            <p className="mt-4 text-surface-500">メンバーがいません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                  <th className="px-6 py-3">メンバー</th>
                  <th className="px-6 py-3">役割</th>
                  <th className="px-6 py-3">卒業年</th>
                  <th className="px-6 py-3">参加日</th>
                  <th className="px-6 py-3">最終ログイン</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((membership) => (
                  <MemberRow
                    key={membership.id}
                    tenantId={tenant.id}
                    membership={membership}
                    currentUserId={session?.user?.id || ""}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role explanations */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-surface-900">役割について</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                管理者
              </span>
            </div>
            <p className="mt-2 text-sm text-surface-500">
              すべての機能にアクセス可能。メンバーの管理、設定変更ができます。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                編集者
              </span>
            </div>
            <p className="mt-2 text-sm text-surface-500">
              記事の作成・編集・公開ができます。メンバー管理はできません。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-600">
                メンバー
              </span>
            </div>
            <p className="mt-2 text-sm text-surface-500">
              会員限定コンテンツの閲覧ができます。編集権限はありません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

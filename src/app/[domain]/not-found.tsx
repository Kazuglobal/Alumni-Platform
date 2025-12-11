import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export default function TenantNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
          <Building2 className="h-8 w-8 text-surface-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-surface-900">
          テナントが見つかりません
        </h1>
        <p className="mt-3 text-surface-600">
          お探しの同窓会サイトは存在しないか、現在利用できません。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}

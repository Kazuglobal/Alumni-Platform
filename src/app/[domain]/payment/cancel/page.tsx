import Link from "next/link";
import { XCircle } from "lucide-react";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { notFound } from "next/navigation";

export default async function PaymentCancelPage({
  params,
}: {
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
          <XCircle className="h-10 w-10 text-surface-400" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-surface-900">
          お支払いがキャンセルされました
        </h1>
        <p className="mb-6 text-surface-600">
          お支払いは完了していません。
          <br />
          もう一度お試しいただくか、お問い合わせください。
        </p>

        <div className="space-y-3">
          <Link
            href={`/${params.domain}/donate`}
            className="block w-full rounded-lg bg-brand-500 px-4 py-3 font-medium text-white transition-colors hover:bg-brand-600"
          >
            もう一度試す
          </Link>
          <Link
            href={`/${params.domain}`}
            className="block w-full rounded-lg border border-surface-300 bg-white px-4 py-3 font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            ホームに戻る
          </Link>
        </div>

        <p className="mt-6 text-xs text-surface-400">
          {tenant.name}
        </p>
      </div>
    </div>
  );
}

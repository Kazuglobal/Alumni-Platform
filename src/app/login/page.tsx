import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "ログイン | Alumni Platform",
  description: "同窓会プラットフォームにログイン",
};

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const params = await searchParams;

  // Already logged in, redirect to callback or home
  if (session?.user) {
    redirect(params.callbackUrl || "/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Alumni Platform</h1>
          <p className="mt-2 text-sm text-gray-600">
            同窓会プラットフォームへようこそ
          </p>
        </div>

        <Suspense fallback={<div className="text-center">読み込み中...</div>}>
          <LoginForm
            callbackUrl={params.callbackUrl || "/"}
            error={params.error}
          />
        </Suspense>

        <div className="text-center text-xs text-gray-500">
          <p>ログインすることで、利用規約とプライバシーポリシーに同意したことになります。</p>
        </div>
      </div>
    </div>
  );
}

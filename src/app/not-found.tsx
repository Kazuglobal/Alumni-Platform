"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4">
      <div className="mx-auto max-w-md text-center">
        {/* 404イラスト */}
        <div className="relative mx-auto mb-8 h-40 w-40">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-brand-100/50" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-7xl font-bold text-brand-500">
              404
            </span>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold text-surface-900">
          ページが見つかりません
        </h1>
        <p className="mt-3 text-surface-600">
          お探しのページは存在しないか、移動した可能性があります。
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <Home className="h-4 w-4" />
            トップページへ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            <ArrowLeft className="h-4 w-4" />
            前のページへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}

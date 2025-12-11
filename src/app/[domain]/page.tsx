import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";

export default async function TenantHomePage({
  params,
}: {
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const features = [
    {
      icon: FileText,
      title: "デジタル会報",
      description: "最新の同窓会ニュースをいつでもどこでもチェック",
    },
    {
      icon: Calendar,
      title: "イベント管理",
      description: "同窓会イベントの参加登録やQRコード受付",
    },
    {
      icon: Users,
      title: "会員名簿",
      description: "卒業生との繋がりを維持・発見",
    },
    {
      icon: MessageSquare,
      title: "AIアシスタント",
      description: "過去の会報や情報をAIで簡単検索",
    },
  ];

  return (
    <div className="relative">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 noise-overlay" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            {/* バッジ */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium text-brand-700">
                公式ウェブサイト
              </span>
            </div>

            {/* タイトル */}
            <h1 className="font-display text-4xl font-bold tracking-tight text-surface-900 sm:text-5xl lg:text-6xl">
              ようこそ
              <br />
              <span className="mt-2 block bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                {tenant.name}へ
              </span>
            </h1>

            {/* 説明文 */}
            {tenant.description && (
              <p className="mt-6 text-lg leading-relaxed text-surface-600 sm:text-xl">
                {tenant.description}
              </p>
            )}

            {/* CTAボタン */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={`/${params.domain}/news`}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-base font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30"
              >
                最新のお知らせを見る
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${params.domain}/events`}
                className="inline-flex items-center gap-2 rounded-lg border border-surface-300 bg-white px-6 py-3 text-base font-medium text-surface-700 transition-colors hover:bg-surface-50"
              >
                イベント情報
              </Link>
            </div>
          </div>
        </div>

        {/* 波形装飾 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full text-white"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 70C1200 65 1320 55 1380 50L1440 45V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* 機能セクション */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              充実の機能
            </h2>
            <p className="mt-4 text-lg text-surface-600">
              同窓会運営に必要な機能をすべて備えています
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-brand-100 p-3 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-surface-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-surface-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="bg-surface-900 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              今すぐ参加しよう
            </h2>
            <p className="mt-4 text-lg text-surface-300">
              会員登録して、同窓会の最新情報を受け取りましょう
            </p>
            <div className="mt-8">
              <Link
                href={`/${params.domain}/login`}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-400 hover:shadow-xl"
              >
                会員登録・ログイン
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

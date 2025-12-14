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
    <div className="space-y-16">
      {/* ヒーローセクション */}
      <section className="text-center">
        {/* バッジ */}
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{
            backgroundColor: "var(--template-bg-secondary)",
            border: "1px solid var(--template-border)",
          }}
        >
          <Sparkles
            className="h-4 w-4"
            style={{ color: "var(--template-primary)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--template-primary)" }}
          >
            公式ウェブサイト
          </span>
        </div>

        {/* タイトル */}
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{
            fontFamily: "var(--template-font-heading)",
            color: "var(--template-text-primary)",
          }}
        >
          ようこそ
          <br />
          <span style={{ color: "var(--template-primary)" }}>
            {tenant.name}
          </span>
          へ
        </h1>

        {/* 説明文 */}
        {tenant.description && (
          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--template-text-secondary)" }}
          >
            {tenant.description}
          </p>
        )}

        {/* CTAボタン */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-medium text-white shadow-lg transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--template-primary)" }}
          >
            最新のお知らせを見る
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-medium transition-colors"
            style={{
              border: "1px solid var(--template-border)",
              color: "var(--template-text-primary)",
              backgroundColor: "var(--template-bg-primary)",
            }}
          >
            イベント情報
          </Link>
        </div>
      </section>

      {/* 機能セクション */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{
              fontFamily: "var(--template-font-heading)",
              color: "var(--template-text-primary)",
            }}
          >
            充実の機能
          </h2>
          <p
            className="mt-4 text-lg"
            style={{ color: "var(--template-text-secondary)" }}
          >
            同窓会運営に必要な機能をすべて備えています
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl p-6 transition-all hover:shadow-md"
              style={{
                backgroundColor: "var(--template-bg-primary)",
                border: "1px solid var(--template-border)",
              }}
            >
              <div
                className="mb-4 inline-flex items-center justify-center rounded-xl p-3"
                style={{
                  backgroundColor: "var(--template-bg-secondary)",
                  color: "var(--template-primary)",
                }}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3
                className="text-lg font-semibold"
                style={{
                  fontFamily: "var(--template-font-heading)",
                  color: "var(--template-text-primary)",
                }}
              >
                {feature.title}
              </h3>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--template-text-secondary)" }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTAセクション */}
      <section
        className="rounded-2xl p-12 text-center"
        style={{ backgroundColor: "var(--template-primary)" }}
      >
        <h2
          className="text-3xl font-bold tracking-tight text-white"
          style={{ fontFamily: "var(--template-font-heading)" }}
        >
          今すぐ参加しよう
        </h2>
        <p className="mt-4 text-lg text-white/80">
          会員登録して、同窓会の最新情報を受け取りましょう
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-lg font-medium transition-all hover:opacity-90"
            style={{
              backgroundColor: "var(--template-bg-primary)",
              color: "var(--template-primary)",
            }}
          >
            会員登録・ログイン
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

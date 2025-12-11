import Link from "next/link";
import {
  Building2,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Globe,
  MessageSquare,
  CreditCard,
  QrCode,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: Globe,
      title: "マルチテナント対応",
      description:
        "各同窓会に専用のサブドメインを提供。独立した環境で安心運営。",
    },
    {
      icon: MessageSquare,
      title: "AIチャットボット",
      description: "過去の会報や情報をAIが自動検索。会員の疑問に即座に回答。",
    },
    {
      icon: CreditCard,
      title: "オンライン決済",
      description: "会費・寄付金のStripe決済対応。入金管理を自動化。",
    },
    {
      icon: QrCode,
      title: "QRコード受付",
      description: "イベント受付をQRコードで効率化。オフラインでも動作。",
    },
    {
      icon: Zap,
      title: "リッチテキストCMS",
      description: "美しいデジタル会報を簡単作成。画像・動画も自由に配置。",
    },
    {
      icon: Shield,
      title: "プライバシー重視",
      description: "個人情報の最小化設計。GDPR/個人情報保護法に準拠。",
    },
  ];

  const steps = [
    { step: "01", title: "申込み", description: "フォームから簡単申込み" },
    { step: "02", title: "設定", description: "テンプレート選択・カスタマイズ" },
    { step: "03", title: "公開", description: "即座にサイト公開" },
  ];

  return (
    <div className="min-h-screen">
      {/* ナビゲーション */}
      <header className="fixed top-0 z-50 w-full border-b border-surface-200/50 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold text-surface-900">
              Alumni Platform
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
            >
              機能
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
            >
              料金
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
            >
              お問い合わせ
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm font-medium text-surface-600 transition-colors hover:text-surface-900"
            >
              管理画面
            </Link>
            <Link
              href="#contact"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden pt-16">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-white to-white" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-[500px] w-[1000px] rounded-full bg-brand-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-4xl text-center">
            {/* バッジ */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-medium text-brand-700">
                次世代の同窓会運営プラットフォーム
              </span>
            </div>

            {/* メインタイトル */}
            <h1 className="font-display text-5xl font-bold tracking-tight text-surface-900 sm:text-6xl lg:text-7xl">
              同窓会運営を
              <br />
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent">
                  もっとスマートに
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-3 bg-brand-200/50" />
              </span>
            </h1>

            {/* サブタイトル */}
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-surface-600 sm:text-xl">
              デジタル会報、AIチャットボット、オンライン決済、QRコード受付。
              <br />
              同窓会運営に必要なすべてを一つのプラットフォームで。
            </p>

            {/* CTAボタン */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30"
              >
                無料で始める
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-surface-200 bg-white px-8 py-4 text-base font-semibold text-surface-700 transition-colors hover:border-surface-300 hover:bg-surface-50"
              >
                機能を見る
              </Link>
            </div>

            {/* 信頼バッジ */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-surface-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>セットアップ無料</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>月額固定料金</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>専任サポート</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              すべての機能が揃っています
            </h2>
            <p className="mt-4 text-lg text-surface-600">
              同窓会運営に必要な機能を厳選。シンプルで使いやすい設計。
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-surface-200 bg-white p-8 shadow-sm transition-all hover:border-brand-200 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-5 inline-flex items-center justify-center rounded-xl bg-brand-100 p-3 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-surface-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-surface-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ステップセクション */}
      <section className="bg-surface-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl">
              かんたん3ステップで開始
            </h2>
            <p className="mt-4 text-lg text-surface-600">
              お申し込みから公開まで、最短1日で完了します
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {steps.map((item, index) => (
              <div key={item.step} className="relative text-center">
                {/* 接続線 */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-brand-200 md:block" />
                )}
                <div className="relative">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white font-display text-4xl font-bold text-brand-500 shadow-lg shadow-brand-500/10">
                    {item.step}
                  </div>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-surface-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-surface-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section
        id="contact"
        className="relative overflow-hidden bg-surface-900 py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(204,118,64,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              今すぐ始めましょう
            </h2>
            <p className="mt-4 text-lg text-surface-300">
              初期費用0円、月額固定料金でスタートできます
            </p>
            <div className="mt-10">
              <Link
                href="mailto:contact@alumni-platform.com"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-brand-400"
              >
                お問い合わせ
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-surface-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold text-surface-900">
                Alumni Platform
              </span>
            </div>
            <p className="text-sm text-surface-500">
              &copy; {new Date().getFullYear()} Alumni Platform. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, Mail, Users, Calendar, FileText } from "lucide-react";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";

export async function generateMetadata({
  params,
}: {
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    return { title: "ページが見つかりません" };
  }

  return {
    title: {
      default: tenant.name,
      template: `%s | ${tenant.name}`,
    },
    description: tenant.description || `${tenant.name}の公式ウェブサイト`,
  };
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { domain: string };
}) {
  const tenant = await getTenantBySubdomain(params.domain);

  if (!tenant) {
    notFound();
  }

  const navItems = [
    { href: `/${params.domain}`, label: "ホーム", icon: Building2 },
    { href: `/${params.domain}/news`, label: "お知らせ", icon: FileText },
    { href: `/${params.domain}/events`, label: "イベント", icon: Calendar },
    { href: `/${params.domain}/members`, label: "会員", icon: Users },
    { href: `/${params.domain}/contact`, label: "お問い合わせ", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-surface-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${params.domain}`}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 font-display text-lg font-semibold text-white">
                {tenant.name.charAt(0)}
              </div>
            )}
            <span className="font-display text-xl font-semibold text-surface-900">
              {tenant.name}
            </span>
          </Link>

          {/* ナビゲーション */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* ログインボタン */}
          <Link
            href={`/${params.domain}/login`}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>{children}</main>

      {/* フッター */}
      <footer className="mt-auto border-t border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {/* ロゴ・説明 */}
            <div>
              <Link
                href={`/${params.domain}`}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 font-display text-lg font-semibold text-white">
                  {tenant.name.charAt(0)}
                </div>
                <span className="font-display text-lg font-semibold text-surface-900">
                  {tenant.name}
                </span>
              </Link>
              {tenant.description && (
                <p className="mt-4 text-sm text-surface-600">
                  {tenant.description}
                </p>
              )}
            </div>

            {/* リンク */}
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-surface-900">
                リンク
              </h4>
              <ul className="mt-4 space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-surface-600 transition-colors hover:text-brand-600"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* お問い合わせ */}
            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-surface-900">
                お問い合わせ
              </h4>
              <div className="mt-4 space-y-2 text-sm text-surface-600">
                {tenant.contactEmail && (
                  <p>
                    <a
                      href={`mailto:${tenant.contactEmail}`}
                      className="transition-colors hover:text-brand-600"
                    >
                      {tenant.contactEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* コピーライト */}
          <div className="mt-8 border-t border-surface-200 pt-8 text-center text-sm text-surface-500">
            <p>
              &copy; {new Date().getFullYear()} {tenant.name}. All rights
              reserved.
            </p>
            <p className="mt-2">
              Powered by{" "}
              <a
                href="/"
                className="font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                Alumni Platform
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

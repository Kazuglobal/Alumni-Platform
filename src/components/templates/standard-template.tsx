"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Calendar, Users, Bell, Mail, Home, Menu, X } from "lucide-react";
import { useState } from "react";

type StandardTemplateProps = {
  tenantName: string;
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/news", label: "ニュース", icon: Bell },
  { href: "/events", label: "イベント", icon: Calendar },
  { href: "/members", label: "会員", icon: Users },
  { href: "/contact", label: "お問い合わせ", icon: Mail },
];

export function StandardTemplate({ tenantName, children }: StandardTemplateProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--template-bg-primary)]">
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "var(--template-primary)",
          borderColor: "var(--template-border)",
          height: "var(--template-header-height)",
        }}
      >
        <div
          className="mx-auto px-4 h-full flex items-center justify-between"
          style={{ maxWidth: "var(--template-container-max)" }}
        >
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-bold"
              style={{
                color: "var(--template-bg-primary)",
                fontFamily: "var(--template-font-heading)",
              }}
            >
              {tenantName}
            </span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--template-bg-primary)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* モバイルメニューボタン */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            style={{ color: "var(--template-bg-primary)" }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* モバイルナビゲーション */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden border-t py-4 px-4"
            style={{
              backgroundColor: "var(--template-primary)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 py-3 text-sm font-medium"
                  style={{ color: "var(--template-bg-primary)" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        <div
          className="mx-auto px-4 py-8"
          style={{ maxWidth: "var(--template-container-max)" }}
        >
          {children}
        </div>
      </main>

      {/* フッター */}
      <footer
        className="border-t"
        style={{
          backgroundColor: "var(--template-bg-secondary)",
          borderColor: "var(--template-border)",
        }}
      >
        <div
          className="mx-auto px-4 py-12"
          style={{ maxWidth: "var(--template-container-max)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 同窓会情報 */}
            <div>
              <h3
                className="font-bold mb-4"
                style={{
                  color: "var(--template-text-primary)",
                  fontFamily: "var(--template-font-heading)",
                }}
              >
                {tenantName}
              </h3>
              <p
                className="text-sm"
                style={{ color: "var(--template-text-secondary)" }}
              >
                同窓会の活動情報をお届けします。
              </p>
            </div>

            {/* リンク */}
            <div>
              <h4
                className="font-bold mb-4 text-sm"
                style={{ color: "var(--template-text-primary)" }}
              >
                リンク
              </h4>
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm hover:underline"
                      style={{ color: "var(--template-text-secondary)" }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* お問い合わせ */}
            <div>
              <h4
                className="font-bold mb-4 text-sm"
                style={{ color: "var(--template-text-primary)" }}
              >
                お問い合わせ
              </h4>
              <p
                className="text-sm"
                style={{ color: "var(--template-text-secondary)" }}
              >
                ご質問やお問い合わせは
                <br />
                お問い合わせフォームより
                <br />
                お気軽にご連絡ください。
              </p>
            </div>
          </div>

          <div
            className="mt-8 pt-8 border-t text-center text-sm"
            style={{
              borderColor: "var(--template-border)",
              color: "var(--template-text-muted)",
            }}
          >
            &copy; {new Date().getFullYear()} {tenantName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

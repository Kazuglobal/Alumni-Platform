"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { FileText, Phone, Bell, Home, Menu, X } from "lucide-react";
import { useState } from "react";

type SimpleTemplateProps = {
  tenantName: string;
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/board", label: "掲示板", icon: FileText },
  { href: "/news", label: "お知らせ", icon: Bell },
  { href: "/contact", label: "連絡先", icon: Phone },
];

export function SimpleTemplate({ tenantName, children }: SimpleTemplateProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--template-bg-primary)" }}
    >
      {/* ヘッダー */}
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--template-bg-primary)",
          borderColor: "var(--template-border)",
          height: "var(--template-header-height)",
        }}
      >
        <div
          className="mx-auto px-4 h-full flex items-center justify-between"
          style={{ maxWidth: "800px" }}
        >
          {/* ロゴ */}
          <Link href="/">
            <span
              className="text-lg font-medium"
              style={{
                color: "var(--template-text-primary)",
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
                className="text-sm transition-colors hover:opacity-70"
                style={{ color: "var(--template-text-secondary)" }}
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
            style={{ color: "var(--template-text-primary)" }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* モバイルナビゲーション */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden border-t py-2"
            style={{
              backgroundColor: "var(--template-bg-primary)",
              borderColor: "var(--template-border)",
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 py-3 px-4 text-sm"
                  style={{ color: "var(--template-text-secondary)" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1">
        <div className="mx-auto px-4 py-12" style={{ maxWidth: "800px" }}>
          {children}
        </div>
      </main>

      {/* フッター */}
      <footer
        className="border-t py-8"
        style={{
          backgroundColor: "var(--template-bg-primary)",
          borderColor: "var(--template-border)",
        }}
      >
        <div className="mx-auto px-4 text-center" style={{ maxWidth: "800px" }}>
          <p
            className="text-sm"
            style={{ color: "var(--template-text-muted)" }}
          >
            &copy; {new Date().getFullYear()} {tenantName}
          </p>
        </div>
      </footer>
    </div>
  );
}

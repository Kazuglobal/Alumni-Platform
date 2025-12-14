"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Camera, Video, Users, Share2, Home, Menu, X, Instagram } from "lucide-react";
import { useState } from "react";

type GalleryTemplateProps = {
  tenantName: string;
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/photos", label: "フォト", icon: Camera },
  { href: "/videos", label: "ムービー", icon: Video },
  { href: "/members", label: "メンバー", icon: Users },
  { href: "/share", label: "シェア", icon: Share2 },
];

export function GalleryTemplate({ tenantName, children }: GalleryTemplateProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--template-bg-secondary)" }}
    >
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderBottom: "1px solid var(--template-border)",
          height: "var(--template-header-height)",
        }}
      >
        <div
          className="mx-auto px-4 h-full flex items-center justify-between"
          style={{ maxWidth: "var(--template-container-max)" }}
        >
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--template-primary)" }}
            >
              <Camera size={20} color="white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{
                color: "var(--template-primary)",
                fontFamily: "var(--template-font-heading)",
              }}
            >
              {tenantName}
            </span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-gray-100"
                  style={{ color: "var(--template-text-primary)" }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* モバイルメニューボタン */}
          <button
            className="md:hidden p-2 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            style={{
              color: "var(--template-text-primary)",
              backgroundColor: mobileMenuOpen ? "var(--template-bg-accent)" : "transparent",
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* モバイルナビゲーション */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden py-4 px-4"
            style={{ backgroundColor: "var(--template-bg-primary)" }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-medium hover:bg-gray-100"
                  style={{ color: "var(--template-text-primary)" }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} style={{ color: "var(--template-primary)" }} />
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
          backgroundColor: "var(--template-bg-primary)",
          borderColor: "var(--template-border)",
        }}
      >
        <div
          className="mx-auto px-4 py-12"
          style={{ maxWidth: "var(--template-container-max)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* ロゴ */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--template-primary)" }}
              >
                <Camera size={16} color="white" />
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--template-text-primary)" }}
              >
                {tenantName}
              </span>
            </div>

            {/* ソーシャルリンク */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: "var(--template-text-secondary)" }}
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                style={{ color: "var(--template-text-secondary)" }}
                aria-label="Share"
              >
                <Share2 size={20} />
              </a>
            </div>

            {/* コピーライト */}
            <p
              className="text-sm"
              style={{ color: "var(--template-text-muted)" }}
            >
              &copy; {new Date().getFullYear()} {tenantName}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

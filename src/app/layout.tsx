import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const bodyFont = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Alumni Platform | 同窓会マルチテナントプラットフォーム",
    template: "%s | Alumni Platform",
  },
  description:
    "次世代の同窓会運営プラットフォーム。デジタル会報、AIチャットボット、オンライン決済を一元管理。",
  keywords: [
    "同窓会",
    "プラットフォーム",
    "会報",
    "マルチテナント",
    "Alumni",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-surface-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "テナント管理", icon: Building2 },
  { href: "/admin/users", label: "ユーザー管理", icon: Users },
  { href: "/admin/settings", label: "設定", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-100">
      {/* サイドバー */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-surface-200 bg-white">
        {/* ロゴ */}
        <div className="flex h-16 items-center border-b border-surface-200 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold text-surface-900">
                Alumni
              </span>
              <span className="ml-1 text-xs font-medium text-surface-500">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* ナビゲーション */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-surface-600 transition-all hover:bg-brand-50 hover:text-brand-700"
                >
                  <item.icon className="h-5 w-5 transition-colors group-hover:text-brand-600" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* フッター */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-surface-200 p-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700">
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">ログアウト</span>
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="ml-64 min-h-screen">
        {/* ヘッダー */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-200 bg-white/80 px-8 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-semibold text-surface-800">
              プラットフォーム管理
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-100 ring-2 ring-brand-200" />
              <span className="text-sm font-medium text-surface-700">
                管理者
              </span>
            </div>
          </div>
        </header>

        {/* ページコンテンツ */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

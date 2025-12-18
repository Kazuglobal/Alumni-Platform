import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Settings, Users, Home, LogOut, CreditCard } from "lucide-react";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { auth, signOut } from "@/auth";

const buildNavItems = (domain?: string) => {
  const safeDomain = domain ? encodeURIComponent(domain) : "unknown-domain";
  const basePath = `/${safeDomain}/admin`;

  return [
    { href: basePath, label: "ダッシュボード", icon: Home },
    { href: `${basePath}/posts`, label: "記事管理", icon: FileText },
    { href: `${basePath}/members`, label: "会員管理", icon: Users },
    { href: `${basePath}/payments`, label: "支払い管理", icon: CreditCard },
    { href: `${basePath}/settings`, label: "設定", icon: Settings },
  ];
};

export default async function TenantAdminLayout({
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

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const navItems = buildNavItems(params?.domain);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-surface-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-surface-200 px-6">
          <Link href={`/${params.domain}`} className="flex items-center gap-2">
            <span className="text-lg font-bold text-surface-900">
              {tenant.name}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-surface-200 p-4">
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
                {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-surface-900">
                {session.user.name || session.user.email}
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="rounded p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
                title="ログアウト"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

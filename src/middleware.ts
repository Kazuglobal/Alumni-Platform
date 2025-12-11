import { NextRequest, NextResponse } from "next/server";

// 予約済みサブドメイン
const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "www",
  "app",
  "dashboard",
  "static",
  "assets",
  "cdn",
  "mail",
  "email",
  "support",
  "help",
  "docs",
  "blog",
]);

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - static files
     * - _next
     * - favicon.ico
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};

function extractSubdomain(hostname: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  // localhostの場合の処理
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".");
    if (parts.length >= 2 && parts[parts.length - 1].startsWith("localhost")) {
      return parts[0];
    }
    return null;
  }

  // 本番環境（ポートを除外）
  const hostnameWithoutPort = hostname.split(":")[0];
  const rootDomainWithoutPort = rootDomain.split(":")[0];

  if (hostnameWithoutPort.endsWith(`.${rootDomainWithoutPort}`)) {
    const subdomain = hostnameWithoutPort.replace(
      `.${rootDomainWithoutPort}`,
      ""
    );
    return subdomain || null;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // サブドメインを抽出
  const subdomain = extractSubdomain(hostname);

  // ルートドメイン（サブドメインなし）の場合はランディングページ
  if (!subdomain) {
    return NextResponse.next();
  }

  // 管理画面（admin.xxx）
  if (subdomain === "admin") {
    // リクエストヘッダーにサブドメイン情報を追加
    const response = NextResponse.rewrite(
      new URL(`/admin${url.pathname}`, request.url)
    );
    response.headers.set("x-subdomain", "admin");
    return response;
  }

  // 予約済みサブドメインは404
  if (RESERVED_SUBDOMAINS.has(subdomain.toLowerCase())) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  // テナントサブドメインの場合、[domain]にルーティング
  const response = NextResponse.rewrite(
    new URL(`/${subdomain}${url.pathname}`, request.url)
  );
  response.headers.set("x-subdomain", subdomain);
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  const tenant = await getTenantBySubdomain(domain);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
  });
}

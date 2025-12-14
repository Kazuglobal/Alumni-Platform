import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/tenant/resolve";
import { TenantTemplateWrapper } from "@/components/templates";

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

  return (
    <TenantTemplateWrapper
      templateId={tenant.templateId}
      tenantName={tenant.name}
    >
      {children}
    </TenantTemplateWrapper>
  );
}

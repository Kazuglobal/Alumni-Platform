"use client";

import { type ReactNode } from "react";
import { TemplateProvider } from "@/lib/templates/theme-provider";
import { StandardTemplate } from "./standard-template";
import { GalleryTemplate } from "./gallery-template";
import { SimpleTemplate } from "./simple-template";

type TenantTemplateWrapperProps = {
  templateId: string | null | undefined;
  tenantName: string;
  children: ReactNode;
};

export function TenantTemplateWrapper({
  templateId,
  tenantName,
  children,
}: TenantTemplateWrapperProps) {
  const effectiveTemplateId = templateId ?? "standard";

  return (
    <TemplateProvider templateId={effectiveTemplateId}>
      <TemplateLayout templateId={effectiveTemplateId} tenantName={tenantName}>
        {children}
      </TemplateLayout>
    </TemplateProvider>
  );
}

type TemplateLayoutProps = {
  templateId: string;
  tenantName: string;
  children: ReactNode;
};

function TemplateLayout({ templateId, tenantName, children }: TemplateLayoutProps) {
  switch (templateId) {
    case "gallery":
      return <GalleryTemplate tenantName={tenantName}>{children}</GalleryTemplate>;
    case "simple":
      return <SimpleTemplate tenantName={tenantName}>{children}</SimpleTemplate>;
    case "standard":
    default:
      return <StandardTemplate tenantName={tenantName}>{children}</StandardTemplate>;
  }
}

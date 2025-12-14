"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  type Template,
  type TemplateTheme,
  getTemplateById,
  standardTemplate,
  themeToCssVariables,
} from "./definitions";

type TemplateContextValue = {
  template: Template;
  theme: TemplateTheme;
};

const TemplateContext = createContext<TemplateContextValue | null>(null);

type TemplateProviderProps = {
  templateId: string | null | undefined;
  children: ReactNode;
};

export function TemplateProvider({ templateId, children }: TemplateProviderProps) {
  const template = useMemo(() => {
    return getTemplateById(templateId ?? "") ?? standardTemplate;
  }, [templateId]);

  const cssVariables = useMemo(() => {
    return themeToCssVariables(template.theme);
  }, [template.theme]);

  const value = useMemo(
    () => ({
      template,
      theme: template.theme,
    }),
    [template]
  );

  return (
    <TemplateContext.Provider value={value}>
      <div style={cssVariables as React.CSSProperties}>{children}</div>
    </TemplateContext.Provider>
  );
}

export function useTemplate(): TemplateContextValue {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplate must be used within a TemplateProvider");
  }
  return context;
}

// Hook to get styles according to the template theme
export function useTemplateStyles() {
  const { theme } = useTemplate();

  return {
    primary: theme.primaryColor,
    primaryHover: theme.primaryHoverColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor,
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    bgPrimary: theme.bgPrimary,
    bgSecondary: theme.bgSecondary,
    border: theme.borderColor,
  };
}

"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { templates, type Template } from "@/lib/templates/definitions";
import { cn } from "@/lib/utils";

type TemplateSelectorProps = {
  value?: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
};

export function TemplateSelector({
  value,
  onChange,
  disabled,
}: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        テンプレートを選択
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = value === template.id;
          const isHovered = hoveredId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              onMouseEnter={() => !disabled && setHoveredId(template.id)}
              onMouseLeave={() => !disabled && setHoveredId(null)}
              disabled={disabled}
              className={cn(
                "relative rounded-lg border-2 overflow-hidden transition-all text-left",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500",
                isSelected
                  ? "border-orange-500 ring-2 ring-orange-500"
                  : "border-gray-200 hover:border-gray-300",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-pressed={isSelected}
              aria-label={`${template.name}テンプレートを選択`}
            >
              {/* サムネイル */}
              <TemplateThumbnail template={template} />

              {/* 選択インジケーター */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* ホバーオーバーレイ */}
              {isHovered && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                  <p className="text-white text-sm font-medium text-center mb-3">
                    機能一覧
                  </p>
                  <ul className="text-white/90 text-xs space-y-1.5">
                    {template.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 情報 */}
              <div className="p-3 bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: template.theme.primaryColor }}
                    aria-hidden="true"
                  />
                  <h3 className="font-medium text-sm text-gray-900">
                    {template.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// テンプレートサムネイル（SVGで視覚的に表現）
function TemplateThumbnail({ template }: { template: Template }) {
  const { primaryColor, bgSecondary, borderColor } = template.theme;

  if (template.id === "standard") {
    return (
      <div className="relative aspect-video bg-gray-100">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* ヘッダー */}
          <rect x="0" y="0" width="200" height="20" fill={primaryColor} />
          <rect x="10" y="6" width="40" height="8" fill="white" rx="1" opacity="0.9" />
          <rect x="120" y="7" width="20" height="6" fill="white" rx="1" opacity="0.6" />
          <rect x="145" y="7" width="20" height="6" fill="white" rx="1" opacity="0.6" />
          <rect x="170" y="7" width="20" height="6" fill="white" rx="1" opacity="0.6" />

          {/* メインコンテンツ */}
          <rect x="10" y="30" width="180" height="50" fill={bgSecondary} rx="2" />
          <rect x="20" y="40" width="80" height="8" fill={primaryColor} rx="1" opacity="0.8" />
          <rect x="20" y="52" width="160" height="4" fill={borderColor} rx="1" />
          <rect x="20" y="60" width="140" height="4" fill={borderColor} rx="1" />
          <rect x="20" y="68" width="120" height="4" fill={borderColor} rx="1" />

          {/* フッター */}
          <rect x="0" y="95" width="200" height="25" fill={bgSecondary} />
          <rect x="10" y="102" width="30" height="4" fill={borderColor} rx="1" />
          <rect x="10" y="110" width="50" height="3" fill={borderColor} rx="1" opacity="0.5" />
        </svg>
      </div>
    );
  }

  if (template.id === "gallery") {
    return (
      <div className="relative aspect-video bg-gray-100">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* ヘッダー */}
          <rect x="0" y="0" width="200" height="20" fill="white" />
          <circle cx="20" cy="10" r="6" fill={primaryColor} />
          <rect x="30" y="6" width="40" height="8" fill={primaryColor} rx="1" />
          <rect x="120" y="5" width="30" height="10" fill={bgSecondary} rx="5" />
          <rect x="155" y="5" width="30" height="10" fill={bgSecondary} rx="5" />

          {/* ギャラリーグリッド */}
          <rect x="10" y="28" width="55" height="35" fill={primaryColor} rx="2" opacity="0.3" />
          <rect x="70" y="28" width="55" height="35" fill={primaryColor} rx="2" opacity="0.5" />
          <rect x="130" y="28" width="55" height="35" fill={primaryColor} rx="2" opacity="0.4" />
          <rect x="10" y="68" width="55" height="35" fill={primaryColor} rx="2" opacity="0.6" />
          <rect x="70" y="68" width="55" height="35" fill={primaryColor} rx="2" opacity="0.3" />
          <rect x="130" y="68" width="55" height="35" fill={primaryColor} rx="2" opacity="0.5" />

          {/* フッター */}
          <rect x="0" y="108" width="200" height="12" fill="white" />
        </svg>
      </div>
    );
  }

  // Simple template
  return (
    <div className="relative aspect-video bg-gray-100">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        {/* ヘッダー */}
        <rect x="0" y="0" width="200" height="18" fill="white" />
        <line x1="0" y1="18" x2="200" y2="18" stroke={borderColor} strokeWidth="1" />
        <rect x="20" y="5" width="50" height="8" fill={primaryColor} rx="1" />
        <rect x="120" y="6" width="20" height="6" fill={borderColor} rx="1" />
        <rect x="145" y="6" width="20" height="6" fill={borderColor} rx="1" />
        <rect x="170" y="6" width="20" height="6" fill={borderColor} rx="1" />

        {/* メインコンテンツ（シングルカラム） */}
        <rect x="40" y="30" width="120" height="8" fill={primaryColor} rx="1" opacity="0.7" />
        <rect x="40" y="45" width="120" height="4" fill={borderColor} rx="1" />
        <rect x="40" y="53" width="120" height="4" fill={borderColor} rx="1" />
        <rect x="40" y="61" width="100" height="4" fill={borderColor} rx="1" />

        <rect x="40" y="75" width="80" height="6" fill={primaryColor} rx="1" opacity="0.5" />
        <rect x="40" y="85" width="120" height="4" fill={borderColor} rx="1" />
        <rect x="40" y="93" width="110" height="4" fill={borderColor} rx="1" />

        {/* フッター */}
        <line x1="0" y1="108" x2="200" y2="108" stroke={borderColor} strokeWidth="1" />
        <rect x="80" y="112" width="40" height="4" fill={borderColor} rx="1" opacity="0.5" />
      </svg>
    </div>
  );
}

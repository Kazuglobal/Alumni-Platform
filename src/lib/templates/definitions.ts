// テンプレート定義
// 同窓会サイト用の3種類のWebサイトテンプレート

export type TemplateTheme = {
  primaryColor: string;
  primaryHoverColor: string;
  secondaryColor: string;
  accentColor: string;
  textPrimary: string;
  textSecondary: string;
  bgPrimary: string;
  bgSecondary: string;
  borderColor: string;
  fontHeading: string;
  fontBody: string;
};

export type TemplateLayout = {
  id: string;
  name: string;
  description: string;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  features: string[];
  theme: TemplateTheme;
  layouts: TemplateLayout[];
  version: string;
};

// Standard テンプレート - 大規模校の同窓会向け
export const standardTemplate: Template = {
  id: "standard",
  name: "スタンダード",
  description:
    "ニュース、イベント、会員情報など充実した機能を備えた大規模同窓会向けテンプレート",
  thumbnail: "/templates/standard-thumbnail.svg",
  features: [
    "ニュースセクション",
    "イベントカレンダー",
    "会員ディレクトリ",
    "お知らせ一覧",
    "お問い合わせフォーム",
  ],
  theme: {
    primaryColor: "#1a365d",
    primaryHoverColor: "#2c4a7c",
    secondaryColor: "#718096",
    accentColor: "#ed8936",
    textPrimary: "#1a202c",
    textSecondary: "#4a5568",
    bgPrimary: "#ffffff",
    bgSecondary: "#f7fafc",
    borderColor: "#e2e8f0",
    fontHeading: "Noto Sans JP",
    fontBody: "Noto Sans JP",
  },
  layouts: [
    {
      id: "default",
      name: "標準レイアウト",
      description: "ヘッダー、メインコンテンツ、フッターの基本構成",
    },
    {
      id: "sidebar",
      name: "サイドバー付き",
      description: "サイドナビゲーション付きのレイアウト",
    },
  ],
  version: "1.0.0",
};

// Gallery テンプレート - 若手OB会向け
export const galleryTemplate: Template = {
  id: "gallery",
  name: "ギャラリー",
  description:
    "写真・動画を中心としたビジュアル重視のデザイン。若手OB会や部活動に最適",
  thumbnail: "/templates/gallery-thumbnail.svg",
  features: [
    "フォトギャラリー",
    "動画埋め込み",
    "SNS連携",
    "タイムライン表示",
    "メンバー紹介",
  ],
  theme: {
    primaryColor: "#c05621",
    primaryHoverColor: "#dd6b20",
    secondaryColor: "#718096",
    accentColor: "#38a169",
    textPrimary: "#1a202c",
    textSecondary: "#4a5568",
    bgPrimary: "#ffffff",
    bgSecondary: "#fffaf0",
    borderColor: "#fbd38d",
    fontHeading: "Noto Sans JP",
    fontBody: "Noto Sans JP",
  },
  layouts: [
    {
      id: "grid",
      name: "グリッドレイアウト",
      description: "写真をグリッド状に配置",
    },
    {
      id: "masonry",
      name: "メイソンリー",
      description: "Pinterest風の可変グリッド",
    },
  ],
  version: "1.0.0",
};

// Simple テンプレート - 部活動同窓会向け
export const simpleTemplate: Template = {
  id: "simple",
  name: "シンプル",
  description:
    "必要最小限の機能に絞ったミニマルデザイン。小規模な同窓会や部活動OB会に",
  thumbnail: "/templates/simple-thumbnail.svg",
  features: [
    "掲示板",
    "連絡先一覧",
    "お知らせ",
    "シンプルなプロフィール",
  ],
  theme: {
    primaryColor: "#2d3748",
    primaryHoverColor: "#4a5568",
    secondaryColor: "#718096",
    accentColor: "#4299e1",
    textPrimary: "#1a202c",
    textSecondary: "#4a5568",
    bgPrimary: "#ffffff",
    bgSecondary: "#f7fafc",
    borderColor: "#e2e8f0",
    fontHeading: "Noto Sans JP",
    fontBody: "Noto Sans JP",
  },
  layouts: [
    {
      id: "single",
      name: "シングルカラム",
      description: "1カラムのシンプルなレイアウト",
    },
  ],
  version: "1.0.0",
};

// すべてのテンプレート
export const templates: Template[] = [
  standardTemplate,
  galleryTemplate,
  simpleTemplate,
];

// テンプレートIDからテンプレートを取得
export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

// デフォルトテンプレート
export const DEFAULT_TEMPLATE_ID = "standard";

// テンプレートテーマをCSS変数に変換
export function themeToCssVariables(theme: TemplateTheme): Record<string, string> {
  return {
    "--template-primary": theme.primaryColor,
    "--template-primary-hover": theme.primaryHoverColor,
    "--template-secondary": theme.secondaryColor,
    "--template-accent": theme.accentColor,
    "--template-text-primary": theme.textPrimary,
    "--template-text-secondary": theme.textSecondary,
    "--template-bg-primary": theme.bgPrimary,
    "--template-bg-secondary": theme.bgSecondary,
    "--template-border": theme.borderColor,
    "--template-font-heading": theme.fontHeading,
    "--template-font-body": theme.fontBody,
  };
}

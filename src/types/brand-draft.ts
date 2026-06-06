/** Données éditables avant publication dans Notion */
export interface BrandSocial {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

export interface BrandDraft {
  name: string;
  url: string;
  origin: string;
  category: string;
  price: string;
  desc: string;
  tags: string[];
  actu?: string;
  /** Rempli uniquement par l'IA — jamais par le scrap meta */
  imageUrl?: string;
  logoUrl?: string;
  social?: BrandSocial;
}

export interface ScrapeResult {
  draft: BrandDraft;
  source: "ai" | "meta";
  provider?: "anthropic" | "openai";
  hints: string[];
}

export interface PublishBrandInput extends BrandDraft {
  score: number;
  maxScore: number;
  partial: boolean;
}

export const SOCIAL_FIELDS = [
  { key: "instagram" as const, label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "tiktok" as const, label: "TikTok", placeholder: "https://tiktok.com/@…" },
  { key: "twitter" as const, label: "X / Twitter", placeholder: "https://x.com/…" },
];

export const CATEGORY_OPTIONS = [
  "Streetwear",
  "Denim",
  "Bijoux",
  "Urban",
  "Indé",
  "Tailoring",
  "Workwear",
  "Vintage",
] as const;

export const PRICE_OPTIONS = [
  "Accessible",
  "Milieu de gamme",
  "Premium",
] as const;

export type PriceTierValue = (typeof PRICE_OPTIONS)[number];

export const BADGE_SUGGESTIONS = [
  "Made in FR",
  "Denim",
  "Artisanal",
  "Petites séries",
  "Matières soignées",
  "Identité forte",
  "Essentials",
  "Streetwear",
  "Indé",
  "Communauté",
] as const;

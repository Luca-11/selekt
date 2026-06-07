export interface BrandSocial {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

export interface Brand {
  id: string;
  name: string;
  url: string;
  origin: string;
  category: string;
  price: string;
  score: number;
  maxScore: number;
  partial: boolean;
  desc: string;
  tags: string[];
  color: string;
  accent: string;
  textOnImg: "light" | "dark";
  actu?: string;
  imageUrl?: string;
  logoUrl?: string;
  social?: BrandSocial;
  /** ISO 8601 — dernière modification Notion */
  updatedAt?: string;
}

export const NOTION_PROPERTIES = {
  name: "Nom",
  url: "URL",
  category: "Catégorie",
  origin: "Pays",
  price: "Prix",
  score: "Score",
  maxScore: "Score max",
  partial: "Score partiel",
  description: "Description courte",
  badge1: "Badge 1",
  badge2: "Badge 2",
  badge3: "Badge 3",
  actu: "Actu / Dernier drop",
  color: "Couleur",
  accent: "Accent",
  image: "Image",
  logo: "Logo",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "X / Twitter",
} as const;

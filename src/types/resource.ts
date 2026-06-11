import type { BrandSocial } from "@/types/brand";

/** Colonnes Notion — base REVENDEURS */
export const RETAILER_NOTION_PROPERTIES = {
  name: "Name",
  url: "URL",
  origin: "Pays",
  category: "Positionnement",
  description: "Description",
  why: "Pourquoi",
  brandTypes: "Type de marques",
  image: "Image",
} as const;

/** Colonnes Notion — base MEDIAS */
export const ACCOUNT_NOTION_PROPERTIES = {
  name: "Name",
  url: "URL principale",
  category: "Expertise",
  contentType: "Type de contenu",
  description: "Description",
  why: "Pourquoi",
  tags: "Tags",
  social: "Réseaux sociaux",
  image: "Image",
} as const;

export interface ExploreResource {
  id: string;
  kind: "retailer" | "account";
  name: string;
  url: string;
  desc: string;
  category: string;
  tags: string[];
  origin?: string;
  contentType?: string;
  logoUrl?: string;
  imageUrl?: string;
  social?: BrandSocial;
  updatedAt?: string;
}

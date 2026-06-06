import type { Brand } from "@/types/brand";
import type { BrandDraft } from "@/types/brand-draft";

export interface AdminBrandFormState {
  notionId: string;
  draft: BrandDraft;
  score: number;
  maxScore: number;
  partial: boolean;
}

export function brandToAdminForm(brand: Brand): AdminBrandFormState {
  return {
    notionId: brand.id,
    draft: {
      name: brand.name,
      url: brand.url === "#" ? "" : brand.url,
      origin: brand.origin,
      category: brand.category,
      price: brand.price,
      desc: brand.desc,
      tags: brand.tags,
      actu: brand.actu,
      imageUrl: brand.imageUrl,
      logoUrl: brand.logoUrl,
      social: brand.social,
    },
    score: brand.score,
    maxScore: brand.maxScore,
    partial: brand.partial,
  };
}

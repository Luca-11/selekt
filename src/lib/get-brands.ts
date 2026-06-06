import { fallbackBrands } from "@/lib/brands-fallback";
import { fetchBrandsFromNotion, isNotionConfigured } from "@/lib/notion";
import type { Brand } from "@/types/brand";

export async function getBrands(): Promise<{ brands: Brand[]; source: "notion" | "fallback" }> {
  if (!isNotionConfigured()) {
    return { brands: fallbackBrands, source: "fallback" };
  }

  try {
    const brands = await fetchBrandsFromNotion();
    if (brands.length === 0) {
      return { brands: fallbackBrands, source: "fallback" };
    }
    return { brands, source: "notion" };
  } catch (error) {
    console.error("[getBrands] Erreur Notion, fallback local:", error);
    return { brands: fallbackBrands, source: "fallback" };
  }
}

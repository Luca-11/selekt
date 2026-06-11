import type { Brand } from "@/types/brand";
import { normalizePriceTier, PRICE_TIERS } from "@/lib/price-tier";

export type SortOption = "score-desc" | "score-asc" | "name" | "price-asc" | "price-desc";

function scoreRatio(brand: Brand): number {
  return brand.maxScore > 0 ? brand.score / brand.maxScore : 0;
}

function priceRank(price: string): number {
  const tier = normalizePriceTier(price);
  const index = PRICE_TIERS.findIndex((t) => t.value === tier);
  return index >= 0 ? index : 1;
}

export function buildCategories(brands: Brand[]): string[] {
  const cats = new Set(brands.map((b) => b.category).filter(Boolean));
  return ["Tout", ...Array.from(cats).sort((a, b) => a.localeCompare(b, "fr"))];
}

export function buildCountries(brands: Brand[]): string[] {
  const countries = new Set<string>();
  for (const brand of brands) {
    const origin = brand.origin.trim();
    if (origin && origin !== "–") {
      countries.add(origin);
    }
  }
  return Array.from(countries).sort((a, b) => a.localeCompare(b, "fr"));
}

export type BrandFilterOptions = {
  category: string;
  country: string;
  search: string;
};

function brandMatchesFilters(brand: Brand, options: BrandFilterOptions): boolean {
  const q = options.search.trim().toLowerCase();
  const matchCat = options.category === "Tout" || brand.category === options.category;
  const matchCountry =
    options.country === "Tout" ||
    brand.origin === options.country ||
    (options.country === "FR" && brand.origin.toUpperCase().includes("FR"));
  const matchSearch =
    !q ||
    brand.name.toLowerCase().includes(q) ||
    brand.desc.toLowerCase().includes(q) ||
    brand.origin.toLowerCase().includes(q) ||
    brand.tags.some((t) => t.toLowerCase().includes(q));

  return matchCat && matchCountry && matchSearch;
}

export function filterBrands(brands: Brand[], options: BrandFilterOptions): Brand[] {
  return brands.filter((brand) => brandMatchesFilters(brand, options));
}

export function sortBrands(brands: Brand[], sort: SortOption): Brand[] {
  const copy = [...brands];

  copy.sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name, "fr");
      case "score-asc":
        return scoreRatio(a) - scoreRatio(b) || a.name.localeCompare(b.name, "fr");
      case "price-asc":
        return priceRank(a.price) - priceRank(b.price) || a.name.localeCompare(b.name, "fr");
      case "price-desc":
        return priceRank(b.price) - priceRank(a.price) || a.name.localeCompare(b.name, "fr");
      case "score-desc":
      default:
        return scoreRatio(b) - scoreRatio(a) || a.name.localeCompare(b.name, "fr");
    }
  });

  return copy;
}

export const SORT_LABELS: Record<SortOption, string> = {
  "score-desc": "Score (haut → bas)",
  "score-asc": "Score (bas → haut)",
  name: "Nom (A → Z)",
  "price-asc": "Prix (accessible → premium)",
  "price-desc": "Prix (premium → accessible)",
};

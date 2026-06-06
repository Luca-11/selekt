export const PRICE_TIERS = [
  {
    value: "Accessible",
    label: "Accessible",
    range: "moins de 90 €",
    maxEur: 90,
  },
  {
    value: "Milieu de gamme",
    label: "Milieu de gamme",
    range: "90 – 160 €",
    maxEur: 160,
  },
  {
    value: "Premium",
    label: "Premium",
    range: "160 € et plus",
    maxEur: Infinity,
  },
] as const;

export type PriceTierValue = (typeof PRICE_TIERS)[number]["value"];

export const PRICE_OPTIONS: PriceTierValue[] = PRICE_TIERS.map((t) => t.value);

const LEGACY_MAP: Record<string, PriceTierValue> = {
  "€": "Accessible",
  "€€": "Milieu de gamme",
  "€€€": "Premium",
};

export function normalizePriceTier(raw: string | undefined): PriceTierValue {
  if (!raw?.trim()) return "Milieu de gamme";
  const trimmed = raw.trim();
  if (LEGACY_MAP[trimmed]) return LEGACY_MAP[trimmed];
  if (PRICE_OPTIONS.includes(trimmed as PriceTierValue)) return trimmed as PriceTierValue;
  return "Milieu de gamme";
}

/** Convertit une valeur brute (euros ou centimes Shopify) en euros */
export function normalizePriceEur(raw: number): number | null {
  if (!Number.isFinite(raw) || raw <= 0) return null;

  // Centimes Shopify fréquents : 15000 → 150 €, 19999 → 200 €
  if (raw >= 1_000) {
    const asEur = raw / 100;
    if (asEur >= 15 && asEur <= 5_000) return Math.round(asEur);
  }

  if (raw >= 15 && raw <= 5_000) return Math.round(raw);
  return null;
}

export function tierFromPrices(pricesEur: number[]): PriceTierValue | null {
  if (pricesEur.length === 0) return null;

  const sorted = [...pricesEur].sort((a, b) => a - b);
  // Exclut accessoires pas chers (chaussettes, etc.) pour viser le prix des pièces
  const mainPieces = sorted.filter((p) => p >= 45);
  const pool = mainPieces.length >= 2 ? mainPieces : sorted;
  const median = pool[Math.floor(pool.length / 2)];

  if (median < 90) return "Accessible";
  if (median < 160) return "Milieu de gamme";
  return "Premium";
}

export function getPriceTier(value: string): (typeof PRICE_TIERS)[number] | undefined {
  return PRICE_TIERS.find((t) => t.value === normalizePriceTier(value));
}

export function formatPriceShort(value: string): string {
  const tier = getPriceTier(value);
  return tier ? tier.label : value;
}

export function formatPriceLong(value: string): string {
  const tier = getPriceTier(value);
  return tier ? `${tier.label} (${tier.range})` : value;
}

export function tierFromJsonLdPriceRange(range: string): PriceTierValue | undefined {
  const symbols = (range.match(/\$/g) ?? []).length;
  if (symbols <= 1) return "Accessible";
  if (symbols === 2) return "Milieu de gamme";
  if (symbols >= 3) return "Premium";
  return undefined;
}

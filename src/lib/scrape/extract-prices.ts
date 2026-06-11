import { normalizePriceEur } from "@/lib/price-tier";

export function extractPricesFromHtml(html: string): number[] {
  const prices = new Set<number>();

  const patterns = [
    /"price"\s*:\s*(\d+)/gi,
    /"compare_at_price"\s*:\s*(\d+)/gi,
    /"price_min"\s*:\s*(\d+)/gi,
    /"price_max"\s*:\s*(\d+)/gi,
    /"amount"\s*:\s*"?(\d+)"?/gi,
    /data-product-price=["'](\d+)["']/gi,
    /(?:€|EUR)\s*(\d{1,4}(?:[.,]\d{2})?)/gi,
    /\$(\d{1,4}(?:\.\d{2})?)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const raw = match[1].replace(",", ".");
      const value = normalizePriceEur(Number(raw));
      if (value !== null) prices.add(value);
    }
  }

  return [...prices].sort((a, b) => a - b);
}

/** Shopify expose les vrais prix via products.json — plus fiable que le HTML */
export async function fetchShopifyProductPrices(siteUrl: string): Promise<number[]> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return [];
  }

  try {
    const response = await fetch(`${origin}/products.json?limit=12`, {
      headers: { Accept: "application/json", "User-Agent": "SelektBot/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      products?: Array<{
        variants?: Array<{ price?: string | number }>;
      }>;
    };

    const prices = new Set<number>();

    for (const product of data.products ?? []) {
      for (const variant of product.variants ?? []) {
        if (variant.price === undefined || variant.price === null) continue;
      const raw = typeof variant.price === "string" ? Number(variant.price) : variant.price;
      if (!Number.isFinite(raw)) continue;
      const eur = Math.round(raw);
      if (eur >= 15 && eur <= 5_000) prices.add(eur);
      }
    }

    return [...prices].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function isShopifySite(html: string): boolean {
  return /cdn\.shopify\.com|Shopify\.shop/i.test(html);
}

/** Images produit Shopify — meilleures candidates pour l'image hero */
export async function fetchShopifyProductImages(siteUrl: string): Promise<string[]> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return [];
  }

  try {
    const response = await fetch(`${origin}/products.json?limit=8`, {
      headers: { Accept: "application/json", "User-Agent": "SelektBot/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      products?: Array<{
        images?: Array<{ src?: string; width?: number }>;
        image?: { src?: string };
      }>;
    };

    const images: string[] = [];

    for (const product of data.products ?? []) {
      const candidates = [
        ...(product.images ?? []).map((img) => img.src),
        product.image?.src,
      ].filter(Boolean) as string[];

      for (const src of candidates) {
        if (src && !src.toLowerCase().includes("logo") && !images.includes(src)) {
          images.push(src);
        }
      }
    }

    return images;
  } catch {
    return [];
  }
}

export async function resolveProductPrices(html: string, siteUrl: string): Promise<number[]> {
  const fromHtml = extractPricesFromHtml(html);
  if (fromHtml.length >= 3) return fromHtml;

  if (isShopifySite(html) || fromHtml.length === 0) {
    const fromApi = await fetchShopifyProductPrices(siteUrl);
    if (fromApi.length > 0) return fromApi;
  }

  return fromHtml;
}

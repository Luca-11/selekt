import { extractPricesFromHtml } from "@/lib/scrape/extract-prices";
import { isUsableAssetUrl } from "@/lib/scrape/asset-url";

/** Données structurées extraites du HTML — alimente meta + prompt IA */
export interface MetaContext {
  metas: Record<string, string>;
  jsonLdSummaries: string[];
  visibleSnippets: string[];
  prices: number[];
  shopName?: string;
  sources: string[];
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

export function extractAllMetas(html: string): Record<string, string> {
  const metas: Record<string, string> = {};
  const tagRegex = /<meta[^>]+>/gi;

  for (const tag of html.match(tagRegex) ?? []) {
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (!content) continue;

    const property = tag.match(/property=["']([^"']+)["']/i)?.[1];
    const name = tag.match(/name=["']([^"']+)["']/i)?.[1];
    const key = property ?? name;
    if (key) metas[key] = decodeHtml(content);
  }

  return metas;
}

function flattenJsonLd(node: unknown, out: Record<string, string>[], depth = 0): void {
  if (depth > 6 || node === null || node === undefined) return;

  if (Array.isArray(node)) {
    node.forEach((item) => flattenJsonLd(item, out, depth + 1));
    return;
  }

  if (typeof node !== "object") return;

  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const types = Array.isArray(type) ? type : type ? [type] : [];
  const relevant = types.some((t) =>
    /Organization|Brand|Store|WebSite|ClothingStore|OnlineStore|Product|LocalBusiness/i.test(
      String(t),
    ),
  );

  if (relevant || obj.name || obj.description) {
    const entry: Record<string, string> = {};
    for (const key of ["name", "description", "slogan", "foundingLocation", "areaServed"]) {
      if (typeof obj[key] === "string") entry[key] = obj[key] as string;
    }
    if (typeof obj.logo === "string") entry.logo = obj.logo;
    if (obj.logo && typeof obj.logo === "object") {
      const logoObj = obj.logo as { url?: string };
      if (typeof logoObj.url === "string") entry.logo = logoObj.url;
    }
    if (typeof obj.image === "string") entry.image = obj.image;
    if (obj.address && typeof obj.address === "object") {
      const addr = obj.address as Record<string, unknown>;
      for (const key of ["addressLocality", "addressCountry", "addressRegion"]) {
        if (typeof addr[key] === "string") entry[key] = addr[key] as string;
      }
    }
    if (typeof obj.priceRange === "string") entry.priceRange = obj.priceRange;
    if (Object.keys(entry).length > 0) out.push(entry);
  }

  if (obj["@graph"]) flattenJsonLd(obj["@graph"], out, depth + 1);
  for (const value of Object.values(obj)) {
    if (typeof value === "object") flattenJsonLd(value, out, depth + 1);
  }
}

export function extractJsonLdSummaries(html: string): string[] {
  const summaries: Record<string, string>[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(regex)) {
    try {
      flattenJsonLd(JSON.parse(match[1]), summaries);
    } catch {
      // JSON-LD mal formé — ignoré
    }
  }

  return summaries.map((entry) =>
    Object.entries(entry)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | "),
  );
}

export function extractShopifyShopName(html: string): string | undefined {
  const patterns = [
    /Shopify\.shop\s*=\s*"([^"]+)"/i,
    /"shopName"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1] ? decodeHtml(match[1]) : undefined;
    if (value && !isShopifyInternalSlug(value)) return value;
  }

  return undefined;
}

/** Slug technique Shopify — pas un nom de marque */
export function isShopifyInternalSlug(value: string): boolean {
  return /\.myshopify\.com/i.test(value) || /^shopify_/i.test(value);
}

export function extractVisibleSnippets(html: string): string[] {
  const snippets: string[] = [];

  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  for (const match of html.matchAll(h1Regex)) {
    const text = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 3 && text.length < 120) snippets.push(text);
  }

  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  for (const match of html.matchAll(pRegex)) {
    const text = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 40 && text.length < 400 && !/cookie|newsletter|subscribe|accept/i.test(text)) {
      snippets.push(text);
    }
    if (snippets.length >= 8) break;
  }

  return [...new Set(snippets)].slice(0, 8);
}

export function buildMetaContext(html: string): MetaContext {
  const metas = extractAllMetas(html);
  const jsonLdSummaries = extractJsonLdSummaries(html);
  const visibleSnippets = extractVisibleSnippets(html);
  const prices = extractPricesFromHtml(html);
  const shopName = extractShopifyShopName(html);
  const sources: string[] = [];

  if (Object.keys(metas).length > 0) sources.push("balises meta");
  if (jsonLdSummaries.length > 0) sources.push("JSON-LD");
  if (shopName) sources.push("Shopify");
  if (visibleSnippets.length > 0) sources.push("contenu visible");
  if (prices.length > 0) sources.push(`${prices.length} prix détectés`);

  return {
    metas,
    jsonLdSummaries,
    visibleSnippets,
    prices,
    shopName,
    sources,
  };
}

export function formatMetaContextForAi(context: MetaContext): string {
  const lines: string[] = [];

  if (context.shopName) lines.push(`Boutique Shopify: ${context.shopName}`);
  if (context.jsonLdSummaries.length) {
    lines.push("JSON-LD:");
    context.jsonLdSummaries.slice(0, 4).forEach((s) => lines.push(`- ${s}`));
  }

  const importantMetas = [
    "og:title",
    "og:description",
    "og:site_name",
    "description",
    "twitter:description",
    "keywords",
  ];
  const metaLines = importantMetas
    .filter((k) => context.metas[k])
    .map((k) => `${k}: ${context.metas[k]}`);
  if (metaLines.length) {
    lines.push("Metas:");
    lines.push(...metaLines.map((l) => `- ${l}`));
  }

  if (context.prices.length) {
    lines.push(`Prix détectés (€/$): ${context.prices.join(", ")}`);
  }

  if (context.visibleSnippets.length) {
    lines.push("Extraits de la page:");
    context.visibleSnippets.slice(0, 6).forEach((s) => lines.push(`- ${s}`));
  }

  return lines.join("\n");
}

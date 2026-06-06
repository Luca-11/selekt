import type { BrandDraft, PriceTierValue } from "@/types/brand-draft";
import { BADGE_SUGGESTIONS, CATEGORY_OPTIONS, PRICE_OPTIONS } from "@/types/brand-draft";
import {
  formatPriceLong,
  tierFromJsonLdPriceRange,
  tierFromPrices,
} from "@/lib/price-tier";
import {
  buildMetaContext,
  type MetaContext,
  formatMetaContextForAi,
  isShopifyInternalSlug,
} from "@/lib/scrape/structured-data";
import { resolveAssetUrl, isUsableAssetUrl } from "@/lib/scrape/asset-url";
import { extractSocialLinks } from "@/lib/scrape/extract-social";

export type { MetaContext };
export { buildMetaContext, formatMetaContextForAi };

const GENERIC_DESC =
  /shop (the|our|latest|official)|official (online )?store|free shipping|discover our|buy now|nouvelle collection disponible/i;

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function matchMeta(html: string, key: string, attr: "property" | "name"): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return undefined;
}

function nameFromJsonLd(context: MetaContext): string | undefined {
  for (const summary of context.jsonLdSummaries) {
    const match = summary.match(/name:\s*(.+?)(?:\s*\||$)/);
    const name = match?.[1]?.trim();
    if (name && !isShopifyInternalSlug(name) && name.length > 2) return name;
  }
  return undefined;
}

function nameFromDescription(text: string): string | undefined {
  const match = text.match(
    /^([A-ZÀ-Ö][A-Za-zÀ-Öà-ö0-9'&/. -]{2,45}?)\s+(?:est|is|was|are|'s)\s+(?:une|un|a|an|the|la|le|notre|your)/i,
  );
  if (match?.[1] && !isShopifyInternalSlug(match[1])) return match[1].trim();
  return undefined;
}

function nameFromUrl(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const part = host.split(".")[0];
    if (!part || part.length < 3 || part === "shop") return undefined;

    if (/[a-z][A-Z]/.test(part)) {
      return part.replace(/([a-z])([A-Z])/g, "$1 $2");
    }

    return part
      .replace(/[-_]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    return undefined;
  }
}

function extractTitle(html: string, context: MetaContext, desc?: string): string | undefined {
  const fromLd = nameFromJsonLd(context);
  if (fromLd) return fromLd;

  const siteName = context.metas["og:site_name"];
  if (siteName && !isShopifyInternalSlug(siteName)) return siteName;

  const og = matchMeta(html, "og:title", "property") ?? context.metas["og:title"];
  if (og && !isShopifyInternalSlug(og)) return og;

  if (desc) {
    const fromDesc = nameFromDescription(desc);
    if (fromDesc) return fromDesc;
  }

  for (const snippet of context.visibleSnippets) {
    const fromSnippet = nameFromDescription(snippet);
    if (fromSnippet) return fromSnippet;
  }

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (titleTag) {
    const decoded = decodeHtml(titleTag);
    if (!isShopifyInternalSlug(decoded)) return decoded;
  }

  if (context.shopName && !isShopifyInternalSlug(context.shopName)) {
    return context.shopName;
  }

  return undefined;
}

function cleanBrandName(raw: string, url: string, desc?: string): string {
  if (isShopifyInternalSlug(raw)) {
    const fallback =
      nameFromDescription(desc ?? "") ?? nameFromUrl(url) ?? "Marque";
    return cleanBrandName(fallback, url, desc);
  }

  let name = raw.split("|")[0]?.split("–")[0]?.split(" - ")[0]?.trim() ?? raw;
  name = name.replace(/\s+(shop|store|official|online)$/i, "").trim();

  if (name.length > 60) {
    const fromUrl = nameFromUrl(url);
    if (fromUrl) return fromUrl;
    name = name.slice(0, 60);
  }

  return name;
}

function countryFromJsonLd(context: MetaContext): string | undefined {
  for (const summary of context.jsonLdSummaries) {
    if (/addressCountry:\s*FR/i.test(summary)) return "France";
    if (/addressCountry:\s*(US|USA)/i.test(summary)) return "USA";
    if (/addressCountry:\s*GB/i.test(summary)) return "UK";
    if (/addressCountry:\s*DE/i.test(summary)) return "Allemagne";
    if (/addressCountry:\s*IT/i.test(summary)) return "Italie";
    if (/addressCountry:\s*JP/i.test(summary)) return "Japon";
    if (/addressLocality:\s*Paris/i.test(summary)) return "Paris, FR";
  }
  return undefined;
}

function guessOrigin(html: string, url: string, context: MetaContext, desc?: string): string {
  const fromLd = countryFromJsonLd(context);
  if (fromLd) return fromLd;

  const text = `${desc ?? ""} ${context.visibleSnippets.join(" ")} ${html.slice(0, 100_000)}`.toLowerCase();

  if (
    /\b(née à paris|nee a paris|based in paris|from paris|founded in paris|à paris|a paris|in paris|paris,?\s*france|parisian|chic à la française|chic a la francaise|maison parisienne)\b/.test(
      text,
    )
  ) {
    return "Paris, FR";
  }
  if (/\b(paris,?\s*fr|made in france|fabriqué en france|produit en france|parisian)\b/.test(text)) {
    return "Paris, FR";
  }
  if (/\b(france|français|francais|french brand|marque française)\b/.test(text)) return "France";
  if (/\b(london|uk|united kingdom|england|british)\b/.test(text)) return "UK";
  if (/\b(berlin|germany|deutschland|german)\b/.test(text)) return "Allemagne";
  if (/\b(milan|italy|italia|italian)\b/.test(text)) return "Italie";
  if (/\b(japan|tokyo|osaka|日本|japanese)\b/.test(text)) return "Japon";
  if (/\b(portugal|lisbon|portuguese)\b/.test(text)) return "Portugal";
  if (/\b(spain|barcelona|madrid|spanish)\b/.test(text)) return "Espagne";
  if (/\b(belgium|belgique|antwerp)\b/.test(text)) return "Belgique";

  try {
    const tld = new URL(url).hostname.split(".").pop()?.toLowerCase();
    if (tld === "fr") return "France";
    if (tld === "uk" || tld === "co.uk") return "UK";
    if (tld === "de") return "Allemagne";
    if (tld === "it") return "Italie";
    if (tld === "jp") return "Japon";
    if (tld === "pt") return "Portugal";
    if (tld === "es") return "Espagne";
  } catch {
    // ignore
  }

  return "–";
}

function guessCategory(html: string, name: string, context: MetaContext, desc?: string): string {
  const blob = `${name} ${desc ?? ""} ${context.visibleSnippets.join(" ")} ${html.slice(0, 50_000)}`.toLowerCase();

  if (/\b(jewelry|jewellery|bijou|bijoux|ring|necklace|earring)\b/.test(blob)) return "Bijoux";
  if (/\b(denim|jeans|selvedge|raw denim|jean)\b/.test(blob)) return "Denim";
  if (/\b(workwear|carhartt|utility wear|carpenter)\b/.test(blob)) return "Workwear";
  if (/\b(vintage|archive|second hand|deadstock)\b/.test(blob)) return "Vintage";
  if (/\b(tailoring|blazer|suit|formal|minimal wardrobe)\b/.test(blob)) return "Tailoring";
  if (/\b(streetwear|hoodie|sneaker|urban wear|skate)\b/.test(blob)) return "Streetwear";
  if (/\b(city wear|urban|everyday wear)\b/.test(blob)) return "Urban";

  return "Indé";
}

function priceFromRange(context: MetaContext): PriceTierValue | undefined {
  for (const summary of context.jsonLdSummaries) {
    const match = summary.match(/priceRange:\s*(.+?)(?:\s*\||$)/);
    if (match?.[1]) {
      const tier = tierFromJsonLdPriceRange(match[1]);
      if (tier) return tier;
    }
  }
  return undefined;
}

function guessPrice(context: MetaContext): { tier: PriceTierValue; median?: number } {
  const fromRange = priceFromRange(context);
  if (fromRange) return { tier: fromRange };

  const fromPrices = tierFromPrices(context.prices);
  if (fromPrices) {
    const sorted = [...context.prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return { tier: fromPrices, median };
  }

  return { tier: "Milieu de gamme" };
}

function guessBadges(html: string, context: MetaContext, desc?: string): string[] {
  const text = `${desc ?? ""} ${html.slice(0, 100_000)} ${context.visibleSnippets.join(" ")}`.toLowerCase();
  const badges: string[] = [];

  const rules: Array<[RegExp, string]> = [
    [/\b(made in france|fabriqué en france|produit en france|manufactured in france)\b/, "Made in FR"],
    [/\b(artisan|handmade|fait main|hand-crafted|craftsmanship)\b/, "Artisanal"],
    [/\b(small batch|petite série|limited edition|limited run)\b/, "Petites séries"],
    [/\b(denim|selvedge|raw denim)\b/, "Denim"],
    [/\b(organic cotton|coton bio|natural materials|matières naturelles)\b/, "Matières soignées"],
    [/\b(essentials|basics|wardrobe staples)\b/, "Essentials"],
    [/\b(community|communauté|collective)\b/, "Communauté"],
    [/\b(streetwear|elevated streetwear)\b/, "Streetwear"],
    [/\b(indépendant|independent|maison indépendante|indie brand)\b/, "Indé"],
    [/\b(identité visuelle|visual identity|strong identity|univers cohérent)\b/, "Identité forte"],
  ];

  for (const [pattern, badge] of rules) {
    if (pattern.test(text) && !badges.includes(badge)) badges.push(badge);
    if (badges.length >= 3) break;
  }

  return badges.slice(0, 3);
}

function pickDescription(html: string, context: MetaContext): string {
  const candidates: string[] = [];

  for (const summary of context.jsonLdSummaries) {
    const match = summary.match(/description:\s*(.+?)(?:\s*\||$)/);
    if (match?.[1] && match[1].length > 30) candidates.push(match[1]);
  }

  const metaDesc =
    context.metas["og:description"] ??
    matchMeta(html, "og:description", "property") ??
    context.metas["twitter:description"] ??
    context.metas.description ??
    matchMeta(html, "description", "name");

  if (metaDesc) candidates.push(metaDesc);
  candidates.push(...context.visibleSnippets.filter((s) => s.length > 50));

  for (const candidate of candidates) {
    const clean = candidate.replace(/\s+/g, " ").trim();
    if (clean.length < 25) continue;
    if (GENERIC_DESC.test(clean) && clean.length < 80) continue;
    return clean.slice(0, 280);
  }

  if (metaDesc && metaDesc.length > 10) return metaDesc.slice(0, 280);

  return "À compléter — ajoute ta recommandation personnelle.";
}

function guessActu(html: string, context: MetaContext): string | undefined {
  const blob = `${context.visibleSnippets.join(" ")} ${html.slice(0, 80_000)}`;

  const dropMatch = blob.match(
    /((?:new (?:drop|collection|arrivals)|nouveautés|dernier drop|latest drop|just dropped|fw\d{2}|ss\d{2})[^.!?]{0,80}[.!?]?)/i,
  );

  if (dropMatch?.[1]) {
    return dropMatch[1].replace(/\s+/g, " ").trim().slice(0, 120);
  }

  return undefined;
}

function pickImage(html: string, context: MetaContext, baseUrl: string): string | undefined {
  const candidates: (string | undefined)[] = [
    context.metas["og:image"],
    matchMeta(html, "og:image", "property"),
    context.metas["twitter:image"],
    matchMeta(html, "twitter:image", "name"),
  ];

  for (const summary of context.jsonLdSummaries) {
    const match = summary.match(/image:\s*(https?:\/\/\S+)/);
    if (match?.[1]) candidates.push(match[1]);
  }

  const heroMatch = html.match(
    /<img[^>]+(?:class=["'][^"']*(?:hero|banner|slide)[^"']*["']|data-hero)[^>]+src=["']([^"']+)["']/i,
  );
  if (heroMatch?.[1]) candidates.push(heroMatch[1]);

  const productMatch = html.match(/"featured_image"\s*:\s*"([^"]+)"/i);
  if (productMatch?.[1]) candidates.push(productMatch[1]);

  for (const raw of candidates) {
    const resolved = resolveAssetUrl(raw, baseUrl);
    if (resolved && !/\.svg(\?|$)/i.test(resolved) && !resolved.includes("/logo")) return resolved;
  }

  return undefined;
}

function pickLogo(html: string, context: MetaContext, baseUrl: string): string | undefined {
  const candidates: (string | undefined)[] = [];

  for (const summary of context.jsonLdSummaries) {
    const match = summary.match(/logo:\s*(https?:\/\/\S+)/);
    if (match?.[1]) candidates.push(match[1]);
  }

  const linkPatterns = [
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i,
    /<link[^>]+rel=["']icon["'][^>]+sizes=["']192x192["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i,
  ];

  for (const pattern of linkPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) candidates.push(match[1]);
  }

  const logoImgPatterns = [
    /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*logo[^"']*["']/i,
    /<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of logoImgPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) candidates.push(match[1]);
  }

  for (const raw of candidates) {
    const resolved = resolveAssetUrl(raw, baseUrl);
    if (resolved) return resolved;
  }

  return undefined;
}

/** Extraction heuristique enrichie — sans IA */
export function draftFromMeta(
  html: string,
  url: string,
  extraHtml?: string,
  htmlTail?: string,
): BrandDraft {
  const combinedHtml = extraHtml ? `${html}\n${extraHtml}` : html;
  const context = buildMetaContext(combinedHtml);
  const desc = pickDescription(combinedHtml, context);
  const rawTitle = extractTitle(combinedHtml, context, desc) ?? nameFromUrl(url) ?? "";
  const name = cleanBrandName(rawTitle || "Marque", url, desc);
  const { tier: price } = guessPrice(context);

  return {
    name,
    url,
    origin: guessOrigin(combinedHtml, url, context, desc),
    category: guessCategory(combinedHtml, name, context, desc),
    price,
    desc,
    tags: guessBadges(combinedHtml, context, desc),
    logoUrl: pickLogo(combinedHtml, context, url),
    social: extractSocialLinks(combinedHtml, htmlTail),
    actu: guessActu(combinedHtml, context),
  };
}

export function getMetaHints(context: MetaContext, draft: BrandDraft): string[] {
  const hints: string[] = [];

  if (context.sources.length > 0) {
    hints.push(`Sources : ${context.sources.join(", ")}.`);
  }

  if (context.prices.length > 0) {
    const sorted = [...context.prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    hints.push(
      `Prix détectés (~${median} € en médiane) → ${formatPriceLong(draft.price)}.`,
    );
  } else {
    hints.push("Aucun prix détecté — choisis la gamme manuellement.");
  }

  if (draft.desc.startsWith("À compléter")) {
    hints.push("Description faible — l'IA ou une retouche manuelle aidera.");
  }

  if (draft.origin === "–") {
    hints.push("Pays non détecté — à compléter si tu le connais.");
  }

  if (draft.tags.length === 0) {
    hints.push("Aucun badge factuel trouvé sur le site.");
  }

  if (!draft.imageUrl) {
    hints.push("Image hero : l'IA peut la proposer — sinon, colle une URL dans le form.");
  }

  const socialCount = Object.values(draft.social ?? {}).filter(Boolean).length;
  if (socialCount > 0) {
    hints.push(`${socialCount} réseau(x) social(aux) détecté(s) — modifiables dans le form.`);
  } else {
    hints.push(
      "Aucun réseau détecté dans le HTML (souvent chargé en JS sur Shopify) — complète à la main ou via l'IA.",
    );
  }

  return hints;
}

/** Contexte riche pour le modèle IA */
export function extractTextForAi(html: string, context: MetaContext, extraHtml?: string): string {
  const combined = extraHtml ? `${html}\n${extraHtml}` : html;
  const structured = formatMetaContextForAi(buildMetaContext(combined));

  const bodyText = combined
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10_000);

  return `${structured}\n\n---\nTexte brut (extrait):\n${bodyText}`;
}

export function isWeakDraft(draft: BrandDraft): boolean {
  return (
    draft.desc.startsWith("À compléter") ||
    draft.origin === "–" ||
    draft.tags.length === 0 ||
    GENERIC_DESC.test(draft.desc)
  );
}

export { CATEGORY_OPTIONS, PRICE_OPTIONS, BADGE_SUGGESTIONS };

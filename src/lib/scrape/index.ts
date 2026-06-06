import { fetchPage } from "@/lib/scrape/fetch-page";
import {
  draftFromMeta,
  extractTextForAi,
  getMetaHints,
  isWeakDraft,
  buildMetaContext,
} from "@/lib/scrape/extract-meta";
import {
  fetchShopifyProductImages,
  fetchShopifyProductPrices,
  isShopifySite,
  resolveProductPrices,
} from "@/lib/scrape/extract-prices";
import { isUsableAssetUrl } from "@/lib/scrape/asset-url";
import { formatAiErrorMessage } from "@/lib/ai/format-error";
import { enrichDraftWithAi, getAvailableAiProvider } from "@/lib/ai/extract-brand";
import type { ScrapeResult } from "@/types/brand-draft";
import { tierFromPrices } from "@/lib/price-tier";

const ABOUT_PATHS = ["/pages/about", "/pages/about-us", "/about", "/pages/notre-histoire", "/a-propos"];

function originFromUrl(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/** Si la home est pauvre, tente une page About du même domaine */
async function fetchAboutSupplement(homeHtml: string, baseUrl: string): Promise<string | undefined> {
  const origin = originFromUrl(baseUrl);
  if (!origin) return undefined;

  const weak =
    !buildMetaContext(homeHtml).jsonLdSummaries.length &&
    (homeHtml.match(/<p[^>]*>/gi)?.length ?? 0) < 3;

  if (!weak && !isWeakDraft(draftFromMeta(homeHtml, baseUrl))) {
    return undefined;
  }

  for (const path of ABOUT_PATHS) {
    try {
      const { html } = await fetchPage(`${origin}${path}`);
      if (html.length > 500 && buildMetaContext(html).visibleSnippets.length > 0) {
        return html;
      }
    } catch {
      // page absente — on continue
    }
  }

  return undefined;
}

export async function scrapeBrandUrl(url: string): Promise<ScrapeResult> {
  const { html, finalUrl, truncated, htmlTail } = await fetchPage(url);
  const aboutHtml = await fetchAboutSupplement(html, finalUrl);

  const productPrices = await resolveProductPrices(
    aboutHtml ? `${html}\n${aboutHtml}` : html,
    finalUrl,
  );

  const context = buildMetaContext(aboutHtml ? `${html}\n${aboutHtml}` : html);
  context.prices = productPrices;
  if (productPrices.length > 0 && !context.sources.includes(`${productPrices.length} prix détectés`)) {
    context.sources.push(`${productPrices.length} prix détectés`);
  }
  if (
    productPrices.length > 0 &&
    isShopifySite(html) &&
    !context.sources.includes("Shopify API")
  ) {
    context.sources.push("Shopify API");
  }

  const metaDraft = draftFromMeta(html, finalUrl, aboutHtml, htmlTail);

  // Recalcule le tier avec les prix API si disponibles
  if (productPrices.length > 0) {
    const tier = tierFromPrices(productPrices);
    if (tier) metaDraft.price = tier;
  }

  if (!isUsableAssetUrl(metaDraft.logoUrl)) {
    metaDraft.logoUrl = undefined;
  }

  // Hero : jamais pré-rempli en mode meta (uniquement via IA ou saisie manuelle)
  metaDraft.imageUrl = undefined;

  const hints = getMetaHints(context, metaDraft);

  if (truncated) {
    hints.unshift("Page volumineuse — analyse limitée au début du HTML.");
  }
  if (aboutHtml) {
    hints.unshift("Page « About » trouvée et incluse dans l'analyse.");
  }

  const provider = getAvailableAiProvider();

  if (!provider) {
    hints.push("Mode meta — ajoute une clé API pour l'enrichissement IA.");
    return { draft: metaDraft, source: "meta", hints };
  }

  try {
    let pageText = extractTextForAi(html, context, aboutHtml);

    if (isShopifySite(html)) {
      const imageCandidates = await fetchShopifyProductImages(finalUrl);
      if (imageCandidates.length > 0) {
        pageText += `\n\nImages produit candidates pour le hero (ne pas confondre avec le logo) :\n${imageCandidates.slice(0, 5).join("\n")}`;
      }
    }

    const { draft, provider: usedProvider } = await enrichDraftWithAi(
      finalUrl,
      metaDraft,
      pageText,
    );
    hints.push(`Enrichi via ${usedProvider === "anthropic" ? "Claude" : "ChatGPT"}.`);
    return { draft, source: "ai", provider: usedProvider, hints };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur IA";
    hints.push(`IA indisponible (${formatAiErrorMessage(message)}) — brouillon meta conservé.`);
    return { draft: metaDraft, source: "meta", hints };
  }
}

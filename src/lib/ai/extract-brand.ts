import type { BrandDraft, BrandSocial } from "@/types/brand-draft";
import { BADGE_SUGGESTIONS, CATEGORY_OPTIONS, PRICE_OPTIONS } from "@/types/brand-draft";
import { normalizePriceTier } from "@/lib/price-tier";
import { isUsableAssetUrl } from "@/lib/scrape/asset-url";
import { formatAiErrorMessage } from "@/lib/ai/format-error";

export type AiProvider = "anthropic" | "openai";

function normalizeKey(raw: string | undefined): string | undefined {
  const key = raw?.trim();
  if (!key) return undefined;

  const placeholders = [/^xxx+$/i, /^secret_xxx$/i, /^sk-ant-\.{3}$/i, /^sk-\.{3}$/i];
  if (placeholders.some((pattern) => pattern.test(key))) return undefined;

  return key;
}

function getAnthropicKey(): string | undefined {
  const key = normalizeKey(process.env.ANTHROPIC_API_KEY);
  if (!key?.startsWith("sk-ant-")) return undefined;
  return key;
}

function getOpenAiKey(): string | undefined {
  const key = normalizeKey(process.env.OPENAI_API_KEY);
  // OpenAI : sk-... ou sk-proj-... — pas confondre avec sk-ant- (Anthropic)
  if (!key || key.startsWith("sk-ant-")) return undefined;
  if (!key.startsWith("sk-")) return undefined;
  return key;
}

/** Providers configurés et valides, dans l'ordre d'essai */
export function getAiProviderOrder(): AiProvider[] {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (forced === "openai") {
    return getOpenAiKey() ? ["openai"] : [];
  }
  if (forced === "anthropic") {
    return getAnthropicKey() ? ["anthropic"] : [];
  }

  const order: AiProvider[] = [];
  if (getOpenAiKey()) order.push("openai");
  if (getAnthropicKey()) order.push("anthropic");
  return order;
}

export function getAvailableAiProvider(): AiProvider | null {
  return getAiProviderOrder()[0] ?? null;
}

export function getAiConfigSummary(): {
  providers: AiProvider[];
  anthropicConfigured: boolean;
  openaiConfigured: boolean;
} {
  const anthropicConfigured = Boolean(getAnthropicKey());
  const openaiConfigured = Boolean(getOpenAiKey());
  return {
    providers: getAiProviderOrder(),
    anthropicConfigured,
    openaiConfigured,
  };
}

const SYSTEM_PROMPT = `Tu es l'assistant éditorial de Selekt — une curation personnelle de marques mode indépendantes (pas de fast fashion).

Ta mission : lire le contenu d'un site de marque et produire une fiche structurée en JSON.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide, sans markdown ni commentaire
2. Écris en français
3. Ne invente JAMAIS de faits (certifications, pays de fabrication, matières) absents du contenu
4. Si une info est incertaine → origin: "–", tags: [] pour ce badge
5. desc = 1-2 phrases de recommandation éditoriale (comme un ami qui conseille), pas du copywriting publicitaire
6. tags = max 3, choisis UNIQUEMENT parmi : ${BADGE_SUGGESTIONS.join(", ")}
7. category = exactement une valeur parmi : ${CATEGORY_OPTIONS.join(", ")}
8. price = exactement une valeur parmi : ${PRICE_OPTIONS.join(" | ")} — base-toi sur les prix visibles en euros
9. actu = phrase courte si drop/collection récente mentionnée, sinon null
10. imageUrl = URL directe d'une photo produit/campagne SI présente dans le contenu — jamais le logo, jamais inventée. null sinon
11. instagram / tiktok / twitter = URL profil officiel si trouvé, sinon null
12. Améliore le brouillon meta — ne reprends pas une description générique type "Shop the official store"`;

function buildUserPrompt(url: string, metaDraft: BrandDraft, pageText: string): string {
  return `Analyse cette marque mode pour Selekt.

URL : ${url}

Brouillon déjà extrait (meta) — à enrichir/corriger :
${JSON.stringify(metaDraft, null, 2)}

Données brutes du site :
${pageText}

Réponds avec ce JSON :
{
  "name": "nom court de la marque",
  "origin": "ville/pays ou –",
  "category": "une des catégories autorisées",
  "price": "Accessible | Milieu de gamme | Premium",
  "desc": "1-2 phrases éditoriales en français",
  "tags": ["badge1", "badge2"],
  "actu": "actu optionnelle ou null",
  "imageUrl": "https://… ou null",
  "instagram": "https://instagram.com/… ou null",
  "tiktok": "https://tiktok.com/@… ou null",
  "twitter": "https://x.com/… ou null"
}`;
}

function parseSocialField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function parseAiJson(raw: string): Partial<BrandDraft> {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<BrandDraft> & {
    actu?: string | null;
    imageUrl?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    twitter?: string | null;
  };

  const allowedTags = new Set<string>(BADGE_SUGGESTIONS);
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags
        .filter((t): t is string => typeof t === "string" && allowedTags.has(t))
        .slice(0, 3)
    : undefined;

  return {
    name: typeof parsed.name === "string" ? parsed.name.trim() : undefined,
    origin: typeof parsed.origin === "string" ? parsed.origin.trim() : undefined,
    category: typeof parsed.category === "string" ? parsed.category.trim() : undefined,
    price: typeof parsed.price === "string" ? parsed.price.trim() : undefined,
    desc: typeof parsed.desc === "string" ? parsed.desc.trim().slice(0, 280) : undefined,
    tags,
    actu:
      typeof parsed.actu === "string" && parsed.actu.trim()
        ? parsed.actu.trim().slice(0, 120)
        : undefined,
    imageUrl: parseSocialField(parsed.imageUrl),
    social: {
      instagram: parseSocialField(parsed.instagram),
      tiktok: parseSocialField(parsed.tiktok),
      twitter: parseSocialField(parsed.twitter),
    },
  };
}

function isWeakDesc(desc: string): boolean {
  return desc.startsWith("À compléter") || /shop (the|our)|official store|free shipping/i.test(desc);
}

function mergeDraft(metaDraft: BrandDraft, ai: Partial<BrandDraft>): BrandDraft {
  const mergedTags = ai.tags?.length ? ai.tags : metaDraft.tags;
  const mergedDesc =
    ai.desc && (!metaDraft.desc || isWeakDesc(metaDraft.desc) || ai.desc.length > metaDraft.desc.length)
      ? ai.desc
      : metaDraft.desc;

  return {
    ...metaDraft,
    name: ai.name || metaDraft.name,
    origin: ai.origin && ai.origin !== "–" ? ai.origin : metaDraft.origin,
    category: CATEGORY_OPTIONS.includes(ai.category as (typeof CATEGORY_OPTIONS)[number])
      ? ai.category!
      : metaDraft.category,
    price: PRICE_OPTIONS.includes(ai.price as (typeof PRICE_OPTIONS)[number])
      ? normalizePriceTier(ai.price!)
      : metaDraft.price,
    desc: mergedDesc,
    tags: mergedTags.length ? mergedTags : metaDraft.tags,
    actu: ai.actu || metaDraft.actu,
    imageUrl:
      ai.imageUrl && isUsableAssetUrl(ai.imageUrl) && !ai.imageUrl.toLowerCase().includes("logo")
        ? ai.imageUrl
        : metaDraft.imageUrl,
    social: mergeSocial(metaDraft.social, ai.social),
  };
}

function mergeSocial(
  base: BrandSocial | undefined,
  ai: BrandSocial | undefined,
): BrandSocial | undefined {
  const merged: BrandSocial = { ...base, ...ai };
  const cleaned = Object.fromEntries(
    Object.entries(merged).filter(([, v]) => typeof v === "string" && v.trim()),
  ) as BrandSocial;
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = getAnthropicKey();
  if (!apiKey) throw new Error("Clé Anthropic absente ou invalide");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic: ${response.status} — ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const text = data.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Réponse Anthropic vide");
  return text;
}

async function callOpenAi(prompt: string): Promise<string> {
  const apiKey = getOpenAiKey();
  if (!apiKey) throw new Error("Clé OpenAI absente ou invalide");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI: ${response.status} — ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const text = data.choices[0]?.message?.content;
  if (!text) throw new Error("Réponse OpenAI vide");
  return text;
}

async function callProvider(provider: AiProvider, prompt: string): Promise<string> {
  return provider === "anthropic" ? callAnthropic(prompt) : callOpenAi(prompt);
}

export async function enrichDraftWithAi(
  url: string,
  metaDraft: BrandDraft,
  pageText: string,
): Promise<{ draft: BrandDraft; provider: AiProvider }> {
  const providers = getAiProviderOrder();
  if (providers.length === 0) {
    throw new Error("Aucune clé IA configurée");
  }

  const prompt = buildUserPrompt(url, metaDraft, pageText);
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      const raw = await callProvider(provider, prompt);
      const ai = parseAiJson(raw);
      return { provider, draft: mergeDraft(metaDraft, ai) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur IA";
      errors.push(message);
    }
  }

  throw new Error(formatAiErrorMessage(errors.join(" | ")));
}

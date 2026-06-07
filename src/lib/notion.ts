import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { Brand } from "@/types/brand";
import { NOTION_PROPERTIES } from "@/types/brand";
import type { PublishBrandInput } from "@/types/brand-draft";
import { normalizePriceTier } from "@/lib/price-tier";
import { paletteFromName } from "@/lib/palette";

const NOTION_API_VERSION = "2025-09-03";

const notion = process.env.NOTION_TOKEN
  ? new Client({ auth: process.env.NOTION_TOKEN, notionVersion: NOTION_API_VERSION })
  : null;

/** Extrait l'ID depuis une URL Notion ou renvoie la valeur telle quelle. */
function normalizeNotionDatabaseId(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("http")) {
    return trimmed;
  }

  try {
    const segment = new URL(trimmed).pathname.split("/").filter(Boolean).pop() ?? "";
    const id = segment.split("?")[0];
    if (/^[0-9a-f-]{32,36}$/i.test(id)) {
      return id;
    }
  } catch {
    // valeur brute conservée
  }

  return trimmed;
}

function getNotionDataSourceId(): string | undefined {
  const raw = process.env.NOTION_DATABASE_ID;
  if (!raw) return undefined;
  return normalizeNotionDatabaseId(raw);
}

function getTitle(page: PageObjectResponse, prop: string): string {
  const property = page.properties[prop];
  if (!property || property.type !== "title") return "";
  return property.title.map((t) => t.plain_text).join("");
}

function getRichText(page: PageObjectResponse, prop: string): string {
  const property = page.properties[prop];
  if (!property || property.type !== "rich_text") return "";
  return property.rich_text.map((t) => t.plain_text).join("");
}

function getUrl(page: PageObjectResponse, prop: string): string {
  const property = page.properties[prop];
  if (!property || property.type !== "url" || !property.url) return "#";
  return property.url;
}

function getSelect(page: PageObjectResponse, prop: string): string {
  const property = page.properties[prop];
  if (!property || property.type !== "select" || !property.select) return "";
  return property.select.name;
}

function getTextOrSelect(page: PageObjectResponse, prop: string): string {
  return getRichText(page, prop) || getSelect(page, prop);
}

function parseNumberFromProperty(
  page: PageObjectResponse,
  prop: string,
  fallback = 0,
): number {
  const property = page.properties[prop];
  if (!property) return fallback;
  if (property.type === "number" && property.number !== null) return property.number;
  if (property.type === "rich_text") {
    const parsed = Number(property.rich_text.map((t) => t.plain_text).join(""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function getPartialScore(page: PageObjectResponse, prop: string): boolean {
  const property = page.properties[prop];
  if (!property) return false;
  if (property.type === "checkbox") return property.checkbox;
  if (property.type === "select") return property.select?.name === "Oui";
  return false;
}

function collectBadges(page: PageObjectResponse, ...props: string[]): string[] {
  return props.flatMap((prop) => {
    const select = getSelect(page, prop);
    const text = getRichText(page, prop);
    return [select, text].filter(Boolean);
  });
}

function getActu(page: PageObjectResponse, prop: string): string | undefined {
  const property = page.properties[prop];
  if (!property) return undefined;
  if (property.type === "rich_text") {
    const text = property.rich_text.map((t) => t.plain_text).join("");
    return text || undefined;
  }
  if (property.type === "number" && property.number !== null && property.number !== 0) {
    return String(property.number);
  }
  return undefined;
}

function pageToBrand(page: PageObjectResponse): Brand {
  const name = getTitle(page, NOTION_PROPERTIES.name);
  const palette = paletteFromName(name);
  const color = getRichText(page, NOTION_PROPERTIES.color) || palette.color;
  const accent = getRichText(page, NOTION_PROPERTIES.accent) || palette.accent;

  return {
    id: page.id,
    name,
    url: getUrl(page, NOTION_PROPERTIES.url),
    origin: getTextOrSelect(page, NOTION_PROPERTIES.origin),
    category: getTextOrSelect(page, NOTION_PROPERTIES.category) || "Indé",
    price: normalizePriceTier(getSelect(page, NOTION_PROPERTIES.price) || getRichText(page, NOTION_PROPERTIES.price)),
    score: parseNumberFromProperty(page, NOTION_PROPERTIES.score, 0),
    maxScore: parseNumberFromProperty(page, NOTION_PROPERTIES.maxScore, 5) || 5,
    partial: getPartialScore(page, NOTION_PROPERTIES.partial),
    desc: getTextOrSelect(page, NOTION_PROPERTIES.description) || "À compléter",
    tags: collectBadges(
      page,
      NOTION_PROPERTIES.badge1,
      NOTION_PROPERTIES.badge2,
      NOTION_PROPERTIES.badge3,
    ),
    color,
    accent,
    textOnImg: palette.textOnImg,
    actu: getActu(page, NOTION_PROPERTIES.actu),
    imageUrl: getOptionalUrl(page, NOTION_PROPERTIES.image),
    logoUrl: getOptionalUrl(page, NOTION_PROPERTIES.logo),
    social: (() => {
      const links = {
        instagram: getOptionalUrl(page, NOTION_PROPERTIES.instagram),
        tiktok: getOptionalUrl(page, NOTION_PROPERTIES.tiktok),
        twitter: getOptionalUrl(page, NOTION_PROPERTIES.twitter),
      };
      return links.instagram || links.tiktok || links.twitter ? links : undefined;
    })(),
    updatedAt: page.last_edited_time,
  };
}

function getOptionalUrl(page: PageObjectResponse, prop: string): string | undefined {
  const value = getUrl(page, prop);
  return value && value !== "#" ? value : undefined;
}

function isFullPage(
  result: QueryDatabaseResponse["results"][number],
): result is PageObjectResponse {
  return "properties" in result;
}

type DataSourceQueryResponse = {
  results: QueryDatabaseResponse["results"];
  has_more: boolean;
  next_cursor: string | null;
};

export function isNotionConfigured(): boolean {
  return Boolean(notion && getNotionDataSourceId());
}

export async function fetchBrandsFromNotion(): Promise<Brand[]> {
  const dataSourceId = getNotionDataSourceId();
  if (!notion || !dataSourceId) {
    throw new Error("Notion non configuré");
  }

  const brands: Brand[] = [];
  let cursor: string | undefined;

  do {
    const response = (await notion.request({
      path: `data_sources/${dataSourceId}/query`,
      method: "post",
      body: {
        start_cursor: cursor,
        sorts: [{ property: NOTION_PROPERTIES.name, direction: "ascending" }],
      },
    })) as DataSourceQueryResponse;

    for (const result of response.results) {
      if (isFullPage(result)) {
        brands.push(pageToBrand(result));
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return brands;
}

function richTextProp(value: string) {
  return { rich_text: [{ text: { content: value.slice(0, 2000) } }] };
}

function titleProp(value: string) {
  return { title: [{ text: { content: value.slice(0, 200) } }] };
}

function sanitizeSelectOption(value: string): string {
  return value.replace(/,/g, " · ").replace(/\s+/g, " ").trim();
}

function selectProp(value: string, maxLength = 100) {
  return { select: { name: sanitizeSelectOption(value).slice(0, maxLength) } };
}

function mapPriceToNotion(price: string): string {
  return normalizePriceTier(price);
}

function normalizeUrlForCompare(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    parsed.search = "";
    let path = parsed.pathname.replace(/\/$/, "");
    if (!path) path = "";
    return `${parsed.origin}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "");
  }
}

function urlProp(value: string) {
  return { url: value.trim() };
}

function buildNotionProperties(input: PublishBrandInput) {
  const [badge1, badge2, badge3] = input.tags;

  const properties: Record<string, unknown> = {
    [NOTION_PROPERTIES.name]: titleProp(input.name),
    [NOTION_PROPERTIES.url]: { url: input.url },
    [NOTION_PROPERTIES.origin]: richTextProp(input.origin),
    [NOTION_PROPERTIES.category]: richTextProp(input.category),
    [NOTION_PROPERTIES.price]: selectProp(mapPriceToNotion(input.price)),
    [NOTION_PROPERTIES.score]: richTextProp(String(input.score)),
    [NOTION_PROPERTIES.maxScore]: richTextProp(String(input.maxScore)),
    [NOTION_PROPERTIES.partial]: selectProp(input.partial ? "Oui" : "Non"),
    [NOTION_PROPERTIES.description]: selectProp(input.desc || "À compléter", 2000),
  };

  if (input.actu?.trim()) {
    properties[NOTION_PROPERTIES.actu] = richTextProp(input.actu);
  }

  if (input.imageUrl?.trim()) {
    properties[NOTION_PROPERTIES.image] = urlProp(input.imageUrl);
  }

  if (input.logoUrl?.trim()) {
    properties[NOTION_PROPERTIES.logo] = urlProp(input.logoUrl);
  }

  if (input.social?.instagram?.trim()) {
    properties[NOTION_PROPERTIES.instagram] = urlProp(input.social.instagram);
  }

  if (input.social?.tiktok?.trim()) {
    properties[NOTION_PROPERTIES.tiktok] = urlProp(input.social.tiktok);
  }

  if (input.social?.twitter?.trim()) {
    properties[NOTION_PROPERTIES.twitter] = urlProp(input.social.twitter);
  }

  if (badge1) properties[NOTION_PROPERTIES.badge1] = selectProp(badge1);
  if (badge2) properties[NOTION_PROPERTIES.badge2] = richTextProp(badge2);
  if (badge3) properties[NOTION_PROPERTIES.badge3] = richTextProp(badge3);

  return properties;
}

async function findPageIdByUrl(targetUrl: string): Promise<string | undefined> {
  const dataSourceId = getNotionDataSourceId();
  if (!notion || !dataSourceId) return undefined;

  const normalizedTarget = normalizeUrlForCompare(targetUrl);

  let cursor: string | undefined;
  do {
    const response = (await notion.request({
      path: `data_sources/${dataSourceId}/query`,
      method: "post",
      body: { start_cursor: cursor, page_size: 100 },
    })) as DataSourceQueryResponse;

    for (const result of response.results) {
      if (!isFullPage(result)) continue;
      const pageUrl = getUrl(result, NOTION_PROPERTIES.url);
      if (pageUrl !== "#" && normalizeUrlForCompare(pageUrl) === normalizedTarget) {
        return result.id;
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return undefined;
}

export async function updateBrandInNotion(
  pageId: string,
  input: PublishBrandInput,
): Promise<void> {
  if (!notion) throw new Error("Notion non configuré");

  await notion.request({
    path: `pages/${pageId}`,
    method: "patch",
    body: { properties: buildNotionProperties(input) },
  });
}

export async function deleteBrandInNotion(pageId: string): Promise<void> {
  if (!notion) throw new Error("Notion non configuré");

  await notion.request({
    path: `pages/${pageId}`,
    method: "patch",
    body: { archived: true },
  });
}

export async function createBrandInNotion(input: PublishBrandInput): Promise<string> {
  const dataSourceId = getNotionDataSourceId();
  if (!notion || !dataSourceId) {
    throw new Error("Notion non configuré");
  }

  const page = (await notion.request({
    path: "pages",
    method: "post",
    body: {
      parent: { type: "data_source_id", data_source_id: dataSourceId },
      properties: buildNotionProperties(input),
    },
  })) as { id: string };

  return page.id;
}

/** Crée ou met à jour si l'URL existe déjà — pratique pour backfill image / réseaux */
export async function upsertBrandInNotion(
  input: PublishBrandInput,
): Promise<{ id: string; created: boolean }> {
  const existingId = await findPageIdByUrl(input.url);
  if (existingId) {
    await updateBrandInNotion(existingId, input);
    return { id: existingId, created: false };
  }

  const id = await createBrandInNotion(input);
  return { id, created: true };
}

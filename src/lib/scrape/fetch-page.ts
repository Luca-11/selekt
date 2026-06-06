const USER_AGENT =
  "Mozilla/5.0 (compatible; SelektBot/1.0; +https://selekt.app) AppleWebKit/537.36";

/** Les metas sont dans le <head> — inutile de garder 2 Mo de HTML Shopify */
const MAX_HTML_CHARS = 800_000;

const TAIL_HTML_CHARS = 200_000;

export interface PageFetchResult {
  html: string;
  finalUrl: string;
  truncated: boolean;
  /** Fin du HTML brut — utile si le footer (réseaux sociaux) est coupé par la troncature */
  htmlTail?: string;
}

export async function fetchPage(url: string): Promise<PageFetchResult> {
  const normalized = url.startsWith("http") ? url : `https://${url}`;

  const response = await fetch(normalized, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Impossible d'accéder au site (${response.status})`);
  }

  const raw = await response.text();
  const truncated = raw.length > MAX_HTML_CHARS;
  const html = truncated ? raw.slice(0, MAX_HTML_CHARS) : raw;
  const htmlTail = truncated ? raw.slice(-TAIL_HTML_CHARS) : undefined;

  return { html, finalUrl: response.url, truncated, htmlTail };
}

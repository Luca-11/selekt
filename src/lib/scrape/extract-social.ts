import type { BrandSocial } from "@/types/brand-draft";

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanSocialUrl(raw: string): string | undefined {
  try {
    let href = decodeHtmlEntities(raw.trim());
    href = href.replace(/\\+/g, "").replace(/["']/g, "");
    if (!href || href === "#" || href.startsWith("javascript:")) return undefined;

    if (href.startsWith("//")) href = `https:${href}`;
    if (!href.startsWith("http")) href = `https://${href.replace(/^\/+/, "")}`;

    const url = new URL(href);
    url.search = "";
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function pickInstagram(url: string): string | undefined {
  const clean = cleanSocialUrl(url);
  if (!clean || !/instagram\.com/i.test(clean)) return undefined;
  if (/\/(p|reel|stories|explore|accounts|direct)\//i.test(clean)) return undefined;
  return clean;
}

function pickTiktok(url: string): string | undefined {
  const clean = cleanSocialUrl(url);
  if (!clean || !/tiktok\.com/i.test(clean)) return undefined;
  if (/\/(video|share|tag|music)\//i.test(clean)) return undefined;
  return clean;
}

function pickTwitter(url: string): string | undefined {
  const clean = cleanSocialUrl(url);
  if (!clean || !/(twitter\.com|x\.com)/i.test(clean)) return undefined;
  if (/\/(home|search|intent|share|hashtag|i)\//i.test(clean)) return undefined;
  return clean.replace(/twitter\.com/i, "x.com");
}

function twitterFromHandle(handle: string): string | undefined {
  const clean = handle.trim().replace(/^@/, "").replace(/[^\w.]/g, "");
  if (!clean || clean.length < 2) return undefined;
  return `https://x.com/${clean}`;
}

function assignFromUrl(social: BrandSocial, url: string) {
  if (!social.instagram) {
    const ig = pickInstagram(url);
    if (ig) social.instagram = ig;
  }
  if (!social.tiktok) {
    const tt = pickTiktok(url);
    if (tt) social.tiktok = tt;
  }
  if (!social.twitter) {
    const tw = pickTwitter(url);
    if (tw) social.twitter = tw;
  }
}

function extractSameAsFromJsonLd(html: string): string[] {
  const urls: string[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(regex)) {
    try {
      const text = JSON.stringify(JSON.parse(match[1]));
      for (const urlMatch of text.matchAll(/https?:\\\/\\\/[^"\\]+/g)) {
        urls.push(urlMatch[0].replace(/\\\//g, "/"));
      }
      for (const urlMatch of text.matchAll(/https?:\/\/[^"]+/g)) {
        urls.push(urlMatch[0]);
      }
    } catch {
      // ignore
    }
  }

  return urls;
}

function extractFromMetaTags(html: string, social: BrandSocial) {
  const metaPatterns = [
    /<meta[^>]+(?:name|property)=["'](twitter:site|twitter:creator)["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](twitter:site|twitter:creator)["']/gi,
  ];

  for (const pattern of metaPatterns) {
    for (const match of html.matchAll(pattern)) {
      const content = match[1]?.startsWith("twitter:") ? match[2] : match[1];
      if (!content || !social.twitter) {
        const tw = twitterFromHandle(content ?? "");
        if (tw) social.twitter = tw;
      }
    }
  }
}

function extractFromShopifySettings(html: string, social: BrandSocial) {
  const patterns = [
    /"social_instagram_link"\s*:\s*"([^"]+)"/gi,
    /"social_tiktok_link"\s*:\s*"([^"]+)"/gi,
    /"social_twitter_link"\s*:\s*"([^"]+)"/gi,
    /"social_facebook_link"\s*:\s*"([^"]+)"/gi,
  ];

  for (const match of html.matchAll(patterns[0])) assignFromUrl(social, match[1]);
  for (const match of html.matchAll(patterns[1])) assignFromUrl(social, match[1]);
  for (const match of html.matchAll(patterns[2])) assignFromUrl(social, match[1]);
}

function extractPlainSocialUrls(html: string): string[] {
  const urls: string[] = [];

  const patterns = [
    /(?:https?:)?\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._-]+/gi,
    /(?:https?:)?\/\/(?:www\.)?tiktok\.com\/@[A-Za-z0-9._-]+/gi,
    /(?:https?:)?\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[A-Za-z0-9._-]+/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      urls.push(match[0]);
    }
  }

  return urls;
}

function hasAnySocial(social: BrandSocial): boolean {
  return Boolean(social.instagram || social.tiktok || social.twitter);
}

/** Extrait les liens réseaux sociaux depuis le HTML */
export function extractSocialLinks(html: string, htmlTail?: string): BrandSocial {
  const social: BrandSocial = {};
  const chunks = htmlTail ? [html, htmlTail] : [html];

  for (const chunk of chunks) {
    for (const url of extractSameAsFromJsonLd(chunk)) {
      assignFromUrl(social, url);
    }

    for (const match of chunk.matchAll(/href=["']([^"']+)["']/gi)) {
      assignFromUrl(social, match[1]);
    }

    for (const url of extractPlainSocialUrls(chunk)) {
      assignFromUrl(social, url);
    }

    extractFromMetaTags(chunk, social);
    extractFromShopifySettings(chunk, social);
  }

  return hasAnySocial(social) ? social : {};
}

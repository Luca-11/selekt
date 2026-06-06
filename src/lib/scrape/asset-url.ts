/** Valide qu'une URL d'asset est utilisable (évite http://files/... etc.) */
export function isUsableAssetUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;

  try {
    const parsed = new URL(url.trim());
    if (!/^https?:$/i.test(parsed.protocol)) return false;

    const host = parsed.hostname.toLowerCase();
    const blockedHosts = ["files", "file", "localhost", "127.0.0.1"];
    if (blockedHosts.includes(host)) return false;

    // Doit ressembler à un vrai domaine ou CDN
    if (!host.includes(".") && !host.includes("cdn")) return false;

    return true;
  } catch {
    return false;
  }
}

/** Résout une URL relative par rapport à la page analysée */
export function resolveAssetUrl(raw: string | undefined, baseUrl: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const href = raw.trim();

  try {
    let resolved: string;
    if (href.startsWith("//")) resolved = `https:${href}`;
    else if (/^https?:\/\//i.test(href)) resolved = href;
    else if (href.startsWith("/")) resolved = new URL(href, baseUrl).href;
    else if (!href.includes("://") && !href.startsWith("//")) {
      // chemin relatif sans slash → base du site
      resolved = new URL(`/${href.replace(/^\//, "")}`, baseUrl).href;
    } else resolved = new URL(href, baseUrl).href;

    return isUsableAssetUrl(resolved) ? resolved : undefined;
  } catch {
    return undefined;
  }
}

import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { scrapeBrandUrl } from "@/lib/scrape";
import { getAvailableAiProvider } from "@/lib/ai/extract-brand";

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { url } = (await request.json()) as { url?: string };

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL requise" }, { status: 400 });
  }

  try {
    const result = await scrapeBrandUrl(url.trim());
    return NextResponse.json({
      ...result,
      aiAvailable: Boolean(getAvailableAiProvider()),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de scraping";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

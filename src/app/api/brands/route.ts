import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getBrands } from "@/lib/get-brands";
import { isNotionConfigured, upsertBrandInNotion } from "@/lib/notion";
import type { BrandSocial, PublishBrandInput } from "@/types/brand-draft";
import { CATEGORY_OPTIONS, PRICE_OPTIONS } from "@/types/brand-draft";
import { normalizePriceTier } from "@/lib/price-tier";

function parseSocial(body: Record<string, unknown>): BrandSocial | undefined {
  const raw = body.social;
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const s = raw as Record<string, unknown>;
  const social: BrandSocial = {
    instagram: typeof s.instagram === "string" ? s.instagram.trim() : undefined,
    tiktok: typeof s.tiktok === "string" ? s.tiktok.trim() : undefined,
    twitter: typeof s.twitter === "string" ? s.twitter.trim() : undefined,
  };

  return social.instagram || social.tiktok || social.twitter ? social : undefined;
}

function validateInput(body: unknown): PublishBrandInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || !b.name.trim()) return null;
  if (typeof b.url !== "string" || !b.url.trim()) return null;
  if (typeof b.desc !== "string") return null;

  const score = Number(b.score);
  const maxScore = Number(b.maxScore ?? 5);

  return {
    name: b.name.trim(),
    url: b.url.trim(),
    origin: typeof b.origin === "string" ? b.origin.trim() : "–",
    category:
      typeof b.category === "string" && CATEGORY_OPTIONS.includes(b.category as never)
        ? b.category
        : "Indé",
    price:
      typeof b.price === "string" ? normalizePriceTier(b.price) : "Milieu de gamme",
    desc: b.desc.trim(),
    tags: Array.isArray(b.tags)
      ? b.tags.filter((t): t is string => typeof t === "string").slice(0, 3)
      : [],
    actu: typeof b.actu === "string" ? b.actu.trim() : undefined,
    imageUrl: typeof b.imageUrl === "string" ? b.imageUrl.trim() : undefined,
    logoUrl: typeof b.logoUrl === "string" ? b.logoUrl.trim() : undefined,
    social: parseSocial(b),
    score: Number.isFinite(score) ? Math.min(5, Math.max(0, score)) : 0,
    maxScore: Number.isFinite(maxScore) ? Math.min(5, Math.max(1, maxScore)) : 5,
    partial: Boolean(b.partial),
    featured: Boolean(b.featured),
  };
}

export const revalidate = 300;

export async function GET() {
  const { brands, source } = await getBrands();
  return NextResponse.json({ brands, source, count: brands.length });
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isNotionConfigured()) {
    return NextResponse.json({ error: "Notion non configuré" }, { status: 503 });
  }

  const input = validateInput(await request.json());
  if (!input) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    const { id, created } = await upsertBrandInNotion(input);
    revalidatePath("/");
    revalidatePath("/api/brands");

    return NextResponse.json({ ok: true, id, name: input.name, created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Notion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getBrands } from "@/lib/get-brands";
import { isNotionConfigured, upsertBrandInNotion } from "@/lib/notion";
import { validatePublishInput } from "@/lib/validate-publish-input";

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

  const input = validatePublishInput(await request.json());
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

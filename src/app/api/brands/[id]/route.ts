import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { deleteBrandInNotion, isNotionConfigured, updateBrandInNotion } from "@/lib/notion";
import { validatePublishInput } from "@/lib/validate-publish-input";

type RouteContext = { params: Promise<{ id: string }> };

function revalidateSite() {
  revalidatePath("/");
  revalidatePath("/api/brands");
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isNotionConfigured()) {
    return NextResponse.json({ error: "Notion non configuré" }, { status: 503 });
  }

  const { id } = await context.params;
  const input = validatePublishInput(await request.json());

  if (!id || !input) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    await updateBrandInNotion(id, input);
    revalidateSite();
    return NextResponse.json({ ok: true, id, name: input.name, updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Notion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isNotionConfigured()) {
    return NextResponse.json({ error: "Notion non configuré" }, { status: 503 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  try {
    await deleteBrandInNotion(id);
    revalidateSite();
    return NextResponse.json({ ok: true, id, deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Notion";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

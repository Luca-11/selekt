import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  getAdminCookieValue,
  isAdminConfigured,
  verifyAdminRequest,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD non configuré dans .env.local" },
      { status: 503 },
    );
  }

  const { password } = (await request.json()) as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = getAdminCookieValue();
  if (!token) {
    return NextResponse.json({ error: "Configuration admin invalide" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}

export async function GET(request: Request) {
  return NextResponse.json({
    authenticated: verifyAdminRequest(request),
    configured: isAdminConfigured(),
  });
}

import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "selekt_admin";

function adminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHash("sha256").update(`selekt:${password}`).digest("hex");
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function verifyAdminToken(token: string | undefined): boolean {
  const expected = adminToken();
  if (!expected || !token) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function getAdminCookieValue(): string | null {
  return adminToken();
}

export function verifyAdminRequest(request: Request): boolean {
  const expected = adminToken();
  if (!expected) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${process.env.ADMIN_PASSWORD}`) return true;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return verifyAdminToken(match?.[1]);
}

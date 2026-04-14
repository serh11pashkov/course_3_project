import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set(["/", "/auth/login", "/auth/register"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  // Allow NextAuth routes, static, and public files.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret });
  if (!token) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as "student" | "teacher" | null | undefined;
  const needsRole = Boolean(token.needsRole);
  if (needsRole && pathname !== "/onboarding/role") {
    return NextResponse.redirect(new URL("/onboarding/role", req.url));
  }

  // Teacher area guard
  if (pathname.startsWith("/teacher") && role !== "teacher") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Prevent teacher accounts from landing on student dashboard.
  if (pathname === "/dashboard" && role === "teacher") {
    return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

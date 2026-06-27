import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("ims_session")?.value;
  const { pathname } = request.nextUrl;

  // Paths that can be accessed without logging in
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Redirect to login if session does not exist
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Decode user session details
  let user: { roleName: string } | null = null;
  try {
    const decoded = Buffer.from(session, "base64").toString("utf-8");
    user = JSON.parse(decoded);
  } catch (e) {
    // Session is corrupt
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("ims_session");
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role authorization checks
  // Settings page is now open to all authenticated users for profile modifications

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication APIs)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

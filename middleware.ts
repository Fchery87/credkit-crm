import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromHost } from "@/lib/tenant";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = req.headers.get("host") || "";
  const tenantId = getTenantIdFromHost(host) || "demo";

  const res = NextResponse.next();
  res.headers.set("x-tenant-id", tenantId);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/health).*)",
  ],
};


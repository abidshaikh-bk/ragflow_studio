import type { NextRequest } from "next/server";
import { updateSession } from "@/server/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/chat/:path*", "/documents/:path*", "/settings/:path*", "/login", "/register"]
};

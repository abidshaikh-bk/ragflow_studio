import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/env";
import {
  E2E_AUTH_COOKIE_NAME,
  hasE2EAuthCookie,
  isE2EAuthBypassEnabled
} from "@/server/auth/e2e";

const protectedRoutePrefixes = ["/chat", "/documents", "/settings"] as const;
const authRoutes = ["/login", "/register"] as const;

export function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some(
    (routePrefix) =>
      pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)
  );
}

export function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname as (typeof authRoutes)[number]);
}

export async function updateSession(request: NextRequest) {
  const hasBypassUser =
    isE2EAuthBypassEnabled() &&
    hasE2EAuthCookie(request.cookies.get(E2E_AUTH_COOKIE_NAME)?.value);

  if (hasBypassUser) {
    if (isAuthRoute(request.nextUrl.pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/chat";
      redirectUrl.search = "";

      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  let response = NextResponse.next();

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next();

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);

    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/chat";
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

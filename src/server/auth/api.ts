import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getE2EAuthenticatedUser } from "@/server/auth/e2e";
import { getAdminAccessState } from "@/server/auth/authorization";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type AuthenticatedApiContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  user: User;
  userId: string;
};

export async function withAuthenticatedApiRoute<TArgs extends unknown[]>(
  handler: (auth: AuthenticatedApiContext, ...args: TArgs) => Promise<Response>,
  ...args: TArgs
) {
  const supabase = await createServerSupabaseClient();
  const e2eUser = await getE2EAuthenticatedUser();

  if (e2eUser) {
    return handler(
      {
        supabase,
        user: e2eUser,
        userId: e2eUser.id
      },
      ...args
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler(
    {
      supabase,
      user,
      userId: user.id
    },
    ...args
  );
}

export async function withAdminApiRoute<TArgs extends unknown[]>(
  handler: (auth: AuthenticatedApiContext, ...args: TArgs) => Promise<Response>,
  ...args: TArgs
) {
  return withAuthenticatedApiRoute(async (auth, ...handlerArgs) => {
    const isAdmin = await getAdminAccessState({
      supabase: auth.supabase,
      user: auth.user
    });

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(auth, ...handlerArgs);
  }, ...args);
}

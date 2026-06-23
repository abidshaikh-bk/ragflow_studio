import { NextResponse } from "next/server";
import { getE2EAuthenticatedUser } from "@/server/auth/e2e";
import { createServerSupabaseClient } from "@/server/supabase/server";

export type AuthenticatedApiContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
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
      userId: user.id
    },
    ...args
  );
}

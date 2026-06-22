import { NextResponse } from "next/server";
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

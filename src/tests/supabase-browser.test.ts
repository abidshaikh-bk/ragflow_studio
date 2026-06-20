import { beforeEach, describe, expect, it, vi } from "vitest";

const createBrowserClientMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => createBrowserClientMock(...args)
}));

describe("createBrowserSupabaseClient", () => {
  beforeEach(() => {
    vi.resetModules();
    createBrowserClientMock.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("uses static public env values to create the browser client once", async () => {
    const fakeClient = { auth: {} };
    createBrowserClientMock.mockReturnValue(fakeClient);

    const { createBrowserSupabaseClient } = await import("@/lib/supabase/browser");

    const first = createBrowserSupabaseClient();
    const second = createBrowserSupabaseClient();

    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
    expect(first).toBe(fakeClient);
    expect(second).toBe(fakeClient);
  });
});

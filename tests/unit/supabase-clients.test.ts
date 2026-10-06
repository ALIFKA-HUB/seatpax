import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  values: [] as { name: string; value: string; options?: Record<string, unknown> }[],
  writeError: null as Error | null,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => state.values.map(({ name, value }) => ({ name, value })),
    set: (name: string, value: string, options: Record<string, unknown>) => {
      if (state.writeError) throw state.writeError;
      state.values.push({ name, value, options });
    },
  }),
}));
// SDK network/storage are external; this fake exposes the adapter's effective config and cookie bridge.
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (url: string, key: string) => ({ url, key }),
  createServerClient: (url: string, key: string, options: {
    cookies: { getAll: () => unknown; setAll: (values: unknown) => void };
  }) => ({
    url, key,
    readCookies: options.cookies.getAll,
    writeCookies: options.cookies.setAll,
  }),
}));

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ClientFixture = {
  url: string; key: string;
  readCookies: () => unknown;
  writeCookies: (values: { name: string; value: string; options: Record<string, unknown> }[]) => void;
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_demo");
  vi.stubEnv("DATABASE_URL", "postgresql://PRIVATE_CANARY@host/db");
  state.values = [{ name: "session", value: "existing" }];
  state.writeError = null;
});
afterEach(() => vi.unstubAllEnvs());

describe("Supabase client adapters", () => {
  it("browser client gets only project URL and publishable key", () => {
    expect(createBrowserSupabaseClient()).toEqual({ url: "https://example.supabase.co", key: "sb_publishable_demo" });
  });
  it("server client reads incoming cookies", async () => {
    const client = await createServerSupabaseClient() as unknown as ClientFixture;
    expect(client.readCookies()).toEqual([{ name: "session", value: "existing" }]);
  });
  it("writable mode persists cookie values and security options", async () => {
    const client = await createServerSupabaseClient({ cookieMode: "read-write" }) as unknown as ClientFixture;
    client.writeCookies([{ name: "refreshed", value: "new", options: { httpOnly: true, sameSite: "lax", path: "/" } }]);
    expect(state.values[1]).toEqual({ name: "refreshed", value: "new", options: { httpOnly: true, sameSite: "lax", path: "/" } });
  });
  it("read-only mode avoids illegal writes in Server Components", async () => {
    state.writeError = new Error("Cookies can only be modified in a Server Action or Route Handler.");
    const client = await createServerSupabaseClient({ cookieMode: "read-only" }) as unknown as ClientFixture;
    expect(() => client.writeCookies([{ name: "refreshed", value: "new", options: {} }])).not.toThrow();
    expect(state.values).toEqual([{ name: "session", value: "existing" }]);
  });
  it("propagates unrelated write failures in writable mode", async () => {
    state.writeError = new Error("unexpected storage failure");
    const client = await createServerSupabaseClient({ cookieMode: "read-write" }) as unknown as ClientFixture;
    expect(() => client.writeCookies([{ name: "refreshed", value: "new", options: {} }])).toThrow("unexpected storage failure");
  });
  it("rejects missing public config without including database secret", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() => createBrowserSupabaseClient()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    await expect(createServerSupabaseClient()).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    await expect(createServerSupabaseClient()).rejects.not.toThrow(/PRIVATE_CANARY/);
  });
});

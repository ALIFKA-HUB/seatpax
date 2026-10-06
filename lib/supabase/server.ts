import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "../env/public";

export async function createServerSupabaseClient(
  options: { cookieMode?: "read-only" | "read-write" } = {},
) {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        // Server Components cannot write cookies. Day 3 proxy owns session refresh.
        // Route Handlers / Server Actions must explicitly select read-write mode.
        if (options.cookieMode !== "read-write") return;
        for (const { name, value, options: cookieOptions } of values) {
          cookieStore.set(name, value, cookieOptions);
        }
      },
    },
  });
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "../env/public";

export function createBrowserSupabaseClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}

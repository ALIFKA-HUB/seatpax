import 'server-only';
import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getVerifiedUser(): Promise<User | null> {
  try {
    const client = await createServerSupabaseClient();
    const { data, error } = await client.auth.getUser();
    return error ? null : data.user;
  } catch { return null; }
}

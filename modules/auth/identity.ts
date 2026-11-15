import 'server-only';
import * as React from 'react';
import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const requestCache =
  (React as { cache?: <T extends (...args: never[]) => unknown>(fn: T) => T }).cache ??
  (<T extends (...args: never[]) => unknown>(fn: T): T => fn);

export const getVerifiedUser = requestCache(async (): Promise<User | null> => {
  try {
    const client = await createServerSupabaseClient();
    const { data, error } = await client.auth.getUser();
    return error ? null : data.user;
  } catch { return null; }
});

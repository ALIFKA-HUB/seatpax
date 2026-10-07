import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getPublicEnv } from '@/lib/env/public';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();
  const pendingCookies = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const cacheHeaders = new Headers({ 'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0', Pragma: 'no-cache', Expires: '0' });
  const client = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        for (const cookie of values) {
          request.cookies.set(cookie.name, cookie.value);
          pendingCookies.set(cookie.name, cookie);
        }
        for (const [name, value] of Object.entries(headers)) cacheHeaders.set(name, value);
      },
    },
  });
  try { await client.auth.getUser(); }
  catch { /* Private pages independently reject an unverifiable identity. */ }
  const response = NextResponse.next({ request });
  for (const { name, value, options } of pendingCookies.values()) response.cookies.set(name, value, options);
  cacheHeaders.forEach((value, name) => response.headers.set(name, value));
  return response;
}

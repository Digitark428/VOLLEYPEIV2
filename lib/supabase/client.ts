'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from './env';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, key } = getSupabasePublicConfig();
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
}

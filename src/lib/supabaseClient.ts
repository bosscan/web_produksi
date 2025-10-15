import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any)?.env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string | undefined;

// Provide a minimal no-op stub to avoid crashing in environments where env vars are not set (e.g., Vercel before configuring envs)
function createNoopClient() {
  const noop = async (..._args: any[]) => ({ data: null, error: null, count: null });
  const from = (_table: string) => ({
    select: noop,
    insert: noop,
    upsert: noop,
    delete: noop,
    update: noop,
    eq: noop,
    limit: (_n: number) => ({ select: noop }),
  });
  const channel = (_name: string) => ({
    on: (_event: any, _filter: any, _cb: any) => ({ subscribe: () => ({}) }),
    subscribe: () => ({}),
  });
  // Shape-compatible subset we use in this app
  return { from, channel } as any;
}

let client: any;
try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } else {
    if (typeof window !== 'undefined') {
      console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing; Supabase features are disabled.');
    }
    client = createNoopClient();
  }
} catch (e) {
  // If createClient throws due to invalid envs, fall back to no-op client to avoid breaking the app
  if (typeof window !== 'undefined') console.warn('[supabase] client init failed, using noop client:', e);
  client = createNoopClient();
}

export const supabase = client;
export default client;

import supabase from './supabaseClient';

const enabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
if (typeof window !== 'undefined') {
  // Minimal diagnostics in console so users can quickly see status in DevTools
  console.info('[cloudSync] enabled =', enabled, 'url =', import.meta.env.VITE_SUPABASE_URL ? 'set' : 'missing');
}

// Keys to sync and their table names
const TABLES: Record<string, string> = {
  'antrian_input_desain': 'antrian_input_desain',
  'design_queue': 'design_queue',
  'keranjang': 'keranjang',
  'plotting_rekap_bordir_queue': 'plotting_rekap_bordir_queue',
  'spk_pipeline': 'spk_pipeline',
  'method_rekap_bordir': 'method_rekap_bordir',
  'spk_orders': 'spk_orders'
};

function djb2(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return (h >>> 0).toString(36);
}
function stableKey(obj: any) {
  const cands = [obj?.idSpk, obj?.id_spk, obj?.rekap_id, obj?.rekapId, obj?.id, obj?.id_transaksi, obj?.idTransaksi];
  const first = cands.find(Boolean);
  if (first) return String(first);
  try { return 'h_' + djb2(JSON.stringify(obj)); } catch { return 'h_' + Math.random().toString(36).slice(2); }
}

// Upsert rows into Supabase for an array or map structure
async function upsertTable(table: string, data: any) {
  if (!enabled) return;
  if (!data) return;
  const rawRows = Array.isArray(data)
    ? data
    : typeof data === 'object'
      ? Object.values(data)
      : [];
  const rows = rawRows.map((r: any) => ({ unique_key: stableKey(r), payload: r }));
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'unique_key' });
  if (error) {
    console.warn('Supabase upsert error', table, error.message);
    // Fallback: if unique constraint doesn't exist, try plain insert
    if (/ON CONFLICT specification|unique|constraint/i.test(error.message)) {
      const ins = await supabase.from(table).insert(rows);
      if (ins.error) console.warn('Supabase insert fallback error', table, ins.error.message);
    }
  }
}

// Pull rows from Supabase and merge into localStorage
async function pullTable(table: string, key: string) {
  if (!enabled) return;
  const { data, error } = await supabase.from(table).select('unique_key, payload');
  if (error) { console.warn('Supabase select error', table, error.message); return; }
  if (!data) return;
  // Don't overwrite local if cloud is empty; preserves legacy local data on first run
  if (data.length === 0) return;
  const payloads = data.map((r: any) => r?.payload ?? r);
  if (key === 'spk_orders') {
    const map: Record<string, any> = {};
    payloads.forEach((r: any) => { if (r?.idSpk) map[r.idSpk] = r; });
    localStorage.setItem(key, JSON.stringify(map));
  } else {
    localStorage.setItem(key, JSON.stringify(payloads));
  }
  window.dispatchEvent(new StorageEvent('storage',{ key }));
}

export async function initialCloudSync() {
  // Smart bootstrap per table:
  // - If cloud has data -> pull to local
  // - If cloud empty but local has data -> seed (push) to cloud
  for (const [key, table] of Object.entries(TABLES)) {
    try {
      if (!enabled) continue;
      const { data, error } = await supabase.from(table).select('unique_key', { count: 'exact' }).limit(1);
      if (error) { console.warn('Supabase head check error', table, error.message); continue; }
      const cloudHasRows = Array.isArray(data) && data.length > 0;
      if (cloudHasRows) {
        await pullTable(table, key);
      } else {
        // seed from local if available
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            await upsertTable(table, parsed);
          } catch (e) { console.warn('seed parse error', key, e); }
        }
      }
    } catch (e) {
      console.warn('initialCloudSync error', table, e);
    }
  }
}

export async function pushAllToCloud() {
  for (const [key, table] of Object.entries(TABLES)) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
  await upsertTable(table, parsed);
    } catch (e) { console.warn('pushAllToCloud parse error', key, e); }
  }
}

// Lightweight listener: when storage changes, push to cloud
let listenerAttached = false;
export function attachCloudSyncListeners() {
  if (listenerAttached) return;
  listenerAttached = true;
  window.addEventListener('storage', async (e) => {
    const key = e.key || '';
    const table = TABLES[key];
    if (!table) return;
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : null;
      await upsertTable(table, data);
    } catch {}
  });
  // Realtime: subscribe to changes from other devices
  if (enabled) {
    for (const [key, table] of Object.entries(TABLES)) {
      try {
        supabase.channel(`rt-${table}`)
          .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
            await pullTable(table, key);
          })
          .subscribe();
      } catch (e) { console.warn('realtime subscribe failed', table, e); }
    }
  }
  // Same-tab push: monkey-patch setItem to push immediately
  try {
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key: string, value: string) => {
      origSetItem(key, value);
      const table = TABLES[key];
      if (!table) return;
      try {
        const parsed = JSON.parse(value);
        // fire and forget
        void upsertTable(table, parsed);
      } catch {}
    };
  } catch (e) { console.warn('localStorage patch failed', e); }
}

// Optional: expose helpers for manual debug
// @ts-ignore
if (typeof window !== 'undefined') (window as any).__cloudSync = {
  initialCloudSync,
  pushAllToCloud,
  // Pull everything from cloud without seeding
  pullAllFromCloud: async () => {
    for (const [key, table] of Object.entries(TABLES)) await pullTable(table, key);
  }
};

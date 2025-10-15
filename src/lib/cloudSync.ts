import supabase from './supabaseClient';

const enabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
// Jika true, gunakan realtime langsung ke tabel domain (read-only) alih-alih tabel mirror sync_*
const useDomainRealtime = String((import.meta as any)?.env?.VITE_REALTIME_DOMAIN || '').toLowerCase() === 'true';
if (typeof window !== 'undefined') {
  // Minimal diagnostics in console so users can quickly see status in DevTools
  console.info('[cloudSync] enabled =', enabled, 'url =', import.meta.env.VITE_SUPABASE_URL ? 'set' : 'missing');
}

// Keys to sync dan tabel target:
// 1) Mode mirror (sync_*): upsert JSONB (read/write ringan, tanpa FK)
// 2) Mode domain (read-only): subscribe langsung ke tabel domain dan tulis ke localStorage
//    Catatan: penulisan balik ke domain via client sengaja dinonaktifkan karena banyak FK/constraint.
const TABLES: Record<string, string> = {
  // market/method
  'antrian_input_desain': 'sync_antrian_input_desain',
  'design_queue': 'sync_design_queue',
  'keranjang': 'sync_keranjang',
  'plotting_rekap_bordir_queue': 'sync_plotting_rekap_bordir_queue',
  'spk_pipeline': 'sync_spk_pipeline',
  'method_rekap_bordir': 'sync_method_rekap_bordir',
  'spk_orders': 'sync_spk_orders',
  // optional: databases for reports/catalogs
  'database_produk': 'sync_database_produk',
  'database_konsumen': 'sync_database_konsumen',
  'database_trend': 'sync_database_trend',
  'database_sebaran': 'sync_database_sebaran',
  // money
  'omset_pendapatan': 'sync_omset_pendapatan',
  'pelunasan_transaksi': 'sync_pelunasan_transaksi',
};

// Opsi per-tabel untuk menghindari timeout pada dataset besar
const TABLE_OPTS: Record<string, { chunk?: number; pageSize?: number }> = {
  // Tabel laporan bisa besar, gunakan batch kecil dan paginasi saat pull
  sync_omset_pendapatan: { chunk: 100, pageSize: 500 },
};

// Pemetaan untuk mode domain (read-only): localStorage key -> nama tabel domain
const DOMAIN_TABLES: Record<string, string> = {
  // Hanya tabel yang diperlukan UI saat ini
  'antrian_input_desain': 'antrian_input_desain',
  'keranjang': 'keranjang',
  // Tambah sesuai kebutuhan, mis: 'plotting_rekap_bordir_queue' tidak punya padanan 1:1 di domain
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
  if (useDomainRealtime) {
    // Di mode domain, kita tidak upsert ke domain (rawan FK/constraint). Abaikan penulisan.
    return;
  }
  if (!data) return;
  const rawRows = Array.isArray(data)
    ? data
    : typeof data === 'object'
      ? Object.values(data)
      : [];
  const rows = rawRows.map((r: any) => ({ unique_key: stableKey(r), payload: r }));
  if (!rows.length) return;

  const opts = TABLE_OPTS[table] || {};
  const chunkSize = Math.max(1, opts.chunk ?? 500);
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(slice, { onConflict: 'unique_key' });
    if (error) {
      console.warn('Supabase upsert error', table, error.message, `batch ${i}-${i + slice.length - 1}`);
      // Fallback: if unique constraint doesn't exist, try plain insert
      if (/ON CONFLICT specification|unique|constraint/i.test(error.message)) {
        const ins = await supabase.from(table).insert(slice);
        if (ins.error) console.warn('Supabase insert fallback error', table, ins.error.message);
      }
      // Jika timeout, lanjutkan batch berikutnya agar tidak memblok total
      if (/timeout|canceling statement/i.test(error.message)) continue;
    }
  }
}

// Pull rows from Supabase and merge into localStorage
async function pullTable(table: string, key: string) {
  if (!enabled) return;
  // Pull dengan paginasi untuk menghindari timeout/response besar
  const opts = TABLE_OPTS[table] || {};
  const pageSize = Math.max(100, opts.pageSize ?? 1000);
  let from = 0;
  let allRows: any[] = [];
  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select('unique_key, payload').range(from, to);
    if (error) { console.warn('Supabase select error', table, error.message, `range ${from}-${to}`); break; }
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  if (allRows.length === 0) return; // Jangan overwrite local jika cloud kosong
  const payloads = allRows.map((r: any) => r?.payload ?? r);
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
  if (useDomainRealtime) {
    // Mode domain (read-only): tarik data awal dari tabel domain ke localStorage
    for (const [key, table] of Object.entries(DOMAIN_TABLES)) {
      try {
        if (!enabled) continue;
        const { data, error } = await supabase.from(table).select('*');
        if (error) { console.warn('Supabase select error', table, error.message); continue; }
        if (Array.isArray(data)) {
          localStorage.setItem(key, JSON.stringify(data));
          window.dispatchEvent(new StorageEvent('storage', { key }));
        }
      } catch (e) { console.warn('domain initialCloudSync error', table, e); }
    }
    return;
  }
  // Mode mirror (default)
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
        const raw = localStorage.getItem(key);
        if (raw) {
          try { await upsertTable(table, JSON.parse(raw)); } catch (e) { console.warn('seed parse error', key, e); }
        }
      }
    } catch (e) { console.warn('initialCloudSync error', table, e); }
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
  if (useDomainRealtime) {
    // Mode domain: subscribe langsung ke tabel domain (read-only) lalu tulis ke localStorage
    if (enabled) {
      for (const [key, table] of Object.entries(DOMAIN_TABLES)) {
        try {
          supabase.channel(`rt-domain-${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
              const { data, error } = await supabase.from(table).select('*');
              if (!error && Array.isArray(data)) {
                localStorage.setItem(key, JSON.stringify(data));
                window.dispatchEvent(new StorageEvent('storage', { key }));
              }
            })
            .subscribe();
        } catch (e) { console.warn('domain realtime subscribe failed', table, e); }
      }
    }
    // Tidak ada penulisan otomatis ke domain saat localStorage berubah (hindari konflik FK)
  } else {
    // Mode mirror: push local -> cloud ketika localStorage berubah
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
    // Realtime mirror
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
  }
  // Same-tab push: monkey-patch setItem to push immediately
  try {
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key: string, value: string) => {
      origSetItem(key, value);
      if (!useDomainRealtime) {
        const table = TABLES[key];
        if (!table) return;
        try {
          const parsed = JSON.parse(value);
          void upsertTable(table, parsed);
        } catch {}
      }
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

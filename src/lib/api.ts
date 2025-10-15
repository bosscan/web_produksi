const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

async function http(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const Api = {
  // Orders
  async postOrder(payload: any) {
    return http('/api/orders/', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Plotting Queue
  async getPlottingQueue() {
    return http('/api/plotting-queue/');
  },
  async postCheckout(payload: { idTransaksi: string; items: Array<{ idSpk: string; idRekapCustom?: string; idCustom?: string; namaDesain?: string; kuantity?: number; }> }) {
    return http('/api/plotting-queue/checkout/', { method: 'POST', body: JSON.stringify(payload) });
  },

  // Rekap Bordir
  async generateRekap(payload: { rekapId: string; items: Array<{ idSpk: string; idTransaksi?: string; idRekapCustom?: string; idCustom?: string; namaDesain?: string; kuantity?: number; }> }) {
    return http('/api/rekap-bordir/generate/', { method: 'POST', body: JSON.stringify(payload) });
  },
  async getRekapBordir() {
    return http('/api/rekap-bordir/');
  },

  // Pipeline
  async markPipeline(id: number | string, field: string) {
    return http(`/api/spk-pipeline/${id}/mark/`, { method: 'POST', body: JSON.stringify({ field }) });
  },
  async getPipeline() {
    return http('/api/spk-pipeline/');
  },

  // Design queue (for enrichment)
  async getDesignQueue() {
    return http('/api/design-queue/');
  }
};

export default Api;

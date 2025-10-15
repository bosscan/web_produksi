import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, TextField, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import TableExportToolbar from '../../../components/TableExportToolbar';

type SPKRow = {
  idRekapProduksi: string;
  idTransaksi: string;
  jumlahSpk: number;
  idSpk: string;
  idRekapCustom: string;
  idCustom: string;
  namaDesain: string;
  kuantity: number;
  statusDesain: string;
  statusKonten: string;
  tglInputPesanan: string;
  deadlineKonsumen: string;
  tglSpkTerbit: string;
  selesaiPlottingBordir?: string;
  selesaiDesainProduksi?: string;
  selesaiCuttingPola?: string;
  selesaiStockBordir?: string;
  selesaiBordir?: string;
  selesaiSetting?: string;
  selesaiStockJahit?: string;
  selesaiJahit?: string;
  selesaiFinishing?: string;
  selesaiFotoProduk?: string;
  selesaiStockNt?: string;
  selesaiPelunasan?: string;
  selesaiPengiriman?: string;
};

const selesaiFields: { key: keyof SPKRow; label: string }[] = [
  { key: "selesaiPlottingBordir", label: "Plotting Bordir" },
  { key: "selesaiDesainProduksi", label: "Desain Produksi" },
  { key: "selesaiCuttingPola", label: "Cutting Pola" },
  { key: "selesaiStockBordir", label: "Stock Bordir" },
  { key: "selesaiBordir", label: "Bordir" },
  { key: "selesaiSetting", label: "Setting" },
  { key: "selesaiStockJahit", label: "Stock Jahit" },
  { key: "selesaiJahit", label: "Jahit" },
  { key: "selesaiFinishing", label: "Finishing" },
  { key: "selesaiFotoProduk", label: "Foto Produk" },
  { key: "selesaiStockNt", label: "Stock NT" },
  { key: "selesaiPelunasan", label: "Pelunasan" },
  { key: "selesaiPengiriman", label: "Pengiriman" },
];

function getStatusPesanan(row: SPKRow) {
  for (let i = selesaiFields.length - 1; i >= 0; i--) {
    const key = selesaiFields[i].key;
    if (row[key]) {
      return `Selesai ${selesaiFields[i].label}`;
    }
  }
  return "Proses";
}

export default function SpkOnProses() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [rows, setRows] = useState<SPKRow[]>([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const requestDelete = (id: string) => { setDeleteTarget(id); setOpenDelete(true); };
  const closeDelete = () => { setOpenDelete(false); setDeleteTarget(null); };
  const confirmDelete = () => {
    if (!deleteTarget) return closeDelete();
    const id = deleteTarget;
    try {
      const keys = ['plotting_rekap_bordir_queue','spk_pipeline','method_rekap_bordir','antrian_input_desain','keranjang'];
      keys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) return;
          let changed = false;
            if (k === 'method_rekap_bordir') {
              const arr = JSON.parse(raw) || [];
              arr.forEach((rb: any) => {
                if (Array.isArray(rb.items)) {
                  const before = rb.items.length;
                  rb.items = rb.items.filter((it: any)=> String(it.idSpk||it.id_spk) !== String(id));
                  if (rb.items.length !== before) changed = true;
                }
              });
              if (changed) localStorage.setItem(k, JSON.stringify(arr));
            } else {
              const arr = JSON.parse(raw) || [];
              const filtered = arr.filter((it: any)=> String(it.idSpk||it.id_spk) !== String(id));
              if (filtered.length !== arr.length) {
                localStorage.setItem(k, JSON.stringify(filtered));
                changed = true;
              }
            }
            if (changed) window.dispatchEvent(new StorageEvent('storage',{ key: k }));
        } catch {}
      });
      // spk_orders map
      try { const ordersRaw = localStorage.getItem('spk_orders'); if (ordersRaw) { const map = JSON.parse(ordersRaw)||{}; if (map[id]) { delete map[id]; localStorage.setItem('spk_orders', JSON.stringify(map)); window.dispatchEvent(new StorageEvent('storage',{ key:'spk_orders'})); } } } catch {}
    } finally { closeDelete(); }
  };

  useEffect(() => {
    const refresh = () => {
      try {
        const qKey = 'plotting_rekap_bordir_queue';
        const pipeKey = 'spk_pipeline';
        const rbKey = 'method_rekap_bordir';
        const adKey = 'antrian_input_desain';
  const cartKey = 'keranjang'; // sumber checkout
  const spkOrdersKey = 'spk_orders'; // snapshot order (opsional berisi deadline / tanggalOrder)

        const qRaw = localStorage.getItem(qKey);
        const queue: any[] = qRaw ? JSON.parse(qRaw) : [];
        const pRaw = localStorage.getItem(pipeKey);
        const pipeline: any[] = pRaw ? JSON.parse(pRaw) : [];
        const rbRaw = localStorage.getItem(rbKey);
        const rbList: any[] = rbRaw ? JSON.parse(rbRaw) : [];
        const adRaw = localStorage.getItem(adKey);
        const adList: any[] = adRaw ? JSON.parse(adRaw) : [];
  let cart: any[] = []; // daftar item keranjang / checkout
  let spkOrders: Record<string, any> = {};
  try { cart = JSON.parse(localStorage.getItem(cartKey)||'[]')||[]; } catch {}
  try { spkOrders = JSON.parse(localStorage.getItem(spkOrdersKey)||'{}')||{}; } catch {}

        const rekapDate = new Map<string, string>();
        rbList.forEach((rb) => {
          const createdAt = rb?.createdAt;
          (rb?.items || []).forEach((it: any) => {
            if (it?.idSpk && createdAt) rekapDate.set(it.idSpk, createdAt);
          });
        });

        const adMap: Record<string, any> = {};
        adList.forEach((it) => { if (it?.idSpk) adMap[it.idSpk] = it; });

        const byId: Record<string, SPKRow> = {};
        const parseNum = (v: any): number => {
          const n = Number(String(v ?? '').toString().replace(/[^\d-]/g, ''));
          return !isNaN(n) && n > 0 ? n : 0;
        };

        const parseDateFlexible = (input: any): Date | null => {
          if (!input) return null;
          try {
            if (input instanceof Date) return isNaN(+input) ? null : input;
            const s = String(input).trim();
            const iso = new Date(s);
            if (!isNaN(+iso)) return iso;
            const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
            if (m) {
              const a = parseInt(m[1], 10);
              const b = parseInt(m[2], 10);
              const y = parseInt(m[3].length === 2 ? '20' + m[3] : m[3], 10);
              const isDMY = a > 12; // heuristik
              const day = isDMY ? a : b;
              const month = (isDMY ? b : a) - 1;
              const d = new Date(y, month, day);
              return isNaN(+d) ? null : d;
            }
            return null;
          } catch { return null; }
        };
        const formatDate = (d: any) => {
          if (!d) return '-';
            try { const dt = new Date(d); if (isNaN(+dt)) return String(d); return dt.toLocaleDateString('id-ID'); } catch { return String(d); }
        };

        const pushFrom = (it: any) => {
          if (!it?.idSpk) return;
          const src = adMap[it.idSpk] || {};
          const cartItem = cart.find(c => String(c.idSpk||c.id_spk) === String(it.idSpk));
          const orderSnap = spkOrders[it.idSpk];
          let qty = typeof it.kuantity === 'number' && it.kuantity > 0 ? it.kuantity : parseNum(src?.quantity);
          if (!qty && Array.isArray(src?.items)) qty = src.items.length;
          // status konten: jika ada konten/content di antrian / pipeline / cart -> 'Lengkap'
          const kontenValue = src?.content || it?.konten || cartItem?.konten || orderSnap?.konten || it?.produk?.konten || '';
          const statusKonten = kontenValue ? 'Lengkap' : '-';
          const tglInput = src?.tanggalInput || '-';
          // tanggal checkout keranjang: pilih cartItem?.tanggalCheckout / orderSnap?.tanggalOrder / pipeline.tanggalOrder
          const tanggalCheckout = cartItem?.tanggalCheckout || it.tanggalCheckout || orderSnap?.tanggalOrder || it.tanggalOrder;
          // deadline: 30 hari setelah tanggal checkout (jika ada) kecuali sudah ada deadline eksplisit
          let deadlineRaw = it.deadlineKonsumen || it.deadline || cartItem?.deadline || orderSnap?.deadline;
          if (!deadlineRaw && tanggalCheckout) {
            const base = parseDateFlexible(tanggalCheckout);
            if (base) { const d = new Date(base.getTime()); d.setDate(d.getDate()+30); deadlineRaw = d.toISOString(); }
          }
          const deadlineKonsumen = deadlineRaw ? formatDate(deadlineRaw) : '-';
          const tglSpkTerbit = tanggalCheckout ? formatDate(tanggalCheckout) : '-';
          byId[it.idSpk] = {
            idRekapProduksi: `RP-${String(it.idSpk).replace(/\D/g, '').slice(-4) || '0000'}`,
            idTransaksi: it.idTransaksi || '-',
            jumlahSpk: 1,
            idSpk: it.idSpk,
            idRekapCustom: it.idRekapCustom || it.idRekap,
            idCustom: it.idCustom,
            namaDesain: it.namaDesain,
            kuantity: qty || 0,
            statusDesain: 'Proses',
            statusKonten,
            tglInputPesanan: tglInput,
            deadlineKonsumen,
            tglSpkTerbit,
            selesaiPlottingBordir: rekapDate.get(it.idSpk) || it.selesaiPlottingBordir,
            selesaiDesainProduksi: it.selesaiDesainProduksi,
            selesaiCuttingPola: it.selesaiCuttingPola,
            selesaiStockBordir: it.selesaiStockBordir,
            selesaiBordir: it.selesaiBordir,
            selesaiSetting: it.selesaiSetting,
            selesaiStockJahit: it.selesaiStockJahit,
            selesaiJahit: it.selesaiJahit,
            selesaiFinishing: it.selesaiFinishing,
            selesaiFotoProduk: it.selesaiFotoProduk,
            selesaiStockNt: it.selesaiStockNt,
            selesaiPelunasan: it.selesaiPelunasan,
            selesaiPengiriman: it.selesaiPengiriman,
          };
        };

        (queue || []).forEach(pushFrom);
        (pipeline || []).forEach(pushFrom);

        const arr = Object.values(byId);
        const byTrx = new Map<string, number>();
        arr.forEach((r) => {
          const t = r.idTransaksi || '-';
          byTrx.set(t, (byTrx.get(t) || 0) + 1);
        });
        arr.forEach((r) => { r.jumlahSpk = byTrx.get(r.idTransaksi || '-') || 1; });
        setRows(arr);
      } catch {
        setRows([]);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if ([
        'plotting_rekap_bordir_queue',
        'spk_pipeline',
        'method_rekap_bordir',
        'antrian_input_desain',
        'keranjang',
        'spk_orders'
      ].includes(e.key || '')) refresh();
    };
    refresh();
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const statusOptions = Array.from(new Set(rows.map(getStatusPesanan)));

  const filteredRows = rows.filter((row) => {
    const statusPesanan = getStatusPesanan(row);
    const matchesStatus = statusFilter ? statusPesanan === statusFilter : true;
    const matchesSearch = search
      ? Object.values(row).some(
          (val) => typeof val === "string" && val.toLowerCase().includes(search.toLowerCase())
        )
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        maxHeight: "calc(100vh - 64px)",
        overflowY: "auto",
        p: 3,
        boxSizing: "border-box",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          width: "100%",
          borderRadius: 2,
          boxShadow: 2,
          flexDirection: "column",
          p: 3,
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
          List SPK On Proses
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
          />
          <TextField
            label="Status Pesanan"
            variant="outlined"
            size="small"
            select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Semua</MenuItem>
            {statusOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <TableExportToolbar title="List SPK On Proses" tableRef={tableRef} fileBaseName="spk-on-proses" />
        <TableContainer component={Paper} sx={{ width: "100%", overflowX: "auto" }}>
      <Table sx={{ minWidth: 3000 }} aria-label="spk-on-proses-table" ref={tableRef}>
            <TableHead>
      <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID REKAP PRODUKSI</TableCell>
                <TableCell>ID TRANSAKSI</TableCell>
                <TableCell>JUMLAH SPK</TableCell>
                <TableCell>ID SPK</TableCell>
    <TableCell>AKSI</TableCell>
                <TableCell>ID REKAP CUSTOM</TableCell>
                <TableCell>ID CUSTOM</TableCell>
                <TableCell>NAMA DESAIN</TableCell>
                <TableCell>KUANTITY</TableCell>
                <TableCell>STATUS DESAIN</TableCell>
                <TableCell>STATUS PESANAN</TableCell>
                <TableCell>STATUS KONTEN</TableCell>
                <TableCell>TGL INPUT PESANAN</TableCell>
                <TableCell>DEADLINE KONSUMEN</TableCell>
                <TableCell>TGL SPK TERBIT</TableCell>
        <TableCell>SELESAI PLOTTING BORDIR</TableCell>
                <TableCell>SELESAI DESAIN PRODUKSI</TableCell>
                <TableCell>SELESAI CUTTING POLA</TableCell>
                <TableCell>SELESAI STOCK BORDIR</TableCell>
                <TableCell>SELESAI BORDIR</TableCell>
                <TableCell>SELESAI SETTING</TableCell>
                <TableCell>SELESAI STOCK JAHIT</TableCell>
                <TableCell>SELESAI JAHIT</TableCell>
                <TableCell>SELESAI FINISHING</TableCell>
                <TableCell>SELESAI FOTO PRODUK</TableCell>
                <TableCell>SELESAI STOCK NT</TableCell>
                <TableCell>SELESAI PELUNASAN</TableCell>
                <TableCell>SELESAI PENGIRIMAN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((row, index) => (
        <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.idRekapProduksi}</TableCell>
                  <TableCell>{row.idTransaksi}</TableCell>
                  <TableCell>{row.jumlahSpk}</TableCell>
                  <TableCell>{row.idSpk}</TableCell>
      <TableCell><Button color="error" size="small" variant="outlined" onClick={()=>requestDelete(row.idSpk)}>Hapus</Button></TableCell>
                  <TableCell>{row.idRekapCustom}</TableCell>
                  <TableCell>{row.idCustom}</TableCell>
                  <TableCell>{row.namaDesain}</TableCell>
                  <TableCell>{row.kuantity}</TableCell>
                  <TableCell>{row.statusDesain}</TableCell>
                  <TableCell>{getStatusPesanan(row)}</TableCell>
                  <TableCell>{row.statusKonten}</TableCell>
                  <TableCell>{row.tglInputPesanan}</TableCell>
                  <TableCell>{row.deadlineKonsumen}</TableCell>
                  <TableCell>{row.tglSpkTerbit}</TableCell>
                  <TableCell>{row.selesaiPlottingBordir || '-'}</TableCell>
                  <TableCell>{row.selesaiDesainProduksi || "-"}</TableCell>
                  <TableCell>{row.selesaiCuttingPola || "-"}</TableCell>
                  <TableCell>{row.selesaiStockBordir || "-"}</TableCell>
                  <TableCell>{row.selesaiBordir || "-"}</TableCell>
                  <TableCell>{row.selesaiSetting || "-"}</TableCell>
                  <TableCell>{row.selesaiStockJahit || "-"}</TableCell>
                  <TableCell>{row.selesaiJahit || "-"}</TableCell>
                  <TableCell>{row.selesaiFinishing || "-"}</TableCell>
                  <TableCell>{row.selesaiFotoProduk || "-"}</TableCell>
                  <TableCell>{row.selesaiStockNt || "-"}</TableCell>
                  <TableCell>{row.selesaiPelunasan || "-"}</TableCell>
                  <TableCell>{row.selesaiPengiriman || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog open={openDelete} onClose={closeDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Hapus SPK {deleteTarget}? Data terkait di antrian divisi juga akan dihapus. Tindakan ini tidak bisa dibatalkan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDelete}>Tidak</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Ya, Hapus</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

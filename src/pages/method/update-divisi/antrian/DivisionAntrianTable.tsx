import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import TableExportToolbar from '../../../../components/TableExportToolbar';

type PipelineItem = {
  idSpk: string;
  idTransaksi: string;
  idRekapCustom: string;
  idCustom: string;
  namaDesain: string;
  jenisProduk?: string;
  jenisPola?: string;
  tanggalInput?: string;
  kuantity?: number;
  // stage flags (timestamp ISO or truthy string)
  selesaiDesainProduksi?: string;
  selesaiCuttingPola?: string;
  selesaiStockBordir?: string;
  selesaiBordir?: string;
  selesaiSetting?: string;
  selesaiStockJahit?: string;
  selesaiFinishing?: string;
  selesaiFotoProduk?: string;
  selesaiPengiriman?: string;
};

type RekapBordir = {
  rekapId: string;
  createdAt?: string;
  items: Array<{ idSpk: string; kuantity?: number }>;
};

export default function DivisionAntrianTable({ title, divisionKey }: { title: string; divisionKey: 'desain-produksi' | 'cutting-pola' | 'stock-bordir' | 'bordir' | 'setting' | 'stock-jahit' | 'finishing' | 'foto-produk' | 'stock-no-transaksi' | 'pengiriman' }) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [all, setAll] = useState<PipelineItem[]>([]);

  // Load from pipeline store
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem('spk_pipeline');
        const list: PipelineItem[] = raw ? JSON.parse(raw) : [];
  setAll(list);
      } catch {
  setAll([]);
      }
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'spk_pipeline' ||
        e.key === 'method_rekap_bordir' ||
        e.key === 'antrian_input_desain'
      )
        refresh();
    };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener('storage', onStorage);
      clearInterval(timer);
    };
  }, []);

  // Build helper maps for Rekap Bordir and SPK quantities
  const rekapBordirMap = useMemo(() => {
    try {
      const raw = localStorage.getItem('method_rekap_bordir');
      const list: RekapBordir[] = raw ? JSON.parse(raw) : [];
      const map = new Map<string, string[]>(); // idSpk -> [rekapId]
      list.forEach((rb) => {
        (rb.items || []).forEach((it) => {
          if (!it?.idSpk) return;
          const arr = map.get(it.idSpk) || [];
          if (!arr.includes(rb.rekapId)) arr.push(rb.rekapId);
          map.set(it.idSpk, arr);
        });
      });
      return map;
    } catch {
      return new Map<string, string[]>();
    }
  }, [all]);

  const spkQtyMap = useMemo(() => {
    // Build quantity map from antrian_input_desain
    try {
      const qRaw = localStorage.getItem('antrian_input_desain');
      const qList: Array<{ idSpk: string; quantity?: any; items?: any[] }> = qRaw ? JSON.parse(qRaw) : [];
      const map = new Map<string, number>();
      const parseNum = (v: any): number => {
        const n = Number(String(v ?? '').toString().replace(/[^\d-]/g, ''));
        return !isNaN(n) && n > 0 ? n : 0;
      };
      qList.forEach((q) => {
        if (!q?.idSpk) return;
        const n = parseNum(q.quantity);
        map.set(q.idSpk, n > 0 ? n : (q.items?.length || 0));
      });
      return map;
    } catch {
      return new Map<string, number>();
    }
  }, [all]);

  const parseQty = (row: PipelineItem): number => {
    if (typeof row.kuantity === 'number' && row.kuantity > 0) return row.kuantity;
    // try antrian_input_desain by idSpk
    if (row.idSpk && spkQtyMap.has(row.idSpk)) return spkQtyMap.get(row.idSpk) || 0;
    return 0;
  };

  const getRekapBordirId = (idSpk?: string): string => {
    if (!idSpk) return '-';
    const arr = rekapBordirMap.get(idSpk) || [];
    return arr.length > 0 ? arr.join(', ') : '-';
  };

  const deriveIdRp = (idSpk?: string): string => {
    if (!idSpk) return '-';
    const suf = idSpk.replace(/\D/g, '').slice(-4) || idSpk.slice(-4);
    return `RP-${suf || '0000'}`;
  };

  const deriveIdTrx = (item?: PipelineItem): string => {
    if (!item?.idTransaksi) return '-';
    return item.idTransaksi;
  };

  const isDone = (it: PipelineItem, key: keyof PipelineItem) => Boolean((it as any)[key]);

  const pipelineFiltered = useMemo(() => {
    const list = all;
    if (divisionKey === 'desain-produksi') return list.filter((it) => !isDone(it, 'selesaiDesainProduksi'));
    if (divisionKey === 'cutting-pola') return list.filter((it) => !isDone(it, 'selesaiCuttingPola'));
    if (divisionKey === 'stock-bordir') return list.filter((it) => isDone(it, 'selesaiDesainProduksi') && isDone(it, 'selesaiCuttingPola') && !isDone(it, 'selesaiStockBordir'));
    if (divisionKey === 'bordir') return list.filter((it) => isDone(it, 'selesaiStockBordir') && !isDone(it, 'selesaiBordir'));
    if (divisionKey === 'setting') return list.filter((it) => isDone(it, 'selesaiBordir') && !isDone(it, 'selesaiSetting'));
    if (divisionKey === 'stock-jahit') return list.filter((it) => isDone(it, 'selesaiSetting') && !isDone(it, 'selesaiStockJahit'));
    if (divisionKey === 'finishing') return list.filter((it) => isDone(it, 'selesaiStockJahit') && !isDone(it, 'selesaiFinishing'));
    if (divisionKey === 'foto-produk') return list.filter((it) => isDone(it, 'selesaiFinishing') && !isDone(it, 'selesaiFotoProduk'));
    if (divisionKey === 'stock-no-transaksi') {
      // Show those done with foto-produk but waiting for sibling SPKs in same idTransaksi
      const byTrx = new Map<string, PipelineItem[]>();
      list.forEach((it) => {
        const arr = byTrx.get(it.idTransaksi) || [];
        arr.push(it);
        byTrx.set(it.idTransaksi, arr);
      });
      return list.filter((it) => {
        if (!isDone(it, 'selesaiFotoProduk') || isDone(it, 'selesaiPengiriman')) return false;
        const group = byTrx.get(it.idTransaksi) || [];
        // Only relevant if this transaction contains >1 SPK
        if (group.length <= 1) return false;
        // Wait if any sibling hasn't finished foto produk
        const allFotoDone = group.every((g) => isDone(g, 'selesaiFotoProduk'));
        return !allFotoDone;
      });
    }
    if (divisionKey === 'pengiriman') {
      // Eligible when all SPKs in the transaction finished foto-produk; and not yet shipped
      const byTrx = new Map<string, PipelineItem[]>();
      list.forEach((it) => {
        const arr = byTrx.get(it.idTransaksi) || [];
        arr.push(it);
        byTrx.set(it.idTransaksi, arr);
      });
      return list.filter((it) => {
        if (isDone(it, 'selesaiPengiriman')) return false;
        const group = byTrx.get(it.idTransaksi) || [];
        const allFotoDone = group.length > 0 && group.every((g) => isDone(g, 'selesaiFotoProduk'));
        return allFotoDone && isDone(it, 'selesaiFotoProduk');
      });
    }
    return list;
  }, [all, divisionKey]);

  return (
    <Box sx={{ width: '100%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>{title}</Typography>
      <TableExportToolbar title={title} tableRef={tableRef} fileBaseName={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
      />
      <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1400 }} aria-label="division-antrian" ref={tableRef}>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>ID Rekap Produksi</TableCell>
              <TableCell>ID Transaksi</TableCell>
              <TableCell>ID Rekap Bordir</TableCell>
              <TableCell>ID SPK</TableCell>
              <TableCell>ID Rekap Custom</TableCell>
              <TableCell>ID Custom</TableCell>
              <TableCell>Nama Desain</TableCell>
              <TableCell>Jenis Produk</TableCell>
              <TableCell>Jenis Pola</TableCell>
              <TableCell>Tanggal Input Desain</TableCell>
              <TableCell>Kuantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pipelineFiltered.map((row, index) => (
              <TableRow key={`${row.idSpk}-${row.idRekapCustom}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{deriveIdRp(row.idSpk)}</TableCell>
                <TableCell>{deriveIdTrx(row)}</TableCell>
                <TableCell>{getRekapBordirId(row.idSpk)}</TableCell>
                <TableCell>{row.idSpk || '-'}</TableCell>
                <TableCell>{row.idRekapCustom}</TableCell>
                <TableCell>{row.idCustom}</TableCell>
                <TableCell>{row.namaDesain}</TableCell>
                <TableCell>{row.jenisProduk || '-'}</TableCell>
                <TableCell>{row.jenisPola || '-'}</TableCell>
                <TableCell>{row.tanggalInput || '-'}</TableCell>
                <TableCell>{parseQty(row)}</TableCell>
              </TableRow>
            ))}
            {pipelineFiltered.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} align="center">Tidak ada antrian</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

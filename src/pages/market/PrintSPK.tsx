import { Box, Button, Stack, TextField, Typography, FormControlLabel, Checkbox } from '@mui/material';
import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type AnyRec = Record<string, any>;
type Calibration = { offsetX: number; offsetY: number; scale: number; fontScale: number; showGrid?: boolean };

const CAL_KEY = 'spk_print_calibration';

function loadCalibration(): Calibration {
  try {
    const raw = localStorage.getItem(CAL_KEY);
    if (!raw) return { offsetX: 0, offsetY: 0, scale: 1, fontScale: 1, showGrid: false };
    const parsed = JSON.parse(raw);
    return {
      offsetX: Number(parsed.offsetX) || 0,
      offsetY: Number(parsed.offsetY) || 0,
      scale: Number(parsed.scale) || 1,
      fontScale: Number(parsed.fontScale) || 1,
      showGrid: !!parsed.showGrid,
    };
  } catch {
    return { offsetX: 0, offsetY: 0, scale: 1, fontScale: 1, showGrid: false };
  }
}

function useQueryIdSpk() {
  const [params, setParams] = useSearchParams();
  const id = params.get('idSpk') || '';
  const setId = (v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set('idSpk', v); else n.delete('idSpk');
    setParams(n, { replace: true });
  };
  return [id, setId] as const;
}

function loadLs<T = any>(key: string): T[] {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function mergeSpkData(idSpk: string) {
  const pipeline = loadLs('spk_pipeline');
  const designQueue = loadLs('design_queue');
  const keranjang = loadLs('keranjang');
  const plottingQueue = loadLs('plotting_rekap_bordir_queue');
  const antrian: AnyRec[] = loadLs('antrian_input_desain');
  let form: AnyRec | null = null;
  try { form = JSON.parse(localStorage.getItem('inputDetailForm') || 'null'); } catch { form = null; }
  let formProduk: AnyRec | null = null;
  try { formProduk = JSON.parse(localStorage.getItem('inputProdukForm') || 'null'); } catch { formProduk = null; }
  let formTambahan: AnyRec | null = null;
  try { formTambahan = JSON.parse(localStorage.getItem('inputTambahanForm') || 'null'); } catch { formTambahan = null; }
  // Snapshots keyed by idSpk
  let spkOrders: Record<string, AnyRec> = {}; let spkDesign: Record<string, AnyRec> = {};
  try { spkOrders = JSON.parse(localStorage.getItem('spk_orders') || '{}') || {}; } catch {}
  try { spkDesign = JSON.parse(localStorage.getItem('spk_design') || '{}') || {}; } catch {}

  const spkItem: AnyRec | undefined = pipeline.find((x: AnyRec) => String(x?.idSpk ?? '').trim() === String(idSpk).trim());
  const antrianItem: AnyRec | undefined = antrian.find((x: AnyRec) => String(x?.idSpk ?? '').trim() === String(idSpk).trim()) || spkOrders[idSpk];
  // Snapshot dari spk_design (persisted saat validasi CS) jika ada
  let designSnap: AnyRec | undefined = spkDesign[idSpk];
  // Find design entry primarily by idSpk
  const design = designQueue.find((d: AnyRec) => String(d?.idSpk ?? '').trim() === String(idSpk).trim());
  const plotting = plottingQueue.find((p: AnyRec) => String(p?.idSpk ?? '').trim() === String(idSpk).trim());
  // Jika snapshot belum punya mockup, fallback ke design_queue worksheet agar tetap tampil
  try {
    const hasSnapshotMock = !!(designSnap?.worksheet?.mockup?.file || designSnap?.mockupUrl);
    const fromQueueMock = design?.worksheet?.mockup?.file;
    if (!hasSnapshotMock && fromQueueMock) {
      designSnap = { ...(designSnap || {}), worksheet: design?.worksheet, mockupUrl: fromQueueMock };
    }
  } catch {}
  // Prefer explicit pipeline values, with fallbacks
  const idCustom = spkItem?.idCustom || design?.idCustom || antrianItem?.idCustom || plotting?.idCustom || '';
  // raw idTransaksi will be normalized below via mapping/format7
  // Helper: robust lookup from map accounting for whitespace/format differences
  const robustMapGet = (mapObj: Record<string, any>, key: string) => {
    if (!mapObj || !key) return undefined;
    if (mapObj[key] != null) return mapObj[key];
    const t = key.trim();
    if (t && mapObj[t] != null) return mapObj[t];
    // try numeric-only equivalence
    const num = (s: string) => (s || '').replace(/\D+/g, '');
    const nk = num(key);
    if (nk) {
      const k = Object.keys(mapObj).find((kk) => num(kk) === nk);
      if (k) return mapObj[k];
    }
    // fallback: case-insensitive + trimmed
    const k2 = Object.keys(mapObj).find((kk) => kk.trim().toLowerCase() === t.toLowerCase());
    return k2 ? mapObj[k2] : undefined;
  };

  // Prefer recap mapping or plotted data; ensure 7-digit formatting
  const prMapKey = 'production_recap_map';
  let mappedRecap: string | undefined;
  try {
    const map = JSON.parse(localStorage.getItem(prMapKey) || '{}') || {};
    const v = robustMapGet(map, idSpk);
    if (v) mappedRecap = String(v).padStart(7, '0');
  } catch {}
  // raw idRekapProduksi will be normalized below via mapping/format7
  const cart = keranjang.find((k: AnyRec) => String(k?.idSpk ?? '').trim() === String(idSpk).trim() || String(k?.idCustom ?? '') === String(idCustom));
  // Prefer per-checkout mapping if available
  const txMapKey = 'transaction_id_map';
  let mappedTx: string | undefined;
  try {
    const map = JSON.parse(localStorage.getItem(txMapKey) || '{}') || {};
    const v = robustMapGet(map, idSpk);
    if (v) mappedTx = String(v).padStart(7, '0');
  } catch {}

  const qty = Number(spkItem?.quantity ?? cart?.kuantity ?? antrianItem?.quantity ?? design?.quantity ?? 0) || 0;
  const nama = antrianItem?.namaPemesan || spkItem?.nama || '';
  // Nama desain dari berbagai sumber
  const namaDesain = (
    antrianItem?.namaDesain ||
    design?.namaDesain ||
    (designSnap as any)?.namaDesain ||
    (designSnap as any)?.nameDesign ||
    plotting?.namaDesain ||
    spkItem?.namaDesain ||
    cart?.namaDesain ||
    (form as any)?.nameDesign ||
    (form as any)?.namaDesain ||
    ''
  ) as string;
  const alamat = (() => {
    // Full address (street/detail) from any source
    const addrParts = [
      antrianItem?.address,
      spkItem?.alamat || spkItem?.address,
      design?.alamat || design?.address,
      cart?.alamat || cart?.address,
      plotting?.alamat || plotting?.address,
    ].filter(Boolean);
    const mainAddr = addrParts.join(', ');
    // Administrative area (Desa, Kecamatan, Kabupaten, Provinsi)
    const wilayah = (antrianItem?.wilayah || design?.wilayah || spkItem?.wilayah || cart?.wilayah || plotting?.wilayah || {}) as AnyRec;
    const desa = wilayah?.village || wilayah?.desa || '';
    const kec = wilayah?.district || wilayah?.kecamatan || '';
    const kab = wilayah?.regency || wilayah?.kabupaten || '';
    const prov = wilayah?.province || wilayah?.provinsi || '';
    const adminLines = [
      desa ? `Desa ${desa}` : '',
      kec ? `Kecamatan ${kec}` : '',
      kab ? `Kabupaten ${kab}` : '',
      prov ? `Provinsi ${prov}` : '',
    ].filter(Boolean);
    return [mainAddr, adminLines.join('\n')].filter(Boolean).join('\n\n');
  })();
  const pengiriman = cart?.pengiriman || '';
  const label = cart?.label || '';
  const packing = cart?.packing || '';
  const tanggalOrder = antrianItem?.tanggalInput || spkItem?.tanggalOrder || '';
  // Compute deadline: prefer explicit fields, else 30 days after tanggalOrder
  const deadline = (() => {
    const explicit = spkItem?.deadline || design?.deadline || cart?.deadline || plotting?.deadline;
    if (explicit) return explicit;
    const base = parseDateFlexible(tanggalOrder);
    if (!base) return '';
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + 30);
    return d.toISOString();
  })();
  const jumlahSpk = spkItem?.jumlahSpk || 1;
  const format7 = (v: any) => {
    const m = String(v || '').match(/(\d{1,})/);
    return m ? String(Number(m[1])).padStart(7, '0') : '';
  };
  // Normalize IDs to 7 digits using mapping or raw fallbacks
  const idTransaksiRaw = spkItem?.idTransaksi || design?.idTransaksi || plotting?.idTransaksi || cart?.idTransaksi || '';
  const idTransaksiFinal = mappedTx || format7(idTransaksiRaw);
  const idRekapProduksiRaw = spkItem?.idRekapProduksi || plotting?.idRekapProduksi || cart?.idRekapProduksi || '';
  const idRekapProduksiFinal = mappedRecap || format7(idRekapProduksiRaw);
  // Build spesifikasi helper first so it can also power produk fields
  const S = (k: string) => (designSnap?.[k] ?? formProduk?.[k] ?? form?.[k] ?? '') as string;

  const produk = {
    produk: (designSnap?.product || form?.product || antrianItem?.tipeTransaksi || '') as string,
    lengan: (design?.spesifikasi?.lengan || S('lengan') || S('armEnd') || S('taliLengan') || '') as string,
    jenisKain: (designSnap?.fabric || formProduk?.fabric || form?.fabric || '') as string,
    warnaKain: (designSnap?.fabricColor || formProduk?.fabricColor || form?.fabricColor || '') as string,
    jenisPola: (design?.jenisPola ?? designSnap?.pattern ?? formProduk?.pattern ?? form?.pattern ?? spkItem?.jenisPola ?? '') as string,
  // Konten diambil dari input pesanan (antrian_input_desain.content) dengan fallback ringan
  konten: (antrianItem?.content || spkItem?.konten || cart?.konten || '') as string,
    qty: qty,
  } as AnyRec;

  // Build spesifikasi from known sources (limited by saved data)
  const spesifikasi: AnyRec = {
    jenisPola: design?.jenisPola ?? S('pattern'),
    hoodie: S('hoodieLabel') || S('hoodie'),
    jahitan: S('jahitanLabel') || S('jahitan'),
    jenisFuring: S('jenisFuringLabel') || S('jenisFuring') || S('furing') || S('furingPocketLabel') || S('furingPocket'),
    saku: S('pocketLabel') || S('pocket'),
    sakuBawah: S('bottomPocketLabel') || S('bottomPocket'),
    taliBawah: S('cuttingButtomLabel') || S('cuttingButtom') || S('bottomStrap'),
    sakuFuring: S('furingPocketLabel') || S('furingPocket'),
    ujungLengan: S('armEndLabel') || S('armEnd'),
    aplikasi: S('applicationLabel') || S('application'),
    jenisSablon: S('sablonLabel') || S('sablon'),
    jenisBordir: S('bordirLabel') || S('bordir'),
  jenisReflektor: S('jenisReflektor') || S('reflectorLabel') || S('reflector'),
  warnaListReflektor: S('warnaListReflektor') || S('colorReflectorLabel') || S('colorReflector'),
    kancingDepan: S('frontButtonLabel') || S('frontButton'),
    plaket: S('placardLabel') || S('placard'),
    kerah: S('neckLabel') || S('neck'),
    potonganBawah: S('cuttingButtomLabel') || S('cuttingButtom'),
    belahSamping: S('sideSlitLabel') || S('sideSlit'),
    skoder: S('skoder'),
  variasiSaku: S('variasiSaku') || S('pocketVariantLabel') || S('pocketVariant'),
  taliLengan: S('taliLengan') || S('armStrapLabel') || S('armStrap'),
  ventilasi: S('ventilationLabel') || S('ventilation') || S('ventilasi'),
    jahitanVentilasiHorz: S('jahitanVentilasiHorz'),
    tempatPulpen: S('penHolder') || S('tempatPulpen'),
    lidahKancing: S('catTongue') || S('lidahKancing'),
  banBawah: S('bottomTireLabel') || S('bottomTire') || S('banBawah'),
  tempatLanyard: S('lanyardHolderLabel') || S('lanyardHolder') || S('tempatLanyard'),
  gantunganHt: S('HThangerLabel') || S('HThanger') || S('gantunganHt'),
  };

  // Size/Nama list from antrian_input_desain items
  const items = Array.isArray(antrianItem?.items) ? antrianItem.items : [];
  // Rekap size from items if available, else fallback empty counts
  const rekapSize = (() => {
    const base: AnyRec = { XS:0,S:0,M:0,L:0,XL:0,XXL:0,'3XL':0,'4XL':0,'5XL':0,'6XL':0,'7XL':0,CST:0 };
    try {
      items.forEach((it: AnyRec) => {
        const s = String(it?.size || '').toUpperCase();
        const key = ['XS','S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL'].includes(s) ? s : 'CST';
        base[key] = Number(base[key] || 0) + 1;
      });
    } catch {}
    return base;
  })();
  // Catatan: prefer validated design snapshot, then design queue, then current tambahan form, then cart/plotting
  const catatan = (
    (designSnap as any)?.catatan || design?.catatan || formTambahan?.catatan || cart?.catatan || plotting?.catatan || ''
  ) as string;

  return {
    idRekapCustom: design?.idRekapCustom || plotting?.idRekapCustom || spkItem?.idRekapCustom || antrianItem?.idRekapCustom || '',
    idCustom,
  idTransaksi: idTransaksiFinal,
  idRekapProduksi: idRekapProduksiFinal,
    nama,
  namaDesain,
    tanggalOrder,
    deadline,
    idSpk,
    jumlahSpk,
    produk,
  alamat,
    pengiriman,
    label,
    packing,
    spesifikasi,
    catatan,
  rekapSize,
  items,
  designSnap,
  } as AnyRec;
}

export default function PrintSPK() {
  const [idSpk, setIdSpk] = useQueryIdSpk();
  const [inputId, setInputId] = useState(idSpk);
  const data = useMemo(() => (idSpk ? mergeSpkData(idSpk) : null), [idSpk]);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [params] = useSearchParams();
  const [cal, setCal] = useState<Calibration>(() => loadCalibration());
  const [qrUrl, setQrUrl] = useState<string>('');
  const [logoMissing, setLogoMissing] = useState(false);
  

  useEffect(() => { setInputId(idSpk); }, [idSpk]);

  const onLoad = () => {
    if (inputId.trim()) setIdSpk(inputId.trim());
  };

  const onPrint = () => window.print();

  // Logo is fixed to bundled asset; no upload/reset controls

  const generatePdf = async (openInNewTab: boolean) => {
    if (!pageRef.current) return;
    // Render DOM to canvas
    const canvas = await html2canvas(pageRef.current, { scale: 2, useCORS: true, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');
    // Create PDF A4 portrait
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 330] });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const yOffset = Math.max((pageH - imgH) / 2, 0);
    pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, imgH, undefined, 'FAST');
    const fname = `${data?.idSpk || 'SPK'}-${(data?.nama || 'SPK').replace(/\s+/g, '_')}.pdf`;
    if (openInNewTab) {
      const blobUrl = pdf.output('bloburl');
      window.open(blobUrl, '_blank');
    } else {
      pdf.save(fname);
    }
  };

  // Auto-open PDF when mode=pdf is present
  useEffect(() => {
    const mode = params.get('mode');
    if (mode === 'pdf' && data && pageRef.current) {
      // Prevent double execution in React.StrictMode (dev) by using sessionStorage one-shot key
      const key = `printspk_opened_${data.idSpk || 'NA'}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      // slight delay to ensure fonts/images are painted
      setTimeout(() => {
        generatePdf(true);
        // Remove mode param to avoid re-trigger on rerenders/navigation
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('mode');
          window.history.replaceState({}, '', url.toString());
        } catch {}
      }, 150);
    }
  }, [params, data]);

  // Generate QR code for idSpk
  useEffect(() => {
    const value = data?.idSpk || '';
    if (!value) { setQrUrl(''); return; }
    QRCode.toDataURL(value, { margin: 1, width: 200 })
      .then((u: string) => setQrUrl(u))
      .catch(() => setQrUrl(''));
  }, [data?.idSpk]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, '@media print': { display: 'none' } }}>
        <TextField label="ID SPK" size="small" value={inputId} onChange={(e) => setInputId(e.target.value)} />
        <Button variant="outlined" onClick={onLoad}>Muat</Button>
        <Button variant="contained" onClick={onPrint} disabled={!data}>Cetak</Button>
  <Button variant="outlined" onClick={() => generatePdf(true)} disabled={!data}>Buka PDF</Button>
  <Button variant="outlined" onClick={() => generatePdf(false)} disabled={!data}>Unduh PDF</Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">Template: HTML (tanpa gambar)</Typography>
      </Stack>

      {/* Calibration + Edit controls */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, '@media print': { display: 'none' } }}>
        <TextField label="Offset X" size="small" type="number" value={cal.offsetX}
          onChange={(e) => { const v = Number(e.target.value || 0); const n = { ...cal, offsetX: v }; setCal(n); localStorage.setItem(CAL_KEY, JSON.stringify(n)); }}
          sx={{ width: 110 }} />
        <TextField label="Offset Y" size="small" type="number" value={cal.offsetY}
          onChange={(e) => { const v = Number(e.target.value || 0); const n = { ...cal, offsetY: v }; setCal(n); localStorage.setItem(CAL_KEY, JSON.stringify(n)); }}
          sx={{ width: 110 }} />
        <TextField label="Scale" size="small" type="number" inputProps={{ step: '0.01' }} value={cal.scale}
          onChange={(e) => { const v = Number(e.target.value || 1); const n = { ...cal, scale: v }; setCal(n); localStorage.setItem(CAL_KEY, JSON.stringify(n)); }}
          sx={{ width: 110 }} />
        <TextField label="Font Scale" size="small" type="number" inputProps={{ step: '0.05' }} value={cal.fontScale}
          onChange={(e) => { const v = Number(e.target.value || 1); const n = { ...cal, fontScale: v }; setCal(n); localStorage.setItem(CAL_KEY, JSON.stringify(n)); }}
          sx={{ width: 130 }} />
  <FormControlLabel control={<Checkbox checked={!!cal.showGrid} onChange={(e) => { const n = { ...cal, showGrid: e.target.checked }; setCal(n); localStorage.setItem(CAL_KEY, JSON.stringify(n)); }} />} label="Grid" />
      </Stack>

      {!data ? (
        <Typography variant="body2" color="text.secondary">Masukkan ID SPK untuk menampilkan pratinjau.</Typography>
      ) : (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box ref={pageRef} className="spk-page" sx={{
  width: '210mm', height: '330mm', background: '#fff', color: '#000',
        border: '2px solid #000', boxShadow: 1, display: 'flex', flexDirection: 'column',
        transform: `translate(${cal.offsetX}px, ${cal.offsetY}px) scale(${cal.scale})`, transformOrigin: 'top left',
        textAlign: 'left',
        '@media print': { border: 'none', boxShadow: 'none' }
      }}>
        {/* Header */}
        <Box sx={{ height: '3cm', background: '#FF9800', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px', px: '10px', fontWeight: 700, fontSize: 14 }}>
          {/* Left: Company Logo */}
          <Box sx={{ flexBasis: '33.33%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', p: 1 }}>
            {logoMissing ? (
              <span style={{ fontSize: 12, fontWeight: 700 }}>LOGO</span>
            ) : (
              <img src="/logo-sakura.png" alt="Sakura Konveksi" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setLogoMissing(true)} />
            )}
          </Box>
          {/* Center: Title */}
          <Box sx={{ flexBasis: '46.67%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>SPK KANTOR</Box>
          {/* Right: QR for ID SPK */}
          <Box sx={{ flexBasis: '20%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1, flexDirection: 'column', gap: '2px' }}>
            {qrUrl ? (
              <>
                <img src={qrUrl} alt="QR" style={{ maxWidth: '100%', maxHeight: '90%', objectFit: 'contain', background: '#fff', padding: '2px', borderRadius: 2 }} />
                <span style={{ fontSize: 11, fontWeight: 700 }}>{data?.idSpk || ''}</span>
              </>
            ) : (
              'QR'
            )}
          </Box>
        </Box>

        {/* Main content */}
        <Box sx={{ flexGrow: 1, p: '3px', display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
          {/* Top row */}
          <Box sx={{ display: 'flex', gap: '3px' }}>
      {/* Data Pesanan */}
            <Box sx={{ flex: 1, border: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
  <table className="left-table" style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 10, textAlign: 'left' }}>
                <thead>
    <tr><th colSpan={2} style={{ background: '#f2f2f2', borderBottom: '2px solid #000', padding: 3, textAlign: 'left' }}>DATA PESANAN</th></tr>
                </thead>
                <tbody>
                  {[
                    ['ID REKAP CUSTOM', data.idRekapCustom],
                    ['ID CUSTOM', data.idCustom],
                    ['ID TRANSAKSI', data.idTransaksi],
                    ['ID REKAP PRODUKSI', data.idRekapProduksi],
                    ['NAMA', data.nama],
                    ['TANGGAL ORDER', formatDate(data.tanggalOrder)],
                    ['DEADLINE', formatDate(data.deadline)],
                    ['ID SPK', data.idSpk],
                    ['JUMLAH SPK', String(data.jumlahSpk ?? 1)],
                  ].map(([l,v], i) => (
                    <tr key={i}>
          <td align="left" style={{ width: '45%', fontWeight: 700, padding: '2px 4px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>{l}</td>
          <td align="left" style={{ padding: '0 4px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 700 }}>{v || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

      {/* Jenis Pesanan */}
            <Box sx={{ flex: 1, border: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
        <table className="left-table" style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 10, textAlign: 'left' }}>
                <thead><tr><th colSpan={2} style={{ background: '#f2f2f2', borderBottom: '2px solid #000', padding: 3, textAlign: 'left' }}>JENIS PESANAN</th></tr></thead>
                <tbody>
                  {[
  ['PRODUK', data.produk?.produk || ''],
                    ['LENGAN', data.produk?.lengan],
                    ['JENIS KAIN', data.produk?.jenisKain],
                    ['WARNA KAIN', data.produk?.warnaKain],
                    ['JENIS POLA', data.produk?.jenisPola],
  ['KONTEN', data.produk?.konten || ''],
        ['QTY', String(data.produk?.qty ?? '')],
                    ['\u00A0',''],['\u00A0',''],['\u00A0',''],
                  ].map(([l,v], i) => (
                    <tr key={i}>
          <td align="left" style={{ width: '45%', fontWeight: 700, padding: '2px 4px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>{l as string}</td>
          <td align="left" style={{ padding: '0 4px', borderBottom: '1px solid #ddd', textAlign: 'left', fontWeight: 700 }}>{v as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {/* Alamat Pengiriman */}
            <Box sx={{ flex: 1, border: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
        <table className="left-table" style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 10, textAlign: 'left' }}>
                <thead><tr><th style={{ background: '#f2f2f2', borderBottom: '2px solid #000', padding: 3, textAlign: 'left' }}>ALAMAT PENGIRIMAN</th></tr></thead>
                <tbody>
      <tr><td align="left" style={{ padding: 4, verticalAlign: 'top', textAlign: 'left', whiteSpace: 'pre-wrap', fontSize: 9, lineHeight: 1.2 }}>{data.alamat || ''}</td></tr>
                </tbody>
              </table>
            </Box>
          </Box>

          {/* Middle row */}
          <Box sx={{ display: 'flex', gap: '3px', flexGrow: 1, overflow: 'hidden' }}>
            {/* Spesifikasi */}
            <Box sx={{ flexBasis: '35%', border: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
              <table className="spes-left" style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 9, lineHeight: 1.1, textAlign: 'left' }}>
                <thead><tr><th colSpan={2} style={{ background: '#f2f2f2', borderBottom: '2px solid #000', padding: 2, textAlign: 'left' }}>SPESIFIKASI</th></tr></thead>
                <tbody>
                  {[
                    ['HOODIE', data.spesifikasi?.hoodie],
                    ['JAHITAN', data.spesifikasi?.jahitan],
                    ['JENIS FURING', data.spesifikasi?.jenisFuring],
                    ['SAKU', data.spesifikasi?.saku],
                    ['SAKU BAWAH', data.spesifikasi?.sakuBawah],
                    ['TALI BAWAH', data.spesifikasi?.taliBawah],
                    ['SAKU FURING', data.spesifikasi?.sakuFuring],
                    ['UJUNG LENGAN', data.spesifikasi?.ujungLengan],
                    ['APLIKASI', data.spesifikasi?.aplikasi],
                    ['JENIS SABLON', data.spesifikasi?.jenisSablon],
                    ['JENIS BORDIR', data.spesifikasi?.jenisBordir],
                    ['JENIS REFLEKTOR', data.spesifikasi?.jenisReflektor],
                    ['WARNA LIST REFLEKTOR', data.spesifikasi?.warnaListReflektor],
                    ['KANCING DEPAN', data.spesifikasi?.kancingDepan],
                    ['PLAKET', data.spesifikasi?.plaket],
                    ['KERAH', data.spesifikasi?.kerah],
                    ['POTONGAN BAWAH', data.spesifikasi?.potonganBawah],
                    ['BELAH SAMPING', data.spesifikasi?.belahSamping],
                    ['SKODER', data.spesifikasi?.skoder],
                    ['VARIASI SAKU', data.spesifikasi?.variasiSaku],
                    ['TALI LENGAN', data.spesifikasi?.taliLengan],
                    ['VENTILASI', data.spesifikasi?.ventilasi],
                    ['JAHITAN VENTILASI HORZ', data.spesifikasi?.jahitanVentilasiHorz],
                    ['TEMPAT PULPEN', data.spesifikasi?.tempatPulpen],
                    ['LIDAH KANCING', data.spesifikasi?.lidahKancing],
                    ['BAN BAWAH', data.spesifikasi?.banBawah],
                    ['TEMPAT LANYARD', data.spesifikasi?.tempatLanyard],
                    ['GANTUNGAN HT', data.spesifikasi?.gantunganHt],
                  ].map(([l,v], i) => (
                    <tr key={i}>
                      <td align="left" style={{ width: '45%', fontWeight: 700, padding: '1px 3px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{l}</td>
                      <td align="left" style={{ padding: '0 2px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', fontWeight: 700 }}>{v || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {/* Right column */}
            <Box sx={{ flexBasis: '65%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <Box sx={{ flexGrow: 2, border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {(() => {
                  const snap = (data as any)?.designSnap || {};
                  // Priority: validated worksheet mockup, then explicit mockupUrl, then assetLink/assets
                  const fromWorksheet = snap?.worksheet?.mockup?.file;
                  const fromExplicit = snap?.mockupUrl;
                  const fromAssets = Array.isArray(snap?.assets) ? snap.assets.find((a: any) => String(a?.attribute||'').toLowerCase().includes('mockup'))?.file : undefined;
                  const fromLink = snap?.assetLink;
                  const m = fromWorksheet || fromExplicit || fromAssets || fromLink;
                  return m ? (<img src={m} alt="mockup" style={{ maxWidth: '100%', maxHeight: '100%' }} />) : 'MOCK UP';
                })()}
              </Box>
              <Box sx={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                {['BORDIR LENGAN KANAN','BORDIR DADA KANAN','BORDIR BELAKANG','BORDIR LENGAN KIRI','BORDIR DADA KIRI','BORDIR TAMBAHAN'].map((t) => (
                  <Box key={t} sx={{ border: '2px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: '2px', fontSize: 8 }}>
                    <Box sx={{ fontWeight: 700, fontSize: 7, textAlign: 'left', px: '4px', py: '2px' }}>{t}</Box>
                    <Box sx={{ flexGrow: 1, width: '100%', minHeight: '20px', textAlign: 'left', px: '4px' }}>{/* ID area */}</Box>
                    <Box sx={{ flexShrink: 0, width: '60%', px: '4px', pb: '2px' }}>
                      <table style={{ width: '100%', fontWeight: 'normal' }}>
                        <tbody>
                          <tr><td style={{ width: '45%', fontWeight: 700 }}>UKURAN</td><td style={{ width: '5%' }}>:</td><td style={{ width: '50%', fontWeight: 700 }}>{''}</td></tr>
                          <tr><td style={{ width: '45%', fontWeight: 700 }}>JARAK</td><td style={{ width: '5%' }}>:</td><td style={{ width: '50%', fontWeight: 700 }}>{''}</td></tr>
                        </tbody>
                      </table>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Bottom row */}
          <Box sx={{ display: 'flex', gap: '3px' }}>
            {/* Catatan */}
            <Box sx={{ flex: 1, border: '2px solid #000', p: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
              <strong>CATATAN:</strong>
              <Box sx={{ width: '100%', flexGrow: 1, fontWeight: 400, p: '2px 4px', whiteSpace: 'pre-wrap', fontSize: 9, lineHeight: 1.2, wordBreak: 'break-word' }}>
                {data.catatan || ''}
              </Box>
            </Box>

            {/* Size / Nama */}
            <Box sx={{ flex: 1, border: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
              {/* Fixed-height body rows (12 rows) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 10 }}>
                <thead>
                  <tr>
                    <th style={{ background: '#f2f2f2', borderBottom: '2px solid #000', padding: 3 }}>SIZE</th>
                    <th style={{ background: '#f2f2f2', borderBottom: '2px solid #000', padding: 3 }}>NAMA</th>
                    <th style={{ background: '#f2f2f2', borderBottom: '2px solid #000', padding: 3 }}>FORMAT NAMA</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items || []).slice(0,12).map((it: AnyRec, i: number) => (
                    <tr key={i} style={{ height: 18 }}>
                      <td align="left" style={{ borderBottom: '1px solid #ddd', padding: '0 4px', height: 18, lineHeight: '18px', verticalAlign: 'middle', textAlign: 'left' }}>{it?.size || ''}</td>
                      <td align="left" style={{ borderBottom: '1px solid #ddd', padding: '0 4px', height: 18, lineHeight: '18px', verticalAlign: 'middle', textAlign: 'left' }}>{it?.nama || ''}</td>
                      <td align="left" style={{ borderBottom: '1px solid #ddd', padding: '0 4px', height: 18, lineHeight: '18px', verticalAlign: 'middle', textAlign: 'left' }}>{it?.formatNama || ''}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 12 - (data.items?.length || 0)) }).map((_, i) => (
                    <tr key={`blank-${i}`} style={{ height: 18 }}>
                      <td align="left" style={{ borderBottom: '1px solid #ddd', padding: '0 4px', height: 18, lineHeight: '18px', verticalAlign: 'middle', textAlign: 'left' }}></td>
                      <td align="left" style={{ borderBottom: '1px solid #ddd', padding: '0 4px', height: 18, lineHeight: '18px', verticalAlign: 'middle', textAlign: 'left' }}></td>
                      <td align="left" style={{ borderBottom: '1px solid #ddd', padding: '0 4px', height: 18, lineHeight: '18px', verticalAlign: 'middle', textAlign: 'left' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            {/* Rekap Size & Paraf */}
            <Box sx={{ flex: 1, border: '2px solid #000', display: 'flex', flexDirection: 'column' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, height: '100%', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '16.66%' }} />
                  <col style={{ width: '16.66%' }} />
                  <col style={{ width: '16.66%' }} />
                  <col style={{ width: '16.66%' }} />
                  <col style={{ width: '16.66%' }} />
                  <col style={{ width: '16.66%' }} />
                </colgroup>
                <thead><tr><th colSpan={6} style={{ background: '#f2f2f2', padding: 3, textAlign: 'center' }}>REKAP SIZE</th></tr></thead>
                <tbody>
                  {[
                    ['XS', data.rekapSize?.XS, 'XL', data.rekapSize?.XL, '5XL', data.rekapSize?.['5XL']],
                    ['S', data.rekapSize?.S, 'XXL', data.rekapSize?.XXL, '6XL', data.rekapSize?.['6XL']],
                    ['M', data.rekapSize?.M, '3XL', data.rekapSize?.['3XL'], '7XL', data.rekapSize?.['7XL']],
                    ['L', data.rekapSize?.L, '4XL', data.rekapSize?.['4XL'], 'CST', data.rekapSize?.['CST']],
                  ].map((r: any[], idx: number) => {
                    const v1 = Number(r[1] || 0);
                    const v2 = Number(r[3] || 0);
                    const v3 = Number(r[5] || 0);
                    const hl1 = v1 > 0 ? '#FFF59D' : undefined; // light yellow
                    const hl2 = v2 > 0 ? '#FFF59D' : undefined;
                    const hl3 = v3 > 0 ? '#FFF59D' : undefined;
                    return (
                      <tr key={idx} style={{ height: 20 }}>
                        <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 700, height: 20, lineHeight: '20px', verticalAlign: 'middle', background: hl1 }}>{r[0]}</td>
                        <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 700, height: 20, lineHeight: '20px', verticalAlign: 'middle', background: hl1 }}>{v1}</td>
                        <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 700, height: 20, lineHeight: '20px', verticalAlign: 'middle', background: hl2 }}>{r[2]}</td>
                        <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 700, height: 20, lineHeight: '20px', verticalAlign: 'middle', background: hl2 }}>{v2}</td>
                        <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 700, height: 20, lineHeight: '20px', verticalAlign: 'middle', background: hl3 }}>{r[4]}</td>
                        <td style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 700, height: 20, lineHeight: '20px', verticalAlign: 'middle', background: hl3 }}>{v3}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', background: '#f2f2f2', textAlign: 'center', fontWeight: 700 }}>KONSUMEN</td>
                    <td colSpan={2} style={{ border: '1px solid #000', background: '#f2f2f2', textAlign: 'center', fontWeight: 700 }}>CS</td>
                    <td colSpan={2} style={{ border: '1px solid #000', background: '#f2f2f2', textAlign: 'center', fontWeight: 700 }}>CUTTING</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', height: 35 }}></td>
                    <td colSpan={2} style={{ border: '1px solid #000' }}></td>
                    <td colSpan={2} style={{ border: '1px solid #000' }}></td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', background: '#f2f2f2', textAlign: 'center', fontWeight: 700 }}>BORDIR</td>
                    <td colSpan={2} style={{ border: '1px solid #000', background: '#f2f2f2', textAlign: 'center', fontWeight: 700 }}>JAHIT</td>
                    <td colSpan={2} style={{ border: '1px solid #000', background: '#f2f2f2', textAlign: 'center', fontWeight: 700 }}>FINISHING</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #000', height: 35 }}></td>
                    <td colSpan={2} style={{ border: '1px solid #000' }}></td>
                    <td colSpan={2} style={{ border: '1px solid #000' }}></td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Box>
        </Box>

  {/* Footer */}
  <Box sx={{ height: '3cm', background: '#FF9800', color: '#fff', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontWeight: 800, fontSize: 24, pt: '4mm' }}>
          {(data.idSpk || '') + (data.namaDesain ? ` - ${data.namaDesain}` : '')}
        </Box>
      </Box>
    </Box>
      )}

      <style>{`
        /* Paksa rata kiri spesifikasi & tabel bertanda left-table di layar dan PDF */
        .spes-left th, .spes-left td { text-align: left !important; }
        .left-table th, .left-table td { text-align: left !important; }
        /* Netralisir global #root { text-align:center } yang bisa terbawa ke PDF */
        .spk-page { text-align: left !important; }
        @media print {
          /* F4 paper size 210mm x 330mm */
          @page { size: 210mm 330mm; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          /* Fit content inside printable area (page size minus margins) */
          .spk-page { width: calc(210mm - 1cm) !important; height: calc(330mm - 1cm) !important; }
        }
      `}</style>
    </Box>
  );
}

// (Field component from previous version removed; template now uses tables)

// Minimal Code39 implementation for numeric idSpk
// removed old Code39 renderer; replaced with QR code

function formatDate(d: any): string {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(+date)) return String(d);
    return date.toLocaleDateString('id-ID');
  } catch { return String(d); }
}

function parseDateFlexible(input: any): Date | null {
  if (!input) return null;
  try {
    if (input instanceof Date) return isNaN(+input) ? null : input;
    const s = String(input).trim();
    // Try ISO first
    const iso = new Date(s);
    if (!isNaN(+iso)) return iso;
    // Try dd/mm/yyyy or mm/dd/yyyy heuristics
    const m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      const y = parseInt(m[3].length === 2 ? ('20' + m[3]) : m[3], 10);
      // If first > 12 assume dd/mm, else assume mm/dd but also accept dd/mm when unambiguous
      const isDMY = a > 12;
      const day = isDMY ? a : b;
      const month = (isDMY ? b : a) - 1;
      const d = new Date(y, month, day);
      return isNaN(+d) ? null : d;
    }
    return null;
  } catch {
    return null;
  }
}

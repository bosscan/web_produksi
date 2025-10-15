import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button, Dialog, AppBar, Toolbar, IconButton, TextField, MenuItem, Grid, Stack, Snackbar, Alert, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useRef, useState } from 'react';
import TableExportToolbar from '../../../components/TableExportToolbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type QueueItem = {
  idRekapCustom: string;
  idSpk?: string;
  idCustom: string;
  namaDesain: string;
  jenisProduk: string;
  jenisPola: string;
  tanggalInput: string;
  namaCS: string;
  assets: Array<{ file: string | null; attribute: string; size: string; distance: string; description: string }>;
  status?: string;
  worksheet?: Worksheet;
};

type AssetBlock = {
  file: string | null;
  ukuran: string;
  jarak: string;
  keterangan: string;
};

type Worksheet = {
  dadaKanan: AssetBlock;
  dadaKiri: AssetBlock;
  lenganKanan: AssetBlock;
  lenganKiri: AssetBlock;
  belakang: AssetBlock;
  tambahanReferensi: AssetBlock;
  mockup: AssetBlock;
  linkDriveInputCS: string;
  linkDriveAssetJadi: string;
  catatan?: string;
};

export default function PraProduksiAntrian() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QueueItem | null>(null);
  const [status, setStatus] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>(
    { open: false, message: '', severity: 'success' }
  );
  const [errors, setErrors] = useState<{ mockup?: string; links?: string } | null>(null);

  useEffect(() => {
    const refresh = () => {
      const raw = localStorage.getItem('design_queue');
      const list: QueueItem[] = raw ? JSON.parse(raw) : [];
      const filtered = list.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
      setRows(filtered);
    };
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === 'design_queue') refresh(); };
    window.addEventListener('storage', onStorage);
    const timer = setInterval(refresh, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  const handleKerjakan = (rekapId: string, idSpk?: string) => {
  // Pilih item unik berdasarkan kombinasi Rekap + SPK
  const found = rows.find(r => r.idRekapCustom === rekapId && String(r.idSpk || '') === String(idSpk || '')) || null;
    if (!found) return;
    setActive(found);
    setStatus(found.status || 'Sedang dikerjakan');
    setCatatan(found.worksheet?.catatan || '');
    setWs(found.worksheet || {
      dadaKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      dadaKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      belakang: { file: null, ukuran: '', jarak: '', keterangan: '' },
      tambahanReferensi: { file: null, ukuran: '', jarak: '', keterangan: '' },
      mockup: { file: null, ukuran: '', jarak: '', keterangan: '' },
      linkDriveInputCS: '',
      linkDriveAssetJadi: '',
      catatan: ''
    });
    setOpen(true);
    // also persist status change immediately
  // update in full list stored, then refresh filtered view
  const allRaw = localStorage.getItem('design_queue');
  const allList: QueueItem[] = allRaw ? JSON.parse(allRaw) : [];
  const updAll = allList.map(it => (it.idRekapCustom === rekapId && String(it.idSpk || '') === String(idSpk || '')) ? { ...it, status: 'Sedang dikerjakan' } : it);
  localStorage.setItem('design_queue', JSON.stringify(updAll));
  const filtered = updAll.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
  setRows(filtered);
  };

  const handleClose = () => { setOpen(false); setActive(null); };

  const persist = (list: QueueItem[]) => localStorage.setItem('design_queue', JSON.stringify(list));

  const handleSaveWorksheet = () => {
    if (!active) return;
    const allRaw = localStorage.getItem('design_queue');
    const allList: QueueItem[] = allRaw ? JSON.parse(allRaw) : [];
  const updAll = allList.map(it => (it.idRekapCustom === active.idRekapCustom && String(it.idSpk || '') === String((active as any).idSpk || '')) ? { ...it, status, worksheet: ws ? { ...ws, catatan } : undefined } : it);
    persist(updAll);
    const filtered = updAll.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
    setRows(filtered);
    setOpen(false);
    setActive(null);
    setSnack({ open: true, message: 'Worksheet disimpan', severity: 'success' });
  };

  const handleSelesaiDesain = () => {
    if (!active) return;
    // basic validations: require mockup image and at least one of asset fields filled
    const errs: { mockup?: string; links?: string } = {};
    if (!ws?.mockup?.file) {
      errs.mockup = 'Mockup wajib diupload.';
    }
    if (!ws?.linkDriveAssetJadi) {
      errs.links = 'Link Drive Asset Jadi wajib diisi.';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setSnack({ open: true, message: 'Lengkapi data sebelum menyelesaikan desain', severity: 'error' });
      return;
    }
    // mark selesai and remove from current antrian view
  const allRaw = localStorage.getItem('design_queue');
  const allList: QueueItem[] = allRaw ? JSON.parse(allRaw) : [];
  const updAll = allList.map(it => (it.idRekapCustom === active.idRekapCustom && String(it.idSpk || '') === String((active as any).idSpk || '')) ? { ...it, status: 'Selesai', worksheet: ws ? { ...ws, catatan } : undefined } : it);
  persist(updAll);
  const filteredNow = updAll.filter(it => !['Antrian revisi', 'Selesai', 'Desain di validasi'].includes(it.status || ''));
  setRows(filteredNow);
    setOpen(false);
    setActive(null);
    setSnack({ open: true, message: 'Desain diselesaikan dan dihapus dari antrian', severity: 'success' });
  };

  const exportWorksheetPdf = () => {
    if (!active) return;
    const doc = new jsPDF();
  doc.text('Divisi Desainer Pra Produksi', 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [['Field', 'Value']],
      body: [
        ['ID Rekap Custom', active.idRekapCustom],
        ['ID Custom', active.idCustom],
        ['Nama Desain', active.namaDesain],
        ['Jenis Produk', active.jenisProduk],
        ['Jenis Pola', active.jenisPola],
        ['Tanggal Input', active.tanggalInput],
        ['Nama CS', active.namaCS],
        ['Status', status],
        ['Link Drive Input CS', ws?.linkDriveInputCS || '-'],
        ['Link Drive Asset Jadi', ws?.linkDriveAssetJadi || '-'],
        ['Catatan', catatan || '-'],
      ]
    });
    doc.save(`worksheet-${active.idRekapCustom}.pdf`);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '100%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Divisi Desainer Pra Produksi - Antrian Pengerjaan Desain</Typography>
        <TableExportToolbar title="Antrian Pengerjaan Desain (Pra Produksi)" tableRef={tableRef} fileBaseName="pra-produksi-antrian-pengerjaan-desain" />
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1300 }} aria-label="pra-produksi-antrian" ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID Rekap Custom</TableCell>
                <TableCell>ID Custom</TableCell>
                <TableCell>Nama Desain</TableCell>
                <TableCell>Jenis Produk</TableCell>
                <TableCell>Jenis Pola</TableCell>
                <TableCell>Tanggal Input Desain</TableCell>
                <TableCell>Nama CS</TableCell>
                <TableCell>Asset Desain</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
        <TableRow key={`${row.idRekapCustom}-${row.idSpk || index}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.idRekapCustom}</TableCell>
                  <TableCell>{row.idCustom}</TableCell>
                  <TableCell>{row.namaDesain}</TableCell>
                  <TableCell>{row.jenisProduk}</TableCell>
                  <TableCell>{row.jenisPola}</TableCell>
                  <TableCell>{row.tanggalInput}</TableCell>
                  <TableCell>{row.namaCS}</TableCell>
                  <TableCell>{row.assets?.length || 0} file</TableCell>
                  <TableCell>
          <Button variant="contained" onClick={() => handleKerjakan(row.idRekapCustom, row.idSpk)}>Kerjakan</Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">Tidak ada antrian</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
  {/* Full-screen Divisi Dialog */}
      <Dialog fullScreen open={open} onClose={handleClose}>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Divisi Desainer Pra Produksi
            </Typography>
            <Button autoFocus color="inherit" onClick={handleSaveWorksheet} variant="outlined">
              Simpan
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          {active && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 2, mb: 3 }}>
                <TextField label="ID Rekap Custom" value={active.idRekapCustom} size="small" InputProps={{ readOnly: true }} />
                <TextField label="ID Custom" value={active.idCustom} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Nama Desain" value={active.namaDesain} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Jenis Produk" value={active.jenisProduk} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Jenis Pola" value={active.jenisPola} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Tanggal Input" value={active.tanggalInput} size="small" InputProps={{ readOnly: true }} />
                <TextField label="Nama CS" value={active.namaCS} size="small" InputProps={{ readOnly: true }} />
                <TextField select label="Status" value={status} size="small" onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="Menunggu dikerjakan">Menunggu dikerjakan</MenuItem>
                  <MenuItem value="Sedang dikerjakan">Sedang dikerjakan</MenuItem>
                  <MenuItem value="Selesai">Selesai</MenuItem>
                </TextField>
              </Box>
              {/* Worksheet sections as per sketch */}
              <Typography variant="h6" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>ASSET DESAIN JADI</Typography>
              <Grid container spacing={2}>
                {[
                  { key: 'dadaKanan', label: 'ATTRIBUT DADA KANAN' },
                  { key: 'dadaKiri', label: 'ATTRIBUT DADA KIRI' },
                  { key: 'lenganKanan', label: 'ATTRIBUT LENGAN KANAN' },
                  { key: 'lenganKiri', label: 'ATTRIBUT LENGAN KIRI' },
                  { key: 'belakang', label: 'ATTRIBUT BELAKANG' },
                  { key: 'tambahanReferensi', label: 'DETAIL TAMBAHAN/REFERENSI' },
                  { key: 'mockup', label: 'MOCKUP' },
                ].map((sec) => (
                  <Grid key={sec.key} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>{sec.label}</Typography>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                        <Button variant="outlined" component="label" size="small">
                          Upload
                          <input type="file" accept="image/*" hidden onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => setWs((prev) => prev ? ({ ...prev, [sec.key]: { ...prev[sec.key as keyof Worksheet] as AssetBlock, file: reader.result as string } }) : prev);
                            reader.readAsDataURL(file);
                          }} />
                        </Button>
                        {ws && (ws[sec.key as keyof Worksheet] as AssetBlock)?.file && (
                          <img src={(ws[sec.key as keyof Worksheet] as AssetBlock).file as string} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                        )}
                        {sec.key === 'mockup' && errors?.mockup && (
                          <Chip color="error" size="small" label={errors.mockup} />
                        )}
                      </Stack>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="UKURAN" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).ukuran : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), ukuran: e.target.value } }) : prev)} /></Grid>
                        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="JARAK" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).jarak : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), jarak: e.target.value } }) : prev)} /></Grid>
                        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="KETERANGAN" value={ws ? (ws[sec.key as keyof Worksheet] as AssetBlock).keterangan : ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, [sec.key]: { ...(prev[sec.key as keyof Worksheet] as AssetBlock), keterangan: e.target.value } }) : prev)} /></Grid>
                      </Grid>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="LINK DRIVE INPUT CS" value={ws?.linkDriveInputCS || ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, linkDriveInputCS: e.target.value }) : prev)} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="LINK DRIVE ASSET JADI" value={ws?.linkDriveAssetJadi || ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, linkDriveAssetJadi: e.target.value }) : prev)} />
                  {errors?.links && <Typography variant="caption" color="error">{errors.links}</Typography>}
                </Grid>
              </Grid>

              <TextField sx={{ mt: 2 }} label="Catatan" multiline rows={4} fullWidth value={catatan} onChange={(e) => setCatatan(e.target.value)} />

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
                <Button variant="outlined" color="primary" onClick={exportWorksheetPdf}>Export PDF</Button>
                <Button variant="contained" color="success" onClick={handleSelesaiDesain}>Selesai Desain</Button>
              </Box>
            </>
          )}
        </Box>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

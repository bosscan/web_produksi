import { Box, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Typography, Button, Dialog, AppBar, Toolbar, IconButton, TextField, MenuItem, Grid, Stack, Snackbar, Alert, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useRef, useState } from 'react';

type AssetBlock = { file: string | null; ukuran: string; jarak: string; keterangan: string };
type Worksheet = {
  dadaKanan: AssetBlock; dadaKiri: AssetBlock; lenganKanan: AssetBlock; lenganKiri: AssetBlock; belakang: AssetBlock; tambahanReferensi: AssetBlock; mockup: AssetBlock;
  linkDriveInputCS: string; linkDriveAssetJadi: string; catatan?: string;
};
type QueueItem = {
  idRekapCustom: string; idSpk?: string; idCustom: string; namaDesain: string; jenisProduk: string; jenisPola: string; tanggalInput: string; namaCS: string; status?: string; revisiCatatan?: string; worksheet?: Worksheet;
};

export default function PraProduksiRevisi() {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QueueItem | null>(null);
  const [status, setStatus] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [showRevisiDetail, setShowRevisiDetail] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
  const [errors, setErrors] = useState<{ mockup?: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('design_queue');
    const list: QueueItem[] = raw ? JSON.parse(raw) : [];
    setRows(list.filter(it => it.status === 'Antrian revisi'));
  }, []);

  const openWorksheet = (rekapId: string, idSpk?: string) => {
    const found = rows.find(r => r.idRekapCustom === rekapId && String(r.idSpk || '') === String(idSpk || '')) || null;
    if (!found) return;
    setActive(found);
    setStatus(found.status || 'Antrian revisi');
    setCatatan(found.worksheet?.catatan || '');
    setWs(found.worksheet || {
      dadaKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      dadaKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKanan: { file: null, ukuran: '', jarak: '', keterangan: '' },
      lenganKiri: { file: null, ukuran: '', jarak: '', keterangan: '' },
      belakang: { file: null, ukuran: '', jarak: '', keterangan: '' },
      tambahanReferensi: { file: null, ukuran: '', jarak: '', keterangan: '' },
      mockup: { file: null, ukuran: '', jarak: '', keterangan: '' },
      linkDriveInputCS: '', linkDriveAssetJadi: '', catatan: ''
    });
    setOpen(true);
  };

  const persist = (list: QueueItem[]) => localStorage.setItem('design_queue', JSON.stringify(list));

  const handleSave = () => {
    if (!active) return;
    const all = JSON.parse(localStorage.getItem('design_queue') || '[]');
  const updAll = all.map((it: QueueItem) => (it.idRekapCustom === active.idRekapCustom && String(it.idSpk || '') === String((active as any).idSpk || '')) ? { ...it, status, worksheet: ws ? { ...ws, catatan } : undefined } : it);
    persist(updAll);
    setRows(updAll.filter((x: QueueItem) => x.status === 'Antrian revisi'));
    setOpen(false); setActive(null);
    setSnack({ open: true, message: 'Worksheet revisi disimpan', severity: 'success' });
  };

  const handleSelesai = () => {
    if (!active) return;
    const errs: { mockup?: string } = {};
    if (!ws?.mockup?.file) errs.mockup = 'Mockup revisi wajib diupload.';
    if (Object.keys(errs).length > 0) { setErrors(errs); setSnack({ open: true, message: 'Lengkapi data revisi', severity: 'error' }); return; }
    const all = JSON.parse(localStorage.getItem('design_queue') || '[]');
  const updAll = all.map((it: QueueItem) => (it.idRekapCustom === active.idRekapCustom && String(it.idSpk || '') === String((active as any).idSpk || '')) ? { ...it, status: 'Selesai', worksheet: ws ? { ...ws, catatan } : undefined } : it);
    persist(updAll);
    setRows(updAll.filter((x: QueueItem) => x.status === 'Antrian revisi'));
    setOpen(false); setActive(null);
    setSnack({ open: true, message: 'Revisi diselesaikan', severity: 'success' });
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxHeight: 'calc(100vh - 64px)', overflowY: 'auto', p: 3, boxSizing: 'border-box', flexDirection: 'column' }}>
      <Box sx={{ width: '100%', borderRadius: 2, boxShadow: 2, flexDirection: 'column', p: 3, mb: 3 }}>
  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Divisi Desainer Pra Produksi - Antrian Pengerjaan Revisi Desain</Typography>
        <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1300 }} aria-label="pra-produksi-revisi" ref={tableRef}>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>ID Rekap Custom</TableCell>
                <TableCell>ID Custom</TableCell>
                <TableCell>Nama Desain</TableCell>
                <TableCell>Jenis Produk</TableCell>
                <TableCell>Jenis Pola</TableCell>
                <TableCell>Tanggal Input</TableCell>
                <TableCell>Nama CS</TableCell>
                <TableCell>Detail Revisi</TableCell>
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
                  <TableCell>
                    <Button variant="outlined" onClick={() => setShowRevisiDetail(row.revisiCatatan || 'Tidak ada catatan')}>Detail</Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="contained" onClick={() => openWorksheet(row.idRekapCustom, row.idSpk)}>Kerjakan Revisi</Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">Tidak ada antrian revisi</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Detail Revisi simple dialog */}
      <Dialog open={!!showRevisiDetail} onClose={() => setShowRevisiDetail(null)}>
        <Box sx={{ p: 3, minWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Catatan Revisi</Typography>
          <Typography whiteSpace="pre-wrap">{showRevisiDetail}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setShowRevisiDetail(null)}>Tutup</Button>
          </Box>
        </Box>
      </Dialog>

      {/* Worksheet Dialog (same layout as desain) */}
      <Dialog fullScreen open={open} onClose={() => { setOpen(false); setActive(null); }}>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => { setOpen(false); setActive(null); }} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">Divisi Revisi Desain</Typography>
            <Button color="inherit" variant="outlined" onClick={handleSave}>Simpan</Button>
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
                  <MenuItem value="Antrian revisi">Antrian revisi</MenuItem>
                  <MenuItem value="Sedang dikerjakan">Sedang dikerjakan</MenuItem>
                  <MenuItem value="Selesai">Selesai</MenuItem>
                </TextField>
              </Box>
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
                        {sec.key === 'mockup' && errors?.mockup && <Chip color="error" size="small" label={errors.mockup} />}
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
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="LINK DRIVE ASSET JADI" value={ws?.linkDriveAssetJadi || ''} onChange={(e) => setWs(prev => prev ? ({ ...prev, linkDriveAssetJadi: e.target.value }) : prev)} /></Grid>
              </Grid>
              <TextField sx={{ mt: 2 }} label="Catatan" multiline rows={4} fullWidth value={catatan} onChange={(e) => setCatatan(e.target.value)} />
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Button variant="contained" color="success" onClick={handleSelesai}>Selesai Desain</Button>
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

import { Box, Typography, Grid, TextField, RadioGroup, FormControlLabel, Radio, Button, TableContainer, Table, Paper, TableCell, TableRow, TableHead, TableBody, Select, MenuItem, Snackbar, Alert } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import TableExportToolbar from '../../components/TableExportToolbar'
import Api from '../../lib/api'

function InputPesanan() {
    const tableRef = useRef<HTMLTableElement | null>(null);
    const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'success' });
    // provinsi
    type Province = { id: string; name: string };
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [province, setProvince] = useState<string>('');

    //kabupaten
    type Regency = { id: string; name: string; province_id: string };
    const [regencies, setRegencies] = useState<Regency[]>([])
    const [regency, setRegency] = useState<string>('');

    // kecamatan
    type District = { id: string; name: string; regency_id: string };
    const [districts, setDistricts] = useState<District[]>([]);
    const [district, setDistrict] = useState<string>('');

    // desa
    type Village = { id: string; name: string; district_id: string };
    const [villages, setVillages] = useState<Village[]>([]);
    const [village, setVillage] = useState<string>('');

    // data konsumen
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')

    const [number, setNumber] = useState('')
    const [content, setContent] = useState('')

    // data pesanan
    const [quantity, setQuantity] = useState('')
    const [size, setSize] = useState('')
    const [nameset, setNameset] = useState('')
    const [formatName, setFormatName] = useState('')
    type LineItem = { size: string; nama: string; formatNama: string };
    const [items, setItems] = useState<LineItem[]>([]);
    // data transaksi
    const [transaction, setTransaction] = useState('')
    const [nominal, setNominal] = useState('')
    const [proof, setProof] = useState<string | null>(null); // bukti transaksi

    // Generator ID SPK 7 digit (1000001, 1000002, ...)
    const nextSpkId = () => {
        const key = 'spk_auto_seq';
        try {
            let seq = parseInt(localStorage.getItem(key) || '1000000', 10);
            if (!Number.isFinite(seq) || seq < 1000000) seq = 1000000;
            seq += 1;
            localStorage.setItem(key, String(seq));
            return String(seq).padStart(7, '0');
        } catch {
            return '1000001';
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setProof(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const getProvince = async () => {
            try {
                const dataResponse = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
                const data = await dataResponse.json()

                setProvinces(data)
                console.log(data)
            } catch (error) {
                console.error('Error fetching provinces:', error)
            }
        }
        getProvince()
    }, [])

    useEffect(() => {
        if (province) {
            const selectedProvince = provinces.find((prov) => prov.name === province)
            if (selectedProvince) {
                const getRegencies = async () => {
                    try {
                        const dataResponse = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince.id}.json`)
                        const data = await dataResponse.json()

                        setRegencies(data)
                    } catch (error) {
                        console.error('Error fetching regencies:', error)
                        setRegencies([])
                    }
                }
                getRegencies()
            }
        } else {
            setRegencies([])
            setRegency('')
        }
    }, [province, provinces])

    useEffect(() => {
        if (regency) {
            const selectedRegency = regencies.find((r) => r.name === regency)
            if (selectedRegency) {
                const getDistricts = async () => {
                    try {
                        const dataResponse = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegency.id}.json`)
                        const data = await dataResponse.json()

                        setDistricts(data)
                    } catch (error) {
                        console.error('Error fetching districts:', error)
                        setDistricts([])
                    }
                }
                getDistricts()
            }
        } else {
            setDistricts([])
            setDistrict('')
        }
    }, [regency, regencies])

    useEffect(() => {
        if (district) {
            const selectedDistrict = districts.find((d) => d.name === district);
            if (selectedDistrict) {
                const getVillages = async () => {
                    try {
                        const dataResponse = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrict.id}.json`);
                        const data = await dataResponse.json();
                        setVillages(data);
                    } catch (error) {
                        console.error('Error fetching villages:', error);
                        setVillages([]);
                    }
                };
                getVillages();
            }
        } else {
            setVillages([]);
            setVillage('');
        }
    }, [district, districts]);

    const handleAddItem = () => {
        if (!size || !nameset || !formatName) {
            setSnack({ open: true, message: 'Lengkapi Size, Nama, dan Format Nama', severity: 'error' });
            return;
        }
        setItems(prev => [...prev, { size, nama: nameset, formatNama: formatName }]);
        setSize('');
        setNameset('');
        setFormatName('');
        setSnack({ open: true, message: 'Data ditambahkan ke List Pesanan', severity: 'success' });
    };

    const handleSaveOrder = async () => {
        if (!name || !quantity || items.length === 0) {
            setSnack({ open: true, message: 'Nama konsumen, Quantity, dan List Pesanan wajib diisi', severity: 'error' });
            return;
        }
    const key = 'antrian_input_desain';
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
    // Try backend first
    let idSpk = '';
    try {
        const amount = Number(String(nominal || '').replace(/[^\d.-]/g, '')) || 0;
        const orderRes = await Api.postOrder({
            quantity: Number(String(quantity).replace(/\D/g, '')) || 0,
            transaction_type: transaction || '-',
            cs_name: '-',
            input_date: new Date().toISOString().slice(0,10),
            region_province: province,
            region_regency: regency,
            region_district: district,
            region_village: village,
            notes: content,
            nominal: amount,
            items: items.map(it => ({ size: it.size, nama: it.nama, format_nama: it.formatNama })),
        });
        idSpk = String(orderRes.id_spk || '');
    } catch (e) {
        // Offline fallback: local 7-digit generator
        idSpk = nextSpkId();
    }

        const payload = {
            idSpk,
            namaPemesan: name,
            quantity,
            tipeTransaksi: transaction || '-',
            namaCS: '-',
            tanggalInput: new Date().toLocaleDateString(),
            wilayah: { province, regency, district, village },
            address,
            number,
            content,
            items,
            nominal,
            proof,
        };
        list.push(payload);
        localStorage.setItem(key, JSON.stringify(list));
        // catat omset pendapatan dari nominal
    const amount = Number(String(nominal || '').replace(/[^\d.-]/g, ''));
        if (!isNaN(amount) && amount > 0) {
            const revKey = 'omset_pendapatan';
            const revRaw = localStorage.getItem(revKey);
            const revList = revRaw ? JSON.parse(revRaw) : [];
            revList.push({
                id: `OMSET-${Date.now()}`,
                idSpk,
                tanggal: new Date().toISOString(),
                namaPemesan: name,
                tipeTransaksi: transaction || '-',
                nominal: amount,
            });
            localStorage.setItem(revKey, JSON.stringify(revList));
            setSnack({ open: true, message: `Pesanan disimpan. Omset tercatat: Rp ${amount.toLocaleString('id-ID')}` as any, severity: 'success' });
        } else {
            setSnack({ open: true, message: 'Pesanan disimpan ke Antrian Input Desain', severity: 'success' });
        }

        // 1) Tulis ke Database Konsumen
        try {
            const konsKey = 'database_konsumen';
            const konsRaw = localStorage.getItem(konsKey);
            const konsList: Array<{ id: string; nama: string; telepon: string; alamat: string; createdAt: string }>= konsRaw ? JSON.parse(konsRaw) : [];
            const today = new Date().toISOString().slice(0,10);
            const existsIdx = konsList.findIndex(k => (k.telepon || '').replace(/\D/g,'') === (number || '').replace(/\D/g,''));
            const konsItem = { id: `KONS-${Date.now()}`, nama: name, telepon: number, alamat: address, createdAt: today };
            if (existsIdx >= 0) {
                // update minimal fields to latest
                konsList[existsIdx] = { ...konsList[existsIdx], nama: name, alamat: address, telepon: number, createdAt: konsList[existsIdx].createdAt || today };
            } else {
                konsList.push(konsItem);
            }
            localStorage.setItem(konsKey, JSON.stringify(konsList));
        } catch {}

    // 2) Trend Pesanan dicatat dari Input Desain, bukan dari Input Pesanan

        // 3) Tulis ke Sebaran Wilayah Penjualan (akumulasi per wilayah)
        try {
            const sebKey = 'database_sebaran';
            const sebRaw = localStorage.getItem(sebKey);
            const sebList: Array<{ id: string; kecamatan: string; kabupaten: string; provinsi: string; jumlah_konsumen: string; total_pesanan: string; updatedAt: string }>= sebRaw ? JSON.parse(sebRaw) : [];
            const today = new Date().toISOString().slice(0,10);
            const kec = district || '-';
            const kab = regency || '-';
            const prov = province || '-';
            const qty = Number(String(quantity).replace(/\D/g, '')) || 0;
            const idx = sebList.findIndex(r => r.kecamatan === kec && r.kabupaten === kab && r.provinsi === prov);
            if (idx >= 0) {
                const cur = sebList[idx];
                const jk = Number(cur.jumlah_konsumen || '0') + 1;
                const tp = Number(cur.total_pesanan || '0') + qty;
                sebList[idx] = { ...cur, jumlah_konsumen: String(jk), total_pesanan: String(tp), updatedAt: today };
            } else {
                sebList.push({ id: `SEB-${Date.now()}`, kecamatan: kec, kabupaten: kab, provinsi: prov, jumlah_konsumen: '1', total_pesanan: String(qty), updatedAt: today });
            }
            localStorage.setItem(sebKey, JSON.stringify(sebList));
        } catch {}
        // optional: clear list pesanan only
        setItems([]);
    };

    return (
        // data konsumen
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxHeight: 'calc(100vh - 64px)',
                overflowY: 'auto',
                alignItem: 'center',
                p: 3,
                boxSizing: 'border-box',
                flexDirection: 'column',
                // backgroundColor: '#f5f5f5',

            }}>
            <Box
                sx={{
                    width: '80%',
                    height: '500',
                    borderRadius: 2,
                    boxShadow: 2,
                    flexDirection: 'column',
                    p: 3,
                    mb: 3
                }}>
                <Typography variant='h6' sx={{
                    mb: 2,
                    fontWeight: 'bold',
                }}>Data Konsumen</Typography>
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Nama Konsumen:</Typography>
                            <TextField fullWidth size='small' value={name} onChange={(e) => setName(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Alamat Lengkap:</Typography>
                            <TextField fullWidth size='small' value={address} onChange={(e) => setAddress(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Pilih Provinsi:</Typography>
                            <Select value={province} onChange={(e) => setProvince(e.target.value as string)} displayEmpty fullWidth size='small'>
                                <MenuItem value=''>Pilih Provinsi</MenuItem>
                                {provinces.map((prov) => (
                                    <MenuItem key={prov.id} value={prov.name}>
                                        {prov.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Pilih Kabupaten:</Typography>

                            <Select value={regency} onChange={(e) => setRegency(e.target.value as string)} displayEmpty fullWidth size='small' disabled={!province}>
                                <MenuItem value=''>Pilih Kabupaten</MenuItem>
                                {regencies.map((reg) => (
                                    <MenuItem key={reg.id} value={reg.name}>
                                        {reg.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                            }}>
                            <Typography variant="body1" sx={{ mr: 1 }}>Pilih Kecamatan:</Typography>
                            <Select value={district} onChange={(e) => setDistrict(e.target.value as string)} displayEmpty fullWidth size="small" disabled={!regency}>
                                <MenuItem value="">Pilih Kecamatan</MenuItem>{districts.map((dist) => (
                                    <MenuItem key={dist.id} value={dist.name}>
                                        {dist.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant="body1" sx={{ mr: 1 }}>Pilih Desa:</Typography>
                            <Select
                                value={village}
                                onChange={(e) => setVillage(e.target.value as string)}
                                displayEmpty
                                fullWidth
                                size="small"
                                disabled={!district}
                            >
                                <MenuItem value="">Pilih Desa</MenuItem>
                                {villages.map((vil) => (
                                    <MenuItem key={vil.id} value={vil.name}>
                                        {vil.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Nomer HP:</Typography>
                            <TextField fullWidth size='small' value={number} onChange={(e) => setNumber(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Konten:</Typography>
                            <TextField fullWidth size='small' value={content} onChange={(e) => setContent(e.target.value)} />
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Data Pesanan */}
            <Box
                sx={{
                    display: 'flex',
                    width: '80%',
                    height: '500',
                    borderRadius: 2,
                    boxShadow: 2,
                    flexDirection: 'column',
                    p: 3
                }}>
                <Typography variant='h6' sx={{
                    mb: 3,
                    fontWeight: 'bold',
                }}>Data Pesanan</Typography>
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Quantity:</Typography>
                            <TextField fullWidth size='small' value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexDirection: 'row'
                        }}>
                            <Typography variant='body1'>Size:</Typography>
                            <RadioGroup
                                aria-label='size'
                                name='size'
                                value={size}
                                sx={{ flexDirection: 'row', ml: 2 }}
                                onChange={(e) => setSize(e.target.value)}>
                                <FormControlLabel value='XS' control={<Radio />} label='XS' />
                                <FormControlLabel value='S' control={<Radio />} label='S' />
                                <FormControlLabel value='M' control={<Radio />} label='M' />
                                <FormControlLabel value='L' control={<Radio />} label='L' />
                                <FormControlLabel value='XL' control={<Radio />} label='XL' />
                                <FormControlLabel value='XXL' control={<Radio />} label='XXL' />
                                <FormControlLabel value='3XL' control={<Radio />} label='3XL' />
                                <FormControlLabel value='4XL' control={<Radio />} label='4XL' />
                                <FormControlLabel value='5XL' control={<Radio />} label='5XL' />
                                <FormControlLabel value='6XL' control={<Radio />} label='6XL' />
                                <FormControlLabel value='7XL' control={<Radio />} label='7XL' />
                                <FormControlLabel value='Custom' control={<Radio />} label='Custom' />
                            </RadioGroup>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Nama :</Typography>
                            <TextField fullWidth size='small' value={nameset} onChange={(e) => setNameset(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Format Nama :</Typography>
                            <TextField fullWidth size='small' value={formatName} onChange={(e) => setFormatName(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={3}>
                        <Button variant='contained' size='medium' onClick={handleAddItem}>Input Data</Button>
                    </Grid>
                </Grid>
            </Box>

            {/* List Pesanan */}
            <Box
                sx={{
                    display: 'flex',
                    width: '80%',
                    height: '500',
                    borderRadius: 2,
                    boxShadow: 2,
                    flexDirection: 'column',
                    p: 3,
                    mt: 2,
                    mb: 2
                }}>
                <Typography variant='h6' sx={{
                    mb: 2,
                    fontWeight: 'bold',
                }}>List Pesanan</Typography>
                <TableExportToolbar title='List Pesanan' tableRef={tableRef} fileBaseName='list-pesanan' />
                <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 650 }} aria-label='daftar-pesanan' ref={tableRef}>
                        <TableHead>
                            <TableRow>
                                <TableCell>No</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell>Nama</TableCell>
                                <TableCell>Format Nama</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.map((it, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{it.size}</TableCell>
                                    <TableCell>{it.nama}</TableCell>
                                    <TableCell>{it.formatNama}</TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align='center'>Belum ada data</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* data transaksi */}
            <Box
                sx={{
                    display: 'flex',
                    width: '80%',
                    height: '500',
                    borderRadius: 2,
                    boxShadow: 2,
                    flexDirection: 'column',
                    p: 3,
                    mb: 2
                }}>
                <Typography variant='h6' sx={{
                    mb: 2,
                    fontWeight: 'bold',
                }}>Data Transaksi</Typography>
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Tipe Transaksi :</Typography>
                            <Select labelId='transaction' id='transaction' size='small' value={transaction} label='Tipe Transaksi' onChange={(e) => setTransaction(e.target.value)}>
                                <MenuItem value='dp'>DP</MenuItem>
                                <MenuItem value='pelunasan'>Pelunasan</MenuItem>
                                <MenuItem value='dpl'>DPL</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Nominal Transaksi:</Typography>
                            <TextField fullWidth size='small' value={nominal} onChange={(e) => setNominal(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={3}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Button
                                variant='contained'
                                size='medium'
                                component='label'
                            >
                                Bukti Transaksi
                                <input
                                    type='file'
                                    accept='image/*,application/pdf'
                                    hidden
                                    onChange={handleFileUpload}
                                />
                            </Button>
                        </Box>
                        {proof && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant='body2'>File berhasil diupload.</Typography>
                                {/* Untuk preview gambar jika file image */}
                                {proof.startsWith('data:image') && (
                                    <img src={proof} alt='Bukti Transaksi' style={{ maxWidth: 200, marginTop: 8, borderRadius: 8 }} />
                                )}
                            </Box>
                        )}
                    </Grid>
                    <Grid size={12}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                        }}>
                            <Button variant='contained' size='medium' onClick={handleSaveOrder}>Simpan Pesanan</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} variant='filled' sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default InputPesanan
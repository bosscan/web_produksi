import { Box, Button, Grid, Typography, Select, MenuItem } from '@mui/material'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InputDetail() {
    const navigate = useNavigate();

    const [application, setApplication] = useState('');
    const [bordir, setBordir] = useState('');
    const [sablon, setSablon] = useState('');
    const [jahitan, setJahitan] = useState('');
    const [hoodie, setHoodie] = useState('');
    const [cuttingButtom, setCuttingButtom] = useState('');
    const [sideSlit, setSideSlit] = useState('')
    const [neck, setNeck] = useState('')
    const [placard, setPlacard] = useState('')
    const [pocket, setPocket] = useState('')
    const [bottomPocket, setBottomPocket] = useState('')
    const [furingPocket, setFuringPocket] = useState('')
    const [armEnd, setArmEnd] = useState('')
    const [frontButton, setFrontButton] = useState('')

    const [options, setOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({})

    const getLabel = (key: string, value: string): string => {
        try {
            const arr = options[key] || [];
            const f = arr.find(o => o.value === value);
            return f?.label || value || '';
        } catch { return value || ''; }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [attrList, optList] = await Promise.all([
                    fetch('/api/dropdown/attributes').then(r => r.json()).catch(() => []),
                    fetch('/api/dropdown/options').then(r => r.json()).catch(() => []),
                ]);
                // Build map: key -> options[]
                const byAttrId = new Map<number, string>();
                (attrList || []).forEach((a: any) => byAttrId.set(a.id, a.key));
                const map: Record<string, Array<{ value: string; label: string }>> = {};
                (optList || []).forEach((o: any) => {
                    if (!o?.attribute) return;
                    const key = byAttrId.get(o.attribute);
                    if (!key || o.is_active === false) return;
                    const arr = map[key] || [];
                    arr.push({ value: o.value, label: o.label || o.value });
                    map[key] = arr;
                });
                setOptions(map);
            } catch {
                setOptions({});
            }
        };
        load();
    }, [])

    // Load previous selections if present
    useEffect(() => {
        try {
            const raw = localStorage.getItem('inputProdukForm');
            if (raw) {
                const d = JSON.parse(raw);
                setApplication(d.application || '');
                setBordir(d.bordir || '');
                setSablon(d.sablon || '');
                setJahitan(d.jahitan || '');
                setHoodie(d.hoodie || '');
                setCuttingButtom(d.cuttingButtom || '');
                setSideSlit(d.sideSlit || '');
                setNeck(d.neck || '');
                setPlacard(d.placard || '');
                setPocket(d.pocket || '');
                setBottomPocket(d.bottomPocket || '');
                setFuringPocket(d.furingPocket || '');
                setArmEnd(d.armEnd || '');
                setFrontButton(d.frontButton || '');
            }
        } catch {}
    }, []);

    // Persist on change
    useEffect(() => {
        try {
            const data = {
                application,
                bordir,
                sablon,
                jahitan,
                hoodie,
                cuttingButtom,
                sideSlit,
                neck,
                placard,
                pocket,
                bottomPocket,
                furingPocket,
                armEnd,
                frontButton,
                // Labels for print
                applicationLabel: getLabel('aplikasi', application),
                bordirLabel: getLabel('jenis_bordir', bordir),
                sablonLabel: getLabel('jenis_sablon', sablon),
                jahitanLabel: getLabel('jahitan', jahitan),
                hoodieLabel: getLabel('hoodie', hoodie),
                cuttingButtomLabel: getLabel('potongan_bawah', cuttingButtom),
                sideSlitLabel: getLabel('belahan_samping', sideSlit),
                neckLabel: getLabel('kerah', neck),
                placardLabel: getLabel('plaket', placard),
                pocketLabel: getLabel('saku', pocket),
                bottomPocketLabel: getLabel('saku_bawah', bottomPocket),
                furingPocketLabel: getLabel('saku_furing', furingPocket),
                armEndLabel: getLabel('ujung_lengan', armEnd),
                frontButtonLabel: getLabel('kancing_depan', frontButton),
            };
            localStorage.setItem('inputProdukForm', JSON.stringify(data));
        } catch {}
    }, [application, bordir, sablon, jahitan, hoodie, cuttingButtom, sideSlit, neck, placard, pocket, bottomPocket, furingPocket, armEnd, frontButton, options]);

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            alignItem: 'center',
            p: 3,
            boxSizing: 'border-box',
            flexDirection: 'column',
        }}>
            <Box sx={{
                width: '80%',
                height: '500',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                p: 3,
            }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Detail Produk</Typography>
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <Typography variant='body1' sx={{ mr: 9.9}}>Aplikasi :</Typography>
                            <Select labelId='product-select-label' size='small' value={application} onChange={(e) => setApplication(e.target.value)}>
                                <MenuItem value=''>Pilih Aplikasi</MenuItem>
                                {(options['aplikasi'] || [
                                    { value: 'aplikasi1', label: 'Aplikasi 1' },
                                    { value: 'aplikasi2', label: 'Aplikasi 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 7}}>Jenis Bordir :</Typography>
                            <Select labelId='sample-select-label' size='small' value={bordir} onChange={(e) => setBordir(e.target.value)}>
                                <MenuItem value=''>Pilih Bordir</MenuItem>
                                {(options['jenis_bordir'] || [
                                    { value: 'bordir1', label: 'Bordir 1' },
                                    { value: 'bordir2', label: 'Bordir 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 5.5}}>Jenis Sablon :</Typography>
                            <Select labelId='product-select-label' size='small' value={sablon} onChange={(e) => setSablon(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Sablon</MenuItem>
                                {(options['jenis_sablon'] || [
                                    { value: 'sablon1', label: 'Sablon 1' },
                                    { value: 'sablon2', label: 'Sablon 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 9.3}}>Jahitan :</Typography>
                            <Select labelId='product-select-label' size='small' value={jahitan} onChange={(e) => setJahitan(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Jahitan</MenuItem>
                                {(options['jahitan'] || [
                                    { value: 'jahitan1', label: 'Jahitan 1' },
                                    { value: 'jahitan2', label: 'Jahitan 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 11.4}}>Hoodie :</Typography>
                            <Select labelId='pattern-select-label' size='small' value={hoodie} onChange={(e) => setHoodie(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Hoodie</MenuItem>
                                {(options['hoodie'] || [
                                    { value: 'hoodie1', label: 'Hoodie 1' },
                                    { value: 'hoodie2', label: 'Hoodie 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 1.9}}>Potongan Bawah :</Typography>
                            <Select labelId='fabric-select-label' size='small' value={cuttingButtom} onChange={(e) => setCuttingButtom(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Potongan Bawah</MenuItem>
                                {(options['potongan_bawah'] || [
                                    { value: 'kain1', label: 'Potongan Bawah 1' },
                                    { value: 'kain2', label: 'Potongan Bawah 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 2.3}}>Belahan Samping :</Typography>
                            <Select labelId='fabric-select-label' size='small' value={sideSlit} onChange={(e) => setSideSlit(e.target.value)}>
                                <MenuItem value=''>Pilih Belahan Samping</MenuItem>
                                {(options['belahan_samping'] || [
                                    { value: 'kain1', label: 'Belahan Samping 1' },
                                    { value: 'kain2', label: 'Belahan Samping 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 12}}>Kerah :</Typography>
                            <Select labelId='product-select-label' size='small' value={neck} onChange={(e) => setNeck(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Kerah</MenuItem>
                                {(options['kerah'] || [
                                    { value: 'kerah1', label: 'Kerah 1' },
                                    { value: 'kerah2', label: 'Kerah 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 12.4}}>Plaket :</Typography>
                            <Select labelId='product-select-label' size='small' value={placard} onChange={(e) => setPlacard(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Plaket</MenuItem>
                                {(options['plaket'] || [
                                    { value: 'produk1', label: 'Plaket 1' },
                                    { value: 'produk2', label: 'Plaket 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 12.8}}>Saku :</Typography>
                            <Select labelId='product-select-label' size='small' value={pocket} onChange={(e) => setPocket(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Saku</MenuItem>
                                {(options['saku'] || [
                                    { value: 'produk1', label: 'Saku 1' },
                                    { value: 'produk2', label: 'Saku 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 7}}>Saku Bawah :</Typography>
                            <Select labelId='product-select-label' size='small' value={bottomPocket} onChange={(e) => setBottomPocket(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Saku Bawah</MenuItem>
                                {(options['saku_bawah'] || [
                                    { value: 'produk1', label: 'Saku Bawah 1' },
                                    { value: 'produk2', label: 'Saku Bawah 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 6.7}}>Saku Furing :</Typography>
                            <Select labelId='product-select-label' size='small' value={furingPocket} onChange={(e) => setFuringPocket(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Saku Furing</MenuItem>
                                {(options['saku_furing'] || [
                                    { value: 'produk1', label: 'Saku Furing 1' },
                                    { value: 'produk2', label: 'Saku Furing 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 5.7}}>Ujung Lengan :</Typography>
                            <Select labelId='product-select-label' size='small' value={armEnd} onChange={(e) => setArmEnd(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Ujung Lengan</MenuItem>
                                {(options['ujung_lengan'] || [
                                    { value: 'produk1', label: 'Ujung Lengan 1' },
                                    { value: 'produk2', label: 'Ujung Lengan 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
                            <Typography variant='body1' sx={{ mr: 3.7}}>Kancing Depan :</Typography>
                            <Select labelId='product-select-label' size='small' value={frontButton} onChange={(e) => setFrontButton(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Kancing Depan</MenuItem>
                                {(options['kancing_depan'] || [
                                    { value: 'produk1', label: 'Kancing Depan 1' },
                                    { value: 'produk2', label: 'Kancing Depan 2' },
                                ]).map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 2,
            }}>
                <Button variant='contained' size='medium' sx={{ mr: 65}} onClick={() => navigate('/market/input-desain/input-spesifikasi')}>Kembali</Button>
                <Button variant='contained' size='medium' onClick={() => navigate('/market/input-desain/input-tambahan')}>Selanjutnya</Button>
            </Box>
        </Box>
    )
}
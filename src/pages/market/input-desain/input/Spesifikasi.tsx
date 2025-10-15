import { Box, Button, Grid, Typography, TextField, Select, MenuItem } from '@mui/material'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function InputSpesifikasi() {
    const navigate = useNavigate();

    const [nameDesign, setNameDesign] = useState('');
    const [sample, setSample] = useState('');
    const [product, setProduct] = useState('');
    const [pattern, setPattern] = useState('');
    const [fabric, setFabric] = useState('');
    const [fabricColor, setFabricColor] = useState('')
    const [colorCombination, setColorCombination] = useState('')
    const [codeColor, setCodeColor] = useState('')

    // Load form data from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('inputDetailForm');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            setNameDesign(parsedData.nameDesign || '');
            setSample(parsedData.sample || '');
            setProduct(parsedData.product || '');
            setPattern(parsedData.pattern || '');
            setFabric(parsedData.fabric || '');
            setFabricColor(parsedData.fabricColor || '');
            setColorCombination(parsedData.colorCombination || '');
            setCodeColor(parsedData.codeColor || '');
        }
    }, []);

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        const formData = {
            nameDesign,
            sample,
            product,
            pattern,
            fabric,
            fabricColor,
            colorCombination,
            codeColor,
        };
        localStorage.setItem('inputDetailForm', JSON.stringify(formData));
    }, [nameDesign, sample, product, pattern, fabric, fabricColor, colorCombination, codeColor]);

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
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Spesifikasi Desain</Typography>
                <Grid container spacing={3}>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Nama Desain :</Typography>
                            <TextField fullWidth variant='outlined' size='small' value={nameDesign} onChange={(e) => setNameDesign(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}>
                            <Typography variant='body1' sx={{ mr: 5 }}>Sample :</Typography>
                            <Select labelId='sample-select-label' size='small' value={sample} onChange={(e) => setSample(e.target.value)}>
                                <MenuItem value=''>Pilih Sample</MenuItem>
                                <MenuItem value='sample1'>Sample 1</MenuItem>
                                <MenuItem value='sample2'>Sample 2</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}>
                            <Typography variant='body1' sx={{ mr: 2 }}>Jenis Produk :</Typography>
                            <Select labelId='product-select-label' size='small' value={product} onChange={(e) => setProduct(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Produk</MenuItem>
                                <MenuItem value='produk1'>Produk 1</MenuItem>
                                <MenuItem value='produk2'>Produk 2</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}>
                            <Typography variant='body1' sx={{ mr: 2.5 }}>Jenis Pola :</Typography>
                            <Select labelId='pattern-select-label' size='small' value={pattern} onChange={(e) => setPattern(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Pola</MenuItem>
                                <MenuItem value='pola1'>Pola 1</MenuItem>
                                <MenuItem value='pola2'>Pola 2</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                            }}>
                            <Typography variant='body1' sx={{ mr: 4.4 }}>Jenis Kain :</Typography>
                            <Select labelId='fabric-select-label' size='small' value={fabric} onChange={(e) => setFabric(e.target.value)}>
                                <MenuItem value=''>Pilih Jenis Kain</MenuItem>
                                <MenuItem value='kain1'>Kain 1</MenuItem>
                                <MenuItem value='kain2'>Kain 2</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}>
                            <Typography variant='body1' sx={{ mr: 1.7 }}>Warna Kain :</Typography>
                            <Select labelId='fabric-select-label' size='small' value={fabricColor} onChange={(e) => setFabricColor(e.target.value)}>
                                <MenuItem value=''>Pilih Warna Kain</MenuItem>
                                <MenuItem value='kain1'>Warna 1</MenuItem>
                                <MenuItem value='kain2'>Warna 2</MenuItem>
                            </Select>
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Kombinasi Warna Kain :</Typography>
                            <TextField fullWidth size='small' value={colorCombination} onChange={(e) => setColorCombination(e.target.value)} />
                        </Box>
                    </Grid>
                    <Grid size={6}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                            }}>
                            <Typography variant='body1' sx={{ mr: 1 }}>Kode Warna Kain :</Typography>
                            <TextField fullWidth size='small' value={codeColor} onChange={(e) => setCodeColor(e.target.value)} />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 2,
            }}>
                <Button variant='contained' size='medium' sx={{ mr: 65 }} onClick={() => navigate('/market/input-desain/antrian-input')}>Kembali</Button>
                <Button variant='contained' size='medium' onClick={() => navigate('/market/input-desain/input-detail')}>Selanjutnya</Button>
            </Box>
        </Box>
    )
}
import { Box, TextField, Typography, Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FotoProduk() {
    const navigate = useNavigate()
    const [search] = useState("")

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
                display: 'flex',
                borderRadius: 2,
                boxShadow: 2,
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                mb: 3
            }}>
                <Typography variant="h6" fontWeight={700}>Divisi Foto Produk</Typography>
                <TextField
                required
                id='lembar-foto-produk'
                label='Masukkan ID SPK'
                value={search}
                sx={{
                    mt: 2
                }}></TextField>
                <Button sx={{mt: 2}} variant='contained' color='primary' onClick={() => navigate('/method/update-divisi/foto-produk/detail-lembar-kerja')}>
                    Kerjakan
                </Button>
            </Box>

        </Box>);
}
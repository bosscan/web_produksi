import { Box, Typography, TextField, Button, Alert, Paper, Stack, FormControlLabel, Checkbox, Link, InputAdornment } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const users =
    { username: 'admin', password: 'admin123' }

  // restore remembered username
  useState(() => {
    const saved = localStorage.getItem('remember_username');
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }
  });

  const handleLogin = (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // tiny delay for UX
    setTimeout(() => {
      if (username === users.username && password === users.password) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('current_cs', username || 'CS');
        if (remember) localStorage.setItem('remember_username', username);
        else localStorage.removeItem('remember_username');
        navigate('/');
      } else {
        setError('Invalid Username or Password. Try Again');
        setLoading(false);
      }
    }, 450);
  }

  // simple login page (plain)

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)'}}>
      {/* decorative blobs */}
      <Box sx={{ position: 'absolute', top: -80, left: -80, width: 240, height: 240, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', filter: 'blur(40px)' }} />
      <Box sx={{ position: 'absolute', bottom: -100, right: -80, width: 300, height: 300, bgcolor: 'rgba(255,255,255,0.18)', borderRadius: '50%', filter: 'blur(50px)' }} />

      <Box component='form' onSubmit={handleLogin} sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <Paper elevation={6} sx={{ p: 4, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)' }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'center', mb: 1 }}>
              <Box component="img" src="/vite.svg" alt="logo" sx={{ height: 32 }} />
              <Typography variant="h6" fontWeight={800} color="#0d47a1">ERP Sakura Konveksi</Typography>
            </Box>
            <Typography variant="subtitle2" align="center" color="text.secondary">Masuk ke Akun</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required fullWidth autoComplete="username" />
            <TextField label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth autoComplete="current-password"
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <Button size="small" onClick={() => setShowPassword((v) => !v)} sx={{ minWidth: 0, px: 1 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputAdornment>
              ) }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label="Ingat saya" />
              <Link component="button" type="button" underline="hover" sx={{ fontSize: 12, color: 'primary.main' }} onClick={() => alert('Hubungi admin untuk reset sandi.')}>Lupa password?</Link>
            </Box>
            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{
              py: 1.25,
              fontWeight: 700,
              background: loading ? undefined : 'linear-gradient(90deg,#1565c0,#1e88e5)',
            }}>
              {loading ? 'Memproses…' : 'Login'}
            </Button>
          </Stack>
        </Paper>
        <Typography variant="caption" display="block" align="center" sx={{ mt: 2, color: 'rgba(255,255,255,0.9)' }}>
          © {new Date().getFullYear()} Sakura Konveksi
        </Typography>
      </Box>
    </Box>
  );
}

export default Login;

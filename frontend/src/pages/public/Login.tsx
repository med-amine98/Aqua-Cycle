import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { WaterDrop } from '@mui/icons-material';
import { useAuthStore, User } from '../../store/authStore';
import { authService } from '../../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(email, password);
      const { access_token, user_id, role, is_premium } = data;
      
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      
      const userData: User = {
        id: user_id,
        email: email,
        full_name: email.split('@')[0],
        phone: '',
        role: role,
        is_premium: is_premium || false
      };
      
      setUser(userData);
      navigate('/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
        <Box textAlign="center" mb={3}>
          <WaterDrop sx={{ fontSize: 48, color: '#0A8F5C' }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0A8F5C' }}>
            AquaCycle
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Connectez-vous à votre compte
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                bgcolor: '#0A8F5C',
                py: 1.5,
                '&:hover': { bgcolor: '#06683F' },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Se connecter'}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: '#0A8F5C', textDecoration: 'none', fontWeight: 600 }}>
              S'inscrire
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
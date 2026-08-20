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
  MenuItem,
  CircularProgress,
  Stack,
} from '@mui/material';
import { WaterDrop } from '@mui/icons-material';
import { authService } from '../../services/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'farmer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.registerSimple(formData);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur d\'inscription');
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
            Créer un compte
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Nom complet"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              fullWidth
              select
              label="Type de compte"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <MenuItem value="farmer">👨‍🌾 Agriculteur</MenuItem>
              <MenuItem value="company">🏢 Entreprise</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              helperText="Minimum 6 caractères"
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
              {loading ? <CircularProgress size={24} /> : 'S\'inscrire'}
            </Button>
          </Stack>
        </form>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: '#0A8F5C', textDecoration: 'none', fontWeight: 600 }}>
              Se connecter
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
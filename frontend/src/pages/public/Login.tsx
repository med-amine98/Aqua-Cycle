import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
  IconButton,
  Avatar,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  WaterDrop,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  ArrowForward,
  CheckCircle,
  AutoAwesome,
  Agriculture,
  Business,
  Security,
} from '@mui/icons-material';
import { useAuthStore, User } from '../../store/authStore';
import { authService } from '../../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        is_premium: is_premium || false,
      };

      setUser(userData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <Grid container sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Left Column: Branding Showcase */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          background: 'linear-gradient(135deg, #064E3B 0%, #0A8F5C 50%, #0284C7 100%)',
          color: 'white',
          p: { xs: 4, md: 8 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justify: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={4}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', width: 48, height: 48, backdropFilter: 'blur(10px)' }}>
              <WaterDrop sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              AquaCycle
            </Typography>
          </Box>

          <Chip
            icon={<AutoAwesome sx={{ color: '#FDE047 !important' }} />}
            label="Plateforme IA de Bio-Économie & Gestion de l'Eau"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: 'white', fontWeight: 700, mb: 3, backdropFilter: 'blur(8px)' }}
          />

          <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 3, letterSpacing: '-0.02em' }}>
            Pilotez votre exploitation avec intelligence et durabilité.
          </Typography>

          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.1rem', maxWidth: 520, mb: 5 }}>
            Optimisez vos irrigations par IA, détectez les maladies par vision par ordinateur et valorisez vos déchets sur notre marketplace circulaire.
          </Typography>

          <Stack spacing={2.5}>
            {[
              { icon: <CheckCircle sx={{ color: '#34D399' }} />, text: 'Économie d’eau jusqu’à 40% grâce aux prédictions météo & sol' },
              { icon: <CheckCircle sx={{ color: '#34D399' }} />, text: 'Détection IA précoce des pathologies végétales et animales' },
              { icon: <CheckCircle sx={{ color: '#34D399' }} />, text: 'Chaîne logistique directe et monétisation des coproduits' },
            ].map((item, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={2}>
                {item.icon}
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ position: 'relative', zIndex: 2, pt: 4 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            © {new Date().getFullYear()} AquaCycle Inc. Développé pour une agriculture intelligente et responsable.
          </Typography>
        </Box>
      </Grid>

      {/* Right Column: Login Form */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, sm: 5 },
            maxWidth: 480,
            width: '100%',
            borderRadius: 4,
            bgcolor: 'white',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.07)',
          }}
        >
          <Box mb={4} textAlign={{ xs: 'center', sm: 'left' }}>
            <Box display={{ xs: 'flex', sm: 'none' }} justifyContent="center" mb={2}>
              <Avatar sx={{ bgcolor: '#0A8F5C', width: 48, height: 48 }}>
                <WaterDrop />
              </Avatar>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Connexion
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Accédez à votre tableau de bord AquaCycle
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Adresse Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="agriculteur@aquacycle.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={!loading && <ArrowForward />}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  boxShadow: '0 6px 20px rgba(10, 143, 92, 0.3)',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Se Connecter'}
              </Button>
            </Stack>
          </form>

          {/* Quick Demo Pre-fill */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #F1F5F9' }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }} display="block" mb={1.5}>
              COMPTES DE DÉMONSTRATION RAPIDE :
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<Agriculture />}
                onClick={() => handleDemoLogin('farmer@aquacycle.com', 'farmer')}
                sx={{ borderRadius: 2.5, textTransform: 'none', py: 0.8, fontSize: '0.82rem' }}
              >
                👨‍🌾 Agriculteur
              </Button>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<Business />}
                onClick={() => handleDemoLogin('buyer@aquacycle.com', 'company')}
                sx={{ borderRadius: 2.5, textTransform: 'none', py: 0.8, fontSize: '0.82rem' }}
              >
                🏢 Entreprise
              </Button>
            </Stack>
          </Box>

          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              Pas encore de compte ?{' '}
              <Link to="/register" style={{ color: '#0A8F5C', textDecoration: 'none', fontWeight: 700 }}>
                Créer un compte gratuitement
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Login;
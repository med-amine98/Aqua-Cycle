import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  MenuItem,
  CircularProgress,
  Stack,
  InputAdornment,
  IconButton,
  Avatar,
  Chip,
  Grid,
} from '@mui/material';
import {
  WaterDrop,
  Email,
  Lock,
  Person,
  Phone,
  Visibility,
  VisibilityOff,
  ArrowForward,
  CheckCircle,
  AutoAwesome,
  Agriculture,
  Business,
} from '@mui/icons-material';
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
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err.response?.data?.detail || err.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
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
            label="Rejoignez le Réseau Agricole Intelligente"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.15)', color: 'white', fontWeight: 700, mb: 3, backdropFilter: 'blur(8px)' }}
          />

          <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 3, letterSpacing: '-0.02em' }}>
            Créez votre compte et transformez vos ressources.
          </Typography>

          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.1rem', maxWidth: 520, mb: 5 }}>
            Que vous soyez agriculteur ou industriel partenaire, accédez instantanément à nos outils prédictifs et à notre marché de coproduits.
          </Typography>

          <Stack spacing={2.5}>
            {[
              { icon: <CheckCircle sx={{ color: '#34D399' }} />, text: 'Compte 100% gratuit avec accès aux analyses de base' },
              { icon: <CheckCircle sx={{ color: '#34D399' }} />, text: 'Recommandations d’irrigation personnalisées selon vos parcelles' },
              { icon: <CheckCircle sx={{ color: '#34D399' }} />, text: 'Mise en relation directe sans intermédiaire sur le marché' },
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
            © {new Date().getFullYear()} AquaCycle Inc. Tous droits réservés.
          </Typography>
        </Box>
      </Grid>

      {/* Right Column: Register Form */}
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
            maxWidth: 500,
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
              Créer un Compte
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Inscrivez-vous en moins de 2 minutes
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
                label="Nom Complet"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                placeholder="Ex: Mohamed Ben Ali"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Adresse Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="exemple@domaine.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Numéro de Téléphone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+216 20 123 456"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Type de Compte"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <MenuItem value="farmer">👨‍🌾 Agriculteur</MenuItem>
                    <MenuItem value="company">🏢 Entreprise Acheteuse</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                helperText="Au moins 6 caractères"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Créer mon compte'}
              </Button>
            </Stack>
          </form>

          <Box mt={4} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" style={{ color: '#0A8F5C', textDecoration: 'none', fontWeight: 700 }}>
                Se connecter
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Register;
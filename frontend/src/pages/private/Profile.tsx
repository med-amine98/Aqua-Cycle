import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Agriculture,
  Edit,
  Save,
  Cancel,
  Badge,
  CheckCircle,
  Verified,
  PhotoCamera,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  farm_name?: string;
  farm_type?: string;
}

const Profile: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    location: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/me');
      setProfile(response.data);
      setFormData({
        full_name: response.data.full_name || '',
        phone: response.data.phone || '',
        bio: response.data.bio || '',
        location: response.data.location || '',
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      setError('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.put('/auth/profile', formData);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
      await loadProfile();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.new_password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setSuccess(true);
      setPasswordDialog(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'farmer': return '👨‍🌾 Agriculteur';
      case 'company': return '🏢 Entreprise';
      case 'admin': return '👑 Administrateur';
      default: return '👤 Utilisateur';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Chargement de votre profil...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332', mb: 4 }}>
        👤 Mon Profil
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
          ✅ Profil mis à jour avec succès !
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Carte de profil - gauche */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0A8F5C 0%, #06683F 100%)',
                p: 3,
                textAlign: 'center',
                color: 'white',
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    border: '4px solid white',
                    mx: 'auto',
                    bgcolor: 'white',
                    color: '#0A8F5C',
                    fontSize: 48,
                  }}
                >
                  {getInitials(profile?.full_name || '')}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'white',
                    '&:hover': { bgcolor: '#f5f5f5' },
                  }}
                  size="small"
                >
                  <PhotoCamera sx={{ fontSize: 20, color: '#0A8F5C' }} />
                </IconButton>
              </Box>
              <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                {profile?.full_name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {getRoleLabel(profile?.role || '')}
              </Typography>
              <Box mt={1}>
                {profile?.is_premium && (
                  <Chip
                    icon={<Verified />}
                    label="Premium"
                    size="small"
                    sx={{ bgcolor: 'rgba(255,215,0,0.2)', color: '#FFD700' }}
                  />
                )}
                {profile?.is_active && (
                  <Chip
                    icon={<CheckCircle />}
                    label="Actif"
                    size="small"
                    sx={{ bgcolor: 'rgba(76,175,80,0.2)', color: '#4CAF50', ml: 1 }}
                  />
                )}
              </Box>
            </Box>
            <CardContent>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Email sx={{ color: '#4A5A6E' }} />
                  <Typography variant="body2">{profile?.email}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Phone sx={{ color: '#4A5A6E' }} />
                  <Typography variant="body2">{profile?.phone || 'Non renseigné'}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarToday sx={{ color: '#4A5A6E' }} />
                  <Typography variant="body2">
                    Membre depuis {new Date(profile?.created_at || '').toLocaleDateString()}
                  </Typography>
                </Box>
                {profile?.location && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn sx={{ color: '#4A5A6E' }} />
                    <Typography variant="body2">{profile.location}</Typography>
                  </Box>
                )}
                <Divider />
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setPasswordDialog(true)}
                  sx={{ borderRadius: 10 }}
                >
                  Changer le mot de passe
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Édition du profil - droite */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Informations personnelles
                </Typography>
                <Box>
                  {editing ? (
                    <>
                      <Button
                        startIcon={<Cancel />}
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            full_name: profile?.full_name || '',
                            phone: profile?.phone || '',
                            bio: profile?.bio || '',
                            location: profile?.location || '',
                          });
                        }}
                        sx={{ mr: 1 }}
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        sx={{ bgcolor: '#0A8F5C' }}
                      >
                        Enregistrer
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => setEditing(true)}
                    >
                      Modifier
                    </Button>
                  )}
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom complet"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Localisation"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!editing}
                    placeholder="Ville, région, pays"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!editing}
                    placeholder="Parlez-nous de vous, de votre exploitation..."
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Statistiques
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F7FA' }}>
                    <Agriculture sx={{ color: '#0A8F5C' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {profile?.farm_name ? '✅' : '❌'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Ferme
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F7FA' }}>
                    <Badge sx={{ color: '#ED6C02' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {profile?.is_premium ? '⭐' : '💠'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Statut
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F7FA' }}>
                    <CheckCircle sx={{ color: '#2E7D32' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {profile?.is_active ? '✅' : '❌'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Actif
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#F5F7FA' }}>
                    <Person sx={{ color: '#1A6EB5' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {profile?.role || '—'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Rôle
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog Changer mot de passe */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Changer le mot de passe</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                type="password"
                label="Mot de passe actuel"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              />
              <TextField
                fullWidth
                type="password"
                label="Nouveau mot de passe"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                helperText="Minimum 6 caractères"
              />
              <TextField
                fullWidth
                type="password"
                label="Confirmer le nouveau mot de passe"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Annuler</Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            sx={{ bgcolor: '#0A8F5C' }}
          >
            Changer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
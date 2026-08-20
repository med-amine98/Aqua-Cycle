import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  Divider,
  Alert,
  LinearProgress,
  Slider,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  DarkMode,
  Language,
  VolumeUp,
  Vibration,
  Security,
  Delete,
  Save,
  RestartAlt,
  DataUsage,
  Email,
  Phone,
  PushPin,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

interface SettingsData {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    weather_alerts: boolean;
    crop_alerts: boolean;
  };
  appearance: {
    dark_mode: boolean;
    language: string;
    compact_view: boolean;
    animations: boolean;
  };
  privacy: {
    profile_visibility: string;
    share_data: boolean;
    analytics: boolean;
  };
  preferences: {
    default_view: string;
    measurement_unit: string;
    date_format: string;
    notification_volume: number;
  };
}

const Settings: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      weather_alerts: true,
      crop_alerts: true,
    },
    appearance: {
      dark_mode: false,
      language: 'fr',
      compact_view: false,
      animations: true,
    },
    privacy: {
      profile_visibility: 'public',
      share_data: false,
      analytics: true,
    },
    preferences: {
      default_view: 'dashboard',
      measurement_unit: 'metric',
      date_format: 'DD/MM/YYYY',
      notification_volume: 50,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Simuler le chargement des paramètres (à remplacer par un vrai appel API)
      // const response = await api.get('/settings');
      // if (response.data) setSettings(response.data);
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      setError('Impossible de charger les paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // await api.put('/settings', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      // await api.post('/settings/reset');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResetDialog(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadSettings();
    } catch (error) {
      setError('Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
  };

  const handleAppearanceChange = (key: keyof typeof settings.appearance, value: any) => {
    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Chargement des paramètres...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332' }}>
          ⚙️ Paramètres
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RestartAlt />}
            onClick={() => setResetDialog(true)}
            color="error"
            sx={{ mr: 1 }}
          >
            Réinitialiser
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            sx={{ bgcolor: '#0A8F5C' }}
          >
            Enregistrer
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
          ✅ Paramètres enregistrés avec succès !
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications sx={{ color: '#1A6EB5' }} />
                Notifications
              </Typography>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={() => handleNotificationChange('email')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Email</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Recevoir des notifications par email
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.push}
                      onChange={() => handleNotificationChange('push')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Push</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Notifications push sur mobile
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.sms}
                      onChange={() => handleNotificationChange('sms')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>SMS</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Alertes par SMS
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.weather_alerts}
                      onChange={() => handleNotificationChange('weather_alerts')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Alertes météo</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Prévisions et alertes météo
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.crop_alerts}
                      onChange={() => handleNotificationChange('crop_alerts')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Alertes cultures</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Recommandations et alertes pour vos cultures
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.marketing}
                      onChange={() => handleNotificationChange('marketing')}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Marketing</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Offres et actualités AquaCycle
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Apparence */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DarkMode sx={{ color: '#ED6C02' }} />
                Apparence
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.dark_mode}
                      onChange={(e) => handleAppearanceChange('dark_mode', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Mode sombre"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.compact_view}
                      onChange={(e) => handleAppearanceChange('compact_view', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Vue compacte"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.animations}
                      onChange={(e) => handleAppearanceChange('animations', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Animations"
                />
                <TextField
                  select
                  fullWidth
                  label="Langue"
                  value={settings.appearance.language}
                  onChange={(e) => handleAppearanceChange('language', e.target.value)}
                  size="small"
                >
                  <MenuItem value="fr">🇫🇷 Français</MenuItem>
                  <MenuItem value="en">🇬🇧 English</MenuItem>
                  <MenuItem value="ar">🇹🇳 العربية</MenuItem>
                </TextField>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Confidentialité */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security sx={{ color: '#2E7D32' }} />
                Confidentialité
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Visibilité du profil"
                  value={settings.privacy.profile_visibility}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, profile_visibility: e.target.value }
                  })}
                  size="small"
                >
                  <MenuItem value="public">🌍 Public</MenuItem>
                  <MenuItem value="private">🔒 Privé</MenuItem>
                  <MenuItem value="contacts">👥 Contacts uniquement</MenuItem>
                </TextField>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.share_data}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, share_data: e.target.checked }
                      })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Partager les données</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Partager vos données avec la communauté
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.analytics}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, analytics: e.target.checked }
                      })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Analytics</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Contribuer à l'amélioration de la plateforme
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Préférences */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DataUsage sx={{ color: '#ED6C02' }} />
                Préférences
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Vue par défaut"
                  value={settings.preferences.default_view}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, default_view: e.target.value }
                  })}
                  size="small"
                >
                  <MenuItem value="dashboard">📊 Tableau de bord</MenuItem>
                  <MenuItem value="water">💧 Gestion de l'eau</MenuItem>
                  <MenuItem value="farms">🌾 Mes fermes</MenuItem>
                  <MenuItem value="animals">🐄 Élevage</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Unité de mesure"
                  value={settings.preferences.measurement_unit}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, measurement_unit: e.target.value }
                  })}
                  size="small"
                >
                  <MenuItem value="metric">📏 Métrique</MenuItem>
                  <MenuItem value="imperial">📐 Impérial</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Format de date"
                  value={settings.preferences.date_format}
                  onChange={(e) => setSettings({
                    ...settings,
                    preferences: { ...settings.preferences, date_format: e.target.value }
                  })}
                  size="small"
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </TextField>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Volume des notifications
                  </Typography>
                  <Slider
                    value={settings.preferences.notification_volume}
                    onChange={(e, value) => setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, notification_volume: value as number }
                    })}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog Réinitialisation */}
      <Dialog open={resetDialog} onClose={() => setResetDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>⚠️ Réinitialiser les paramètres</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            Êtes-vous sûr de vouloir réinitialiser tous vos paramètres ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog(false)}>Annuler</Button>
          <Button
            onClick={handleReset}
            variant="contained"
            color="error"
          >
            Réinitialiser
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
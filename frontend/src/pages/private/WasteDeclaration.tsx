import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  Grid,
  Alert,
  LinearProgress,
  Paper,
  Stack,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Recycling,
  Add,
  CheckCircle,
  AutoAwesome,
  LocationOn,
  AttachMoney,
  DateRange,
  TrendingUp,
} from '@mui/icons-material';
import { wasteService } from '../../services/api';

interface WasteFormData {
  waste_type: string;
  quantity: number;
  availability_date: string;
  location: string;
  latitude: number;
  longitude: number;
  quality_grade: string;
  description: string;
  price_per_unit: number;
}

const WasteDeclaration: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<WasteFormData>({
    defaultValues: {
      waste_type: 'olive_pomace',
      quality_grade: 'medium',
      quantity: 10,
      latitude: 34.74,
      longitude: 10.76,
      price_per_unit: 45,
      location: 'Sfax, Tunisie',
      availability_date: new Date().toISOString().split('T')[0],
      description: 'Grignons d\'olive frais issus de la campagne d\'extraction récente.',
    },
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchQuantity = watch('quantity') || 0;
  const watchPrice = watch('price_per_unit') || 0;
  const estimatedRevenue = watchQuantity * watchPrice;

  const onSubmit = async (data: WasteFormData) => {
    setLoading(true);
    setError(null);

    try {
      if (!data.waste_type || !data.availability_date || !data.location) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      await wasteService.declareWaste(data);
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la déclaration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      {/* Top Banner Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #064E3B 0%, #0A8F5C 60%, #0284C7 100%)',
          color: 'white',
          boxShadow: '0 10px 30px -5px rgba(10, 143, 92, 0.25)',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', width: 48, height: 48 }}>
            <Recycling sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              Déclarer des Gissements & Déchets Agricoles
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.5 }}>
              Monétisez vos résidus (grignons, noyaux, élagages) et connectez-vous aux filières de biomasse et compostage.
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Card sx={{ borderRadius: 4, bgcolor: 'white' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {success && (
            <Alert severity="success" icon={<CheckCircle fontSize="inherit" />} sx={{ mb: 3, borderRadius: 3 }}>
              ✅ Déclaration enregistrée avec succès ! Votre gisement est maintenant visible sur le Marché des Déchets.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome sx={{ color: '#0A8F5C' }} />
                1. Caractéristiques du Gisement Organique
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Type de Déchet *"
                    {...register('waste_type', { required: true })}
                  >
                    <MenuItem value="olive_pomace">🫒 Grignon d'olive</MenuItem>
                    <MenuItem value="olive_pits">🫒 Noyaux d'olive</MenuItem>
                    <MenuItem value="crop_residues">🌾 Résidus de culture (Paille, Cannes)</MenuItem>
                    <MenuItem value="pruning_residues">✂️ Résidus de taille (Élagage, Sarments)</MenuItem>
                    <MenuItem value="date_residues">🌴 Résidus de dattes (Palmes, Grattes)</MenuItem>
                    <MenuItem value="vine_residues">🍇 Résidus de vigne</MenuItem>
                    <MenuItem value="other">📦 Autre déchet organique</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Grade de Qualité *"
                    {...register('quality_grade', { required: true })}
                  >
                    <MenuItem value="high">⭐ Supérieur (Sec, Propre, Trié)</MenuItem>
                    <MenuItem value="medium">👍 Standard (Qualité moyenne)</MenuItem>
                    <MenuItem value="low">⚠️ Brut / Humide</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantité Estimée (Tonnes) *"
                    {...register('quantity', { required: true, min: 0.1, valueAsNumber: true })}
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Prix Souhaité (TND / Tonne)"
                    {...register('price_per_unit', { valueAsNumber: true })}
                    inputProps={{ step: 0.5 }}
                    helperText="Laisser 0 si don ou prix à négocier"
                  />
                </Grid>
              </Grid>

              {/* Estimated Revenue Box */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#F0FDF4', borderRadius: 3, border: '1px solid #BBF7D0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <TrendingUp sx={{ color: '#0A8F5C' }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#065F46' }}>
                      Valeur Estimée Potentielle du Lot :
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#065F46' }}>
                    {estimatedRevenue.toLocaleString()} TND
                  </Typography>
                </Box>
              </Paper>

              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
                <LocationOn sx={{ color: '#0284C7' }} />
                2. Localisation & Disponibilité
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Localisation (Ville, Gouvernorat) *"
                    {...register('location', { required: true })}
                    placeholder="Ex: Sfax, Tunisie"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date de Disponibilité *"
                    InputLabelProps={{ shrink: true }}
                    {...register('availability_date', { required: true })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Latitude GPS"
                    inputProps={{ step: 0.0001 }}
                    {...register('latitude', { valueAsNumber: true })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Longitude GPS"
                    inputProps={{ step: 0.0001 }}
                    {...register('longitude', { valueAsNumber: true })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description & Conditions d'accès au stockage"
                {...register('description')}
                placeholder="Précisez l'accessibilité aux camions, l'humidité du lot, le type de stockage (couvert, silos)..."
              />

              {loading && <LinearProgress sx={{ borderRadius: 2 }} />}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<Add />}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 700,
                  boxShadow: '0 6px 20px rgba(10, 143, 92, 0.3)',
                }}
              >
                {loading ? 'Enregistrement...' : 'Publier le Gisement'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WasteDeclaration;
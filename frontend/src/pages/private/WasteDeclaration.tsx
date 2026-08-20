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
} from '@mui/material';
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
  const { register, handleSubmit, formState: { errors }, reset } = useForm<WasteFormData>({
    defaultValues: {
      waste_type: 'olive_pomace',    // Valeur par défaut
      quality_grade: 'medium',        // Valeur par défaut
      quantity: 0,
      latitude: 0,
      longitude: 0,
    }
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: WasteFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier que les données sont valides
      if (!data.waste_type || !data.availability_date || !data.location) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }
      
      await wasteService.declareWaste(data);
      setSuccess(true);
      reset({
        waste_type: 'olive_pomace',
        quality_grade: 'medium',
        quantity: 0,
        latitude: 0,
        longitude: 0,
        availability_date: '',
        location: '',
        description: '',
        price_per_unit: 0,
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la déclaration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1A2332' }}>
        ♻️ Déclarer des déchets agricoles
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Transformez vos déchets en opportunités économiques. Remplissez ce formulaire 
        pour mettre vos résidus agricoles en valeur.
      </Typography>

      <Card>
        <CardContent>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Déclaration enregistrée avec succès ! Nous recherchons des entreprises 
              intéressées pour valoriser vos déchets.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Type de déchet"
                  {...register('waste_type', { required: 'Ce champ est requis' })}
                  error={!!errors.waste_type}
                  helperText={errors.waste_type?.message}
                  defaultValue="olive_pomace"
                >
                  <MenuItem value="olive_pomace">🫒 Grignon d'olive</MenuItem>
                  <MenuItem value="olive_pits">🫒 Noyaux d'olive</MenuItem>
                  <MenuItem value="pruning_residues">✂️ Résidus de taille</MenuItem>
                  <MenuItem value="crop_residues">🌾 Résidus de culture</MenuItem>
                  <MenuItem value="date_residues">🌴 Résidus de dattes</MenuItem>
                  <MenuItem value="vine_residues">🍇 Résidus de vigne</MenuItem>
                  <MenuItem value="other">📦 Autre</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantité (tonnes)"
                  {...register('quantity', { 
                    required: 'Ce champ est requis',
                    min: { value: 0.1, message: 'Quantité minimale : 0.1 tonne' }
                  })}
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message}
                  inputProps={{ step: "0.1", min: "0.1" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de disponibilité"
                  {...register('availability_date', { required: 'Ce champ est requis' })}
                  error={!!errors.availability_date}
                  helperText={errors.availability_date?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Qualité"
                  {...register('quality_grade')}
                  defaultValue="medium"
                >
                  <MenuItem value="high">⭐ Haute</MenuItem>
                  <MenuItem value="medium">⭐ Moyenne</MenuItem>
                  <MenuItem value="low">⭐ Basse</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresse / Localisation"
                  {...register('location', { required: 'Ce champ est requis' })}
                  error={!!errors.location}
                  helperText={errors.location?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Latitude"
                  {...register('latitude', { 
                    required: 'Ce champ est requis',
                    min: { value: -90, message: 'Latitude invalide' },
                    max: { value: 90, message: 'Latitude invalide' }
                  })}
                  error={!!errors.latitude}
                  helperText={errors.latitude?.message}
                  inputProps={{ step: "0.000001" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Longitude"
                  {...register('longitude', { 
                    required: 'Ce champ est requis',
                    min: { value: -180, message: 'Longitude invalide' },
                    max: { value: 180, message: 'Longitude invalide' }
                  })}
                  error={!!errors.longitude}
                  helperText={errors.longitude?.message}
                  inputProps={{ step: "0.000001" }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  {...register('description')}
                  placeholder="Décrivez vos déchets, leur composition, etc."
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prix unitaire (TND/tonne)"
                  {...register('price_per_unit')}
                  placeholder="Laissez vide pour un prix de marché"
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  size="large"
                  sx={{
                    bgcolor: '#0A8F5C',
                    '&:hover': { bgcolor: '#06683F' },
                  }}
                >
                  {loading ? <LinearProgress sx={{ width: '100%' }} /> : '♻️ Déclarer les déchets'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WasteDeclaration;
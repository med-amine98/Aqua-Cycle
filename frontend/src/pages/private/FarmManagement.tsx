import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  IconButton,
  Chip,
  LinearProgress,
  Paper,
  Fade,
  Grow,
  Zoom,
  Stack,
  Avatar,
  Divider,
  Tooltip,
  CardActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Agriculture,
  LocationOn,
  WaterDrop,
  MyLocation,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { farmService } from '../../services/farmService';
import LocationPicker from '../../components/LocationPicker';

interface Farm {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  total_area: number;
  soil_type: string;
  irrigation_system: string;
  water_availability: number;
  owner_id: string;
  created_at: string;
}

const FarmManagement: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    latitude: 0,
    longitude: 0,
    total_area: 0,
    soil_type: 'loameux',
    irrigation_system: 'goutte-à-goutte',
    water_availability: 0,
  });
  const [error, setError] = useState('');
  const [animateCards, setAnimateCards] = useState(false);

  const soilTypes = [
    { value: 'argileux', label: '🧱 Argileux' },
    { value: 'sableux', label: '🏖️ Sableux' },
    { value: 'limoneux', label: '🌾 Limoneux' },
    { value: 'loameux', label: '🌱 Loameux' },
    { value: 'calcaire', label: '🪨 Calcaire' },
    { value: 'tourbeux', label: '🌿 Tourbeux' },
  ];

  const irrigationSystems = [
    { value: 'goutte-à-goutte', label: '💧 Goutte-à-goutte' },
    { value: 'aspersion', label: '💦 Aspersion' },
    { value: 'gravitaire', label: '🌊 Gravitaire' },
    { value: 'subsurface', label: '🔽 Subsurface' },
    { value: 'manuel', label: '🪣 Manuel' },
  ];

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    setLoading(true);
    try {
      const response = await farmService.getFarms();
      const farmsData = Array.isArray(response) ? response : response?.data || [];
      setFarms(farmsData);
      setTimeout(() => setAnimateCards(true), 300);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (farm?: Farm) => {
    if (farm) {
      setEditingFarm(farm);
      setFormData({
        name: farm.name,
        location: farm.location,
        latitude: farm.latitude,
        longitude: farm.longitude,
        total_area: farm.total_area,
        soil_type: farm.soil_type,
        irrigation_system: farm.irrigation_system,
        water_availability: farm.water_availability,
      });
    } else {
      setEditingFarm(null);
      setFormData({
        name: '',
        location: '',
        latitude: 0,
        longitude: 0,
        total_area: 0,
        soil_type: 'loameux',
        irrigation_system: 'goutte-à-goutte',
        water_availability: 0,
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFarm(null);
    setFormData({
      name: '',
      location: '',
      latitude: 0,
      longitude: 0,
      total_area: 0,
      soil_type: 'loameux',
      irrigation_system: 'goutte-à-goutte',
      water_availability: 0,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingFarm) {
        await farmService.updateFarm(editingFarm.id, formData);
      } else {
        await farmService.createFarm(formData);
      }
      handleCloseDialog();
      loadFarms();
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error?.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ferme ?')) {
      try {
        await farmService.deleteFarm(id);
        loadFarms();
      } catch (error) {
        console.error('Erreur de suppression:', error);
      }
    }
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng,
      location: address || formData.location,
    });
  };

  const getSoilIcon = (soil: string) => {
    const icons: Record<string, string> = {
      argileux: '🧱',
      sableux: '🏖️',
      limoneux: '🌾',
      loameux: '🌱',
      calcaire: '🪨',
      tourbeux: '🌿',
    };
    return icons[soil] || '🌍';
  };

  const getIrrigationIcon = (system: string) => {
    const icons: Record<string, string> = {
      'goutte-à-goutte': '💧',
      aspersion: '💦',
      gravitaire: '🌊',
      subsurface: '🔽',
      manuel: '🪣',
    };
    return icons[system] || '💧';
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
        <Typography align="center" sx={{ mt: 3, color: '#4A5A6E' }}>
          🌾 Chargement de vos fermes...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Agriculture sx={{ color: '#0A8F5C', fontSize: 32 }} />
            Mes Fermes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {farms.length} exploitation(s) agricole(s)
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadFarms}
            sx={{ borderRadius: 10 }}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
          >
            Ajouter une ferme
          </Button>
        </Box>
      </Box>

      {/* Liste des fermes */}
      {farms.length === 0 ? (
        <Fade in={true}>
          <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Agriculture sx={{ fontSize: 80, color: '#ccc' }} />
              <Typography variant="h5" color="textSecondary" sx={{ mt: 3 }}>
                🌾 Aucune ferme enregistrée
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Commencez par ajouter votre première exploitation agricole
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{ bgcolor: '#0A8F5C', borderRadius: 10, px: 4 }}
              >
                Créer ma première ferme
              </Button>
            </CardContent>
          </Card>
        </Fade>
      ) : (
        <Grid container spacing={3}>
          {farms.map((farm, index) => (
            <Grid item xs={12} sm={6} md={4} key={farm.id}>
              <Grow in={animateCards} style={{ transitionDelay: `${index * 100}ms` }}>
                <Card sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                  }
                }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {farm.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                          <LocationOn sx={{ fontSize: 16, color: '#4A5A6E' }} />
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {farm.location}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => handleOpenDialog(farm)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" onClick={() => handleDelete(farm.id)} color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Superficie
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0A8F5C' }}>
                          {farm.total_area} ha
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Eau disponible
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {farm.water_availability} m³
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box mt={2}>
                      <Chip
                        icon={<span>{getSoilIcon(farm.soil_type)}</span>}
                        label={farm.soil_type}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                      <Chip
                        icon={<span>{getIrrigationIcon(farm.irrigation_system)}</span>}
                        label={farm.irrigation_system}
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                    </Box>

                    <Typography variant="caption" color="textSecondary" display="block" mt={2}>
                      📍 {farm.latitude.toFixed(6)}, {farm.longitude.toFixed(6)}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<MyLocation />}
                      onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${farm.latitude}&mlon=${farm.longitude}&zoom=15`, '_blank')}
                      sx={{ borderRadius: 10 }}
                    >
                      Voir sur la carte
                    </Button>
                  </CardActions>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Agriculture sx={{ color: '#0A8F5C' }} />
            {editingFarm ? 'Modifier la ferme' : 'Ajouter une ferme'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom de la ferme"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Ferme El Ghazala"
                />
              </Grid>
              
              <Grid item xs={12}>
                <LocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={handleLocationChange}
                  address={formData.location}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Superficie (ha)"
                  value={formData.total_area || ''}
                  onChange={(e) => setFormData({ ...formData, total_area: parseFloat(e.target.value) || 0 })}
                  inputProps={{ step: "0.1", min: "0" }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Eau disponible (m³)"
                  value={formData.water_availability || ''}
                  onChange={(e) => setFormData({ ...formData, water_availability: parseFloat(e.target.value) || 0 })}
                  inputProps={{ step: "1", min: "0" }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Type de sol"
                  value={formData.soil_type}
                  onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                >
                  {soilTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Système d'irrigation"
                  value={formData.irrigation_system}
                  onChange={(e) => setFormData({ ...formData, irrigation_system: e.target.value })}
                >
                  {irrigationSystems.map((system) => (
                    <MenuItem key={system.value} value={system.value}>
                      {system.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 10 }}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ bgcolor: '#0A8F5C', borderRadius: 10, px: 4 }}
          >
            {editingFarm ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FarmManagement;
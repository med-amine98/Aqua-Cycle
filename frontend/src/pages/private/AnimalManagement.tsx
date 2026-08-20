import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Fade,
  Zoom,
  Alert,
} from '@mui/material';
import {
  Pets,
  Add,
  Refresh,
  Edit,
  Delete,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface Animal {
  id: string;
  type: string;
  race: string;
  nom: string;
  identification: string;
  date_naissance: string;
  sexe: string;
  poids: number;
  sante: string;
  notes: string;
}

const AnimalManagement: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    race: '',
    nom: '',
    identification: '',
    date_naissance: '',
    sexe: 'mâle',
    poids: 0,
    notes: '',
  });

  const animalTypes = ['bovin', 'ovin', 'caprin', 'volaille', 'equide', 'autre'];
  const healthStatuses = [
    { value: 'excellent', label: '⭐ Excellent', color: '#2E7D32' },
    { value: 'bon', label: '👍 Bon', color: '#4CAF50' },
    { value: 'moyen', label: '⚠️ Moyen', color: '#ED6C02' },
    { value: 'critique', label: '🚨 Critique', color: '#D32F2F' },
  ];

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/animals');
      setAnimals(response.data || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Impossible de charger les animaux');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingAnimal) {
        await api.put(`/animals/${editingAnimal.id}`, formData);
      } else {
        await api.post('/animals', formData);
      }
      handleCloseDialog();
      loadAnimals();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Supprimer cet animal ?')) {
      try {
        await api.delete(`/animals/${id}`);
        loadAnimals();
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAnimal(null);
    setFormData({
      type: '',
      race: '',
      nom: '',
      identification: '',
      date_naissance: '',
      sexe: 'mâle',
      poids: 0,
      notes: '',
    });
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle sx={{ color: '#2E7D32' }} />;
      case 'bon': return <CheckCircle sx={{ color: '#4CAF50' }} />;
      case 'moyen': return <Warning sx={{ color: '#ED6C02' }} />;
      case 'critique': return <ErrorIcon sx={{ color: '#D32F2F' }} />;
      default: return <Pets />;
    }
  };

  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      bovin: '🐄',
      ovin: '🐑',
      caprin: '🐐',
      volaille: '🐔',
      equide: '🐴',
      autre: '🐾',
    };
    return emojis[type] || '🐾';
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Chargement des animaux...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332' }}>
          🐄 Gestion des Animaux
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadAnimals}
            sx={{ mr: 1 }}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{ bgcolor: '#0A8F5C' }}
          >
            Ajouter un animal
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {animals.length === 0 ? (
        <Card sx={{ bgcolor: '#F5F7FA', border: '2px dashed #ddd' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Pets sx={{ fontSize: 64, color: '#ccc' }} />
            <Typography variant="h5" color="textSecondary" gutterBottom>
              🐾 Aucun animal enregistré
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Commencez par ajouter votre premier animal
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {animals.map((animal) => (
            <Grid item xs={12} sm={6} md={4} key={animal.id}>
              <Zoom in={true}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h2" sx={{ fontSize: 32 }}>
                          {getTypeEmoji(animal.type)}
                        </Typography>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {animal.nom || 'Sans nom'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {animal.type} • {animal.race || 'Race inconnue'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => {
                          setEditingAnimal(animal);
                          setFormData(animal);
                          setDialogOpen(true);
                        }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(animal.id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box mt={2}>
                      <Chip
                        icon={getHealthIcon(animal.sante)}
                        label={healthStatuses.find(h => h.value === animal.sante)?.label || animal.sante}
                        size="small"
                        sx={{
                          bgcolor: `${(healthStatuses.find(h => h.value === animal.sante)?.color || '#4A5A6E')}15`,
                          color: healthStatuses.find(h => h.value === animal.sante)?.color || '#4A5A6E',
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={`${animal.poids} kg`}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                      <Chip
                        label={animal.sexe}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>

                    <Box mt={2}>
                      <Typography variant="caption" color="textSecondary">
                        📅 Naissance: {new Date(animal.date_naissance).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        🏷️ ID: {animal.identification || 'Non défini'}
                      </Typography>
                    </Box>

                    {animal.notes && (
                      <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                        📝 {animal.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAnimal ? 'Modifier l\'animal' : 'Ajouter un animal'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {animalTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Race"
                  value={formData.race}
                  onChange={(e) => setFormData({ ...formData, race: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Identification"
                  value={formData.identification}
                  onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de naissance"
                  value={formData.date_naissance}
                  onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Sexe"
                  value={formData.sexe}
                  onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                >
                  <MenuItem value="mâle">Mâle</MenuItem>
                  <MenuItem value="femelle">Femelle</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Poids (kg)"
                  value={formData.poids}
                  onChange={(e) => setFormData({ ...formData, poids: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#0A8F5C' }}>
            {editingAnimal ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnimalManagement;
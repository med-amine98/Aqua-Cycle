import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  Avatar,
  Stack,
} from '@mui/material';
import { Add, Edit, Delete, Save, Cancel, Agriculture } from '@mui/icons-material';

export interface CropData {
  id?: string;
  name: string;
  variety: string;
  type: string;
  growthStage: string;
  plantingDate: string;
  area: number;
  expectedYield: number;
  irrigationType: string;
  notes: string;
}

interface CropManagerProps {
  crops: CropData[];
  onAdd: (crop: CropData) => void;
  onUpdate: (id: string, crop: CropData) => void;
  onDelete: (id: string) => void;
}

const cropTypes = ['Céréales', 'Légumes', 'Fruits', 'Oliviers', 'Vignes', 'Dattes', 'Légumineuses', 'Autre'];
const growthStages = ['Semis', 'Végétatif', 'Floraison', 'Fructification', 'Maturation', 'Récolte'];
const irrigationTypes = ['Goutte-à-goutte', 'Aspersion', 'Gravitaire', 'Subsurface', 'Manuel'];

const CropManager: React.FC<CropManagerProps> = ({ crops, onAdd, onUpdate, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CropData>({
    name: '',
    variety: '',
    type: '',
    growthStage: '',
    plantingDate: '',
    area: 0,
    expectedYield: 0,
    irrigationType: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const handleOpen = (crop?: CropData) => {
    if (crop) {
      setFormData(crop);
      setEditingId(crop.id || null);
    } else {
      setFormData({
        name: '',
        variety: '',
        type: '',
        growthStage: '',
        plantingDate: '',
        area: 0,
        expectedYield: 0,
        irrigationType: '',
        notes: '',
      });
      setEditingId(null);
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      variety: '',
      type: '',
      growthStage: '',
      plantingDate: '',
      area: 0,
      expectedYield: 0,
      irrigationType: '',
      notes: '',
    });
    setError('');
  };

  const handleSave = () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Le nom de la culture est requis');
      return;
    }
    if (!formData.type) {
      setError('Le type de culture est requis');
      return;
    }
    if (!formData.growthStage) {
      setError('Le stade de croissance est requis');
      return;
    }
    if (!formData.plantingDate) {
      setError('La date de plantation est requise');
      return;
    }
    if (formData.area <= 0) {
      setError('La superficie doit être supérieure à 0');
      return;
    }

    // Transformer les données au format attendu par le backend
    const cropData = {
      name: formData.name.trim(),
      variety: formData.variety.trim() || 'Standard',
      type: formData.type,
      growth_stage: formData.growthStage, // Note: le backend attend "growth_stage"
      planting_date: formData.plantingDate, // Note: le backend attend "planting_date"
      area: formData.area,
      expected_yield: formData.expectedYield || 0, // Note: le backend attend "expected_yield"
      irrigation_type: formData.irrigationType || '', // Note: le backend attend "irrigation_type"
      notes: formData.notes || '',
    };

    if (editingId) {
      onUpdate(editingId, cropData as any);
    } else {
      onAdd(cropData as any);
    }
    handleClose();
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, any> = {
      'Semis': 'info',
      'Végétatif': 'success',
      'Floraison': 'warning',
      'Fructification': 'primary',
      'Maturation': 'secondary',
      'Récolte': 'error',
    };
    return colors[stage] || 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Agriculture sx={{ color: '#0A8F5C' }} />
          Mes Cultures ({crops.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ bgcolor: '#0A8F5C' }}
        >
          Ajouter une culture
        </Button>
      </Box>

      {crops.length === 0 ? (
        <Card sx={{ bgcolor: '#F5F7FA', border: '2px dashed #ddd' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Agriculture sx={{ fontSize: 48, color: '#ccc' }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              🌱 Aucune culture enregistrée
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ajoutez votre première culture pour commencer à recevoir des recommandations personnalisées
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpen()}
              sx={{ mt: 2, bgcolor: '#0A8F5C' }}
            >
              Ajouter une culture
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {crops.map((crop) => (
            <Grid item xs={12} sm={6} md={4} key={crop.id}>
              <Card sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                }
              }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {crop.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {crop.variety} • {crop.type}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpen(crop)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => onDelete(crop.id!)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box mt={2}>
                    <Chip
                      label={crop.growthStage}
                      color={getStageColor(crop.growthStage)}
                      size="small"
                    />
                    <Chip
                      label={`${crop.area} ha`}
                      variant="outlined"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>

                  <Box mt={2}>
                    <Typography variant="body2" color="textSecondary">
                      📅 Plantation: {new Date(crop.plantingDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      📈 Rendement estimé: {crop.expectedYield} T/ha
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      💧 Irrigation: {crop.irrigationType || 'Non spécifié'}
                    </Typography>
                  </Box>

                  {crop.notes && (
                    <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                      📝 {crop.notes}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Agriculture sx={{ color: '#0A8F5C' }} />
            {editingId ? 'Modifier la culture' : 'Ajouter une culture'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom de la culture"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Tomate, Blé, Olives..."
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Variété"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  placeholder="Ex: Roma, Chemlali..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Type de culture"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  {cropTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Stade de croissance"
                  value={formData.growthStage}
                  onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                  required
                >
                  {growthStages.map((stage) => (
                    <MenuItem key={stage} value={stage}>{stage}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de plantation"
                  value={formData.plantingDate}
                  onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Superficie (ha)"
                  value={formData.area || ''}
                  onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                  inputProps={{ step: "0.1", min: "0" }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rendement estimé (T/ha)"
                  value={formData.expectedYield || ''}
                  onChange={(e) => setFormData({ ...formData, expectedYield: parseFloat(e.target.value) || 0 })}
                  inputProps={{ step: "0.1", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Type d'irrigation"
                  value={formData.irrigationType}
                  onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
                >
                  {irrigationTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observations, problèmes, traitements..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<Cancel />}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<Save />}
            sx={{ bgcolor: '#0A8F5C' }}
          >
            {editingId ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CropManager;
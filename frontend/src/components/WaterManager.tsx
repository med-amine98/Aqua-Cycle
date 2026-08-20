import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack,
  Fade,
  Tooltip,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, WaterDrop, Check, Warning, Delete, Refresh, Edit, Close } from '@mui/icons-material';

interface WaterData {
  id?: string;
  date: string;
  source: string;
  volume: number;
  usedFor: string;
  status: 'planned' | 'done' | 'cancelled';
  notes: string;
  month?: string;
  created_at?: string;
  total_used?: number;
  total_available?: number;
}

interface WaterManagerProps {
  waterData: WaterData[];
  onAdd: (data: WaterData) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, data: WaterData) => void;
  onRefresh?: () => void;
}

// Fonction pour formater une date correctement
const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return 'Date non définie';
  try {
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
    }
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return 'Date invalide';
  }
};

const WaterManager: React.FC<WaterManagerProps> = ({ waterData, onAdd, onDelete, onUpdate, onRefresh }) => {
  const [formData, setFormData] = useState<WaterData>({
    date: new Date().toISOString().split('T')[0],
    source: '',
    volume: 0,
    usedFor: '',
    status: 'planned',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<WaterData | null>(null);

  const handleAdd = () => {
    if (!formData.source.trim()) {
      setError('La source est requise');
      return;
    }
    if (formData.volume <= 0) {
      setError('Le volume doit être supérieur à 0');
      return;
    }
    if (!formData.usedFor.trim()) {
      setError('L\'utilisation est requise');
      return;
    }

    setError('');
    
    const dateValue = formData.date || new Date().toISOString().split('T')[0];
    
    const waterDataToSend = {
      date: dateValue,
      source: formData.source.trim(),
      volume: formData.volume,
      used_for: formData.usedFor.trim(),
      status: formData.status,
      notes: formData.notes || '',
    };

    onAdd(waterDataToSend as any);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      source: '',
      volume: 0,
      usedFor: '',
      status: 'planned',
      notes: '',
    });
  };

  const handleEditClick = (data: WaterData) => {
    setEditingData(data);
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (editingData && onUpdate) {
      onUpdate(editingData.id!, editingData);
      setEditDialogOpen(false);
      setEditingData(null);
    }
  };

  // Fonction pour changer le statut
  const handleStatusChange = (id: string, newStatus: 'planned' | 'done' | 'cancelled') => {
    if (onUpdate) {
      const dataToUpdate = waterData.find(d => d.id === id);
      if (dataToUpdate) {
        onUpdate(id, { ...dataToUpdate, status: newStatus });
      }
    }
  };

  // Fonction pour le cycle de statut
  const getNextStatus = (currentStatus: string): 'planned' | 'done' | 'cancelled' => {
    if (currentStatus === 'planned') return 'done';
    if (currentStatus === 'done') return 'cancelled';
    return 'planned';
  };

  const getStatusChip = (data: WaterData) => {
    const status = data.status || 'planned';
    const configs: Record<string, any> = {
      planned: { label: '⏳ Planifié', color: 'warning', icon: <Warning sx={{ fontSize: 14 }} /> },
      done: { label: '✅ Réalisé', color: 'success', icon: <Check sx={{ fontSize: 14 }} /> },
      cancelled: { label: '❌ Annulé', color: 'error', icon: <Close sx={{ fontSize: 14 }} /> },
    };
    const config = configs[status] || configs.planned;
    
    const nextStatus = getNextStatus(status);
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        onClick={() => {
          if (data.id) {
            handleStatusChange(data.id, nextStatus);
          }
        }}
        sx={{ cursor: 'pointer' }}
      />
    );
  };

  // Calculer le total des volumes correctement
  const totalVolume = waterData.reduce((sum, d) => {
    const volume = d.volume || d.total_used || 0;
    return sum + volume;
  }, 0);

  const doneCount = waterData.filter(d => d.status === 'done').length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <WaterDrop sx={{ color: '#1A6EB5' }} />
          Gestion de l'eau
          <Chip label={`${waterData.length} enregistrements`} size="small" />
          <Chip 
            label={`${totalVolume} m³ total`} 
            size="small" 
            color="primary" 
          />
          <Chip 
            label={`✅ ${doneCount} réalisés`} 
            size="small" 
            color="success" 
          />
        </Typography>
        {onRefresh && (
          <Tooltip title="Actualiser">
            <IconButton onClick={onRefresh} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Formulaire d'ajout */}
      <Card sx={{ mb: 3, bgcolor: '#F5F7FA', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            📝 Enregistrer une utilisation d'eau
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              ✅ Donnée ajoutée avec succès !
            </Alert>
          )}
          
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={2.5}>
              <TextField
                fullWidth
                label="Source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Puits, forage..."
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                type="number"
                label="Volume (m³)"
                value={formData.volume || ''}
                onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) || 0 })}
                inputProps={{ step: "0.1", min: "0.1" }}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={2.5}>
              <TextField
                fullWidth
                label="Utilisation"
                value={formData.usedFor}
                onChange={(e) => setFormData({ ...formData, usedFor: e.target.value })}
                placeholder="Irrigation..."
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Statut"
                >
                  <MenuItem value="planned">⏳ Planifié</MenuItem>
                  <MenuItem value="done">✅ Réalisé</MenuItem>
                  <MenuItem value="cancelled">❌ Annulé</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1.5}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAdd}
                startIcon={<Add />}
                sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
              >
                Ajouter
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">Total utilisé</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A6EB5' }}>{totalVolume} m³</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">Enregistrements</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0A8F5C' }}>{waterData.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">Moyenne/jour</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {waterData.length > 0 ? (totalVolume / waterData.length).toFixed(1) : 0} m³
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">Statut</Typography>
              <Chip
                label={waterData.every(d => d.status === 'done') ? '✅ Complet' : '⏳ En cours'}
                color={waterData.every(d => d.status === 'done') ? 'success' : 'warning'}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tableau des données */}
      {waterData.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'auto' }}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F7FA' }}>
                <TableCell>Date</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Volume (m³)</TableCell>
                <TableCell>Utilisation</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {waterData.map((data, index) => {
                // Récupérer la date correctement
                const dateStr = data.date || data.month || data.created_at || new Date().toISOString().split('T')[0];
                const formattedDate = formatDate(dateStr);
                // Récupérer le volume correctement
                const volume = data.volume || data.total_used || 0;
                return (
                  <TableRow key={index}>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>{data.source || 'Non spécifié'}</TableCell>
                    <TableCell align="right">{volume}</TableCell>
                    <TableCell>{data.usedFor || 'Non spécifié'}</TableCell>
                    <TableCell>{getStatusChip(data)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => handleEditClick(data)} color="primary">
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {onDelete && data.id && (
                          <Tooltip title="Supprimer">
                            <IconButton size="small" onClick={() => onDelete(data.id!)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Fade in={true}>
          <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <WaterDrop sx={{ fontSize: 48, color: '#ccc' }} />
              <Typography variant="h6" color="textSecondary">Aucune donnée d'eau enregistrée</Typography>
              <Typography variant="body2" color="textSecondary">Ajoutez vos premières données pour commencer</Typography>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier les données d'eau</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Source"
                  value={editingData?.source || ''}
                  onChange={(e) => setEditingData({ ...editingData!, source: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Volume (m³)"
                  value={editingData?.volume || editingData?.total_used || 0}
                  onChange={(e) => setEditingData({ ...editingData!, volume: parseFloat(e.target.value) || 0 })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Utilisation"
                  value={editingData?.usedFor || ''}
                  onChange={(e) => setEditingData({ ...editingData!, usedFor: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={editingData?.date || ''}
                  onChange={(e) => setEditingData({ ...editingData!, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={editingData?.status || 'planned'}
                    onChange={(e) => setEditingData({ ...editingData!, status: e.target.value as any })}
                    label="Statut"
                  >
                    <MenuItem value="planned">⏳ Planifié</MenuItem>
                    <MenuItem value="done">✅ Réalisé</MenuItem>
                    <MenuItem value="cancelled">❌ Annulé</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={editingData?.notes || ''}
                  onChange={(e) => setEditingData({ ...editingData!, notes: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
          <Button onClick={handleEditSave} variant="contained" sx={{ bgcolor: '#0A8F5C' }}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaterManager;
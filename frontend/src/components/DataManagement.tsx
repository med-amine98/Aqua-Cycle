import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Avatar,
  Stack,
  Paper,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Agriculture,
  WaterDrop,
  DeleteSweep,
  Refresh,
} from '@mui/icons-material';

interface DataManagementProps {
  title: string;
  icon: React.ReactNode;
  data: any[];
  fields: { key: string; label: string; type?: string; options?: string[] }[];
  onAdd: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  renderItem: (item: any, index: number) => React.ReactNode;
}

const DataManagement: React.FC<DataManagementProps> = ({
  title,
  icon,
  data,
  fields,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  renderItem,
}) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');

  const handleOpen = (item?: any) => {
    if (item) {
      setFormData(item);
      setEditingId(item.id || null);
    } else {
      const initialData: any = {};
      fields.forEach(field => {
        initialData[field.key] = '';
      });
      setFormData(initialData);
      setEditingId(null);
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({});
    setError('');
  };

  const handleSave = () => {
    // Validation
    for (const field of fields) {
      if (!formData[field.key] && field.key !== 'notes' && field.key !== 'description') {
        setError(`Le champ "${field.label}" est requis`);
        return;
      }
    }

    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    handleClose();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          {title} ({data.length})
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            size="small"
            sx={{ mr: 1 }}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
            sx={{ bgcolor: '#0A8F5C' }}
          >
            Ajouter
          </Button>
        </Box>
      </Box>

      {data.length === 0 ? (
        <Card sx={{ bgcolor: '#F5F7FA', border: '2px dashed #ddd' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Aucune donnée enregistrée
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Cliquez sur "Ajouter" pour commencer
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {data.map((item, index) => renderItem(item, index))}
        </Grid>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Modifier' : 'Ajouter'} {title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2}>
              {fields.map((field) => (
                <TextField
                  key={field.key}
                  fullWidth
                  select={!!field.options}
                  label={field.label}
                  type={field.type || 'text'}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  required={field.key !== 'notes' && field.key !== 'description'}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                >
                  {field.options?.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
              ))}
            </Stack>
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

export default DataManagement;
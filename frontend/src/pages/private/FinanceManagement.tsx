import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  AttachMoney,
  Add,
  Refresh,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface Transaction {
  id: string;
  type: string;
  categorie: string;
  montant: number;
  date: string;
  description: string;
}

const FinanceManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'revenu',
    categorie: '',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const categories = {
    revenu: ['vente', 'subvention', 'autre'],
    depense: ['achat_intrant', 'main_doeuvre', 'equipement', 'veterinaire', 'transport', 'energie', 'autre'],
    investissement: ['equipement', 'infrastructure', 'autre'],
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data || []);
    } catch (error: any) {
      console.error('Erreur:', error);
      setError('Impossible de charger les transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.post('/transactions', formData);
      handleCloseDialog();
      loadTransactions();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      type: 'revenu',
      categorie: '',
      montant: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  const totalRevenus = transactions
    .filter(t => t.type === 'revenu')
    .reduce((sum, t) => sum + t.montant, 0);
  const totalDepenses = transactions
    .filter(t => t.type === 'depense')
    .reduce((sum, t) => sum + t.montant, 0);
  const balance = totalRevenus - totalDepenses;

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography align="center" sx={{ mt: 2 }}>
          Chargement des transactions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332' }}>
          💰 Gestion Financière
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadTransactions}
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
            Nouvelle transaction
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Total Revenus
              </Typography>
              <Typography variant="h4" color="success.main">
                {totalRevenus.toFixed(2)} TND
              </Typography>
              <Chip icon={<TrendingUp />} label="+12.5%" size="small" color="success" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Total Dépenses
              </Typography>
              <Typography variant="h4" color="error.main">
                {totalDepenses.toFixed(2)} TND
              </Typography>
              <Chip icon={<TrendingDown />} label="-8.3%" size="small" color="error" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Solde
              </Typography>
              <Typography variant="h4" color={balance >= 0 ? 'primary' : 'error'}>
                {balance.toFixed(2)} TND
              </Typography>
              <Chip label={balance >= 0 ? '✅ Positif' : '⚠️ Négatif'} size="small" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {transactions.length === 0 ? (
        <Card sx={{ bgcolor: '#F5F7FA', border: '2px dashed #ddd' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AttachMoney sx={{ fontSize: 64, color: '#ccc' }} />
            <Typography variant="h5" color="textSecondary" gutterBottom>
              Aucune transaction enregistrée
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Commencez par ajouter votre première transaction
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Catégorie</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.type}
                      size="small"
                      color={transaction.type === 'revenu' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{transaction.categorie}</TableCell>
                  <TableCell align="right">
                    <Typography color={transaction.type === 'revenu' ? 'success.main' : 'error.main'}>
                      {transaction.type === 'revenu' ? '+' : '-'}{transaction.montant.toFixed(2)} TND
                    </Typography>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle transaction</DialogTitle>
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
                  <MenuItem value="revenu">💰 Revenu</MenuItem>
                  <MenuItem value="depense">💸 Dépense</MenuItem>
                  <MenuItem value="investissement">📈 Investissement</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Catégorie"
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                >
                  {(categories[formData.type as keyof typeof categories] || []).map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat.replace('_', ' ')}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Montant (TND)"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#0A8F5C' }}>
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FinanceManagement;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  TextField,
  MenuItem,
  CardActions,
  Divider,
  Paper,
  Fade,
  Zoom,
  Stack,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Recycling,
  LocationOn,
  AttachMoney,
  Search,
  Refresh,
  Visibility,
  ContactMail,
  LocalOffer,
  LocalShipping,
  CheckCircle,
  Close,
  Phone,
  Email,
  Person,
} from '@mui/icons-material';
import { wasteService, offerService, companyService } from '../../services/api';
import { CompanyProfile } from '../../types';

interface WasteItem {
  id: string;
  waste_type: string;
  quantity: number;
  unit: string;
  availability_date: string;
  location: string;
  latitude: number;
  longitude: number;
  quality_grade: string;
  description: string;
  price_per_unit: number;
  distance?: number;
  farmer_name: string;
  farmer_phone?: string;
  farmer_email?: string;
}

const WasteMarket: React.FC = () => {
  const navigate = useNavigate();
  const [wastes, setWastes] = useState<WasteItem[]>([]);
  const [filteredWastes, setFilteredWastes] = useState<WasteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    waste_type: '',
    min_quantity: '',
    max_distance: '',
    search: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedWaste, setSelectedWaste] = useState<WasteItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [isCreatingNewCompanyInline, setIsCreatingNewCompanyInline] = useState(false);
  const [inlineCompanyName, setInlineCompanyName] = useState('');
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [offerData, setOfferData] = useState({
    company_id: '',
    quantity: 0,
    price_per_unit: 0,
    message: '',
  });

  useEffect(() => {
    loadWastes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [wastes, filters]);

  const loadWastes = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wasteRes, compRes] = await Promise.allSettled([
        wasteService.getAvailableWaste(),
        companyService.getCompanies(),
      ]);

      if (wasteRes.status === 'fulfilled') {
        const data = wasteRes.value.data || [];
        const enrichedData = data.map((item: any) => ({
          ...item,
          farmer_phone: '+216 70 123 456',
          farmer_email: 'contact@aquacycle.com',
        }));
        setWastes(enrichedData);
        setFilteredWastes(enrichedData);
      }

      if (compRes.status === 'fulfilled') {
        const loadedComps = compRes.value.data || [];
        setCompanies(loadedComps);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les déchets disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOffer = (waste: WasteItem) => {
    setSelectedWaste(waste);
    setOfferData({
      company_id: companies[0]?.id || '',
      quantity: waste.quantity || 10,
      price_per_unit: waste.price_per_unit || 40,
      message: '',
    });
    setIsCreatingNewCompanyInline(companies.length === 0);
    setInlineCompanyName('');
    setOfferDialogOpen(true);
  };

  const handleSubmitOffer = async () => {
    if (!selectedWaste) return;

    let targetCompanyId = offerData.company_id;

    try {
      if (isCreatingNewCompanyInline) {
        if (!inlineCompanyName.trim()) {
          setError("Veuillez saisir le nom de l'entreprise acheteuse");
          return;
        }
        const compRes = await companyService.createCompany({
          company_name: inlineCompanyName.trim(),
          waste_interests: [selectedWaste.waste_type],
          min_quantity: 5,
          max_distance: 100,
        });
        targetCompanyId = compRes.data?.company_id;
      }

      if (!targetCompanyId) {
        setError('Veuillez choisir ou créer une entreprise acheteuse');
        return;
      }

      await offerService.createOffer({
        waste_id: selectedWaste.id,
        company_id: targetCompanyId,
        quantity: offerData.quantity,
        price_per_unit: offerData.price_per_unit,
        message: offerData.message,
      });

      setSuccessMsg('Offre de rachat soumise avec succès ! Vous pouvez la suivre dans Supply Chain & Logistique.');
      setOfferDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi de l'offre");
    }
  };

  const applyFilters = () => {
    let result = [...wastes];

    // Filtre par type de déchet
    if (filters.waste_type) {
      result = result.filter(w => w.waste_type === filters.waste_type);
    }

    // Filtre par quantité minimale
    if (filters.min_quantity) {
      const minQty = parseFloat(filters.min_quantity);
      if (!isNaN(minQty)) {
        result = result.filter(w => w.quantity >= minQty);
      }
    }

    // Filtre par distance maximale
    if (filters.max_distance) {
      const maxDist = parseFloat(filters.max_distance);
      if (!isNaN(maxDist) && maxDist > 0) {
        result = result.filter(w => (w.distance || 0) <= maxDist);
      }
    }

    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(w => 
        w.waste_type.toLowerCase().includes(searchLower) ||
        w.location.toLowerCase().includes(searchLower) ||
        w.description?.toLowerCase().includes(searchLower) ||
        w.farmer_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredWastes(result);
  };

  const handleFilter = () => {
    applyFilters();
  };

  const handleReset = () => {
    setFilters({
      waste_type: '',
      min_quantity: '',
      max_distance: '',
      search: '',
    });
    setTimeout(() => {
      setFilteredWastes(wastes);
    }, 100);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const getWasteIcon = (type: string) => {
    const icons: Record<string, string> = {
      olive_pomace: '🫒',
      olive_pits: '🫒',
      pruning_residues: '✂️',
      crop_residues: '🌾',
      date_residues: '🌴',
      vine_residues: '🍇',
      other: '📦',
    };
    return icons[type] || '♻️';
  };

  const getWasteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      olive_pomace: 'Grignon d\'olive',
      olive_pits: 'Noyaux d\'olive',
      pruning_residues: 'Résidus de taille',
      crop_residues: 'Résidus de culture',
      date_residues: 'Résidus de dattes',
      vine_residues: 'Résidus de vigne',
      other: 'Autre',
    };
    return labels[type] || type;
  };

  const getQualityColor = (quality: string) => {
    const colors: Record<string, any> = {
      high: 'success',
      medium: 'warning',
      low: 'error',
    };
    return colors[quality] || 'default';
  };

  const getQualityLabel = (quality: string) => {
    const labels: Record<string, string> = {
      high: '⭐ Haute',
      medium: '⭐ Moyenne',
      low: '⭐ Basse',
    };
    return labels[quality] || 'Standard';
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleViewDetails = (waste: WasteItem) => {
    setSelectedWaste(waste);
    setDetailsOpen(true);
  };

  const handleContact = (waste: WasteItem) => {
    setSelectedWaste(waste);
    setContactOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedWaste(null);
  };

  const handleCloseContact = () => {
    setContactOpen(false);
    setSelectedWaste(null);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
        <Typography align="center" sx={{ mt: 3, color: '#4A5A6E' }}>
          🔄 Chargement du marché des déchets...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Recycling sx={{ color: '#0A8F5C', fontSize: 32 }} />
            Marché des déchets agricoles
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {filteredWastes.length} déchet(s) disponible(s) à la valorisation
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadWastes}
            size="small"
            sx={{ borderRadius: 10 }}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<LocalShipping />}
            onClick={() => navigate('/supply-chain')}
            size="small"
            sx={{ borderRadius: 10, bgcolor: '#0A8F5C', '&:hover': { bgcolor: '#087349' } }}
          >
            Supply Chain & Logistique
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Barre de recherche et filtres */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={12} md={12}>
            <TextField
              fullWidth
              placeholder="🔍 Rechercher par type, localisation, description..."
              value={filters.search}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              size="small"
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Type de déchet"
              value={filters.waste_type}
              onChange={(e) => setFilters({ ...filters, waste_type: e.target.value })}
              size="small"
              sx={{ bgcolor: 'white' }}
            >
              <MenuItem value="">📋 Tous les types</MenuItem>
              <MenuItem value="olive_pomace">🫒 Grignon d'olive</MenuItem>
              <MenuItem value="olive_pits">🫒 Noyaux d'olive</MenuItem>
              <MenuItem value="pruning_residues">✂️ Résidus de taille</MenuItem>
              <MenuItem value="crop_residues">🌾 Résidus de culture</MenuItem>
              <MenuItem value="date_residues">🌴 Résidus de dattes</MenuItem>
              <MenuItem value="vine_residues">🍇 Résidus de vigne</MenuItem>
              <MenuItem value="other">📦 Autre</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Quantité min (tonnes)"
              value={filters.min_quantity}
              onChange={(e) => setFilters({ ...filters, min_quantity: e.target.value })}
              size="small"
              sx={{ bgcolor: 'white' }}
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="number"
              label="Distance max (km)"
              value={filters.max_distance}
              onChange={(e) => setFilters({ ...filters, max_distance: e.target.value })}
              size="small"
              sx={{ bgcolor: 'white' }}
              inputProps={{ min: 0, step: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFilter}
                sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
              >
                Filtrer
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ borderRadius: 10 }}
              >
                Réinitialiser
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Liste des déchets */}
      {filteredWastes.length === 0 ? (
        <Fade in={true}>
          <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Recycling sx={{ fontSize: 80, color: '#ccc' }} />
              <Typography variant="h5" color="textSecondary" sx={{ mt: 3 }}>
                {wastes.length === 0 ? 'Aucun déchet disponible' : 'Aucun déchet ne correspond aux filtres'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {wastes.length === 0 
                  ? 'Revenez plus tard ou déclarez vos propres déchets'
                  : 'Essayez de modifier vos filtres de recherche'}
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/waste/declare'}
                sx={{ mt: 3, bgcolor: '#0A8F5C', borderRadius: 10 }}
              >
                Déclarer mes déchets
              </Button>
            </CardContent>
          </Card>
        </Fade>
      ) : (
        <Grid container spacing={3}>
          {filteredWastes.map((waste, index) => (
            <Grid item xs={12} sm={6} md={4} key={waste.id}>
              <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
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
                    {/* En-tête */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h1" sx={{ fontSize: 32 }}>
                          {getWasteIcon(waste.waste_type)}
                        </Typography>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {getWasteTypeLabel(waste.waste_type)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {waste.farmer_name || 'Agriculteur'}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={getQualityLabel(waste.quality_grade)}
                        size="small"
                        color={getQualityColor(waste.quality_grade)}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Informations */}
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Quantité
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0A8F5C' }}>
                          {waste.quantity} T
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Prix
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {waste.price_per_unit ? `${waste.price_per_unit} TND/T` : 'À négocier'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Localisation */}
                    <Box display="flex" alignItems="center" gap={1} mt={2}>
                      <LocationOn sx={{ fontSize: 16, color: '#4A5A6E' }} />
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {waste.location}
                      </Typography>
                      {waste.distance && (
                        <Chip
                          label={`${waste.distance} km`}
                          size="small"
                          sx={{ bgcolor: '#E8F5E9', color: '#2E7D32' }}
                        />
                      )}
                    </Box>

                    {/* Date de disponibilité */}
                    <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                      📅 Disponible à partir du {formatDate(waste.availability_date)}
                    </Typography>

                    {/* Description */}
                    {waste.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                        "{waste.description}"
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDetails(waste)}
                      sx={{ borderRadius: 10, flex: 1 }}
                    >
                      Détails
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ContactMail />}
                      onClick={() => handleContact(waste)}
                      sx={{ borderRadius: 10, flex: 1 }}
                    >
                      Contact
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<LocalOffer />}
                      onClick={() => handleOpenOffer(waste)}
                      sx={{ bgcolor: '#0A8F5C', borderRadius: 10, width: '100%', mt: 0.5 }}
                    >
                      Faire une Offre
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog Détails */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedWaste && getWasteTypeLabel(selectedWaste.waste_type)}
            </Typography>
            <IconButton onClick={handleCloseDetails}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedWaste && (
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Person sx={{ color: '#4A5A6E' }} />
                <Typography variant="body1">
                  <strong>Agriculteur:</strong> {selectedWaste.farmer_name || 'Inconnu'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LocalOffer sx={{ color: '#4A5A6E' }} />
                <Typography variant="body1">
                  <strong>Type:</strong> {getWasteTypeLabel(selectedWaste.waste_type)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <AttachMoney sx={{ color: '#4A5A6E' }} />
                <Typography variant="body1">
                  <strong>Quantité:</strong> {selectedWaste.quantity} tonnes
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn sx={{ color: '#4A5A6E' }} />
                <Typography variant="body1">
                  <strong>Localisation:</strong> {selectedWaste.location}
                </Typography>
              </Box>
              {selectedWaste.distance && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1">
                    <strong>Distance:</strong> {selectedWaste.distance} km
                  </Typography>
                </Box>
              )}
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1">
                  <strong>Qualité:</strong> {getQualityLabel(selectedWaste.quality_grade)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1">
                  <strong>Prix:</strong> {selectedWaste.price_per_unit ? `${selectedWaste.price_per_unit} TND/tonne` : 'À négocier'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1">
                  <strong>Disponible à partir du:</strong> {formatDate(selectedWaste.availability_date)}
                </Typography>
              </Box>
              {selectedWaste.description && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    "{selectedWaste.description}"
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} sx={{ borderRadius: 10 }}>
            Fermer
          </Button>
          {selectedWaste && (
            <Button
              variant="contained"
              startIcon={<ContactMail />}
              onClick={() => {
                handleCloseDetails();
                handleContact(selectedWaste);
              }}
              sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
            >
              Contacter
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog Contact */}
      <Dialog open={contactOpen} onClose={handleCloseContact} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">📧 Contacter le vendeur</Typography>
            <IconButton onClick={handleCloseContact}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedWaste && (
            <Stack spacing={3}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Vous allez contacter {selectedWaste.farmer_name || 'l\'agriculteur'} pour le déchet suivant:
              </Alert>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Type de déchet
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {getWasteTypeLabel(selectedWaste.waste_type)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Quantité
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedWaste.quantity} tonnes
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Phone sx={{ color: '#0A8F5C' }} />
                <Typography variant="body1">
                  {selectedWaste.farmer_phone || 'Numéro non disponible'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Email sx={{ color: '#0A8F5C' }} />
                <Typography variant="body1">
                  {selectedWaste.farmer_email || 'Email non disponible'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                startIcon={<ContactMail />}
                onClick={() => {
                  if (selectedWaste.farmer_email) {
                    window.location.href = `mailto:${selectedWaste.farmer_email}?subject=Intéressé par vos déchets (${getWasteTypeLabel(selectedWaste.waste_type)})&body=Bonjour, je suis intéressé par vos déchets. Pouvez-vous me donner plus d'informations ?`;
                  }
                }}
                sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
              >
                Envoyer un email
              </Button>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContact} sx={{ borderRadius: 10 }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Faire une Offre */}
      <Dialog open={offerDialogOpen} onClose={() => setOfferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          🤝 Soumettre une offre de rachat pour ce lot
        </DialogTitle>
        <DialogContent dividers>
          {selectedWaste && (
            <Stack spacing={2.5}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Vous proposez une offre d'achat à <strong>{selectedWaste.farmer_name || 'l\'agriculteur'}</strong> pour <strong>{getWasteTypeLabel(selectedWaste.waste_type)}</strong> ({selectedWaste.quantity} T à {selectedWaste.location}).
              </Alert>

              {/* Mode Switcher */}
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    Entreprise Acheteuse
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setIsCreatingNewCompanyInline(!isCreatingNewCompanyInline)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    {isCreatingNewCompanyInline ? '← Choisir entreprise existante' : '+ Nouvelle Entreprise'}
                  </Button>
                </Box>

                {!isCreatingNewCompanyInline ? (
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="Sélectionner l'entreprise"
                    value={offerData.company_id}
                    onChange={(e) => setOfferData({ ...offerData, company_id: e.target.value })}
                  >
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        🏢 {c.company_name}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Nom de la nouvelle entreprise acheteuse"
                    value={inlineCompanyName}
                    onChange={(e) => setInlineCompanyName(e.target.value)}
                    placeholder="Ex: BioEnergy Solutions, EcoCompost Tunisie..."
                    autoFocus
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantité Souhaitée (T)"
                    value={offerData.quantity}
                    onChange={(e) => setOfferData({ ...offerData, quantity: Number(e.target.value) })}
                    inputProps={{ max: selectedWaste.quantity, min: 0.1, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Prix Proposé (TND/T)"
                    value={offerData.price_per_unit}
                    onChange={(e) => setOfferData({ ...offerData, price_per_unit: Number(e.target.value) })}
                  />
                </Grid>
              </Grid>

              <Typography variant="body1" sx={{ fontWeight: 700, color: '#0A8F5C' }}>
                Montant total de l'offre : {(offerData.quantity * offerData.price_per_unit).toLocaleString()} TND
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Message / Conditions de collecte"
                value={offerData.message}
                onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
                placeholder="Indiquez vos modalités de paiement, créneaux de ramassage ou contraintes logistiques..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOfferDialogOpen(false)} sx={{ borderRadius: 10 }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitOffer}
            disabled={!offerData.company_id || offerData.quantity <= 0}
            sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
          >
            Confirmer & Envoyer l'Offre
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WasteMarket;
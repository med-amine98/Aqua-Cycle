import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Divider,
  Paper,
  Stack,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  CircularProgress,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  LocalShipping,
  Warehouse,
  LocalOffer,
  AltRoute,
  Business,
  Add,
  CheckCircle,
  Cancel,
  LocationOn,
  Refresh,
  Speed,
  TrendingUp,
  AutoAwesome,
  Navigation,
  Delete,
  Route,
  Storefront,
  AttachMoney,
  Person,
} from '@mui/icons-material';
import {
  storageService,
  offerService,
  collectionService,
  companyService,
  wasteService,
} from '../../services/api';
import {
  StorageFacility,
  WasteOffer,
  CollectionOrder,
  CompanyProfile,
  CollectionPlan,
  StorageRecommendation,
} from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supply-tabpanel-${index}`}
      aria-labelledby={`supply-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const SupplyChain: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [offers, setOffers] = useState<WasteOffer[]>([]);
  const [collections, setCollections] = useState<CollectionOrder[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [availableWastes, setAvailableWastes] = useState<any[]>([]);

  // Dialogs
  const [openFacilityDialog, setOpenFacilityDialog] = useState(false);
  const [openOfferDialog, setOpenOfferDialog] = useState(false);
  const [openCollectionDialog, setOpenCollectionDialog] = useState(false);
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false);

  // Inline company creation mode inside Offer Dialog
  const [isCreatingNewCompanyInline, setIsCreatingNewCompanyInline] = useState(false);
  const [inlineCompanyName, setInlineCompanyName] = useState('');

  // Facility Form State
  const [newFacility, setNewFacility] = useState({
    name: '',
    location: '',
    latitude: 36.8,
    longitude: 10.18,
    total_capacity: 500,
    available_capacity: 500,
    accepted_waste_types: 'olive_pomace, olive_pits, crop_residues',
    storage_cost_per_unit: 15,
    description: '',
  });

  // Offer Form State
  const [newOffer, setNewOffer] = useState({
    waste_id: '',
    company_id: '',
    quantity: 10,
    price_per_unit: 45,
    message: '',
  });

  // Collection Form State
  const [newCollection, setNewCollection] = useState({
    offer_id: '',
    pickup_location: '',
    destination: '',
    storage_facility_id: '',
    estimated_distance_km: 25,
    transport_cost: 80,
  });

  // Company Form State
  const [newCompany, setNewCompany] = useState({
    company_name: '',
    waste_interests: ['olive_pomace', 'crop_residues'],
    min_quantity: 5,
    max_distance: 100,
  });

  // Recommender tool states
  const [recWasteType, setRecWasteType] = useState('olive_pomace');
  const [recQuantity, setRecQuantity] = useState(20);
  const [recLat, setRecLat] = useState(36.8065);
  const [recLon, setRecLon] = useState(10.1815);
  const [recMaxDist, setRecMaxDist] = useState(100);
  const [recommendations, setRecommendations] = useState<StorageRecommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  // Multi-stop Route Planning State
  const [selectedPlanStorage, setSelectedPlanStorage] = useState('');
  const [selectedPlanWastes, setSelectedPlanWastes] = useState<string[]>([]);
  const [collectionPlanResult, setCollectionPlanResult] = useState<CollectionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [facRes, offRes, colRes, compRes, wasteRes] = await Promise.allSettled([
        storageService.getFacilities(),
        offerService.getOffers(),
        collectionService.getCollections(),
        companyService.getCompanies(),
        wasteService.getAvailableWaste(),
      ]);

      let loadedCompanies: CompanyProfile[] = [];
      let loadedWastes: any[] = [];

      if (facRes.status === 'fulfilled') setFacilities(facRes.value.data || []);
      if (offRes.status === 'fulfilled') setOffers(offRes.value.data || []);
      if (colRes.status === 'fulfilled') setCollections(colRes.value.data || []);
      if (compRes.status === 'fulfilled') {
        loadedCompanies = compRes.value.data || [];
        setCompanies(loadedCompanies);
      }
      if (wasteRes.status === 'fulfilled') {
        loadedWastes = wasteRes.value.data || [];
        setAvailableWastes(loadedWastes);
      }

      // Pre-populate default selection for new offer
      if (loadedWastes.length > 0 && !newOffer.waste_id) {
        setNewOffer((prev) => ({
          ...prev,
          waste_id: loadedWastes[0].id,
          quantity: loadedWastes[0].quantity || 10,
          price_per_unit: loadedWastes[0].price_per_unit || 45,
          company_id: loadedCompanies.length > 0 ? loadedCompanies[0].id : '',
        }));
      }
    } catch (err: any) {
      console.error('Erreur de chargement supply chain:', err);
      setError('Impossible de charger les données Supply Chain');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOfferDialog = () => {
    const defaultWaste = availableWastes[0];
    const defaultCompany = companies[0];

    setNewOffer({
      waste_id: defaultWaste ? defaultWaste.id : '',
      company_id: defaultCompany ? defaultCompany.id : '',
      quantity: defaultWaste?.quantity || 10,
      price_per_unit: defaultWaste?.price_per_unit || 45,
      message: '',
    });
    setIsCreatingNewCompanyInline(companies.length === 0);
    setInlineCompanyName('');
    setOpenOfferDialog(true);
  };

  const handleCreateFacility = async () => {
    try {
      await storageService.createFacility(newFacility);
      setSuccessMsg('Centre de stockage créé avec succès !');
      setOpenFacilityDialog(false);
      setNewFacility({
        name: '',
        location: '',
        latitude: 36.8,
        longitude: 10.18,
        total_capacity: 500,
        available_capacity: 500,
        accepted_waste_types: 'olive_pomace, olive_pits',
        storage_cost_per_unit: 15,
        description: '',
      });
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du stockage');
    }
  };

  const handleDeleteFacility = async (id: string) => {
    try {
      await storageService.deleteFacility(id);
      setSuccessMsg('Centre de stockage supprimé');
      loadAllData();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleCreateOffer = async () => {
    try {
      let targetCompanyId = newOffer.company_id;

      // If user typed a new company inline, create it first
      if (isCreatingNewCompanyInline) {
        if (!inlineCompanyName.trim()) {
          setError("Veuillez saisir le nom de l'entreprise acheteuse");
          return;
        }
        const createdCompRes = await companyService.createCompany({
          company_name: inlineCompanyName.trim(),
          waste_interests: ['olive_pomace', 'crop_residues'],
          min_quantity: 5,
          max_distance: 100,
        });
        targetCompanyId = createdCompRes.data?.company_id;
      }

      if (!targetCompanyId) {
        setError("Veuillez sélectionner ou créer une entreprise acheteuse");
        return;
      }

      if (!newOffer.waste_id) {
        setError("Veuillez sélectionner un déchet agricole source");
        return;
      }

      await offerService.createOffer({
        waste_id: newOffer.waste_id,
        company_id: targetCompanyId,
        quantity: newOffer.quantity,
        price_per_unit: newOffer.price_per_unit,
        message: newOffer.message,
      });

      setSuccessMsg('Offre de rachat enregistrée et transmise avec succès !');
      setOpenOfferDialog(false);
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi de l'offre");
    }
  };

  const handleUpdateOfferStatus = async (offerId: string, status: string) => {
    try {
      await offerService.updateOfferStatus(offerId, status);
      setSuccessMsg(`Offre mise à jour : ${getStatusLabel(status)}`);
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await offerService.deleteOffer(id);
      setSuccessMsg('Offre supprimée');
      loadAllData();
    } catch (err) {
      setError("Erreur lors de la suppression de l'offre");
    }
  };

  const handleCreateCollection = async () => {
    try {
      await collectionService.createCollection({
        ...newCollection,
        storage_facility_id: newCollection.storage_facility_id || null,
      });
      setSuccessMsg('Ordre de collecte programmé avec succès !');
      setOpenCollectionDialog(false);
      setNewCollection({
        offer_id: '',
        pickup_location: '',
        destination: '',
        storage_facility_id: '',
        estimated_distance_km: 25,
        transport_cost: 80,
      });
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de programmation de collecte');
    }
  };

  const handleUpdateCollectionStatus = async (collectionId: string, status: string) => {
    try {
      await collectionService.updateCollectionStatus(collectionId, status);
      setSuccessMsg(`Statut de collecte mis à jour : ${getStatusLabel(status)}`);
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await collectionService.deleteCollection(id);
      setSuccessMsg('Collecte supprimée');
      loadAllData();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleCreateCompany = async () => {
    try {
      await companyService.createCompany(newCompany);
      setSuccessMsg('Entreprise enregistrée avec succès !');
      setOpenCompanyDialog(false);
      setNewCompany({
        company_name: '',
        waste_interests: ['olive_pomace', 'crop_residues'],
        min_quantity: 5,
        max_distance: 100,
      });
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de l'enregistrement de l'entreprise");
    }
  };

  const handleRunRecommender = async () => {
    setRecLoading(true);
    try {
      const res = await storageService.recommendFacilities({
        waste_type: recWasteType,
        quantity: recQuantity,
        latitude: recLat,
        longitude: recLon,
        max_distance: recMaxDist,
      });
      setRecommendations(res.data?.matches || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la recommandation de stockage');
    } finally {
      setRecLoading(false);
    }
  };

  const handleRunPlanOptimizer = async () => {
    if (!selectedPlanStorage || selectedPlanWastes.length === 0) {
      setError('Veuillez sélectionner un entrepôt et au moins un lot de déchets');
      return;
    }
    setPlanLoading(true);
    try {
      const res = await collectionService.planCollection({
        storage_facility_id: selectedPlanStorage,
        waste_ids: selectedPlanWastes,
      });
      setCollectionPlanResult(res.data);
      setSuccessMsg('Itinéraire multi-fermes optimisé avec succès !');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur d'optimisation de trajet");
    } finally {
      setPlanLoading(false);
    }
  };

  // Helper Labels & Icons
  const getWasteTypeIcon = (type: string) => {
    const map: Record<string, string> = {
      olive_pomace: '🫒',
      olive_pits: '🫒',
      crop_residues: '🌾',
      pruning_residues: '✂️',
      date_residues: '🌴',
      vine_residues: '🍇',
      other: '📦',
    };
    return map[type] || '♻️';
  };

  const getWasteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      olive_pomace: "Grignon d'olive",
      olive_pits: "Noyaux d'olive",
      pruning_residues: 'Résidus de taille',
      crop_residues: 'Résidus de culture',
      date_residues: 'Résidus de dattes',
      vine_residues: 'Résidus de vigne',
      other: 'Autre déchet organique',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'delivered':
      case 'stored':
        return 'success';
      case 'scheduled':
      case 'pending':
      case 'in_transit':
        return 'warning';
      case 'picked_up':
        return 'info';
      case 'rejected':
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: 'En attente',
      accepted: 'Acceptée',
      rejected: 'Refusée',
      cancelled: 'Annulée',
      scheduled: 'Programmée',
      picked_up: 'Ramassée',
      in_transit: 'En transit',
      delivered: 'Livrée',
      stored: 'Stockée',
    };
    return map[status] || status;
  };

  const getCollectionStepIndex = (status: string) => {
    switch (status) {
      case 'scheduled': return 0;
      case 'picked_up': return 1;
      case 'in_transit': return 2;
      case 'delivered': return 3;
      case 'stored': return 4;
      default: return 0;
    }
  };

  const collectionSteps = ['Programmée', 'Ramassée', 'En transit', 'Livrée', 'Stockée'];

  // Metrics
  const totalCapacity = facilities.reduce((acc, f) => acc + (f.total_capacity || 0), 0);
  const availableCapacity = facilities.reduce((acc, f) => acc + (f.available_capacity || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round(((totalCapacity - availableCapacity) / totalCapacity) * 100) : 0;
  const pendingOffersCount = offers.filter((o) => o.status === 'pending').length;
  const activeCollectionsCount = collections.filter((c) => ['scheduled', 'picked_up', 'in_transit'].includes(c.status)).length;
  const totalTonnageTraded = offers
    .filter((o) => o.status === 'accepted')
    .reduce((acc, o) => acc + (o.quantity || 0), 0);

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#0A8F5C', mb: 2 }} size={48} />
        <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>
          Chargement du Hub Supply Chain & Logistique...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Top Banner Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #064E3B 0%, #0A8F5C 60%, #0284C7 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px -5px rgba(10, 143, 92, 0.3)',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Chip
              icon={<AutoAwesome sx={{ color: '#FDE047 !important', fontSize: 16 }} />}
              label="Logistique Circulaire Intelligente"
              size="small"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', fontWeight: 700, mb: 1.5, backdropFilter: 'blur(8px)' }}
            />
            <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
              Supply Chain & Marketplace
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.5, maxWidth: 680 }}>
              Connectez directement les gisements de déchets agricoles aux industriels acheteurs, planifiez le stockage et optimisez vos tournées de collecte.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadAllData}
              sx={{
                borderRadius: 12,
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'white',
                backdropFilter: 'blur(8px)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              Actualiser
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenOfferDialog}
              sx={{
                borderRadius: 12,
                bgcolor: '#FFFFFF',
                color: '#064E3B',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                '&:hover': { bgcolor: '#F0FDF4' },
              }}
            >
              Nouvelle Offre
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Notifications */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* KPI Highlights */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(10, 143, 92, 0.1)', color: '#0A8F5C', width: 56, height: 56, borderRadius: 3 }}>
              <LocalOffer fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                OFFRES EN COURS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {offers.length}{' '}
                <Typography component="span" variant="caption" sx={{ color: '#F59E0B', fontWeight: 700 }}>
                  ({pendingOffersCount} en attente)
                </Typography>
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', width: 56, height: 56, borderRadius: 3 }}>
              <Warehouse fontSize="medium" />
            </Avatar>
            <Box sx={{ width: '100%' }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                STOCKAGE GLOBAL
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {availableCapacity} / {totalCapacity} T
              </Typography>
              <LinearProgress
                variant="determinate"
                value={occupancyRate}
                sx={{ height: 6, borderRadius: 3, mt: 0.8, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#0284C7' } }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', width: 56, height: 56, borderRadius: 3 }}>
              <LocalShipping fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                COLLECTES ACTIVES
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {activeCollectionsCount}{' '}
                <Typography component="span" variant="caption" color="textSecondary">
                  / {collections.length} total
                </Typography>
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2.5, borderRadius: 3.5, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'white' }}>
            <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', width: 56, height: 56, borderRadius: 3 }}>
              <TrendingUp fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                VOLUME VALORISÉ
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {totalTonnageTraded.toLocaleString()} Tonnes
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper sx={{ borderRadius: 3.5, mb: 3, bgcolor: 'white' }}>
        <Tabs
          value={tabValue}
          onChange={(_, val) => setTabValue(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: '1px solid #E2E8F0',
            '& .MuiTab-root': { fontWeight: 700, py: 2, textTransform: 'none', fontSize: '0.92rem' },
            '& .Mui-selected': { color: '#0A8F5C !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#0A8F5C', height: 3, borderRadius: 2 },
          }}
        >
          <Tab icon={<LocalOffer fontSize="small" />} iconPosition="start" label={`Offres de Rachat (${offers.length})`} />
          <Tab icon={<Warehouse fontSize="small" />} iconPosition="start" label={`Centres de Stockage (${facilities.length})`} />
          <Tab icon={<LocalShipping fontSize="small" />} iconPosition="start" label={`Suivi Collectes (${collections.length})`} />
          <Tab icon={<AltRoute fontSize="small" />} iconPosition="start" label="Optimiseur de Tournée IA" />
          <Tab icon={<Business fontSize="small" />} iconPosition="start" label={`Entreprises Partenaires (${companies.length})`} />
        </Tabs>
      </Paper>

      {/* ========================================================================= */}
      {/* TAB 0: OFFRES & NÉGOCIATIONS */}
      {/* ========================================================================= */}
      <CustomTabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
            🤝 Offres et Contrats de Valorisation
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenOfferDialog}
            sx={{ borderRadius: 12 }}
          >
            Créer une Offre
          </Button>
        </Box>

        {offers.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#F8FAFC', border: '2px dashed #CBD5E1' }}>
            <LocalOffer sx={{ fontSize: 64, color: '#94A3B8', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
              Aucune offre de rachat pour l'instant
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
              Les industriels et recycleurs peuvent soumettre des offres d'achat pour valoriser les déchets agricoles déclarés.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenOfferDialog}
              sx={{ borderRadius: 12 }}
            >
              Soumettre une première offre
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {offers.map((offer) => (
              <Grid item xs={12} md={6} lg={4} key={offer.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: 'rgba(10, 143, 92, 0.1)', color: '#0A8F5C', fontSize: '1.4rem' }}>
                          {getWasteTypeIcon(offer.waste_type || '')}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                            {getWasteTypeLabel(offer.waste_type || 'Déchet')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Agriculteur: <strong>{offer.farmer_name || 'Agriculteur'}</strong>
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={getStatusLabel(offer.status)}
                        size="small"
                        color={getStatusColor(offer.status) as any}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 3, mb: 2, border: '1px solid #E2E8F0' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Quantité Proposée
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#0A8F5C' }}>
                            {offer.quantity} Tonnes
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Prix Unitaire
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>
                            {offer.price_per_unit} TND/T
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 0.5 }} />
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                            <Typography variant="caption" color="textSecondary">Total Contrat</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                              {offer.total_price?.toLocaleString()} TND
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Business fontSize="small" sx={{ color: '#0284C7' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        Acheteur : {offer.company_name || 'Entreprise Partenaire'}
                      </Typography>
                    </Box>

                    {offer.waste_location && (
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <LocationOn fontSize="small" sx={{ color: '#64748B' }} />
                        <Typography variant="caption" color="textSecondary">
                          {offer.waste_location}
                        </Typography>
                      </Box>
                    )}

                    {offer.message && (
                      <Typography variant="caption" sx={{ mt: 1.5, display: 'block', p: 1.5, bgcolor: '#F1F5F9', borderRadius: 2, fontStyle: 'italic', color: '#475569' }}>
                        "{offer.message}"
                      </Typography>
                    )}
                  </CardContent>

                  <Divider />
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#FAFBFC' }}>
                    <IconButton size="small" color="error" onClick={() => handleDeleteOffer(offer.id)}>
                      <Delete fontSize="small" />
                    </IconButton>

                    <Stack direction="row" spacing={1}>
                      {offer.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                            sx={{ borderRadius: 10 }}
                          >
                            Refuser
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                            sx={{ borderRadius: 10 }}
                          >
                            Accepter
                          </Button>
                        </>
                      )}

                      {offer.status === 'accepted' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<LocalShipping />}
                          onClick={() => {
                            setNewCollection({
                              ...newCollection,
                              offer_id: offer.id,
                              pickup_location: offer.waste_location || 'Ferme source',
                              destination: offer.company_name || 'Usine acheteur',
                            });
                            setOpenCollectionDialog(true);
                          }}
                          sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
                        >
                          Planifier Collecte
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CustomTabPanel>

      {/* ========================================================================= */}
      {/* TAB 1: CENTRES DE STOCKAGE */}
      {/* ========================================================================= */}
      <CustomTabPanel value={tabValue} index={1}>
        {/* Recommender Tool Banner */}
        <Paper
          sx={{
            p: 3.5,
            mb: 4,
            borderRadius: 4,
            bgcolor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.1)',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <AutoAwesome sx={{ color: '#10B981', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#065F46' }}>
              Recommandation Géospatiale & IA de Stockage
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#047857', mb: 3 }}>
            Calculez en temps réel le meilleur centre de stockage selon votre gisement, volume, et proximité géographique.
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Type de Déchet"
                value={recWasteType}
                onChange={(e) => setRecWasteType(e.target.value)}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="olive_pomace">🫒 Grignon d'olive</MenuItem>
                <MenuItem value="olive_pits">🫒 Noyaux d'olive</MenuItem>
                <MenuItem value="crop_residues">🌾 Résidus de culture</MenuItem>
                <MenuItem value="pruning_residues">✂️ Résidus de taille</MenuItem>
                <MenuItem value="date_residues">🌴 Résidus de dattes</MenuItem>
                <MenuItem value="vine_residues">🍇 Résidus de vigne</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Volume (Tonnes)"
                value={recQuantity}
                onChange={(e) => setRecQuantity(Number(e.target.value))}
                sx={{ bgcolor: 'white' }}
              />
            </Grid>

            <Grid item xs={6} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Rayon Max (km)"
                value={recMaxDist}
                onChange={(e) => setRecMaxDist(Number(e.target.value))}
                sx={{ bgcolor: 'white' }}
              />
            </Grid>

            <Grid item xs={12} sm={2.5}>
              <TextField
                fullWidth
                size="small"
                label="GPS (Latitude, Longitude)"
                value={`${recLat}, ${recLon}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  if (parts.length === 2) {
                    setRecLat(parseFloat(parts[0]) || 0);
                    setRecLon(parseFloat(parts[1]) || 0);
                  }
                }}
                sx={{ bgcolor: 'white' }}
              />
            </Grid>

            <Grid item xs={12} sm={2.5}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Speed />}
                onClick={handleRunRecommender}
                disabled={recLoading}
                sx={{ height: 40, borderRadius: 12 }}
              >
                {recLoading ? 'Calcul IA...' : 'Trouver les Hubs'}
              </Button>
            </Grid>
          </Grid>

          {/* Results Display */}
          {recommendations.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#065F46', mb: 1.5 }}>
                🎯 Centres Recommandés par Pertinence ({recommendations.length}) :
              </Typography>
              <Grid container spacing={2}>
                {recommendations.map((rec) => (
                  <Grid item xs={12} md={4} key={rec.facility_id}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white', border: '1.5px solid #86EFAC' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {rec.facility_name}
                        </Typography>
                        <Chip
                          label={`Score ${rec.match_score}/100`}
                          size="small"
                          color={rec.match_score >= 70 ? 'success' : 'primary'}
                          sx={{ fontWeight: 800 }}
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                        📍 {rec.location} • <strong>{rec.distance_km} km</strong>
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Disponibilité : <strong>{rec.available_capacity} Tonnes</strong> • Coût : <strong>{rec.storage_cost_per_unit} TND/T/mois</strong>
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Facilities List */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Centres de Stockage & Silos
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenFacilityDialog(true)}
            sx={{ borderRadius: 12 }}
          >
            Ajouter un Centre
          </Button>
        </Box>

        <Grid container spacing={3}>
          {facilities.map((fac) => {
            const used = fac.total_capacity - fac.available_capacity;
            const pct = fac.total_capacity > 0 ? Math.round((used / fac.total_capacity) * 100) : 0;

            return (
              <Grid item xs={12} md={6} lg={4} key={fac.id}>
                <Card sx={{ height: '100%', bgcolor: 'white' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {fac.name}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => handleDeleteFacility(fac.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                      <LocationOn fontSize="small" sx={{ color: '#0A8F5C' }} />
                      {fac.location}
                    </Typography>

                    <Box sx={{ mb: 2.5 }}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                          Occupation ({pct}%)
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>
                          {used} / {fac.total_capacity} T
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': { bgcolor: pct > 85 ? '#EF4444' : '#10B981' },
                        }}
                      />
                    </Box>

                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }} display="block">
                      Filières de déchets acceptées :
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.8} mb={2}>
                      {fac.accepted_waste_types.split(',').map((t, idx) => (
                        <Chip key={idx} label={getWasteTypeLabel(t.trim())} size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 600 }} />
                      ))}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="body2" color="textSecondary">
                      Tarif : <strong>{fac.storage_cost_per_unit} TND / tonne / mois</strong>
                    </Typography>

                    {fac.description && (
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#64748B', fontStyle: 'italic' }}>
                        {fac.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CustomTabPanel>

      {/* ========================================================================= */}
      {/* TAB 2: COLLECTES & SUIVI LOGISTIQUE */}
      {/* ========================================================================= */}
      <CustomTabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Suivi des Ordres de Collecte & Transport
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCollectionDialog(true)}
            sx={{ borderRadius: 12 }}
          >
            Programmer Collecte
          </Button>
        </Box>

        {collections.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#F8FAFC', border: '2px dashed #CBD5E1' }}>
            <LocalShipping sx={{ fontSize: 64, color: '#94A3B8', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
              Aucun ordre de transport actif
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 450, mx: 'auto' }}>
              Dès qu'une offre est acceptée, vous pouvez générer un ordre de collecte avec traçabilité complète.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenCollectionDialog(true)}
              sx={{ borderRadius: 12 }}
            >
              Créer une collecte
            </Button>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {collections.map((col) => {
              const activeStep = getCollectionStepIndex(col.status);

              return (
                <Card key={col.id} sx={{ bgcolor: 'white', p: 1 }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalShipping sx={{ color: '#0A8F5C' }} />
                          Ordre #{col.id.slice(0, 8)} • {getWasteTypeLabel(col.waste_type || 'Déchet')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Agriculteur : {col.farmer_name || 'Agriculteur'} • Destinataire : {col.company_name || col.destination}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={getStatusLabel(col.status)}
                          color={getStatusColor(col.status) as any}
                          size="small"
                          sx={{ fontWeight: 800 }}
                        />
                        <IconButton size="small" color="error" onClick={() => handleDeleteCollection(col.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {col.status !== 'cancelled' ? (
                      <Box sx={{ my: 3, px: { xs: 0, sm: 2 } }}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                          {collectionSteps.map((label) => (
                            <Step key={label}>
                              <StepLabel>{label}</StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>
                    ) : (
                      <Alert severity="error" sx={{ my: 2, borderRadius: 2 }}>
                        Cette collecte a été annulée
                      </Alert>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="textSecondary" display="block">Départ (Ferme)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          📍 {col.pickup_location}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="textSecondary" display="block">Destination / Hub</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          🏭 {col.storage_facility_name || col.destination}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary" display="block">Volume</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0A8F5C' }}>
                          ⚖️ {col.quantity} Tonnes
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="textSecondary" display="block">Distance & Coût</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          🛣️ {col.estimated_distance_km || 0} km ({col.transport_cost || 0} TND)
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                      {col.status === 'scheduled' && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleUpdateCollectionStatus(col.id, 'picked_up')}
                          sx={{ borderRadius: 10 }}
                        >
                          Marquer Ramassé
                        </Button>
                      )}
                      {col.status === 'picked_up' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="info"
                          onClick={() => handleUpdateCollectionStatus(col.id, 'in_transit')}
                          sx={{ borderRadius: 10 }}
                        >
                          Marquer En Transit
                        </Button>
                      )}
                      {col.status === 'in_transit' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          onClick={() => handleUpdateCollectionStatus(col.id, 'delivered')}
                          sx={{ borderRadius: 10 }}
                        >
                          Marquer Livré
                        </Button>
                      )}
                      {col.status === 'delivered' && col.storage_facility_id && (
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          onClick={() => handleUpdateCollectionStatus(col.id, 'stored')}
                          sx={{ borderRadius: 10 }}
                        >
                          Entrer en Stockage
                        </Button>
                      )}
                      {col.status !== 'stored' && col.status !== 'cancelled' && (
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          onClick={() => handleUpdateCollectionStatus(col.id, 'cancelled')}
                        >
                          Annuler
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </CustomTabPanel>

      {/* ========================================================================= */}
      {/* TAB 3: OPTIMISEUR DE TOURNÉE */}
      {/* ========================================================================= */}
      <CustomTabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 3.5, borderRadius: 4, mb: 4, bgcolor: 'white' }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <AltRoute sx={{ color: '#0A8F5C', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Optimiseur d'Itinéraire Multi-Fermes
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            L'algorithme calcule le plus court chemin pour ramasser plusieurs lots de fermes voisines et les acheminer vers le hub de stockage le plus proche.
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                1. Hub de Stockage Destination
              </Typography>
              <TextField
                fullWidth
                select
                size="small"
                label="Sélectionner le Hub"
                value={selectedPlanStorage}
                onChange={(e) => setSelectedPlanStorage(e.target.value)}
                sx={{ mb: 2.5 }}
              >
                {facilities.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name} ({f.location}) - Dispo: {f.available_capacity} T
                  </MenuItem>
                ))}
              </TextField>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                2. Fermes / Lots à Collecter
              </Typography>
              <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 260, overflowY: 'auto', borderRadius: 3 }}>
                {availableWastes.length === 0 ? (
                  <Typography variant="caption" color="textSecondary">
                    Aucun gisement disponible
                  </Typography>
                ) : (
                  availableWastes.map((w) => (
                    <Box
                      key={w.id}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        cursor: 'pointer',
                        bgcolor: selectedPlanWastes.includes(w.id) ? 'rgba(10, 143, 92, 0.1)' : '#F8FAFC',
                        border: selectedPlanWastes.includes(w.id) ? '1.5px solid #0A8F5C' : '1px solid #E2E8F0',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => {
                        setSelectedPlanWastes((prev) =>
                          prev.includes(w.id) ? prev.filter((id) => id !== w.id) : [...prev, w.id]
                        );
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {getWasteTypeIcon(w.waste_type)} {getWasteTypeLabel(w.waste_type)} ({w.quantity} T)
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        📍 {w.location} • {w.farmer_name || 'Agriculteur'}
                      </Typography>
                    </Box>
                  ))
                )}
              </Paper>

              <Button
                fullWidth
                variant="contained"
                startIcon={<Navigation />}
                onClick={handleRunPlanOptimizer}
                disabled={planLoading || selectedPlanWastes.length === 0 || !selectedPlanStorage}
                sx={{ mt: 3, py: 1.4, borderRadius: 12 }}
              >
                {planLoading ? 'Calcul optimal...' : "Optimiser l'Itinéraire"}
              </Button>
            </Grid>

            <Grid item xs={12} md={7}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                3. Feuille de Route Optimisée
              </Typography>

              {!collectionPlanResult ? (
                <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 4, border: '2px dashed #CBD5E1' }}>
                  <Route sx={{ fontSize: 56, color: '#94A3B8', mb: 1.5 }} />
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                    Sélectionnez un hub et vos lots de déchets pour générer l'ordre de passage optimal.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ p: 3, bgcolor: '#F8FAFC', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0A8F5C' }}>
                      Tournée Optimale ({collectionPlanResult.number_of_farms} Fermes)
                    </Typography>
                    <Chip
                      label={`Total : ${collectionPlanResult.estimated_total_distance_km} km`}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>

                  <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5 }}>
                    {collectionPlanResult.recommendation}
                  </Alert>

                  <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                        <TableRow>
                          <TableCell><strong>Étape</strong></TableCell>
                          <TableCell><strong>Ferme</strong></TableCell>
                          <TableCell><strong>Quantité</strong></TableCell>
                          <TableCell><strong>Distance au Hub</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {collectionPlanResult.collection_stops.map((stop, index) => (
                          <TableRow key={stop.waste_id}>
                            <TableCell>
                              <Avatar sx={{ width: 26, height: 26, fontSize: 13, bgcolor: '#0A8F5C', fontWeight: 700 }}>
                                {index + 1}
                              </Avatar>
                            </TableCell>
                            <TableCell>{stop.location}</TableCell>
                            <TableCell><strong>{stop.quantity} T</strong></TableCell>
                            <TableCell>{stop.distance_to_storage_km} km</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Volume Total : {collectionPlanResult.total_quantity} Tonnes
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Destination : {collectionPlanResult.storage_facility.name}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      </CustomTabPanel>

      {/* ========================================================================= */}
      {/* TAB 4: ENTREPRISES PARTENAIRES */}
      {/* ========================================================================= */}
      <CustomTabPanel value={tabValue} index={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
            Entreprises & Acheteurs Industriels
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCompanyDialog(true)}
            sx={{ borderRadius: 12 }}
          >
            Ajouter une Entreprise
          </Button>
        </Box>

        <Grid container spacing={3}>
          {companies.map((comp) => {
            const interests =
              typeof comp.waste_interests === 'string'
                ? comp.waste_interests.split(',')
                : Array.isArray(comp.waste_interests)
                ? comp.waste_interests
                : [];

            return (
              <Grid item xs={12} sm={6} md={4} key={comp.id}>
                <Card sx={{ bgcolor: 'white', height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {comp.company_name}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => companyService.deleteCompany(comp.id).then(loadAllData)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }} display="block">
                      Filières recherchées :
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.8} mb={2}>
                      {interests.map((t, idx) => (
                        <Chip key={idx} label={getWasteTypeLabel(t.trim())} size="small" sx={{ bgcolor: '#E8F5E9', color: '#166534', fontWeight: 600 }} />
                      ))}
                    </Box>

                    <Typography variant="body2" color="textSecondary" display="block">
                      Quantité Min : <strong>{comp.min_quantity} Tonnes</strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" display="block">
                      Rayon d'Approvisionnement : <strong>{comp.max_distance} km</strong>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </CustomTabPanel>

      {/* ========================================================================= */}
      {/* DIALOG: NOUVELLE OFFRE DE RACHAT */}
      {/* ========================================================================= */}
      <Dialog open={openOfferDialog} onClose={() => setOpenOfferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>🤝 Soumettre une Offre de Rachat</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Waste Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Déchet Agricole Source
              </Typography>
              <TextField
                fullWidth
                select
                size="small"
                value={newOffer.waste_id}
                onChange={(e) => {
                  const wid = e.target.value;
                  const found = availableWastes.find((w) => w.id === wid);
                  setNewOffer({
                    ...newOffer,
                    waste_id: wid,
                    quantity: found?.quantity || 10,
                    price_per_unit: found?.price_per_unit || 45,
                  });
                }}
              >
                {availableWastes.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {getWasteTypeIcon(w.waste_type)} {getWasteTypeLabel(w.waste_type)} • {w.quantity} T ({w.location} - Par {w.farmer_name || 'Agriculteur'})
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Buying Company Mode Selector */}
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
                  value={newOffer.company_id}
                  onChange={(e) => setNewOffer({ ...newOffer, company_id: e.target.value })}
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
                  size="small"
                  type="number"
                  label="Quantité Souhaitée (T)"
                  value={newOffer.quantity}
                  onChange={(e) => setNewOffer({ ...newOffer, quantity: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Prix Proposé (TND/T)"
                  value={newOffer.price_per_unit}
                  onChange={(e) => setNewOffer({ ...newOffer, price_per_unit: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <Paper elevation={0} sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: 3, border: '1px solid #BBF7D0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 600 }}>
                  Montant Total Estimé de la Transaction :
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#065F46' }}>
                  {(newOffer.quantity * newOffer.price_per_unit).toLocaleString()} TND
                </Typography>
              </Box>
            </Paper>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Message / Conditions de collecte"
              value={newOffer.message}
              onChange={(e) => setNewOffer({ ...newOffer, message: e.target.value })}
              placeholder="Précisez vos modalités de paiement, créneau de ramassage..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenOfferDialog(false)} sx={{ borderRadius: 10 }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateOffer}
            disabled={!newOffer.waste_id || (!newOffer.company_id && !inlineCompanyName)}
            sx={{ borderRadius: 10 }}
          >
            Envoyer l'Offre
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: NOUVEAU CENTRE DE STOCKAGE */}
      {/* ========================================================================= */}
      <Dialog open={openFacilityDialog} onClose={() => setOpenFacilityDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>🏭 Ajouter un Hub de Stockage</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Nom du Hub"
              value={newFacility.name}
              onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
              placeholder="Ex: Hub Régional Sfax Nord"
            />
            <TextField
              fullWidth
              label="Localisation (Ville, Région)"
              value={newFacility.location}
              onChange={(e) => setNewFacility({ ...newFacility, location: e.target.value })}
              placeholder="Ex: Sfax, Tunisie"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Latitude"
                  value={newFacility.latitude}
                  onChange={(e) => setNewFacility({ ...newFacility, latitude: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Longitude"
                  value={newFacility.longitude}
                  onChange={(e) => setNewFacility({ ...newFacility, longitude: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Capacité Totale (T)"
                  value={newFacility.total_capacity}
                  onChange={(e) =>
                    setNewFacility({
                      ...newFacility,
                      total_capacity: Number(e.target.value),
                      available_capacity: Number(e.target.value),
                    })
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Coût (TND/T/mois)"
                  value={newFacility.storage_cost_per_unit}
                  onChange={(e) => setNewFacility({ ...newFacility, storage_cost_per_unit: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Déchets Acceptés (virgules)"
              value={newFacility.accepted_waste_types}
              onChange={(e) => setNewFacility({ ...newFacility, accepted_waste_types: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description"
              value={newFacility.description}
              onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenFacilityDialog(false)} sx={{ borderRadius: 10 }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateFacility}
            disabled={!newFacility.name || !newFacility.location}
            sx={{ borderRadius: 10 }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: NOUVELLE COLLECTE */}
      {/* ========================================================================= */}
      <Dialog open={openCollectionDialog} onClose={() => setOpenCollectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>🚚 Programmer un Ordre de Collecte</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              select
              label="Offre Acceptée"
              value={newCollection.offer_id}
              onChange={(e) => {
                const offId = e.target.value;
                const found = offers.find((o) => o.id === offId);
                setNewCollection({
                  ...newCollection,
                  offer_id: offId,
                  pickup_location: found?.waste_location || 'Ferme source',
                  destination: found?.company_name || 'Destination de valorisation',
                });
              }}
            >
              {offers
                .filter((o) => o.status === 'accepted')
                .map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    {getWasteTypeIcon(o.waste_type || '')} {getWasteTypeLabel(o.waste_type || 'Déchet')} ({o.quantity} T) - {o.company_name}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              fullWidth
              label="Lieu de Ramassage (Ferme Source)"
              value={newCollection.pickup_location}
              onChange={(e) => setNewCollection({ ...newCollection, pickup_location: e.target.value })}
            />

            <TextField
              fullWidth
              label="Destination (Usine / Acheteur)"
              value={newCollection.destination}
              onChange={(e) => setNewCollection({ ...newCollection, destination: e.target.value })}
            />

            <TextField
              fullWidth
              select
              label="Centre de Stockage Assigné (Optionnel)"
              value={newCollection.storage_facility_id}
              onChange={(e) => setNewCollection({ ...newCollection, storage_facility_id: e.target.value })}
            >
              <MenuItem value="">Aucun (Livraison directe)</MenuItem>
              {facilities.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name} ({f.location})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Distance (km)"
                  value={newCollection.estimated_distance_km}
                  onChange={(e) => setNewCollection({ ...newCollection, estimated_distance_km: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Coût Transport (TND)"
                  value={newCollection.transport_cost}
                  onChange={(e) => setNewCollection({ ...newCollection, transport_cost: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCollectionDialog(false)} sx={{ borderRadius: 10 }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateCollection}
            disabled={!newCollection.offer_id || !newCollection.pickup_location || !newCollection.destination}
            sx={{ borderRadius: 10 }}
          >
            Confirmer la Collecte
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: NOUVELLE ENTREPRISE */}
      {/* ========================================================================= */}
      <Dialog open={openCompanyDialog} onClose={() => setOpenCompanyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>🏢 Enregistrer une Entreprise Acheteuse</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Nom de l'Entreprise"
              value={newCompany.company_name}
              onChange={(e) => setNewCompany({ ...newCompany, company_name: e.target.value })}
              placeholder="Ex: BioEnergy Solutions Tunisie..."
            />
            <TextField
              fullWidth
              label="Filières Recherchées (séparées par virgules)"
              value={newCompany.waste_interests.join(', ')}
              onChange={(e) =>
                setNewCompany({
                  ...newCompany,
                  waste_interests: e.target.value.split(',').map((s) => s.trim()),
                })
              }
              placeholder="olive_pomace, crop_residues, olive_pits"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantité Minimale (T)"
                  value={newCompany.min_quantity}
                  onChange={(e) => setNewCompany({ ...newCompany, min_quantity: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rayon Approvisionnement (km)"
                  value={newCompany.max_distance}
                  onChange={(e) => setNewCompany({ ...newCompany, max_distance: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCompanyDialog(false)} sx={{ borderRadius: 10 }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateCompany}
            disabled={!newCompany.company_name}
            sx={{ borderRadius: 10 }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplyChain;

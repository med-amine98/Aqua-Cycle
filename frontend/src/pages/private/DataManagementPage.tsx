import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Paper,
  Button,
  LinearProgress,
  Avatar,
  Divider,
  Tooltip,
  Fade,
  Grow,
  Zoom,
  Stack,
} from '@mui/material';
import {
  Agriculture,
  WaterDrop,
  Delete,
  Edit,
  Grass,
  Science,
  Refresh,
  Add,
  LocationOn,
  CalendarToday,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { farmService } from '../../services/farmService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const DataManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [waterData, setWaterData] = useState<any[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [animateCards, setAnimateCards] = useState(false);
  const [farmsLoading, setFarmsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const farmsData = await farmService.getFarms();
      const farmsList = Array.isArray(farmsData) ? farmsData : farmsData?.data || [];
      setFarms(farmsList);
      
      if (farmsList.length > 0) {
        const farmId = farmsList[0].id;
        setSelectedFarmId(farmId);
        await loadFarmData(farmId);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimateCards(true), 300);
    }
  };

  const loadFarmData = async (farmId: string) => {
    setFarmsLoading(true);
    try {
      const cropsData = await farmService.getCrops(farmId);
      setCrops(Array.isArray(cropsData) ? cropsData : cropsData?.data || []);
      
      const waterData = await farmService.getWaterData(farmId);
      setWaterData(Array.isArray(waterData) ? waterData : waterData?.data || []);
    } catch (error) {
      console.error('Erreur de chargement des données:', error);
    } finally {
      setFarmsLoading(false);
    }
  };

  const handleDeleteCrop = async (id: string) => {
    if (window.confirm('Supprimer cette culture ?')) {
      try {
        await farmService.deleteCrop(selectedFarmId, id);
        setCrops(crops.filter(c => c.id !== id));
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleDeleteWater = async (id: string) => {
    if (window.confirm('Supprimer cette donnée d\'eau ?')) {
      try {
        setWaterData(waterData.filter(w => w.id !== id));
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
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

  const getStageEmoji = (stage: string) => {
    const emojis: Record<string, string> = {
      'Semis': '🌱',
      'Végétatif': '🌿',
      'Floraison': '🌸',
      'Fructification': '🍎',
      'Maturation': '🌾',
      'Récolte': '🚜',
    };
    return emojis[stage] || '🌱';
  };

  const getCropTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Céréales': '🌾',
      'Légumes': '🥬',
      'Fruits': '🍎',
      'Oliviers': '🫒',
      'Vignes': '🍇',
      'Dattes': '🌴',
      'Légumineuses': '🫘',
      'Autre': '🌱',
    };
    return icons[type] || '🌱';
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
        <Typography align="center" sx={{ mt: 3, color: '#4A5A6E' }}>
          📊 Chargement de vos données...
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
            📊 Gestion des données
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {farms.length > 0 ? `${farms[0]?.name} - ${crops.length} cultures, ${waterData.length} relevés d'eau` : 'Aucune exploitation'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadData}
          size="small"
          sx={{ borderRadius: 10 }}
        >
          Actualiser
        </Button>
      </Box>

      {farms.length === 0 ? (
        <Fade in={true}>
          <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Agriculture sx={{ fontSize: 80, color: '#ccc' }} />
              <Typography variant="h5" color="textSecondary" sx={{ mt: 3 }}>
                ⚠️ Aucune ferme trouvée
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Créez d'abord une ferme pour gérer vos données
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/farms'}
                sx={{ bgcolor: '#0A8F5C', borderRadius: 10, px: 4 }}
              >
                Créer ma ferme
              </Button>
            </CardContent>
          </Card>
        </Fade>
      ) : (
        <>
          {/* Sélecteur de ferme */}
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" color="textSecondary">
              🏡 Ferme:
            </Typography>
            <Chip
              label={farms[0]?.name}
              icon={<Agriculture />}
              color="primary"
              variant="outlined"
            />
            <Typography variant="caption" color="textSecondary">
              {farms[0]?.location} • {farms[0]?.total_area} ha
            </Typography>
          </Paper>

          {/* Onglets */}
          <Tabs 
            value={tabValue} 
            onChange={(_, v) => setTabValue(v)} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.9rem',
              },
            }}
          >
            <Tab 
              icon={<Agriculture sx={{ fontSize: 20 }} />} 
              label={`🌾 Cultures (${crops.length})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<WaterDrop sx={{ fontSize: 20 }} />} 
              label={`💧 Données d'eau (${waterData.length})`} 
              iconPosition="start"
            />
          </Tabs>

          {farmsLoading ? (
            <Box sx={{ width: '100%', mt: 4 }}>
              <LinearProgress />
              <Typography align="center" sx={{ mt: 2, color: '#4A5A6E' }}>
                Chargement des données...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Onglet Cultures */}
              <TabPanel value={tabValue} index={0}>
                {crops.length === 0 ? (
                  <Fade in={true}>
                    <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Agriculture sx={{ fontSize: 64, color: '#ccc' }} />
                        <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                          Aucune culture enregistrée
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Ajoutez vos premières cultures depuis la gestion de l'eau
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => window.location.href = '/water'}
                          sx={{ mt: 2, bgcolor: '#0A8F5C', borderRadius: 10 }}
                        >
                          Ajouter une culture
                        </Button>
                      </CardContent>
                    </Card>
                  </Fade>
                ) : (
                  <Grid container spacing={2}>
                    {crops.map((crop, index) => (
                      <Grid item xs={12} sm={6} md={4} key={crop.id}>
                        <Grow in={animateCards} style={{ transitionDelay: `${index * 80}ms` }}>
                          <Card sx={{ 
                            height: '100%',
                            transition: 'all 0.3s ease',
                            borderRadius: 3,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                            }
                          }}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="h2" sx={{ fontSize: 32 }}>
                                    {getCropTypeIcon(crop.type)}
                                  </Typography>
                                  <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {crop.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {crop.variety} • {crop.type}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Tooltip title="Supprimer">
                                  <IconButton size="small" onClick={() => handleDeleteCrop(crop.id)} color="error">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>

                              <Divider sx={{ my: 2 }} />

                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">
                                    Superficie
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0A8F5C' }}>
                                    {crop.area} ha
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">
                                    Stade
                                  </Typography>
                                  <Chip
                                    label={`${getStageEmoji(crop.growth_stage)} ${crop.growth_stage}`}
                                    size="small"
                                    color={getStageColor(crop.growth_stage)}
                                    sx={{ mt: 0.5 }}
                                  />
                                </Grid>
                              </Grid>

                              <Box mt={2}>
                                <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                                  <CalendarToday sx={{ fontSize: 14 }} />
                                  Plantation: {formatDate(crop.planting_date)}
                                </Typography>
                                {crop.notes && (
                                  <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                    📝 {crop.notes}
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grow>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </TabPanel>

              {/* Onglet Données d'eau */}
              <TabPanel value={tabValue} index={1}>
                {waterData.length === 0 ? (
                  <Fade in={true}>
                    <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <WaterDrop sx={{ fontSize: 64, color: '#ccc' }} />
                        <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                          Aucune donnée d'eau enregistrée
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Ajoutez vos premières données d'eau depuis la gestion de l'eau
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => window.location.href = '/water'}
                          sx={{ mt: 2, bgcolor: '#0A8F5C', borderRadius: 10 }}
                        >
                          Ajouter des données d'eau
                        </Button>
                      </CardContent>
                    </Card>
                  </Fade>
                ) : (
                  <Grid container spacing={2}>
                    {waterData.map((data, index) => (
                      <Grid item xs={12} sm={6} md={4} key={data.id || index}>
                        <Grow in={animateCards} style={{ transitionDelay: `${index * 80}ms` }}>
                          <Card sx={{ 
                            height: '100%',
                            transition: 'all 0.3s ease',
                            borderRadius: 3,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                            }
                          }}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ bgcolor: '#E3F2FD', width: 40, height: 40 }}>
                                    <WaterDrop sx={{ color: '#1A6EB5' }} />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                      {data.source}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Source d'eau
                                    </Typography>
                                  </Box>
                                </Box>
                                <Tooltip title="Supprimer">
                                  <IconButton size="small" onClick={() => handleDeleteWater(data.id || data._id)} color="error">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>

                              <Divider sx={{ my: 2 }} />

                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">
                                    Volume
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A6EB5' }}>
                                    {data.volume} m³
                                  </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="textSecondary">
                                    Statut
                                  </Typography>
                                  <Chip
                                    label={data.status === 'done' ? '✅ Réalisé' : '⏳ Planifié'}
                                    size="small"
                                    color={data.status === 'done' ? 'success' : 'warning'}
                                    sx={{ mt: 0.5 }}
                                  />
                                </Grid>
                              </Grid>

                              <Box mt={2}>
                                <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                                  <CalendarToday sx={{ fontSize: 14 }} />
                                  {formatDate(data.date)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                  Utilisation: {data.used_for || data.usedFor || 'Non spécifiée'}
                                </Typography>
                                {data.notes && (
                                  <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                    📝 {data.notes}
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grow>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </TabPanel>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default DataManagementPage;
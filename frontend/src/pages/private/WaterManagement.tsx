import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Tabs,
  Tab,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Refresh,
  Calculate,
  WaterDrop,
  Agriculture,
  Warning,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import CropManager, { CropData } from '../../components/CropManager';
import WaterManager from '../../components/WaterManager';
import RandomForestWaterChart from '../../components/RandomForestWaterChart';
import AtmosphericMapPredictor from '../../components/AtmosphericMapPredictor';
import { farmService } from '../../services/farmService';
import { Psychology, Map as MapIcon } from '@mui/icons-material';

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

const extractData = (response: any): any => {
  if (!response) return null;
  if (Array.isArray(response)) return response;
  if (response.data) return response.data;
  if (response.results) return response.results;
  if (response.crops) return response.crops;
  if (response.items) return response.items;
  if (response.farms) return response.farms;
  return response;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'Date non définie';
  try {
    const date = new Date(dateStr);
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#D32F2F';
    case 'medium': return '#ED6C02';
    case 'low': return '#2E7D32';
    default: return '#1A6EB5';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'high': return <Warning sx={{ fontSize: 16 }} />;
    case 'medium': return <Info sx={{ fontSize: 16 }} />;
    case 'low': return <CheckCircle sx={{ fontSize: 16 }} />;
    default: return <Info sx={{ fontSize: 16 }} />;
  }
};

const WaterManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [crops, setCrops] = useState<CropData[]>([]);
  const [waterData, setWaterData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [farmId, setFarmId] = useState<string>('');
  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    setLoading(true);
    try {
      const response = await farmService.getFarms();
      const farmsData = extractData(response);
      const farmsArray = Array.isArray(farmsData) ? farmsData : [];
      setFarms(farmsArray);
      
      if (farmsArray.length > 0) {
        const firstFarmId = farmsArray[0].id;
        setFarmId(firstFarmId);
        await loadFarmData(firstFarmId);
      }
    } catch (error) {
      console.error('Erreur de chargement des fermes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFarmData = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const cleanFarmId = id.replace(/^\/+/, '');
      
      const cropsResponse = await farmService.getCrops(cleanFarmId);
      const cropsData = extractData(cropsResponse);
      setCrops(Array.isArray(cropsData) ? cropsData : []);
      
      const waterResponse = await farmService.getWaterData(cleanFarmId);
      const waterData = extractData(waterResponse);
      setWaterData(Array.isArray(waterData) ? waterData : []);
      
      const recsResponse = await farmService.getRecommendations(cleanFarmId);
      const recsData = extractData(recsResponse);
      setRecommendations(Array.isArray(recsData) ? recsData : []);
    } catch (error) {
      console.error('Erreur de chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFarmChange = (event: any) => {
    const newFarmId = event.target.value;
    setFarmId(newFarmId);
    loadFarmData(newFarmId);
  };

  const handleAddCrop = async (crop: CropData) => {
    if (!farmId) return;
    try {
      const response = await farmService.addCrop(farmId, crop);
      const newCrop = extractData(response);
      if (newCrop && typeof newCrop === 'object') {
        setCrops([...crops, newCrop as CropData]);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleUpdateCrop = async (id: string, crop: CropData) => {
    if (!farmId) return;
    try {
      const response = await farmService.updateCrop(farmId, id, crop);
      const updatedCrop = extractData(response);
      if (updatedCrop && typeof updatedCrop === 'object' && updatedCrop.id) {
        setCrops(crops.map(c => c.id === id ? updatedCrop as CropData : c));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteCrop = async (id: string) => {
    if (!farmId) return;
    try {
      await farmService.deleteCrop(farmId, id);
      setCrops(crops.filter(c => c.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleAddWater = async (data: any) => {
    if (!farmId) return;
    try {
      const response = await farmService.addWaterData(farmId, data);
      const newData = extractData(response);
      if (newData) {
        setWaterData([...waterData, newData]);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleUpdateWater = async (id: string, data: any) => {
    if (!farmId) return;
    try {
      setWaterData(waterData.map(d => d.id === id ? { ...d, ...data } : d));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteWater = async (id: string) => {
    if (!farmId) return;
    try {
      setWaterData(waterData.filter(d => d.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCalculate = async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const response = await farmService.getRecommendations(farmId);
      const recsData = extractData(response);
      setRecommendations(Array.isArray(recsData) ? recsData : []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
        <Typography align="center" sx={{ mt: 3, color: '#4A5A6E' }}>
          💧 Chargement de vos données...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WaterDrop sx={{ color: '#1A6EB5', fontSize: 32 }} />
            Gestion de l'eau
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {farms.length > 0 ? `${farms[0]?.name} - ${crops.length} cultures, ${waterData.length} relevés` : 'Aucune ferme sélectionnée'}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => loadFarmData(farmId)}
            sx={{ borderRadius: 10 }}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<Calculate />}
            onClick={handleCalculate}
            sx={{ bgcolor: '#0A8F5C', borderRadius: 10 }}
            disabled={!farmId}
          >
            Calculer les besoins
          </Button>
        </Box>
      </Box>

      {farms.length === 0 ? (
        <Fade in={true}>
          <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Agriculture sx={{ fontSize: 64, color: '#ccc' }} />
              <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                ⚠️ Aucune ferme trouvée
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Veuillez créer une ferme pour commencer à gérer l'eau
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/farms'}
                sx={{ mt: 2, bgcolor: '#0A8F5C', borderRadius: 10 }}
              >
                Créer ma ferme
              </Button>
            </CardContent>
          </Card>
        </Fade>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Ferme</InputLabel>
              <Select
                value={farmId}
                onChange={handleFarmChange}
                label="Ferme"
                size="small"
              >
                {farms.map((farm) => (
                  <MenuItem key={farm.id} value={farm.id}>
                    {farm.name} ({farm.location})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Chip
              label={`📍 ${farms.find(f => f.id === farmId)?.location || 'Non sélectionnée'}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`🌾 ${crops.length} cultures`}
              size="small"
              icon={<Agriculture />}
            />
            <Chip
              label={`💧 ${waterData.length} relevés`}
              size="small"
              icon={<WaterDrop />}
            />
          </Paper>

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
            <Tab 
              icon={<Info sx={{ fontSize: 20 }} />} 
              label={`📋 Recommandations (${recommendations.length})`} 
              iconPosition="start"
            />
            <Tab 
              icon={<Psychology sx={{ fontSize: 20, color: '#2E7D32' }} />} 
              label={`🤖 Prédiction ML (Random Forest)`} 
              iconPosition="start"
            />
            <Tab 
              icon={<MapIcon sx={{ fontSize: 20, color: '#00838F' }} />} 
              label={`🛰️ Prédictions Carte Atmosphérique`} 
              iconPosition="start"
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <CropManager
              crops={crops}
              onAdd={handleAddCrop}
              onUpdate={handleUpdateCrop}
              onDelete={handleDeleteCrop}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <WaterManager
              waterData={waterData}
              onAdd={handleAddWater}
              onUpdate={handleUpdateWater}
              onDelete={handleDeleteWater}
              onRefresh={() => loadFarmData(farmId)}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {recommendations.length > 0 ? (
              <Grid container spacing={2}>
                {recommendations.map((rec, idx) => (
                  <Grid item xs={12} md={6} key={idx}>
                    <Zoom in={true} style={{ transitionDelay: `${idx * 100}ms` }}>
                      <Card sx={{ 
                        borderLeft: `4px solid ${getPriorityColor(rec.priority)}`,
                        transition: 'all 0.3s ease',
                        borderRadius: 3,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                        }
                      }}>
                        <CardContent>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{ 
                                bgcolor: `${getPriorityColor(rec.priority)}15`, 
                                width: 32, 
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                {getPriorityIcon(rec.priority)}
                              </Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {rec.title}
                              </Typography>
                            </Box>
                            <Chip
                              label={rec.priority || 'medium'}
                              size="small"
                              sx={{
                                bgcolor: `${getPriorityColor(rec.priority)}15`,
                                color: getPriorityColor(rec.priority),
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {rec.description}
                          </Typography>
                          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                            <Chip
                              label={`💧 ${rec.volume} m³`}
                              size="small"
                              color="primary"
                            />
                            <Chip
                              label={`📅 ${formatDate(rec.date)}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={rec.status || 'En attente'}
                              size="small"
                              color={rec.status === 'applied' ? 'success' : 'warning'}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Fade in={true}>
                <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3, border: '2px dashed #ddd' }}>
                  <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <Info sx={{ fontSize: 64, color: '#ccc' }} />
                    <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                      Aucune recommandation disponible
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Ajoutez des cultures et des données d'eau pour recevoir des recommandations personnalisées
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setTabValue(0)}
                      sx={{ mt: 2, bgcolor: '#0A8F5C', borderRadius: 10 }}
                    >
                      Ajouter des cultures
                    </Button>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <RandomForestWaterChart />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <AtmosphericMapPredictor />
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default WaterManagement;
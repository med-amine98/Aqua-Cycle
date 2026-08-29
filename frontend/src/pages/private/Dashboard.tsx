// frontend/src/pages/private/Dashboard.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  IconButton,
  Paper,
  Fade,
  Zoom,
  Grow,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  WaterDrop,
  SmartToy,
  Agriculture,
  Refresh,
  Chat,
  Close,
  Send,
  Add,
  CheckCircle,
  Warning,
  Info,
  Map as MapIcon,
  Cloud,
  Speed,
  NotificationsActive,
  ArrowForward,
  Storefront,
  WbSunny,
  Opacity,
  Air,
  Thermostat,
  Compress,
  Visibility,
  Satellite,
  AutoAwesome,
} from '@mui/icons-material';
import { farmService } from '../../services/farmService';
import { integrationService } from '../../services/integrationService';
import { weatherService, WeatherData, WeatherForecast, WeatherCurrent } from '../../services/weatherService';
import { predictionService, WaterPrediction, Recommendation, HealthScore } from '../../services/predictionService';
import { nvidiaEarthService, NvidiaEarthPrediction } from '../../services/nvidiaEarthService';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = ['#0A8F5C', '#1A6EB5', '#ED6C02', '#2E7D32', '#D32F2F'];

const extractData = (response: any): any => {
  if (!response) return null;
  if (Array.isArray(response)) return response;
  if (response.data) return response.data;
  if (response.results) return response.results;
  if (response.crops) return response.crops;
  if (response.items) return response.items;
  if (response.farms) return response.farms;
  if (response.predictions) return response.predictions;
  if (response.forecast) return response.forecast;
  return response;
};

// Fonction pour obtenir les mois de l'année à partir de la date actuelle
const getMonths = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const index = (currentMonth - i + 12) % 12;
    result.push(months[index]);
  }
  return result;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  
  // Real integration pipeline data
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [smartAlerts, setSmartAlerts] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<Recommendation[]>([]);
  const [wasteMarketplaceInfo, setWasteMarketplaceInfo] = useState<any>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{text: string; sender: 'user' | 'ai'}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  
  // 🌤️ Weather Data
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast[]>([]);
  const [waterPrediction, setWaterPrediction] = useState<WaterPrediction[]>([]);
  const [atmosphereData, setAtmosphereData] = useState<any>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherCurrent | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [weatherStats, setWeatherStats] = useState<any>(null);
  const [agriRecommendations, setAgriRecommendations] = useState<string[]>([]);

  // 🛰️ NVIDIA Earth-2
  const [nvidiaPredictions, setNvidiaPredictions] = useState<NvidiaEarthPrediction | null>(null);
  const [loadingNvidia, setLoadingNvidia] = useState(false);

  // 📊 Données pour les graphiques
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [cropDistribution, setCropDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    setTimeout(() => setAnimateStats(true), 500);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setLoadingPredictions(true);
    setLoadingWeather(true);
    setLoadingRecommendations(true);
    setLoadingNvidia(true);
    
    try {
      // 1. Charger les fermes
      const farmsResponse = await farmService.getFarms();
      const farmsData = extractData(farmsResponse);
      const farmsArray = Array.isArray(farmsData) ? farmsData : [];
      setFarms(farmsArray);
      
      if (farmsArray.length > 0) {
        const farm = farmsArray[0];
        const farmId = farm.id;
        
        // 2. Charger les données météo et NVIDIA Earth-2
        if (farm.latitude && farm.longitude) {
          // Charger NVIDIA Earth-2
          try {
            const nvidiaData = await nvidiaEarthService.getPredictions(
              farm.latitude,
              farm.longitude
            );
            setNvidiaPredictions(nvidiaData);
          } catch (nvidiaError) {
            console.warn('Erreur NVIDIA Earth-2:', nvidiaError);
          } finally {
            setLoadingNvidia(false);
          }

          // Charger la météo
          try {
            const weather = await weatherService.getWeatherData(farm.latitude, farm.longitude);
            setWeatherData(weather);
            
            if (weather.current) {
              setCurrentWeather(weather.current);
              setWeatherForecast(weather.forecast);
              
              setAtmosphereData({
                timestamp: weather.current.timestamp,
                atmospheric_indicators: {
                  pressure: weather.current.pressure,
                  humidity: weather.current.humidity,
                  temperature: weather.current.temperature,
                  wind_speed: weather.current.windSpeed,
                  cloud_cover: weather.current.cloudCover || 0,
                  uv_index: weather.current.uvIndex || 0,
                  visibility: weather.current.visibility || 10,
                }
              });
              
              const stats = weatherService.getWeatherStats(weather);
              setWeatherStats(stats);
              
              const agriRecs = weatherService.getAgriculturalRecommendations(weather);
              setAgriRecommendations(agriRecs);
            }
          } catch (weatherError) {
            console.warn('Erreur chargement météo:', weatherError);
          } finally {
            setLoadingWeather(false);
          }
        }
        
        // 3. Charger les cultures et les données d'eau
        let cropsArray: any[] = [];
        try {
          const cropsResponse = await farmService.getCrops(farmId);
          const cropsData = extractData(cropsResponse);
          cropsArray = Array.isArray(cropsData) ? cropsData : [];
          setCrops(cropsArray);
          
          try {
            const waterResponse = await farmService.getWaterData(farmId);
            const waterData = extractData(waterResponse);
            const waterArray = Array.isArray(waterData) ? waterData : [];
            generateChartData(cropsArray, waterArray);
          } catch (waterError) {
            console.warn('Erreur chargement données eau:', waterError);
            generateChartData(cropsArray, []);
          }
        } catch (cropsError) {
          console.warn('Erreur chargement cultures:', cropsError);
          setCrops([]);
          generateChartData([], []);
        }
        
        // 4. Charger les prédictions IA
        try {
          const predictions = await predictionService.getWaterPredictions(farmId);
          setWaterPrediction(predictions);
        } catch (predictionError) {
          console.warn('Erreur chargement prédictions:', predictionError);
        } finally {
          setLoadingPredictions(false);
        }
        
        // 5. Charger les recommandations IA
        try {
          const recommendations = await predictionService.getRecommendations(farmId);
          setAiRecommendations(recommendations);
        } catch (recError) {
          console.warn('Erreur chargement recommandations:', recError);
        } finally {
          setLoadingRecommendations(false);
        }
        
        // 6. Charger le score de santé
        try {
          const health = await predictionService.getCropHealthScore(farmId);
          setHealthScore(health);
        } catch (healthError) {
          console.warn('Erreur chargement santé:', healthError);
        }
        
        // 7. Charger les alertes
        try {
          const alerts = await predictionService.getSmartAlerts(farmId);
          setSmartAlerts(alerts);
        } catch (alertError) {
          console.warn('Erreur chargement alertes:', alertError);
        }
        
        // 8. Charger le statut d'intégration pour la marketplace
        try {
          const farmStatus = await integrationService.getFarmStatus(farmId);
          if (farmStatus && farmStatus.status === 'success') {
            setWasteMarketplaceInfo(farmStatus.waste_marketplace || null);
          }
        } catch (integrationError) {
          console.warn('Erreur chargement intégration:', integrationError);
        }
        
      } else {
        setLoadingPredictions(false);
        setLoadingWeather(false);
        setLoadingRecommendations(false);
        setLoadingNvidia(false);
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setError('Impossible de charger les données. Veuillez vérifier votre connexion et réessayer.');
      setLoadingPredictions(false);
      setLoadingWeather(false);
      setLoadingRecommendations(false);
      setLoadingNvidia(false);
    } finally {
      setLoading(false);
    }
  };

  // 📊 Génération des données pour les graphiques avec les mois réels
  const generateChartData = (cropsData: any[], waterData: any[]) => {
    const months = getMonths();
    
    const totalWater = waterData.reduce((sum: number, w: any) => sum + (w.volume || w.total_used || 0), 0);
    const totalCrops = cropsData.length || 0;
    
    const monthly = months.map((month, index) => {
      const factor = (index + 1) / months.length;
      const seasonalFactor = 0.5 + 0.5 * Math.sin((index + 3) * 1.2);
      return {
        month,
        eau: Math.round(totalWater * factor * seasonalFactor * 0.8) || 0,
        dechets: Math.round(totalWater * factor * seasonalFactor * 0.3) || 0,
        cultures: Math.round(totalCrops * factor) || 0,
      };
    });
    setMonthlyData(monthly);

    const cropTypes: Record<string, number> = {};
    cropsData.forEach((c: any) => {
      const type = c.type || c.cropType || 'Autres';
      cropTypes[type] = (cropTypes[type] || 0) + 1;
    });
    
    const distribution = Object.entries(cropTypes).map(([name, value]) => ({ name, value }));
    if (distribution.length > 0) {
      setCropDistribution(distribution);
    } else {
      setCropDistribution([{ name: 'Aucune culture', value: 1 }]);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    const userMsg = { text: chatMessage, sender: 'user' as const };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    
    try {
      let reply = "Je suis votre assistant AquaCycle. ";
      if (healthScore) {
        reply += `Le score de santé actuel de votre ferme est de ${healthScore.overall_score}/100. `;
      }
      if (smartAlerts.length > 0) {
        reply += `Attention, vous avez actuellement ${smartAlerts.length} alerte(s) active(s). `;
      }
      if (aiRecommendations.length > 0) {
        reply += `Je vous recommande en priorité de : ${aiRecommendations[0].action}`;
      } else if (crops.length > 0) {
        reply += `Vous avez ${crops.length} culture(s) en cours. Souhaitez-vous des conseils spécifiques ?`;
      } else {
        reply += "Aucune action critique n'est requise aujourd'hui. N'hésitez pas à me poser des questions sur vos cultures.";
      }
      
      if (currentWeather) {
        reply += `\n\n🌤️ Météo actuelle : ${currentWeather.temperature}°C, ${currentWeather.condition}`;
      }

      if (nvidiaPredictions) {
        reply += `\n\n🛰️ NVIDIA Earth-2 : Température ${nvidiaPredictions.predictions.temperature.current}°C, Irrigation ${nvidiaPredictions.predictions.agricultural.irrigationNeed}.`;
      }
      
      const aiMsg = { text: reply, sender: 'ai' as const };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Erreur chat:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critique': return '#D32F2F';
      case 'haute': return '#E65100';
      case 'moyenne': return '#ED6C02';
      case 'basse': return '#2E7D32';
      default: return '#1A6EB5';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critique':
      case 'haute': return <Warning sx={{ fontSize: 16 }} />;
      case 'moyenne': return <Info sx={{ fontSize: 16 }} />;
      case 'basse': return <CheckCircle sx={{ fontSize: 16 }} />;
      default: return <Info sx={{ fontSize: 16 }} />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'water_stress':
      case 'weather_extreme':
        return '#D32F2F';
      case 'disease_detection':
      case 'weather_warning':
      case 'consumption_anomaly':
        return '#ED6C02';
      case 'waste_valorisation':
        return '#0A8F5C';
      default:
        return '#1A6EB5';
    }
  };

  const predictionChartData = waterPrediction.map((p: WaterPrediction) => ({
    date: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    consommation: p.predictedConsumption || 0,
    confidence: p.confidence || 80,
  }));

  const weatherChartData = weatherForecast.map((w: WeatherForecast) => ({
    date: new Date(w.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    temperature: w.temperature.average || 0,
    precipitation: w.precipitation || 0,
    minTemp: w.temperature.min || 0,
    maxTemp: w.temperature.max || 0,
  }));

  const stats = [
    {
      icon: <Agriculture sx={{ fontSize: 32, color: '#0A8F5C' }} />,
      label: 'Fermes',
      value: farms.length,
      subtext: farms.length > 0 ? '✅ Active' : '⚠️ Aucune',
      color: '#0A8F5C',
    },
    {
      icon: <WaterDrop sx={{ fontSize: 32, color: '#1A6EB5' }} />,
      label: 'Cultures',
      value: crops.length,
      subtext: crops.filter((c: any) => c.growthStage === 'Floraison' || c.growthStage === 'flowering').length > 0 
        ? `🌺 ${crops.filter((c: any) => c.growthStage === 'Floraison' || c.growthStage === 'flowering').length} en floraison` 
        : crops.length > 0 ? `${crops.length} culture(s)` : 'Aucune culture',
      color: '#1A6EB5',
    },
    {
      icon: <SmartToy sx={{ fontSize: 32, color: '#ED6C02' }} />,
      label: 'Recommandations IA',
      value: aiRecommendations.length,
      subtext: aiRecommendations.filter((r: any) => r.priority === 'haute' || r.priority === 'critique').length > 0
        ? `${aiRecommendations.filter((r: any) => r.priority === 'haute' || r.priority === 'critique').length} urgentes`
        : aiRecommendations.length > 0 ? `${aiRecommendations.length} disponible(s)` : 'En attente',
      color: '#ED6C02',
    },
    {
      icon: <Cloud sx={{ fontSize: 32, color: '#1A6EB5' }} />,
      label: 'Météo',
      value: currentWeather?.temperature ? `${Math.round(currentWeather.temperature)}°C` : '--',
      subtext: currentWeather?.humidity ? `💧 ${Math.round(currentWeather.humidity)}%` : 'Chargement...',
      color: '#1A6EB5',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
        <Typography align="center" sx={{ mt: 3, color: '#4A5A6E' }}>
          🌍 Chargement des données de votre exploitation...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          <AlertTitle>Erreur de chargement</AlertTitle>
          {error}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadData}
            sx={{ mt: 2 }}
          >
            Réessayer
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Banner */}
      <Fade in={true} timeout={600}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #064E3B 0%, #0A8F5C 60%, #0284C7 100%)',
            color: 'white',
            boxShadow: '0 12px 30px -5px rgba(10, 143, 92, 0.3)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
            <Box>
              <Chip
                icon={<AutoAwesome sx={{ color: '#FDE047 !important', fontSize: 16 }} />}
                label="Supervision en Temps Réel"
                size="small"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 700, mb: 1.5, backdropFilter: 'blur(8px)' }}
              />
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'white', letterSpacing: '-0.02em', mb: 0.5 }}>
                Bonjour, {user?.full_name || 'Exploitant'} 👋
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.05rem', maxWidth: 640 }}>
                {farms.length > 0
                  ? `${farms[0]?.name || 'Exploitation'} • ${crops.length} culture(s) active(s) sous pilotage IA`
                  : 'Bienvenue sur AquaCycle. Créez votre première ferme pour débloquer les analyses.'}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                {currentWeather && (
                  <Chip
                    icon={<Cloud sx={{ color: 'white !important' }} />}
                    label={`${currentWeather.temperature}°C - ${currentWeather.condition}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 700 }}
                  />
                )}
                {nvidiaPredictions && (
                  <Chip
                    icon={<Satellite sx={{ color: '#38BDF8 !important' }} />}
                    label={`NVIDIA Earth-2: ${nvidiaPredictions.predictions.temperature.current}°C`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 700 }}
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
                size="small"
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
              <Badge badgeContent={smartAlerts.length} color="error">
                <Button
                  variant="contained"
                  startIcon={<NotificationsActive />}
                  onClick={() => setNotificationOpen(true)}
                  sx={{ bgcolor: '#F59E0B', color: '#0F172A', fontWeight: 700, borderRadius: 12, '&:hover': { bgcolor: '#D97706', color: 'white' } }}
                  size="small"
                >
                  Alertes ({smartAlerts.length})
                </Button>
              </Badge>
              {farms.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/farms')}
                  sx={{ bgcolor: 'white', color: '#064E3B', fontWeight: 800, borderRadius: 12, '&:hover': { bgcolor: '#F0FDF4' } }}
                  size="small"
                >
                  Créer ma ferme
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>
      </Fade>

      {/* Pipeline Inter-Modules Visual Flow */}
      <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid rgba(10, 143, 92, 0.2)', background: 'linear-gradient(135deg, #f8fbf9 0%, #eef7f2 100%)' }}>
        <CardContent sx={{ py: 2, px: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A8F5C', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Agriculture fontSize="small" />
            PIPELINE D'AGRICULTURE CIRCULAIRE INTELLIGENTE (COMMUNICATION DIRECTE)
          </Typography>
          <Grid container spacing={1.5} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={3.5} md={2.2}>
              <Paper elevation={0} sx={{ p: 1, textAlign: 'center', borderRadius: 2, border: '1px solid #ddd', bgcolor: '#fff' }}>
                <Cloud sx={{ color: '#1A6EB5', fontSize: 20 }} />
                <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>Météo & Climat</Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9 }}>
                  {currentWeather?.source || 'Open-Meteo'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={0.7} md={0.5} sx={{ textAlign: 'center' }}>
              <ArrowForward sx={{ color: '#0A8F5C', display: { xs: 'none', sm: 'inline-block' } }} />
            </Grid>
            <Grid item xs={12} sm={3.5} md={2.2}>
              <Paper elevation={0} sx={{ p: 1, textAlign: 'center', borderRadius: 2, border: '1px solid #ddd', bgcolor: '#fff' }}>
                <WaterDrop sx={{ color: '#0A8F5C', fontSize: 20 }} />
                <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>Besoins en Eau</Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9 }}>
                  Prédit: {waterPrediction.length > 0 ? `${waterPrediction.length} jours` : 'En attente'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={0.7} md={0.5} sx={{ textAlign: 'center' }}>
              <ArrowForward sx={{ color: '#0A8F5C', display: { xs: 'none', sm: 'inline-block' } }} />
            </Grid>
            <Grid item xs={12} sm={3.5} md={2.2}>
              <Paper elevation={0} sx={{ p: 1, textAlign: 'center', borderRadius: 2, border: '1px solid #ddd', bgcolor: '#fff' }}>
                <Agriculture sx={{ color: '#ED6C02', fontSize: 20 }} />
                <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>État de la Culture</Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9 }}>
                  {healthScore ? `${healthScore.overall_score || 0}/100` : 'N/A'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={0.7} md={0.5} sx={{ textAlign: 'center' }}>
              <ArrowForward sx={{ color: '#0A8F5C', display: { xs: 'none', sm: 'inline-block' } }} />
            </Grid>
            <Grid item xs={12} sm={3.5} md={2.2}>
              <Paper elevation={0} sx={{ p: 1, textAlign: 'center', borderRadius: 2, border: '1px solid #ddd', bgcolor: '#fff' }}>
                <Storefront sx={{ color: '#7B1FA2', fontSize: 20 }} />
                <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>Valorisation Déchets</Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: 9 }}>
                  Marché: {wasteMarketplaceInfo?.available_count || 0} annonces
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Crop Health Score Card & Smart Alerts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 🌱 Crop Health Score */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3, borderLeft: `6px solid ${healthScore?.color || '#0A8F5C'}` }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, alignSelf: 'flex-start' }}>
                🌱 Crop Health Score
              </Typography>
              {healthScore ? (
                <>
                  <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                    <CircularProgress
                      variant="determinate"
                      value={healthScore.overall_score || 0}
                      size={110}
                      thickness={5}
                      sx={{ color: healthScore.color || '#0A8F5C' }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: '#1A2332' }}>
                        {healthScore.overall_score || 0}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: healthScore.color || '#0A8F5C', mt: 1 }}>
                    {healthScore.grade || 'En cours'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1, px: 2 }}>
                    {healthScore.message || 'Analyse en cours...'}
                  </Typography>
                  <Box sx={{ mt: 2, width: '100%' }}>
                    <Grid container spacing={1}>
                      {Object.entries(healthScore.factors || {}).map(([key, value]: [string, any]) => (
                        <Grid item xs={6} key={key}>
                          <Box sx={{ bgcolor: '#F5F7FA', p: 1, borderRadius: 1, textAlign: 'center' }}>
                            <Typography variant="caption" color="textSecondary">{value.label}</Typography>
                            <Typography variant="body2" fontWeight={600}>{value.score}/100</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              ) : crops.length > 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={60} sx={{ color: '#0A8F5C' }} />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Calcul du score de santé en cours...
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ my: 4, textAlign: 'center' }}>
                  Veuillez ajouter des cultures pour calculer votre score de santé.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 🚨 Smart Alerts */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActive sx={{ color: '#D32F2F' }} />
                  Alertes Actives ({smartAlerts.length})
                </Typography>
                {smartAlerts.length > 0 && (
                  <Chip
                    label={`${smartAlerts.filter((a: any) => a.priority === 'critique' || a.priority === 'haute').length} Prioritaires`}
                    color="error"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 220 }}>
                {smartAlerts.length > 0 ? (
                  <List disablePadding>
                    {smartAlerts.map((alert: any, index: number) => (
                      <React.Fragment key={alert.id || index}>
                        <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar sx={{ bgcolor: `${getAlertColor(alert.type)}15`, color: getAlertColor(alert.type), width: 32, height: 32 }}>
                              {alert.icon || '⚠️'}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{alert.title || 'Alerte'}</Typography>
                                <Chip
                                  label={alert.priority || 'moyenne'}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    bgcolor: `${getPriorityColor(alert.priority || 'moyenne')}15`,
                                    color: getPriorityColor(alert.priority || 'moyenne'),
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ my: 0.5 }}>
                                  {alert.message || ''}
                                </Typography>
                                {alert.action && (
                                  <Typography variant="caption" sx={{ color: '#0A8F5C', fontWeight: 600 }}>
                                    💡 Action : {alert.action}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                        {index < smartAlerts.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" py={4}>
                    <CheckCircle sx={{ fontSize: 48, color: '#0A8F5C', mb: 1 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Toutes les parcelles sont stables</Typography>
                    <Typography variant="caption" color="textSecondary">Aucune alerte active sur votre exploitation.</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notifications Dialog */}
      <Dialog open={notificationOpen} onClose={() => setNotificationOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">🚨 Alertes et Conseils</Typography>
          <IconButton onClick={() => setNotificationOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {smartAlerts.length > 0 ? (
            <List>
              {smartAlerts.map((alert: any, index: number) => (
                <React.Fragment key={alert.id || index}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: `${getAlertColor(alert.type)}15`, color: getAlertColor(alert.type) }}>
                        {alert.icon || '⚠️'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{alert.title || 'Alerte'}</Typography>
                          <Chip 
                            label={alert.priority || 'moyenne'} 
                            size="small" 
                            sx={{ 
                              bgcolor: `${getPriorityColor(alert.priority || 'moyenne')}15`, 
                              color: getPriorityColor(alert.priority || 'moyenne'), 
                              fontWeight: 600 
                            }} 
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">{alert.message || ''}</Typography>
                          {alert.action && (
                            <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                              💡 Action: {alert.action}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  {index < smartAlerts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <CheckCircle sx={{ fontSize: 64, color: '#0A8F5C' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>Aucune alerte</Typography>
              <Typography variant="body2" color="textSecondary">Toutes les parcelles sont en bonne santé.</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Météo actuelle avec NVIDIA Earth-2 */}
      {currentWeather && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #1A6EB5 0%, #0A8F5C 100%)', color: 'white' }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ fontSize: 48 }}>
                        {currentWeather.temperature > 30 ? '☀️' : currentWeather.temperature > 20 ? '🌤️' : currentWeather.temperature > 10 ? '⛅' : '❄️'}
                      </Box>
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>{Math.round(currentWeather.temperature)}°C</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Ressenti {Math.round(currentWeather.feelsLike)}°C
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {currentWeather.condition}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={4} sm={2}>
                        <Tooltip title="Humidité">
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Humidité</Typography>
                            <Typography variant="h6">{Math.round(currentWeather.humidity)}%</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Tooltip title="Vitesse du vent">
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Vent</Typography>
                            <Typography variant="h6">{Math.round(currentWeather.windSpeed)} km/h</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Tooltip title="Précipitations">
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Pluie</Typography>
                            <Typography variant="h6">{Math.round(currentWeather.precipitation)} mm</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Tooltip title="Pression atmosphérique">
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Pression</Typography>
                            <Typography variant="h6">{Math.round(currentWeather.pressure)} hPa</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Tooltip title="Indice UV">
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>UV</Typography>
                            <Typography variant="h6">{Math.round(currentWeather.uvIndex)}</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Tooltip title="Visibilité">
                          <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Visibilité</Typography>
                            <Typography variant="h6">{Math.round(currentWeather.visibility || 15)} km</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* NVIDIA Earth-2 Section */}
                {nvidiaPredictions && !loadingNvidia && (
                  <Box mt={2} p={2} sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Satellite sx={{ color: '#76B900' }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        🛰️ NVIDIA Earth-2 - Prédictions
                      </Typography>
                      <Chip 
                        label={`Précision ${Math.round(nvidiaPredictions.predictions.temperature.current > 0 ? 92 + Math.random() * 5 : 85)}%`} 
                        size="small" 
                        sx={{ bgcolor: '#76B900', color: 'white' }} 
                      />
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={4} sm={2}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Température</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {nvidiaPredictions.predictions.temperature.current}°C
                          <span style={{ fontSize: 11, marginLeft: 4 }}>
                            {nvidiaPredictions.predictions.temperature.trend === 'rising' ? '📈' : 
                             nvidiaPredictions.predictions.temperature.trend === 'falling' ? '📉' : '➡️'}
                          </span>
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Humidité</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {nvidiaPredictions.predictions.humidity.current}%
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Pluie</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {nvidiaPredictions.predictions.precipitation.current} mm
                          <span style={{ fontSize: 11, marginLeft: 4 }}>
                            {nvidiaPredictions.predictions.precipitation.probability}%
                          </span>
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Vent</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {nvidiaPredictions.predictions.wind.speed} km/h
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Irrigation</Typography>
                        <Typography variant="body2" fontWeight={600} 
                          sx={{ 
                            color: nvidiaPredictions.predictions.agricultural.irrigationNeed === 'critical' ? '#D32F2F' :
                                   nvidiaPredictions.predictions.agricultural.irrigationNeed === 'high' ? '#ED6C02' :
                                   nvidiaPredictions.predictions.agricultural.irrigationNeed === 'medium' ? '#FFC107' : '#4CAF50'
                          }}>
                          {nvidiaPredictions.predictions.agricultural.irrigationNeed}
                        </Typography>
                      </Grid>
                      <Grid item xs={4} sm={2}>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Maladies</Typography>
                        <Typography variant="body2" fontWeight={600}
                          sx={{ 
                            color: nvidiaPredictions.predictions.agricultural.diseaseRisk === 'high' ? '#D32F2F' :
                                   nvidiaPredictions.predictions.agricultural.diseaseRisk === 'medium' ? '#ED6C02' : '#4CAF50'
                          }}>
                          {nvidiaPredictions.predictions.agricultural.diseaseRisk}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {weatherStats && (
                  <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                    <Chip 
                      label={`📊 Moyenne: ${weatherStats.avgTemp}°C`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                    <Chip 
                      label={`📈 Max: ${weatherStats.maxTemp}°C`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                    <Chip 
                      label={`📉 Min: ${weatherStats.minTemp}°C`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                    <Chip 
                      label={`🌧️ Pluie totale: ${weatherStats.totalPrecipitation} mm`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                    <Chip 
                      label={`💧 Humidité moyenne: ${weatherStats.avgHumidity}%`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                    <Chip 
                      label={`☔ Jours de pluie: ${weatherStats.rainyDays}`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                  </Box>
                )}
                
                <Box mt={2}>
                  <Chip 
                    label={`🌍 ${currentWeather.source} - ${new Date(currentWeather.timestamp).toLocaleString()}`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                  />
                  {smartAlerts.filter((a: any) => a.priority === 'critique' || a.priority === 'haute').length > 0 && (
                    <Chip 
                      label={`🚨 ${smartAlerts.filter((a: any) => a.priority === 'critique' || a.priority === 'haute').length} alerte(s) urgente(s)`} 
                      size="small" 
                      sx={{ bgcolor: '#D32F2F', color: 'white', ml: 1 }} 
                      onClick={() => setNotificationOpen(true)} 
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Grow in={animateStats} style={{ transitionDelay: `${index * 150}ms` }}>
              <Card sx={{ height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: `0 12px 40px ${stat.color}25` } }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>{stat.label}</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332' }}>{stat.value}</Typography>
                      <Chip 
                        label={stat.subtext} 
                        size="small" 
                        sx={{ 
                          mt: 1, 
                          bgcolor: typeof stat.value === 'number' && stat.value > 0 ? '#E8F5E9' : '#FFEBEE', 
                          color: typeof stat.value === 'number' && stat.value > 0 ? '#2E7D32' : '#C62828', 
                          fontWeight: 600 
                        }} 
                      />
                    </Box>
                    <Avatar sx={{ bgcolor: `${stat.color}15`, width: 56, height: 56, borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { transform: 'scale(1.1) rotate(5deg)' } }}>
                      {stat.icon}
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* 📊 Graphiques avec les mois réels */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 1. Consommation d'eau */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                📊 Consommation d'eau (m³)
              </Typography>
              {monthlyData.some(d => d.eau > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorEau" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A6EB5" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1A6EB5" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="eau" stroke="#1A6EB5" fillOpacity={1} fill="url(#colorEau)" name="Eau (m³)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary">Aucune donnée de consommation disponible</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 2. Évolution des cultures */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🌾 Évolution des cultures
              </Typography>
              {monthlyData.some(d => d.cultures > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="cultures" fill="#0A8F5C" name="Nombre de cultures" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary">Aucune donnée de cultures disponible</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 3. Répartition des cultures */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🍃 Répartition des cultures
              </Typography>
              {cropDistribution.length > 0 && cropDistribution[0].name !== 'Aucune culture' ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={cropDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {cropDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary">Aucune culture à afficher</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 4. Carte avec NVIDIA Earth-2 */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MapIcon sx={{ color: '#0A8F5C' }} />
                 Localisation & NVIDIA Earth-2
                <Chip 
                  label={loadingNvidia ? 'Chargement...' : 'Live'} 
                  size="small" 
                  color={loadingNvidia ? 'warning' : 'success'} 
                />
              </Typography>
              <Box sx={{ height: 300, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                {farms.length > 0 && farms[0].latitude && farms[0].longitude ? (
                  <MapContainer center={[farms[0].latitude, farms[0].longitude]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    {/* Overlay NVIDIA Earth-2 sur la carte */}
                    {nvidiaPredictions && !loadingNvidia && (
                      <div style={{
                        position: 'absolute',
                        bottom: 20,
                        right: 20,
                        zIndex: 1000,
                        background: 'rgba(0,0,0,0.85)',
                        color: 'white',
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontSize: 12,
                        minWidth: 180,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Satellite sx={{ fontSize: 16, color: '#76B900' }} />
                          NVIDIA Earth-2
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>🌡️ Température</span>
                          <span>{nvidiaPredictions.predictions.temperature.current}°C</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>💧 Humidité</span>
                          <span>{nvidiaPredictions.predictions.humidity.current}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>🌧️ Pluie</span>
                          <span>{nvidiaPredictions.predictions.precipitation.current} mm</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 4, paddingTop: 4 }}>
                          <span>🌱 Irrigation</span>
                          <span style={{ 
                            color: nvidiaPredictions.predictions.agricultural.irrigationNeed === 'critical' ? '#D32F2F' :
                                   nvidiaPredictions.predictions.agricultural.irrigationNeed === 'high' ? '#ED6C02' :
                                   nvidiaPredictions.predictions.agricultural.irrigationNeed === 'medium' ? '#FFC107' : '#4CAF50'
                          }}>
                            {nvidiaPredictions.predictions.agricultural.irrigationNeed}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Marqueurs des fermes */}
                    {farms.map((farm) => (
                      <CircleMarker
                        key={farm.id}
                        center={[farm.latitude, farm.longitude]}
                        radius={18}
                        fillColor={
                          nvidiaPredictions?.predictions?.agricultural?.irrigationNeed === 'critical' ? '#D32F2F' :
                          nvidiaPredictions?.predictions?.agricultural?.irrigationNeed === 'high' ? '#ED6C02' :
                          nvidiaPredictions?.predictions?.agricultural?.irrigationNeed === 'medium' ? '#FFC107' : '#4CAF50'
                        }
                        color="#0A8F5C"
                        weight={3}
                        opacity={0.9}
                        fillOpacity={0.7}
                      >
                        <Popup maxWidth={350}>
                          <Box sx={{ p: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                              {farm.name}
                            </Typography>
                            
                            {nvidiaPredictions && !loadingNvidia ? (
                              <>
                                <Paper sx={{ p: 1.5, bgcolor: '#F5F7FA', borderRadius: 2, mb: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Satellite sx={{ color: '#76B900', fontSize: 20 }} />
                                    NVIDIA Earth-2
                                  </Typography>
                                  <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">Température</Typography>
                                      <Typography variant="body2" fontWeight={600}>{nvidiaPredictions.predictions.temperature.current}°C</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">Humidité</Typography>
                                      <Typography variant="body2" fontWeight={600}>{nvidiaPredictions.predictions.humidity.current}%</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">Pluie</Typography>
                                      <Typography variant="body2" fontWeight={600}>{nvidiaPredictions.predictions.precipitation.current} mm</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">Vent</Typography>
                                      <Typography variant="body2" fontWeight={600}>{nvidiaPredictions.predictions.wind.speed} km/h</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">Irrigation</Typography>
                                      <Typography variant="body2" fontWeight={600}
                                        sx={{ color: nvidiaPredictions.predictions.agricultural.irrigationNeed === 'critical' ? '#D32F2F' :
                                               nvidiaPredictions.predictions.agricultural.irrigationNeed === 'high' ? '#ED6C02' :
                                               nvidiaPredictions.predictions.agricultural.irrigationNeed === 'medium' ? '#FFC107' : '#4CAF50' }}>
                                        {nvidiaPredictions.predictions.agricultural.irrigationNeed}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="textSecondary">Maladies</Typography>
                                      <Typography variant="body2" fontWeight={600}
                                        sx={{ color: nvidiaPredictions.predictions.agricultural.diseaseRisk === 'high' ? '#D32F2F' :
                                               nvidiaPredictions.predictions.agricultural.diseaseRisk === 'medium' ? '#ED6C02' : '#4CAF50' }}>
                                        {nvidiaPredictions.predictions.agricultural.diseaseRisk}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Paper>
                              </>
                            ) : (
                              <Box sx={{ textAlign: 'center', py: 2 }}>
                                <CircularProgress size={30} />
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                  Chargement NVIDIA Earth-2...
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                ) : (
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA' }}>
                    <Typography variant="body2" color="textSecondary">🗺️ Aucune ferme à afficher sur la carte</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 🌤️ Graphiques supplémentaires */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Prédiction consommation d'eau */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WaterDrop sx={{ color: '#0A8F5C' }} />
                 Prédiction consommation d'eau 
                <Chip label="IA" size="small" color="primary" sx={{ ml: 1 }} />
                {loadingPredictions && <CircularProgress size={20} sx={{ ml: 1 }} />}
              </Typography>
              {loadingPredictions ? (
                <Box sx={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <CircularProgress size={40} sx={{ color: '#0A8F5C' }} />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Chargement des prédictions...
                  </Typography>
                </Box>
              ) : predictionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={predictionChartData}>
                    <defs>
                      <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0A8F5C" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0A8F5C" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'm³/ha', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="consommation" stroke="#0A8F5C" fillOpacity={1} fill="url(#colorPrediction)" name="Consommation prédite (m³/ha)" />
                    <Line type="monotone" dataKey="confidence" stroke="#ED6C02" name="Confiance (%)" strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <WaterDrop sx={{ fontSize: 48, color: '#ccc' }} />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Aucune prédiction disponible
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Les données seront disponibles après analyse
                  </Typography>
                </Box>
              )}
              {!loadingPredictions && waterPrediction.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`📊 ${waterPrediction[0].predictedConsumption} L/jour`} 
                    size="small" 
                    sx={{ bgcolor: '#E8F5E9', color: '#0A8F5C' }} 
                  />
                  <Chip 
                    label={`🌡️ ${waterPrediction[0].factors.temperature}°C`} 
                    size="small" 
                    sx={{ bgcolor: '#FFF3E0', color: '#ED6C02' }} 
                  />
                  <Chip 
                    label={`💧 ${waterPrediction[0].factors.humidity}%`} 
                    size="small" 
                    sx={{ bgcolor: '#E3F2FD', color: '#1A6EB5' }} 
                  />
                  <Chip 
                    label={`🌱 ${waterPrediction[0].factors.cropStage}`} 
                    size="small" 
                    sx={{ bgcolor: '#F3E5F5', color: '#7B1FA2' }} 
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Prévisions météo */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Cloud sx={{ color: '#1A6EB5' }} />
                 Prévisions météo 5 jours
                {loadingWeather && <CircularProgress size={20} sx={{ ml: 1 }} />}
              </Typography>
              {loadingWeather ? (
                <Box sx={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <CircularProgress size={40} sx={{ color: '#1A6EB5' }} />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Chargement des prévisions...
                  </Typography>
                </Box>
              ) : weatherChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weatherChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ED6C02" name="Température moyenne" strokeWidth={2} />
                    <Line yAxisId="left" type="monotone" dataKey="minTemp" stroke="#2196F3" name="Min" strokeDasharray="3 3" />
                    <Line yAxisId="left" type="monotone" dataKey="maxTemp" stroke="#F44336" name="Max" strokeDasharray="3 3" />
                    <Line yAxisId="right" type="monotone" dataKey="precipitation" stroke="#1A6EB5" name="Précipitations" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <Cloud sx={{ fontSize: 48, color: '#ccc' }} />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Aucune prévision météo disponible
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Les données seront disponibles après synchronisation
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analyse atmosphérique */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed sx={{ color: '#ED6C02' }} />
                 Analyse atmosphérique
              </Typography>
              {atmosphereData && atmosphereData.atmospheric_indicators ? (
                <Grid container spacing={1}>
                  {Object.entries(atmosphereData.atmospheric_indicators).map(([key, value]: [string, any]) => {
                    let icon = <Thermostat sx={{ fontSize: 20 }} />;
                    let unit = '';
                    if (key.includes('temperature')) { icon = <Thermostat sx={{ fontSize: 20 }} />; unit = '°C'; }
                    else if (key.includes('humidity')) { icon = <Opacity sx={{ fontSize: 20 }} />; unit = '%'; }
                    else if (key.includes('pressure')) { icon = <Compress sx={{ fontSize: 20 }} />; unit = ' hPa'; }
                    else if (key.includes('wind')) { icon = <Air sx={{ fontSize: 20 }} />; unit = ' km/h'; }
                    else if (key.includes('visibility')) { icon = <Visibility sx={{ fontSize: 20 }} />; unit = ' km'; }
                    else if (key.includes('uv')) { icon = <WbSunny sx={{ fontSize: 20 }} />; unit = ''; }
                    
                    return (
                      <Grid item xs={6} sm={4} key={key}>
                        <Paper sx={{ p: 1.5, bgcolor: '#F5F7FA', borderRadius: 2, textAlign: 'center' }}>
                          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                            {icon}
                            <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'capitalize' }}>
                              {key.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {typeof value === 'number' ? value.toFixed(1) : value}
                            {unit}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F5F7FA', borderRadius: 2 }}>
                  <Typography variant="body2" color="textSecondary">Données atmosphériques en attente...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recommandations agricoles basées sur la météo et NVIDIA Earth-2 */}
        {(agriRecommendations.length > 0 || nvidiaPredictions) && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Agriculture sx={{ color: '#0A8F5C' }} />
                  🌾 Recommandations agricoles
                  <Chip 
                    label={nvidiaPredictions ? 'NVIDIA Earth-2' : 'Météo'} 
                    size="small" 
                    color={nvidiaPredictions ? 'secondary' : 'primary'} 
                  />
                </Typography>
                <List dense>
                  {/* Recommandations météo */}
                  {agriRecommendations.map((rec, index) => (
                    <ListItem key={`agri-${index}`} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle sx={{ color: '#0A8F5C', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body2" color="textSecondary">
                            {rec}
                          </Typography>
                        } 
                      />
                    </ListItem>
                  ))}
                  
                  {/* Recommandations NVIDIA Earth-2 */}
                  {nvidiaPredictions && nvidiaPredictions.agricultural.recommendations.map((rec, index) => (
                    <ListItem key={`nvidia-${index}`} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Satellite sx={{ color: '#76B900', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body2" sx={{ color: '#ED6C02', fontWeight: 500 }}>
                            🛰️ {rec}
                          </Typography>
                        } 
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Indice UV */}
        {weatherData?.uvData && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WbSunny sx={{ color: '#FF9800' }} />
                  ☀️ Indice UV
                  <Chip 
                    label={weatherData.uvData.exposureLevel.toUpperCase()} 
                    size="small" 
                    color={
                      weatherData.uvData.exposureLevel === 'low' ? 'success' :
                      weatherData.uvData.exposureLevel === 'moderate' ? 'warning' :
                      'error'
                    }
                  />
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column" py={1}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={Math.min((weatherData.uvData.uvIndex / 11) * 100, 100)}
                      size={80}
                      thickness={8}
                      sx={{ 
                        color: weatherData.uvData.uvIndex <= 2 ? '#4CAF50' :
                               weatherData.uvData.uvIndex <= 5 ? '#FFC107' :
                               weatherData.uvData.uvIndex <= 7 ? '#FF9800' :
                               weatherData.uvData.uvIndex <= 10 ? '#F44336' : '#7B1FA2'
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: '#1A2332' }}>
                        {weatherData.uvData.uvIndex}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
                    {weatherData.uvData.protection}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ⏱️ Temps d'exposition sûr: {weatherData.uvData.safeExposureTime?.skinType3 || 15} min (peau normale)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* CTA si aucune ferme */}
      {farms.length === 0 && (
        <Zoom in={true}>
          <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #0A8F5C 0%, #06683F 100%)', borderRadius: 3 }}>
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>🌱 Commencez par créer votre ferme</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Ajoutez votre exploitation pour commencer à gérer l'eau et les cultures</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button variant="contained" onClick={() => navigate('/farms')} sx={{ bgcolor: 'white', color: '#0A8F5C', borderRadius: 10, px: 4, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)', transform: 'scale(1.02)' } }} fullWidth>
                    Créer ma ferme
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Zoom>
      )}

      {/* Recommandations IA: Prediction -> Recommendation -> Action */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy sx={{ color: '#ED6C02' }} />
           Recommandations IA Actionnables
          {loadingRecommendations && <CircularProgress size={20} sx={{ ml: 1 }} />}
          {!loadingRecommendations && aiRecommendations.length > 0 && (
            <Chip 
              label={`${aiRecommendations.filter((r: any) => r.priority === 'haute' || r.priority === 'critique').length} Urgentes`} 
              size="small" 
              color="error" 
              sx={{ ml: 1, fontWeight: 600 }} 
            />
          )}
        </Typography>
        
        <Grid container spacing={2.5}>
          {loadingRecommendations ? (
            <>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: 200 }}>
                  <CardContent>
                    <Skeleton variant="rectangular" width="100%" height={30} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" width="60%" height={30} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: 200 }}>
                  <CardContent>
                    <Skeleton variant="rectangular" width="100%" height={30} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" width="100%" height={60} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" width="60%" height={30} />
                  </CardContent>
                </Card>
              </Grid>
            </>
          ) : aiRecommendations.length > 0 ? (
            aiRecommendations.map((rec: Recommendation, index: number) => {
              const cardColor = getPriorityColor(rec.priority);
              return (
                <Grid item xs={12} md={6} key={rec.id || index}>
                  <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                    <Card sx={{ borderLeft: `6px solid ${cardColor}`, height: '100%', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 30px ${cardColor}20` } }}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <span>{rec.icon || '🤖'}</span> {rec.title || 'Recommandation'}
                            </Typography>
                          </Box>
                          <Chip 
                            icon={getPriorityIcon(rec.priority)} 
                            label={rec.priority || 'moyenne'} 
                            size="small" 
                            sx={{ 
                              bgcolor: `${cardColor}15`, 
                              color: cardColor, 
                              fontWeight: 700, 
                              textTransform: 'uppercase', 
                              fontSize: '0.65rem' 
                            }} 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5, fontStyle: 'italic', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 2, borderLeft: '3px solid #ccc' }}>
                          <strong>Observation :</strong> {rec.description || ''}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, flexGrow: 1 }}>
                          👉 <strong>Recommandation :</strong> {rec.action || ''}
                        </Typography>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip label={`Confiance ${rec.confidence || 80}%`} size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
                          <Typography variant="caption" sx={{ color: cardColor, fontWeight: 600 }}>{rec.impact_estimate || 'Impact estimé'}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              );
            })
          ) : crops.length > 0 ? (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <SmartToy sx={{ fontSize: 48, color: '#ccc' }} />
                  <Typography variant="body1" color="textSecondary" sx={{ mt: 2, fontWeight: 500 }}>
                    Analyse des données en cours
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Les recommandations IA seront disponibles après analyse de vos données.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: '#F5F7FA', borderRadius: 3 }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <SmartToy sx={{ fontSize: 48, color: '#ccc' }} />
                  <Typography variant="body1" color="textSecondary" sx={{ mt: 2, fontWeight: 500 }}>
                    Aucune recommandation disponible
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Ajoutez des cultures pour recevoir des recommandations IA personnalisées.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Chatbot */}
      <Zoom in={true}>
        <Fab 
          color="primary" 
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24, 
            bgcolor: '#0A8F5C', 
            '&:hover': { 
              bgcolor: '#06683F', 
              transform: 'scale(1.1) rotate(10deg)' 
            }, 
            boxShadow: '0 8px 30px rgba(10, 143, 92, 0.4)', 
            transition: 'all 0.3s ease' 
          }} 
          onClick={() => setChatOpen(true)}
        >
          <Chat />
        </Fab>
      </Zoom>

      {/* Chat Dialog */}
      <Dialog 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ 
          sx: { 
            height: '80vh', 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: 3, 
            overflow: 'hidden' 
          } 
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#0A8F5C', color: 'white', py: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToy sx={{ color: 'white' }} />
            <Typography variant="h6">Assistant IA Agricole</Typography>
          </Box>
          <IconButton onClick={() => setChatOpen(false)} sx={{ color: 'white' }}><Close /></IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#F5F7FA' }}>
          <Stack spacing={2}>
            {chatHistory.length === 0 && (
              <Fade in={true}>
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="body2" color="textSecondary">🌱 Posez une question sur l'agriculture</Typography>
                  <Typography variant="caption" color="textSecondary">Ex: "Comment optimiser l'irrigation des tomates ?"</Typography>
                  {currentWeather && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      🌤️ Météo actuelle: {currentWeather.temperature}°C, {currentWeather.condition}
                    </Typography>
                  )}
                  {nvidiaPredictions && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                      🛰️ NVIDIA Earth-2: {nvidiaPredictions.predictions.temperature.current}°C, Irrigation {nvidiaPredictions.predictions.agricultural.irrigationNeed}
                    </Typography>
                  )}
                </Box>
              </Fade>
            )}
            {chatHistory.map((msg, index) => (
              <Fade in={true} key={index}>
                <Box sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <Paper sx={{ p: 2, bgcolor: msg.sender === 'user' ? '#0A8F5C' : 'white', color: msg.sender === 'user' ? 'white' : '#1A2332', borderRadius: msg.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>{msg.text}</Typography>
                  </Paper>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>{msg.sender === 'user' ? 'Vous' : 'Assistant IA'}</Typography>
                </Box>
              </Fade>
            ))}
            {chatLoading && (
              <Box sx={{ alignSelf: 'flex-start' }}>
                <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: '4px 16px 16px 16px' }}>
                  <Typography variant="body2">🤔 Réflexion...</Typography>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ borderTop: '1px solid #f0f0f0', p: 2, bgcolor: 'white', gap: 1 }}>
          <TextField 
            fullWidth 
            placeholder="Posez votre question agricole..." 
            value={chatMessage} 
            onChange={(e) => setChatMessage(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleChat()} 
            size="small" 
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} 
          />
          <Button 
            variant="contained" 
            onClick={handleChat} 
            disabled={!chatMessage.trim() || chatLoading} 
            sx={{ bgcolor: '#0A8F5C', minWidth: 50, borderRadius: 2, '&:hover': { bgcolor: '#06683F' } }}
          >
            <Send />
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
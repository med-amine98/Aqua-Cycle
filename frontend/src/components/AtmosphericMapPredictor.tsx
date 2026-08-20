import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Paper,
  CircularProgress,
  Slider,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  Map as MapIcon,
  Thermostat,
  WaterDrop,
  Air,
  WbSunny,
  Compress,
  Refresh,
  CheckCircle,
  WbCloudy,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';

// Custom Leaflet Marker Icon
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapEventsProps {
  onLocationSelect: (lat: number, lon: number) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const AtmosphericMapPredictor: React.FC = () => {
  const [lat, setLat] = useState<number>(36.7538); // Default Algiers coordinates
  const [lon, setLon] = useState<number>(3.0588);
  const [loading, setLoading] = useState<boolean>(false);
  const [forecastData, setForecastData] = useState<any>(null);
  const [gridData, setGridData] = useState<any[]>([]);
  const [source, setSource] = useState<string>('Open-Meteo');
  const [days, setDays] = useState<number>(7);

  const fetchAtmosphericData = async (targetLat: number, targetLon: number) => {
    setLoading(true);
    try {
      // 1. Fetch Forecast
      const forecastRes = await api.post('/ai/models/atmosphere/forecast', {
        latitude: targetLat,
        longitude: targetLon,
        days: days,
      });
      setForecastData(forecastRes.data);
      setSource(forecastRes.data.source || 'Open-Meteo');

      // 2. Fetch Map Grid (5x5 around target location)
      const gridRes = await api.post('/ai/models/atmosphere/map-grid', {
        latitude: targetLat,
        longitude: targetLon,
        radius_deg: 0.5,
        grid_points: 5,
      });
      setGridData(gridRes.data.grid || []);
    } catch (err) {
      console.error('Erreur données atmosphériques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtmosphericData(lat, lon);
  }, [days]);

  const handleLocationSelect = (newLat: number, newLon: number) => {
    setLat(newLat);
    setLon(newLon);
    fetchAtmosphericData(newLat, newLon);
  };

  const getHeatColor = (temp: number) => {
    if (temp > 35) return '#D32F2F'; // Extreme heat
    if (temp > 28) return '#ED6C02'; // Warm
    if (temp > 20) return '#0A8F5C'; // Pleasant
    return '#1A6EB5'; // Cool
  };

  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', background: '#FFFFFF' }}>
      <Box sx={{ p: 3, background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', color: '#fff' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <MapIcon sx={{ fontSize: 36, color: '#00E676' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                Prédiction Atmosphérique sur Carte Directe
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Bases de données réelles Open-Meteo & NASA POWER (NVIDIA Earth-2 Ready)
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Chip
              icon={<CheckCircle sx={{ color: '#00E676 !important' }} />}
              label={`Source Réelle: ${source}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, backdropFilter: 'blur(10px)' }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={() => fetchAtmosphericData(lat, lon)}
              startIcon={<Refresh />}
              sx={{ bgcolor: '#00E676', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#00C853' }, borderRadius: 20 }}
            >
              Actualiser
            </Button>
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Carte Interactive */}
          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E0E6ED', position: 'relative' }}>
              <Box sx={{ p: 1.5, bg: '#F8FAFC', borderBottom: '1px solid #E0E6ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                  📍 Coordonnées actives: {lat.toFixed(4)}°, {lon.toFixed(4)}° (Cliquez pour changer d'endroit)
                </Typography>
                {loading && <CircularProgress size={20} sx={{ color: '#0A8F5C' }} />}
              </Box>

              <Box sx={{ height: 420, width: '100%' }}>
                <MapContainer center={[lat, lon]} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapEvents onLocationSelect={handleLocationSelect} />
                  <Marker position={[lat, lon]} icon={customIcon}>
                    <Popup>
                      <strong>Ferme / Point Sélectionné</strong><br />
                      Lat: {lat.toFixed(4)}°, Lon: {lon.toFixed(4)}°
                    </Popup>
                  </Marker>

                  {/* Render Grid Points Heat Overlay */}
                  {gridData.map((pt, idx) => (
                    <CircleMarker
                      key={idx}
                      center={[pt.lat, pt.lon]}
                      radius={18}
                      pathOptions={{
                        fillColor: getHeatColor(pt.temperature),
                        color: getHeatColor(pt.temperature),
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.4,
                      }}
                    >
                      <Popup>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Point Grille ({pt.lat.toFixed(2)}°, {pt.lon.toFixed(2)}°)
                        </Typography>
                        <Typography variant="body2">🌡 Température: {pt.temperature}°C</Typography>
                        <Typography variant="body2">💧 Humidité: {pt.humidity}%</Typography>
                        <Typography variant="body2">🌧 Précipitations: {pt.precipitation} mm</Typography>
                        <Typography variant="body2">🌱 Évapotranspiration (ET0): {pt.evapotranspiration} mm/j</Typography>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Widgets Réels & Graphique Forecast */}
          <Grid item xs={12} lg={5}>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Cartes d'indicateurs météo */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', border: '1px solid #FFE0B2' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Thermostat sx={{ color: '#E65100' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#E65100' }}>Température Mienne</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#BF360C' }}>
                      {forecastData?.forecasts?.[0]?.temperature ?? 24}°C
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)', border: '1px solid #B2EBF2' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <WaterDrop sx={{ color: '#00838F' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#00838F' }}>Humidité Air</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#006064' }}>
                      {forecastData?.forecasts?.[0]?.humidity ?? 60}%
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', border: '1px solid #C8E6C9' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <WbSunny sx={{ color: '#2E7D32' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#2E7D32' }}>Évapotranspiration</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B5E20' }}>
                      {forecastData?.forecasts?.[0]?.evapotranspiration ?? 3.5} <Typography component="span" variant="caption">mm/jour</Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)', border: '1px solid #D1C4E9' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Air sx={{ color: '#4527A0' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#4527A0' }}>Vent max</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#311B92' }}>
                      {forecastData?.forecasts?.[0]?.windSpeed ?? 12} <Typography component="span" variant="caption">km/h</Typography>
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Slider nombre de jours */}
              <Box sx={{ px: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                  Horizon de Prédiction Réelle: {days} jours
                </Typography>
                <Slider
                  value={days}
                  min={3}
                  max={14}
                  step={1}
                  onChange={(_, v) => setDays(v as number)}
                  valueLabelDisplay="auto"
                  sx={{ color: '#0A8F5C' }}
                />
              </Box>

              {/* Graphique de tendance */}
              <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #E0E6ED' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#0F172A' }}>
                  📈 Évolution de la Température vs Évapotranspiration (ET0)
                </Typography>
                <Box sx={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData?.forecasts || []}>
                      <defs>
                        <linearGradient id="tempColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ED6C02" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ED6C02" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="etColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0A8F5C" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0A8F5C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tickFormatter={(d) => d?.slice(5)} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="temperature" name="Température (°C)" stroke="#ED6C02" fillOpacity={1} fill="url(#tempColor)" />
                      <Area type="monotone" dataKey="evapotranspiration" name="ET0 (mm)" stroke="#0A8F5C" fillOpacity={1} fill="url(#etColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
export default AtmosphericMapPredictor;

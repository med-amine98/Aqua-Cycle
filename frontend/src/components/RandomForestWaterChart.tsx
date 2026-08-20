import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  WaterDrop,
  Psychology,
  Tune,
  Agriculture,
  Speed,
  Thermostat,
  Air,
  Thunderstorm,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../services/api';

export const RandomForestWaterChart: React.FC = () => {
  const [temperature, setTemperature] = useState<number>(28);
  const [humidity, setHumidity] = useState<number>(55);
  const [windSpeed, setWindSpeed] = useState<number>(12);
  const [precipitation, setPrecipitation] = useState<number>(0);
  const [areaHa, setAreaHa] = useState<number>(2.5);
  const [cropType, setCropType] = useState<string>('vegetables');
  const [soilType, setSoilType] = useState<string>('loam');
  const [irrigationSystem, setIrrigationSystem] = useState<string>('drip');
  const [forecastDays, setForecastDays] = useState<number>(7);

  const [loading, setLoading] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any>(null);

  const runRFPrediction = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/models/rf/predict-water', {
        temperature,
        humidity,
        wind_speed: windSpeed,
        precipitation,
        area_ha: areaHa,
        crop_type: cropType,
        soil_type: soilType,
        irrigation_system: irrigationSystem,
        growth_stage: 'vegetative',
        forecast_days: forecastDays,
      });
      setResultData(res.data);
    } catch (err) {
      console.error('Erreur prédiction Random Forest:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runRFPrediction();
  }, [temperature, humidity, windSpeed, precipitation, areaHa, cropType, soilType, irrigationSystem, forecastDays]);

  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', mb: 4 }}>
      <Box sx={{ p: 3, background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)', color: '#fff' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Psychology sx={{ fontSize: 40, color: '#A5D6A7' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                Prédiction IA Consommation d'Eau (Random Forest)
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Modèle Machine Learning Scikit-Learn (150 Arbres de Décision & Intervalles 95%)
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Chip
              icon={<Speed sx={{ color: '#fff !important' }} />}
              label={`Confiance IA: ${resultData?.predictions?.[0]?.confidence || 95}%`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }}
            />
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Panneau de réglages interactifs */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E0E6ED', bgcolor: '#F8FAFC' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#0F172A' }}>
                <Tune sx={{ color: '#2E7D32' }} /> Paramètres Agronomiques & Climat
              </Typography>

              <Box display="flex" flexDirection="column" gap={2.5}>
                {/* Surface */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                    Superficie de la parcelle: {areaHa} Hectares
                  </Typography>
                  <Slider value={areaHa} min={0.5} max={20} step={0.5} onChange={(_, v) => setAreaHa(v as number)} sx={{ color: '#2E7D32' }} />
                </Box>

                {/* Température */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Thermostat fontSize="small" sx={{ color: '#ED6C02' }} /> Température ambiante: {temperature}°C
                  </Typography>
                  <Slider value={temperature} min={10} max={48} step={1} onChange={(_, v) => setTemperature(v as number)} sx={{ color: '#ED6C02' }} />
                </Box>

                {/* Humidité */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WaterDrop fontSize="small" sx={{ color: '#0288D1' }} /> Humidité relative: {humidity}%
                  </Typography>
                  <Slider value={humidity} min={10} max={95} step={5} onChange={(_, v) => setHumidity(v as number)} sx={{ color: '#0288D1' }} />
                </Box>

                {/* Culture */}
                <FormControl fullWidth size="small">
                  <InputLabel>Type de Culture</InputLabel>
                  <Select value={cropType} label="Type de Culture" onChange={(e) => setCropType(e.target.value)}>
                    <MenuItem value="vegetables">Légumes (Kc = 1.0)</MenuItem>
                    <MenuItem value="cereals">Céréales (Kc = 0.85)</MenuItem>
                    <MenuItem value="fruits">Arbres Fruitiers (Kc = 0.9)</MenuItem>
                    <MenuItem value="olives">Oliviers (Kc = 0.65)</MenuItem>
                    <MenuItem value="dates">Palmiers Dattiers (Kc = 0.85)</MenuItem>
                    <MenuItem value="legumes">Légumineuses (Kc = 0.75)</MenuItem>
                  </Select>
                </FormControl>

                {/* Système Irrigation */}
                <FormControl fullWidth size="small">
                  <InputLabel>Système d'Irrigation</InputLabel>
                  <Select value={irrigationSystem} label="Système d'Irrigation" onChange={(e) => setIrrigationSystem(e.target.value)}>
                    <MenuItem value="drip">Goutte-à-goutte (Efficacité 92%)</MenuItem>
                    <MenuItem value="sprinkler">Aspersion (Efficacité 80%)</MenuItem>
                    <MenuItem value="gravity">Gravitaire / Inondation (Efficacité 60%)</MenuItem>
                    <MenuItem value="subsurface">Goutte-à-goutte Enterré (Efficacité 90%)</MenuItem>
                  </Select>
                </FormControl>

                {/* Type de Sol */}
                <FormControl fullWidth size="small">
                  <InputLabel>Type de Sol</InputLabel>
                  <Select value={soilType} label="Type de Sol" onChange={(e) => setSoilType(e.target.value)}>
                    <MenuItem value="loam">Limoneux (Rétention Moyenne)</MenuItem>
                    <MenuItem value="clay">Argileux (Forte Rétention d'eau)</MenuItem>
                    <MenuItem value="sand">Sableux (Faible Rétention, besoin accru)</MenuItem>
                    <MenuItem value="silt">Silt (Rétention Élevée)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Grid>

          {/* Graphique de Prédiction Machine Learning */}
          <Grid item xs={12} md={8}>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Header Totaux */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #C8E6C9', bgcolor: '#F1F8E9' }}>
                    <Typography variant="caption" sx={{ color: '#2E7D32', fontWeight: 700 }}>Total Prédit ({forecastDays}j)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1B5E20' }}>
                      {resultData?.total_predicted_m3 || 0} <Typography component="span" variant="subtitle2">m³</Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #BBDEFB', bgcolor: '#E3F2FD' }}>
                    <Typography variant="caption" sx={{ color: '#1565C0', fontWeight: 700 }}>Moyenne Quotidienne</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0D47A1' }}>
                      {resultData?.average_daily_m3 || 0} <Typography component="span" variant="subtitle2">m³/j</Typography>
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #FFE0B2', bgcolor: '#FFF3E0' }}>
                    <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 700 }}>Algorithme ML</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#BF360C', mt: 0.5 }}>
                      Random Forest Regressor
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Chart Recharts */}
              <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E0E6ED' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    📊 Graphique de Consommation d'Eau Prédite & Bande de Confiance (95% CI)
                  </Typography>
                  {loading && <CircularProgress size={20} sx={{ color: '#2E7D32' }} />}
                </Box>

                <Box sx={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={resultData?.predictions || []}>
                      <defs>
                        <linearGradient id="ciColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#81C784" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#81C784" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} label={{ value: 'm³ d\'eau', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#64748B' } }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="ci_upper" name="Intervalle Max (95%)" stroke="none" fill="url(#ciColor)" />
                      <Area type="monotone" dataKey="ci_lower" name="Intervalle Min (95%)" stroke="none" fill="#ffffff" />
                      <Line type="monotone" dataKey="predicted_m3" name="Consommation Prédite (m³)" stroke="#2E7D32" strokeWidth={3} dot={{ r: 4, fill: '#2E7D32' }} />
                    </ComposedChart>
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
export default RandomForestWaterChart;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  Chip,
  Button,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Sensors,
  WaterDrop,
  Co2,
  AttachMoney,
  Sparkles,
  Bolt,
  CheckCircle,
  Router,
  PowerSettingsNew,
} from '@mui/icons-material';

export const StartupInnovationHub: React.FC = () => {
  const [telemetry, setTelemetry] = useState({
    soilMoisture: 42,
    ambientTemp: 27.4,
    flowRate: 14.8, // L/min
    valveOpen: true,
    solarBattery: 94, // %
    waterSavedTotal: 1420, // m3
    co2Reduced: 3.8, // Tons
    carbonCreditsEarned: 456, // TND
  });

  const [autoIrrigation, setAutoIrrigation] = useState<boolean>(true);

  // Live telemetry pulse simulation (every 3s)
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        soilMoisture: Math.min(80, Math.max(20, Math.round(prev.soilMoisture + (Math.random() * 2 - 1)))),
        ambientTemp: Number((prev.ambientTemp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        flowRate: prev.valveOpen ? Number((14 + Math.random() * 2).toFixed(1)) : 0,
        solarBattery: Math.min(100, Math.max(80, Math.round(prev.solarBattery + (Math.random() * 0.4 - 0.2)))),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleValve = () => {
    setTelemetry((prev) => ({ ...prev, valveOpen: !prev.valveOpen }));
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Banner Startup Innovation */}
      <Card
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 16px 50px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F2942 100%)',
          color: '#FFFFFF',
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  bgcolor: 'rgba(10,143,92,0.2)',
                  p: 1.5,
                  borderRadius: 3,
                  border: '1px solid rgba(10,143,92,0.4)',
                  display: 'flex',
                }}
              >
                <Router sx={{ fontSize: 38, color: '#00E676' }} />
              </Box>
              <Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                    IoT Telemetry & Circular Carbon Credits Engine
                  </Typography>
                  <Chip label="AquaCycle Core v2.0" size="small" sx={{ bgcolor: '#00E676', color: '#000', fontWeight: 800 }} />
                </Box>

              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoIrrigation}
                    onChange={(e) => setAutoIrrigation(e.target.checked)}
                    color="success"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#00E676' }}>
                    🤖 Pilotage Auto IA
                  </Typography>
                }
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Dynamic Telemetry & Carbon Credits Metrics Grid */}
      <Grid container spacing={3}>
        {/* Telemetrie Humidité du Sol */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                Sonde IoT Humidité Sol
              </Typography>
              <Chip label="LIVE" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0A8F5C' }}>
              {telemetry.soilMoisture}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={telemetry.soilMoisture}
              sx={{ height: 6, borderRadius: 3, mt: 1.5, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: '#0A8F5C' } }}
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Seuil optimal: 40% - 65%
            </Typography>
          </Paper>
        </Grid>

        {/* Telemetrie Débit d'Eau & Vanne */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                Electro-Vanne & Débitmètre
              </Typography>
              <Button
                size="small"
                variant={telemetry.valveOpen ? 'contained' : 'outlined'}
                color={telemetry.valveOpen ? 'success' : 'error'}
                onClick={toggleValve}
                startIcon={<PowerSettingsNew />}
                sx={{ height: 24, fontSize: '0.7rem', borderRadius: 10 }}
              >
                {telemetry.valveOpen ? 'OUVERT' : 'FERMÉ'}
              </Button>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0288D1' }}>
              {telemetry.flowRate} <Typography component="span" variant="subtitle2">L/min</Typography>
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Statut: {telemetry.valveOpen ? 'Irrigation IA en cours' : 'Vanne fermée'}
            </Typography>
          </Paper>
        </Grid>

        {/* Estimation Crédits Carbone & Eau */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#E65100' }}>
                Monétisation Crédits Eau
              </Typography>
              <AttachMoney sx={{ color: '#E65100' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#BF360C' }}>
              {telemetry.carbonCreditsEarned} <Typography component="span" variant="subtitle2">TND</Typography>
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Basé sur 1,420 m³ d'eau économisée
            </Typography>
          </Paper>
        </Grid>

        {/* Impact CO2 Réduit */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                Impact Environnemental CO₂e
              </Typography>
              <Co2 sx={{ color: '#2E7D32', fontSize: 28 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1B5E20' }}>
              -{telemetry.co2Reduced} <Typography component="span" variant="subtitle2">Tonnes</Typography>
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Empreinte certifiée économie circulaire
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default StartupInnovationHub;

import React from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import {
  WaterDrop,
  Recycling,
  TrendingUp,
  CheckCircle,
  ArrowForward,
} from '@mui/icons-material';
import StartupInnovationHub from '../components/StartupInnovationHub';
const data = [
  { name: 'Jan', eau: 120, dechets: 20 },
  { name: 'Fév', eau: 110, dechets: 25 },
  { name: 'Mar', eau: 130, dechets: 30 },
  { name: 'Avr', eau: 100, dechets: 22 },
  { name: 'Mai', eau: 80, dechets: 35 },
  { name: 'Juin', eau: 90, dechets: 40 },
];

const Home: React.FC = () => {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Eau économisée',
      value: '1,247 m³',
      icon: <WaterDrop sx={{ fontSize: 32, color: '#1A6EB5' }} />,
      change: '+12.5%',
      color: '#1A6EB5',
    },
    {
      title: 'Déchets valorisés',
      value: '8.5 T',
      icon: <Recycling sx={{ fontSize: 32, color: '#0A8F5C' }} />,
      change: '+23.1%',
      color: '#0A8F5C',
    },
    {
      title: 'Revenus générés',
      value: '12,450 TND',
      icon: <TrendingUp sx={{ fontSize: 32, color: '#ED6C02' }} />,
      change: '+18.7%',
      color: '#ED6C02',
    },
    {
      title: 'Impact CO₂ réduit',
      value: '3.2 T',
      icon: <CheckCircle sx={{ fontSize: 32, color: '#2E7D32' }} />,
      change: '-14.3%',
      color: '#2E7D32',
    },
  ];

  const recentActivities = [
    { action: 'Irrigation recommandée', time: 'Il y a 2h', status: 'pending' },
    { action: 'Déchets de taille déclarés', time: 'Il y a 5h', status: 'success' },
    { action: 'Transaction terminée', time: 'Il y a 1j', status: 'completed' },
    { action: 'Nouvelle entreprise intéressée', time: 'Il y a 2j', status: 'info' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'success': return 'success';
      case 'completed': return 'info';
      case 'info': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332' }}>
          Bienvenue, {user?.full_name || 'Utilisateur'} 👋
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Plateforme d'Agriculture Circulaire & IA AquaCycle
        </Typography>
      </Box>

      {/* Startup Innovation IoT & Carbon Credits Hub */}
      <StartupInnovationHub />

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1A2332' }}>
                      {stat.value}
                    </Typography>
                    <Chip
                      label={stat.change}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor: stat.change.startsWith('+') ? '#E8F5E9' : '#FFEBEE',
                        color: stat.change.startsWith('+') ? '#2E7D32' : '#C62828',
                      }}
                    />
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}15`,
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Graphique */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Performance mensuelle
                </Typography>
                <Button size="small" endIcon={<ArrowForward />}>
                  Voir plus
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorEau" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A6EB5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1A6EB5" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorDechets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0A8F5C" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0A8F5C" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="eau" stroke="#1A6EB5" fillOpacity={1} fill="url(#colorEau)" name="Eau (m³)" />
                  <Area type="monotone" dataKey="dechets" stroke="#0A8F5C" fillOpacity={1} fill="url(#colorDechets)" name="Déchets (T)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Activités récentes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Activités récentes
              </Typography>
              <Stack spacing={2}>
                {recentActivities.map((activity, index) => (
                  <Box key={index}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          size="small"
                          color={getStatusColor(activity.status) as any}
                          sx={{ minWidth: 8, height: 8, '& .MuiChip-label': { display: 'none' } }}
                        />
                        <Typography variant="body2">{activity.action}</Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {activity.time}
                      </Typography>
                    </Box>
                    {index < recentActivities.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Box>
                ))}
              </Stack>
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                Voir toutes les activités
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions rapides */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#0A8F5C', color: 'white' }}>
            <CardContent>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    🌱 Optimisez votre gestion d'eau
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Recevez des recommandations personnalisées pour économiser l'eau et valoriser vos déchets
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: 'white',
                      color: '#0A8F5C',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      },
                    }}
                    fullWidth
                  >
                    Commencer maintenant
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
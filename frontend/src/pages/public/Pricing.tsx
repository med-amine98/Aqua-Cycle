import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Avatar,
  Stack,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
} from '@mui/material';
import {
  CheckCircle,
  Star,
  TrendingUp,
  People,
  WaterDrop,
  Speed,
  SupportAgent,
  Analytics,
  EmojiEvents,
} from '@mui/icons-material';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';

interface Plan {
  name: string;
  price: number;
  annualPrice: number;
  features: string[];
  isPopular?: boolean;
  icon: React.ReactNode;
  color: string;
}

const plans: Plan[] = [
  {
    name: 'Gratuit',
    price: 0,
    annualPrice: 0,
    icon: <People sx={{ fontSize: 32 }} />,
    color: '#4A5A6E',
    features: [
      '5 parcelles max',
      'Recommandations basiques',
      'Déclaration de déchets',
      'Accès au marché',
      'Support par email',
      'Données 7 jours',
    ],
  },
  {
    name: 'Premium',
    price: 49,
    annualPrice: 468,
    icon: <Star sx={{ fontSize: 32 }} />,
    isPopular: true,
    color: '#0A8F5C',
    features: [
      'Parcelles illimitées',
      'Recommandations avancées (IA)',
      'Analyse prédictive',
      'Détection d\'anomalies',
      'Aggrégation de déchets',
      'Support prioritaire 24/7',
      'Tableaux de bord personnalisés',
      'Export de rapports (PDF/Excel)',
      'Données historiques illimitées',
    ],
  },
  {
    name: 'Business',
    price: 99,
    annualPrice: 948,
    icon: <TrendingUp sx={{ fontSize: 32 }} />,
    color: '#ED6C02',
    features: [
      'Toutes les fonctionnalités Premium',
      'Multi-exploitations',
      'API dédiée',
      'Formation sur site',
      'Gestion d\'équipe (5 utilisateurs)',
      'Support dédié',
      'Intégrations personnalisées',
      'Rapports avancés',
      'Consulting personnalisé',
    ],
  },
];

const featuresComparison = [
  { name: 'Gestion d\'eau', free: true, premium: true, business: true },
  { name: 'Recommandations IA', free: false, premium: true, business: true },
  { name: 'Déclaration de déchets', free: true, premium: true, business: true },
  { name: 'Marché déchets', free: true, premium: true, business: true },
  { name: 'Aggrégation déchets', free: false, premium: true, business: true },
  { name: 'Analyses avancées', free: false, premium: true, business: true },
  { name: 'API dédiée', free: false, premium: false, business: true },
  { name: 'Support prioritaire', free: false, premium: true, business: true },
  { name: 'Multi-exploitations', free: false, premium: false, business: true },
  { name: 'Formation', free: false, premium: false, business: true },
];

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (plan: Plan) => isAnnual ? plan.annualPrice : plan.price;
  const getPeriod = () => isAnnual ? '/an' : '/mois';

  return (
    <Box>
      <PublicNavbar />
      
      {/* Hero Section */}
      <Box
        sx={{
          pt: { xs: 12, md: 16 },
          pb: { xs: 6, md: 8 },
          background: 'linear-gradient(135deg, #F5F7FA 0%, #E8F5E9 100%)',
        }}
      >
        <Container maxWidth="xl">
          <Box textAlign="center" mb={4}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                color: '#1A2332',
                mb: 2,
              }}
            >
              Choisissez le plan qui vous convient
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Des solutions adaptées à tous les agriculteurs et entreprises
            </Typography>

            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mt={3}
              sx={{ flexWrap: 'wrap' }}
            >
              <Typography variant="body2" color={!isAnnual ? '#0A8F5C' : 'textSecondary'}>
                Mensuel
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAnnual}
                    onChange={(e) => setIsAnnual(e.target.checked)}
                    color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#0A8F5C',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#0A8F5C',
                      },
                    }}
                  />
                }
                label=""
              />
              <Typography variant="body2" color={isAnnual ? '#0A8F5C' : 'textSecondary'}>
                Annuel
                <Chip
                  label="Économisez 20%"
                  size="small"
                  color="success"
                  sx={{ ml: 1, fontWeight: 600 }}
                />
              </Typography>
            </Box>
          </Box>

          {/* Plans */}
          <Grid container spacing={3} justifyContent="center">
            {plans.map((plan, index) => {
              const price = getPrice(plan);
              const isFree = price === 0;

              return (
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }} key={index}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card
                      sx={{
                        height: '100%',
                        position: 'relative',
                        border: plan.isPopular ? `2px solid ${plan.color}` : '1px solid #e0e0e0',
                        boxShadow: plan.isPopular ? `0 8px 40px ${plan.color}25` : '0 2px 10px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: plan.isPopular 
                            ? `0 12px 60px ${plan.color}35` 
                            : '0 8px 30px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      {plan.isPopular && (
                        <Chip
                          label="⭐ Populaire"
                          color="primary"
                          sx={{
                            position: 'absolute',
                            top: -12,
                            right: 24,
                            fontWeight: 600,
                            bgcolor: plan.color,
                            color: 'white',
                          }}
                        />
                      )}
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {/* En-tête du plan */}
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Avatar
                            sx={{
                              bgcolor: `${plan.color}15`,
                              color: plan.color,
                              width: 48,
                              height: 48,
                            }}
                          >
                            {plan.icon}
                          </Avatar>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {plan.name}
                          </Typography>
                        </Box>

                        {/* Prix */}
                        <Box display="flex" alignItems="baseline" mb={2}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 800,
                              fontSize: { xs: '2rem', md: '2.5rem' },
                              color: plan.color,
                            }}
                          >
                            {isFree ? 'Gratuit' : `${price} TND`}
                          </Typography>
                          {!isFree && (
                            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                              {getPeriod()}
                            </Typography>
                          )}
                        </Box>

                        {/* Bouton */}
                        <Button
                          fullWidth
                          variant={plan.isPopular ? 'contained' : 'outlined'}
                          onClick={() => navigate('/register')}
                          sx={{
                            mb: 3,
                            py: 1.5,
                            borderRadius: 2,
                            bgcolor: plan.isPopular ? plan.color : 'transparent',
                            borderColor: plan.color,
                            color: plan.isPopular ? 'white' : plan.color,
                            '&:hover': {
                              bgcolor: plan.isPopular ? plan.color : `${plan.color}10`,
                              borderColor: plan.color,
                            },
                          }}
                        >
                          {isFree ? 'Commencer' : 'Choisir ce plan'}
                        </Button>

                        <Divider sx={{ mb: 2 }} />

                        {/* Fonctionnalités */}
                        <List dense sx={{ p: 0 }}>
                          {plan.features.map((feature, idx) => (
                            <ListItem key={idx} sx={{ px: 0, py: 0.8 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <CheckCircle sx={{ fontSize: 20, color: plan.color }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={feature}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { fontWeight: 400 },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Zoom>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* Comparaison détaillée */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'white' }}>
        <Container maxWidth="xl">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 4,
              fontSize: { xs: '1.8rem', md: '2.2rem' },
            }}
          >
            Comparaison détaillée
          </Typography>

          <Paper
            sx={{
              overflowX: 'auto',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <Box sx={{ minWidth: { xs: 350, sm: 500 } }}>
              <Grid container sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Fonctionnalités
                  </Typography>
                  {featuresComparison.map((feature, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        py: 1.5,
                        borderBottom: '1px solid #f0f0f0',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Typography variant="body2">{feature.name}</Typography>
                    </Box>
                  ))}
                </Grid>
                {['Gratuit', 'Premium', 'Business'].map((planName, planIdx) => (
                  <Grid item xs={4} md={3} key={planIdx}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: planName === 'Premium' ? '#0A8F5C' : 'inherit',
                      }}
                    >
                      {planName}
                    </Typography>
                    {featuresComparison.map((feature, idx) => {
                      const hasFeature = feature[
                        planName.toLowerCase() as keyof typeof feature
                      ] as boolean;
                      return (
                        <Box
                          key={idx}
                          sx={{
                            py: 1.5,
                            borderBottom: '1px solid #f0f0f0',
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          {hasFeature ? (
                            <CheckCircle sx={{ fontSize: 20, color: '#0A8F5C' }} />
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              —
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#F5F7FA' }}>
        <Container maxWidth="xl">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 4,
              fontSize: { xs: '1.8rem', md: '2.2rem' },
            }}
          >
            Questions fréquentes
          </Typography>
          <Grid container spacing={3}>
            {[
              {
                q: 'Puis-je changer de plan à tout moment ?',
                a: 'Oui, vous pouvez passer d\'un plan à un autre à tout moment. Les changements sont appliqués immédiatement.',
              },
              {
                q: 'Y a-t-il un engagement ?',
                a: 'Non, aucun engagement. Vous pouvez annuler votre abonnement quand vous le souhaitez.',
              },
              {
                q: 'Que devient mon argent si je change de plan ?',
                a: 'Le montant est ajusté proportionnellement. Vous ne payez que ce que vous utilisez.',
              },
              {
                q: 'Y a-t-il une période d\'essai ?',
                a: 'Oui, le plan Gratuit vous permet de tester toutes les fonctionnalités de base sans limite de temps.',
              },
            ].map((faq, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1A2332' }}>
                    {faq.q}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {faq.a}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default Pricing;
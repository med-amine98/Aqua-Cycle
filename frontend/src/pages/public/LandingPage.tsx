import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Avatar,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Slide,
  Chip,
  LinearProgress,
  CardMedia,
  IconButton,
  Divider,
} from '@mui/material';
import {
  WaterDrop,
  Recycling,
  CheckCircle,
  People,
  Agriculture,
  RocketLaunch,
  Star,
  LocalFlorist,
  Pets,
  ArrowForward,
  TrendingUp,
  Security,
  Speed,
  Analytics,
  WhatsApp,
  LinkedIn,
  Twitter,
} from '@mui/icons-material';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';

// Images optimisées avec meilleure résolution
const farmImage = 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=1200&h=600&fit=crop&crop=center';
const waterImage = 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=800&h=500&fit=crop&crop=center';
const animalsImage = 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&h=500&fit=crop&crop=center';
const cropsImage = 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&h=500&fit=crop&crop=center';
const irrigationImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-s3ucBklmUEJNWnkqL2JH3n7NjGWBaNzFHatzhcOp28AwlhlnxOnjgaR9&s=10 ';
const technologyImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRngSMfX3fuJq6ggm4keSwFi-2UJqKziw9TyDg5y-29TGD-Jq2e40kQ5Xk&s=10';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [activeStat, setActiveStat] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <WaterDrop sx={{ fontSize: { xs: 32, md: 40 } }} />,
      title: "Gestion intelligente de l'eau",
      description: "Optimisez votre consommation d'eau avec des recommandations basées sur l'IA et les données météo en temps réel.",
      color: '#1A6EB5',
      gradient: 'linear-gradient(135deg, #1A6EB5 0%, #4B8FC7 100%)',
      stats: 'Économie jusqu\'à 40%',
      image: waterImage,
      tag: 'IA avancée',
    },
    {
      icon: <Recycling sx={{ fontSize: { xs: 32, md: 40 } }} />,
      title: 'Valorisation des déchets',
      description: 'Transformez vos déchets agricoles en opportunités économiques via notre marketplace innovante.',
      color: '#0A8F5C',
      gradient: 'linear-gradient(135deg, #0A8F5C 0%, #3AB795 100%)',
      stats: '+25% de revenus',
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&h=500&fit=crop&crop=center',
      tag: 'Économie circulaire',
    },
    {
      icon: <Pets sx={{ fontSize: { xs: 32, md: 40 } }} />,
      title: 'Santé animale avancée',
      description: 'Détectez les maladies de vos animaux par simple photo grâce à notre IA Gemini.',
      color: '#ED6C02',
      gradient: 'linear-gradient(135deg, #ED6C02 0%, #FF9800 100%)',
      stats: 'Diagnostic instantané',
      image: animalsImage,
      tag: 'Vision par IA',
    },
    {
      icon: <LocalFlorist sx={{ fontSize: { xs: 32, md: 40 } }} />,
      title: 'Santé des plantes',
      description: 'Analysez la santé de vos cultures et détectez les maladies précoces par image.',
      color: '#2E7D32',
      gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
      stats: 'Précision > 90%',
      image: cropsImage,
      tag: 'Diagnostic précoce',
    },
  ];

  const benefits = [
    {
      icon: <Speed />,
      title: 'Performance optimisée',
      desc: 'Réduisez vos coûts de production jusqu\'à 30%',
    },
    {
      icon: <Security />,
      title: 'Sécurité des données',
      desc: 'Vos données sont protégées et confidentielles',
    },
    {
      icon: <TrendingUp />,
      title: 'Croissance durable',
      desc: 'Augmentez votre productivité durablement',
    },
  ];

  const galleryImages = [
    { 
      src: farmImage, 
      title: '🌾 Fermes modernes', 
      desc: 'Optimisez votre exploitation agricole',
      stat: '+40% productivité',
    },
    { 
      src: irrigationImage, 
      title: '💦 Irrigation précise', 
      desc: 'Arrosez au bon moment avec l\'IA',
      stat: 'Économie 35% eau',
    },
    { 
      src: technologyImage, 
      title: '💻 Agriculture connectée', 
      desc: 'Technologie IA pour vos cultures',
      stat: 'Suivi en temps réel',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Agriculteurs', icon: <People />, delay: 0, trend: '+15%' },
    { value: '500+', label: 'Entreprises', icon: <Agriculture />, delay: 100, trend: '+25%' },
    { value: '50K+', label: 'Tonnes valorisées', icon: <Recycling />, delay: 200, trend: '+40%' },
    { value: '100K+', label: "m³ d'eau économisés", icon: <WaterDrop />, delay: 300, trend: '+30%' },
  ];

  const testimonials = [
    {
      name: 'Mohamed Ali',
      role: 'Agriculteur, Sousse',
      text: "AquaCycle m'a permis de réduire ma consommation d'eau de 30% tout en augmentant ma production de 20%. Une véritable révolution pour mon exploitation.",
      rating: 5,
      image: 'https://i.pravatar.cc/150?img=1',
    },
    {
      name: 'Sana Ben Slimane',
      role: 'Agricultrice, Béja',
      text: "Grâce à la plateforme, j'ai pu valoriser mes déchets et générer des revenus supplémentaires significatifs. Je recommande vivement !",
      rating: 5,
      image: 'https://i.pravatar.cc/150?img=2',
    },
    {
      name: 'Karim Mansouri',
      role: 'Propriétaire, Nabeul',
      text: "La gestion de l'eau est devenue un jeu d'enfant. Les recommandations sont précises et faciles à suivre.",
      rating: 5,
      image: 'https://i.pravatar.cc/150?img=3',
    },
  ];

  const partners = [
    { name: 'Ministère Agriculture', logo: '🌾' },
    { name: 'Banque Agricole', logo: '🏦' },
    { name: 'Groupement Oléicole', logo: '🫒' },
    { name: 'Association Environnement', logo: '🌱' },
  ];

  return (
    <Box>
      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={scrollProgress}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          zIndex: 9999,
          bgcolor: 'transparent',
          '& .MuiLinearProgress-bar': {
            bgcolor: '#0A8F5C',
            transition: 'transform 0.1s ease',
          },
        }}
      />

      <PublicNavbar />

      {/* Hero Section */}
      <Box
        ref={heroRef}
        sx={{
          minHeight: { xs: 'auto', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(165deg, #F8FAFB 0%, #E8F5E9 100%)',
          pt: { xs: 10, md: 14 },
          pb: { xs: 6, md: 10 },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(10,143,92,0.08) 0%, transparent 70%)',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in={true} timeout={800}>
                <Box>
                  <Chip
                    label="🚀 Nouvelle version 2.0"
                    color="success"
                    sx={{
                      mb: 3,
                      bgcolor: '#0A8F5C',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      px: 2,
                      py: 1,
                      '& .MuiChip-label': {
                        px: 1,
                      },
                    }}
                  />
                  
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2.2rem', sm: '3rem', md: '4rem' },
                      fontWeight: 800,
                      color: '#1A2332',
                      mb: 2,
                      lineHeight: 1.15,
                    }}
                  >
                    Optimisez vos ressources
                    <br />
                    <Typography
                      component="span"
                      sx={{
                        background: 'linear-gradient(135deg, #0A8F5C 0%, #3AB795 50%, #1A6EB5 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block',
                      }}
                    >
                      agricoles
                    </Typography>
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#4A5A6E',
                      mb: 4,
                      maxWidth: 520,
                      lineHeight: 1.7,
                      fontSize: { xs: '1rem', md: '1.2rem' },
                    }}
                  >
                    AquaCycle vous aide à gérer l'eau intelligemment, à valoriser vos déchets et à surveiller la santé de vos cultures et animaux avec l'IA.
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      endIcon={<RocketLaunch />}
                      sx={{
                        background: 'linear-gradient(135deg, #0A8F5C 0%, #3AB795 100%)',
                        px: { xs: 4, md: 5 },
                        py: { xs: 1.5, md: 1.8 },
                        borderRadius: 50,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        boxShadow: '0 8px 30px rgba(10, 143, 92, 0.35)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(10, 143, 92, 0.45)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      Commencer gratuitement
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{
                        borderColor: '#0A8F5C',
                        color: '#0A8F5C',
                        px: { xs: 4, md: 5 },
                        py: { xs: 1.5, md: 1.8 },
                        borderRadius: 50,
                        borderWidth: 2,
                        '&:hover': {
                          borderColor: '#06683F',
                          backgroundColor: 'rgba(10, 143, 92, 0.06)',
                          transform: 'translateY(-4px)',
                          borderWidth: 2,
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      Se connecter
                    </Button>
                  </Stack>

                  <Box sx={{ mt: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    {benefits.map((item, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: '#0A8F5C' }}>{item.icon}</Box>
                        <Box>
                          <Typography variant="caption" fontWeight={600} display="block">
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.desc}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Zoom in={true} timeout={600}>
                <Box sx={{ position: 'relative' }}>
                  <Card sx={{ 
                    borderRadius: 5, 
                    overflow: 'hidden', 
                    boxShadow: '0 30px 80px rgba(0,0,0,0.12)',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}>
                    <CardMedia
                      component="img"
                      height={isMobile ? 250 : 400}
                      image={farmImage}
                      alt="Ferme agricole moderne"
                      sx={{ objectFit: 'cover' }}
                    />
                    <Box sx={{ 
                      p: 4, 
                      bgcolor: 'white',
                      background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.95) 100%)',
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A2332' }}>
                        🌾 Agriculture 4.0
                      </Typography>
                      <Typography variant="body1" color="textSecondary" sx={{ mt: 1 }}>
                        Gérez votre exploitation de manière intelligente avec AquaCycle
                      </Typography>
                      <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        <Chip 
                          icon={<WaterDrop sx={{ fontSize: 16 }} />} 
                          label="Économie d'eau" 
                          size="medium" 
                          sx={{ 
                            bgcolor: '#E3F2FD', 
                            color: '#1A6EB5',
                            fontWeight: 500,
                          }} 
                        />
                        <Chip 
                          icon={<Pets sx={{ fontSize: 16 }} />} 
                          label="Santé animale" 
                          size="medium" 
                          sx={{ 
                            bgcolor: '#FFF3E0', 
                            color: '#ED6C02',
                            fontWeight: 500,
                          }} 
                        />
                        <Chip 
                          icon={<LocalFlorist sx={{ fontSize: 16 }} />} 
                          label="Santé des plantes" 
                          size="medium" 
                          sx={{ 
                            bgcolor: '#E8F5E9', 
                            color: '#2E7D32',
                            fontWeight: 500,
                          }} 
                        />
                      </Box>
                    </Box>
                  </Card>
                </Box>
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Gallery Section - 3 images proches et nettes */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={6}>
            <Chip
              label="En action"
              color="primary"
              sx={{
                mb: 2,
                bgcolor: '#E8F5E9',
                color: '#0A8F5C',
                fontWeight: 600,
                px: 2,
                py: 0.5,
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1A2332',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Découvrez AquaCycle en action
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}
            >
              Des solutions concrètes pour une agriculture durable
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {galleryImages.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Zoom in={true} style={{ transitionDelay: `${index * 150}ms` }}>
                  <Card sx={{ 
                    borderRadius: 4, 
                    overflow: 'hidden', 
                    height: '100%',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                    },
                    '&:hover .card-overlay': {
                      opacity: 1,
                    },
                    '&:hover .card-stats': {
                      transform: 'translateY(0)',
                      opacity: 1,
                    },
                  }}>
                    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                      <CardMedia
                        component="img"
                        height={280}
                        image={item.src}
                        alt={item.title}
                        sx={{ 
                          objectFit: 'cover',
                          transition: 'transform 0.6s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      />
                      <Box 
                        className="card-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 60%)',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          display: 'flex',
                          alignItems: 'flex-end',
                          p: 3,
                        }}
                      >
                        <Chip
                          className="card-stats"
                          label={item.stat}
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.95)',
                            color: '#0A8F5C',
                            fontWeight: 600,
                            transform: 'translateY(20px)',
                            opacity: 0,
                            transition: 'all 0.3s ease',
                          }}
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A2332' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FAFBFC' }}>
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Slide direction="up" in={true} style={{ transitionDelay: `${stat.delay}ms` }}>
                  <Box
                    onMouseEnter={() => setActiveStat(index)}
                    onMouseLeave={() => setActiveStat(null)}
                    textAlign="center"
                    sx={{
                      p: { xs: 3, md: 4 },
                      borderRadius: 4,
                      bgcolor: 'white',
                      boxShadow: activeStat === index 
                        ? '0 8px 40px rgba(0,0,0,0.08)' 
                        : '0 2px 20px rgba(0,0,0,0.04)',
                      transition: 'all 0.3s ease',
                      border: activeStat === index ? '2px solid #0A8F5C' : '2px solid transparent',
                      transform: activeStat === index ? 'translateY(-8px)' : 'translateY(0)',
                      position: 'relative',
                      '&::after': {
                        content: `"${stat.trend}"`,
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#0A8F5C',
                        bgcolor: '#E8F5E9',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 20,
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: '#E8F5E9',
                        width: { xs: 56, md: 64 },
                        height: { xs: 56, md: 64 },
                        mx: 'auto',
                        mb: 2,
                        transition: 'all 0.3s ease',
                        transform: activeStat === index ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #0A8F5C 0%, #3AB795 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                        mb: 0.5,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ fontSize: { xs: '0.85rem', md: '0.95rem' }, fontWeight: 500 }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </Slide>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={6}>
            <Chip
              label="Fonctionnalités"
              color="primary"
              sx={{
                mb: 2,
                bgcolor: '#E8F5E9',
                color: '#0A8F5C',
                fontWeight: 600,
                px: 2,
                py: 0.5,
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1A2332',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Pourquoi choisir AquaCycle ?
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              sx={{ fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}
            >
              Des fonctionnalités conçues pour les agriculteurs modernes
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      p: { xs: 3, md: 4 },
                      borderRadius: 4,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: hoveredCard === index ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: hoveredCard === index 
                        ? `0 24px 80px ${feature.color}20`
                        : '0 2px 30px rgba(0,0,0,0.04)',
                      border: `2px solid ${hoveredCard === index ? feature.color : 'transparent'}`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: feature.gradient,
                        opacity: hoveredCard === index ? 1 : 0,
                        transition: 'opacity 0.4s ease',
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'inline-block',
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: `${feature.color}12`,
                            width: { xs: 80, sm: 90 },
                            height: { xs: 80, sm: 90 },
                            mx: 'auto',
                            transition: 'all 0.4s ease',
                            transform: hoveredCard === index ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0)',
                            color: feature.color,
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        {hoveredCard === index && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -5,
                              right: -5,
                              width: 24,
                              height: 24,
                              bgcolor: '#0A8F5C',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: 'pulse 1.5s infinite',
                            }}
                          >
                            <CheckCircle sx={{ fontSize: 16, color: 'white' }} />
                          </Box>
                        )}
                      </Box>
                      
                      <Chip
                        label={feature.tag}
                        size="small"
                        sx={{
                          bgcolor: `${feature.color}10`,
                          color: feature.color,
                          fontWeight: 600,
                          mb: 2,
                          fontSize: '0.7rem',
                        }}
                      />
                      
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          color: '#1A2332',
                        }}
                      >
                        {feature.title}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontSize: { xs: '0.85rem', md: '0.9rem' }, mb: 2, lineHeight: 1.6 }}
                      >
                        {feature.description}
                      </Typography>
                      
                      <Box
                        sx={{
                          display: 'inline-block',
                          bgcolor: `${feature.color}08`,
                          px: 2.5,
                          py: 1,
                          borderRadius: 50,
                          border: `1px solid ${feature.color}20`,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: feature.color,
                          }}
                        >
                          {feature.stats}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F8FAFB' }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={6}>
            <Chip
              label="Témoignages"
              color="primary"
              sx={{
                mb: 2,
                bgcolor: '#E8F5E9',
                color: '#0A8F5C',
                fontWeight: 600,
                px: 2,
                py: 0.5,
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1A2332',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Ce que disent nos utilisateurs
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Fade in={true} style={{ transitionDelay: `${index * 200}ms` }}>
                  <Paper
                    sx={{
                      p: { xs: 3, sm: 4 },
                      borderRadius: 4,
                      height: '100%',
                      bgcolor: 'white',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 16px 60px rgba(0,0,0,0.08)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: 'linear-gradient(90deg, #0A8F5C, #3AB795)',
                        borderRadius: '4px 4px 0 0',
                      },
                    }}
                  >
                    <Box display="flex" mb={2}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} sx={{ color: '#FFB300', fontSize: 20, mr: 0.5 }} />
                      ))}
                    </Box>
                    
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        fontStyle: 'italic',
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        color: '#1A2332',
                        minHeight: 80,
                        lineHeight: 1.7,
                      }}
                    >
                      "{testimonial.text}"
                    </Typography>
                    
                    <Box display="flex" alignItems="center">
                      <Avatar
                        src={testimonial.image}
                        sx={{
                          width: { xs: 50, md: 60 },
                          height: { xs: 50, md: 60 },
                          mr: 2,
                          border: '3px solid #E8F5E9',
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1A2332' }}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {testimonial.role}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>


      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: 'linear-gradient(135deg, #0A8F5C 0%, #06683F 100%)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box textAlign="center">
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'white',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Prêt à transformer votre exploitation ?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                mb: 4,
                fontSize: { xs: '1rem', md: '1.1rem' },
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Rejoignez AquaCycle aujourd'hui et commencez à optimiser vos ressources
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                endIcon={<RocketLaunch />}
                sx={{
                  bgcolor: 'white',
                  color: '#0A8F5C',
                  px: { xs: 5, md: 6 },
                  py: { xs: 1.5, md: 1.8 },
                  borderRadius: 50,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 700,
                  boxShadow: '0 8px 30px rgba(255,255,255,0.25)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.95)',
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: '0 12px 40px rgba(255,255,255,0.35)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Commencer maintenant
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/pricing')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: 'white',
                  px: { xs: 5, md: 6 },
                  py: { xs: 1.5, md: 1.8 },
                  borderRadius: 50,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  borderWidth: 2,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    transform: 'translateY(-4px)',
                    borderWidth: 2,
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Voir les tarifs
              </Button>
            </Stack>
            
            <Box mt={4} display="flex" justifyContent="center" gap={3} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Aucun engagement
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Support 24/7
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Mise à jour gratuite
                </Typography>
              </Box>
            </Box>

            <Box mt={4} display="flex" justifyContent="center" gap={2}>
              <IconButton
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { color: 'white', transform: 'scale(1.1)' },
                  transition: 'all 0.3s ease',
                }}
              >
                <WhatsApp />
              </IconButton>
              <IconButton
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { color: 'white', transform: 'scale(1.1)' },
                  transition: 'all 0.3s ease',
                }}
              >
                <LinkedIn />
              </IconButton>
              <IconButton
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  '&:hover': { color: 'white', transform: 'scale(1.1)' },
                  transition: 'all 0.3s ease',
                }}
              >
                <Twitter />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(2deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default LandingPage;
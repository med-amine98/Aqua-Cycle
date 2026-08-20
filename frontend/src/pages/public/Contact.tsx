import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  Paper,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Send,
  AccessTime,
  CheckCircle,
} from '@mui/icons-material';
import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';

const Contact: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Simuler l'envoi
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <Email sx={{ fontSize: { xs: 24, md: 28 }, color: '#0A8F5C' }} />,
      title: 'Email',
      details: 'contact@aquacycle.com',
      subtitle: 'Nous répondons sous 24h',
    },
    {
      icon: <Phone sx={{ fontSize: { xs: 24, md: 28 }, color: '#0A8F5C' }} />,
      title: 'Téléphone',
      details: '+216 70 123 456',
      subtitle: 'Lun-Ven 8h-18h',
    },
    {
      icon: <LocationOn sx={{ fontSize: { xs: 24, md: 28 }, color: '#0A8F5C' }} />,
      title: 'Adresse',
      details: 'Tunis, Tunisie',
      subtitle: 'Technopole El Ghazala',
    },
    {
      icon: <AccessTime sx={{ fontSize: { xs: 24, md: 28 }, color: '#0A8F5C' }} />,
      title: 'Horaires',
      details: 'Lundi - Vendredi',
      subtitle: '8h00 - 18h00',
    },
  ];

  const socialMedia = [
    { icon: <Facebook />, label: 'Facebook', color: '#1877F2' },
    { icon: <Twitter />, label: 'Twitter', color: '#1DA1F2' },
    { icon: <LinkedIn />, label: 'LinkedIn', color: '#0A66C2' },
    { icon: <Instagram />, label: 'Instagram', color: '#E4405F' },
  ];

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
              Contactez-nous
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
              Une question ? Un projet ? Nous sommes là pour vous aider
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Informations de contact */}
            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {contactInfo.map((info, index) => (
                  <Fade in={true} key={index} style={{ transitionDelay: `${index * 100}ms` }}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: '#E8F5E9',
                            width: { xs: 48, md: 56 },
                            height: { xs: 48, md: 56 },
                            borderRadius: 2,
                          }}
                        >
                          {info.icon}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: '#1A2332' }}
                          >
                            {info.title}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500, fontSize: { xs: '0.9rem', md: '1rem' } }}
                          >
                            {info.details}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {info.subtitle}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Fade>
                ))}

                {/* Réseaux sociaux */}
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Suivez-nous
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {socialMedia.map((social, index) => (
                      <IconButton
                        key={index}
                        sx={{
                          bgcolor: `${social.color}15`,
                          color: social.color,
                          '&:hover': {
                            bgcolor: social.color,
                            color: 'white',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {social.icon}
                      </IconButton>
                    ))}
                  </Box>
                </Paper>
              </Stack>
            </Grid>

            {/* Formulaire */}
            <Grid item xs={12} md={8}>
              <Fade in={true}>
                <Paper
                  sx={{
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, mb: 3, color: '#1A2332' }}
                  >
                    Envoyez-nous un message
                  </Typography>

                  {success && (
                    <Alert
                      severity="success"
                      icon={<CheckCircle />}
                      sx={{ mb: 3, borderRadius: 2 }}
                    >
                      ✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                    </Alert>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Votre nom"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          disabled={loading}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Votre email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={loading}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Sujet"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                          disabled={loading}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          label="Message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                          disabled={loading}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading}
                          endIcon={!loading && <Send />}
                          sx={{
                            minWidth: { xs: '100%', sm: 200 },
                            py: 1.5,
                            borderRadius: 2,
                            bgcolor: '#0A8F5C',
                            '&:hover': {
                              bgcolor: '#06683F',
                            },
                          }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : 'Envoyer'}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </Paper>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Carte */}
      <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'white' }}>
        <Container maxWidth="xl">
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 3,
              color: '#1A2332',
            }}
          >
            Où nous trouver
          </Typography>
          <Paper
            sx={{
              height: { xs: 200, sm: 300, md: 400 },
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              component="iframe"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3194.5!2d10.1815!3d36.8065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd337f5e7ef543%3A0xd6719ed4131f1d3f!2sTunis!5e0!3m2!1sfr!2stn!4v1699999999999!5m2!1sfr!2stn"
              sx={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allowFullScreen
              loading="lazy"
              title="Localisation"
            />
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default Contact;
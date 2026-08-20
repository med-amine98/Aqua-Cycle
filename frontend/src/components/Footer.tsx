import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';

const Footer: React.FC = () => {
  return (
    <Box sx={{ bgcolor: '#1A2332', color: 'white', py: 6 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              AquaCycle
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
              Smart Water & Circular Agriculture
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Optimisez vos ressources en eau et valorisez vos déchets agricoles
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Liens utiles
            </Typography>
            <Stack spacing={1}>
              <Link href="/" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                Accueil
              </Link>
              <Link href="/pricing" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                Tarifs
              </Link>
              <Link href="/contact" color="inherit" underline="hover" sx={{ opacity: 0.7 }}>
                Contact
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Contact
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Email sx={{ fontSize: 20, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  contact@aquacycle.com
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Phone sx={{ fontSize: 20, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  +216 70 123 456
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <LocationOn sx={{ fontSize: 20, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Tunis, Tunisie
                </Typography>
              </Box>
            </Stack>
            <Box display="flex" gap={1} mt={2}>
              <IconButton sx={{ color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                <LinkedIn />
              </IconButton>
              <IconButton sx={{ color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}>
                <Instagram />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Typography variant="body2" align="center" sx={{ opacity: 0.7 }}>
          © {new Date().getFullYear()} AquaCycle. Tous droits réservés.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
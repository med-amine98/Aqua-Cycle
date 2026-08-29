import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  WaterDrop,
  Close as CloseIcon,
  Sparkles,
  ArrowForward,
} from '@mui/icons-material';

const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { text: 'Accueil', path: '/' },
    { text: 'Fonctionnalités', path: '/#features' },
    { text: 'Tarifs', path: '/pricing' },
    { text: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/#')) return location.pathname === '/';
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    if (path.startsWith('/#')) {
      const section = path.replace('/#', '');
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      navigate(path);
    }
    setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 300, p: 3, height: '100%', bgcolor: '#FFFFFF' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: 'rgba(10, 143, 92, 0.12)', color: '#0A8F5C', width: 42, height: 42, borderRadius: 3 }}>
            <WaterDrop sx={{ fontSize: 26 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            AquaCycle
          </Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ mb: 4 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              borderRadius: 3,
              mb: 1,
              py: 1.2,
              backgroundColor: isActive(item.path) ? 'rgba(10, 143, 92, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(10, 143, 92, 0.12)',
              },
            }}
          >
            <ListItemText
              primary={item.text}
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive(item.path) ? 700 : 500,
                  color: isActive(item.path) ? '#0A8F5C' : '#334155',
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      <Stack spacing={2}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            navigate('/login');
            setDrawerOpen(false);
          }}
          sx={{ borderRadius: 12, py: 1.2 }}
        >
          Connexion
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            navigate('/register');
            setDrawerOpen(false);
          }}
          sx={{ borderRadius: 12, py: 1.2 }}
        >
          Essai Gratuit
        </Button>
      </Stack>
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        py: 0.5,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0, sm: 2 } }}>
          {/* Logo */}
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer' }}
          >
            <Avatar sx={{ bgcolor: 'rgba(10, 143, 92, 0.12)', color: '#0A8F5C', width: 42, height: 42, borderRadius: 3 }}>
              <WaterDrop sx={{ fontSize: 26 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                AquaCycle
              </Typography>
              <Typography variant="caption" sx={{ color: '#0A8F5C', fontWeight: 700, fontSize: '0.7rem' }}>
                SMART WATER & CIRCULAR AGRI
              </Typography>
            </Box>
          </Box>

          {/* Desktop Links */}
          {!isMobile && (
            <Box display="flex" alignItems="center" gap={1}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: isActive(item.path) ? '#0A8F5C' : '#475569',
                    fontWeight: isActive(item.path) ? 700 : 600,
                    px: 2,
                    py: 0.8,
                    borderRadius: 10,
                    bgcolor: isActive(item.path) ? 'rgba(10, 143, 92, 0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(10, 143, 92, 0.1)',
                      color: '#0A8F5C',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}

          {/* Action Buttons */}
          {!isMobile ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ fontWeight: 700, color: '#334155' }}
              >
                Connexion
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                endIcon={<ArrowForward />}
                sx={{
                  borderRadius: 12,
                  px: 2.5,
                  py: 1,
                  boxShadow: '0 4px 14px rgba(10, 143, 92, 0.25)',
                }}
              >
                Découvrir la Plateforme
              </Button>
            </Stack>
          ) : (
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#0F172A' }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default PublicNavbar;
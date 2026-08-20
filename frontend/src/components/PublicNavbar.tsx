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
} from '@mui/material';
import {
  Menu as MenuIcon,
  WaterDrop,
  Close as CloseIcon,
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
    <Box sx={{ width: 280, p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <WaterDrop sx={{ color: '#0A8F5C', fontSize: 32, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0A8F5C' }}>
            AquaCycle
          </Typography>
        </Box>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              backgroundColor: isActive(item.path) ? 'rgba(10, 143, 92, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(10, 143, 92, 0.04)',
              },
            }}
          >
            <ListItemText
              primary={item.text}
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: isActive(item.path) ? 600 : 400,
                  color: isActive(item.path) ? '#0A8F5C' : '#1A2332',
                },
              }}
            />
          </ListItem>
        ))}
        <ListItem
          button
          onClick={() => { navigate('/login'); setDrawerOpen(false); }}
          sx={{
            borderRadius: 2,
            mt: 2,
            bgcolor: '#0A8F5C',
            '&:hover': {
              bgcolor: '#06683F',
            },
          }}
        >
          <ListItemText
            primary="Se connecter"
            sx={{
              '& .MuiTypography-root': {
                color: 'white',
                fontWeight: 600,
                textAlign: 'center',
              },
            }}
          />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 20px rgba(0,0,0,0.06)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Logo */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <WaterDrop sx={{ color: '#0A8F5C', fontSize: 32, mr: 1 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#0A8F5C',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                AquaCycle
              </Typography>
            </Box>

            {/* Menu Desktop */}
            {!isMobile ? (
              <Box display="flex" alignItems="center" gap={1}>
                {menuItems.map((item) => (
                  <Button
                    key={item.text}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      color: isActive(item.path) ? '#0A8F5C' : '#4A5A6E',
                      fontWeight: isActive(item.path) ? 600 : 400,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(10, 143, 92, 0.04)',
                        color: '#0A8F5C',
                      },
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
                <Button
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={{
                    ml: 2,
                    borderRadius: 10,
                    px: 3,
                    py: 1,
                    bgcolor: '#0A8F5C',
                    '&:hover': {
                      bgcolor: '#06683F',
                    },
                  }}
                >
                  Se connecter
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: 10,
                    px: 3,
                    py: 1,
                    borderColor: '#0A8F5C',
                    color: '#0A8F5C',
                    '&:hover': {
                      borderColor: '#06683F',
                      backgroundColor: 'rgba(10, 143, 92, 0.04)',
                    },
                  }}
                >
                  S'inscrire
                </Button>
              </Box>
            ) : (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#1A2332' }}>
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer Mobile */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderBottomLeftRadius: 20,
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default PublicNavbar;
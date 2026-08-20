import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Container,
  Divider,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  WaterDrop as WaterIcon,
  Recycling as WasteIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  ContactMail as ContactIcon,
  Payment as PaymentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';

const drawerWidth = 280;

const menuItems = [
  { text: 'Accueil', icon: <HomeIcon />, path: '/' },
  { text: "Gestion de l'eau", icon: <WaterIcon />, path: '/water' },
  { text: 'Déclarer des déchets', icon: <WasteIcon />, path: '/waste/declare' },
  { text: 'Marché des déchets', icon: <PeopleIcon />, path: '/waste/market' },
  { text: 'Tarifs', icon: <PaymentIcon />, path: '/pricing' },
  { text: 'Contact', icon: <ContactIcon />, path: '/contact' },
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, initialize } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token && !user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WaterIcon sx={{ color: '#0A8F5C', fontSize: 32, mr: 1 }} />
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, color: '#0A8F5C' }}>
            AquaCycle
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: isActive ? 'rgba(10, 143, 92, 0.08)' : 'transparent',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(10, 143, 92, 0.12)' : 'rgba(0,0,0,0.04)',
                },
                '& .MuiListItemIcon-root': {
                  color: isActive ? '#0A8F5C' : '#4A5A6E',
                  minWidth: 40,
                },
                '& .MuiListItemText-primary': {
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#0A8F5C' : '#1A2332',
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: '#0A8F5C',
              width: 40,
              height: 40,
              mr: 1.5,
            }}
          >
            {getInitials(user?.full_name || '')}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.full_name || 'Utilisateur'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {user?.role === 'farmer' ? '👨‍🌾 Agriculteur' : user?.role === 'company' ? '🏢 Entreprise' : '👤 Utilisateur'}
            </Typography>
          </Box>
        </Box>
        {user?.is_premium && (
          <Box sx={{ 
            bgcolor: '#FFF3E0', 
            borderRadius: 2, 
            p: 1, 
            textAlign: 'center',
            border: '1px solid #FFE0B2',
          }}>
            <Typography variant="caption" color="warning.main" sx={{ fontWeight: 600 }}>
              ⭐ Premium
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: '#1A2332' }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, color: '#1A2332' }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'AquaCycle'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton sx={{ color: '#4A5A6E' }}>
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Button
              onClick={handleMenuOpen}
              sx={{
                borderRadius: 10,
                px: 2,
                py: 0.5,
                color: '#1A2332',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: '#0A8F5C',
                  width: 32,
                  height: 32,
                  mr: 1,
                  fontSize: '0.875rem',
                }}
              >
                {getInitials(user?.full_name || '')}
              </Avatar>
              {!isMobile && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {user?.full_name || 'Utilisateur'}
                </Typography>
              )}
            </Button>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 200,
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              },
            }}
          >
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Mon profil" />
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Paramètres" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: '#D32F2F' }}>
              <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#D32F2F' }} /></ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              borderRight: '1px solid rgba(0,0,0,0.05)',
              backgroundColor: '#FAFBFC',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#F5F7FA',
          minHeight: '100vh',
        }}
      >
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  List as MuiList,
  ListItemAvatar,
  ListItemText as MuiListItemText,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';

import {
  Healing as HealingIcon,
  Grass as GrassIcon,
  Dashboard as DashboardIcon,
  WaterDrop as WaterIcon,
  Recycling as WasteIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Agriculture as AgricultureIcon,
  BarChart as BarChartIcon,
  Pets as PetsIcon,
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import AquaCopilot from './AquaCopilot';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Mes Fermes', icon: <AgricultureIcon />, path: '/farms' },
  { text: "Gestion de l'eau", icon: <WaterIcon />, path: '/water' },
  { text: 'Élevage', icon: <PetsIcon />, path: '/animals' },
  { text: 'Santé Animale', icon: <HealingIcon />, path: '/animals/health' },
  { text: 'Santé des Plantes', icon: <GrassIcon />, path: '/plants/health' },
  { text: 'Déclarer des déchets', icon: <WasteIcon />, path: '/waste/declare' },
  { text: 'Marché des déchets', icon: <PeopleIcon />, path: '/waste/market' },
  { text: 'Finances', icon: <AttachMoneyIcon />, path: '/finance' },
  { text: 'Données', icon: <BarChartIcon />, path: '/data' },
  { text: 'Profil', icon: <PersonIcon />, path: '/profile' },
  { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
];

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: React.ReactNode;
}

const PrivateLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, initialize } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  useEffect(() => {
    initialize();
    loadNotifications();
    
    // Polling toutes les 30 secondes pour les nouvelles notifications
    const interval = setInterval(loadNotifications, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token && !user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Charger les notifications via API REST
  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
      
      // Vérifier les nouvelles notifications non lues
      const unread = response.data.filter((n: any) => !n.read);
      if (unread.length > 0) {
        // Afficher un snackbar pour la première notification non lue
        const latest = unread[0];
        setSnackbarMessage(latest.message);
        setSnackbarSeverity(latest.type);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleIcon sx={{ color: '#2E7D32' }} />;
      case 'warning': return <WarningIcon sx={{ color: '#ED6C02' }} />;
      case 'error': return <ErrorIcon sx={{ color: '#D32F2F' }} />;
      default: return <InfoIcon sx={{ color: '#1A6EB5' }} />;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
    navigate('/');
    handleMenuClose();
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHour < 24) return `Il y a ${diffHour} h`;
    if (diffDay < 7) return `Il y a ${diffDay} j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'success': return '#2E7D32';
      case 'warning': return '#ED6C02';
      case 'error': return '#D32F2F';
      default: return '#1A6EB5';
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <WaterIcon sx={{ color: '#0A8F5C', fontSize: 32, mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0A8F5C' }}>
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
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
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
            <Tooltip title={`Notifications (${unreadCount} non lues)`}>
              <IconButton
                sx={{ color: '#4A5A6E' }}
                onClick={() => setNotificationDialogOpen(true)}
              >
                <Badge badgeContent={unreadCount} color="error">
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

      {/* Dialog Notifications */}
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: '70vh',
            maxHeight: 600,
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          pb: 2,
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationsIcon sx={{ color: '#0A8F5C' }} />
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} non lues`} size="small" color="primary" />
            )}
          </Box>
          <Box>
            {notifications.length > 0 && (
              <>
                <Button size="small" onClick={markAllAsRead} sx={{ mr: 1 }}>
                  Tout marquer lu
                </Button>
                <IconButton onClick={() => setNotificationDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsIcon sx={{ fontSize: 64, color: '#ccc' }} />
              <Typography variant="body1" color="textSecondary">
                Aucune notification
              </Typography>
            </Box>
          ) : (
            <MuiList sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : '#F5F7FA',
                      '&:hover': {
                        bgcolor: '#E8F5E9',
                      },
                      transition: 'all 0.2s ease',
                    }}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => deleteNotification(notification.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}15` }}>
                        {notification.icon || getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <MuiListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip label="Nouveau" size="small" color="error" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </>
                      }
                      onClick={() => markAsRead(notification.id)}
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </MuiList>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Floating AquaCopilot Widget */}
      <AquaCopilot />
    </Box>
  );
};

export default PrivateLayout;
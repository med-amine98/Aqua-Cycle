import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  Paper,
} from '@mui/material';
import { MyLocation, LocationOn, Search } from '@mui/icons-material';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  address?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  address = '',
}) => {
  const [open, setOpen] = useState(false);
  const [lat, setLat] = useState(latitude || 36.8065);
  const [lng, setLng] = useState(longitude || 10.1815);
  const [addressText, setAddressText] = useState(address);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Récupérer la position GPS
  const getCurrentLocation = () => {
    setLoading(true);
    setError('');
    
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLoading(false);
        // Récupérer l'adresse à partir des coordonnées
        reverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError(`Erreur de géolocalisation: ${err.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Reverse geocoding avec l'API Google Maps (ou OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Utiliser l'API Nominatim (OpenStreetMap) - gratuit, pas besoin de clé
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddressText(data.display_name);
      }
    } catch (error) {
      console.error('Erreur de reverse geocoding:', error);
    }
  };

  // Rechercher une adresse
  const searchAddress = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        setLat(parseFloat(result.lat));
        setLng(parseFloat(result.lon));
        setAddressText(result.display_name);
      } else {
        setError('Aucune adresse trouvée');
      }
    } catch (error) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onLocationChange(lat, lng, addressText);
    setOpen(false);
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          bgcolor: '#F5F7FA',
          cursor: 'pointer',
          '&:hover': { bgcolor: '#E8F5E9' },
        }}
        onClick={() => setOpen(true)}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <LocationOn sx={{ color: '#0A8F5C' }} />
          <Box flex={1}>
            <Typography variant="body2" color="textSecondary">
              {addressText || 'Cliquez pour choisir votre localisation'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Latitude: {lat.toFixed(6)}, Longitude: {lng.toFixed(6)}
            </Typography>
          </Box>
          <Button size="small" variant="outlined">
            Modifier
          </Button>
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOn sx={{ color: '#0A8F5C' }} />
            Choisir la localisation
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Recherche d'adresse */}
            <Box display="flex" gap={1} mb={2}>
              <TextField
                fullWidth
                size="small"
                label="Rechercher une adresse"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAddress(addressText)}
              />
              <Button
                variant="outlined"
                onClick={() => searchAddress(addressText)}
                startIcon={<Search />}
              >
                Rechercher
              </Button>
            </Box>

            <Box display="flex" gap={1} mb={2}>
              <Button
                variant="contained"
                startIcon={<MyLocation />}
                onClick={getCurrentLocation}
                disabled={loading}
                sx={{ bgcolor: '#0A8F5C' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Utiliser ma position GPS'}
              </Button>
            </Box>

            {/* Carte OpenStreetMap */}
            <Box
              sx={{
                height: 400,
                bgcolor: '#E8F0F0',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <iframe
                title="Carte"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                allowFullScreen
              />
            </Box>

            <Box display="flex" gap={2} mt={2}>
              <TextField
                fullWidth
                size="small"
                label="Latitude"
                type="number"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                inputProps={{ step: 0.000001 }}
              />
              <TextField
                fullWidth
                size="small"
                label="Longitude"
                type="number"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                inputProps={{ step: 0.000001 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ bgcolor: '#0A8F5C' }}
          >
            Confirmer la localisation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationPicker;
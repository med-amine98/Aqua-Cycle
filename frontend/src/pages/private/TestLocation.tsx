import React from 'react';
import { Box, Typography } from '@mui/material';
import LocationPicker from '../../components/LocationPicker';

const TestLocation: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test de géolocalisation
      </Typography>
      <LocationPicker
        latitude={36.8065}
        longitude={10.1815}
        onLocationChange={(lat, lng, address) => {
          console.log('📍 Nouvelle position:', { lat, lng, address });
        }}
        address="Tunis, Tunisie"
      />
    </Box>
  );
};

export default TestLocation;
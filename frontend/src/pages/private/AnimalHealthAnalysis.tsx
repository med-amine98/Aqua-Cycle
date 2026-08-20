import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Pets, Biotech } from '@mui/icons-material';
import MultiAIHealthAnalyzer from '../../components/MultiAIHealthAnalyzer';

const AnimalHealthAnalysis: React.FC = () => {
  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: -0.5 }}>
            <Pets sx={{ color: '#ED6C02', fontSize: 36 }} />
            Analyse de Santé Animale & Vétérinaire IA
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5 }}>
            Diagnostic d'élevage par Vision Artificielle: CNN + YOLOv8 + Gemini Vétérinaire Expert
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip icon={<Biotech sx={{ color: '#ED6C02 !important' }} />} label="Modèle Vétérinaire Réel" variant="outlined" sx={{ fontWeight: 700 }} />
        </Box>
      </Box>

      {/* Multi-AI Analyzer Component for Animals */}
      <MultiAIHealthAnalyzer type="animal" />
    </Box>
  );
};

export default AnimalHealthAnalysis;
import React from 'react';
import { Box, Typography, Chip, Container } from '@mui/material';
import { Spa, Biotech } from '@mui/icons-material';
import MultiAIHealthAnalyzer from '../../components/MultiAIHealthAnalyzer';

const PlantHealthAnalysis: React.FC = () => {
  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: -0.5 }}>
            <Spa sx={{ color: '#0A8F5C', fontSize: 36 }} />
            Analyse de Santé des Plantes par Réseaux IA
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5 }}>
            Diagnostic réels par Deep Learning: ResNet-50, YOLOv8 Target Localization & Gemini Vision 2.0
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip icon={<Biotech sx={{ color: '#0A8F5C !important' }} />} label="PyTorch ResNet-50" variant="outlined" sx={{ fontWeight: 700 }} />
          <Chip icon={<Biotech sx={{ color: '#0288D1 !important' }} />} label="YOLOv8 Object Detector" variant="outlined" sx={{ fontWeight: 700 }} />
        </Box>
      </Box>

      {/* Multi-AI Analyzer Component */}
      <MultiAIHealthAnalyzer type="plant" />
    </Box>
  );
};

export default PlantHealthAnalysis;
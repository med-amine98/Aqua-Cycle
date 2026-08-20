import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Image as ImageIcon,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Science,
} from '@mui/icons-material';
import { api } from '../services/api';

interface AnalysisResult {
  plant_type?: string;
  animal_type?: string;
  health_status: string;
  disease_name?: string;
  confidence: number;
  symptoms?: string[];
  treatment?: string;
  prevention?: string;
  urgency: string;
  recommendations?: string[];
  nutrition_need?: string;
  veterinary_care?: string;
}

interface ImageAnalyzerProps {
  type: 'plant' | 'animal';
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ type, onAnalysisComplete }) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError('Veuillez sélectionner une image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      
      const endpoint = type === 'plant' ? '/ai/analysis/plant' : '/ai/analysis/animal';
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      setDialogOpen(true);
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'analyse');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
      case 'sain':
        return '#2E7D32';
      case 'bon':
        return '#4CAF50';
      case 'moyen':
      case 'legerement_malade':
        return '#ED6C02';
      case 'critique':
      case 'malade':
        return '#D32F2F';
      default:
        return '#4A5A6E';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
      case 'sain':
        return <CheckCircle sx={{ color: '#2E7D32' }} />;
      case 'bon':
        return <CheckCircle sx={{ color: '#4CAF50' }} />;
      case 'moyen':
      case 'legerement_malade':
        return <Warning sx={{ color: '#ED6C02' }} />;
      case 'critique':
      case 'malade':
        return <ErrorIcon sx={{ color: '#D32F2F' }} />;
      default:
        return <Science />;
    }
  };

  return (
    <Box>
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science sx={{ color: '#0A8F5C' }} />
            {type === 'plant' ? '🌱 Analyse de santé des plantes' : '🐄 Analyse de santé des animaux'}
            <Chip label="IA" size="small" color="primary" />
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!preview ? (
            <Box
              sx={{
                border: '2px dashed #ddd',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#0A8F5C',
                  bgcolor: '#F5F7FA',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <CloudUpload sx={{ fontSize: 48, color: '#ccc' }} />
              <Typography variant="body1" color="textSecondary">
                Cliquez pour sélectionner une image
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {type === 'plant' ? 'Photo de plante, feuille ou culture' : 'Photo d\'animal'}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Box sx={{ position: 'relative', mb: 2 }}>
                <img
                  src={preview}
                  alt="Prévisualisation"
                  style={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'contain',
                    borderRadius: 8,
                  }}
                />
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    borderRadius: 20,
                  }}
                >
                  Supprimer
                </Button>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleAnalyze}
                disabled={loading}
                sx={{ bgcolor: '#0A8F5C' }}
              >
                {loading ? <CircularProgress size={24} /> : '🔬 Analyser avec IA'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog des résultats */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {getHealthIcon(result?.health_status || '')}
            <Typography variant="h6">
              Résultats de l'analyse
            </Typography>
            <Chip
              label={result?.health_status || 'Non déterminé'}
              size="small"
              sx={{
                bgcolor: `${getHealthColor(result?.health_status || '')}15`,
                color: getHealthColor(result?.health_status || ''),
                fontWeight: 600,
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {result && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: '#F5F7FA' }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Type identifié
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.plant_type || result.animal_type || 'Non identifié'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, bgcolor: '#F5F7FA' }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Confiance
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {result.confidence || 0}%
                    </Typography>
                  </Paper>
                </Grid>
                {result.disease_name && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#FFF3E0', border: '1px solid #FFE0B2' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Warning color="warning" />
                        <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 700 }}>
                          Détection de signes visuels (Vision par ordinateur)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1.5, color: '#555' }}>
                        AquaCycle utilise la vision par ordinateur pour détecter des signes visuels potentiellement associés à certaines maladies et générer une alerte pour l'agriculteur.
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#D84315' }}>
                        {result.disease_name}
                      </Typography>
                      <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(255, 152, 0, 0.08)' }}>
                        <strong>⚠️ Avis de non-responsabilité :</strong> Cette analyse est fournie à titre purement indicatif. Elle ne remplace pas un diagnostic professionnel. Veuillez consulter un agronome ou vétérinaire qualifié.
                      </Alert>
                    </Paper>
                  </Grid>
                )}
                {result.symptoms && result.symptoms.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Symptômes observés
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {result.symptoms.map((symptom, index) => (
                        <Chip key={index} label={symptom} size="small" />
                      ))}
                    </Box>
                  </Grid>
                )}
                {result.treatment && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#E8F5E9' }}>
                      <Typography variant="subtitle2" color="success.main">
                        Traitement recommandé
                      </Typography>
                      <Typography variant="body2">{result.treatment}</Typography>
                    </Paper>
                  </Grid>
                )}
                {result.prevention && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#E3F2FD' }}>
                      <Typography variant="subtitle2" color="primary.main">
                        Mesures préventives
                      </Typography>
                      <Typography variant="body2">{result.prevention}</Typography>
                    </Paper>
                  </Grid>
                )}
                {result.recommendations && result.recommendations.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Recommandations
                    </Typography>
                    <Box>
                      {result.recommendations.map((rec, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {rec}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
          <Button
            variant="contained"
            onClick={() => setDialogOpen(false)}
            sx={{ bgcolor: '#0A8F5C' }}
          >
            Enregistrer l'analyse
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageAnalyzer;
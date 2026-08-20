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
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Science,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Pets,
  Agriculture,
  Close,
  MedicalServices,
  LocalPharmacy,
  WaterDrop,
} from '@mui/icons-material';
import { api } from '../services/api';

interface HealthResult {
  plant_type?: string;
  animal_type?: string;
  breed?: string;
  health_status: string;
  disease_name?: string;
  disease_description?: string;
  confidence: number;
  symptoms?: string[];
  treatment?: string;
  prevention?: string;
  urgency: string;
  recommendations?: string[];
  weight_estimate?: number;
  body_condition_score?: number;
  veterinary_care?: string;
  nutrition_need?: string;
  estimated_age?: string;
  water_need?: string;
  fertilizer_need?: string;
  severity?: string;
  estimated_recovery_time?: string;
}

interface HealthAnalyzerProps {
  type: 'animal' | 'plant';
  itemId?: string;
  onAnalysisComplete?: (result: HealthResult) => void;
}

const HealthAnalyzer: React.FC<HealthAnalyzerProps> = ({ 
  type, 
  itemId, 
  onAnalysisComplete 
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 10MB');
        return;
      }
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
      if (itemId) {
        formData.append(`${type}_id`, itemId);
      }
      
      const endpoint = type === 'plant' 
        ? '/health/analyze/plant' 
        : '/health/analyze/animal';
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.result);
      // Ajouter à l'historique
      setHistory(prev => [{
        id: response.data.analysis_id,
        type: type,
        date: new Date().toISOString(),
        result: response.data.result,
        confidence: response.data.confidence,
      }, ...prev]);
      
      setDialogOpen(true);
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data.result);
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

  const getTypeIcon = () => {
    return type === 'animal' ? <Pets sx={{ fontSize: 40 }} /> : <Agriculture sx={{ fontSize: 40 }} />;
  };

  const getTypeLabel = () => {
    return type === 'animal' ? 'Animal' : 'Plante';
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'élevée': return '🚨 Urgent';
      case 'moyenne': return '⚠️ Modéré';
      case 'faible': return 'ℹ️ Informative';
      default: return 'ℹ️ Informative';
    }
  };

  return (
    <Box>
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science sx={{ color: '#0A8F5C' }} />
            {type === 'animal' ? '🐄 Analyse de santé animale' : '🌱 Analyse de santé des plantes'}
            <Chip label="IA" size="small" color="primary" />
            <Chip 
              label="Gemini" 
              size="small" 
              variant="outlined" 
              color="secondary" 
            />
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
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
                transition: 'all 0.3s ease',
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
              <CloudUpload sx={{ fontSize: 64, color: '#ccc' }} />
              <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                Cliquez pour sélectionner une image
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {type === 'animal' ? 'Photo d\'animal' : 'Photo de plante ou feuille'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Format accepté: JPG, PNG, WEBP (max 10MB)
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
                    maxHeight: 350,
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
                sx={{ 
                  bgcolor: '#0A8F5C', 
                  borderRadius: 2, 
                  py: 1.5,
                  '&:hover': { bgcolor: '#06683F' },
                }}
              >
                {loading ? <CircularProgress size={24} /> : '🔬 Analyser avec IA Gemini'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog des résultats */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              {getHealthIcon(result?.health_status || '')}
              <Typography variant="h6">
                Résultats de l'analyse {getTypeLabel().toLowerCase()}
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
              <Chip
                label={`Confiance ${result?.confidence || 0}%`}
                size="small"
                color="primary"
              />
              {result?.urgency && (
                <Chip
                  label={getUrgencyLabel(result.urgency)}
                  size="small"
                  color={result.urgency === 'élevée' ? 'error' : result.urgency === 'moyenne' ? 'warning' : 'default'}
                />
              )}
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {result && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                {/* Type identifié */}
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#F5F7FA' }}>
                    <Typography variant="caption" color="textSecondary">
                      {type === 'animal' ? 'Animal' : 'Plante'} identifié
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {result.animal_type || result.plant_type || 'Non identifié'}
                    </Typography>
                    {result.breed && (
                      <Typography variant="body2" color="textSecondary">
                        Race: {result.breed}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Poids estimé */}
                {result.weight_estimate && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#F5F7FA' }}>
                      <Typography variant="caption" color="textSecondary">
                        Poids estimé
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {result.weight_estimate} kg
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Score corporel */}
                {result.body_condition_score && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#F5F7FA' }}>
                      <Typography variant="caption" color="textSecondary">
                        Score corporel
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {result.body_condition_score}/5
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Âge estimé */}
                {result.estimated_age && (
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: '#F5F7FA' }}>
                      <Typography variant="caption" color="textSecondary">
                        Âge estimé
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {result.estimated_age}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Maladie détectée */}
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
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#D84315' }}>
                        {result.disease_name}
                      </Typography>
                      {result.disease_description && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {result.disease_description}
                        </Typography>
                      )}
                      {result.severity && (
                        <Chip
                          label={`Sévérité potentielle: ${result.severity}`}
                          size="small"
                          color={result.severity === 'élevée' ? 'error' : 'warning'}
                          sx={{ mt: 1 }}
                        />
                      )}
                      
                      <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(255, 152, 0, 0.08)' }}>
                        <strong>⚠️ Avis de non-responsabilité :</strong> Cette analyse est fournie à titre purement indicatif pour assister l'agriculteur dans sa surveillance de terrain. Elle ne constitue en aucun cas un diagnostic officiel ou définitif. Veuillez consulter un agronome ou vétérinaire qualifié pour confirmer l'état de santé.
                      </Alert>
                    </Paper>
                  </Grid>
                )}

                {/* Symptômes */}
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

                {/* Traitement */}
                {result.treatment && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#E8F5E9' }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalPharmacy sx={{ color: '#2E7D32' }} />
                        <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 600 }}>
                          Traitement recommandé
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {result.treatment}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Prévention */}
                {result.prevention && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#E3F2FD' }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <MedicalServices sx={{ color: '#1A6EB5' }} />
                        <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
                          Mesures préventives
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {result.prevention}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Soins vétérinaires */}
                {result.veterinary_care && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#FCE4EC' }}>
                      <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 600 }}>
                        🏥 Soins vétérinaires recommandés
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {result.veterinary_care}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Besoins */}
                <Grid item xs={12} sm={6}>
                  {result.water_need && (
                    <Paper sx={{ p: 2, bgcolor: '#E0F7FA' }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <WaterDrop sx={{ color: '#1A6EB5' }} />
                        <Typography variant="subtitle2" color="info.main" sx={{ fontWeight: 600 }}>
                          Besoin en eau
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {result.water_need}
                      </Typography>
                    </Paper>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  {result.fertilizer_need && (
                    <Paper sx={{ p: 2, bgcolor: '#F1F8E9' }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Agriculture sx={{ color: '#0A8F5C' }} />
                        <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 600 }}>
                          Besoin en engrais
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {result.fertilizer_need}
                      </Typography>
                    </Paper>
                  )}
                </Grid>

                {result.nutrition_need && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#FFF8E1' }}>
                      <Typography variant="subtitle2" color="warning.main" sx={{ fontWeight: 600 }}>
                        🍽️ Besoin nutritionnel
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {result.nutrition_need}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {result.estimated_recovery_time && (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      ⏱️ Temps de récupération estimé: {result.estimated_recovery_time}
                    </Alert>
                  </Grid>
                )}

                {/* Recommandations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      📋 Recommandations
                    </Typography>
                    <Box>
                      {result.recommendations.map((rec, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <span>•</span>
                          <span>{rec}</span>
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
            onClick={() => {
              // Sauvegarder l'analyse
              setDialogOpen(false);
            }}
            sx={{ bgcolor: '#0A8F5C' }}
          >
            Enregistrer l'analyse
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historique des analyses */}
      {history.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            📊 Historique des analyses
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {history.slice(0, 5).map((item, index) => (
              <Chip
                key={index}
                label={`#${index + 1} - ${new Date(item.date).toLocaleDateString()} (${item.confidence}%)`}
                size="small"
                color={item.result.health_status === 'excellent' ? 'success' : 'default'}
                onClick={() => {
                  setResult(item.result);
                  setDialogOpen(true);
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default HealthAnalyzer;
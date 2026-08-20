import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Psychology,
  CenterFocusWeak,
  AutoAwesome,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  LocalPharmacy,
  MedicalServices,
  WaterDrop,
  Biotech,
} from '@mui/icons-material';
import { api } from '../services/api';

interface MultiAIHealthAnalyzerProps {
  type: 'plant' | 'animal';
}

export const MultiAIHealthAnalyzer: React.FC<MultiAIHealthAnalyzerProps> = ({ type }) => {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 10MB");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const handleRunCombinedAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('analysis_type', type);

      const res = await api.post('/health/analyze/combined', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysisResult(res.data.result);
    } catch (err: any) {
      console.error('Erreur analyse combinée:', err);
      setError(err.response?.data?.detail || "Erreur lors de l'analyse IA multi-modèles");
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing for YOLOv8 Bounding Boxes
  useEffect(() => {
    if (!preview || !canvasRef.current || !analysisResult) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgElement = new Image();
    imgElement.src = preview;
    imgElement.onload = () => {
      canvas.width = imgElement.naturalWidth || 640;
      canvas.height = imgElement.naturalHeight || 480;

      // Draw original image
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

      // Draw YOLO bounding boxes if present
      const detections = analysisResult.yolo?.detections || [];
      detections.forEach((det: any) => {
        const { x1, y1, x2, y2 } = det.bbox;
        const color = det.color || '#FF8800';

        // Box
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        // Label Background
        ctx.fillStyle = color;
        const label = `${det.label_fr || det.class_name} (${det.confidence}%)`;
        ctx.font = 'bold 16px sans-serif';
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x1, y1 - 26 > 0 ? y1 - 26 : y1, textWidth + 12, 26);

        // Label Text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, x1 + 6, y1 - 26 > 0 ? y1 - 8 : y1 + 18);
      });
    };
  }, [preview, analysisResult]);

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sain': return '#2E7D32';
      case 'bon': return '#4CAF50';
      case 'legerement_malade': return '#ED6C02';
      case 'malade':
      case 'critique': return '#D32F2F';
      default: return '#475569';
    }
  };

  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', mb: 4 }}>
      <Box sx={{ p: 3, background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)', color: '#fff' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Biotech sx={{ fontSize: 40, color: '#00E676' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                Analyse IA Multi-Modèles Réelle (CNN + YOLOv8 + Gemini)
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                Réseaux de Neurones Convolutifs (ResNet-50) & Localisation par Boîtes Englobantes (YOLOv8)
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Chip icon={<CenterFocusWeak sx={{ color: '#fff !important' }} />} label="YOLOv8 Target BBoxes" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }} />
            <Chip icon={<Psychology sx={{ color: '#fff !important' }} />} label="ResNet-50 CNN" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }} />
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Section Sélection / Affichage Image Canvas */}
          <Grid item xs={12} md={6}>
            {!preview ? (
              <Box
                sx={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: 3,
                  p: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: '#F8FAFC',
                  '&:hover': { borderColor: '#0A8F5C', bgcolor: '#F1F5F9' },
                  transition: 'all 0.3s ease',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageSelect} />
                <CloudUpload sx={{ fontSize: 72, color: '#94A3B8' }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 700, color: '#1E293B' }}>
                  Sélectionnez une photo pour l'analyse IA réelle
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {type === 'plant' ? 'Feuille, tige ou fruit de la culture' : 'Photo de l\'animal d\'élevage'}
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', bgcolor: '#000' }}>
                  <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', maxHeight: 420, objectFit: 'contain', display: 'block' }} />
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleRemoveImage}
                    sx={{ position: 'absolute', top: 12, right: 12, borderRadius: 20 }}
                  >
                    Effacer
                  </Button>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleRunCombinedAnalysis}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                  sx={{ bgcolor: '#0A8F5C', borderRadius: 3, py: 1.8, fontWeight: 700, fontSize: '1rem', '&:hover': { bgcolor: '#06683F' } }}
                >
                  {loading ? 'Exécution des Réseaux de Neurones CNN & YOLO...' : '🚀 Lancer l\'Analyse IA Multi-Modèles Réelle'}
                </Button>
              </Box>
            )}

            {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
          </Grid>

          {/* Result Panel */}
          <Grid item xs={12} md={6}>
            {analysisResult ? (
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip
                    label={`Consensus: ${analysisResult.consensus?.health_status || 'Sain'}`}
                    sx={{
                      bgcolor: `${getHealthColor(analysisResult.consensus?.health_status)}15`,
                      color: getHealthColor(analysisResult.consensus?.health_status),
                      fontWeight: 800,
                      fontSize: '0.9rem',
                    }}
                  />
                  <Chip label={`Confiance Réelle Fusionnée: ${analysisResult.consensus?.merged_confidence || 85}%`} color="primary" sx={{ fontWeight: 700 }} />
                </Box>

                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="🌟 Consensus Global" />
                  <Tab label="🎯 YOLOv8 BBoxes" />
                  <Tab label="🧠 CNN ResNet-50" />
                </Tabs>

                {/* Tab 0: Consensus */}
                {activeTab === 0 && (
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Paper sx={{ p: 2, bgcolor: '#FFF8E1', border: '1px solid #FFE0B2', borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Warning color="warning" />
                        <Typography variant="subtitle2" sx={{ color: '#E65100', fontWeight: 700 }}>
                          Détection de signes visuels (Vision par ordinateur)
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1, color: '#555', fontSize: '0.85rem' }}>
                        AquaCycle utilise la vision par ordinateur pour détecter des signes visuels potentiellement associés à certaines maladies et générer une alerte pour l'agriculteur.
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#BF360C' }}>
                        {analysisResult.consensus?.disease_name || 'Aucune anomalie critique'}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, color: '#5D4037' }}>
                        Sévérité potentielle: <strong>{analysisResult.consensus?.severity || 'Faible'}</strong>
                      </Typography>
                      
                      <Alert severity="warning" sx={{ mt: 1.5, bgcolor: 'rgba(255, 152, 0, 0.05)', fontSize: '0.8rem', py: 0.5 }}>
                        <strong>⚠️ Note :</strong> Cette analyse est indicative pour votre vigilance et ne remplace pas un diagnostic professionnel.
                      </Alert>
                    </Paper>

                    {analysisResult.consensus?.treatment && (
                      <Paper sx={{ p: 2, bgcolor: '#E8F5E9', border: '1px solid #C8E6C9', borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <LocalPharmacy sx={{ color: '#2E7D32' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1B5E20' }}>Traitement Agronomique Recommandé</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#2E7D32' }}>{analysisResult.consensus.treatment}</Typography>
                      </Paper>
                    )}
                  </Box>
                )}

                {/* Tab 1: YOLOv8 Bounding Boxes */}
                {activeTab === 1 && (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Zones Détectées et Localisées par YOLOv8 ({analysisResult.yolo?.detection_count || 0})
                    </Typography>
                    {(analysisResult.yolo?.detections || []).map((det: any, idx: number) => (
                      <Paper key={idx} sx={{ p: 1.5, borderLeft: `4px solid ${det.color || '#FF8800'}`, bgcolor: '#F8FAFC' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {det.label_fr || det.class_name} ({det.confidence}%)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Boîte Englobante Coordinates: X1={det.bbox.x1}, Y1={det.bbox.y1}, X2={det.bbox.x2}, Y2={det.bbox.y2}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Tab 2: CNN ResNet-50 */}
                {activeTab === 2 && (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Classifications Top-5 par Réseau CNN ResNet-50
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#F1F5F9' }}>
                      <Typography variant="body2"><strong>Plante:</strong> {analysisResult.cnn?.plant_type}</Typography>
                      <Typography variant="body2"><strong>Diagnostic CNN:</strong> {analysisResult.cnn?.disease_name}</Typography>
                      <Typography variant="body2"><strong>Confiance Top-1:</strong> {analysisResult.cnn?.confidence}%</Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            ) : (
              <Paper elevation={0} sx={{ p: 6, borderRadius: 3, border: '2px dashed #E2E8F0', bgcolor: '#F8FAFC', textAlign: 'center' }}>
                <Psychology sx={{ fontSize: 64, color: '#CBD5E1' }} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 700, color: '#64748B' }}>
                  Aucune analyse lancée
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Chargez une photo et cliquez sur le bouton pour démarrer l'analyse réseau de neurones réelle.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
export default MultiAIHealthAnalyzer;

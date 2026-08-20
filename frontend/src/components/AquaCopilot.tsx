import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  IconButton,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  SmartToy,
  Close,
  Send,
  Psychology,
  WaterDrop,
  Agriculture,
  CheckCircle,
} from '@mui/icons-material';
import { api } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AquaCopilot: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Bonjour ! Je suis AquaCopilot, votre assistant IA agronomique et circulaire. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/gemini/chat', {
        message: textToSend,
        context: 'agriculture_circulaire_et_gestion_eau',
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.data.response || 'Je suis à votre disposition pour optimiser votre ferme.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Copilot error:', err);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Une erreur est survenue lors de la consultation d\'AquaCopilot. Veuillez réessayer.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const promptChips = [
    '💧 Plan d\'irrigation de demain',
    '🌱 Traitement oïdium tomate',
    '🌾 Calculer économie d\'eau',
    '♻️ Valoriser mes déchets de taille',
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          bgcolor: '#0A8F5C',
          '&:hover': { bgcolor: '#06683F' },
          boxShadow: '0 8px 30px rgba(10,143,92,0.4)',
          zIndex: 1200,
        }}
      >
        <SmartToy sx={{ fontSize: 30 }} />
      </Fab>

      {/* Floating Chat Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 95,
            right: 28,
            m: 0,
            borderRadius: 4,
            height: 520,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          },
        }}
      >
        {/* Chat Header */}
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #0A8F5C 0%, #1A6EB5 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
              <Psychology />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                AquaCopilot IA
              </Typography>

            </Box>
          </Box>
          <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Messages Body */}
        <DialogContent sx={{ p: 2, bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {messages.map((m) => (
            <Box key={m.id} display="flex" justifyContent={m.sender === 'user' ? 'flex-end' : 'flex-start'}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  maxWidth: '85%',
                  borderRadius: m.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  bgcolor: m.sender === 'user' ? '#0A8F5C' : '#FFFFFF',
                  color: m.sender === 'user' ? '#FFFFFF' : '#0F172A',
                  border: m.sender === 'ai' ? '1px solid #E2E8F0' : 'none',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontSize: '0.88rem' }}>
                  {m.text}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', opacity: 0.7, fontSize: '0.68rem' }}>
                  {m.timestamp}
                </Typography>
              </Paper>
            </Box>
          ))}
          {loading && (
            <Box display="flex" gap={1} alignItems="center" sx={{ ml: 1 }}>
              <CircularProgress size={16} sx={{ color: '#0A8F5C' }} />
              <Typography variant="caption" color="textSecondary">AquaCopilot réfléchit...</Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </DialogContent>

        {/* Prompt Chips & Input */}
        <Box sx={{ p: 1.5, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          <Box display="flex" gap={0.5} overflow="auto" pb={1} sx={{ '&::-webkit-scrollbar': { display: 'none' } }}>
            {promptChips.map((chip, idx) => (
              <Chip
                key={idx}
                label={chip}
                size="small"
                onClick={() => handleSend(chip)}
                sx={{ fontSize: '0.72rem', cursor: 'pointer', bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
              />
            ))}
          </Box>

          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Posez votre question agronomique..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <IconButton
              color="primary"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              sx={{ bgcolor: '#0A8F5C', color: '#fff', '&:hover': { bgcolor: '#06683F' }, '&.Mui-disabled': { bgcolor: '#E2E8F0' } }}
            >
              <Send fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};
export default AquaCopilot;

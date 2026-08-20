import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const geminiService = {
  getIrrigationRecommendations: async (data: any) => {
    const response = await axios.post(`${API_URL}/ai/gemini/irrigation`, data);
    return response.data;
  },

  analyzeSoil: async (data: any) => {
    const response = await axios.post(`${API_URL}/ai/gemini/soil-analysis`, data);
    return response.data;
  },

  chat: async (message: string, context?: string) => {
    const response = await axios.post(`${API_URL}/ai/gemini/chat`, { 
      message, 
      context: context || 'agriculture' 
    });
    return response.data;
  },

  detectDisease: async (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await axios.post(`${API_URL}/ai/gemini/detect-disease`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
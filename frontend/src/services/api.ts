import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Créer une instance axios avec configuration de base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Désactivé car on utilise le token dans le header
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si erreur 401 (non autorisé) ou 403 (interdit)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Supprimer le token
      localStorage.removeItem('access_token');
      localStorage.removeItem('auth-storage');
      
      // Rediriger vers la page de login si on n'y est pas déjà
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Service d'authentification
export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  registerSimple: (data: any) => api.post('/auth/register-simple', data),
  
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await fetch(`${API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur de connexion');
    }
    
    const data = await response.json();
    
    // Sauvegarder le token immédiatement
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    
    return data;
  },
  
  loginJson: (data: any) => api.post('/auth/login-json', data),
  getProfile: () => api.get('/auth/me'),
  check: () => api.get('/auth/check'),
  verifyToken: () => api.get('/auth/verify-token'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth-storage');
    window.location.href = '/login';
  },
};

// Service de gestion de l'eau
export const waterService = {
  getRecommendations: (farmId: string) => 
    api.get(`/water/recommendations/${farmId}`),
  getBudget: (farmId: string, year?: number, month?: number) =>
    api.get(`/water/budget/${farmId}`, { params: { year, month } }),
  detectAnomaly: (farmId: string, plotId: string, actualWater: number) =>
    api.post('/water/anomalies/detect', { farm_id: farmId, plot_id: plotId, actual_water: actualWater }),
};

// Service de gestion des déchets
export const wasteService = {
  declareWaste: (data: any) => api.post('/waste/declare', data),
  getAvailableWaste: (params?: any) => api.get('/waste/available', { params }),
  findMatches: (wasteId: string) => api.get(`/waste/matches/${wasteId}`),
  aggregateWaste: (wasteIds: string[]) => api.post('/waste/aggregate', wasteIds),
  initiateTransaction: (data: any) => api.post('/waste/transaction/initiate', data),
};

// Service de gestion des fermes
export const farmService = {
  // Fermes
  createFarm: (data: any) => api.post('/farms', data),
  getFarms: () => api.get('/farms'),
  getFarm: (id: string) => api.get(`/farms/${id}`),
  updateFarm: (id: string, data: any) => api.put(`/farms/${id}`, data),
  deleteFarm: (id: string) => api.delete(`/farms/${id}`),
  
  // Cultures
  addCrop: (farmId: string, data: any) => api.post(`/farms/${farmId}/crops`, data),
  getCrops: (farmId: string) => api.get(`/farms/${farmId}/crops`),
  updateCrop: (farmId: string, cropId: string, data: any) => 
    api.put(`/farms/${farmId}/crops/${cropId}`, data),
  deleteCrop: (farmId: string, cropId: string) => 
    api.delete(`/farms/${farmId}/crops/${cropId}`),
  
  // Données d'eau
  addWaterData: (farmId: string, data: any) => api.post(`/farms/${farmId}/water`, data),
  getWaterData: (farmId: string) => api.get(`/farms/${farmId}/water`),
  
  // Recommandations
  getRecommendations: (farmId: string) => api.post(`/farms/${farmId}/recommendations`),
};

// Export par défaut
export default {
  api,
  authService,
  waterService,
  wasteService,
  farmService,
};
import { api } from './api';

export const farmService = {
  // Fermes
  createFarm: (data: any) => api.post('/farms', data),
  getFarms: () => api.get('/farms'),
  getFarm: (id: string) => api.get(`/farms/${id}`),
  updateFarm: (id: string, data: any) => api.put(`/farms/${id}`, data),
  deleteFarm: (id: string) => api.delete(`/farms/${id}`),
  
  // Cultures - Format attendu par le backend
  addCrop: (farmId: string, data: any) => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    
    // Les données doivent correspondre au modèle CropCreate du backend
    const cropData = {
      name: data.name || '',
      variety: data.variety || '',
      type: data.type || 'Autre',
      growth_stage: data.growth_stage || data.growthStage || 'Végétatif',
      planting_date: data.planting_date || data.plantingDate || new Date().toISOString().split('T')[0],
      area: data.area || 0,
      expected_yield: data.expected_yield || data.expectedYield || 0,
      irrigation_type: data.irrigation_type || data.irrigationType || '',
      notes: data.notes || '',
    };
    
    return api.post(`/farms/${cleanFarmId}/crops`, cropData);
  },
  
  getCrops: (farmId: string) => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    return api.get(`/farms/${cleanFarmId}/crops`);
  },
  
  updateCrop: (farmId: string, cropId: string, data: any) => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    const cropData = {
      name: data.name || '',
      variety: data.variety || '',
      type: data.type || 'Autre',
      growth_stage: data.growth_stage || data.growthStage || 'Végétatif',
      planting_date: data.planting_date || data.plantingDate || new Date().toISOString().split('T')[0],
      area: data.area || 0,
      expected_yield: data.expected_yield || data.expectedYield || 0,
      irrigation_type: data.irrigation_type || data.irrigationType || '',
      notes: data.notes || '',
    };
    return api.put(`/farms/${cleanFarmId}/crops/${cropId}`, cropData);
  },
  
  deleteCrop: (farmId: string, cropId: string) => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    return api.delete(`/farms/${cleanFarmId}/crops/${cropId}`);
  },
  
  // Données d'eau - Format attendu par le backend
  addWaterData: (farmId: string, data: any) => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    
    const waterData = {
      date: data.date || new Date().toISOString().split('T')[0],
      source: data.source || '',
      volume: data.volume || 0,
      used_for: data.used_for || data.usedFor || 'irrigation',
      status: data.status || 'planned',
      notes: data.notes || '',
    };
    
    return api.post(`/farms/${cleanFarmId}/water`, waterData);
  },
  
  getWaterData: (farmId: string) => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    return api.get(`/farms/${cleanFarmId}/water`);
  },
  
  // Recommandations
  getRecommendations: (farmId: string) => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    return api.post(`/farms/${cleanFarmId}/recommendations`, {});
  },
};
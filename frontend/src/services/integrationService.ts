import { api } from './api';

export interface CropScore {
  crop_id: string;
  crop_name: string;
  score: number;
  grade: string;
  color: string;
  area_weight: number;
  factors: {
    [key: string]: {
      score: number;
      weight: number;
      label: string;
      detail: string;
    };
  };
}

export interface HealthScore {
  overall_score: number;
  grade: string;
  color: string;
  message: string;
  computed_at: string;
  factors: {
    [key: string]: {
      score: number;
      weight: number;
      label: string;
    };
  };
  crop_scores: CropScore[];
}

export interface SmartAlert {
  id: string;
  type: string;
  priority: 'critique' | 'haute' | 'moyenne' | 'basse';
  icon: string;
  title: string;
  message: string;
  action: string;
  module_source: string;
  timestamp: string;
}

export interface ActionableRecommendation {
  id: string;
  category: string;
  priority: 'critique' | 'haute' | 'moyenne' | 'basse';
  title: string;
  description: string;
  action: string;
  impact_estimate: string;
  confidence: number;
  module_sources: string[];
  icon: string;
}

export interface FarmStatus {
  farm_id: string;
  farm_name: string;
  computed_at: string;
  health_score: HealthScore;
  alerts: SmartAlert[];
  recommendations: ActionableRecommendation[];
  weather: {
    current: any;
    forecast: any[];
    source: string;
  };
  water_prediction: {
    predictions: any[];
    total_predicted_m3: number;
    model: string;
  };
  waste_marketplace: {
    available_count: number;
    organic_count: number;
  };
  pipeline: {
    [key: string]: {
      status: string;
      [key: string]: any;
    };
  };
  status: string;
}

export const integrationService = {
  getFarmStatus: async (farmId: string): Promise<FarmStatus> => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    const response = await api.get(`/integration/farm-status/${cleanFarmId}`);
    return response.data;
  },

  getHealthScore: async (farmId: string): Promise<HealthScore> => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    const response = await api.get(`/integration/health-score/${cleanFarmId}`);
    return response.data;
  },

  getSmartAlerts: async (farmId: string): Promise<{ alerts: SmartAlert[]; count: number; critical: number }> => {
    const cleanFarmId = farmId.replace(/^\/+/, '');
    const response = await api.get(`/integration/smart-alerts/${cleanFarmId}`);
    return response.data;
  }
};

export default integrationService;

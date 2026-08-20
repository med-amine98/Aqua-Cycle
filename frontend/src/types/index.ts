export interface Farm {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  totalArea: number;
  soilType: string;
  irrigationSystem: string;
  waterAvailability: number;
  createdAt: string;
}

export interface Crop {
  id: string;
  name: string;
  variety: string;
  type: string;
  growthStage: string;
  plantingDate: string;
  area: number;
  expectedYield: number;
  irrigationType: string;
  notes: string;
  farmId: string;
}

export interface WaterData {
  id: string;
  date: string;
  source: string;
  volume: number;
  usedFor: string;
  status: 'planned' | 'done';
  notes: string;
  farmId: string;
}

export interface WasteDeclaration {
  id: string;
  type: string;
  quantity: number;
  availabilityDate: string;
  location: string;
  latitude: number;
  longitude: number;
  quality: string;
  description: string;
  price: number;
  status: string;
  farmerId: string;
}

export interface FarmInput {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  totalArea: number;
  soilType: string;
  irrigationSystem: string;
  waterAvailability: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  volume: number;
  priority: 'low' | 'medium' | 'high';
  date: string;
  status: 'pending' | 'applied' | 'ignored';
}

export interface AIChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
}
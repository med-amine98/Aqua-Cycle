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

// ==================== SUPPLY CHAIN TYPES ====================

export interface StorageFacility {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  available_capacity: number;
  accepted_waste_types: string;
  storage_cost_per_unit: number;
  description?: string;
  is_active?: boolean;
}

export interface StorageFacilityInput {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  available_capacity: number;
  accepted_waste_types: string;
  storage_cost_per_unit: number;
  description?: string;
}

export interface StorageRecommendation {
  facility_id: string;
  facility_name: string;
  location: string;
  distance_km: number;
  available_capacity: number;
  storage_cost_per_unit: number;
  match_score: number;
}

export interface WasteOffer {
  id: string;
  waste_id: string;
  waste_type?: string;
  waste_location?: string;
  waste_latitude?: number;
  waste_longitude?: number;
  farmer_name?: string;
  company_id: string;
  company_name?: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  created_at?: string;
}

export interface WasteOfferInput {
  waste_id: string;
  company_id: string;
  quantity: number;
  price_per_unit: number;
  message?: string;
}

export interface CollectionOrder {
  id: string;
  offer_id: string;
  waste_id: string;
  waste_type?: string;
  farmer_name?: string;
  company_id: string;
  company_name?: string;
  storage_facility_id?: string | null;
  storage_facility_name?: string | null;
  quantity: number;
  pickup_location: string;
  destination: string;
  status: 'scheduled' | 'picked_up' | 'in_transit' | 'delivered' | 'stored' | 'cancelled';
  estimated_distance_km?: number;
  transport_cost?: number;
  created_at?: string;
}

export interface CollectionOrderInput {
  offer_id: string;
  pickup_location: string;
  destination: string;
  storage_facility_id?: string | null;
  estimated_distance_km?: number;
  transport_cost?: number;
}

export interface CollectionStop {
  waste_id: string;
  farmer_id: string;
  location: string;
  quantity: number;
  distance_to_storage_km: number;
}

export interface CollectionPlan {
  status: string;
  storage_facility: {
    id: string;
    name: string;
    location: string;
  };
  total_quantity: number;
  number_of_farms: number;
  collection_stops: CollectionStop[];
  estimated_total_distance_km: number;
  recommendation: string;
}

export interface CompanyProfile {
  id: string;
  company_name: string;
  waste_interests: string | string[];
  min_quantity: number;
  max_distance: number;
}

export interface CompanyProfileInput {
  company_name: string;
  waste_interests: string[];
  min_quantity?: number;
  max_distance?: number;
}
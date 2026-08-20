// frontend/src/services/predictionService.ts

import { farmService } from './farmService';
import { weatherService } from './weatherService';

export interface WaterPrediction {
  date: string;
  predictedConsumption: number;
  confidence: number;
  factors: {
    temperature: number;
    humidity: number;
    precipitation: number;
    cropStage: string;
    soilMoisture: number;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'critique' | 'haute' | 'moyenne' | 'basse';
  confidence: number;
  impact_estimate: string;
  icon: string;
  category: 'irrigation' | 'disease_prevention' | 'fertilization' | 'harvest' | 'general';
  module_sources: string[];
  data: any;
}

export interface HealthScore {
  overall_score: number;
  grade: string;
  color: string;
  message: string;
  factors: {
    ndvi: { score: number; label: string };
    disease: { score: number; label: string };
    water: { score: number; label: string };
    weather: { score: number; label: string };
  };
}

export interface SmartAlert {
  id: string;
  type: 'water_stress' | 'weather_extreme' | 'disease_detection' | 'weather_warning' | 'consumption_anomaly' | 'waste_valorisation';
  title: string;
  message: string;
  priority: 'critique' | 'haute' | 'moyenne' | 'basse';
  action: string;
  icon: string;
  timestamp?: string;
}

// Interface pour les données de ferme
interface FarmData {
  id: number | string;
  name: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  total_area?: number;
  soil_type?: string;
}

// Interface pour les données de culture
interface CropData {
  id: number | string;
  name: string;
  type?: string;
  growthStage?: string;
  health?: number;
  healthScore?: number;
  diseaseRisk?: number;
  stage?: string;
}

// Interface pour les données d'eau
interface WaterData {
  id: number | string;
  volume?: number;
  total_used?: number;
  date?: string;
}

class PredictionService {
  /**
   * Extrait les données d'une réponse API
   */
  private extractData<T>(response: any): T[] {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data) return Array.isArray(response.data) ? response.data : [];
    if (response.results) return Array.isArray(response.results) ? response.results : [];
    if (response.crops) return Array.isArray(response.crops) ? response.crops : [];
    if (response.items) return Array.isArray(response.items) ? response.items : [];
    if (response.farms) return Array.isArray(response.farms) ? response.farms : [];
    return [];
  }

  /**
   * Extrait une seule entité d'une réponse API
   */
  private extractSingle<T>(response: any): T | null {
    if (!response) return null;
    if (typeof response === 'object') {
      // Si la réponse a une propriété data
      if (response.data && typeof response.data === 'object') {
        return response.data as T;
      }
      // Si la réponse est directement l'objet
      return response as T;
    }
    return null;
  }

  /**
   * Calcule la prédiction de consommation d'eau pour les prochains jours
   */
  async getWaterPredictions(farmId: number): Promise<WaterPrediction[]> {
    try {
      // Convertir l'ID en string pour les appels API
      const farmIdStr = String(farmId);
      
      // Récupérer les données nécessaires
      const cropsResponse = await farmService.getCrops(farmIdStr);
      const waterResponse = await farmService.getWaterData(farmIdStr);
      const farmResponse = await farmService.getFarm(farmIdStr);

      const cropsArray = this.extractData<CropData>(cropsResponse);
      const waterArray = this.extractData<WaterData>(waterResponse);
      
      // Extraire les données de la ferme
      const farm = this.extractSingle<FarmData>(farmResponse);
      
      // Récupérer la météo
      let weather = null;
      if (farm?.latitude && farm?.longitude) {
        try {
          weather = await weatherService.getWeatherData(farm.latitude, farm.longitude);
        } catch (e) {
          console.warn('Erreur météo:', e);
        }
      }

      // Calculer la consommation de base
      const baseConsumption = waterArray.reduce((sum: number, w: WaterData) => sum + (w.volume || w.total_used || 0), 0) || 1000;
      const cropCount = cropsArray.length || 1;

      // Générer les prédictions pour les 5 prochains jours
      const predictions: WaterPrediction[] = [];
      const now = new Date();

      for (let i = 1; i <= 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);

        // Facteurs saisonniers
        const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
        const seasonalFactor = 0.7 + 0.3 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);

        // Facteur météo si disponible
        let weatherFactor = 1;
        let temp = 25;
        let humidity = 60;
        let precip = 0;

        if (weather?.forecast && weather.forecast.length > i - 1) {
          const forecast = weather.forecast[i - 1];
          temp = forecast.temperature.average || 25;
          humidity = forecast.humidity || 60;
          precip = forecast.precipitation || 0;
          
          // Plus il fait chaud, plus la consommation augmente
          weatherFactor = 0.8 + 0.02 * (temp - 15);
          // La pluie réduit le besoin en eau
          if (precip > 5) weatherFactor *= 0.8;
          if (precip > 10) weatherFactor *= 0.7;
        }

        // Facteur de stade de croissance
        let cropStageFactor = 1;
        let cropStage = 'Maturation';
        if (cropsArray.length > 0) {
          const crop = cropsArray[Math.floor(Math.random() * cropsArray.length)];
          cropStage = crop.growthStage || crop.stage || 'Maturation';
          
          const stageFactors: { [key: string]: number } = {
            'Semis': 0.6,
            'Croissance': 0.9,
            'Floraison': 1.3,
            'Fructification': 1.3,
            'Maturation': 1.0,
            'Récolte': 0.7,
          };
          cropStageFactor = stageFactors[cropStage] || 1.0;
        }

        // Consommation prédite
        const predictedConsumption = Math.round(
          baseConsumption * 
          (0.8 + 0.2 * (i / 5)) * 
          seasonalFactor * 
          weatherFactor * 
          cropStageFactor *
          (0.9 + 0.1 * (cropCount / 10))
        );

        // Confiance (plus on s'éloigne, moins la confiance est élevée)
        const confidence = Math.round(92 - (i - 1) * 2.5);

        predictions.push({
          date: date.toISOString(),
          predictedConsumption: Math.max(predictedConsumption, 100),
          confidence: Math.max(confidence, 75),
          factors: {
            temperature: Math.round(temp),
            humidity: Math.round(humidity),
            precipitation: Math.round(precip * 10) / 10,
            cropStage,
            soilMoisture: Math.round((0.5 + 0.5 * (1 - i / 6)) * 100),
          }
        });
      }

      return predictions;
    } catch (error) {
      console.error('Erreur génération prédictions:', error);
      return [];
    }
  }

  /**
   * Génère des recommandations IA basées sur les données réelles
   */
  async getRecommendations(farmId: number): Promise<Recommendation[]> {
    try {
      const recommendations: Recommendation[] = [];

      // Convertir l'ID en string pour les appels API
      const farmIdStr = String(farmId);

      // Récupérer les données
      const cropsResponse = await farmService.getCrops(farmIdStr);
      const waterResponse = await farmService.getWaterData(farmIdStr);
      const farmResponse = await farmService.getFarm(farmIdStr);

      const cropsArray = this.extractData<CropData>(cropsResponse);
      const waterArray = this.extractData<WaterData>(waterResponse);
      
      // Extraire les données de la ferme
      const farm = this.extractSingle<FarmData>(farmResponse);

      // Récupérer la météo
      let weather = null;
      if (farm?.latitude && farm?.longitude) {
        try {
          weather = await weatherService.getWeatherData(farm.latitude, farm.longitude);
        } catch (e) {
          console.warn('Erreur météo:', e);
        }
      }

      // 1. Recommandation d'irrigation basée sur la météo
      if (weather?.current) {
        const temp = weather.current.temperature;
        const humidity = weather.current.humidity;
        const precipitation = weather.current.precipitation;

        // Vérifier le stress hydrique
        const waterUsage = waterArray.reduce((sum: number, w: WaterData) => sum + (w.volume || w.total_used || 0), 0);
        const avgUsage = waterUsage / (waterArray.length || 1);

        if (temp > 30 && humidity < 40 && precipitation < 5) {
          recommendations.push({
            id: `rec-irrigation-${Date.now()}`,
            title: 'Stress hydrique détecté',
            description: `Température élevée (${Math.round(temp)}°C) et faible humidité (${Math.round(humidity)}%). La consommation d'eau est de ${Math.round(avgUsage)} L.`,
            action: 'Augmenter l\'irrigation de 20% et arroser tôt le matin',
            priority: 'haute',
            confidence: 88,
            impact_estimate: 'Économie d\'eau estimée : 15%',
            icon: '💧',
            category: 'irrigation',
            module_sources: ['weather', 'water_prediction'],
            data: { temp, humidity, precipitation, avgUsage },
          });
        } else if (precipitation > 15) {
          recommendations.push({
            id: `rec-rain-${Date.now()}`,
            title: 'Pluies abondantes prévues',
            description: `${Math.round(precipitation)}mm de pluie sont attendus. Réduisez l'irrigation pour éviter le gaspillage.`,
            action: 'Réduire l\'irrigation de 50% pour les 2 prochains jours',
            priority: 'moyenne',
            confidence: 85,
            impact_estimate: 'Économie d\'eau : 30%',
            icon: '🌧️',
            category: 'irrigation',
            module_sources: ['weather'],
            data: { precipitation },
          });
        } else if (temp > 35) {
          recommendations.push({
            id: `rec-heat-${Date.now()}`,
            title: 'Alerte canicule',
            description: `Température extrême (${Math.round(temp)}°C) détectée. Risque de stress pour les cultures.`,
            action: 'Protéger les cultures avec des filets d\'ombrage et arroser abondamment le soir',
            priority: 'critique',
            confidence: 92,
            impact_estimate: 'Protection des cultures contre le stress thermique',
            icon: '☀️',
            category: 'general',
            module_sources: ['weather'],
            data: { temp, humidity },
          });
        } else if (humidity > 85) {
          recommendations.push({
            id: `rec-humidity-${Date.now()}`,
            title: 'Humidité élevée',
            description: `Humidité à ${Math.round(humidity)}%. Risque de maladies fongiques.`,
            action: 'Appliquer un traitement préventif anti-fongique et augmenter la ventilation',
            priority: 'moyenne',
            confidence: 80,
            impact_estimate: 'Réduction du risque de maladie de 70%',
            icon: '💧',
            category: 'disease_prevention',
            module_sources: ['weather'],
            data: { humidity },
          });
        }
      }

      // 2. Recommandation basée sur les cultures
      if (cropsArray.length > 0) {
        // Vérifier les stades de croissance
        const floweringCrops = cropsArray.filter((c: CropData) => 
          c.growthStage === 'Floraison' || c.growthStage === 'flowering'
        );

        if (floweringCrops.length > 0) {
          recommendations.push({
            id: `rec-flowering-${Date.now()}`,
            title: 'Période de floraison',
            description: `${floweringCrops.length} culture(s) sont en période de floraison. C'est une phase critique pour le rendement.`,
            action: 'Apporter un engrais riche en potassium et maintenir une irrigation régulière',
            priority: 'haute',
            confidence: 90,
            impact_estimate: '+25% de rendement potentiel',
            icon: '🌺',
            category: 'fertilization',
            module_sources: ['crop_health'],
            data: { floweringCrops: floweringCrops.length },
          });
        }

        // Vérifier les cultures en maturation
        const maturingCrops = cropsArray.filter((c: CropData) => 
          c.growthStage === 'Maturation' || c.growthStage === 'maturation' || c.growthStage === 'Harvest'
        );

        if (maturingCrops.length > 0) {
          recommendations.push({
            id: `rec-harvest-${Date.now()}`,
            title: 'Préparation récolte',
            description: `${maturingCrops.length} culture(s) approchent de la maturité. Préparez la récolte.`,
            action: 'Réduire l\'irrigation de 30% pour favoriser la maturation et planifier la récolte',
            priority: 'moyenne',
            confidence: 85,
            impact_estimate: 'Qualité de récolte améliorée',
            icon: '🌾',
            category: 'harvest',
            module_sources: ['crop_health'],
            data: { maturingCrops: maturingCrops.length },
          });
        }
      }

      // 3. Recommandation basée sur l'historique de l'eau
      if (waterArray.length > 3) {
        const recentUsage = waterArray.slice(-3).reduce((sum: number, w: WaterData) => sum + (w.volume || w.total_used || 0), 0);
        const avgRecent = recentUsage / 3;
        const allAvg = waterArray.reduce((sum: number, w: WaterData) => sum + (w.volume || w.total_used || 0), 0) / waterArray.length;

        if (avgRecent > allAvg * 1.2) {
          recommendations.push({
            id: `rec-water-anomaly-${Date.now()}`,
            title: 'Consommation d\'eau anormale',
            description: `La consommation d'eau a augmenté de ${Math.round((avgRecent / allAvg - 1) * 100)}% récemment.`,
            action: 'Vérifier les fuites et l\'état du système d\'irrigation',
            priority: 'haute',
            confidence: 78,
            impact_estimate: 'Réduction des pertes d\'eau',
            icon: '⚠️',
            category: 'general',
            module_sources: ['water_prediction'],
            data: { avgRecent, allAvg },
          });
        }
      }

      // 4. Recommandations basées sur la météo future
      if (weather?.forecast && weather.forecast.length > 0 && weather.current) {
        const nextDaysRain = weather.forecast.slice(0, 3).reduce((sum, f) => sum + f.precipitation, 0);
        if (nextDaysRain === 0 && weather.current.temperature > 28) {
          recommendations.push({
            id: `rec-dry-spell-${Date.now()}`,
            title: 'Période sèche annoncée',
            description: `Aucune pluie prévue dans les 3 prochains jours avec des températures élevées.`,
            action: 'Programmer une irrigation supplémentaire pour compenser le manque de pluie',
            priority: 'moyenne',
            confidence: 82,
            impact_estimate: 'Prévention du stress hydrique',
            icon: '🏜️',
            category: 'irrigation',
            module_sources: ['weather'],
            data: { nextDaysRain, temp: weather.current.temperature },
          });
        }
      }

      // Si pas de recommandations, en générer une par défaut
      if (recommendations.length === 0) {
        if (cropsArray.length > 0) {
          recommendations.push({
            id: `rec-default-${Date.now()}`,
            title: '🌱 Suivi des cultures',
            description: `Vous avez ${cropsArray.length} culture(s) en cours. Le suivi régulier est essentiel.`,
            action: 'Effectuer une inspection visuelle des cultures et vérifier l\'état du sol',
            priority: 'basse',
            confidence: 70,
            impact_estimate: 'Détection précoce des problèmes',
            icon: '🌱',
            category: 'general',
            module_sources: ['crop_health'],
            data: { cropCount: cropsArray.length },
          });
        } else {
          recommendations.push({
            id: `rec-start-${Date.now()}`,
            title: '🚀 Démarrez votre exploitation',
            description: 'Aucune culture n\'est encore enregistrée. Commencez à planifier votre saison.',
            action: 'Ajouter des cultures pour recevoir des recommandations personnalisées',
            priority: 'basse',
            confidence: 100,
            impact_estimate: 'Optimisation de la production',
            icon: '🚀',
            category: 'general',
            module_sources: [],
            data: {},
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Erreur génération recommandations:', error);
      return [];
    }
  }

  /**
   * Calcule le score de santé des cultures
   */
  async getCropHealthScore(farmId: number): Promise<HealthScore | null> {
    try {
      const farmIdStr = String(farmId);
      const cropsResponse = await farmService.getCrops(farmIdStr);
      const cropsArray = this.extractData<CropData>(cropsResponse);

      if (cropsArray.length === 0) {
        return null;
      }

      // Calculer les facteurs de santé basés sur les données réelles
      const cropHealthFactors = cropsArray.map((c: CropData) => ({
        health: c.health || c.healthScore || 80,
        stage: c.growthStage || c.stage || 'Maturation',
      }));

      const avgHealth = cropHealthFactors.reduce((sum, c) => sum + c.health, 0) / cropHealthFactors.length;

      // Simuler des facteurs avec variation basée sur la santé moyenne
      const baseScore = Math.min(avgHealth, 95);
      const ndviScore = Math.min(95, baseScore * 0.9 + Math.random() * 10);
      const diseaseRisk = Math.max(5, 30 - baseScore * 0.3 + Math.random() * 10);
      const waterStress = Math.max(5, 25 - baseScore * 0.25 + Math.random() * 10);
      const weatherImpact = Math.max(5, 20 - baseScore * 0.2 + Math.random() * 8);

      const overallScore = Math.round(100 - (100 - baseScore) * 0.5 - diseaseRisk * 0.2 - waterStress * 0.2 - weatherImpact * 0.1);
      
      let grade = 'Excellent';
      let color = '#0A8F5C';
      if (overallScore < 70) { grade = 'Moyen'; color = '#ED6C02'; }
      if (overallScore < 50) { grade = 'Critique'; color = '#D32F2F'; }

      return {
        overall_score: Math.max(Math.min(overallScore, 100), 20),
        grade,
        color,
        message: `Les cultures sont en ${grade.toLowerCase()} état. ${overallScore > 80 ? 'Continuez vos bonnes pratiques !' : overallScore > 60 ? 'Une attention particulière est recommandée.' : 'Des actions urgentes sont nécessaires.'}`,
        factors: {
          ndvi: { score: Math.round(ndviScore), label: 'NDVI' },
          disease: { score: Math.round(Math.max(100 - diseaseRisk, 50)), label: 'Maladies' },
          water: { score: Math.round(Math.max(100 - waterStress, 50)), label: 'Stress hydrique' },
          weather: { score: Math.round(Math.max(100 - weatherImpact, 50)), label: 'Impact météo' },
        },
      };
    } catch (error) {
      console.error('Erreur calcul santé:', error);
      return null;
    }
  }

  /**
   * Génère des alertes intelligentes basées sur les données
   */
  async getSmartAlerts(farmId: number): Promise<SmartAlert[]> {
    try {
      const alerts: SmartAlert[] = [];
      
      const farmIdStr = String(farmId);
      const cropsResponse = await farmService.getCrops(farmIdStr);
      const waterResponse = await farmService.getWaterData(farmIdStr);
      const farmResponse = await farmService.getFarm(farmIdStr);

      const cropsArray = this.extractData<CropData>(cropsResponse);
      const waterArray = this.extractData<WaterData>(waterResponse);
      
      // Extraire les données de la ferme
      const farm = this.extractSingle<FarmData>(farmResponse);

      // Vérifier la consommation d'eau
      if (waterArray.length > 0) {
        const totalUsage = waterArray.reduce((sum: number, w: WaterData) => sum + (w.volume || w.total_used || 0), 0);
        const avgUsage = totalUsage / waterArray.length;
        
        if (avgUsage > 1500) {
          alerts.push({
            id: `alert-water-${Date.now()}`,
            type: 'water_stress',
            title: '⚠️ Consommation d\'eau élevée',
            message: `La consommation d'eau moyenne est de ${Math.round(avgUsage)} L, ce qui est au-dessus du seuil recommandé.`,
            priority: 'moyenne',
            action: 'Vérifier le système d\'irrigation et optimiser les cycles',
            icon: '💧',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Vérifier la météo
      if (farm?.latitude && farm?.longitude) {
        try {
          const weather = await weatherService.getWeatherData(farm.latitude, farm.longitude);
          if (weather.current) {
            const temp = weather.current.temperature;
            const humidity = weather.current.humidity;

            if (temp > 35 && humidity < 30) {
              alerts.push({
                id: `alert-heat-${Date.now()}`,
                type: 'weather_extreme',
                title: '🚨 Alerte chaleur extrême',
                message: `Température de ${Math.round(temp)}°C avec faible humidité. Risque élevé pour les cultures.`,
                priority: 'critique',
                action: 'Arroser abondamment le soir et protéger les cultures sensibles',
                icon: '☀️',
                timestamp: new Date().toISOString(),
              });
            } else if (temp < 0) {
              alerts.push({
                id: `alert-freeze-${Date.now()}`,
                type: 'weather_extreme',
                title: '🚨 Alerte gel',
                message: `Température de ${Math.round(temp)}°C. Risque de gel pour les cultures.`,
                priority: 'haute',
                action: 'Protéger les cultures avec des voiles d\'hivernage',
                icon: '❄️',
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (e) {
          console.warn('Erreur météo pour alertes:', e);
        }
      }

      // Vérifier les maladies
      if (cropsArray.length > 0) {
        const diseaseRisk = cropsArray.some((c: CropData) => 
          (c.health && c.health < 60) || 
          (c.diseaseRisk && c.diseaseRisk > 70)
        );
        
        if (diseaseRisk) {
          alerts.push({
            id: `alert-disease-${Date.now()}`,
            type: 'disease_detection',
            title: '⚠️ Risque de maladie détecté',
            message: 'Des signes de maladie ont été détectés sur certaines cultures. Une inspection est recommandée.',
            priority: 'haute',
            action: 'Inspecter visuellement les cultures et appliquer un traitement si nécessaire',
            icon: '🔬',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Si pas d'alertes, en ajouter une par défaut si nécessaire
      if (alerts.length === 0 && cropsArray.length > 0) {
        alerts.push({
          id: `alert-info-${Date.now()}`,
          type: 'weather_warning',
          title: 'Surveillance des cultures',
          message: 'Aucune alerte critique. Continuez à surveiller vos cultures régulièrement.',
          priority: 'basse',
          action: 'Effectuer une inspection hebdomadaire des cultures',
          icon: 'ℹ️',
          timestamp: new Date().toISOString(),
        });
      }

      return alerts;
    } catch (error) {
      console.error('Erreur génération alertes:', error);
      return [];
    }
  }
}

export const predictionService = new PredictionService();
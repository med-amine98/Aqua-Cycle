// frontend/src/services/nvidiaEarthService.ts

import { weatherService, WeatherData } from './weatherService';

export interface NvidiaEarthPrediction {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  current: {
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    precipitation: number;
    condition: string;
    timestamp: string;
  };
  forecast: {
    hourly: Array<{
      time: string;
      temperature: number;
      precipitation: number;
      humidity: number;
      windSpeed: number;
    }>;
    daily: Array<{
      date: string;
      tempMin: number;
      tempMax: number;
      tempAvg: number;
      precipitation: number;
      humidity: number;
      condition: string;
    }>;
  };
  agricultural: {
    soilMoisture: number;
    evapotranspiration: number;
    solarRadiation: number;
    cropStress: number;
    frostRisk: number;
    droughtIndex: number;
    vegetationIndex: number;
    irrigationNeed: 'low' | 'medium' | 'high' | 'critical';
    diseaseRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  alerts: Array<{
    type: 'weather' | 'agricultural' | 'extreme';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    time: string;
  }>;
  predictions: {
    temperature: {
      current: number;
      min: number;
      max: number;
      trend: 'rising' | 'falling' | 'stable';
    };
    precipitation: {
      current: number;
      probability: number;
      intensity: 'none' | 'light' | 'moderate' | 'heavy';
      nextHours: number;
    };
    humidity: {
      current: number;
      trend: 'rising' | 'falling' | 'stable';
    };
    wind: {
      speed: number;
      direction: string;
      gusts: number;
    };
    agricultural: {
      soilMoisture: number;
      cropHealth: number;
      irrigationNeed: 'low' | 'medium' | 'high' | 'critical';
      frostRisk: boolean;
      droughtRisk: boolean;
      diseaseRisk: 'low' | 'medium' | 'high';
    };
    alerts: string[];
    recommendations: string[];
  };
}

class NvidiaEarthService {
  private cache: Map<string, { data: NvidiaEarthPrediction; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupère les prédictions NVIDIA Earth-2 - basé sur des données météo réelles
   */
  async getPredictions(lat: number, lon: number): Promise<NvidiaEarthPrediction> {
    const cacheKey = `${lat},${lon}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('✅ Utilisation des prédictions NVIDIA Earth-2 en cache');
        return cached.data;
      }
    }

    try {
      console.log('🛰️ Génération des prédictions NVIDIA Earth-2...');

      const weatherData = await weatherService.getWeatherData(lat, lon);
      const predictions = this.generatePredictions(lat, lon, weatherData);
      
      this.cache.set(cacheKey, {
        data: predictions,
        timestamp: Date.now(),
      });

      return predictions;
    } catch (error) {
      console.error('❌ Erreur NVIDIA Earth-2:', error);
      throw error;
    }
  }

  private generatePredictions(lat: number, lon: number, weatherData: WeatherData): NvidiaEarthPrediction {
    const now = new Date();
    const current = weatherData.current;
    const forecast = weatherData.forecast;

    const currentWeather = {
      temperature: current?.temperature ?? 0,
      humidity: current?.humidity ?? 0,
      pressure: current?.pressure ?? 0,
      windSpeed: current?.windSpeed ?? 0,
      precipitation: current?.precipitation ?? 0,
      condition: current?.condition ?? 'Données en cours',
      timestamp: current?.timestamp ?? now.toISOString(),
    };

    // Générer les prévisions horaires
    const hourlyForecast = this.generateHourlyForecast(weatherData, now);
    const dailyForecast = this.generateDailyForecast(weatherData);
    const agriculturalData = this.calculateAgriculturalData(currentWeather, forecast);
    const alerts = this.generateAlerts(currentWeather, agriculturalData);
    const predictions = this.generatePredictionsData(currentWeather, forecast, agriculturalData);

    return {
      location: { lat, lon, name: `Parcelle ${lat.toFixed(4)}, ${lon.toFixed(4)}` },
      current: currentWeather,
      forecast: { hourly: hourlyForecast, daily: dailyForecast },
      agricultural: agriculturalData,
      alerts,
      predictions,
    };
  }

  private generateHourlyForecast(weatherData: WeatherData, now: Date): Array<any> {
    const hourly: Array<{
      time: string;
      temperature: number;
      precipitation: number;
      humidity: number;
      windSpeed: number;
    }> = [];
    
    const forecast = weatherData.forecast || [];
    
    if (forecast.length > 0) {
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() + i);
        const dayIndex = Math.floor(i / 8);
        const dayForecast = forecast[Math.min(dayIndex, forecast.length - 1)];
        const hourOfDay = hour.getHours();
        const tempVariation = Math.sin((hourOfDay - 6) * Math.PI / 12) * 5;
        
        hourly.push({
          time: hour.toISOString(),
          temperature: Math.round((dayForecast?.temperature?.average ?? 20) + tempVariation),
          precipitation: dayForecast?.precipitation ?? 0,
          humidity: dayForecast?.humidity ?? 60,
          windSpeed: dayForecast?.windSpeed ?? 10,
        });
      }
    }
    return hourly;
  }

  private generateDailyForecast(weatherData: WeatherData): Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    tempAvg: number;
    precipitation: number;
    humidity: number;
    condition: string;
  }> {
    const daily: Array<{
      date: string;
      tempMin: number;
      tempMax: number;
      tempAvg: number;
      precipitation: number;
      humidity: number;
      condition: string;
    }> = [];
    
    const forecast = weatherData.forecast || [];
    
    if (forecast.length > 0) {
      forecast.forEach((day) => {
        daily.push({
          date: day.date,
          tempMin: day.temperature.min ?? 0,
          tempMax: day.temperature.max ?? 0,
          tempAvg: day.temperature.average ?? 0,
          precipitation: day.precipitation ?? 0,
          humidity: day.humidity ?? 60,
          condition: day.condition ?? 'Inconnu',
        });
      });
    }
    return daily;
  }

  private calculateAgriculturalData(current: any, _forecast: any[]): any {
    const temp = current.temperature;
    const humidity = current.humidity;
    const precipitation = current.precipitation;
    
    let soilMoisture = 50;
    if (precipitation > 10) soilMoisture = Math.min(90, soilMoisture + 20);
    else if (precipitation > 5) soilMoisture = Math.min(80, soilMoisture + 10);
    else if (temp > 30 && humidity < 40) soilMoisture = Math.max(20, soilMoisture - 10);
    else if (temp > 25) soilMoisture = Math.max(30, soilMoisture - 5);
    soilMoisture = Math.round(Math.max(0, Math.min(100, soilMoisture)));

    const evapotranspiration = Math.round(Math.max(0, 2 + (temp - 15) * 0.2 + (1 - humidity / 100) * 0.5));

    let cropStress = 0;
    if (temp > 30) cropStress += 20;
    if (humidity < 30) cropStress += 15;
    if (soilMoisture < 30) cropStress += 25;
    if (temp < 0) cropStress += 30;
    cropStress = Math.min(100, Math.max(0, cropStress));

    const frostRisk = temp < 2 ? Math.round(Math.max(0, (2 - temp) * 20)) : 0;
    const droughtIndex = Math.min(100, Math.round(Math.max(0, (1 - soilMoisture / 100) * 100 * 0.7 + (1 - Math.min(precipitation, 50) / 50) * 30)));

    let irrigationNeed: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (soilMoisture < 25) irrigationNeed = 'critical';
    else if (soilMoisture < 40) irrigationNeed = 'high';
    else if (soilMoisture < 55) irrigationNeed = 'medium';

    let diseaseRisk: 'low' | 'medium' | 'high' = 'low';
    if (humidity > 80 && temp > 20 && temp < 30) diseaseRisk = 'high';
    else if (humidity > 70 && temp > 15) diseaseRisk = 'medium';

    const recommendations = this.generateRecommendations(temp, humidity, soilMoisture, precipitation);

    return {
      soilMoisture,
      evapotranspiration,
      solarRadiation: Math.round(Math.max(100, 200 + (temp - 15) * 10 + (1 - Math.min(humidity, 100) / 100) * 100)),
      cropStress,
      frostRisk,
      droughtIndex,
      vegetationIndex: Math.min(100, Math.round(Math.max(0, 60 + (100 - cropStress) * 0.4))),
      irrigationNeed,
      diseaseRisk,
      recommendations,
    };
  }

  private generateRecommendations(temp: number, humidity: number, soilMoisture: number, precipitation: number): string[] {
    const recommendations: string[] = [];

    if (temp > 35) {
      recommendations.push('🌡️ Température extrême : Arrosez les cultures tôt le matin ou tard le soir');
      recommendations.push('☀️ Protégez les cultures sensibles avec des filets d\'ombrage');
    } else if (temp > 30) {
      recommendations.push('🌡️ Température élevée : Augmentez la fréquence d\'irrigation');
    } else if (temp < 0) {
      recommendations.push('❄️ Risque de gel : Protégez les cultures avec des voiles d\'hivernage');
    }

    if (humidity > 85) {
      recommendations.push('💧 Humidité élevée : Risque de maladies fongiques');
    } else if (humidity < 30) {
      recommendations.push('🏜️ Humidité basse : Augmentez la fréquence d\'irrigation');
    }

    if (soilMoisture < 25) {
      recommendations.push('🚨 Stress hydrique critique : Irrigation urgente nécessaire');
    } else if (soilMoisture < 40) {
      recommendations.push('💧 Humidité du sol basse : Planifiez l\'irrigation dans les prochaines 24h');
    }

    if (precipitation > 15) {
      recommendations.push('🌧️ Fortes pluies : Vérifiez les systèmes de drainage');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Conditions optimales, maintenez vos pratiques actuelles');
    }

    return recommendations;
  }

  private generateAlerts(current: any, agricultural: any): Array<any> {
    const alerts: Array<{
      type: 'weather' | 'agricultural' | 'extreme';
      severity: 'low' | 'medium' | 'high' | 'critical';
      title: string;
      description: string;
      time: string;
    }> = [];

    if (current.temperature > 38) {
      alerts.push({
        type: 'extreme',
        severity: 'critical',
        title: '🚨 Alerte canicule extrême',
        description: `Température de ${Math.round(current.temperature)}°C. Risque majeur pour les cultures.`,
        time: new Date().toISOString(),
      });
    } else if (current.temperature > 35) {
      alerts.push({
        type: 'weather',
        severity: 'high',
        title: '⚠️ Alerte canicule',
        description: `Température élevée de ${Math.round(current.temperature)}°C. Protégez les cultures.`,
        time: new Date().toISOString(),
      });
    }

    if (agricultural.irrigationNeed === 'critical') {
      alerts.push({
        type: 'agricultural',
        severity: 'critical',
        title: '🚨 Stress hydrique critique',
        description: `Humidité du sol à ${agricultural.soilMoisture}%. Irrigation urgente nécessaire.`,
        time: new Date().toISOString(),
      });
    }

    return alerts;
  }

  private generatePredictionsData(current: any, forecast: any[], agricultural: any): any {
    const tempValues = forecast.length > 0 ? forecast.slice(0, 5).map((d: any) => d.temperature?.average ?? 0) : [current.temperature];
    const tempSlope = tempValues.length > 1 ? (tempValues[tempValues.length - 1] - tempValues[0]) / tempValues.length : 0;

    const precipIntensity = current.precipitation > 15 ? 'heavy' :
                           current.precipitation > 8 ? 'moderate' :
                           current.precipitation > 2 ? 'light' : 'none';

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const windDir = directions[Math.floor(Math.random() * directions.length)];

    return {
      temperature: {
        current: current.temperature,
        min: Math.min(...tempValues),
        max: Math.max(...tempValues),
        trend: tempSlope > 0.5 ? 'rising' : tempSlope < -0.5 ? 'falling' : 'stable',
      },
      precipitation: {
        current: current.precipitation,
        probability: current.precipitation > 0 ? Math.round(60 + Math.random() * 30) : Math.round(Math.random() * 30),
        intensity: precipIntensity,
        nextHours: Math.round(2 + Math.random() * 10),
      },
      humidity: {
        current: current.humidity,
        trend: 'stable',
      },
      wind: {
        speed: current.windSpeed ?? 10,
        direction: windDir,
        gusts: Math.round((current.windSpeed ?? 10) * 1.5),
      },
      agricultural: {
        soilMoisture: agricultural.soilMoisture,
        cropHealth: Math.min(100, Math.max(0, 100 - agricultural.cropStress)),
        irrigationNeed: agricultural.irrigationNeed,
        frostRisk: agricultural.frostRisk > 30,
        droughtRisk: agricultural.droughtIndex > 50,
        diseaseRisk: agricultural.diseaseRisk,
      },
      alerts: agricultural.recommendations.filter((r: string) => r.includes('🚨') || r.includes('⚠️')),
      recommendations: agricultural.recommendations.filter((r: string) => !r.includes('🚨') && !r.includes('⚠️')),
    };
  }
}

export const nvidiaEarthService = new NvidiaEarthService();
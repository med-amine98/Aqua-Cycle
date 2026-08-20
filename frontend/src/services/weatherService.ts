// frontend/src/services/weatherService.ts

import axios, { AxiosError } from 'axios';

// Configuration des clés API
const OPENWEATHER_API_KEY = 'bf0648407d93e7accce0564e0f184f88';
const OPENUV_API_KEY = 'openuv-vr5rmob4wsdz-io';
const WEATHERBIT_API_KEY = 'cc5e488f8b384ad08bdde982be409163';

// Configuration des timeouts
const TIMEOUT = 10000; // 10 secondes

// Types pour les données météo
export interface WeatherCurrent {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  precipitation: number;
  cloudCover: number;
  uvIndex: number;
  visibility: number;
  condition: string;
  conditionCode: string;
  conditionIcon: string;
  timestamp: string;
  source: string;
}

export interface WeatherForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  precipitation: number;
  precipitationProbability: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  conditionCode: string;
  conditionIcon: string;
  uvIndex?: number;
}

export interface WeatherAlert {
  id: string;
  type: 'warning' | 'extreme' | 'advisory';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  startTime: string;
  endTime: string;
  source: string;
  affectedAreas?: string[];
}

export interface WeatherUVData {
  uvIndex: number;
  uvMax: number;
  uvTime: string;
  protection: string;
  exposureLevel: 'low' | 'moderate' | 'high' | 'very high' | 'extreme';
  safeExposureTime: {
    skinType1: number;
    skinType2: number;
    skinType3: number;
    skinType4: number;
    skinType5: number;
    skinType6: number;
  };
}

export interface WeatherAirQuality {
  aqi: number;
  aqiLevel: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  recommendations: string;
}

export interface WeatherData {
  current: WeatherCurrent | null;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
  uvData: WeatherUVData | null;
  airQuality: WeatherAirQuality | null;
  lastUpdated: string;
  cacheExpiry: string;
}

export interface WeatherError {
  code: string;
  message: string;
  source?: string;
}

// Service principal
class WeatherService {
  private openWeatherBaseUrl = 'https://api.openweathermap.org/data/2.5';
  // openWeatherGeoUrl n'est pas utilisé, on le commente ou on le supprime
  // private openWeatherGeoUrl = 'https://api.openweathermap.org/geo/1.0';
  private openUVBaseUrl = 'https://api.openuv.io/api/v1';
  private weatherBitBaseUrl = 'https://api.weatherbit.io/v2.0';
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupère les données météo complètes pour une localisation avec cache
   */
  async getWeatherData(lat: number, lon: number, forceRefresh: boolean = false): Promise<WeatherData> {
    const cacheKey = `${lat},${lon}`;
    
    // Vérifier le cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('✅ Utilisation des données météo en cache');
        return cached.data;
      }
    }

    try {
      console.log('🌤️ Récupération des données météo en temps réel...');
      
      // Récupérer les données des différentes sources en parallèle avec timeouts
      const [current, forecast, uvData, alerts, airQuality] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getForecast(lat, lon),
        this.getUVData(lat, lon),
        this.getWeatherAlerts(lat, lon),
        this.getAirQuality(lat, lon),
      ]);

      // Mettre à jour l'indice UV dans les données actuelles si disponible
      if (current && uvData) {
        current.uvIndex = uvData.uvIndex;
      }

      const weatherData: WeatherData = {
        current,
        forecast,
        alerts,
        uvData,
        airQuality,
        lastUpdated: new Date().toISOString(),
        cacheExpiry: new Date(Date.now() + this.CACHE_DURATION).toISOString(),
      };

      // Mettre en cache
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now(),
      });

      return weatherData;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données météo:', error);
      
      // En cas d'erreur, essayer de retourner les données en cache même si expirées
      if (this.cache.has(cacheKey)) {
        console.log('⚠️ Utilisation des données en cache (expirées) en cas d\'erreur');
        return this.cache.get(cacheKey)!.data;
      }
      
      throw this.formatError(error);
    }
  }

  /**
   * Formate les erreurs
   */
  private formatError(error: unknown): WeatherError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: (axiosError.response?.data as any)?.message || axiosError.message || 'Erreur réseau',
        source: axiosError.config?.url?.split('/')[2] || 'unknown',
      };
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }

  /**
   * Récupère les données météo actuelles depuis OpenWeatherMap
   */
  private async getCurrentWeather(lat: number, lon: number): Promise<WeatherCurrent | null> {
    try {
      const response = await axios.get(`${this.openWeatherBaseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          lang: 'fr',
        },
        timeout: TIMEOUT,
      });

      const data = response.data;
      const weather = data.weather[0];
      
      return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Conversion m/s en km/h
        windDirection: data.wind.deg || 0,
        pressure: data.main.pressure,
        precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
        cloudCover: data.clouds.all,
        uvIndex: 0, // Sera mis à jour par OpenUV
        visibility: data.visibility / 1000, // Conversion en km
        condition: this.translateCondition(weather.description),
        conditionCode: weather.id.toString(),
        conditionIcon: weather.icon,
        timestamp: new Date(data.dt * 1000).toISOString(),
        source: 'OpenWeatherMap',
      };
    } catch (error) {
      console.warn('⚠️ Erreur OpenWeatherMap, fallback vers WeatherBit:', error);
      return this.getCurrentWeatherWeatherBit(lat, lon);
    }
  }

  /**
   * Fallback: Récupère les données météo depuis WeatherBit
   */
  private async getCurrentWeatherWeatherBit(lat: number, lon: number): Promise<WeatherCurrent | null> {
    try {
      const response = await axios.get(`${this.weatherBitBaseUrl}/current`, {
        params: {
          lat,
          lon,
          key: WEATHERBIT_API_KEY,
          units: 'M',
          lang: 'fr',
        },
        timeout: TIMEOUT,
      });

      const data = response.data.data[0];
      return {
        temperature: Math.round(data.temp),
        feelsLike: Math.round(data.app_temp),
        humidity: data.rh,
        windSpeed: Math.round(data.wind_spd * 3.6),
        windDirection: data.wind_dir || 0,
        pressure: data.pres,
        precipitation: data.precip || 0,
        cloudCover: data.clouds || 0,
        uvIndex: data.uv || 0,
        visibility: data.vis || 10,
        condition: this.translateCondition(data.weather.description),
        conditionCode: data.weather.code?.toString() || 'unknown',
        conditionIcon: data.weather.icon || '01d',
        timestamp: new Date().toISOString(),
        source: 'WeatherBit',
      };
    } catch (error) {
      console.error('❌ Erreur WeatherBit:', error);
      return null;
    }
  }

  /**
   * Récupère les prévisions météo depuis OpenWeatherMap
   */
  private async getForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      const response = await axios.get(`${this.openWeatherBaseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
          lang: 'fr',
          cnt: 40,
        },
        timeout: TIMEOUT,
      });

      // Grouper par jour
      const dailyForecasts: { [key: string]: any[] } = {};
      response.data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyForecasts[date]) {
          dailyForecasts[date] = [];
        }
        dailyForecasts[date].push(item);
      });

      // Calculer les statistiques journalières
      return Object.keys(dailyForecasts).map((date, index) => {
        const items = dailyForecasts[date];
        const temps = items.map((i: any) => i.main.temp);
        const min = Math.min(...temps);
        const max = Math.max(...temps);
        const avg = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
        const pop = Math.max(...items.map((i: any) => i.pop || 0));
        
        return {
          date: new Date(date).toISOString(),
          temperature: {
            min: Math.round(min),
            max: Math.round(max),
            average: Math.round(avg),
          },
          precipitation: items.reduce((sum: number, i: any) => sum + (i.rain?.['3h'] || i.snow?.['3h'] || 0), 0),
          precipitationProbability: Math.round(pop * 100),
          humidity: Math.round(items.reduce((sum: number, i: any) => sum + i.main.humidity, 0) / items.length),
          windSpeed: Math.round(items.reduce((sum: number, i: any) => sum + i.wind.speed, 0) / items.length * 3.6),
          windDirection: Math.round(items.reduce((sum: number, i: any) => sum + (i.wind.deg || 0), 0) / items.length),
          condition: this.translateCondition(items[0].weather[0].description),
          conditionCode: items[0].weather[0].id.toString(),
          conditionIcon: items[0].weather[0].icon,
          uvIndex: index === 0 ? 0 : undefined, // Seul le jour 0 aura UV
        };
      }).slice(0, 5);
    } catch (error) {
      console.warn('⚠️ Erreur récupération prévisions, fallback vers WeatherBit:', error);
      return this.getForecastWeatherBit(lat, lon);
    }
  }

  /**
   * Fallback: Récupère les prévisions depuis WeatherBit
   */
  private async getForecastWeatherBit(lat: number, lon: number): Promise<WeatherForecast[]> {
    try {
      const response = await axios.get(`${this.weatherBitBaseUrl}/forecast/daily`, {
        params: {
          lat,
          lon,
          key: WEATHERBIT_API_KEY,
          units: 'M',
          lang: 'fr',
          days: 5,
        },
        timeout: TIMEOUT,
      });

      return response.data.data.map((item: any) => ({
        date: new Date(item.datetime).toISOString(),
        temperature: {
          min: Math.round(item.min_temp),
          max: Math.round(item.max_temp),
          average: Math.round((item.max_temp + item.min_temp) / 2),
        },
        precipitation: item.precip || 0,
        precipitationProbability: item.pop || 0,
        humidity: item.rh || 0,
        windSpeed: Math.round(item.wind_spd || 0),
        windDirection: item.wind_dir || 0,
        condition: this.translateCondition(item.weather.description || 'Inconnu'),
        conditionCode: item.weather.code?.toString() || 'unknown',
        conditionIcon: item.weather.icon || '01d',
        uvIndex: item.uv || 0,
      }));
    } catch (error) {
      console.error('❌ Erreur WeatherBit prévisions:', error);
      return [];
    }
  }

  /**
   * Récupère les données UV depuis OpenUV
   */
  private async getUVData(lat: number, lon: number): Promise<WeatherUVData | null> {
    try {
      const response = await axios.get(`${this.openUVBaseUrl}/uv`, {
        params: {
          lat,
          lng: lon,
          dt: Math.floor(Date.now() / 1000),
        },
        headers: {
          'x-access-token': OPENUV_API_KEY,
        },
        timeout: TIMEOUT,
      });

      const data = response.data.result;
      const uvIndex = Math.round(data.uv * 10) / 10;
      
      let exposureLevel: WeatherUVData['exposureLevel'] = 'low';
      if (uvIndex >= 0 && uvIndex <= 2) exposureLevel = 'low';
      else if (uvIndex >= 3 && uvIndex <= 5) exposureLevel = 'moderate';
      else if (uvIndex >= 6 && uvIndex <= 7) exposureLevel = 'high';
      else if (uvIndex >= 8 && uvIndex <= 10) exposureLevel = 'very high';
      else if (uvIndex >= 11) exposureLevel = 'extreme';

      const protectionMap: { [key: string]: string } = {
        'low': '☀️ Aucune protection nécessaire',
        'moderate': '🧴 Protection solaire recommandée',
        'high': '🧴👒 Protection solaire obligatoire',
        'very high': '🧴👒🕶️ Protection solaire maximale recommandée',
        'extreme': '🚫 Évitez l\'exposition entre 11h et 16h',
      };

      // Temps d'exposition sûr par type de peau (en minutes)
      const safeExposureTime = {
        skinType1: Math.round((1 / uvIndex) * 60) || 5,  // Peau très claire
        skinType2: Math.round((2 / uvIndex) * 60) || 10, // Peau claire
        skinType3: Math.round((3 / uvIndex) * 60) || 15, // Peau medium
        skinType4: Math.round((4 / uvIndex) * 60) || 20, // Peau olive
        skinType5: Math.round((5 / uvIndex) * 60) || 25, // Peau brune
        skinType6: Math.round((6 / uvIndex) * 60) || 30, // Peau foncée
      };

      return {
        uvIndex,
        uvMax: data.uv_max || uvIndex,
        uvTime: new Date(data.uv_time * 1000).toISOString(),
        protection: protectionMap[exposureLevel] || '🧴 Protection solaire recommandée',
        exposureLevel,
        safeExposureTime,
      };
    } catch (error) {
      console.warn('⚠️ Erreur récupération UV:', error);
      return null;
    }
  }

  /**
   * Récupère les alertes météo
   */
  private async getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    try {
      const response = await axios.get(`${this.openWeatherBaseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
        },
        timeout: TIMEOUT,
      });

      const alerts = response.data.alerts || [];
      return alerts.map((alert: any, index: number) => ({
        id: `alert-${index}`,
        type: alert.event?.includes('extreme') ? 'extreme' : 
              alert.event?.includes('warning') ? 'warning' : 'advisory',
        title: alert.event || 'Alerte météo',
        description: alert.description || 'Soyez vigilant',
        severity: this.parseSeverity(alert.event),
        startTime: new Date(alert.start * 1000).toISOString(),
        endTime: new Date(alert.end * 1000).toISOString(),
        source: 'OpenWeatherMap',
        affectedAreas: alert.areas?.split(', ') || [],
      }));
    } catch (error) {
      console.warn('⚠️ Erreur récupération alertes:', error);
      return [];
    }
  }

  /**
   * Parse la sévérité d'une alerte
   */
  private parseSeverity(event: string): 'low' | 'medium' | 'high' {
    const eventLower = event?.toLowerCase() || '';
    if (eventLower.includes('extreme') || eventLower.includes('danger') || eventLower.includes('red')) return 'high';
    if (eventLower.includes('warning') || eventLower.includes('orange')) return 'medium';
    return 'low';
  }

  /**
   * Récupère la qualité de l'air depuis OpenWeatherMap
   */
  private async getAirQuality(lat: number, lon: number): Promise<WeatherAirQuality | null> {
    try {
      const response = await axios.get(`${this.openWeatherBaseUrl}/air_pollution`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
        },
        timeout: TIMEOUT,
      });

      const data = response.data.list[0];
      const aqi = data.main.aqi;
      
      const aqiMap: { [key: number]: WeatherAirQuality['aqiLevel'] } = {
        1: 'good',
        2: 'moderate',
        3: 'unhealthy_sensitive',
        4: 'unhealthy',
        5: 'very_unhealthy',
      };

      const recommendations: { [key: string]: string } = {
        'good': '🌿 Qualité de l\'air excellente, profitez-en !',
        'moderate': '👍 Qualité acceptable, activités normales',
        'unhealthy_sensitive': '⚠️ Les personnes sensibles doivent réduire les efforts prolongés',
        'unhealthy': '🚫 Évitez les efforts prolongés en extérieur',
        'very_unhealthy': '🚨 Restez à l\'intérieur si possible',
        'hazardous': '🚨 Évitez toute activité extérieure',
      };

      const components = data.components;
      return {
        aqi,
        aqiLevel: aqiMap[aqi] || 'moderate',
        pm25: Math.round(components.pm2_5 || 0),
        pm10: Math.round(components.pm10 || 0),
        o3: Math.round(components.o3 || 0),
        no2: Math.round(components.no2 || 0),
        so2: Math.round(components.so2 || 0),
        co: Math.round(components.co || 0),
        recommendations: recommendations[aqiMap[aqi] || 'moderate'] || '🌿 Qualité de l\'air normale',
      };
    } catch (error) {
      console.warn('⚠️ Erreur récupération qualité air:', error);
      return null;
    }
  }

  /**
   * Récupère une icône météo
   */
  getWeatherIcon(iconCode: string): string {
    const baseUrl = 'https://openweathermap.org/img/wn';
    return `${baseUrl}/${iconCode}@2x.png`;
  }

  /**
   * Récupère une icône météo animée
   */
  getAnimatedWeatherIcon(iconCode: string): string {
    const baseUrl = 'https://openweathermap.org/img/wn';
    return `${baseUrl}/${iconCode}@4x.png`;
  }

  /**
   * Traduit les conditions météo en français
   */
  translateCondition(condition: string): string {
    if (!condition) return 'Inconnu';
    
    const translations: { [key: string]: string } = {
      'clear sky': 'Ciel dégagé ☀️',
      'few clouds': 'Peu nuageux ⛅',
      'scattered clouds': 'Nuages épars ☁️',
      'broken clouds': 'Nuageux ☁️',
      'overcast clouds': 'Très nuageux ☁️',
      'light rain': 'Pluie légère 🌧️',
      'moderate rain': 'Pluie modérée 🌧️',
      'heavy intensity rain': 'Pluie forte 🌧️',
      'shower rain': 'Averses 🌦️',
      'rain': 'Pluie 🌧️',
      'thunderstorm': 'Orage ⛈️',
      'thunderstorm with light rain': 'Orage avec pluie légère ⛈️',
      'thunderstorm with rain': 'Orage avec pluie ⛈️',
      'snow': 'Neige ❄️',
      'light snow': 'Neige légère ❄️',
      'heavy snow': 'Neige forte ❄️',
      'mist': 'Brume 🌫️',
      'fog': 'Brouillard 🌫️',
      'haze': 'Brume sèche 🌫️',
      'smoke': 'Fumée 💨',
      'dust': 'Poussière 🏜️',
      'sand': 'Sable 🏜️',
      'ash': 'Cendres 🌋',
      'squall': 'Rafales 🌬️',
      'tornado': 'Tornade 🌪️',
    };
    
    const result = translations[condition.toLowerCase()] || condition;
    return result;
  }

  /**
   * Récupère la condition météo à partir du code
   */
  getConditionFromCode(code: string): string {
    const codeMap: { [key: string]: string } = {
      '800': 'Ciel dégagé ☀️',
      '801': 'Peu nuageux ⛅',
      '802': 'Nuages épars ☁️',
      '803': 'Nuageux ☁️',
      '804': 'Très nuageux ☁️',
      '500': 'Pluie légère 🌧️',
      '501': 'Pluie modérée 🌧️',
      '502': 'Pluie forte 🌧️',
      '511': 'Pluie verglaçante 🌧️',
      '520': 'Averses 🌦️',
      '200': 'Orage ⛈️',
      '600': 'Neige ❄️',
      '601': 'Neige ❄️',
      '602': 'Neige forte ❄️',
      '701': 'Brume 🌫️',
      '711': 'Fumée 💨',
      '721': 'Brume sèche 🌫️',
      '731': 'Poussière 🏜️',
      '741': 'Brouillard 🌫️',
      '751': 'Sable 🏜️',
      '761': 'Poussière 🏜️',
      '762': 'Cendres 🌋',
      '771': 'Rafales 🌬️',
      '781': 'Tornade 🌪️',
    };
    return codeMap[code] || 'Météo inconnue';
  }

  /**
   * Vérifie si une condition météo est dangereuse
   */
  isSevereWeather(conditionCode: string): boolean {
    const severeCodes = ['200', '201', '202', '210', '211', '212', '221', '230', '231', '232', '502', '503', '504', '511', '602', '622', '781', '771'];
    return severeCodes.includes(conditionCode);
  }

  /**
   * Efface le cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache météo effacé');
  }

  /**
   * Obtient les statistiques météo pour la semaine
   */
  getWeatherStats(weatherData: WeatherData): {
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    totalPrecipitation: number;
    avgHumidity: number;
    rainyDays: number;
  } {
    if (!weatherData.forecast.length) {
      return {
        avgTemp: 0,
        maxTemp: 0,
        minTemp: 0,
        totalPrecipitation: 0,
        avgHumidity: 0,
        rainyDays: 0,
      };
    }

    const temps = weatherData.forecast.map(f => f.temperature.average);
    const precipitation = weatherData.forecast.map(f => f.precipitation);
    const humidity = weatherData.forecast.map(f => f.humidity);

    return {
      avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      totalPrecipitation: Math.round(precipitation.reduce((a, b) => a + b, 0) * 10) / 10,
      avgHumidity: Math.round(humidity.reduce((a, b) => a + b, 0) / humidity.length),
      rainyDays: precipitation.filter(p => p > 0).length,
    };
  }

  /**
   * Génère des recommandations agricoles basées sur la météo
   */
  getAgriculturalRecommendations(weatherData: WeatherData): string[] {
    const recommendations: string[] = [];
    
    if (!weatherData.current) return recommendations;

    const { temperature, humidity, precipitation, windSpeed } = weatherData.current;
    
    // Recommandations basées sur la température
    if (temperature > 35) {
      recommendations.push('🌡️ Température élevée : Arrosez vos cultures tôt le matin ou tard le soir');
      recommendations.push('☀️ Protégez les cultures sensibles avec des filets d\'ombrage');
    } else if (temperature < 0) {
      recommendations.push('❄️ Risque de gel : Protégez les cultures avec des voiles d\'hivernage');
      recommendations.push('🧊 Vérifiez les systèmes d\'irrigation contre le gel');
    }

    // Recommandations basées sur l'humidité
    if (humidity > 80) {
      recommendations.push('💧 Humidité élevée : Risque de maladies fongiques, appliquez un traitement préventif');
      recommendations.push('🌧️ Surveillez les signes de mildiou et d\'oïdium');
    } else if (humidity < 30) {
      recommendations.push('🏜️ Humidité basse : Augmentez la fréquence d\'irrigation');
      recommendations.push('💨 Attention au stress hydrique des cultures');
    }

    // Recommandations basées sur la pluie
    if (precipitation > 10) {
      recommendations.push('🌧️ Fortes pluies prévues : Vérifiez les systèmes de drainage');
      recommendations.push('🚜 Reportez les traitements phytosanitaires');
    } else if (precipitation === 0 && weatherData.forecast.length > 0) {
      const futureRain = weatherData.forecast.some(f => f.precipitation > 5);
      if (!futureRain) {
        recommendations.push('💧 Aucune pluie prévue dans les 5 jours : Planifiez l\'irrigation');
      }
    }

    // Recommandations basées sur le vent
    if (windSpeed > 40) {
      recommendations.push('💨 Vent fort : Protégez les serres et les structures légères');
      recommendations.push('🌾 Évitez les traitements aériens');
    }

    return recommendations;
  }
}

export const weatherService = new WeatherService();
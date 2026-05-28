import { WeatherForecastPeriod, WeatherInfo } from '../types';

// In-memory cache to deduplicate concurrent requests for the same coordinates
const pendingForecastFetches = new Map<string, Promise<WeatherInfo | null>>();

// LocalStorage cache keys
const POINT_CACHE_KEY = 'weather_point_metadata';
const FORECAST_CACHE_PREFIX = 'weather_forecast_';

// 24 hours TTL for forecast cache
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface PointCacheItem {
  forecastHourlyUrl: string;
  updatedAt: number;
}

/**
 * Rounds a coordinate to 3 decimal places to group close locations (approx. 110m)
 * and optimize cache hits.
 */
function roundCoord(num: number): number {
  return Math.round(num * 1000) / 1000;
}

/**
 * Gets cached point metadata from localStorage.
 */
function getCachedPoints(): Record<string, PointCacheItem> {
  try {
    const raw = localStorage.getItem(POINT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to parse cached weather points:', e);
    return {};
  }
}

/**
 * Caches point metadata in localStorage.
 */
function cachePoint(key: string, forecastHourlyUrl: string) {
  try {
    const cached = getCachedPoints();
    cached[key] = {
      forecastHourlyUrl,
      updatedAt: Date.now(),
    };
    localStorage.setItem(POINT_CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    console.error('Failed to cache weather point metadata:', e);
  }
}

/**
 * Fetches point metadata from weather.gov or retrieves from cache.
 */
async function getForecastHourlyUrl(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = getCachedPoints();
  
  if (cached[key]) {
    return cached[key].forecastHourlyUrl;
  }

  const res = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`, {
    headers: {
      'Accept': 'application/ld+json',
    },
  });

  if (!res.ok) {
    throw new Error(`weather.gov points API returned status ${res.status}`);
  }

  const data = await res.json();
  const forecastHourlyUrl = data.properties?.forecastHourly || data.forecastHourly;

  if (!forecastHourlyUrl) {
    throw new Error('forecastHourly URL not found in points metadata');
  }

  cachePoint(key, forecastHourlyUrl);
  return forecastHourlyUrl;
}

/**
 * Fetches and caches weather forecast for the given latitude and longitude.
 */
export async function fetchWeatherForecast(latitude: number, longitude: number): Promise<WeatherInfo | null> {
  const rLat = roundCoord(latitude);
  const rLng = roundCoord(longitude);
  const cacheKey = `${FORECAST_CACHE_PREFIX}${rLat.toFixed(3)}_${rLng.toFixed(3)}`;
  const fetchKey = `${rLat.toFixed(3)},${rLng.toFixed(3)}`;

  // 1. Check in-memory pending fetches first to avoid double requests
  if (pendingForecastFetches.has(fetchKey)) {
    return pendingForecastFetches.get(fetchKey)!;
  }

  // 2. Check localStorage cache
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const cachedData = JSON.parse(cachedRaw) as WeatherInfo;
      const age = Date.now() - cachedData.fetchedAt;
      if (age < CACHE_TTL_MS) {
        return cachedData;
      }
    }
  } catch (e) {
    console.error('Failed to read weather forecast from cache:', e);
  }

  // 3. Initiate new fetch and track it in pendingForecastFetches
  const fetchPromise = (async (): Promise<WeatherInfo | null> => {
    try {
      const hourlyUrl = await getForecastHourlyUrl(rLat, rLng);
      if (!hourlyUrl) return null;

      const res = await fetch(hourlyUrl);
      if (!res.ok) {
        throw new Error(`weather.gov forecast API returned status ${res.status}`);
      }

      const data = await res.json();
      const periodsRaw = data.properties?.periods || data.periods;
      
      if (!Array.isArray(periodsRaw)) {
        throw new Error('Forecast periods not found in API response');
      }

      const periods: WeatherForecastPeriod[] = periodsRaw.map((p: any) => ({
        number: p.number,
        startTime: p.startTime,
        endTime: p.endTime,
        isDaytime: p.isDaytime ?? true,
        temperature: p.temperature,
        temperatureUnit: p.temperatureUnit || 'F',
        probabilityOfPrecipitation: p.probabilityOfPrecipitation?.value || 0,
        shortForecast: p.shortForecast || 'Unknown',
        windSpeed: p.windSpeed || '',
        relativeHumidity: p.relativeHumidity?.value || 0,
        icon: p.icon || '',
      }));

      const weatherInfo: WeatherInfo = {
        periods,
        fetchedAt: Date.now(),
      };

      // Store in localStorage
      localStorage.setItem(cacheKey, JSON.stringify(weatherInfo));
      return weatherInfo;
    } catch (err) {
      console.error(`Error fetching weather for coordinates ${rLat},${rLng}:`, err);
      
      // Fallback: If network request fails, return expired cache if we have one
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cachedData = JSON.parse(cachedRaw) as WeatherInfo;
          console.warn('Returning expired weather cache due to fetch failure');
          return {
            ...cachedData,
            isOffline: true,
          };
        }
      } catch (e) {
        console.error('Failed to load expired weather fallback:', e);
      }
      
      return null;
    } finally {
      // Clean up from pending list once done
      pendingForecastFetches.delete(fetchKey);
    }
  })();

  pendingForecastFetches.set(fetchKey, fetchPromise);
  return fetchPromise;
}

/**
 * Finds the weather forecast period that matches the event date and optional start time.
 * Coordinates should be [lat, lng].
 */
export function findMatchingPeriod(
  weather: WeatherInfo | null,
  eventDate: string | undefined,
  startTimeStr: string | undefined
): WeatherForecastPeriod | null {
  if (!weather || !eventDate || !weather.periods || weather.periods.length === 0) {
    return null;
  }

  // Parse start hour if available, e.g. "14:00" -> 14
  let targetHour: number | null = null;
  if (startTimeStr) {
    const parts = startTimeStr.split(':');
    if (parts.length >= 1) {
      const h = parseInt(parts[0], 10);
      if (!isNaN(h)) {
        targetHour = h;
      }
    }
  }

  // weather.gov timestamps are local to the destination (e.g. 2026-05-28T14:00:00-06:00)
  // We extract the date portion (slicing first 10 characters "yyyy-MM-dd")
  // and the hour portion (slicing characters 11-13)
  
  if (targetHour !== null) {
    // If we have a specific time, find the exact hour period
    const matched = weather.periods.find(p => {
      const pDate = p.startTime.slice(0, 10);
      const pHour = parseInt(p.startTime.slice(11, 13), 10);
      return pDate === eventDate && pHour === targetHour;
    });
    if (matched) return matched;
  }

  // If no exact hour matched, or no start time provided, let's find the daytime period for that date
  const daytimePeriods = weather.periods.filter(p => {
    const pDate = p.startTime.slice(0, 10);
    return pDate === eventDate && p.isDaytime;
  });

  if (daytimePeriods.length > 0) {
    // Return a representative period (e.g., middle of the day if possible, or first one)
    return daytimePeriods[Math.floor(daytimePeriods.length / 2)];
  }

  // Try any period on that date
  const anyPeriods = weather.periods.filter(p => p.startTime.slice(0, 10) === eventDate);
  if (anyPeriods.length > 0) {
    return anyPeriods[0];
  }

  return null;
}

/**
 * Computes daily summary from all hourly periods on a specific date.
 */
export interface WeatherDailySummary {
  minTemp: number;
  maxTemp: number;
  maxPrecip: number;
  shortForecasts: string[];
}

export function getDailySummary(weather: WeatherInfo | null, dateStr: string | undefined): WeatherDailySummary | null {
  if (!weather || !dateStr || !weather.periods) return null;

  const dayPeriods = weather.periods.filter(p => p.startTime.slice(0, 10) === dateStr);
  if (dayPeriods.length === 0) return null;

  let minTemp = Infinity;
  let maxTemp = -Infinity;
  let maxPrecip = 0;
  const forecasts = new Set<string>();

  dayPeriods.forEach(p => {
    if (p.temperature < minTemp) minTemp = p.temperature;
    if (p.temperature > maxTemp) maxTemp = p.temperature;
    if (p.probabilityOfPrecipitation > maxPrecip) maxPrecip = p.probabilityOfPrecipitation;
    if (p.shortForecast && p.shortForecast !== 'Unknown') {
      forecasts.add(p.shortForecast);
    }
  });

  return {
    minTemp,
    maxTemp,
    maxPrecip,
    shortForecasts: Array.from(forecasts),
  };
}

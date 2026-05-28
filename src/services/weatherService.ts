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
 * Finds the weather forecast period that contains the event's start time using a
 * proper [startTime, endTime) containment check against the full ISO timestamps.
 *
 * When a specific startTime is provided, we only return a period that actually
 * encompasses that hour — if none do (e.g. the event starts after the last period
 * ends) we return null so the UI can hide the forecast rather than show stale data.
 *
 * When no startTime is provided we fall back to a representative daytime period
 * for the event's date.
 */
export function findMatchingPeriod(
  weather: WeatherInfo | null,
  eventDate: string | undefined,
  startTimeStr: string | undefined
): WeatherForecastPeriod | null {
  if (!weather || !eventDate || !weather.periods || weather.periods.length === 0) {
    return null;
  }

  // Parse start hour if available, e.g. "08:30" -> 8
  let targetHour: number | null = null;
  if (startTimeStr) {
    const h = parseInt(startTimeStr.split(':')[0], 10);
    if (!isNaN(h)) targetHour = h;
  }

  if (targetHour !== null) {
    // Use full ISO [startTime, endTime) containment so we respect the exact
    // boundary of each period. weather.gov timestamps look like:
    //   "2026-06-03T06:00:00-06:00"
    // We compare only date + hour (positions 0-12) to avoid timezone arithmetic.
    const contained = weather.periods.find(p => {
      const pStartDate = p.startTime.slice(0, 10);
      const pStartHour = parseInt(p.startTime.slice(11, 13), 10);
      const pEndDate   = p.endTime.slice(0, 10);
      const pEndHour   = parseInt(p.endTime.slice(11, 13), 10);

      // Is the event date+hour >= period start AND < period end?
      // Handle midnight crossover (endHour === 0 means next-day 00:00).
      const eventIsAfterStart =
        eventDate > pStartDate ||
        (eventDate === pStartDate && targetHour! >= pStartHour);

      const eventIsBeforeEnd =
        eventDate < pEndDate ||
        (eventDate === pEndDate && (pEndHour === 0 ? false : targetHour! < pEndHour));

      return eventIsAfterStart && eventIsBeforeEnd;
    });

    // If no period contains this hour, return null — don't fall back to an
    // unrelated period from earlier in the day.
    return contained ?? null;
  }

  // No specific start time → return a representative daytime period for the date.
  const dayPeriods = weather.periods.filter(p => p.startTime.slice(0, 10) === eventDate);
  if (dayPeriods.length === 0) return null;

  const daytime = dayPeriods.filter(p => p.isDaytime);
  if (daytime.length > 0) {
    return daytime[Math.floor(daytime.length / 2)];
  }

  return dayPeriods[0];
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

export interface Vacation {
  id: string;
  title: string;
  description: string;
  startDate: string;
  folderName: string;
}

export interface VacationEvent {
  id: string | number;
  type: 'activity' | 'flight' | 'hotel' | 'driving' | 'dining';
  title: string;
  dayNumber: number;
  skip?: boolean;
  priority?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  earliestStart?: string;
  latestStart?: string;
  timeWarning?: string;
  location?: string;
  address?: string;
  coordinates?: [number, number];
  description?: string;
  details?: Record<string, string>;
  nights?: number;
  freeBreakfast?: boolean;
  hotelId?: string | number;
  nightNumber?: number;
}

export interface PackingItem {
  id: string;
  owner: string;
  text: string;
}

export interface PackingData {
  each: string[];
  family: string[];
  lists: {
    person: string;
    items: string[];
  }[];
}

export interface LocalData {
  completedEvents: Record<string, boolean>;
  completedPacking: Record<string, boolean>;
  confirmations: Record<string, string>;
  notes: string;
  hideCompletedEvents: boolean;
}

export interface WeatherForecastPeriod {
  number: number;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  probabilityOfPrecipitation: number; // 0 to 100
  shortForecast: string;
  windSpeed: string;
  relativeHumidity: number; // 0 to 100
  icon: string; // original weather.gov icon URL
}

export interface WeatherInfo {
  periods: WeatherForecastPeriod[];
  fetchedAt: number;
  isOffline?: boolean;
}


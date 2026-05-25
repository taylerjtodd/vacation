export interface Vacation {
  id: string;
  title: string;
  description: string;
  startDate: string;
  folderName: string;
}

export interface VacationEvent {
  id: string | number;
  type: 'activity' | 'flight' | 'hotel' | 'driving';
  title: string;
  dayNumber: number;
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

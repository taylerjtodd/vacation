export interface VacationEvent {
  id: string;
  type: 'activity' | 'flight' | 'hotel' | 'driving';
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  address?: string;
  coordinates?: [number, number];
  description?: string;
}

export interface PackingItem {
  id: string;
  owner: string;
  text: string;
}

export interface LocalData {
  completedEvents: Record<string, boolean>;
  completedPacking: Record<string, boolean>;
  confirmations: Record<string, string>;
  notes: string;
}

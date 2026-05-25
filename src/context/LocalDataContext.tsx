import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { LocalData } from '../types';

interface LocalDataContextValue {
  localData: LocalData;
  toggleEventCompleted: (id: string) => void;
  updateConfirmation: (id: string, value: string) => void;
  togglePackingItem: (id: string) => void;
  updateNotes: (notes: string) => void;
  toggleHideCompletedEvents: () => void;
  handleClearData: () => void;
}

const defaultLocalData: LocalData = {
  completedEvents: {},
  completedPacking: {},
  confirmations: {},
  notes: '',
  hideCompletedEvents: false,
};

const LocalDataContext = createContext<LocalDataContextValue | null>(null);

function getInitialLocalData(): LocalData {
  const saved = localStorage.getItem('vacationData');

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.completedPacking) parsed.completedPacking = {};
      if (typeof parsed.hideCompletedEvents !== 'boolean') parsed.hideCompletedEvents = false;
      return parsed;
    } catch (error) {
      console.error('Failed to parse local data', error);
    }
  }

  return defaultLocalData;
}

export function LocalDataProvider({ children }: { children: ReactNode }) {
  const [localData, setLocalData] = useState<LocalData>(getInitialLocalData);

  useEffect(() => {
    localStorage.setItem('vacationData', JSON.stringify(localData));
  }, [localData]);

  const value: LocalDataContextValue = {
    localData,
    toggleEventCompleted: (id) => {
      setLocalData((prev) => ({
        ...prev,
        completedEvents: {
          ...prev.completedEvents,
          [id]: !prev.completedEvents[id],
        },
      }));
    },
    updateConfirmation: (id, value) => {
      setLocalData((prev) => ({
        ...prev,
        confirmations: {
          ...prev.confirmations,
          [id]: value,
        },
      }));
    },
    togglePackingItem: (id) => {
      setLocalData((prev) => ({
        ...prev,
        completedPacking: {
          ...prev.completedPacking,
          [id]: !prev.completedPacking[id],
        },
      }));
    },
    updateNotes: (notes) => {
      setLocalData((prev) => ({ ...prev, notes }));
    },
    toggleHideCompletedEvents: () => {
      setLocalData((prev) => ({
        ...prev,
        hideCompletedEvents: !prev.hideCompletedEvents,
      }));
    },
    handleClearData: () => {
      setLocalData(defaultLocalData);
    },
  };

  return <LocalDataContext.Provider value={value}>{children}</LocalDataContext.Provider>;
}

export function useLocalData() {
  const context = useContext(LocalDataContext);

  if (!context) {
    throw new Error('useLocalData must be used within a LocalDataProvider');
  }

  return context;
}

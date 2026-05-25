import { useState, useEffect } from 'react';
import { LocalData } from '../types';

export function useLocalData() {
  const [localData, setLocalData] = useState<LocalData>(() => {
    const saved = localStorage.getItem('vacationData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.completedPacking) parsed.completedPacking = {};
        if (typeof parsed.hideCompletedEvents !== 'boolean') parsed.hideCompletedEvents = false;
        return parsed;
      } catch (e) {
        console.error("Failed to parse local data", e);
      }
    }
    return {
      completedEvents: {},
      completedPacking: {},
      confirmations: {},
      notes: '',
      hideCompletedEvents: false
    };
  });

  useEffect(() => {
    localStorage.setItem('vacationData', JSON.stringify(localData));
  }, [localData]);

  const toggleEventCompleted = (id: string) => {
    setLocalData(prev => ({
      ...prev,
      completedEvents: {
        ...prev.completedEvents,
        [id]: !prev.completedEvents[id]
      }
    }));
  };

  const updateConfirmation = (id: string, value: string) => {
    setLocalData(prev => ({
      ...prev,
      confirmations: {
        ...prev.confirmations,
        [id]: value
      }
    }));
  };

  const togglePackingItem = (id: string) => {
    setLocalData(prev => ({
      ...prev,
      completedPacking: {
        ...prev.completedPacking,
        [id]: !prev.completedPacking[id]
      }
    }));
  };

  const updateNotes = (notes: string) => {
    setLocalData(prev => ({ ...prev, notes }));
  };

  const toggleHideCompletedEvents = () => {
    setLocalData(prev => ({
      ...prev,
      hideCompletedEvents: !prev.hideCompletedEvents
    }));
  };

  const handleClearData = () => {
    setLocalData({
      completedEvents: {},
      completedPacking: {},
      confirmations: {},
      notes: '',
      hideCompletedEvents: false
    });
  };

  return {
    localData,
    toggleEventCompleted,
    updateConfirmation,
    togglePackingItem,
    updateNotes,
    toggleHideCompletedEvents,
    handleClearData
  };
}

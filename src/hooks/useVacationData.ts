import { useState, useEffect } from 'react';
import { Vacation, VacationEvent, PackingItem, PackingData } from '../types';

export function useVacationData(setActiveTab: (tab: string) => void) {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [currentVacation, setCurrentVacation] = useState<Vacation | null>(null);
  const [events, setEvents] = useState<VacationEvent[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('vacations.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load vacations');
        return res.json();
      })
      .then((data: Vacation[]) => {
        setVacations(data);
        if (data.length > 0) {
          setCurrentVacation(data[0]);
        } else {
          setLoading(false);
          setError('No vacations found.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load vacations.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!currentVacation) return;
    setLoading(true);

    Promise.all([
      fetch(`${currentVacation.folderName}/events.json`).then(res => {
        if (!res.ok) throw new Error('Failed to load events');
        return res.json();
      }),
      fetch(`${currentVacation.folderName}/packing.json`).then(res => {
        if (!res.ok) throw new Error('Failed to load packing list');
        return res.json();
      })
    ])
      .then(([eventsData, packingData]) => {
        const mappedEvents = eventsData.map((e: VacationEvent) => {
          const date = new Date(`${currentVacation.startDate}T12:00:00`);
          date.setDate(date.getDate() + (e.dayNumber - 1));
          return {
            ...e,
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          };
        });

        const sorted = mappedEvents.sort((a: VacationEvent, b: VacationEvent) => {
          const dateA = new Date(`${a.date!}T${a.startTime}`);
          const dateB = new Date(`${b.date!}T${b.startTime}`);
          return dateA.getTime() - dateB.getTime();
        });
        setEvents(sorted);

        let flattenedPackingList: PackingItem[] = [];
        if (Array.isArray(packingData)) {
          flattenedPackingList = packingData;
        } else {
          const { each = [], family = [], lists = [] } = packingData as PackingData;

          family.forEach(item => {
            flattenedPackingList.push({
              id: `family-${item}`,
              owner: 'Family',
              text: item
            });
          });

          lists.forEach(list => {
            each.forEach(item => {
              flattenedPackingList.push({
                id: `${list.person}-each-${item}`,
                owner: list.person,
                text: item
              });
            });
            list.items.forEach(item => {
              flattenedPackingList.push({
                id: `${list.person}-list-${item}`,
                owner: list.person,
                text: item
              });
            });
          });
        }
        setPackingList(flattenedPackingList);

        if (sorted.length > 0) {
          const firstEventDateStr = sorted[0].date;
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          if (firstEventDateStr && todayStr < firstEventDateStr) {
            setActiveTab('packing');
          } else {
            setActiveTab('itinerary');
          }
        } else {
          setActiveTab('packing');
        }

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load vacation data. Please try again later.');
        setLoading(false);
      });
  }, [currentVacation, setActiveTab]);

  return {
    vacations,
    currentVacation,
    events,
    packingList,
    loading,
    error
  };
}

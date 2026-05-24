import { useState, useEffect } from 'react';
import { parse, addMinutes, format, isBefore } from 'date-fns';
import { Vacation, VacationEvent, PackingItem, PackingData } from '../types';

const BASE_DATE = new Date(2000, 0, 1); // Arbitrary fixed date for time-only parsing

function parseTime(time: string): Date {
  return parse(time, 'HH:mm', BASE_DATE);
}

function addHoursToTime(time: string, hours: number): string {
  if (!time) return "00:00";
  return format(addMinutes(parseTime(time), Math.round(hours * 60)), 'HH:mm');
}

export function formatDisplayTime(time: string | undefined): string {
  if (!time) return '';
  return format(parseTime(time), 'h:mm a');
}

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
          return a.dayNumber - b.dayNumber;
        });

        let currentTime = "08:00";
        let currentDay = 0;

        const computedEvents = sorted.map((event: VacationEvent) => {
          if (event.dayNumber !== currentDay) {
            currentDay = event.dayNumber;
            currentTime = "08:00"; 
          }

          let startTime = event.startTime;
          if (startTime) {
            currentTime = startTime;
          } else {
            startTime = currentTime;
          }

          let endTime = event.endTime;
          if (event.duration) {
            endTime = addHoursToTime(startTime, event.duration);
            currentTime = endTime;
          } else if (endTime) {
            currentTime = endTime;
          }

          let timeWarning = "";
          if (event.earliestStart) {
            if (isBefore(parseTime(startTime), parseTime(event.earliestStart))) {
              timeWarning = `Must be after ${formatDisplayTime(event.earliestStart)}`;
            }
          }
          if (event.latestStart && !timeWarning) {
            if (isBefore(parseTime(event.latestStart), parseTime(startTime))) {
              timeWarning = `Must be before ${formatDisplayTime(event.latestStart)}`;
            }
          }

          return {
            ...event,
            startTime,
            endTime,
            timeWarning: timeWarning || undefined
          };
        });
        setEvents(computedEvents);

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
          const todayStr = format(today, 'yyyy-MM-dd');
          const twoDaysFromNow = format(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2), 'yyyy-MM-dd');
          if (firstEventDateStr && todayStr <= twoDaysFromNow && firstEventDateStr <= twoDaysFromNow && firstEventDateStr > todayStr) {
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

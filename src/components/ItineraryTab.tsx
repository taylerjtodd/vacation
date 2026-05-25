import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plane, Hotel, Car, MapPin, Clock, Map as MapIcon, CalendarDays, AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { VacationEvent } from '../types';
import { formatDisplayTime } from '../hooks/useVacationData';
import EventDetailsModal from './EventDetailsModal';

const EventIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'flight': return <Plane size={14} />;
    case 'hotel': return <Hotel size={14} />;
    case 'activity': return <MapIcon size={14} />;
    case 'driving': return <Car size={14} />;
    default: return <MapPin size={14} />;
  }
};

const formatDate = (dateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
};

interface Props {
  groupedEvents: Record<string, VacationEvent[]>;
  completedEvents: Record<string, boolean>;
  confirmations: Record<string, string>;
  toggleEventCompleted: (id: string) => void;
  updateConfirmation: (id: string, value: string) => void;
}

export default function ItineraryTab({ 
  groupedEvents, 
  completedEvents, 
  confirmations, 
  toggleEventCompleted, 
  updateConfirmation 
}: Props) {
  const dateKeys = Object.keys(groupedEvents).sort().join(',');
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<VacationEvent | null>(null);

  const toggleDay = (date: string) => {
    setCollapsedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  useEffect(() => {
    if (!dateKeys) return;
    const dates = dateKeys.split(',');

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let targetDate = dates.find(d => d >= todayStr);

    if (!targetDate && dates.length > 0) {
      targetDate = dates[dates.length - 1];
    }

    if (targetDate) {
      setTimeout(() => {
        const el = document.getElementById(`date-${targetDate}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [dateKeys]);

  return (
    <>
    <section className="relative pl-8 sm:pl-12">
      <div className="absolute top-0 bottom-0 left-[11px] sm:left-[27px] w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />

      {Object.entries(groupedEvents).map(([date, dayEvents]) => {
        const isCollapsed = !!collapsedDays[date];
        return (
        <div key={date} id={`date-${date}`} className="mb-10">
          <button
            onClick={() => toggleDay(date)}
            className="w-full text-left mb-6 flex items-center gap-2 relative group"
            aria-expanded={!isCollapsed}
          >
            <div className="absolute -left-[2.35rem] sm:-left-[3.35rem] w-4 h-4 bg-blue-500 border-4 border-slate-50 dark:border-slate-900 rounded-full z-10" />
            <CalendarDays size={24} className="text-blue-500 shrink-0" />
            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              {formatDate(date)}
            </span>
            <span className="ml-1 text-sm text-slate-400 dark:text-slate-500 font-normal">
              {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
            </span>
            <ChevronDown
              size={20}
              className={`ml-auto text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
            />
          </button>
          
          <div className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-[9999px]'}`}>
            {dayEvents.map(event => {
              let typeColorClass = "bg-slate-200";
              let textColorClass = "text-slate-500";
              if (event.type === 'flight') { typeColorClass = "bg-violet-500"; textColorClass = "text-violet-500"; }
              if (event.type === 'hotel') { typeColorClass = "bg-pink-500"; textColorClass = "text-pink-500"; }
              if (event.type === 'activity') { typeColorClass = "bg-emerald-500"; textColorClass = "text-emerald-500"; }
              if (event.type === 'driving') { typeColorClass = "bg-amber-500"; textColorClass = "text-amber-500"; }

              return (
                <div
                  key={event.id}
                  className={`bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border ${
                    event.timeWarning
                      ? 'border-red-500/50 dark:border-red-500/50 shadow-red-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  } transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden flex flex-col gap-1 ${
                    completedEvents[event.id] ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${typeColorClass}`} />

                  {/* Row 1: time + icons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${
                      event.timeWarning ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      <Clock size={12} className="shrink-0" />
                      {formatDisplayTime(event.startTime)}
                      {event.endTime ? ` – ${formatDisplayTime(event.endTime)}` : ''}
                      {event.timeWarning && (
                        <span className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                          <AlertTriangle size={11} />
                          {event.timeWarning}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        id={`event-details-btn-${event.id}`}
                        onClick={() => setSelectedEvent(event)}
                        className={`flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${textColorClass}`}
                        aria-label={`View details for ${event.title}`}
                      >
                        <Info size={14} />
                      </button>
                      <div className={`flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-900 ${textColorClass}`}>
                        <EventIcon type={event.type} />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: title */}
                  <h3 className={`text-sm font-semibold leading-snug ${
                    completedEvents[event.id]
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-50'
                  }`}>
                    {event.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </section>

      {selectedEvent && createPortal(
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          completedEvents={completedEvents}
          confirmations={confirmations}
          toggleEventCompleted={toggleEventCompleted}
          updateConfirmation={updateConfirmation}
        />,
        document.body
      )}
    </>
  );
}

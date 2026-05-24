import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plane, Hotel, Car, MapPin, Clock, Map as MapIcon, CalendarDays, AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { VacationEvent } from '../types';
import MapLink from './MapLink';
import { formatDisplayTime } from '../hooks/useVacationData';
import EventDetailsModal from './EventDetailsModal';

const EventIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'flight': return <Plane size={24} />;
    case 'hotel': return <Hotel size={24} />;
    case 'activity': return <MapIcon size={24} />;
    case 'driving': return <Car size={24} />;
    default: return <MapPin size={24} />;
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
          
          <div className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-[9999px]'}`}>
            {dayEvents.map(event => {
              let typeColorClass = "bg-slate-200";
              let textColorClass = "text-slate-500";
              if (event.type === 'flight') { typeColorClass = "bg-violet-500"; textColorClass = "text-violet-500"; }
              if (event.type === 'hotel') { typeColorClass = "bg-pink-500"; textColorClass = "text-pink-500"; }
              if (event.type === 'activity') { typeColorClass = "bg-emerald-500"; textColorClass = "text-emerald-500"; }
              if (event.type === 'driving') { typeColorClass = "bg-amber-500"; textColorClass = "text-amber-500"; }

              return (
                <div key={event.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border ${event.timeWarning ? 'border-red-500/50 dark:border-red-500/50 shadow-red-500/10' : 'border-slate-200 dark:border-slate-700'} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden flex flex-col ${completedEvents[event.id] ? 'opacity-60' : ''}`}>
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${typeColorClass}`} />
                  
                  <div className="flex justify-between items-start mb-3 gap-4 sm:flex-row flex-col-reverse">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 cursor-pointer accent-blue-500 shrink-0"
                        checked={!!completedEvents[event.id]}
                        onChange={() => toggleEventCompleted(String(event.id))}
                      />
                      <h3 className={`text-xl font-semibold ${completedEvents[event.id] ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-50'}`}>{event.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 sm:relative absolute top-5 right-5">
                      <button
                        id={`event-details-btn-${event.id}`}
                        onClick={() => setSelectedEvent(event)}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${textColorClass}`}
                        aria-label={`View details for ${event.title}`}
                      >
                        <Info size={16} />
                      </button>
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 ${textColorClass}`}>
                        <EventIcon type={event.type} />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-medium mb-2 ${event.timeWarning ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {formatDisplayTime(event.startTime)} {event.endTime ? `- ${formatDisplayTime(event.endTime)}` : ''}
                    </div>
                    {event.timeWarning && (
                      <div className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                        <AlertTriangle size={14} />
                        {event.timeWarning}
                      </div>
                    )}
                  </div>
                  
                  <MapLink event={event} />
                  
                  {event.description && (
                    <div className="text-slate-500 dark:text-slate-400 text-sm mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      {event.description}
                    </div>
                  )}

                  {event.type === 'hotel' && (
                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                      <label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Confirmation Number:</label>
                      <input 
                        type="text" 
                        placeholder="Enter confirmation #" 
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
                        value={confirmations[String(event.id)] || ''}
                        onChange={(e) => updateConfirmation(String(event.id), e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </section>

      {selectedEvent && createPortal(
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />,
        document.body
      )}
    </>
  );
}

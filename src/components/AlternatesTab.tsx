import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plane, Hotel, Car, MapPin, Clock, Map as MapIcon,
  CalendarDays, ChevronDown, Info, Star, Compass, AlertCircle
} from 'lucide-react';
import { VacationEvent } from '../types';
import { formatDisplayTime } from '../hooks/useVacationData';
import { WeatherBadge } from './ItineraryTab';
import EventDetailsModal from './EventDetailsModal';

interface Props {
  alternateEvents: VacationEvent[];
}

const MUST_DO_PRIORITY = 1;

function isMustDoEvent(event: VacationEvent) {
  return event.priority && event.priority <= MUST_DO_PRIORITY;
}

const EventIcon = ({ event }: { event: VacationEvent }) => {
  switch (event.type) {
    case 'flight': return <Plane size={14} />;
    case 'hotel': return <Hotel size={14} />;
    case 'activity':
      if (isMustDoEvent(event)) {
        return <Star size={14} fill="currentColor" />;
      } else {
        return <MapIcon size={14} />;
      }
    case 'driving': return <Car size={14} />;
    default: return <MapPin size={14} />;
  }
};

const getEventIconLabel = (event: VacationEvent) => {
  switch (event.type) {
    case 'flight': return 'Flight';
    case 'hotel': return 'Hotel';
    case 'activity':
      return isMustDoEvent(event) ? 'Must do activity' : 'Activity';
    case 'driving': return 'Driving';
    default: return 'Event';
  }
};

const formatDate = (dateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', options);
};

export default function AlternatesTab({ alternateEvents }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<VacationEvent | null>(null);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});

  const toggleDay = (date: string) => {
    setCollapsedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Group alternates by date
  const groupedEvents = alternateEvents.reduce((acc: Record<string, VacationEvent[]>, event) => {
    if (!event.date) return acc;
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});

  if (alternateEvents.length === 0) {
    return (
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center shadow-md border border-slate-250/60 dark:border-slate-700/60 max-w-lg mx-auto mt-6 animate-in fade-in duration-350">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Compass size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Alternate Options</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          There are no alternate or skipped events recorded for this itinerary. Everything is currently scheduled!
        </p>
      </section>
    );
  }

  return (
    <>
      <div className="mb-6 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl p-4 flex gap-3 text-sm text-slate-650 dark:text-slate-300">
        <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-slate-800 dark:text-white mb-0.5">Explore Alternate Ideas</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            These are activities and segments that were bypassed or skipped in the main schedule. Keep them as premium backups or side-adventures!
          </p>
        </div>
      </div>

      <section className="relative pl-8 sm:pl-12">
        <div className="absolute top-0 bottom-0 left-[11px] sm:left-[27px] w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />

        {Object.entries(groupedEvents).map(([date, dayEvents]) => {
          const isCollapsed = !!collapsedDays[date];
          return (
            <div key={date} className="mb-10">
              {/* Day Header Button */}
              <button
                onClick={() => toggleDay(date)}
                className="w-full text-left mb-6 flex items-center gap-2 relative group focus:outline-none cursor-pointer"
                aria-expanded={!isCollapsed}
              >
                <div className="absolute -left-[2.35rem] sm:-left-[3.35rem] w-4 h-4 bg-slate-400 border-4 border-slate-50 dark:border-slate-900 rounded-full z-10 group-hover:bg-blue-500 transition-colors" />
                <CalendarDays size={22} className="text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-blue-500 transition-colors" />
                <span className="text-xl font-bold text-slate-850 dark:text-slate-100 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                  {formatDate(date)}
                </span>
                <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500 font-normal">
                  {dayEvents.length} {dayEvents.length === 1 ? 'option' : 'options'}
                </span>
                <ChevronDown
                  size={18}
                  className={`ml-auto text-slate-450 dark:text-slate-500 transition-transform duration-200 shrink-0 ${isCollapsed ? '-rotate-90' : ''}`}
                />
              </button>

              {/* Day Events Container */}
              <div className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0' : 'max-h-[9999px]'}`}>
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
                      className="bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden flex flex-col gap-1.5"
                    >
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${typeColorClass}`} />

                      {/* Top Row: Time + Weather Badge + Details */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          <Clock size={12} className="shrink-0 text-slate-400" />
                          {event.startTime ? formatDisplayTime(event.startTime) : 'Flexible'}
                          {event.startTime && event.endTime ? ` – ${formatDisplayTime(event.endTime)}` : ''}
                          {event.duration && !event.endTime && ` (${event.duration} hrs)`}
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Weather badge */}
                          <WeatherBadge event={event} />

                          <button
                            id={`alternate-details-btn-${event.id}`}
                            onClick={() => setSelectedEvent(event)}
                            className={`flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${textColorClass}`}
                            aria-label={`View details for ${event.title}`}
                          >
                            <Info size={14} />
                          </button>
                          
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-900 ${textColorClass}`}
                            aria-label={getEventIconLabel(event)}
                            title={isMustDoEvent(event) ? 'Must do' : undefined}
                          >
                            <EventIcon event={event} />
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Title */}
                      <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-slate-50">
                        {event.title}
                      </h3>

                      {/* Description Snippet if present */}
                      {event.description && (
                        <p className="text-xs text-slate-550 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}

                      {/* Extra Meta Badges */}
                      {event.details && Object.entries(event.details).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Object.entries(event.details).slice(0, 3).map(([key, val]) => (
                            <span key={key} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-150/40 dark:border-slate-700/50">
                              <span className="font-semibold mr-1">{key}:</span> {val}
                            </span>
                          ))}
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
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />,
        document.body
      )}
    </>
  );
}

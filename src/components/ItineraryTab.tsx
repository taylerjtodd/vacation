import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plane, Hotel, Car, MapPin, Clock, Map as MapIcon,
  CalendarDays, AlertTriangle, ChevronDown, Info, Star, Moon, Coffee,
  Thermometer, Droplets, Utensils,
} from 'lucide-react';
import { VacationEvent, WeatherForecastPeriod, WeatherInfo } from '../types';
import { formatDisplayTime } from '../hooks/useVacationData';
import EventDetailsModal from './EventDetailsModal';
import { useLocalData } from '../context/LocalDataContext';
import { fetchWeatherForecast, findMatchingPeriod } from '../services/weatherService';

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
    case 'dining': return <Utensils size={14} />;
    default: return <MapPin size={14} />;
  }
};

const getEventIconLabel = (event: VacationEvent) => {
  switch (event.type) {
    case 'flight': return 'Flight';
    case 'hotel': return 'Hotel';
    case 'activity':
      if (isMustDoEvent(event)) {
        return 'Must do activity';
      } else {
        return 'Activity';
      }
    case 'driving': return 'Driving';
    case 'dining': return 'Dining';
    default: return 'Event';
  }
};

const formatDate = (dateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', options);
};

// ─── Weather helpers ──────────────────────────────────────────────────────────

/** Derive a simple category from the shortForecast string so we can pick an emoji/icon. */
function getWeatherEmoji(shortForecast: string, isDaytime: boolean): string {
  const f = shortForecast.toLowerCase();
  if (f.includes('thunder') || f.includes('storm')) return '⛈️';
  if (f.includes('snow') || f.includes('blizzard')) return '❄️';
  if (f.includes('sleet') || f.includes('freezing rain')) return '🌨️';
  if (f.includes('rain') || f.includes('showers')) return '🌧️';
  if (f.includes('drizzle')) return '🌦️';
  if (f.includes('fog') || f.includes('mist')) return '🌫️';
  if (f.includes('windy') || f.includes('breezy')) return '💨';
  if (f.includes('mostly sunny') || f.includes('mostly clear')) {
    return isDaytime ? '🌤️' : '🌙';
  }
  if (f.includes('partly') || f.includes('partly cloudy')) {
    return isDaytime ? '⛅' : '🌙';
  }
  if (f.includes('cloudy') || f.includes('overcast')) return '☁️';
  if (f.includes('sunny') || f.includes('clear')) {
    return isDaytime ? '☀️' : '🌙';
  }
  return isDaytime ? '🌤️' : '🌙';
}

function getPrecipColorClass(precip: number): string {
  if (precip >= 70) return 'text-blue-600 dark:text-blue-400';
  if (precip >= 40) return 'text-sky-500 dark:text-sky-400';
  return 'text-slate-400 dark:text-slate-500';
}

// ─── WeatherBadge Component ───────────────────────────────────────────────────

export interface WeatherBadgeProps {
  event: VacationEvent;
}

export function WeatherBadge({ event }: WeatherBadgeProps) {
  const [period, setPeriod] = useState<WeatherForecastPeriod | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!event.coordinates || !event.date) {
      setLoading(false);
      return;
    }
    const [lat, lng] = event.coordinates;

    setLoading(true);
    fetchWeatherForecast(lat, lng).then((info: WeatherInfo | null) => {
      if (!mountedRef.current) return;
      if (!info) {
        setLoading(false);
        return;
      }
      setIsOffline(!!info.isOffline);
      const matched = findMatchingPeriod(info, event.date, event.startTime);
      setPeriod(matched);
      setLoading(false);
    });
  }, [event.coordinates, event.date, event.startTime]);

  // Don't render if no coordinates or still loading with nothing to show yet
  if (!event.coordinates || !event.date) return null;
  if (loading) {
    return (
      <div
        className="flex items-center gap-1 text-[11px] text-slate-300 dark:text-slate-600 animate-pulse"
        aria-label="Loading weather"
      >
        <span className="inline-block w-4 h-4 rounded bg-slate-100 dark:bg-slate-700" />
        <span className="inline-block w-8 h-3 rounded bg-slate-100 dark:bg-slate-700" />
      </div>
    );
  }
  if (!period) return null;

  const emoji = getWeatherEmoji(period.shortForecast, period.isDaytime);
  const precipColor = getPrecipColorClass(period.probabilityOfPrecipitation);

  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2 py-1 transition-opacity ${
        isOffline ? 'opacity-60' : 'opacity-100'
      } bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40`}
      title={`${period.shortForecast}${isOffline ? ' (cached)' : ''}`}
    >
      <span className="text-sm leading-none" aria-hidden="true">{emoji}</span>
      <span className="flex items-center gap-0.5 text-slate-700 dark:text-slate-200 font-semibold">
        <Thermometer size={10} className="shrink-0 text-rose-400" />
        {period.temperature}°{period.temperatureUnit}
      </span>
      {period.probabilityOfPrecipitation > 0 && (
        <span className={`flex items-center gap-0.5 ${precipColor}`}>
          <Droplets size={10} className="shrink-0" />
          {period.probabilityOfPrecipitation}%
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  events: VacationEvent[];
}

export default function ItineraryTab({ events }: Props) {
  const { localData } = useLocalData();
  const { completedEvents, hideCompletedEvents } = localData;
  const getTrackingId = (event: VacationEvent) => event.hotelId ? String(event.hotelId) : String(event.id);
  const visibleEvents = hideCompletedEvents
    ? events.filter((event) => !completedEvents[getTrackingId(event)])
    : events;
  const groupedEvents = visibleEvents.reduce((acc: Record<string, VacationEvent[]>, event) => {
    if (!event.date) return acc;
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});
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
              if (event.type === 'dining') { typeColorClass = "bg-orange-500"; textColorClass = "text-orange-500"; }

              return (
                <div
                  key={event.id}
                  className={`bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-sm border ${
                    event.timeWarning
                      ? 'border-red-500/50 dark:border-red-500/50 shadow-red-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  } transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md relative overflow-hidden flex flex-col gap-1 ${
                    completedEvents[getTrackingId(event)] ? 'opacity-60' : ''
                  }`}
                >
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${typeColorClass}`} />

                  {/* Row 1: time + weather + icons */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
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

                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Weather badge — only for events with coordinates */}
                      <WeatherBadge event={event} />

                      <button
                        id={`event-details-btn-${event.id}`}
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

                  {/* Row 2: title */}
                  <h3 className={`text-sm font-semibold leading-snug ${
                    completedEvents[getTrackingId(event)]
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-50'
                  }`}>
                    {event.title}
                  </h3>

                  {event.type === 'hotel' && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 font-medium">
                        <Moon size={11} className="shrink-0" />
                        Night {event.nightNumber || 1} of {event.nights || 1}
                      </span>
                      {event.freeBreakfast && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Coffee size={11} className="shrink-0" />
                          Free Breakfast
                        </span>
                      )}
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

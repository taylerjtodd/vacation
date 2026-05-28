import { useEffect, useRef, useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  Plane,
  Hotel,
  Car,
  Map as MapIcon,
  Navigation,
  AlertTriangle,
  Moon,
  Coffee,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  WifiOff,
  CalendarClock,
} from 'lucide-react';
import { VacationEvent, WeatherForecastPeriod, WeatherInfo } from '../types';
import { formatDisplayTime } from '../hooks/useVacationData';
import { useLocalData } from '../context/LocalDataContext';
import { fetchWeatherForecast, findMatchingPeriod } from '../services/weatherService';

const EventIcon = ({ type }: { type: string }) => {
  const cls = 'shrink-0';
  switch (type) {
    case 'flight':   return <Plane  size={20} className={cls} />;
    case 'hotel':    return <Hotel  size={20} className={cls} />;
    case 'activity': return <MapIcon size={20} className={cls} />;
    case 'driving':  return <Car   size={20} className={cls} />;
    default:         return <MapPin size={20} className={cls} />;
  }
};

const TYPE_STYLES: Record<string, { badge: string; accent: string; bar: string }> = {
  flight:   { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',  accent: 'text-violet-500',  bar: 'bg-violet-500' },
  hotel:    { badge: 'bg-pink-100   text-pink-700   dark:bg-pink-900/40   dark:text-pink-300',    accent: 'text-pink-500',    bar: 'bg-pink-500'   },
  activity: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', accent: 'text-emerald-500', bar: 'bg-emerald-500' },
  driving:  { badge: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',   accent: 'text-amber-500',   bar: 'bg-amber-500'  },
};

const TYPE_LABEL: Record<string, string> = {
  flight: 'Flight', hotel: 'Accommodation', activity: 'Activity', driving: 'Driving',
};

function getMapsUrl(event: VacationEvent): string | null {
  if (event.coordinates) {
    const [lat, lng] = event.coordinates;
    return `https://maps.google.com/?q=${lat},${lng}`;
  }
  if (event.address) {
    return `https://maps.google.com/?q=${encodeURIComponent(event.address)}`;
  }
  return null;
}

// ─── Weather helpers ──────────────────────────────────────────────────────────

function getWeatherEmoji(shortForecast: string, isDaytime: boolean): string {
  const f = shortForecast.toLowerCase();
  if (f.includes('thunder') || f.includes('storm')) return '⛈️';
  if (f.includes('snow') || f.includes('blizzard')) return '❄️';
  if (f.includes('sleet') || f.includes('freezing rain')) return '🌨️';
  if (f.includes('rain') || f.includes('showers')) return '🌧️';
  if (f.includes('drizzle')) return '🌦️';
  if (f.includes('fog') || f.includes('mist')) return '🌫️';
  if (f.includes('windy') || f.includes('breezy')) return '💨';
  if (f.includes('mostly sunny') || f.includes('mostly clear')) return isDaytime ? '🌤️' : '🌙';
  if (f.includes('partly') || f.includes('partly cloudy')) return isDaytime ? '⛅' : '🌙';
  if (f.includes('cloudy') || f.includes('overcast')) return '☁️';
  if (f.includes('sunny') || f.includes('clear')) return isDaytime ? '☀️' : '🌙';
  return isDaytime ? '🌤️' : '🌙';
}

function getPrecipBg(precip: number) {
  if (precip >= 70) return { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-500' };
  if (precip >= 40) return { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-300', icon: 'text-sky-500' };
  return { bg: 'bg-slate-50 dark:bg-slate-900/60', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-400' };
}

// ─── WeatherCard Component ────────────────────────────────────────────────────

interface WeatherCardProps {
  event: VacationEvent;
}

function WeatherCard({ event }: WeatherCardProps) {
  const [period, setPeriod] = useState<WeatherForecastPeriod | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'no-coords' | 'out-of-range' | 'error' | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!event.coordinates) {
      setError('no-coords');
      setLoading(false);
      return;
    }
    if (!event.date) {
      setLoading(false);
      return;
    }

    const [lat, lng] = event.coordinates;
    setLoading(true);
    setError(null);

    fetchWeatherForecast(lat, lng).then((info: WeatherInfo | null) => {
      if (!mountedRef.current) return;
      if (!info) {
        setError('error');
        setLoading(false);
        return;
      }
      setIsOffline(!!info.isOffline);
      const matched = findMatchingPeriod(info, event.date, event.startTime);
      if (!matched) {
        setError('out-of-range');
      } else {
        setPeriod(matched);
      }
      setLoading(false);
    }).catch(() => {
      if (!mountedRef.current) return;
      setError('error');
      setLoading(false);
    });
  }, [event.coordinates, event.date, event.startTime]);

  // No coordinates = no weather section at all
  if (!event.coordinates) return null;

  const precipStyle = period ? getPrecipBg(period.probabilityOfPrecipitation) : getPrecipBg(0);

  return (
    <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
      <div className="flex items-center gap-1.5 mb-3">
        <CloudRain size={13} className="text-sky-500 shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Weather Forecast
        </p>
        {isOffline && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-full font-medium">
            <WifiOff size={9} />
            Cached
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="animate-pulse rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 p-4 flex gap-3 items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 rounded bg-slate-200 dark:bg-slate-700 w-3/4" />
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 w-1/2" />
          </div>
        </div>
      )}

      {/* Out-of-range or error state */}
      {!loading && error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          <CalendarClock size={16} className="shrink-0 mt-0.5 text-slate-400" />
          <span className="leading-snug">
            {error === 'out-of-range'
              ? 'Weather forecast is only available up to 7 days in advance. Check back closer to your trip!'
              : error === 'error'
              ? 'Could not load weather data. Check your connection and try again.'
              : null}
          </span>
        </div>
      )}

      {/* Forecast card */}
      {!loading && !error && period && (
        <div className="rounded-2xl overflow-hidden border border-sky-100 dark:border-sky-900/40 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 shadow-sm">
          {/* Top row: emoji + temp + short forecast */}
          <div className="flex items-center gap-4 px-4 pt-4 pb-3">
            <div className="text-4xl leading-none" aria-hidden="true">
              {getWeatherEmoji(period.shortForecast, period.isDaytime)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 leading-none">
                {period.temperature}°{period.temperatureUnit}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                {period.shortForecast}
              </p>
            </div>
          </div>

          {/* Bottom row: stats grid */}
          <div className="grid grid-cols-3 divide-x divide-sky-100 dark:divide-sky-900/40 border-t border-sky-100 dark:border-sky-900/40">
            {/* Precipitation */}
            <div className={`flex flex-col items-center justify-center py-3 gap-1 ${precipStyle.bg}`}>
              <Droplets size={14} className={`${precipStyle.icon} shrink-0`} />
              <p className={`text-xs font-bold leading-none ${precipStyle.text}`}>
                {period.probabilityOfPrecipitation}%
              </p>
              <p className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Precip</p>
            </div>

            {/* Humidity */}
            <div className="flex flex-col items-center justify-center py-3 gap-1">
              <Thermometer size={14} className="text-rose-400 shrink-0" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                {period.relativeHumidity}%
              </p>
              <p className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Humidity</p>
            </div>

            {/* Wind */}
            <div className="flex flex-col items-center justify-center py-3 gap-1">
              <Wind size={14} className="text-slate-400 shrink-0" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none truncate max-w-[60px] text-center">
                {period.windSpeed}
              </p>
              <p className="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold">Wind</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

interface Props {
  event: VacationEvent;
  onClose: () => void;
}

export default function EventDetailsModal({
  event,
  onClose,
}: Props) {
  const { localData, toggleEventCompleted, updateConfirmation } = useLocalData();
  const { completedEvents, confirmations } = localData;
  const styles = TYPE_STYLES[event.type] ?? TYPE_STYLES.activity;
  const mapsUrl = getMapsUrl(event);
  const trackingId = event.hotelId ? String(event.hotelId) : String(event.id);
  const confirmationValue = confirmations[trackingId] || '';

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const detailEntries = event.details ? Object.entries(event.details) : [];
  if (event.priority) {
    detailEntries.unshift(['Priority', `${event.priority}`])
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      {/* Blur overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[85dvh] flex flex-col bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Coloured top bar */}
        <div className={`h-1.5 w-full shrink-0 ${styles.bar}`} />

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 shrink-0">
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 shrink-0 ${styles.accent}`}>
            <EventIcon type={event.type} />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-bold leading-tight ${completedEvents[trackingId] ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-50'}`}>
              {event.title}
            </h2>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
              {TYPE_LABEL[event.type] ?? event.type}
            </span>
          </div>

          <button
            onClick={onClose}
            id="modal-close-btn"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="Close details"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-6 flex flex-col gap-4">

          {/* Time row */}
          {(event.startTime || event.endTime) && (
            <div className={`flex items-center gap-2 text-sm font-medium ${event.timeWarning ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
              <Clock size={15} className="shrink-0" />
              <span>
                {formatDisplayTime(event.startTime)}
                {event.endTime ? ` – ${formatDisplayTime(event.endTime)}` : ''}
                {event.duration ? ` (${event.duration >= 1 ? `${event.duration}h` : `${Math.round(event.duration * 60)}m`})` : ''}
              </span>
              {event.timeWarning && (
                <span className="flex items-center gap-1 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full ml-1">
                  <AlertTriangle size={12} />
                  {event.timeWarning}
                </span>
              )}
            </div>
          )}

          {/* Location */}
          {(event.location || event.address) && (
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <MapPin size={15} className="shrink-0 mt-0.5" />
              <div>
                {event.location && <p className="font-medium text-slate-700 dark:text-slate-300">{event.location}</p>}
                {event.address && <p className="text-xs mt-0.5">{event.address}</p>}
              </div>
            </div>
          )}

          {/* Other details grid */}
          {detailEntries.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {detailEntries.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3 py-2.5"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-0.5">
                    {label}
                  </p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {event.type === 'hotel' && (
            <div className="flex flex-col gap-4">
              {/* Hotel attributes grid */}
              <div className="grid grid-cols-2 gap-3 py-1">
                <div className="flex items-center gap-3 bg-pink-50/50 dark:bg-pink-950/10 p-3 rounded-xl border border-pink-100/60 dark:border-pink-900/20">
                  <div className="p-2 bg-pink-100 dark:bg-pink-900/40 rounded-lg text-pink-500 dark:text-pink-300 shrink-0">
                    <Moon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-pink-400 dark:text-pink-500">
                      {event.nights && event.nights > 1 ? 'Stay' : 'Duration'}
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {event.nights && event.nights > 1
                        ? `Night ${event.nightNumber} of ${event.nights}`
                        : '1 Night'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-3 rounded-xl border shrink-0 ${
                  event.freeBreakfast
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20'
                    : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-700/50'
                }`}>
                  <div className={`p-2 rounded-lg shrink-0 ${
                    event.freeBreakfast
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Coffee size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                      event.freeBreakfast ? 'text-emerald-400 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-500'
                    }`}>Breakfast</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {event.freeBreakfast ? 'Free Included' : 'Not Included'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`hotel-confirmation-${event.id}`}
                  className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
                >
                  Confirmation #
                </label>
                <input
                  id={`hotel-confirmation-${event.id}`}
                  type="text"
                  placeholder="Enter confirmation #"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
                  value={confirmationValue}
                  onChange={(e) => updateConfirmation(trackingId, e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
              {event.description}
            </div>
          )}

          {/* Weather card — rendered for any event with coordinates */}
          <WeatherCard event={event} />

        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <button
            id={`modal-complete-btn-${event.id}`}
            onClick={() => toggleEventCompleted(trackingId)}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 border ${
              completedEvents[trackingId]
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            aria-pressed={!!completedEvents[trackingId]}
          >
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              completedEvents[trackingId]
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-400 dark:border-slate-500'
            }`}>
              {completedEvents[trackingId] && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {completedEvents[trackingId] ? 'Completed' : 'Mark Complete'}
          </button>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              id={`modal-maps-link-${event.id}`}
              className="flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm shadow-blue-500/30"
            >
              <Navigation size={16} />
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

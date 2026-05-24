import { useEffect } from 'react';
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
} from 'lucide-react';
import { VacationEvent } from '../types';
import { formatDisplayTime } from '../hooks/useVacationData';

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

interface Props {
  event: VacationEvent;
  onClose: () => void;
  completedEvents: Record<string, boolean>;
  toggleEventCompleted: (id: string) => void;
}

export default function EventDetailsModal({ event, onClose, completedEvents, toggleEventCompleted }: Props) {
  const styles = TYPE_STYLES[event.type] ?? TYPE_STYLES.activity;
  const mapsUrl = getMapsUrl(event);

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
            <h2 className={`text-lg font-bold leading-tight ${completedEvents[event.id] ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-50'}`}>
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

          {/* Description */}
          {event.description && (
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
              {event.description}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-3">
          <button
            id={`modal-complete-btn-${event.id}`}
            onClick={() => toggleEventCompleted(String(event.id))}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 border ${
              completedEvents[event.id]
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            aria-pressed={!!completedEvents[event.id]}
          >
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              completedEvents[event.id]
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-400 dark:border-slate-500'
            }`}>
              {completedEvents[event.id] && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            {completedEvents[event.id] ? 'Completed' : 'Mark Complete'}
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

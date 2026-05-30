import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Utensils, Coffee, MapPin, Search, Calendar,
  Info, AlertCircle, Navigation, CheckCircle,
  Thermometer, Droplets
} from 'lucide-react';
import { VacationEvent, WeatherForecastPeriod, WeatherInfo } from '../types';
import { useLocalData } from '../context/LocalDataContext';
import EventDetailsModal from './EventDetailsModal';
import { fetchWeatherForecast, findMatchingPeriod } from '../services/weatherService';

interface DiningTabProps {
  diningList: VacationEvent[];
}

function getMealType(item: VacationEvent): 'Breakfast' | 'Lunch' | 'Dinner' | 'Other' {
  if (item.details?.Meal) {
    const meal = item.details.Meal.toLowerCase();
    if (meal.includes('breakfast')) return 'Breakfast';
    if (meal.includes('lunch')) return 'Lunch';
    if (meal.includes('dinner')) return 'Dinner';
  }
  const title = item.title.toLowerCase();
  if (title.includes('breakfast')) return 'Breakfast';
  if (title.includes('lunch')) return 'Lunch';
  if (title.includes('dinner')) return 'Dinner';
  return 'Other';
}

function getMealBadgeStyles(meal: string) {
  switch (meal) {
    case 'Breakfast':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
    case 'Lunch':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
    case 'Dinner':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-100 dark:border-orange-900/30';
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-slate-100 dark:border-slate-800';
  }
}

function getMealIcon(meal: string) {
  switch (meal) {
    case 'Breakfast':
      return <Coffee size={14} className="shrink-0" />;
    default:
      return <Utensils size={14} className="shrink-0" />;
  }
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

function getPrecipColorClass(precip: number): string {
  if (precip >= 70) return 'text-blue-600 dark:text-blue-400';
  if (precip >= 40) return 'text-sky-500 dark:text-sky-400';
  return 'text-slate-400 dark:text-slate-500';
}

// ─── DiningWeatherBadge Component ──────────────────────────────────────────────
function DiningWeatherBadge({ event }: { event: VacationEvent }) {
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

  if (!event.coordinates || !event.date) return null;
  if (loading) {
    return (
      <div className="flex items-center gap-1 text-[11px] text-slate-300 dark:text-slate-600 animate-pulse">
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
      className={`flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2 py-0.5 transition-opacity ${
        isOffline ? 'opacity-60' : 'opacity-100'
      } bg-sky-50 dark:bg-sky-950/20 border border-sky-100/60 dark:border-sky-900/30`}
      title={`${period.shortForecast}${isOffline ? ' (cached)' : ''}`}
    >
      <span className="text-sm leading-none" aria-hidden="true">{emoji}</span>
      <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-300 font-semibold">
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

// ─── Main DiningTab Component ──────────────────────────────────────────────────
export default function DiningTab({ diningList }: DiningTabProps) {
  const { localData, toggleEventCompleted } = useLocalData();
  const { completedEvents } = localData;

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedMeal, setSelectedMeal] = useState<'all' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<VacationEvent | null>(null);

  // Extract unique day numbers available in dining recommendations
  const uniqueDays = Array.from(new Set(diningList.map(item => item.dayNumber))).sort((a, b) => a - b);

  // Filters logic
  const filteredDining = diningList.filter(item => {
    const matchesDay = selectedDay === 'all' || item.dayNumber === selectedDay;
    const itemMeal = getMealType(item);
    const matchesMeal = selectedMeal === 'all' || itemMeal === selectedMeal;

    const term = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(term) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.details?.Cuisine && item.details.Cuisine.toLowerCase().includes(term)) ||
      (item.address && item.address.toLowerCase().includes(term));

    return matchesDay && matchesMeal && matchesSearch;
  });

  return (
    <section className="flex flex-col gap-6">
      {/* Search and Filters Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent flex items-center gap-2">
            <Utensils className="text-blue-500" size={22} />
            Dining Recommendations
          </h2>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search cuisine, restaurants, spots..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Day selection pills */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Filter by Day</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 snap-x scrollbar-thin">
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap snap-center cursor-pointer transition-all duration-150 ${
                selectedDay === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              All Days
            </button>
            {uniqueDays.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap snap-center cursor-pointer transition-all duration-150 ${
                  selectedDay === day
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>
        </div>

        {/* Meal selection pills */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Filter by Meal</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'Breakfast', 'Lunch', 'Dinner', 'Other'] as const).map(meal => {
              const label = meal === 'all' ? 'All Meals' : meal;
              return (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                    selectedMeal === meal
                      ? 'bg-violet-500 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dining Cards Grid */}
      {filteredDining.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDining.map(item => {
            const mealType = getMealType(item);
            const isCompleted = !!completedEvents[item.id];
            const mapsUrl = item.coordinates
              ? `https://maps.google.com/?q=${item.coordinates[0]},${item.coordinates[1]}`
              : item.address
              ? `https://maps.google.com/?q=${encodeURIComponent(item.address)}`
              : null;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3.5 hover:shadow-md transition-all duration-200 relative overflow-hidden group hover:-translate-y-0.5 ${
                  isCompleted ? 'opacity-65' : ''
                }`}
              >
                {/* Decorative top accent strip */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/80 to-violet-500/80" />

                {/* Card Header: day + meal type badges + weather */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                      <Calendar size={11} />
                      Day {item.dayNumber}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getMealBadgeStyles(mealType)}`}>
                      {getMealIcon(mealType)}
                      {mealType}
                    </span>
                  </div>

                  <DiningWeatherBadge event={item} />
                </div>

                {/* Title + Location details */}
                <div className="flex-1">
                  <h3 className={`text-base font-bold leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors ${
                    isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-50'
                  }`}>
                    {item.title}
                  </h3>

                  {item.location && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <MapPin size={13} className="shrink-0 text-slate-400" />
                      <span>{item.location}</span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2.5 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {/* Highlights/Details pills */}
                  {item.details && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.details.Cuisine && (
                        <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                          🍳 {item.details.Cuisine}
                        </span>
                      )}
                      {item.details.Reservation && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          item.details.Reservation.toLowerCase().includes('recommend') || item.details.Reservation.toLowerCase().includes('require')
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          📅 {item.details.Reservation}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-3.5 mt-1 shrink-0">
                  {/* Visited Toggle */}
                  <button
                    onClick={() => toggleEventCompleted(String(item.id))}
                    className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 hover:bg-emerald-50/20 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <CheckCircle size={13} className={isCompleted ? 'text-emerald-500' : 'text-slate-400'} />
                    <span>{isCompleted ? 'Interested/Visited' : 'Check Off'}</span>
                  </button>

                  {/* Details Modal Trigger */}
                  <button
                    onClick={() => setSelectedEvent(item)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer transition-all duration-150"
                  >
                    <Info size={13} />
                    <span>Details</span>
                  </button>

                  {/* Directions Shortcut */}
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 transition-all duration-150 shrink-0"
                      title="Get Directions"
                    >
                      <Navigation size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Search/Filter State */
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">No Dining Options Match Filters</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
              Try adjusting your meal selection, day picker, or typing a different search phrase to browse recommendations.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedDay('all');
              setSelectedMeal('all');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 active:scale-98 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Render Portal modal details */}
      {selectedEvent && createPortal(
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />,
        document.body
      )}
    </section>
  );
}

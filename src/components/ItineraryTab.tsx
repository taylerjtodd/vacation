import { useEffect } from 'react';
import { Plane, Hotel, Car, MapPin, Clock, Map as MapIcon, CalendarDays } from 'lucide-react';
import { VacationEvent } from '../types';
import MapLink from './MapLink';

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
    <section className="relative pl-8 sm:pl-12">
      <div className="absolute top-0 bottom-0 left-[11px] sm:left-[27px] w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full" />

      {Object.entries(groupedEvents).map(([date, dayEvents]) => (
        <div key={date} id={`date-${date}`} className="mb-10">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 relative">
            <div className="absolute -left-[2.35rem] sm:-left-[3.35rem] w-4 h-4 bg-blue-500 border-4 border-slate-50 dark:border-slate-900 rounded-full z-10" />
            <CalendarDays size={24} className="text-blue-500" />
            {formatDate(date)}
          </h2>
          
          <div className="flex flex-col gap-4">
            {dayEvents.map(event => {
              let typeColorClass = "bg-slate-200";
              let textColorClass = "text-slate-500";
              if (event.type === 'flight') { typeColorClass = "bg-violet-500"; textColorClass = "text-violet-500"; }
              if (event.type === 'hotel') { typeColorClass = "bg-pink-500"; textColorClass = "text-pink-500"; }
              if (event.type === 'activity') { typeColorClass = "bg-emerald-500"; textColorClass = "text-emerald-500"; }
              if (event.type === 'driving') { typeColorClass = "bg-amber-500"; textColorClass = "text-amber-500"; }

              return (
                <div key={event.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden flex flex-col ${completedEvents[event.id] ? 'opacity-60' : ''}`}>
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${typeColorClass}`} />
                  
                  <div className="flex justify-between items-start mb-3 gap-4 sm:flex-row flex-col-reverse">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 cursor-pointer accent-blue-500 shrink-0"
                        checked={!!completedEvents[event.id]}
                        onChange={() => toggleEventCompleted(event.id)}
                      />
                      <h3 className={`text-xl font-semibold ${completedEvents[event.id] ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-50'}`}>{event.title}</h3>
                    </div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 sm:relative absolute top-5 right-5 ${textColorClass}`}>
                      <EventIcon type={event.type} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
                    <Clock size={16} />
                    {event.startTime} {event.endTime ? `- ${event.endTime}` : ''}
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
                        value={confirmations[event.id] || ''}
                        onChange={(e) => updateConfirmation(event.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

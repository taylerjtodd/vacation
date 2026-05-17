import { Vacation } from '../types';
import { CalendarDays, Map as MapIcon, Info } from 'lucide-react';

interface Props {
  vacation: Vacation;
}

export default function OverviewTab({ vacation }: Props) {
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-md border border-slate-200 dark:border-slate-700">      
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-500 shrink-0">
            <CalendarDays size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Trip Start Date</h3>
            <p className="text-slate-600 dark:text-slate-400">{formatDate(vacation.startDate)}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-xl text-violet-500 shrink-0">
            <Info size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">Description</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{vacation.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

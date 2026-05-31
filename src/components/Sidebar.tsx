import { CalendarDays, Utensils, Briefcase, Compass, FileText, Settings, Trash2, Eye, EyeOff, ListCheck } from 'lucide-react';
import { useLocalData } from '../context/LocalDataContext';
import { Vacation, PackingItem } from '../types';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  vacation: Vacation | null;
  eventsCount: number;
  diningCount: number;
  packingList: PackingItem[];
  alternatesCount: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  vacation,
  eventsCount,
  diningCount,
  packingList,
  alternatesCount,
}: Props) {
  const { localData, toggleHideCompletedEvents, handleClearData } = useLocalData();
  const { hideCompletedEvents, completedPacking } = localData;
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Calculate packing stats
  const packedCount = packingList.length
    ? packingList.filter((item) => !!completedPacking?.[item.id]).length
    : 0;
  const packingPercent = packingList.length
    ? Math.round((packedCount / packingList.length) * 100)
    : 0;

  const tabs = [
    { id: 'itinerary', label: 'Itinerary', icon: CalendarDays, desc: `${eventsCount} scheduled` },
    { id: 'dining', label: 'Dining Options', icon: Utensils, desc: `${diningCount} spots` },
    { id: 'packing', label: 'Packing List', icon: Briefcase, desc: packingList.length ? `${packedCount}/${packingList.length} (${packingPercent}%)` : 'empty' },
    { id: 'alternates', label: 'Alternate Options', icon: Compass, desc: `${alternatesCount} events` },
    { id: 'checklist', label: 'Pre-Trip Checklist', icon: ListCheck, desc: 'Checklist' },
    { id: 'notes', label: 'Quick Notes', icon: FileText, desc: 'Notebook' },
  ];

  return (
    <aside
      className="w-64 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden shrink-0 self-start sticky top-6"
      aria-label="Sidebar Menu"
    >
      {/* Title */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-850/50">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">Trip Navigator</span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mt-1 leading-snug">
          {vacation?.title || 'Vacation'}
        </h2>
        {vacation?.description && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
            {vacation.description}
          </p>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className="p-4 space-y-1.5 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 relative group cursor-pointer ${isActive
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-950 dark:hover:text-white'
                }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 group-hover:scale-110 transition-transform'}`}>
                <Icon size={16} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-none mb-1">
                  {tab.label}
                </p>
                <span className={`text-[9px] uppercase font-medium tracking-wide leading-none ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-550'}`}>
                  {tab.desc}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Preferences Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5">
        <div className="flex items-center gap-1.5 px-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          <Settings size={10} />
          <span>Preferences</span>
        </div>

        {/* Toggle hide completed */}
        <button
          onClick={toggleHideCompletedEvents}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            {hideCompletedEvents ? <EyeOff size={12} className="text-blue-500" /> : <Eye size={12} className="text-slate-400" />}
            <span>Completed Events</span>
          </span>
          <div className={`w-7 h-4 rounded-full relative shrink-0 transition-colors ${hideCompletedEvents ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${hideCompletedEvents ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
        </button>

        {/* Clear Data */}
        <button
          onClick={() => setIsConfirmClearOpen(true)}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-red-200/30 bg-red-50/30 hover:bg-red-50/70 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-[11px] font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
        >
          <Trash2 size={12} />
          <span>Clear App Data</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {isConfirmClearOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Clear Local Data</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              Are you sure you want to clear all local data? This will reset your packing checklist and completed items.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={() => setIsConfirmClearOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg font-medium bg-red-500 border border-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                onClick={() => {
                  handleClearData();
                  setIsConfirmClearOpen(false);
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </aside>
  );
}

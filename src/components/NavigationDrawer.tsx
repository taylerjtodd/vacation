import { X, CalendarDays, Utensils, Briefcase, Compass, FileText, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { useLocalData } from '../context/LocalDataContext';
import { Vacation, PackingItem } from '../types';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  vacation: Vacation | null;
  eventsCount: number;
  diningCount: number;
  packingList: PackingItem[];
  alternatesCount: number;
}

export default function NavigationDrawer({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  vacation,
  eventsCount,
  diningCount,
  packingList,
  alternatesCount,
}: Props) {
  const { localData, toggleHideCompletedEvents, handleClearData } = useLocalData();
  const { hideCompletedEvents, completedPacking } = localData;
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  if (!isOpen) return null;

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
    { id: 'notes', label: 'Quick Notes', icon: FileText, desc: 'Notebook' },
  ];

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <aside
        className="fixed top-0 bottom-0 left-0 w-[300px] bg-white/95 dark:bg-slate-800/95 border-r border-slate-200/50 dark:border-slate-700/50 shadow-2xl z-50 flex flex-col justify-between overflow-hidden transition-transform duration-300 animate-in slide-in-from-left duration-200"
        aria-label="Navigation Menu"
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">Trip Navigator</span>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white line-clamp-1 mt-1">
                {vacation?.title || 'Vacation'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} className="hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 relative group cursor-pointer ${isActive
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-slate-950 dark:hover:text-white'
                  }`}
              >
                {/* Active side-indicator */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-white rounded-r-full" />
                )}

                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 group-hover:scale-110 transition-transform'}`}>
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-none mb-1">
                    {tab.label}
                  </p>
                  <span className={`text-[10px] uppercase font-medium tracking-wide ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions & Settings */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Settings size={12} />
            <span>Preferences</span>
          </div>

          {/* Toggle Hide Completed */}
          <button
            onClick={toggleHideCompletedEvents}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {hideCompletedEvents ? <EyeOff size={14} className="text-blue-500" /> : <Eye size={14} className="text-slate-400" />}
              <span>{hideCompletedEvents ? 'Hiding Completed' : 'Showing Completed'}</span>
            </span>
            <div className={`w-8 h-4.5 rounded-full relative shrink-0 transition-colors ${hideCompletedEvents ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${hideCompletedEvents ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Clear Local Data */}
          <button
            onClick={() => setIsConfirmClearOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-200/30 bg-red-50/30 hover:bg-red-50/70 dark:bg-red-950/10 dark:hover:bg-red-950/20 text-xs font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Clear App Data</span>
          </button>
        </div>
      </aside>

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
                  onClose();
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

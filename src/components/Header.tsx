import { useState } from 'react';
import { WifiOff, Settings, ChevronDown } from 'lucide-react';
import OverviewTab from './OverviewTab';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Vacation } from '../types';

interface Props {
  vacation: Vacation | null;
  hideCompletedEvents: boolean;
  toggleHideCompletedEvents: () => void;
  handleClearData: () => void;
}

export default function Header({
  vacation,
  hideCompletedEvents,
  toggleHideCompletedEvents,
  handleClearData
}: Props) {
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOffline = useNetworkStatus();

  return (
    <>
      <header className="text-center">
        <div className="flex justify-between items-start relative">
          <div
            className="text-left cursor-pointer group select-none"
            onClick={() => setIsOverviewOpen(!isOverviewOpen)}
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent mb-2 flex items-center gap-2">
              {vacation?.title || 'Vacation Itinerary'}
              <ChevronDown className={`text-blue-500 transition-transform duration-300 ${isOverviewOpen ? 'rotate-180' : ''}`} size={28} />
            </h1>
          </div>
          <div className="relative">
            <button className="bg-transparent border-none text-slate-500 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Settings size={24} />
            </button>
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[160px] overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 bg-transparent border-none text-slate-700 dark:text-slate-200 cursor-pointer transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm flex items-center justify-between gap-3"
                  onClick={toggleHideCompletedEvents}
                  aria-pressed={hideCompletedEvents}
                >
                  <span>{hideCompletedEvents ? 'Show Completed Events' : 'Hide Completed Events'}</span>
                  <span className={`w-10 h-6 rounded-full transition-colors ${hideCompletedEvents ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'} relative shrink-0`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${hideCompletedEvents ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-transparent border-none text-red-500 cursor-pointer transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm" onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }}>
                  Clear Local Data
                </button>
              </div>
            )}
          </div>
        </div>
        {isOffline && (
          <div className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm font-medium shadow-sm">
            <WifiOff size={16} />
            <span>You are viewing this offline</span>
          </div>
        )}
      </header>

      {isOverviewOpen && vacation && (
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <OverviewTab vacation={vacation} />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Clear Local Data</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">Are you sure you want to clear all local data? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-lg font-medium bg-red-500 border border-red-500 text-white hover:bg-red-600 hover:border-red-600 transition-colors cursor-pointer" onClick={() => { handleClearData(); setIsModalOpen(false); }}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

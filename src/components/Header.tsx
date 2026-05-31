import { useState } from 'react';
import { WifiOff, ChevronDown, Menu } from 'lucide-react';
import OverviewTab from './OverviewTab';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Vacation } from '../types';

interface Props {
  vacation: Vacation | null;
  onOpenMenu: () => void;
}

export default function Header({ vacation, onOpenMenu }: Props) {
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const isOffline = useNetworkStatus();

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Hamburger button only on mobile/tablet */}
          <button
            onClick={onOpenMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors cursor-pointer shrink-0 border border-slate-200/40 dark:border-slate-750/30 bg-white/50 dark:bg-slate-800/40"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          
          <div
            className="text-left cursor-pointer group select-none flex-1 min-w-0"
            onClick={() => setIsOverviewOpen(!isOverviewOpen)}
          >
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent flex items-center gap-1.5 truncate">
              {vacation?.title || 'Vacation Itinerary'}
              <ChevronDown className={`text-blue-500 transition-transform duration-300 shrink-0 ${isOverviewOpen ? 'rotate-180' : ''}`} size={20} />
            </h1>
          </div>

          {/* Visual balance spacer for mobile views */}
          <div className="w-10 lg:hidden shrink-0" />
        </div>
        
        {isOffline && (
          <div className="mt-4 bg-amber-500 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 text-sm font-medium shadow-sm animate-in fade-in duration-300">
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
    </>
  );
}

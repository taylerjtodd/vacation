import { useState, useEffect } from 'react';
import { CalendarDays, WifiOff, FileText, Briefcase, Settings, Info } from 'lucide-react';
import ItineraryTab from './components/ItineraryTab';
import PackingTab from './components/PackingTab';
import NotesTab from './components/NotesTab';
import OverviewTab from './components/OverviewTab';
import { VacationEvent, PackingItem, LocalData, Vacation } from './types';
import './index.css';

function App() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [currentVacation, setCurrentVacation] = useState<Vacation | null>(null);
  const [events, setEvents] = useState<VacationEvent[]>([]);
  const [packingList, setPackingList] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [activeTab, setActiveTab] = useState('itinerary');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [localData, setLocalData] = useState<LocalData>(() => {
    const saved = localStorage.getItem('vacationData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.completedPacking) parsed.completedPacking = {};
        return parsed;
      } catch (e) {
        console.error("Failed to parse local data", e);
      }
    }
    return {
      completedEvents: {},
      completedPacking: {},
      confirmations: {},
      notes: ''
    };
  });

  useEffect(() => {
    localStorage.setItem('vacationData', JSON.stringify(localData));
  }, [localData]);

  const toggleEventCompleted = (id: string) => {
    setLocalData(prev => ({
      ...prev,
      completedEvents: {
        ...prev.completedEvents,
        [id]: !prev.completedEvents[id]
      }
    }));
  };

  const updateConfirmation = (id: string, value: string) => {
    setLocalData(prev => ({
      ...prev,
      confirmations: {
        ...prev.confirmations,
        [id]: value
      }
    }));
  };

  const togglePackingItem = (id: string) => {
    setLocalData(prev => ({
      ...prev,
      completedPacking: {
        ...prev.completedPacking,
        [id]: !prev.completedPacking[id]
      }
    }));
  };

  const updateNotes = (notes: string) => {
    setLocalData(prev => ({ ...prev, notes }));
  };

  const handleClearData = () => {
    setLocalData({
      completedEvents: {},
      completedPacking: {},
      confirmations: {},
      notes: ''
    });
    setIsModalOpen(false);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetch('vacations.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load vacations');
        return res.json();
      })
      .then((data: Vacation[]) => {
        setVacations(data);
        if (data.length > 0) {
          setCurrentVacation(data[0]);
        } else {
          setLoading(false);
          setError('No vacations found.');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load vacations.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!currentVacation) return;
    setLoading(true);

    Promise.all([
      fetch(`${currentVacation.folderName}/events.json`).then(res => {
        if (!res.ok) throw new Error('Failed to load events');
        return res.json();
      }),
      fetch(`${currentVacation.folderName}/packing.json`).then(res => {
        if (!res.ok) throw new Error('Failed to load packing list');
        return res.json();
      })
    ])
      .then(([eventsData, packingData]) => {
        const mappedEvents = eventsData.map((e: VacationEvent) => {
          const date = new Date(`${currentVacation.startDate}T12:00:00`);
          date.setDate(date.getDate() + (e.dayNumber - 1));
          return {
            ...e,
            date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          };
        });

        const sorted = mappedEvents.sort((a: VacationEvent, b: VacationEvent) => {
          const dateA = new Date(`${a.date!}T${a.startTime}`);
          const dateB = new Date(`${b.date!}T${b.startTime}`);
          return dateA.getTime() - dateB.getTime();
        });
        setEvents(sorted);
        setPackingList(packingData);

        if (sorted.length > 0) {
          const firstEventDateStr = sorted[0].date;
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          if (firstEventDateStr && todayStr < firstEventDateStr) {
            setActiveTab('overview');
          } else {
            setActiveTab('itinerary');
          }
        } else {
          setActiveTab('overview');
        }

        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load vacation data. Please try again later.');
        setLoading(false);
      });
  }, [currentVacation]);

  useEffect(() => {
    if (loading || events.length === 0 || activeTab !== 'itinerary') return;
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const uniqueDates = [...new Set(events.map(e => e.date).filter(Boolean) as string[])].sort();
    let targetDate = uniqueDates.find(d => d >= todayStr);
    
    if (!targetDate && uniqueDates.length > 0) {
      targetDate = uniqueDates[uniqueDates.length - 1];
    }
    
    if (targetDate) {
      setTimeout(() => {
        const el = document.getElementById(`date-${targetDate}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [loading, events, activeTab]);

  if (loading) return <div className="text-center p-8 text-slate-500 dark:text-slate-400">Loading itinerary...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  const groupedEvents = events.reduce((acc: Record<string, VacationEvent[]>, event) => {
    if (!event.date) return acc;
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <header className="mb-8 text-center py-6">
        <div className="flex justify-between items-start relative">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-blue-500 to-violet-500 bg-clip-text text-transparent mb-2">Vacation Itinerary</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Your upcoming adventure</p>
          </div>
          <div className="relative">
            <button className="bg-transparent border-none text-slate-500 cursor-pointer p-2 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Settings size={24} />
            </button>
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[160px] overflow-hidden">
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

      <div className="flex gap-2 mb-8 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto snap-x">
        <button 
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 whitespace-nowrap snap-center min-w-[120px] ${activeTab === 'itinerary' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-50'}`}
          onClick={() => setActiveTab('itinerary')}
        >
          <CalendarDays size={18} /> Itinerary
        </button>
        <button 
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 whitespace-nowrap snap-center min-w-[120px] ${activeTab === 'packing' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-50'}`}
          onClick={() => setActiveTab('packing')}
        >
          <Briefcase size={18} /> Packing
        </button>
        <button 
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 whitespace-nowrap snap-center min-w-[120px] ${activeTab === 'notes' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-50'}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={18} /> Notes
        </button>
        <button 
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 whitespace-nowrap snap-center min-w-[120px] ${activeTab === 'overview' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-50'}`}
          onClick={() => setActiveTab('overview')}
        >
          <Info size={18} /> Overview
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'overview' && currentVacation && (
          <OverviewTab vacation={currentVacation} />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryTab 
            groupedEvents={groupedEvents}
            completedEvents={localData.completedEvents}
            confirmations={localData.confirmations}
            toggleEventCompleted={toggleEventCompleted}
            updateConfirmation={updateConfirmation}
          />
        )}

        {activeTab === 'packing' && (
          <PackingTab 
            packingList={packingList}
            completedPacking={localData.completedPacking}
            togglePackingItem={togglePackingItem}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab 
            notes={localData.notes}
            updateNotes={updateNotes}
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Clear Local Data</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">Are you sure you want to clear all local data? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded-lg font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-lg font-medium bg-red-500 border border-red-500 text-white hover:bg-red-600 hover:border-red-600 transition-colors cursor-pointer" onClick={handleClearData}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

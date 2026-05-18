import { useState, useEffect } from 'react';
import { CalendarDays, FileText, Briefcase } from 'lucide-react';
import ItineraryTab from './components/ItineraryTab';
import PackingTab from './components/PackingTab';
import NotesTab from './components/NotesTab';
import { VacationEvent } from './types';
import { useLocalData } from './hooks/useLocalData';
import { useVacationData } from './hooks/useVacationData';
import './index.css';
import Header from './components/Header';

function App() {
  const [activeTab, setActiveTab] = useState('itinerary');

  const {
    localData,
    toggleEventCompleted,
    updateConfirmation,
    togglePackingItem,
    updateNotes,
  } = useLocalData();

  const {
    currentVacation,
    events,
    packingList,
    loading,
    error
  } = useVacationData(setActiveTab);

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
      <Header vacation={currentVacation} />

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
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
    </div>
  );
}

export default App;

import { useState } from 'react';
import { CalendarDays, FileText, Briefcase, Utensils } from 'lucide-react';
import ItineraryTab from './components/ItineraryTab';
import PackingTab from './components/PackingTab';
import NotesTab from './components/NotesTab';
import DiningTab from './components/DiningTab';
import { useVacationData } from './hooks/useVacationData';
import './index.css';
import Header from './components/Header';

function App() {
  const [activeTab, setActiveTab] = useState('itinerary');

  const {
    currentVacation,
    events,
    diningOptions,
    packingList,
    loading,
    error
  } = useVacationData(setActiveTab);

  if (loading) return <div className="text-center p-8 text-slate-500 dark:text-slate-400">Loading itinerary...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  const TabButton = ({ children, myTab }: { children: React.ReactElement, myTab: string }) => {
    const title = toTitleCase(myTab);
    return (
      <button
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium cursor-pointer transition-all duration-200 whitespace-nowrap snap-center min-w-[120px] ${activeTab === myTab ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-50'}`}
        onClick={() => setActiveTab(myTab)}
      >
        {children} {title}
      </button>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <Header
        vacation={currentVacation}
      />

      <div className="flex gap-2 mb-8 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto snap-x">
        <TabButton myTab='itinerary'><CalendarDays size={18} /></TabButton>
        <TabButton myTab='dining'><Utensils size={18} /></TabButton>
        <TabButton myTab='packing'><Briefcase size={18} /></TabButton>
        <TabButton myTab='notes'><FileText size={18} /></TabButton>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'itinerary' && (
          <ItineraryTab events={events} />
        )}

        {activeTab === 'dining' && (
          <DiningTab diningList={diningOptions} />
        )}

        {activeTab === 'packing' && (
          <PackingTab packingList={packingList} />
        )}

        {activeTab === 'notes' && (
          <NotesTab />
        )}
      </div>
    </div>
  );
}

export default App;

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

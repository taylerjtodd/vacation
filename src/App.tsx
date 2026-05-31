import { useState } from 'react';
import ItineraryTab from './components/ItineraryTab';
import PackingTab from './components/PackingTab';
import NotesTab from './components/NotesTab';
import DiningTab from './components/DiningTab';
import AlternatesTab from './components/AlternatesTab';
import Sidebar from './components/Sidebar';
import ChecklistTab from './components/ChecklistTab';
import NavigationDrawer from './components/NavigationDrawer';
import { useVacationData } from './hooks/useVacationData';
import Header from './components/Header';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [isNavOpen, setIsNavOpen] = useState(false);

  const {
    currentVacation,
    events,
    diningOptions,
    packingList,
    alternateEvents,
    loading,
    error
  } = useVacationData(setActiveTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wider uppercase">Loading Vacation Planner...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 p-6 rounded-2xl shadow-lg max-w-sm w-full text-center">
          <div className="text-red-500 font-bold text-lg mb-2">Error Loading Data</div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 w-full">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          
          {/* Desktop Left Sidebar Navigation */}
          <div className="hidden lg:block sticky top-8">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              vacation={currentVacation}
              eventsCount={events.length}
              diningCount={diningOptions.length}
              packingList={packingList}
              alternatesCount={alternateEvents.length}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full max-w-3xl mx-auto">
            {/* Top Header */}
            <Header
              vacation={currentVacation}
              onOpenMenu={() => setIsNavOpen(true)}
            />

            {/* Render Active Tab content */}
            <main className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {activeTab === 'itinerary' && (
                <ItineraryTab events={events} />
              )}

              {activeTab === 'dining' && (
                <DiningTab diningList={diningOptions} />
              )}

              {activeTab === 'packing' && (
                <PackingTab packingList={packingList} />
              )}

              {activeTab === 'alternates' && (
                <AlternatesTab alternateEvents={alternateEvents} />
              )}

              {activeTab === 'checklist' && (
                <ChecklistTab />
              )}

              {activeTab === 'notes' && (
                <NotesTab />
              )}
            </main>
          </div>
        </div>

        {/* Mobile Slide-Over Navigation Drawer */}
        <NavigationDrawer
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          vacation={currentVacation}
          eventsCount={events.length}
          diningCount={diningOptions.length}
          packingList={packingList}
          alternatesCount={alternateEvents.length}
        />
      </div>
    </div>
  );
}

export default App;

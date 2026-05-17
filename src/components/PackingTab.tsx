import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { PackingItem } from '../types';

interface Props {
  packingList: PackingItem[];
  completedPacking: Record<string, boolean>;
  togglePackingItem: (id: string) => void;
}

export default function PackingTab({ packingList, completedPacking, togglePackingItem }: Props) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (owner: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [owner]: !prev[owner]
    }));
  };

  const groupedList = packingList.reduce((acc: Record<string, PackingItem[]>, item) => {
    if (!acc[item.owner]) acc[item.owner] = [];
    acc[item.owner].push(item);
    return acc;
  }, {});

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-blue-500 mb-4">Packing List</h2>
      {Object.entries(groupedList).map(([owner, items]) => {
        const isExpanded = expandedSections[owner] !== false;
        
        return (
          <div key={owner} className="mb-6 last:mb-0">
            <button 
              onClick={() => toggleSection(owner)}
              className="w-full flex items-center justify-between text-left focus:outline-none mb-2 pb-1 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{owner}</h3>
              {isExpanded ? (
                <ChevronDown className="text-slate-400 shrink-0 transition-transform" size={20} />
              ) : (
                <ChevronRight className="text-slate-400 shrink-0 transition-transform" size={20} />
              )}
            </button>
            {isExpanded && (
              <ul className="list-none animate-in fade-in slide-in-from-top-2 duration-200">
                {items.map(item => (
                  <li key={item.id} className="flex items-center gap-2 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <input 
                      type="checkbox" 
                      checked={!!completedPacking?.[item.id]}
                      onChange={() => togglePackingItem(item.id)}
                      id={`pack-${item.id.replace(/\\s+/g, '-')}`}
                      className="w-4 h-4 cursor-pointer accent-blue-500 shrink-0"
                    />
                    <label htmlFor={`pack-${item.id.replace(/\\s+/g, '-')}`} className={completedPacking?.[item.id] ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-50'}>
                      {item.text}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

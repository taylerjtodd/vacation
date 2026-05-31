import { useState } from 'react';
import { ListCheck } from 'lucide-react';

const preTripItems: string[] = [
  'Clean out the car',
  'Get gas',
  "Try out the cargo bag",
  'Prechill cooler',
  "Download offline maps on everyone's phone",
  'Sign up for Alltrails and download hikes',
  'Buy fishing licenses',
  'Wash laundry',
  'Pack suitcases',
  'Pack food',
  'Pack miscellaneous',
  'Plan picnic meals and breakfasts',
  'Buy groceries',
  'Mow the lawn',
  'Buy kids rain coats',
  'Rent bikes',
];

export default function ChecklistTab() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleItem = (item: string) => {
    setChecked((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-blue-500 mb-4 flex items-center gap-2">
        <ListCheck size={24} />
        Pre‑Trip Checklist
      </h2>
      <ul className="space-y-2">
        {preTripItems.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!checked[item]}
              onChange={() => toggleItem(item)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className={checked[item] ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-50'}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

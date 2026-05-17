interface Props {
  notes: string;
  updateNotes: (notes: string) => void;
}

export default function NotesTab({ notes, updateNotes }: Props) {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-bold text-blue-500 mb-4">Notes</h2>
      <textarea 
        className="w-full min-h-[150px] p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 resize-y"
        placeholder="Jot down ideas, important numbers, or anything else..."
        value={notes}
        onChange={(e) => updateNotes(e.target.value)}
      />
    </section>
  );
}

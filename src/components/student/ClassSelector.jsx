import { FiGrid } from "react-icons/fi";

export default function ClassSelector({
  classes,
  selectedClassId,
  onSelectClass,
}) {
  return (
    <div className="mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-slate-100">
          <FiGrid className="text-brand-neutral" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Class:
          </span>
        </div>
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectClass(c.id)}
            className={`shrink-0 px-5 py-2 rounded-xl border-2 text-xs font-black transition-all active:scale-95 ${
              selectedClassId === c.id
                ? "border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

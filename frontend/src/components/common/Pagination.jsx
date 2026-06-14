export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs">← Prev</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onChange(p)} className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'text-slate-400 hover:bg-surface-2'}`}>{p}</button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === pages} className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs">Next →</button>
    </div>
  );
}

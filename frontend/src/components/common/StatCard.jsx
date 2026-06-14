export default function StatCard({ label, value, icon, color = 'blue', change, sub }) {
  const colors = {
    blue:   'text-primary-light bg-primary-dim/30 border-primary/20',
    green:  'text-green-400  bg-green-900/20   border-green-700/20',
    amber:  'text-amber-400  bg-amber-900/20   border-amber-700/20',
    purple: 'text-purple-400 bg-purple-900/20  border-purple-700/20',
    teal:   'text-teal-400   bg-teal-900/20    border-teal-700/20',
    red:    'text-red-400    bg-red-900/20     border-red-700/20',
  };
  const val = {
    blue: 'text-primary-light', green: 'text-green-400', amber: 'text-amber-400',
    purple: 'text-purple-400', teal: 'text-teal-400', red: 'text-red-400',
  };
  return (
    <div className={`card relative overflow-hidden border ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{label}</p>
        {icon && <span className="text-xl opacity-60">{icon}</span>}
      </div>
      <p className={`text-3xl font-bold mb-1 ${val[color]}`}>{value}</p>
      {change && <p className="text-xs text-slate-500 flex items-center gap-1"><span className="text-green-400">↑</span>{change}</p>}
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

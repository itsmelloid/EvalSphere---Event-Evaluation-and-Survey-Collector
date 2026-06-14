import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import { formatDateTime, CHART_COLORS } from '../../utils/helpers';

const TOOLTIP_STYLE = { contentStyle: { background:'#1C2438', border:'1px solid #2A3650', borderRadius:8, fontSize:12 } };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/analytics').then(({ data }) => setStats(data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const monthly = stats?.monthly_trend || [];
  const byCategory = stats?.events_by_category || [];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and key metrics" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Events"   value={stats?.summary?.total_events   ?? 0} icon="🗓"  color="blue"   change="Platform total" />
        <StatCard label="Total Staff"    value={stats?.summary?.total_staff    ?? 0} icon="👥"  color="purple" change="Active accounts" />
        <StatCard label="Total Users"    value={stats?.summary?.total_users    ?? 0} icon="👤"  color="green"  change="Registered participants" />
        <StatCard label="Evaluations"    value={stats?.summary?.total_submissions ?? 0} icon="📊" color="amber" change={`Avg ★ ${stats?.summary?.average_rating || 'N/A'}`} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Monthly Submissions</h3>
            <span className="text-xs text-slate-500">Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly} barSize={14}>
              <XAxis dataKey="month" tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3D7FFF" radius={[4,4,0,0]} name="Submissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Avg Rating Trend</h3>
            <span className="text-xs text-slate-500">Monthly average</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthly}>
              <XAxis dataKey="month" tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,5]} tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="avg_rating" stroke="#22C55E" strokeWidth={2.5} dot={{ fill:'#22C55E', r:3 }} name="Avg Rating" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Events by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="count" paddingAngle={3}>
                {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {byCategory.slice(0,5).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-slate-400 flex-1 truncate">{d.category}</span>
                <span className="text-white font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card col-span-2">
          <h3 className="text-sm font-semibold mb-4">Recent Events</h3>
          <div className="space-y-2">
            {(stats?.recent_events || []).map(e => (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.title}</p>
                  <p className="text-xs text-slate-500">{e.venue} · {e.event_date}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  e.status==='Ongoing'?'badge-green':e.status==='Completed'?'badge-teal':e.status==='Upcoming'?'badge-amber':'badge-red'
                }`}>{e.status}</span>
              </div>
            ))}
            {!stats?.recent_events?.length && <p className="text-sm text-slate-500 text-center py-6">No events yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { CHART_COLORS } from '../../utils/helpers';

const TT = { contentStyle: { background:'#1C2438', border:'1px solid #2A3650', borderRadius:8, fontSize:12 } };

export default function StaffAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents]       = useState([]);
  const [selected, setSelected]   = useState('');
  const [eventReport, setEventReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/analytics'),
      api.get('/events', { params: { limit: 50 } }),
    ]).then(([aRes, eRes]) => {
      setAnalytics(aRes.data.data);
      const evs = eRes.data.data.events || [];
      setEvents(evs);
      if (evs.length) setSelected(evs[0].id);
    }).catch(() => toast.error('Failed to load analytics.'))
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/reports/event/${selected}`).then(({ data }) => setEventReport(data.data)).catch(() => setEventReport(null));
  }, [selected]);

  const monthly = analytics?.monthly_trend || [];
  const byCategory = analytics?.events_by_category || [];
  const radarData = eventReport?.question_analytics?.filter(q => q.type === 'rating').map(q => ({
    subject: q.question.length > 20 ? q.question.substring(0,20)+'…' : q.question,
    score: parseFloat(q.avg) || 0,
  })) || [];

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div>
      <PageHeader title="Analytics & Reports" subtitle="Insights from your events and evaluations" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Events"   value={analytics?.summary?.total_events   ?? 0} icon="🗓"  color="blue"   />
        <StatCard label="Total Responses"value={analytics?.summary?.total_submissions ?? 0} icon="📋" color="green" />
        <StatCard label="Avg Rating"     value={analytics?.summary?.average_rating || 'N/A'} icon="⭐" color="amber" />
        <StatCard label="Total Users"    value={analytics?.summary?.total_users   ?? 0} icon="👥"  color="purple" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Monthly Submissions</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barSize={14}>
              <XAxis dataKey="month" tick={{fill:'#4D6080',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#4D6080',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip {...TT}/>
              <Bar dataKey="count" fill="#3D7FFF" radius={[4,4,0,0]} name="Submissions"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Average Rating Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <XAxis dataKey="month" tick={{fill:'#4D6080',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,5]} tick={{fill:'#4D6080',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip {...TT}/>
              <Line type="monotone" dataKey="avg_rating" stroke="#22C55E" strokeWidth={2.5} dot={{fill:'#22C55E',r:3}} name="Avg Rating"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Events by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={byCategory} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="count" paddingAngle={3}>
                {byCategory.map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie>
              <Tooltip {...TT}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">
            {byCategory.slice(0,5).map((d,i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:CHART_COLORS[i%CHART_COLORS.length]}}/>
                <span className="text-slate-400 flex-1 truncate">{d.category}</span>
                <span className="text-white font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Per-Question Analysis</h3>
            <select className="input w-64 text-xs" value={selected} onChange={e => setSelected(e.target.value)}>
              {events.map(e => <option key={e.id} value={e.id}>{e.title.substring(0,40)}</option>)}
            </select>
          </div>
          {eventReport?.question_analytics?.length ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {eventReport.question_analytics.map((q, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-xs text-slate-500 w-5 flex-shrink-0">{i+1}</span>
                  <span className="text-xs text-slate-300 flex-1 min-w-0 truncate">{q.question}</span>
                  {q.type === 'rating' && (
                    <>
                      <div className="w-24 bg-surface-3 rounded-full h-1.5 flex-shrink-0">
                        <div className="h-1.5 rounded-full bg-amber-400" style={{width:`${(parseFloat(q.avg)||0)/5*100}%`}}/>
                      </div>
                      <span className="text-amber-400 text-xs font-semibold flex-shrink-0 w-8 text-right">{q.avg}</span>
                    </>
                  )}
                  {(q.type === 'yes_no' || q.type === 'multiple_choice') && (
                    <span className="text-xs text-slate-500">{q.total_responses} resp</span>
                  )}
                  {q.type === 'text' && <span className="text-xs text-teal-400">{q.total_responses} written</span>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500 text-center py-8">No evaluation data for this event yet.</p>}
          {eventReport && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-slate-400">
              <span>Total responses: <b className="text-white">{eventReport.count}</b></span>
              <span>Avg rating: <b className="text-amber-400">★ {eventReport.avg_rating || 'N/A'}</b></span>
            </div>
          )}
        </div>
      </div>

      {radarData.length >= 3 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Rating Categories — Radar Chart</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2A3650"/>
              <PolarAngleAxis dataKey="subject" tick={{fill:'#8A9BBC',fontSize:11}}/>
              <Radar name="Score" dataKey="score" stroke="#3D7FFF" fill="#3D7FFF" fillOpacity={0.25}/>
              <Tooltip {...TT}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

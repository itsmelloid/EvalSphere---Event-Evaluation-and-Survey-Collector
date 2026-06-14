import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusBadge, truncate } from '../../utils/helpers';

const TT = { contentStyle: { background:'#1C2438', border:'1px solid #2A3650', borderRadius:8, fontSize:12 } };

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [events, setEvents] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/events', { params: { limit: 6 } }).then(({ data }) => setEvents(data.data.events || [])).catch(() => {});
    api.get('/reports/analytics').then(({ data }) => setAnalytics(data.data)).catch(() => {});
  }, []);

  const monthly = analytics?.monthly_trend || [];

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.first_name}! 👋`} subtitle="Here's an overview of your events and evaluations."
        actions={<button onClick={() => navigate('/events/new')} className="btn-primary">+ New Event</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="My Events"    value={events.length}  icon="🗓"  color="blue"   change="Total created" />
        <StatCard label="Published"    value={events.filter(e => e.status !== 'Upcoming').length} icon="📋" color="purple" change="Active evals" />
        <StatCard label="Completed"    value={events.filter(e => e.status === 'Completed').length} icon="✅" color="green" change="Finished events" />
        <StatCard label="Avg Rating"   value={analytics?.summary?.average_rating || 'N/A'} icon="⭐" color="amber" change="Overall score" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Monthly Submissions</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly} barSize={16}>
              <XAxis dataKey="month" tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Bar dataKey="count" fill="#3D7FFF" radius={[4,4,0,0]} name="Submissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Satisfaction Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthly}>
              <XAxis dataKey="month" tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,5]} tick={{ fill:'#4D6080', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Line type="monotone" dataKey="avg_rating" stroke="#A855F7" strokeWidth={2.5} dot={{ fill:'#A855F7', r:3 }} name="Avg Rating" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">My Recent Events</h3>
          <button onClick={() => navigate('/events')} className="text-xs text-primary-light hover:underline">View all →</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {events.map(e => (
            <div key={e.id} className="card-sm flex items-start gap-3 cursor-pointer hover:border-border-2 transition-colors" onClick={() => navigate('/events')}>
              <div className="text-2xl">{e.category === 'Technology' ? '💻' : e.category === 'Education' ? '🎓' : e.category === 'Health' ? '🏥' : '🎯'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{truncate(e.title, 30)}</p>
                <p className="text-xs text-slate-500">{formatDate(e.event_date)}</p>
                <span className={`${getStatusBadge(e.status)} mt-1 inline-block`}>{e.status}</span>
              </div>
            </div>
          ))}
          {!events.length && <p className="text-sm text-slate-500 col-span-2 text-center py-6">No events yet. <button onClick={() => navigate('/events/new')} className="text-primary-light hover:underline">Create one →</button></p>}
        </div>
      </div>
    </div>
  );
}

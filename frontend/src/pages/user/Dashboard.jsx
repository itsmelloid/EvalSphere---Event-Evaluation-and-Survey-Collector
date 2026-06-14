import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getStatusBadge, truncate } from '../../utils/helpers';
import { HiOutlineQrcode, HiOutlineSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [events, setEvents]   = useState([]);
  const [subs, setSubs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events', { params: { limit: 20 } }),
      api.get('/auth/profile'),
    ]).then(([eRes]) => {
      setEvents(eRes.data.data.events || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pendingCount = events.filter(e => e.status !== 'Upcoming').length;
  const EMOJI = { Technology:'💻', Education:'🎓', Training:'🎯', Health:'🏥', Finance:'💰', Marketing:'📱', Other:'📋' };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-dim/30 to-purple-900/20 border border-primary/20 rounded-xl p-6 mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl mb-1">Welcome back, {user?.first_name}! 👋</h2>
          <p className="text-sm text-slate-400">Discover events and share your feedback to help improve future experiences.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => navigate('/evaluate/join')} className="btn-primary py-2 px-4 text-xs flex items-center gap-2">
              <HiOutlineQrcode className="w-4 h-4" /> Join Evaluation
            </button>
            <button onClick={() => navigate('/events')} className="btn-ghost py-2 px-4 text-xs flex items-center gap-2 bg-surface-2/50">
              <HiOutlineSearch className="w-4 h-4" /> Browse Events
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-400">{pendingCount}</div>
          <div className="text-xs text-slate-400">Events available</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Events Joined"     value={events.filter(e=>e.status!=='Upcoming').length} icon="🗓"  color="blue"   />
        <StatCard label="Evaluations Done"  value="—" icon="📋" color="green" sub="Check submissions tab" />
        <StatCard label="Upcoming Events"   value={events.filter(e=>e.status==='Upcoming').length} icon="🔔" color="amber" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Available Events</h3>
          <button onClick={() => navigate('/events')} className="text-xs text-primary-light hover:underline">Browse all →</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="space-y-2">
            {events.slice(0,6).map(e => (
              <div key={e.id} className="flex items-center gap-4 p-3 bg-surface-2 rounded-lg hover:bg-surface-3 transition-colors">
                <span className="text-2xl">{EMOJI[e.category]||'📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{truncate(e.title, 44)}</p>
                  <p className="text-xs text-slate-500">{e.venue} · {formatDate(e.event_date)}</p>
                </div>
                <span className={getStatusBadge(e.status)}>{e.status}</span>
                {e.status !== 'Upcoming' && (
                  <button 
                    onClick={() => {
                      if (e.evaluation?.id && e.evaluation?.is_published) navigate(`/evaluate/${e.evaluation.id}`);
                      else navigate('/submissions');
                    }} 
                    className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">
                    Evaluate
                  </button>
                )}
              </div>
            ))}
            {!events.length && <p className="text-sm text-slate-500 text-center py-6">No events available yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

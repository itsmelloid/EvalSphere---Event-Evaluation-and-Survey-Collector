import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import { formatDateTime, truncate } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function Submissions() {
  const [events, setEvents]   = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/events', { params: { limit: 50 } }).then(async ({ data }) => {
      const evs = data.data.events || [];
      setEvents(evs);
      const statusMap = {};
      await Promise.all(evs.filter(e => e.status !== 'Upcoming').map(async e => {
        try {
          if (e.evaluation) {
            const { data: s } = await api.get(`/evaluations/${e.evaluation.id}/has-submitted`);
            statusMap[e.id] = s.data;
          }
        } catch {}
      }));
      setStatuses(statusMap);
    }).catch(() => toast.error('Failed to load events.')).finally(() => setLoading(false));
  }, []);

  const available  = events.filter(e => e.status !== 'Upcoming' && e.evaluation);
  const submitted  = available.filter(e => statuses[e.id]?.has_submitted);
  const pending    = available.filter(e => !statuses[e.id]?.has_submitted);

  return (
    <div>
      <PageHeader title="My Evaluations" subtitle={`${submitted.length} submitted · ${pending.length} pending`} />

      {pending.length > 0 && (
        <div className="card mb-4 border-amber-700/30 bg-amber-900/10">
          <h3 className="text-sm font-semibold text-amber-400 mb-3">⏳ Pending Evaluations ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map(e => (
              <div key={e.id} className="flex items-center gap-4 p-3 bg-surface-2 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{truncate(e.title, 45)}</p>
                  <p className="text-xs text-slate-500">{e.venue}</p>
                </div>
                <span className="badge-amber flex-shrink-0">{e.status}</span>
                <button onClick={() => navigate(`/evaluate/${e.evaluation.id}`)} className="btn-primary text-xs py-1.5 px-4 flex-shrink-0">
                  Submit Now →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-semibold mb-3">Submission History</h3>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
        ) : submitted.length > 0 ? (
          <div className="space-y-2">
            {submitted.map(e => (
              <div key={e.id} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
                <span className="text-2xl">✅</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{truncate(e.title, 45)}</p>
                  <p className="text-xs text-slate-500">{e.category} · {e.venue}</p>
                </div>
                <span className="badge-green flex-shrink-0">Submitted</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-slate-500">No submissions yet. Attend events and submit evaluations!</p>
          </div>
        )}
      </div>
    </div>
  );
}

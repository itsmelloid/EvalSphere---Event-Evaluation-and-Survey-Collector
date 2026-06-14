import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDate, getApprovalBadge, getStatusBadge, truncate } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineChartBar, HiOutlineQrcode } from 'react-icons/hi';

export default function StaffEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events', { params: { limit: 50 } });
      setEvents(data.data.events || []);
    } catch {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      await api.delete(`/events/${event.id}`);
      toast.success('Deleted.');
      fetchEvents();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const filters = ['All', 'Pending', 'Approved', 'Rejected', 'Upcoming', 'Ongoing', 'Completed'];
  const filtered = filter === 'All'
    ? events
    : events.filter(e => e.status === filter || e.approval_status === filter);
  const CATEGORY_LABEL = {
    Technology: 'Tech',
    Education: 'Edu',
    Training: 'Train',
    Health: 'Health',
    Finance: 'Fin',
    Marketing: 'Mkt',
    HR: 'HR',
    Operations: 'Ops',
    Other: 'Event',
  };
  const GRAD = {
    Technology: 'from-blue-900 to-blue-700',
    Education: 'from-teal-900 to-teal-700',
    Training: 'from-purple-900 to-purple-700',
    Health: 'from-green-900 to-green-700',
    Finance: 'from-indigo-900 to-blue-800',
    Marketing: 'from-amber-900 to-amber-700',
    HR: 'from-pink-900 to-pink-800',
    Other: 'from-slate-800 to-slate-700',
  };

  return (
    <div>
      <PageHeader
        title="My Events"
        subtitle={`${events.length} total events`}
        actions={<button onClick={() => navigate('/events/new')} className="btn-primary flex items-center gap-1.5"><HiOutlinePlus className="w-4 h-4" />New Event</button>}
      />
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${filter === s ? 'bg-primary border-primary text-white' : 'bg-surface-2 border-border text-slate-400 hover:text-white'}`}>{s}</button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} events</span>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(e => (
            <div key={e.id} className="card overflow-hidden p-0 hover:border-border-2 transition-all hover:-translate-y-0.5">
              <div className={`h-24 bg-gradient-to-br ${GRAD[e.category] || GRAD.Other} flex items-center justify-center text-lg font-semibold relative`}>
                {CATEGORY_LABEL[e.category] || 'Event'}
                <span className={`absolute top-3 right-3 ${getStatusBadge(e.status)}`}>{e.status}</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-white mb-1">{truncate(e.title, 38)}</h3>
                <p className="text-xs text-slate-500 mb-3">{truncate(e.venue, 30)} · {formatDate(e.event_date)}</p>
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <span className="badge-blue">{e.category}</span>
                  <span className={getApprovalBadge(e.approval_status)}>{e.approval_status || 'Pending'}</span>
                  <span className={e.is_public ? 'badge-green' : 'badge-amber'}>{e.is_public ? 'Published' : 'Hidden'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => navigate(`/events/${e.id}/edit`)} className="btn-ghost flex-1 text-xs py-1.5 flex items-center justify-center gap-1"><HiOutlinePencil className="w-3 h-3" />Edit</button>
                  <button onClick={() => navigate(`/evaluations/builder?eventId=${e.id}`)} className="btn-ghost flex-1 text-xs py-1.5 flex items-center justify-center gap-1"><HiOutlineChartBar className="w-3 h-3" />Eval</button>
                  <button onClick={() => navigate('/qr-codes')} className="btn-ghost text-xs py-1.5 px-2.5"><HiOutlineQrcode className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(e)} className="btn-danger text-xs py-1.5 px-2.5"><HiOutlineTrash className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div className="col-span-3 text-center py-16 text-slate-500">
              <p className="text-sm">No {filter !== 'All' ? filter.toLowerCase() : ''} events found.</p>
              <button onClick={() => navigate('/events/new')} className="btn-primary mt-3 text-xs">Create your first event</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

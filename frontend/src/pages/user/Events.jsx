import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDate, getStatusBadge, truncate, EVENT_CATEGORIES } from '../../utils/helpers';
import { HiOutlineSearch } from 'react-icons/hi';

export default function UserEvents() {
  const [events, setEvents] = useState([]);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCat]  = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events', { params: { page, limit: 9, search: search || undefined, category: category || undefined, status: status || undefined } });
      setEvents(data.data.events || []); setTotal(data.data.total); setPages(data.data.pages);
    } catch { toast.error('Failed to load events.'); }
    finally { setLoading(false); }
  }, [page, search, category, status]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleRegister = async (eventId) => {
    try { await api.post(`/events/${eventId}/register`); toast.success('Registered for event!'); fetchEvents(); }
    catch (err) { toast.error(err.response?.data?.message || 'Registration failed.'); }
  };

  const EMOJI = { Technology:'💻', Education:'🎓', Training:'🎯', Health:'🏥', Finance:'💰', Marketing:'📱', HR:'👥', Operations:'⚙️', Other:'📋' };
  const GRAD  = { Technology:'from-blue-900/70 to-blue-800/50', Education:'from-teal-900/70 to-teal-800/50', Training:'from-purple-900/70 to-purple-800/50', Health:'from-green-900/70 to-green-800/50', Finance:'from-indigo-900/70 to-blue-900/50', Marketing:'from-amber-900/70 to-amber-800/50', Other:'from-slate-800/70 to-slate-700/50' };

  return (
    <div>
      <PageHeader title="Browse Events" subtitle={`${total} events available`} />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative"><HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"/><input className="input pl-8 w-48" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}/></div>
        <select className="input w-36" value={category} onChange={e => setCat(e.target.value)}>
          <option value="">All Categories</option>
          {EVENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input w-32" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Upcoming','Ongoing','Completed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {events.map(e => (
            <div key={e.id} className="card overflow-hidden p-0 hover:border-border-2 transition-all hover:-translate-y-0.5">
              <div className={`h-20 bg-gradient-to-br ${GRAD[e.category]||GRAD.Other} flex items-center justify-center text-4xl relative`}>
                {EMOJI[e.category]||'📋'}
                <span className={`absolute top-2 right-2 ${getStatusBadge(e.status)}`}>{e.status}</span>
              </div>
              <div className="p-4">
                <span className="badge-blue mb-2 inline-block">{e.category}</span>
                <h3 className="text-sm font-semibold text-white mb-1.5">{truncate(e.title, 44)}</h3>
                <p className="text-xs text-slate-500 mb-1">📍 {truncate(e.venue, 32)}</p>
                <p className="text-xs text-slate-500 mb-3">📅 {formatDate(e.event_date)} {e.organizer && `· ${e.organizer}`}</p>
                <div className="flex gap-2">
                  {e.status === 'Upcoming' && (
                    <button onClick={() => handleRegister(e.id)} className="btn-primary flex-1 text-xs py-1.5">Register</button>
                  )}
                  {e.status !== 'Upcoming' && (
                    <button onClick={() => navigate('/submissions')} className="btn-primary flex-1 text-xs py-1.5">Submit Evaluation</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!events.length && (
            <div className="col-span-3 text-center py-16 text-slate-500">
              <p className="text-4xl mb-3">🗓</p>
              <p className="text-sm">No events found matching your search.</p>
            </div>
          )}
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}

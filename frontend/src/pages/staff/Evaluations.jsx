import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { truncate, formatDate } from '../../utils/helpers';
import { HiOutlinePlus } from 'react-icons/hi';

export default function StaffEvaluations() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events', { params: { limit: 50 } });
      const eventsData = data.data.events || [];
      const enriched = await Promise.all(eventsData.map(async ev => {
        try {
          const { data: evalData } = await api.get(`/evaluations/event/${ev.id}`);
          return { ...ev, evaluation: evalData.data };
        } catch { return { ...ev, evaluation: null }; }
      }));
      setEvents(enriched);
    } catch { toast.error('Failed to load evaluations.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTogglePublish = async (eval_) => {
    try {
      await api.patch(`/evaluations/${eval_.id}/publish`);
      toast.success(eval_.is_published ? 'Evaluation unpublished.' : 'Evaluation published!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed.'); }
  };

  const columns = [
    { key:'event', label:'Event', render: e => <div><p className="font-medium text-white">{truncate(e.title, 36)}</p><p className="text-xs text-slate-500">{formatDate(e.event_date)}</p></div> },
    { key:'category', label:'Category', render: e => <span className="badge-blue">{e.category}</span> },
    { key:'eval_status', label:'Evaluation', render: e => e.evaluation
        ? <span className={e.evaluation.is_published ? 'badge-green' : 'badge-amber'}>{e.evaluation.is_published ? 'Published' : 'Draft'}</span>
        : <span className="badge-red">Not Created</span> },
    { key:'responses', label:'Responses', render: e => e.evaluation ? (e.evaluation.submissions?.length || '—') : '—' },
    { key:'actions', label:'Actions', render: e => (
      <div className="flex items-center gap-2">
        {e.evaluation ? (
          <>
            <button onClick={() => navigate(`/evaluations/${e.evaluation.id}/builder`)} className="btn-ghost text-xs py-1 px-2">Edit Form</button>
            <button onClick={() => handleTogglePublish(e.evaluation)} className={e.evaluation.is_published ? 'btn-danger text-xs py-1 px-2' : 'btn-primary text-xs py-1 px-2'}>{e.evaluation.is_published ? 'Unpublish' : 'Publish'}</button>
            <button onClick={() => navigate('/reports')} className="btn-ghost text-xs py-1 px-2">Reports</button>
          </>
        ) : (
          <button onClick={() => navigate(`/evaluations/builder?eventId=${e.id}`)} className="btn-primary text-xs py-1 px-2 flex items-center gap-1">
            <HiOutlinePlus className="w-3 h-3" /> Create
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Evaluations" subtitle="Manage evaluation forms for your events"
        actions={<button onClick={() => navigate('/evaluations/builder')} className="btn-primary flex items-center gap-1.5"><HiOutlinePlus className="w-4 h-4" />New Form</button>}
      />
      <div className="card">
        <DataTable columns={columns} data={events} loading={loading} emptyMsg="No events found. Create an event first." />
      </div>
    </div>
  );
}

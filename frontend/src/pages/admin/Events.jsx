import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDate, getApprovalBadge, getStatusBadge, truncate } from '../../utils/helpers';
import { HiOutlinePlus } from 'react-icons/hi';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events', {
        params: { page, limit: 15, ...(statusFilter && { status: statusFilter }) },
      });
      setEvents(data.data.events || []);
      setTotal(data.data.total || 0);
      setPages(data.data.pages || 1);
    } catch {
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      await api.delete(`/events/${event.id}`);
      toast.success('Event deleted.');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleReview = async (event, action) => {
    try {
      await api.patch(`/events/${event.id}/approval`, { action });
      const label = action === 'unpublish' ? 'unpublished' : action === 'publish' ? 'published' : `${action}d`;
      toast.success(`Event ${label}.`);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const columns = [
    { key: 'title', label: 'Event', render: e => <div><p className="font-medium text-white">{truncate(e.title, 36)}</p><p className="text-xs text-slate-500">{e.venue}</p></div> },
    { key: 'category', label: 'Category', render: e => <span className="badge-blue">{e.category}</span> },
    { key: 'event_date', label: 'Date', render: e => formatDate(e.event_date) },
    { key: 'status', label: 'Status', render: e => <span className={getStatusBadge(e.status)}>{e.status}</span> },
    { key: 'approval_status', label: 'Approval', render: e => <span className={getApprovalBadge(e.approval_status)}>{e.approval_status || 'Pending'}</span> },
    { key: 'visibility', label: 'Visible', render: e => <span className={e.is_public ? 'badge-green' : 'badge-amber'}>{e.is_public ? 'Published' : 'Hidden'}</span> },
    { key: 'creator', label: 'Created By', render: e => e.creator ? `${e.creator.first_name} ${e.creator.last_name}` : '-' },
    { key: 'actions', label: 'Actions', render: e => (
      <div className="flex items-center gap-2 flex-wrap">
        {e.approval_status !== 'Approved' && (
          <button onClick={() => handleReview(e, 'approve')} className="btn-ghost text-xs py-1 px-2">Approve</button>
        )}
        {e.approval_status !== 'Rejected' && (
          <button onClick={() => handleReview(e, 'reject')} className="btn-danger text-xs py-1 px-2">Reject</button>
        )}
        {e.approval_status === 'Approved' && !e.is_public && (
          <button onClick={() => handleReview(e, 'publish')} className="btn-primary text-xs py-1 px-2">Publish</button>
        )}
        {e.is_public && (
          <button onClick={() => handleReview(e, 'unpublish')} className="btn-ghost text-xs py-1 px-2">Unpublish</button>
        )}
        <button onClick={() => navigate(`/events/${e.id}/edit`)} className="btn-ghost text-xs py-1 px-2">Edit</button>
        <button onClick={() => handleDelete(e)} className="btn-danger text-xs py-1 px-2">Delete</button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader
        title="All Events"
        subtitle={`${total} total events`}
        actions={<>
          <select className="input w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => navigate('/events/new')} className="btn-primary flex items-center gap-1.5">
            <HiOutlinePlus className="w-4 h-4" /> New Event
          </button>
        </>}
      />
      <div className="card">
        <DataTable columns={columns} data={events} loading={loading} emptyMsg="No events found." />
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { EVENT_CATEGORIES } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const EMPTY = { title:'', description:'', venue:'', event_date:'', start_time:'', end_time:'', organizer:'', category:'Technology', max_participants:'', is_public:true, status:'Upcoming' };

export default function CreateEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit   = !!id;
  const isAdmin = user?.role === 'admin';
  const [form, setForm]     = useState(EMPTY);
  const [image, setImage]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/events/${id}`).then(({ data }) => {
        const e = data.data;
        setForm({ title: e.title, description: e.description||'', venue: e.venue, event_date: e.event_date, start_time: e.start_time||'', end_time: e.end_time||'', organizer: e.organizer||'', category: e.category, max_participants: e.max_participants||'', is_public: e.is_public, status: e.status });
        if (e.image) setPreview(e.image);
      }).catch(() => toast.error('Failed to load event.'));
    }
  }, [id, isEdit]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.venue || !form.event_date) { toast.error('Fill in required fields.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append('image', image);
      if (isEdit) {
        await api.put(`/events/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event updated!');
      } else {
        await api.post('/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Event created successfully!');
      }
      navigate('/events');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save event.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={isEdit ? 'Edit Event' : 'Create New Event'} subtitle={isEdit ? 'Update event information' : 'Fill in the details to create a new event'} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Event Information</h3>
          <div className="space-y-3">
            <div><label className="label">Event Title *</label><input className="input" value={form.title} onChange={set('title')} placeholder="e.g. Tech Innovation Summit 2025" required /></div>
            <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={set('description')} placeholder="Describe the event..." /></div>
            <div><label className="label">Venue *</label><input className="input" value={form.venue} onChange={set('venue')} placeholder="e.g. Manila Hotel Grand Ballroom" required /></div>
            <div><label className="label">Organizer</label><input className="input" value={form.organizer} onChange={set('organizer')} placeholder="Department or organization" /></div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Schedule & Details</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Event Date *</label><input className="input" type="date" value={form.event_date} onChange={set('event_date')} required /></div>
            <div><label className="label">Start Time</label><input className="input" type="time" value={form.start_time} onChange={set('start_time')} /></div>
            <div><label className="label">End Time</label><input className="input" type="time" value={form.end_time} onChange={set('end_time')} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div><label className="label">Category *</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {EVENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {['Upcoming','Ongoing','Completed','Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Max Participants</label><input className="input" type="number" min="1" value={form.max_participants} onChange={set('max_participants')} placeholder="Unlimited" /></div>
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-2 mt-3">
              <input type="checkbox" id="is_public" checked={form.is_public} onChange={set('is_public')} className="w-4 h-4 accent-primary" />
              <label htmlFor="is_public" className="text-sm text-slate-300 cursor-pointer">Public event (visible to all users)</label>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-3">New staff events are sent to admin review before they become visible to users.</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Event Banner</h3>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById('img-upload').click()}>
            {preview ? (
              <img src={preview.startsWith('http') || preview.startsWith('blob') || preview.startsWith('/') ? preview : `/uploads/${preview}`} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
            ) : (
              <div className="text-slate-500"><p className="text-3xl mb-2">🖼</p><p className="text-sm">Click to upload event banner</p><p className="text-xs mt-1">PNG, JPG up to 5MB</p></div>
            )}
          </div>
          <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate('/events')} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60 px-6">
            {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

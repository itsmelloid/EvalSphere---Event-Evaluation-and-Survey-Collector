import { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { truncate, formatDate, getApprovalBadge, getStatusBadge } from '../../utils/helpers';

export default function QRCodes() {
  const [events, setEvents] = useState([]);
  const [qrData, setQrData] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState('');

  useEffect(() => {
    api.get('/events', { params: { limit: 50 } })
      .then(({ data }) => setEvents(data.data.events || []))
      .catch(() => toast.error('Failed to load events.'))
      .finally(() => setLoading(false));
  }, []);

  const generateQR = async (eventId, type = 'event') => {
    const key = `${type}-${eventId}`;
    setGenerating(key);
    try {
      if (type === 'event') {
        const res = await api.get(`/events/${eventId}/qr`);
        setQrData(prev => ({ ...prev, [key]: { qr: res.data.data.qr_code, url: res.data.data.event_url } }));
      } else {
        const evalRes = await api.get(`/evaluations/event/${eventId}`);
        if (!evalRes.data.data) {
          toast.error('No evaluation for this event.');
          return;
        }
        const res = await api.get(`/evaluations/${evalRes.data.data.id}/qr`);
        setQrData(prev => ({ ...prev, [key]: { qr: res.data.data.qr_code, url: `${window.location.origin}/evaluate/${evalRes.data.data.id}` } }));
      }
      toast.success('QR code ready.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'QR generation failed.');
    } finally {
      setGenerating('');
    }
  };

  const downloadQR = (key, name) => {
    const data = qrData[key];
    if (!data?.qr) return;
    const a = document.createElement('a');
    a.href = data.qr;
    a.download = `qr-${name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader title="QR Codes" subtitle="Event QR codes are available immediately after creation" />
      <div className="grid grid-cols-2 gap-4">
        {events.map(event => (
          <div key={event.id} className="card">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">{truncate(event.title, 40)}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{event.venue} · {formatDate(event.event_date)}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className={getStatusBadge(event.status)}>{event.status}</span>
                  <span className={getApprovalBadge(event.approval_status)}>{event.approval_status || 'Pending'}</span>
                  <span className={event.is_public ? 'badge-green' : 'badge-amber'}>{event.is_public ? 'Published' : 'Hidden'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['event', 'eval'].map(type => {
                const key = `${type}-${event.id}`;
                const data = qrData[key];
                const isGen = generating === key;
                return (
                  <div key={type} className="bg-surface-2 border border-border rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-slate-400 mb-3">{type === 'event' ? 'Event QR' : 'Evaluation QR'}</p>
                    {data?.qr ? (
                      <div>
                        <img src={data.qr} alt="QR Code" className="w-28 h-28 mx-auto rounded-lg bg-white p-1 mb-2" />
                        {data.url && <p className="text-[10px] text-primary-light mb-2 truncate">{data.url}</p>}
                        <div className="flex gap-1.5">
                          <button onClick={() => downloadQR(key, event.title)} className="btn-ghost flex-1 text-[11px] py-1">Download</button>
                          <button onClick={() => { navigator.clipboard.writeText(data.url || ''); toast.success('URL copied.'); }} className="btn-ghost flex-1 text-[11px] py-1">Copy Link</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="w-28 h-28 mx-auto bg-surface-3 rounded-lg flex items-center justify-center mb-2 border-2 border-dashed border-border">
                          <span className="text-slate-600 text-xs font-semibold">QR</span>
                        </div>
                        <button onClick={() => generateQR(event.id, type)} disabled={!!generating} className="btn-primary w-full text-[11px] py-1.5 disabled:opacity-60">
                          {isGen ? 'Loading...' : 'Show QR'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {!events.length && (
          <div className="col-span-2 text-center py-16 text-slate-500">
            <p className="text-sm">No events found. Create an event to generate QR codes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const REPORTS = [
  { title:'Full Platform Report',    desc:'All events, evaluations, and response analytics',   icon:'📊', color:'bg-primary-dim/40 border-primary/30' },
  { title:'Participation Summary',   desc:'Event attendance and evaluation response rates',     icon:'👥', color:'bg-green-900/30 border-green-700/30' },
  { title:'Satisfaction Analysis',   desc:'Average ratings and satisfaction scores per event',  icon:'⭐', color:'bg-amber-900/30 border-amber-700/30' },
];

export default function AdminReports() {
  const [generating, setGenerating] = useState(null);

  const generate = async (title, format) => {
    setGenerating(`${title}-${format}`);
    try {
      const res = await api.get('/reports/export', {
        params: { format: format === 'excel' ? 'excel' : 'pdf', title },
        responseType: 'blob'
      });

      const contentType = res.headers['content-type'] || res.headers['Content-Type'] || '';
      // If server returned JSON error as blob
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Export failed');
      }

      // Create proper blob using received content-type
      const blob = new Blob([res.data], { type: contentType || (format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf') });

      // Prefer filename from server Content-Disposition when available
      const disposition = res.headers['content-disposition'] || res.headers['Content-Disposition'] || '';
      let filename = '';
      const match = disposition.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/i);
      if (match) {
        filename = decodeURIComponent((match[1] || match[2] || '').trim());
      }
      if (!filename) {
        const timestamp = new Date().toISOString().split('T')[0];
        const ext = format === 'excel' ? 'xlsx' : 'pdf';
        const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        filename = `evalsphere-${safeTitle}-${timestamp}.${ext}`;
      }
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(link.href);
      }, 100);
      toast.success(`Report generated: ${filename}`);
    } catch (err) {
      // When responseType is 'blob', the error data is also a blob
      if (err.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const res = JSON.parse(reader.result);
          toast.error(res.message || 'Export failed.');
        };
        reader.readAsText(err.response.data);
      } else {
        toast.error(err.response?.data?.message || err.message || 'Export failed.');
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div>
      <PageHeader title="Reports & Exports" subtitle="Generate and download platform reports" />
      
      {generating && (
        <div className="fixed inset-0 bg-bgBase/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="card p-8 flex flex-col items-center shadow-2xl border-primary/20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-medium">Preparing Professional Report...</p>
            <p className="text-xs text-slate-500 mt-1">This may take a few moments.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {REPORTS.map(r => (
          <div key={r.title} className={`border rounded-xl p-5 ${r.color}`}>
            <div className="text-3xl mb-3">{r.icon}</div>
            <h3 className="text-sm font-semibold text-white mb-1">{r.title}</h3>
            <p className="text-xs text-slate-400 mb-4">{r.desc}</p>
            <div className="flex gap-2">
              <button
                onClick={() => generate(r.title, 'pdf')}
                disabled={!!generating}
                className="btn-ghost text-xs py-1.5 px-3 flex-1 disabled:opacity-60">
                {generating === `${r.title}-pdf` ? '⏳ Generating...' : '📄 PDF'}
              </button>
              <button
                onClick={() => generate(r.title, 'excel')}
                disabled={!!generating}
                className="btn-ghost text-xs py-1.5 px-3 flex-1 disabled:opacity-60">
                {generating === `${r.title}-excel` ? '⏳ Generating...' : '📈 Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

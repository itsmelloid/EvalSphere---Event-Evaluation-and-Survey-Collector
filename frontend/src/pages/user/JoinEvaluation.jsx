import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import { HiOutlineQrcode, HiOutlineArrowRight } from 'react-icons/hi';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function JoinEvaluation() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  const processIdentifier = useCallback(async (val) => {
    const identifier = val?.trim();
    if (!identifier) return;
    
    setLoading(true);
    try {
      // 1. Extract UUID or last segment (handle full URLs, plain IDs, and trailing slashes)
      const uuidRegex = /([a-f0-9-]{36})/i;
      const match = identifier.match(uuidRegex);
      const id = match ? match[1] : identifier.replace(/\/$/, "").split('/').pop().split('?')[0];
      
      try {
        // Try resolving as Evaluation ID first
        const evalRes = await api.get(`/evaluations/${id}`);
        navigate(`/evaluate/${evalRes.data.data.id}`);
      } catch (err) {
        // Fallback: Try resolving as Event ID
        const eventRes = await api.get(`/evaluations/event/${id}`);
        navigate(`/evaluate/${eventRes.data.data.id}`);
      }
    } catch (err) {
      toast.error('Could not find an active evaluation for this code or link.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!input.trim()) return toast.error('Please enter an ID or URL');
    await processIdentifier(input);
  };

  useEffect(() => {
    let scanner = null;
    if (scanning) {
      scanner = new Html5QrcodeScanner('reader', { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      });

      scanner.render((decodedText) => {
        scanner.clear();
        setScanning(false);
        setInput(decodedText);
        processIdentifier(decodedText);
      }, () => { /* Silently handle scan errors */ });
    }
    return () => { if (scanner) scanner.clear().catch(() => {}); };
  }, [scanning, processIdentifier]);

  return (
    <div className="max-w-md mx-auto">
      <PageHeader 
        title="Start Evaluation" 
        subtitle="Access an evaluation by entering a code, pasting a URL, or scanning a QR code" 
      />
      
      <div className="space-y-4">
        <div className="card">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="label text-xs font-semibold uppercase tracking-wider text-slate-500">
                Event / Evaluation ID or Link
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Paste link or enter ID..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn-primary flex items-center justify-center w-12 h-10 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HiOutlineArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-500 italic">
                Example: a62aa598... or the full event URL
              </p>
            </div>
          </form>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-500 font-medium">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        {scanning ? (
          <div className="card p-0 overflow-hidden relative border-primary">
            <div id="reader" className="w-full"></div>
            <button 
              onClick={() => setScanning(false)}
              className="absolute top-2 right-2 z-10 btn-ghost bg-bgBase/80 py-1 px-3 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setScanning(true)}
            className="card w-full flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-border hover:border-primary hover:bg-primary-dim/10 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center group-hover:bg-primary-dim transition-colors">
              <HiOutlineQrcode className="w-8 h-8 text-slate-400 group-hover:text-primary-light" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-semibold text-white">Scan QR Code</h4>
              <p className="text-xs text-slate-500 mt-1">Open your camera to scan an event QR</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
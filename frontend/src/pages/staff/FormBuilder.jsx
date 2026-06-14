import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { QUESTION_TYPES } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowUp, HiOutlineArrowDown } from 'react-icons/hi';

const DEFAULT_QUESTIONS = [
  { question_text:'How satisfied are you with the overall event?', question_type:'rating', is_required:true },
  { question_text:'Was the event well organized and managed?', question_type:'yes_no', is_required:true },
  { question_text:'How would you rate the quality of the speakers?', question_type:'rating', is_required:true },
  { question_text:'Was the venue comfortable and accessible?', question_type:'multiple_choice', options:['Excellent','Good','Average','Below Average'], is_required:true },
  { question_text:'Was the event schedule followed properly?', question_type:'yes_no', is_required:true },
  { question_text:'How informative and relevant was the content?', question_type:'rating', is_required:true },
  { question_text:'How would you rate the event materials?', question_type:'rating', is_required:true },
  { question_text:'Was the registration process smooth?', question_type:'yes_no', is_required:true },
  { question_text:'Would you attend similar events in the future?', question_type:'multiple_choice', options:['Definitely Yes','Probably Yes','Unsure','No'], is_required:true },
  { question_text:'What improvements would you suggest for future events?', question_type:'text', is_required:false },
];

export default function FormBuilder() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const eventIdFromQuery = searchParams.get('eventId');
  const navigate = useNavigate();

  const [events, setEvents]       = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(eventIdFromQuery || '');
  const [title, setTitle]         = useState('');
  const [description, setDesc]    = useState('');
  const [isAnonymous, setAnon]    = useState(false);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [saving, setSaving]       = useState(false);
  const [existingId, setExistingId] = useState(id || null);

  useEffect(() => {
    api.get('/events', { params: { limit: 100 } }).then(({ data }) => {
      setEvents(data.data.events || []);
    });
  }, []);

  useEffect(() => {
    if (existingId) {
      api.get(`/evaluations/${existingId}`).then(({ data }) => {
        const ev = data.data;
        setTitle(ev.title);
        setDesc(ev.description || '');
        setAnon(ev.is_anonymous);
        setSelectedEvent(ev.event_id);

        // Normalize questions to ensure options are always arrays
        const formattedQuestions = (ev.questions || []).map(q => {
          let parsedOptions = q.options;
          if (typeof q.options === 'string') {
            try { parsedOptions = JSON.parse(q.options); } catch { parsedOptions = []; }
          }
          return { ...q, options: Array.isArray(parsedOptions) ? parsedOptions : [] };
        });
        setQuestions(formattedQuestions.length > 0 ? formattedQuestions : DEFAULT_QUESTIONS);
      }).catch(() => toast.error('Failed to load form.'));
    }
  }, [existingId]);

  useEffect(() => {
    if (selectedEvent && !title) {
      const ev = events.find(e => e.id === selectedEvent);
      if (ev) setTitle(`Evaluation: ${ev.title}`);
    }
  }, [selectedEvent, events]);

  const addQuestion = (type) => {
    setQuestions(q => [...q, { question_text: '', question_type: type, is_required: true, options: type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown' ? ['Option 1','Option 2'] : null }]);
  };

  const removeQuestion = (i) => {
    if (questions.length <= 10) { toast.error('Minimum 10 questions required.'); return; }
    setQuestions(q => q.filter((_, j) => j !== i));
  };

  const updateQuestion = (i, key, val) => setQuestions(q => q.map((item, j) => j === i ? { ...item, [key]: val } : item));

  const moveQuestion = (i, dir) => {
    const arr = [...questions];
    const to = i + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[i], arr[to]] = [arr[to], arr[i]];
    setQuestions(arr);
  };

  const handleSave = async (publish = false) => {
    if (!selectedEvent) { toast.error('Select an event.'); return; }
    if (!title.trim())  { toast.error('Enter a form title.'); return; }
    if (questions.length < 10) { toast.error('Minimum 10 questions required.'); return; }
    if (questions.some(q => !q.question_text.trim())) { toast.error('All questions must have text.'); return; }
    setSaving(true);
    try {
      const payload = { event_id: selectedEvent, title, description, is_anonymous: isAnonymous, questions, ...(publish && { is_published: true }) };
      if (existingId) {
        await api.put(`/evaluations/${existingId}`, payload);
        if (publish) await api.patch(`/evaluations/${existingId}/publish`);
        toast.success('Form updated!');
      } else {
        const { data } = await api.post('/evaluations', payload);
        setExistingId(data.data.id);
        if (publish) { await api.patch(`/evaluations/${data.data.id}/publish`); toast.success('Form created and published!'); }
        else toast.success('Form saved as draft!');
      }
      navigate('/evaluations');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save form.'); }
    finally { setSaving(false); }
  };

  const TYPE_BADGE = { rating:'badge-blue', yes_no:'badge-green', multiple_choice:'badge-amber', text:'badge-purple', checkbox:'badge-teal', dropdown:'badge-red' };

  return (
    <div>
      <PageHeader title={existingId ? 'Edit Evaluation Form' : 'Build Evaluation Form'} subtitle={`${questions.length} questions (minimum 10 required)`} />
      <div className="flex gap-4">
        {/* Main builder */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Settings */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Form Settings</h3>
            <div className="space-y-3">
              <div><label className="label">Linked Event *</label>
                <select className="input" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                  <option value="">Select an event...</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                </select>
              </div>
              <div><label className="label">Form Title *</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Tech Summit 2025 — Evaluation" /></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={2} value={description} onChange={e => setDesc(e.target.value)} placeholder="Instructions for respondents..." /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isAnonymous} onChange={e => setAnon(e.target.checked)} className="accent-primary" />
                <span className="text-sm text-slate-300">Anonymous submissions (do not record respondent name)</span>
              </label>
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, i) => (
            <div key={i} className="card-sm border border-border">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-dim text-primary-light text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`${TYPE_BADGE[q.question_type]||'badge-blue'} text-[10px]`}>{QUESTION_TYPES.find(t=>t.value===q.question_type)?.label || q.question_type}</span>
                    {q.is_required && <span className="text-[10px] text-red-400">Required</span>}
                  </div>
                  <input className="input text-sm mb-2" value={q.question_text} onChange={e => updateQuestion(i,'question_text',e.target.value)} placeholder="Enter question..." />
                  {(q.question_type === 'multiple_choice' || q.question_type === 'checkbox' || q.question_type === 'dropdown') && (
                    <div className="space-y-1.5 mt-1">
                      {(Array.isArray(q.options) ? q.options : []).map((opt, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input className="input text-xs flex-1" value={opt} onChange={e => { const opts=[...(Array.isArray(q.options) ? q.options : [])]; opts[j]=e.target.value; updateQuestion(i,'options',opts); }} placeholder={`Option ${j+1}`} />
                          <button onClick={() => { const opts=(Array.isArray(q.options) ? q.options : []).filter((_,k)=>k!==j); updateQuestion(i,'options',opts); }} className="text-slate-500 hover:text-red-400 transition-colors"><HiOutlineTrash className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                      <button onClick={() => { const opts=[...(Array.isArray(q.options) ? q.options : []),'New option']; updateQuestion(i,'options',opts); }} className="text-xs text-primary-light hover:underline">+ Add option</button>
                    </div>
                  )}
                  {q.question_type === 'rating' && <p className="text-xs text-slate-500 mt-1">Scale: 1 (Poor) → 5 (Excellent)</p>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => moveQuestion(i,-1)} disabled={i===0} className="text-slate-500 hover:text-white disabled:opacity-30 p-0.5"><HiOutlineArrowUp className="w-3.5 h-3.5"/></button>
                  <button onClick={() => moveQuestion(i,1)} disabled={i===questions.length-1} className="text-slate-500 hover:text-white disabled:opacity-30 p-0.5"><HiOutlineArrowDown className="w-3.5 h-3.5"/></button>
                  <button onClick={() => removeQuestion(i)} className="text-slate-500 hover:text-red-400 transition-colors p-0.5"><HiOutlineTrash className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 space-y-3">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Add Question</h3>
            <div className="space-y-1.5">
              {QUESTION_TYPES.map(t => (
                <button key={t.value} onClick={() => addQuestion(t.value)} className="btn-ghost w-full text-left text-xs py-2 px-3 flex items-center gap-2">
                  <HiOutlinePlus className="w-3 h-3 flex-shrink-0" />{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-xs text-slate-400 mb-3">
              <span className="font-semibold text-white">{questions.length}</span> of min 10 questions
            </div>
            <div className="w-full bg-surface-3 rounded-full h-1.5 mb-3">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width:`${Math.min(questions.length/10*100,100)}%` }} />
            </div>
            <div className="space-y-2">
              <button onClick={() => handleSave(false)} disabled={saving} className="btn-ghost w-full text-xs py-2 disabled:opacity-60">Save Draft</button>
              <button onClick={() => handleSave(true)}  disabled={saving} className="btn-primary w-full text-xs py-2 disabled:opacity-60">{saving ? 'Saving...' : 'Save & Publish'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

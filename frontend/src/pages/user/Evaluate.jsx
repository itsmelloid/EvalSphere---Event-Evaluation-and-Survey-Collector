import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Evaluate() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [answers, setAnswers]       = useState({});
  const [step, setStep]             = useState(0);   // 0 = intro
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/evaluations/${evaluationId}`),
      api.get(`/evaluations/${evaluationId}/has-submitted`),
    ]).then(([evalRes, subRes]) => {
      const ev = evalRes.data.data;
      // Normalize questions to ensure options are always arrays
      const formattedQuestions = (ev.questions || []).map(q => {
        let parsedOptions = q.options;
        if (typeof q.options === 'string') {
          try { parsedOptions = JSON.parse(q.options); } catch { parsedOptions = []; }
        }
        return { ...q, options: Array.isArray(parsedOptions) ? parsedOptions : [] };
      });
      setEvaluation({ ...ev, questions: formattedQuestions });
      if (subRes.data.data.has_submitted) setAlreadyDone(true);
    }).catch(() => toast.error('Failed to load evaluation.'))
    .finally(() => setLoading(false));
  }, [evaluationId]);

  const questions = evaluation?.questions || [];
  const totalSteps = questions.length;
  const currentQ = step > 0 && step <= totalSteps ? questions[step - 1] : null;

  const setAnswer = (questionId, field, value) =>
    setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], question_id: questionId, [field]: value } }));

  const canProceed = () => {
    if (!currentQ) return true;
    if (!currentQ.is_required) return true;
    const a = answers[currentQ.id];
    
    if (!a) return false;

    const validationMap = {
      rating: () => !!a.answer_rating,
      text: () => !!a.answer_text?.trim(),
      checkbox: () => (a.answer_options?.length || 0) > 0,
      default: () => !!a.answer_text
    };

    return (validationMap[currentQ.question_type] || validationMap.default)();
  };

  const handleSubmit = async () => {
    const allAnswers = Object.values(answers);
    setSubmitting(true);
    try {
      // Prevent submitting if eval is not published (backend returns 400)
      if (!evaluation?.is_published) {
        toast.error('This evaluation is not open for submissions.');
        setSubmitting(false);
        return;
      }

      await api.post('/evaluations/submit', { evaluation_id: evaluationId, answers: allAnswers });
      setSubmitted(true);
      toast.success('Evaluation submitted successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/></div>;

  if (alreadyDone) return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-semibold mb-2">Already Submitted</h2>
      <p className="text-sm text-slate-400 mb-6">You have already submitted your evaluation for this event.</p>
      <button onClick={() => navigate('/submissions')} className="btn-primary">View My Submissions</button>
    </div>
  );

  if (submitted) return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-green-400 mb-2">Thank You!</h2>
      <p className="text-sm text-slate-400 mb-2">Your evaluation has been recorded successfully.</p>
      <p className="text-xs text-slate-500 mb-8">Your feedback helps improve future events.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>
    </div>
  );

  if (!loading && questions.length === 0) return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold mb-2">No Questions Found</h2>
      <p className="text-sm text-slate-400 mb-6">This evaluation doesn't have any questions yet.</p>
      <button onClick={() => navigate('/dashboard')} className="btn-ghost">Back to Dashboard</button>
    </div>
  );

  // Intro screen
  if (step === 0) return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-semibold mb-2">{evaluation?.title}</h2>
        {evaluation?.description && <p className="text-sm text-slate-400 mb-4">{evaluation.description}</p>}
        <div className="bg-surface-2 rounded-lg p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-slate-400">Questions:</span><span className="text-white font-medium">{totalSteps}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">Est. time:</span><span className="text-white font-medium">~{Math.ceil(totalSteps * 0.5)} minutes</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-400">Anonymous:</span><span className="text-white font-medium">{evaluation?.is_anonymous ? 'Yes' : 'No'}</span></div>
        </div>
        <button onClick={() => setStep(1)} className="btn-primary w-full py-3">Start Evaluation →</button>
      </div>
    </div>
  );

  // Completion step
  if (step > totalSteps) return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center">
        <div className="text-4xl mb-4">✨</div>
        <h2 className="text-lg font-semibold mb-2">All questions answered!</h2>
        <p className="text-sm text-slate-400 mb-6">Review your answers or submit your evaluation.</p>
        <div className="space-y-2 text-left mb-6 max-h-60 overflow-y-auto">
          {questions.map((q, i) => {
            const a = answers[q.id];
            const display = a?.answer_rating ? `★ ${a.answer_rating}/5` : a?.answer_text || 'No answer';
            return (
              <div key={q.id} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                <span className="text-xs text-slate-500 w-5 flex-shrink-0 mt-0.5">{i+1}</span>
                <span className="text-xs text-slate-300 flex-1">{q.question_text}</span>
                <span className={`text-xs font-medium flex-shrink-0 ${a ? 'text-green-400' : 'text-red-400'}`}>{a ? display : 'Skipped'}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep(totalSteps)} className="btn-ghost flex-1">← Review</button>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit Evaluation ✓'}
          </button>
        </div>
      </div>
    </div>
  );

  // Question step
  const q = currentQ;
  const a = answers[q?.id] || {};
  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-slate-400">Question {step} of {totalSteps}</span>
        <div className="flex-1 bg-surface-3 rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{width:`${progress}%`}}/>
        </div>
        <span className="text-xs text-primary-light">{Math.round(progress)}%</span>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-7 h-7 rounded-full bg-primary-dim flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">{step}</span>
          <span className="badge-blue text-[10px]">{q.question_type.replace(/_/g,' ')}</span>
          {q.is_required && <span className="text-[10px] text-red-400">Required</span>}
        </div>

        <p className="text-base font-medium text-white mb-5">{q.question_text}</p>

        {q.question_type === 'rating' && (
          <div>
            <p className="text-xs text-slate-500 mb-3">Select your rating from 1 (Poor) to 5 (Excellent)</p>
            <div className="flex gap-3">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setAnswer(q.id,'answer_rating',n)}
                  className={`flex-1 py-3 rounded-lg border font-bold transition-all text-sm ${a.answer_rating===n ? 'bg-primary border-primary text-white' : 'bg-surface-2 border-border text-slate-400 hover:border-primary hover:text-white'}`}>
                  {'★'.repeat(n)}<br/><span className="text-xs font-normal">{n}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {q.question_type === 'yes_no' && (
          <div className="flex gap-3">
            {['Yes','No'].map(opt => (
              <button key={opt} onClick={() => setAnswer(q.id,'answer_text',opt)}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${a.answer_text===opt ? 'bg-primary border-primary text-white' : 'bg-surface-2 border-border text-slate-300 hover:border-primary'}`}>
                {opt === 'Yes' ? '✓ Yes' : '✗ No'}
              </button>
            ))}
          </div>
        )}

        {(q.question_type === 'multiple_choice' || q.question_type === 'dropdown') && (
          <div className="space-y-2">
            {(Array.isArray(q.options) ? q.options : []).map(opt => (
              <button key={opt} onClick={() => setAnswer(q.id,'answer_text',opt)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all ${a.answer_text===opt ? 'bg-primary-dim border-primary text-primary-light' : 'bg-surface-2 border-border text-slate-300 hover:border-primary hover:bg-surface-3'}`}>
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${a.answer_text===opt ? 'border-primary bg-primary' : 'border-slate-600'}`}/>
                {opt}
              </button>
            ))}
          </div>
        )}

        {q.question_type === 'checkbox' && (
          <div className="space-y-2">
            {(Array.isArray(q.options) ? q.options : []).map(opt => {
              const checked = (a.answer_options || []).includes(opt);
              return (
                <button key={opt} onClick={() => {
                  const cur = a.answer_options || [];
                  setAnswer(q.id,'answer_options', checked ? cur.filter(x=>x!==opt) : [...cur,opt]);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all ${checked ? 'bg-primary-dim border-primary text-primary-light' : 'bg-surface-2 border-border text-slate-300 hover:border-primary'}`}>
                  <span className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors flex items-center justify-center ${checked ? 'border-primary bg-primary' : 'border-slate-600'}`}>
                    {checked && <span className="text-white text-[10px]">✓</span>}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.question_type === 'text' && (
          <textarea className="input resize-none w-full" rows={4}
            placeholder="Share your thoughts and suggestions..."
            value={a.answer_text || ''}
            onChange={e => setAnswer(q.id,'answer_text',e.target.value)}
          />
        )}

        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1} className="btn-ghost disabled:opacity-40">← Back</button>
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="btn-primary disabled:opacity-40">
            {step === totalSteps ? 'Review Answers →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

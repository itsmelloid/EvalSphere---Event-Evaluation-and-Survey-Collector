import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/eval_logo.png';

export default function Register() {
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', password:'', organization:'', phone:'' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.password) { toast.error('Fill in required fields.'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    try {
      setLoading(true);
      await register(form);
      navigate('/dashboard');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bgBase flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img src={logo} alt="EvalSphere Logo" className="w-10 h-10 object-contain" />
          <div><div className="font-serif text-xl">EvalSphere</div><div className="text-xs text-slate-500">Event Evaluation System</div></div>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-1">Create account</h2>
          <p className="text-sm text-slate-400 mb-6">Join EvalSphere as a participant</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First name *</label><input className="input" value={form.first_name} onChange={set('first_name')} placeholder="Juan" /></div>
              <div><label className="label">Last name *</label><input className="input" value={form.last_name} onChange={set('last_name')} placeholder="Dela Cruz" /></div>
            </div>
            <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" /></div>
            <div><label className="label">Password *</label><input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" /></div>
            <div><label className="label">Organization</label><input className="input" value={form.organization} onChange={set('organization')} placeholder="Company / School" /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+63 9XX XXX XXXX" /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1 disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-5">
            Already have an account? <Link to="/login" className="text-primary-light hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

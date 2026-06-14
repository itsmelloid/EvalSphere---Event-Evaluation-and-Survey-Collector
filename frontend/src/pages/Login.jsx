import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/eval_logo.png';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill in all fields.'); return; }
    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bgBase flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img src={logo} alt="EvalSphere Logo" className="w-11 h-11 object-contain" />
          <div><div className="font-serif text-xl">EvalSphere</div><div className="text-xs text-slate-500">Event Evaluation and Survey Collector System</div></div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2 disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-light hover:underline">Register here</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">Secured with JWT · Role-based access control</p>
      </div>
    </div>
  );
}

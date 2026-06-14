import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineSearch, HiOutlinePlus } from 'react-icons/hi';
import logo from '../../assets/eval_logo.png';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard', '/events': 'Events', '/evaluations': 'Evaluations',
  '/reports': 'Reports', '/users': 'User Management',
  '/activity': 'Activity Log', '/qr-codes': 'QR Codes', '/submissions': 'My Submissions', '/profile': 'Profile',
};

export default function TopBar({ onToggleSidebar = () => {} }) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'EvalSphere';

  const canCreate = user?.role !== 'user';

  return (
    <header className="flex items-center gap-3 px-3 md:px-6 h-14 bg-surface border-b border-border flex-shrink-0">
      {/* Mobile hamburger - visible on small screens */}
      <button onClick={onToggleSidebar} className="md:hidden text-slate-400 p-2 mr-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" /></svg>
      </button>

      {/* Small logo shown next to hamburger on mobile */}
      <img src={logo} alt="EvalSphere" className="w-6 h-6 object-contain md:hidden" />

      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold truncate">{title}</h1>
        <span className="hidden sm:inline text-slate-600 text-sm">/</span>
        <span className="hidden sm:inline text-xs text-slate-500">EvalSphere</span>
      </div>

      {/* Search - hide on very small screens */}
      <div className="relative ml-auto hidden sm:block">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input className="bg-surface-2 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-primary w-40 transition-colors" placeholder="Search..." />
      </div>

      {/* Role badge */}
      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
        user?.role === 'admin' ? 'bg-purple-900/40 text-purple-400 border-purple-700/40' :
        user?.role === 'staff' ? 'bg-primary-dim/50 text-primary-light border-primary/30' :
        'bg-green-900/30 text-green-400 border-green-700/40'
      }`}>{user?.role}</span>

      {/* CTA */}
      {canCreate && (
        <>
          {/* full label on md+ */}
          <button onClick={() => navigate('/events/new')} className="hidden md:inline-flex btn-primary items-center gap-1.5 text-xs py-1.5">
            <HiOutlinePlus className="w-4 h-4" /> New Event
          </button>
          {/* compact fab on small screens */}
          <button onClick={() => navigate('/events/new')} aria-label="New Event" className="md:hidden bg-primary text-white rounded-full p-2 flex items-center justify-center">
            <HiOutlinePlus className="w-4 h-4" />
          </button>
        </>
      )}
    </header>
  );
}

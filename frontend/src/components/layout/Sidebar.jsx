import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import logo from '../../assets/eval_logo.png';
import {
  HiOutlineViewGrid, HiOutlineCalendar, HiOutlineClipboardList, HiOutlineChartBar,
  HiOutlineUsers, HiOutlineDocumentReport, HiOutlineQrcode, HiOutlineClock,
  HiOutlineCheckCircle, HiOutlineUser, HiOutlineLogout,
} from 'react-icons/hi';

const NAV = {
  admin: [
    { to: '/dashboard',  icon: HiOutlineViewGrid,       label: 'Dashboard' },
    { to: '/events',     icon: HiOutlineCalendar,       label: 'Events' },
    { to: '/evaluations',icon: HiOutlineClipboardList,  label: 'Evaluations' },
    { to: '/users',      icon: HiOutlineUsers,          label: 'User Management' },
  // Analytics removed
    { to: '/reports',    icon: HiOutlineDocumentReport, label: 'Reports' },
   
  ],
  staff: [
    { to: '/dashboard',   icon: HiOutlineViewGrid,      label: 'Dashboard' },
    { to: '/events',      icon: HiOutlineCalendar,      label: 'My Events' },
    { to: '/evaluations', icon: HiOutlineClipboardList, label: 'Evaluations' },
  // Analytics removed
    { to: '/qr-codes',    icon: HiOutlineQrcode,        label: 'QR Codes' },
  ],
  user: [
    { to: '/dashboard',  icon: HiOutlineViewGrid,      label: 'Dashboard' },
    { to: '/events',     icon: HiOutlineCalendar,      label: 'Browse Events' },
    { to: '/submissions',icon: HiOutlineCheckCircle,   label: 'My Submissions' },
    { to: '/profile',    icon: HiOutlineUser,          label: 'My Profile' },
  ],
};

export default function Sidebar({ isOpen = false, isDesktop = false, onClose = () => {}, className = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user?.role] || [];

  // Desktop aside
  if (isDesktop) {
    return (
      <aside className={`w-52 min-w-[12rem] bg-surface border-r border-border flex flex-col overflow-hidden ${className}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <img src={logo} alt="EvalSphere Logo" className="w-8 h-8 object-contain flex-shrink-0" />
          <div>
            <div className="font-serif text-sm leading-tight">EvalSphere</div>
            <div className="text-[10px] text-slate-500 font-normal">Event Evaluation</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <p className="px-4 pt-2 pb-1 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Navigation</p>
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors" onClick={() => navigate('/profile')}>
            <div className="w-7 h-7 rounded-full bg-primary-dim flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">
              {getInitials(user?.first_name, user?.last_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded">
              <HiOutlineLogout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Mobile drawer
  return (
    // render even when closed to keep markup consistent, but hide via classes
    <div aria-hidden={!isOpen} className={`fixed inset-0 z-40 md:hidden ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div onClick={onClose} className={`absolute inset-0 bg-black/50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} />

  <aside className={`absolute left-0 top-0 bottom-0 w-56 bg-surface border-r border-border transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EvalSphere Logo" className="w-7 h-7 object-contain flex-shrink-0" />
            <div>
              <div className="font-serif text-sm leading-tight">EvalSphere</div>
              <div className="text-[10px] text-slate-500 font-normal">Event Evaluation</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 p-1">
            ✕
          </button>
        </div>

        <nav className="py-3 overflow-y-auto">
          <p className="px-4 pt-2 pb-1 text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Navigation</p>
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-2 cursor-pointer transition-colors" onClick={() => { onClose(); navigate('/profile'); }}>
            <div className="w-7 h-7 rounded-full bg-primary-dim flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">
              {getInitials(user?.first_name, user?.last_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded">
              <HiOutlineLogout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

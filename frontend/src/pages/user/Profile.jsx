import { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getInitials } from '../../utils/helpers';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm]   = useState({ first_name:'', last_name:'', phone:'', organization:'', department:'' });
  const [pwForm, setPwForm] = useState({ current_password:'', new_password:'', confirm_password:'' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name||'', last_name: user.last_name||'', phone: user.phone||'', organization: user.organization||'', department: user.department||'' });
  }, [user]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const setPw = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('Passwords do not match.'); return; }
    if (pwForm.new_password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed!');
      setPwForm({ current_password:'', new_password:'', confirm_password:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed.'); }
    finally { setSavingPw(false); }
  };

  const ROLE_COLOR = { admin:'bg-purple-900/40 text-purple-400', staff:'bg-primary-dim text-primary-light', user:'bg-green-900/30 text-green-400' };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="My Profile" subtitle="Manage your personal information and security" />

      {/* Avatar card */}
      <div className="card mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-dim flex items-center justify-center text-xl font-bold text-primary-light flex-shrink-0">
          {getInitials(user?.first_name, user?.last_name)}
        </div>
        <div>
          <p className="text-base font-semibold">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <span className={`inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold capitalize ${ROLE_COLOR[user?.role]||''}`}>{user?.role}</span>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="card mb-4">
        <h3 className="text-sm font-semibold mb-4">Personal Information</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First name</label><input className="input" value={form.first_name} onChange={set('first_name')}/></div>
            <div><label className="label">Last name</label><input className="input" value={form.last_name} onChange={set('last_name')}/></div>
          </div>
          <div><label className="label">Email</label><input className="input opacity-50 cursor-not-allowed" value={user?.email||''} disabled /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+63 9XX XXX XXXX"/></div>
          <div><label className="label">Organization</label><input className="input" value={form.organization} onChange={set('organization')}/></div>
          <div><label className="label">Department</label><input className="input" value={form.department} onChange={set('department')}/></div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary mt-4 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>

      {/* Password form */}
      <form onSubmit={handleChangePw} className="card">
        <h3 className="text-sm font-semibold mb-4">Change Password</h3>
        <div className="space-y-3">
          <div><label className="label">Current Password</label><input className="input" type="password" value={pwForm.current_password} onChange={setPw('current_password')}/></div>
          <div><label className="label">New Password</label><input className="input" type="password" value={pwForm.new_password} onChange={setPw('new_password')} placeholder="Min. 6 characters"/></div>
          <div><label className="label">Confirm New Password</label><input className="input" type="password" value={pwForm.confirm_password} onChange={setPw('confirm_password')}/></div>
        </div>
        <button type="submit" disabled={savingPw} className="btn-primary mt-4 disabled:opacity-60">{savingPw ? 'Updating...' : 'Update Password'}</button>
      </form>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDate, getInitials, getRoleBadge } from '../../utils/helpers';
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';

const EMPTY_FORM = { first_name:'', last_name:'', email:'', password:'', role:'user', phone:'', organization:'', department:'' };

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...(search && { search }), ...(roleFilter && { role: roleFilter }) };
      const { data } = await api.get('/users', { params });
      setUsers(data.data.users);
      setTotal(data.data.total);
      setPages(data.data.pages);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const closeModal = () => {
    setModal(null);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setModal('create');
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
      phone: user.phone || '',
      organization: user.organization || '',
      department: user.department || '',
    });
    setModal('edit');
  };

  const handleCreate = async () => {
    if (!form.first_name || !form.email || !form.password) { toast.error('Fill required fields.'); return; }
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('User created successfully!');
      closeModal();
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user.'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!form.first_name || !form.last_name || !form.email) { toast.error('Fill required fields.'); return; }
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        organization: form.organization,
        department: form.department,
      };
      if (form.password.trim()) payload.password = form.password.trim();
      await api.put(`/users/${selectedUser.id}`, payload);
      toast.success('User updated successfully!');
      closeModal();
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update user.'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (u) => {
    try {
      await api.patch(`/users/${u.id}/toggle-status`);
      toast.success(`User ${u.is_active ? 'deactivated' : 'activated'}.`);
      fetchUsers();
    } catch { toast.error('Action failed.'); }
  };

  const handleReset = async (u) => {
    if (!window.confirm(`Reset password for ${u.first_name}? A temporary password will be emailed.`)) return;
    try { await api.post(`/users/${u.id}/reset-password`); toast.success('Password reset. Email sent.'); }
    catch { toast.error('Reset failed.'); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user ${u.first_name} ${u.last_name}? This cannot be undone.`)) return;
    try { await api.delete(`/users/${u.id}`); toast.success('User deleted.'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
  };

  const columns = [
    { key:'name', label:'Name', render: u => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-dim flex items-center justify-center text-xs font-bold text-primary-light flex-shrink-0">
          {getInitials(u.first_name, u.last_name)}
        </div>
        <div><p className="font-medium text-white">{u.first_name} {u.last_name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
      </div>
    )},
    { key:'role',        label:'Role',       render: u => <span className={getRoleBadge(u.role)}>{u.role}</span> },
    { key:'organization',label:'Organization',render: u => u.organization || '—' },
    { key:'status',      label:'Status',     render: u => <span className={u.is_active ? 'badge-green' : 'badge-red'}>{u.is_active ? 'Active' : 'Inactive'}</span> },
    { key:'joined',      label:'Joined',     render: u => formatDate(u.created_at) },
    { key:'actions',     label:'Actions',    render: u => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEdit(u)} className="btn-ghost text-xs py-1 px-2">Edit</button>
        <button onClick={() => handleToggle(u)} className={u.is_active ? 'btn-danger text-xs py-1 px-2' : 'btn-ghost text-xs py-1 px-2'}>{u.is_active ? 'Deactivate' : 'Activate'}</button>
        <button onClick={() => handleReset(u)} className="btn-ghost text-xs py-1 px-2">Reset PWD</button>
        {u.role !== 'admin' && <button onClick={() => handleDelete(u)} className="btn-danger text-xs py-1 px-2">Delete</button>}
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${total} total accounts`}
        actions={<button onClick={openCreate} className="btn-primary flex items-center gap-1.5"><HiOutlinePlus className="w-4 h-4" /> Add User</button>}
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input className="input pl-8" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-36" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
        </div>
        <DataTable columns={columns} data={users} loading={loading} emptyMsg="No users found." />
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      <Modal open={modal === 'create'} onClose={closeModal} title="Create User Account"
        footer={<><button onClick={closeModal} className="btn-ghost">Cancel</button><button onClick={handleCreate} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Creating...' : 'Create User'}</button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First name *</label><input className="input" value={form.first_name} onChange={set('first_name')} placeholder="First name" /></div>
            <div><label className="label">Last name *</label><input className="input" value={form.last_name} onChange={set('last_name')} placeholder="Last name" /></div>
          </div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">Password *</label><input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Role *</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="user">User</option><option value="staff">Staff</option><option value="admin">Admin</option>
              </select>
            </div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
          </div>
          <div><label className="label">Organization</label><input className="input" value={form.organization} onChange={set('organization')} /></div>
          <div><label className="label">Department</label><input className="input" value={form.department} onChange={set('department')} /></div>
        </div>
      </Modal>

      <Modal open={modal === 'edit'} onClose={closeModal} title="Edit User Account"
        subtitle={selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : undefined}
        footer={<><button onClick={closeModal} className="btn-ghost">Cancel</button><button onClick={handleUpdate} disabled={saving} className="btn-primary disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First name *</label><input className="input" value={form.first_name} onChange={set('first_name')} placeholder="First name" /></div>
            <div><label className="label">Last name *</label><input className="input" value={form.last_name} onChange={set('last_name')} placeholder="Last name" /></div>
          </div>
          <div><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
          <div><label className="label">New password</label><input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Leave blank to keep current password" /></div>
        </div>
      </Modal>
    </div>
  );
}

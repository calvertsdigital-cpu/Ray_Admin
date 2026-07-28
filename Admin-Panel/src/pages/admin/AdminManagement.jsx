import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Search, Trash2, X, Eye, EyeOff, Shield, Mail, Phone, Calendar, User, RefreshCw } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './AdminManagement.css';

const INTERVAL = 45_000;

/* ── Add Admin Modal ─────────────────────────────── */
function AddAdminModal({ onClose, onSuccess }) {
  const [form, setForm]               = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'' });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [errs, setErrs]               = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = '10-digit number required.';
    if (!form.password)     e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters.';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrs({ ...errs, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrs(v); return; }
    setSaving(true);
    try {
      await axiosInstance.post('/api/auth/admin/create-admin', {
        name:     form.name.trim(),
        email:    form.email.toLowerCase().trim(),
        phone:    form.phone.trim(),
        password: form.password,
      });
      toast.success('Admin created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title-row">
            <div className="modal__title-icon"><UserPlus size={20}/></div>
            <span className="modal__title">Add New Admin</span>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="modal__info-banner">
              <Shield size={14}/>
              <span>This admin will have full platform access. Credentials will be emailed.</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <input name="name" placeholder="e.g. John Smith" value={form.name} onChange={handleChange} autoFocus/>
                {errs.name && <p className="form-group__hint">{errs.name}</p>}
              </div>
              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input name="phone" placeholder="10-digit number" value={form.phone} onChange={handleChange}/>
                {errs.phone && <p className="form-group__hint">{errs.phone}</p>}
              </div>
            </div>
            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input name="email" type="email" placeholder="admin@example.com" value={form.email} onChange={handleChange}/>
              {errs.email && <p className="form-group__hint">{errs.email}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Password <span className="required">*</span></label>
                <div className="form-group__password">
                  <input name="password" type={showPass?'text':'password'} placeholder="Min 6 characters" value={form.password} onChange={handleChange}/>
                  <button type="button" className="form-group__eye" onClick={()=>setShowPass(!showPass)} tabIndex={-1}>
                    {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
                {errs.password && <p className="form-group__hint">{errs.password}</p>}
              </div>
              <div className="form-group">
                <label>Confirm Password <span className="required">*</span></label>
                <div className="form-group__password">
                  <input name="confirmPassword" type={showConfirm?'text':'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange}/>
                  <button type="button" className="form-group__eye" onClick={()=>setShowConfirm(!showConfirm)} tabIndex={-1}>
                    {showConfirm?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
                {errs.confirmPassword && <p className="form-group__hint">{errs.confirmPassword}</p>}
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving?<><span className="spinner"/> Creating…</>:<><UserPlus size={15}/> Create Admin</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Modal ────────────────────────────────── */
function DeleteModal({ target, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ maxWidth:400 }}>
        <div className="modal__header">
          <span className="modal__title">Delete Admin</span>
          <button className="modal__close" onClick={onClose}><X size={20}/></button>
        </div>
        <div className="modal__body">
          <div className="delete-confirm">
            <div className="delete-confirm__icon"><Trash2 size={28}/></div>
            <p className="delete-confirm__text">Delete <strong>{target.name}</strong>? This cannot be undone.</p>
            <p className="delete-confirm__email">{target.email}</p>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={loading}>
            {loading?<><span className="spinner"/> Deleting…</>:<><Trash2 size={14}/> Yes, Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
export default function AdminManagement() {
  const { admin: me } = useAuth();
  const [search, setSearch]               = useState('');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/auth/admin/all-admins');
    return data.admins || [];
  }, []);

  const { data: admins = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/auth/admin/delete-admin/${deleteTarget._id}`);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    } finally { setDeleteLoading(false); }
  };

  const filtered = admins.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'}) : '—';

  return (
    <PageWrapper>
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Admin Management</h1>
          <p className="page-subtitle">Manage all admin accounts for the platform</p>
        </div>
        <button className="btn btn--primary" onClick={()=>setShowAddModal(true)}>
          <UserPlus size={15}/> Add New Admin
        </button>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000}/>

      {/* Stats */}
      <div className="admin-mgmt__stats">
        <div className="admin-mgmt__stat-card">
          <div className="admin-mgmt__stat-icon" style={{ background:'#e8f3d6' }}><Shield size={22} color="#77a13d"/></div>
          <div>
            <p className="admin-mgmt__stat-label">Total Admins</p>
            <p className="admin-mgmt__stat-value">{loading?'—':admins.length}</p>
          </div>
        </div>
        <div className="admin-mgmt__stat-card">
          <div className="admin-mgmt__stat-icon" style={{ background:'#dbeafe' }}><User size={22} color="#3b82f6"/></div>
          <div>
            <p className="admin-mgmt__stat-label">Logged In As</p>
            <p className="admin-mgmt__stat-value" style={{ fontSize:14 }}>{me?.name||'—'}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card__header">
          <span className="card__title">All Admins ({loading?'…':filtered.length})</span>
          <div className="admin-mgmt__toolbar">
            <div className="search-input">
              <Search size={14}/>
              <input placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&<button style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa' }} onClick={()=>setSearch('')}><X size={13}/></button>}
            </div>
            <button className="btn btn--ghost btn--sm" onClick={refresh} disabled={refreshing} title="Refresh">
              <RefreshCw size={14} style={{ animation:refreshing?'spinGlobal 0.8s linear infinite':undefined }}/>
            </button>
          </div>
        </div>
        <div style={{ overflowX:'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width:32, height:32 }}/></div>
          ) : filtered.length===0 ? (
            <div className="empty-state" style={{ padding:60 }}>
              <div className="empty-state__icon"><Shield size={28}/></div>
              <p className="empty-state__title">No admins found</p>
              <p className="empty-state__text">{search?'Try a different search.':'Click "Add New Admin" to get started.'}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Created At</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((a,i)=>(
                  <tr key={a._id}>
                    <td style={{ color:'var(--text-muted)', fontWeight:500 }}>{i+1}</td>
                    <td>
                      <div className="admin-mgmt__name-cell">
                        <div className="admin-mgmt__avatar">{a.name?.[0]?.toUpperCase()}</div>
                        <span className="admin-mgmt__name">
                          {a.name}
                          {a._id===me?._id&&<span className="admin-mgmt__you-badge">You</span>}
                        </span>
                      </div>
                    </td>
                    <td><div className="admin-mgmt__email-cell"><Mail size={13} color="var(--text-muted)"/>{a.email}</div></td>
                    <td><div className="admin-mgmt__email-cell"><Phone size={13} color="var(--text-muted)"/>{a.phone||'—'}</div></td>
                    <td><span className="badge badge--green">Admin</span></td>
                    <td><div className="admin-mgmt__email-cell"><Calendar size={13} color="var(--text-muted)"/>{fmtDate(a.createdAt)}</div></td>
                    <td>
                      {a._id!==me?._id ? (
                        <button className="btn btn--danger btn--sm btn--icon" onClick={()=>setDeleteTarget(a)}>
                          <Trash2 size={14}/>
                        </button>
                      ) : (
                        <span className="admin-mgmt__self-note">Cannot delete self</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddAdminModal onClose={()=>setShowAddModal(false)} onSuccess={()=>refresh()}/>
      )}
      {deleteTarget && (
        <DeleteModal target={deleteTarget} onClose={()=>setDeleteTarget(null)}
          onConfirm={handleDelete} loading={deleteLoading}/>
      )}
    </PageWrapper>
  );
}

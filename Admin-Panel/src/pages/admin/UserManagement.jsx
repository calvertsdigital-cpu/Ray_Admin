import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, Trash2, Eye, X, Upload } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const TABS = ['All Users', 'Wholesalers', 'Retailers', 'Users'];
const REFRESH_INTERVAL = 30_000;

export default function UserManagement() {
  const [tab, setTab]       = useState('All Users');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId]           = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Auto-refresh ── */
  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/user/users-with-forms');
    return data.users || [];
  }, []);

  const { data: users = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/user/delete-user/${deleteId}`);
      setDeleteId(null);
      toast.success('User deleted.');
      refresh();
    } catch { toast.error('Failed to delete user.'); }
    setDeleteLoading(false);
  };

  const roleFilter = { 'All Users': null, Wholesalers: 'wholesaler', Retailers: 'retailer', Users: 'user' };
  const filtered = users.filter(u => {
    const r = roleFilter[tab];
    if (r && u.role !== r) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const roleBadge = (r) => {
    const map = { admin: 'badge--blue', wholesaler: 'badge--green', retailer: 'badge--orange', user: 'badge--gray' };
    return <span className={`badge ${map[r] || 'badge--gray'}`}>{r}</span>;
  };

  return (
    <PageWrapper>
      <div className="page-title-row">
        <h1 className="page-title">User Management</h1>
        <button className="btn btn--primary"><Upload size={14} /> Upload CSV</button>
      </div>

      {/* Auto-refresh bar */}
      <AutoRefreshBar
        countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Users"
      />

      <div className="card">
        <div className="card__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {TABS.map(t => (
              <button key={t}
                style={{
                  padding: '7px 18px', border: 'none',
                  borderRight: t !== 'Users' ? '1px solid var(--border)' : 'none',
                  background: tab === t ? 'var(--primary)' : 'transparent',
                  color: tab === t ? 'white' : 'var(--text-secondary)',
                  fontWeight: tab === t ? 600 : 400, fontSize: 13, cursor: 'pointer',
                }}
                onClick={() => setTab(t)}
              >{t}</button>
            ))}
          </div>
          <div className="search-input">
            <Search size={15} />
            <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }} onClick={() => setSearch('')}><X size={13} /></button>}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p className="empty-state__title">No users found</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Name</th><th>Role</th><th>Email ID</th>
                  <th>Form Status</th><th>View Form</th><th>View Certificate</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>{u.hasForm
                      ? <span className="badge badge--green">Submitted</span>
                      : <span className="badge badge--gray">No Form</span>}
                    </td>
                    <td>{u.hasForm
                      ? <button className="btn btn--ghost btn--sm"><Eye size={13} /> View</button>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No Form</span>}
                    </td>
                    <td>{u.hasCertificate
                      ? <button className="btn btn--ghost btn--sm"><Eye size={13} /> View</button>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No Certificate</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn--edit btn--sm btn--icon"><Eye size={14} /></button>
                        <button className="btn btn--danger btn--sm btn--icon" onClick={() => setDeleteId(u._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__header">
              <span className="modal__title">Delete User</span>
              <button className="modal__close" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal__body">
              <p style={{ fontSize: 14, color: 'var(--text-primary)', textAlign: 'center', padding: '16px 0' }}>
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? <><span className="spinner" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

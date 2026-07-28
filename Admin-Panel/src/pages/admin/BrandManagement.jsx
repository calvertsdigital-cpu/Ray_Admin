import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X, ShoppingBag } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const INTERVAL = 60_000;

/* ── Add / Edit Brand Modal ── */
function BrandModal({ mode, brand, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const [name, setName]     = useState(isEdit ? brand.name : '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Brand name is required.'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/api/admin/update-brand/${brand._id}`, { name: name.trim() });
        toast.success('Brand updated!');
      } else {
        await axiosInstance.post('/api/admin/create-brand', { name: name.trim() });
        toast.success('Brand created!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} brand.`);
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="#2563eb" />
            </div>
            <span className="modal__title">{isEdit ? 'Edit' : 'Add'} Brand</span>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-group">
              <label>Brand Name <span className="required">*</span></label>
              <input placeholder="e.g. Bio Nutrition" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <><span className="spinner" /> {isEdit ? 'Saving…' : 'Creating…'}</> : <><ShoppingBag size={14} /> {isEdit ? 'Save Changes' : 'Add Brand'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirm ── */
function DeleteModal({ brand, onClose, onConfirm, loading }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal__header">
          <span className="modal__title">Delete Brand</span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal__body">
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={26} color="var(--danger)" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              Delete brand <strong>{brand.name}</strong>? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner" /> Deleting…</> : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function BrandManagement() {
  const [search, setSearch]   = useState('');
  const [viewMode, setViewMode] = useState('Table');
  const [modal, setModal]     = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/admin/get-brands');
    return data.brands || data || [];
  }, []);

  const { data: brands = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL);

  const filtered = brands.filter(b =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!modal?.brand) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/api/admin/delete-brand/${modal.brand._id}`);
      toast.success('Brand deleted.');
      refresh();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete brand.');
    } finally { setDeleting(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <PageWrapper>
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Brand Management</h1>
          <p className="page-subtitle">{loading ? 'Loading…' : `${brands.length} brands`}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModal({ type: 'add' })}>
          <Plus size={14} /> Add Brand
        </button>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL / 1000} />

      <div className="card">
        <div className="card__header">
          <span className="card__title">All Brands ({loading ? '…' : filtered.length})</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Cards', 'Table'].map(m => (
              <button key={m} className={`btn btn--sm ${viewMode === m ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setViewMode(m)}>{m}</button>
            ))}
            <div className="search-input">
              <Search size={14} />
              <input placeholder="Search brands…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 60 }}><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 80 }}>
            <div style={{ fontSize: 48 }}>🏷️</div>
            <p className="empty-state__title">No brands found</p>
            <p className="empty-state__text">{search ? 'Try a different search.' : 'Click "Add Brand" to create your first brand.'}</p>
            {!search && <button className="btn btn--primary" style={{ marginTop: 8 }} onClick={() => setModal({ type: 'add' })}><Plus size={14} /> Add Brand</button>}
          </div>
        ) : viewMode === 'Cards' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, padding: 20 }}>
            {filtered.map(b => (
              <div key={b._id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  {b.name?.[0]?.toUpperCase()}
                </div>
                <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn--edit btn--sm btn--icon" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal({ type: 'edit', brand: b })}><Edit2 size={13} /></button>
                  <button className="btn btn--danger btn--sm btn--icon" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal({ type: 'delete', brand: b })}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Brand Name</th><th>Created By</th><th>Created At</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {b.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{b.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.createdBy?.name || 'Admin'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{fmtDate(b.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn--edit btn--sm btn--icon" onClick={() => setModal({ type: 'edit', brand: b })} title="Edit"><Edit2 size={13} /></button>
                        <button className="btn btn--danger btn--sm btn--icon" onClick={() => setModal({ type: 'delete', brand: b })} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <BrandModal mode={modal.type} brand={modal.brand} onClose={() => setModal(null)} onSuccess={refresh} />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal brand={modal.brand} onClose={() => setModal(null)} onConfirm={handleDelete} loading={deleting} />
      )}
    </PageWrapper>
  );
}

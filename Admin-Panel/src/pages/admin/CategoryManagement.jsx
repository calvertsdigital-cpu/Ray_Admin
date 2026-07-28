import React, { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Upload, Tag, Search } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { imageUrl } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './CategoryManagement.css';

const TABS = ['Wholesaler Categories', 'Retailer Categories'];
const INTERVAL = 45_000;

/* ─────────────────────────────────────────────
   Add / Edit Category Modal
───────────────────────────────────────────── */
function CategoryModal({ mode, category, tab, onClose, onSuccess }) {
  const isEdit   = mode === 'edit';
  const isRetail = tab === 'Retailer Categories';

  const [form, setForm] = useState({
    name:          isEdit ? (category.name || '') : '',
    subcategories: isEdit ? (category.subcategories?.map(s => s.name || s).join(', ') || '') : '',
  });
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(isEdit ? imageUrl(category.image) : null);
  const [saving, setSaving]   = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Category name is required.'); return; }
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name.trim().toUpperCase());
      if (form.subcategories.trim()) {
        const subs = form.subcategories.split(',').map(s => s.trim()).filter(Boolean);
        subs.forEach(s => formData.append('subcategories[]', s));
      }
      if (image) formData.append('image', image);

      const endpoint = isRetail
        ? (isEdit ? `/api/admin/update-retailer-category/${category._id}` : '/api/admin/create-retailer-category')
        : (isEdit ? `/api/admin/update-category/${category._id}`          : '/api/admin/create-category');

      const method = isEdit ? 'put' : 'post';
      await axiosInstance[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`Category ${isEdit ? 'updated' : 'created'} successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} category.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={18} color="var(--primary)" />
            </div>
            <span className="modal__title">
              {isEdit ? 'Edit' : 'Add'} {isRetail ? 'Retailer' : 'Wholesaler'} Category
            </span>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {/* Image upload */}
            <div className="cat-image-upload" onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="preview" className="cat-image-upload__preview" />
              ) : (
                <div className="cat-image-upload__placeholder">
                  <Upload size={28} color="var(--text-muted)" />
                  <p>Click to upload image</p>
                  <span>JPG, PNG up to 5MB</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </div>
            {preview && (
              <button type="button" className="btn btn--ghost btn--sm"
                style={{ marginBottom: 16 }}
                onClick={() => { setPreview(null); setImage(null); }}>
                <X size={13} /> Remove Image
              </button>
            )}

            <div className="form-group">
              <label>Category Name <span className="required">*</span></label>
              <input
                placeholder="e.g. VITAMINS A-Z"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Will be saved in uppercase</p>
            </div>

            <div className="form-group">
              <label>Subcategories <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(comma separated)</span></label>
              <textarea
                placeholder="e.g. VITAMIN C, VITAMIN D, MULTIVITAMINS"
                value={form.subcategories}
                onChange={e => setForm({ ...form, subcategories: e.target.value })}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? <><span className="spinner" /> {isEdit ? 'Saving…' : 'Creating…'}</>
                : <><Tag size={14} /> {isEdit ? 'Save Changes' : 'Create Category'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Delete Confirm Modal
───────────────────────────────────────────── */
function DeleteModal({ category, tab, onClose, onConfirm, loading }) {
  const isRetail = tab === 'Retailer Categories';
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal__header">
          <span className="modal__title">Delete Category</span>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal__body">
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} color="var(--danger)" />
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              Delete <strong>{category.name}</strong>?
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              This will remove the {isRetail ? 'retailer' : 'wholesaler'} category and all its subcategories.
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

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function CategoryManagement() {
  const [tab, setTab]         = useState('Wholesaler Categories');
  const [search, setSearch]   = useState('');
  const [viewMode, setViewMode] = useState('Table');
  const [modal, setModal]     = useState(null); // { type: 'add'|'edit'|'delete', category?: {} }
  const [deleting, setDeleting] = useState(false);

  const isRetail = tab === 'Retailer Categories';

  const fetcher = useCallback(async () => {
    const endpoint = isRetail ? '/api/admin/get-retailer-category' : '/api/admin/get-category';
    const { data } = await axiosInstance.get(endpoint);
    return data.categories || data || [];
  }, [isRetail]);

  const { data: categories = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [tab]);

  const filtered = categories.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!modal?.category) return;
    setDeleting(true);
    try {
      const endpoint = isRetail
        ? `/api/admin/delete-retailer-category/${modal.category._id}`
        : `/api/admin/delete-category/${modal.category._id}`;
      await axiosInstance.delete(endpoint);
      toast.success('Category deleted.');
      refresh();
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    } finally { setDeleting(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${categories.length} ${isRetail ? 'retailer' : 'wholesaler'} categories`}
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setModal({ type: 'add' })}>
          <Plus size={15} /> Add {isRetail ? 'Retailer' : 'Wholesaler'} Category
        </button>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL / 1000} />

      <div className="card">
        {/* ── Toolbar ── */}
        <div className="card__header" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Tab switcher */}
          <div className="cat-tabs">
            {TABS.map(t => (
              <button key={t} className={`cat-tab ${tab === t ? 'cat-tab--active' : ''}`}
                onClick={() => { setTab(t); setSearch(''); }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {['Cards', 'Table'].map(m => (
              <button key={m} className={`btn btn--sm ${viewMode === m ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setViewMode(m)}>{m}</button>
            ))}
            <div className="search-input">
              <Search size={14} />
              <input placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="spinner spinner--dark" style={{ width: 36, height: 36 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: 80 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🏷️</div>
            <p className="empty-state__title">No categories found</p>
            <p className="empty-state__text">{search ? 'Try a different search.' : `Click "Add ${isRetail ? 'Retailer' : 'Wholesaler'} Category" to create one.`}</p>
            <button className="btn btn--primary" style={{ marginTop: 8 }} onClick={() => setModal({ type: 'add' })}>
              <Plus size={14} /> Add Category
            </button>
          </div>
        ) : viewMode === 'Cards' ? (
          /* ── Cards view ── */
          <div className="cat-cards-grid">
            {filtered.map(c => {
              const img = imageUrl(c.image);
              return (
                <div key={c._id} className="cat-card">
                  <div className="cat-card__img">
                    {img ? (
                      <img src={img} alt={c.name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div style={{ display: img ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🏷️</div>
                  </div>
                  <div className="cat-card__body">
                    <p className="cat-card__name">{c.name}</p>
                    <p className="cat-card__subs">
                      {c.subcategories?.length
                        ? `${c.subcategories.length} subcategories`
                        : 'No subcategories'}
                    </p>
                  </div>
                  <div className="cat-card__actions">
                    <button className="btn btn--edit btn--sm btn--icon" onClick={() => setModal({ type: 'edit', category: c })}><Edit2 size={13} /></button>
                    <button className="btn btn--danger btn--sm btn--icon" onClick={() => setModal({ type: 'delete', category: c })}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Table view ── */
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Image</th>
                  <th>Subcategories</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const img = imageUrl(c.image);
                  return (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 12 }}>{c.name}</td>
                      <td>
                        {img ? (
                          <img src={img} alt={c.name}
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div style={{ width: 36, height: 36, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏷️</div>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.subcategories?.map(s => s.name || s).join(', ') || '—'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {c.createdBy?.name || 'Admin'}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{fmtDate(c.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--edit btn--sm btn--icon"
                            onClick={() => setModal({ type: 'edit', category: c })}
                            title="Edit category">
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn--danger btn--sm btn--icon"
                            onClick={() => setModal({ type: 'delete', category: c })}
                            title="Delete category">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination hint */}
        {filtered.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {filtered.length} of {categories.length} categories
            </span>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <CategoryModal
          mode={modal.type}
          category={modal.category}
          tab={tab}
          onClose={() => setModal(null)}
          onSuccess={refresh}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          category={modal.category}
          tab={tab}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </PageWrapper>
  );
}

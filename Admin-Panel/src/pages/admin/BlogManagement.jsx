/**
 * BlogManagement — Full CRUD for Ray's Healthy Living® blog posts.
 * Admin can create, edit, publish/unpublish, and delete blog posts.
 * Images upload to Cloudinary via multipart form.
 * All fields feed directly to the retailer site's blog pages.
 */
import React, { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, X, Upload, Eye, EyeOff,
  Image as ImageIcon, Tag, Clock, Globe, Save,
  FileText, CheckCircle, AlertCircle, Search
} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints, imageUrl } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const INTERVAL = 60_000;

const CATEGORIES = [
  'Circulatory Health', 'Heart Health', 'Immune Health', 'Digestive Health',
  'Healthy Living', 'Nutrition', 'Supplements', 'Mental Well-being',
  'Routines', 'Ingredients', 'How-to', 'Foundations', 'General'
];

const emptyForm = () => ({
  title: '',
  subtitle: '',
  excerpt: '',
  content: '',
  category: 'General',
  categorySlug: '',
  authorDisplayName: "Ray's Healthy Living",
  authorBrandLine: "Wellness Education Team",
  readTime: '',
  tags: '',
  published: false,
  featureImageAlt: '',
  featureOverlayText: '',
  bottomLine: '',
  seoTitle: '',
  metaDescription: '',
  relatedSlugs: '',
  existingImages: [],
});

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

function autoReadTime(text) {
  const words = (text || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

/* ── Modal ─────────────────────────────────────────────── */
function BlogModal({ blog, onClose, onSave, role }) {
  const [form, setForm] = useState(() => {
    if (!blog) return emptyForm();
    return {
      title:              blog.title || '',
      subtitle:           blog.subtitle || '',
      excerpt:            blog.excerpt || '',
      content:            blog.content || '',
      category:           blog.category || 'General',
      categorySlug:       blog.categorySlug || '',
      authorDisplayName:  blog.authorDisplayName || "Ray's Healthy Living",
      authorBrandLine:    blog.authorBrandLine || "Wellness Education Team",
      readTime:           blog.readTime || '',
      tags:               (blog.tags || []).join(', '),
      published:          blog.published || false,
      featureImageAlt:    blog.featureImageAlt || '',
      featureOverlayText: blog.featureOverlayText || '',
      bottomLine:         blog.bottomLine || '',
      seoTitle:           blog.seoTitle || '',
      metaDescription:    blog.metaDescription || '',
      relatedSlugs:       (blog.relatedSlugs || []).join(', '),
      existingImages:     blog.images || [],
    };
  });

  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const fileRef = useRef();

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.type.startsWith('image/'));
    if (valid.length !== files.length) toast.error('Only image files are allowed.');
    setNewFiles(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const removeExisting = (idx) => set('existingImages', form.existingImages.filter((_, i) => i !== idx));
  const removeNew = (idx) => {
    setNewFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content.trim()) { toast.error('Content is required'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      // Text fields
      const textFields = ['title','subtitle','excerpt','content','category','categorySlug',
        'authorDisplayName','authorBrandLine','readTime','tags','featureImageAlt',
        'featureOverlayText','bottomLine','seoTitle','metaDescription','relatedSlugs'];
      textFields.forEach(k => fd.append(k, form[k] || ''));
      fd.append('published', form.published ? 'true' : 'false');
      fd.append('existingImages', JSON.stringify(form.existingImages));

      // Auto-fill readTime if blank
      if (!form.readTime) fd.set('readTime', autoReadTime(form.content));
      // Auto-fill seoTitle if blank
      if (!form.seoTitle) fd.set('seoTitle', `${form.title} | Ray's Healthy Living`);
      // Auto-fill metaDescription if blank
      if (!form.metaDescription && form.excerpt) fd.set('metaDescription', form.excerpt);

      // Image files
      newFiles.forEach(f => fd.append('images', f));

      const eps = getEndpoints(role);
      if (blog?._id) {
        await axiosInstance.put(eps.updateBlog(blog._id), fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Blog post updated!');
      } else {
        await axiosInstance.post(eps.createBlog, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Blog post created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save blog post.');
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'media',   label: 'Media',   icon: ImageIcon },
    { id: 'seo',     label: 'SEO',     icon: Globe },
    { id: 'settings',label: 'Settings',icon: Tag },
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780, width: '96vw', maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal__header" style={{ flexShrink: 0 }}>
          <span className="modal__title">{blog ? 'Edit Blog Post' : 'New Blog Post'}</span>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0, background: 'var(--bg-secondary)' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                  border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
                  fontWeight: activeTab === id ? 600 : 400,
                  color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === id ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -1
                }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Tab body */}
          <div className="modal__body" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* ── CONTENT TAB ── */}
            {activeTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Title *">
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="How to Improve Blood Circulation Naturally"
                    required
                  />
                </Field>

                <Field label="Subtitle / Deck">
                  <input
                    className="form-input"
                    value={form.subtitle}
                    onChange={e => set('subtitle', e.target.value)}
                    placeholder="A short supporting line shown below the headline"
                  />
                </Field>

                <Field label="Excerpt (shown on blog listing cards)">
                  <textarea
                    className="form-input"
                    rows={2}
                    value={form.excerpt}
                    onChange={e => set('excerpt', e.target.value)}
                    placeholder="One or two sentences summarising the article…"
                  />
                </Field>

                <Field label="Content *">
                  <textarea
                    className="form-input"
                    rows={14}
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                    placeholder="Write the full article content here. You can use plain text or basic HTML (<p>, <h2>, <strong>, <ul>, <li>)."
                    required
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Supports plain text or simple HTML. Estimated read time auto-calculates if left blank.
                  </p>
                </Field>

                <Field label="The Bottom Line (optional closing callout)">
                  <textarea
                    className="form-input"
                    rows={3}
                    value={form.bottomLine}
                    onChange={e => set('bottomLine', e.target.value)}
                    placeholder="A closing summary shown in a green callout box at the end of the article."
                  />
                </Field>
              </div>
            )}

            {/* ── MEDIA TAB ── */}
            {activeTab === 'media' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Upload area */}
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 10, padding: 28,
                    textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)',
                    transition: 'border-color 0.2s'
                  }}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); const dt = e.dataTransfer; if (dt.files) handleFiles({ target: { files: dt.files } }); }}
                >
                  <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                  <p style={{ fontWeight: 600, fontSize: 14 }}>Click or drag images here</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>JPG, PNG, WebP · Max 50 MB each · Uploads to Cloudinary</p>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
                </div>

                {/* Existing + new images grid */}
                {(form.existingImages.length > 0 || newPreviews.length > 0) && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Images ({form.existingImages.length + newPreviews.length}) — first image is used as the feature/hero image
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
                      {form.existingImages.map((src, i) => (
                        <div key={`ex-${i}`} style={{ position: 'relative' }}>
                          <img
                            src={imageUrl(src) || src}
                            alt=""
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                          />
                          {i === 0 && (
                            <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--primary)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>
                              HERO
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExisting(i)}
                            style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={11} color="white" />
                          </button>
                        </div>
                      ))}
                      {newPreviews.map((src, i) => (
                        <div key={`new-${i}`} style={{ position: 'relative' }}>
                          <img src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, border: '2px solid var(--primary)' }} />
                          <span style={{ position: 'absolute', top: 4, left: 4, background: '#2563eb', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>
                            NEW
                          </span>
                          <button
                            type="button"
                            onClick={() => removeNew(i)}
                            style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={11} color="white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Feature image alt text">
                    <input
                      className="form-input"
                      value={form.featureImageAlt}
                      onChange={e => set('featureImageAlt', e.target.value)}
                      placeholder="Describe the image for screen readers"
                    />
                  </Field>
                  <Field label="Hero overlay text (bold text on image)">
                    <input
                      className="form-input"
                      value={form.featureOverlayText}
                      onChange={e => set('featureOverlayText', e.target.value)}
                      placeholder="Better Circulation for a Healthier You"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── SEO TAB ── */}
            {activeTab === 'seo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="SEO title (leave blank to auto-fill from title)">
                  <input
                    className="form-input"
                    value={form.seoTitle}
                    onChange={e => set('seoTitle', e.target.value)}
                    placeholder={form.title ? `${form.title} | Ray's Healthy Living` : 'Auto-generated from title'}
                  />
                </Field>
                <Field label="Meta description (leave blank to use excerpt)">
                  <textarea
                    className="form-input"
                    rows={3}
                    value={form.metaDescription}
                    onChange={e => set('metaDescription', e.target.value)}
                    placeholder="140–160 characters describing the article for search engines"
                  />
                  <p style={{ fontSize: 11, color: form.metaDescription.length > 160 ? '#ef4444' : 'var(--text-muted)', marginTop: 4 }}>
                    {form.metaDescription.length}/160 characters
                  </p>
                </Field>
                <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Search preview</p>
                  <p style={{ fontSize: 14, color: '#1a73e8', fontWeight: 500 }}>
                    {form.seoTitle || (form.title ? `${form.title} | Ray's Healthy Living` : 'Page title will appear here')}
                  </p>
                  <p style={{ fontSize: 12, color: '#006621', marginBottom: 2 }}>rayshealthyliving.com › articles-blog › {form.title ? slugify(form.title) : 'article-slug'}</p>
                  <p style={{ fontSize: 13, color: '#4d5156' }}>
                    {form.metaDescription || form.excerpt || 'Meta description will appear here…'}
                  </p>
                </div>
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Category">
                    <select className="form-input" value={form.category} onChange={e => { set('category', e.target.value); set('categorySlug', slugify(e.target.value)); }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Read time (auto-calculated if blank)">
                    <input
                      className="form-input"
                      value={form.readTime}
                      onChange={e => set('readTime', e.target.value)}
                      placeholder="8 min read"
                    />
                  </Field>
                  <Field label="Author display name">
                    <input
                      className="form-input"
                      value={form.authorDisplayName}
                      onChange={e => set('authorDisplayName', e.target.value)}
                      placeholder="Ray"
                    />
                  </Field>
                  <Field label="Author brand line">
                    <input
                      className="form-input"
                      value={form.authorBrandLine}
                      onChange={e => set('authorBrandLine', e.target.value)}
                      placeholder="Ray's Healthy Living"
                    />
                  </Field>
                </div>

                <Field label="Tags (comma-separated)">
                  <input
                    className="form-input"
                    value={form.tags}
                    onChange={e => set('tags', e.target.value)}
                    placeholder="circulation, cardiovascular, lifestyle, nutrition"
                  />
                </Field>

                <Field label="Related article slugs (comma-separated)">
                  <input
                    className="form-input"
                    value={form.relatedSlugs}
                    onChange={e => set('relatedSlugs', e.target.value)}
                    placeholder="understanding-your-wellness-where-to-start, loose-herbs-101"
                  />
                </Field>

                {/* Publish toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: form.published ? '#f0fdf4' : 'var(--bg-secondary)', borderRadius: 10, border: `1px solid ${form.published ? '#86efac' : 'var(--border)'}` }}>
                  <button
                    type="button"
                    onClick={() => set('published', !form.published)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: form.published ? 'var(--primary)' : '#d1d5db',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: form.published ? 23 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: form.published ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {form.published ? 'Published — visible on the retailer site' : 'Draft — not visible on the retailer site'}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {form.published ? 'Toggle to unpublish.' : 'Toggle to publish immediately.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal__footer" style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {form.published ? (
                <React.Fragment>
                  <CheckCircle size={15} color="var(--primary)" />
                  <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Published</span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <AlertCircle size={15} color="var(--text-muted)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Draft</span>
                </React.Fragment>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {saving ? <span className="spinner" /> : <Save size={14} />}
                {saving ? 'Saving…' : blog ? 'Save Changes' : 'Create Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Field helper ──────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function BlogManagement() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';

  const [modalBlog, setModalBlog] = useState(null);    // null = closed, {} = new, blog = edit
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get(getEndpoints(role).getBlogs);
    return data.blogs || data || [];
  }, [role]);

  const { data: blogs = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [role]);

  // Filter
  const filtered = blogs.filter(b => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'published' ? b.published : !b.published);
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     blogs.length,
    published: blogs.filter(b => b.published).length,
    draft:     blogs.filter(b => !b.published).length,
  };

  const openNew  = () => { setModalBlog({});   setShowModal(true); };
  const openEdit = (b) => { setModalBlog(b);   setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalBlog(null); };
  const onSave = () => { closeModal(); refresh(); };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(getEndpoints(role).deleteBlog(deleteId));
      setDeleteId(null);
      refresh();
      toast.success('Blog post deleted.');
    } catch { toast.error('Failed to delete blog post.'); }
    setDeleteLoading(false);
  };

  const togglePublish = async (b) => {
    try {
      const fd = new FormData();
      fd.append('published', String(!b.published));
      fd.append('title', b.title);
      fd.append('content', b.content || '');
      fd.append('existingImages', JSON.stringify(b.images || []));
      await axiosInstance.put(getEndpoints(role).updateBlog(b._id), fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(b.published ? 'Post unpublished.' : 'Post published!');
      refresh();
    } catch { toast.error('Failed to update status.'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Blog Management</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Create and manage blog posts for the Ray's Healthy Living® retailer website.
          </p>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          <Plus size={14} /> New Blog Post
        </button>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated} refreshing={refreshing} onRefresh={refresh} interval={INTERVAL / 1000} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Posts',  value: stats.total,     icon: '📝', bg: '#f0f9ff', color: '#0ea5e9' },
          { label: 'Published',    value: stats.published, icon: '✅', bg: '#f0fdf4', color: 'var(--primary)' },
          { label: 'Drafts',       value: stats.draft,     icon: '📄', bg: '#fff7ed', color: '#f97316' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{loading ? '—' : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="card__header">
          <span className="card__title">All Posts ({loading ? '…' : filtered.length})</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Status filter */}
            {['all','published','draft'].map(s => (
              <button key={s} className={`btn btn--sm ${filterStatus === s ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setFilterStatus(s)} style={{ textTransform: 'capitalize' }}>
                {s === 'all' ? 'All' : s === 'published' ? 'Published' : 'Drafts'}
              </button>
            ))}
            {/* Search */}
            <div className="search-input">
              <Search size={14} />
              <input placeholder="Search posts…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 60 }}>
              <div style={{ fontSize: 48 }}>📝</div>
              <p className="empty-state__title">{search ? 'No posts match your search' : 'No blog posts yet'}</p>
              <p className="empty-state__text">
                {search ? 'Try a different search term.' : 'Click "New Blog Post" to write your first article for the retailer website.'}
              </p>
              {!search && <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={openNew}><Plus size={14} /> New Blog Post</button>}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const img = imageUrl(b.featureImage || b.images?.[0]);
                  return (
                    <tr key={b._id}>
                      <td>
                        {img ? (
                          <img src={img} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} onError={e => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div style={{ width: 44, height: 44, background: '#f3f4f6', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📝</div>
                        )}
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</p>
                        {b.excerpt && <p style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{b.excerpt}</p>}
                      </td>
                      <td><span style={{ fontSize: 12, padding: '2px 8px', background: '#f0f9ff', color: '#0369a1', borderRadius: 20, fontWeight: 500 }}>{b.category || '—'}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{b.authorDisplayName || b.author?.name || '—'}</td>
                      <td>
                        <span style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600,
                          background: b.published ? '#f0fdf4' : '#fff7ed',
                          color: b.published ? 'var(--primary)' : '#f97316',
                          border: `1px solid ${b.published ? '#86efac' : '#fed7aa'}`
                        }}>
                          {b.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(b.publishedAt || b.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            className="btn btn--sm btn--icon"
                            title={b.published ? 'Unpublish' : 'Publish'}
                            onClick={() => togglePublish(b)}
                            style={{ background: b.published ? '#fff7ed' : '#f0fdf4', border: `1px solid ${b.published ? '#fed7aa' : '#86efac'}`, borderRadius: 6 }}
                          >
                            {b.published ? <EyeOff size={13} color="#f97316" /> : <Eye size={13} color="var(--primary)" />}
                          </button>
                          <button className="btn btn--edit btn--sm btn--icon" title="Edit" onClick={() => openEdit(b)}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn--danger btn--sm btn--icon" title="Delete" onClick={() => setDeleteId(b._id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <BlogModal blog={modalBlog?._id ? modalBlog : null} onClose={closeModal} onSave={onSave} role={role} />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__header">
              <span className="modal__title">Delete Blog Post</span>
              <button className="modal__close" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal__body">
              <p style={{ textAlign: 'center', fontSize: 14, padding: '12px 0', color: 'var(--text-secondary)' }}>
                This will permanently delete the blog post and cannot be undone.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="spinner" /> : '🗑 Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

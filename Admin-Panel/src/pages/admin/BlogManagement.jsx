import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints, imageUrl } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const INTERVAL = 60_000;

export default function BlogManagement() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';

  const [deleteId, setDeleteId]           = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get(getEndpoints(role).getBlogs);
    return data.blogs || data || [];
  }, [role]);

  const { data: blogs = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [role]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(getEndpoints(role).deleteBlog(deleteId));
      setDeleteId(null);
      refresh();
      toast.success('Blog deleted.');
    } catch { toast.error('Failed to delete blog.'); }
    setDeleteLoading(false);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—';

  return (
    <PageWrapper>
      <div className="page-title-row">
        <h1 className="page-title">Blog Management</h1>
        <button className="btn btn--primary"><Plus size={14}/> Add Blog</button>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000}/>

      <div className="card">
        <div style={{ overflowX:'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width:32, height:32 }}/></div>
          ) : blogs.length===0 ? (
            <div className="empty-state" style={{ padding:60 }}>
              <div style={{ fontSize:48 }}>📝</div>
              <p className="empty-state__title">No blogs yet</p>
              <p className="empty-state__text">Click "Add Blog" to create your first post.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Content</th><th>Image</th><th>Author</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {blogs.map(b=>{
                  const img = imageUrl(b.images?.[0]);
                  const txt = b.content?.replace(/<[^>]+>/g,'')||b.description||'';
                  return (
                    <tr key={b._id}>
                      <td style={{ fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</td>
                      <td style={{ color:'var(--text-secondary)', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>{txt}</td>
                      <td>
                        {img ? (
                          <img src={img} alt="" style={{ width:40, height:40, objectFit:'cover', borderRadius:6, border:'1px solid var(--border)' }} onError={e=>{e.target.style.display='none';}}/>
                        ) : (
                          <div style={{ width:40, height:40, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📝</div>
                        )}
                      </td>
                      <td style={{ color:'var(--text-secondary)' }}>{b.author||admin?.name||'—'}</td>
                      <td style={{ color:'var(--text-muted)' }}>{fmtDate(b.createdAt)}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn--edit btn--sm btn--icon"><Edit2 size={13}/></button>
                          <button className="btn btn--danger btn--sm btn--icon" onClick={()=>setDeleteId(b._id)}><Trash2 size={13}/></button>
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

      {deleteId && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal__header">
              <span className="modal__title">Delete Blog</span>
              <button className="modal__close" onClick={()=>setDeleteId(null)}><X size={18}/></button>
            </div>
            <div className="modal__body"><p style={{ textAlign:'center', fontSize:14, padding:'12px 0' }}>Delete this blog post? Cannot be undone.</p></div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={()=>setDeleteId(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading?<span className="spinner"/>:'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

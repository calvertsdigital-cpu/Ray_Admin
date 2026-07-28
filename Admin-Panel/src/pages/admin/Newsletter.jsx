import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Trash2, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const INTERVAL = 30_000;

export default function Newsletter() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';

  const [deleteId, setDeleteId]           = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get(getEndpoints(role).getNewsletters);
    return data.newsletters || data || [];
  }, [role]);

  const { data: items = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [role]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(getEndpoints(role).deleteNewsletter(deleteId));
      setDeleteId(null);
      refresh();
      toast.success('Newsletter deleted.');
    } catch { toast.error('Failed to delete.'); }
    setDeleteLoading(false);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'}) : '—';

  return (
    <PageWrapper>
      <h1 className="page-title">Newsletter Subscriptions</h1>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000}/>

      <div className="card">
        <div style={{ overflowX:'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width:32, height:32 }}/></div>
          ) : items.length===0 ? (
            <div className="empty-state" style={{ padding:60 }}>
              <div style={{ fontSize:48 }}>📧</div>
              <p className="empty-state__title">No newsletter subscriptions</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Type</th><th>Email</th><th>Message</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {items.map(n=>(
                  <tr key={n._id}>
                    <td><span className="badge badge--blue">{n.type||(role==='retailer'?'Retailer':'Wholesaler')}</span></td>
                    <td style={{ color:'var(--text-secondary)' }}>{n.email}</td>
                    <td style={{ color:'var(--text-secondary)', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.message||n.email}</td>
                    <td style={{ color:'var(--text-secondary)' }}>{fmtDate(n.createdAt)}</td>
                    <td>
                      <button className="btn btn--danger btn--sm btn--icon" onClick={()=>setDeleteId(n._id)}><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteId(null)}>
          <div className="modal" style={{ maxWidth:380 }}>
            <div className="modal__header">
              <span className="modal__title">Delete Newsletter</span>
              <button className="modal__close" onClick={()=>setDeleteId(null)}><X size={18}/></button>
            </div>
            <div className="modal__body"><p style={{ textAlign:'center', padding:'12px 0', fontSize:14 }}>Delete this subscription?</p></div>
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

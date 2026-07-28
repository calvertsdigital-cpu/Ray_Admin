import React, { useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const INTERVAL = 45_000;

export default function ProductReviews() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get(getEndpoints(role).getProductsWithReviews);
    return data.products || [];
  }, [role]);

  const { data: products = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [role]);

  const title    = role==='admin' ? 'Product Reviews Dashboard' : 'My Product Reviews';
  const subtitle = role==='admin' ? 'Manage and monitor customer feedback' : 'Monitor customer feedback on your products';

  return (
    <PageWrapper>
      <div style={{ textAlign:'center', paddingTop:12 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:'#5b21b6' }}>{title}</h1>
        <p style={{ fontSize:14, color:'var(--text-secondary)', marginTop:6 }}>{subtitle}</p>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000}/>

      <div className="card" style={{ minHeight:280 }}>
        {loading ? (
          <div className="empty-state"><div className="spinner spinner--dark" style={{ width:32, height:32 }}/></div>
        ) : products.length===0 ? (
          <div className="empty-state" style={{ padding:'80px 20px' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MessageSquare size={32} color="var(--text-muted)"/>
            </div>
            <p className="empty-state__title">No Reviews Yet</p>
            <p className="empty-state__text">Your products haven't received any reviews yet.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Product</th><th>Total Reviews</th><th>Avg Rating</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map(p=>(
                <tr key={p._id}>
                  <td style={{ fontWeight:500 }}>{p.name}</td>
                  <td>{p.reviewCount||0}</td>
                  <td><span style={{ color:'#f59e0b', fontWeight:600 }}>{'★'.repeat(Math.round(p.avgRating||0))} {(p.avgRating||0).toFixed(1)}</span></td>
                  <td><button className="btn btn--ghost btn--sm">View Reviews</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
}

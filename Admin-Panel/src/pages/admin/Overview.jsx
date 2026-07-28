import React, { useState, useCallback } from 'react';
import { Package, ShoppingCart, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints, imageUrl } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './Overview.css';

const FILTERS = ['1 Day', '7 Day', '30 Day', 'Yearly'];
const INTERVAL = 30_000;

function StatCard({ icon, label, value, change, bg, iconColor }) {
  const up = change >= 0;
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ background: bg }}>
        {React.cloneElement(icon, { size: 22, color: iconColor })}
      </div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
      <span className={`stat-card__change ${up ? 'stat-card__change--up' : 'stat-card__change--down'}`}>
        {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>} {Math.abs(change)}%
      </span>
    </div>
  );
}

export default function Overview() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';
  const ep   = getEndpoints(role);

  const [active, setActive] = useState('7 Day');

  /* pass role as dep (primitive string) — stable */
  const fetcher = useCallback(async () => {
    const eps = getEndpoints(role);
    const [pRes, oRes] = await Promise.allSettled([
      axiosInstance.get(eps.getProducts),
      axiosInstance.get(eps.getOrders),
    ]);
    const products = pRes.status === 'fulfilled'
      ? (pRes.value.data.products || pRes.value.data.data || pRes.value.data || [])
      : [];
    const orders = oRes.status === 'fulfilled'
      ? (oRes.value.data.purchases || oRes.value.data.orders || oRes.value.data || [])
      : [];
    return { products, orders };
  }, [role]);

  const { data, loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [role]);

  const products     = Array.isArray(data?.products) ? data.products : [];
  const orders       = Array.isArray(data?.orders)   ? data.orders   : [];
  const recentOrders = orders.slice(0, 8);
  const topProducts  = [...products].sort((a,b)=>(b.stock||0)-(a.stock||0)).slice(0,5);

  const completed = orders.filter(o=>o.status==='completed').length;
  const cancelled = orders.filter(o=>o.status==='cancelled').length;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'}) : '—';

  const sBadge = (s) => {
    const m = {completed:'badge--green',cancelled:'badge--red',pending:'badge--yellow',refunded:'badge--orange',refund_requested:'badge--blue'};
    return <span className={`badge ${m[s]||'badge--gray'}`}>{s?.replace('_',' ')||'—'}</span>;
  };

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="filter-tabs">
          {FILTERS.map(f=>(
            <button key={f} className={`filter-tab ${active===f?'filter-tab--active':''}`} onClick={()=>setActive(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── Auto-refresh bar ── */}
      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000} />

      {/* ── Stats ── */}
      <div className="stats-grid">
        <StatCard icon={<Package/>}      label="TOTAL PRODUCTS"    value={loading?'—':products.length} change={2.5}  bg="#e8f3d6" iconColor="#77a13d"/>
        <StatCard icon={<ShoppingCart/>} label="TOTAL ORDERS"      value={loading?'—':orders.length}   change={14.5} bg="#dbeafe" iconColor="#3b82f6"/>
        <StatCard icon={<CheckCircle/>}  label="COMPLETED ORDERS"  value={loading?'—':completed}       change={-4.5} bg="#dcfce7" iconColor="#16a34a"/>
        <StatCard icon={<XCircle/>}      label="CANCELLED ORDERS"  value={loading?'—':cancelled}       change={-4.5} bg="#fee2e2" iconColor="#dc2626"/>
      </div>

      {/* ── Bottom grid ── */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>

        {/* Top Products */}
        <div className="card">
          <div className="card__header">
            <span className="card__title">Top Products</span>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>{products.length} total</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{padding:40}}><div className="spinner spinner--dark" style={{width:28,height:28}}/></div>
          ) : topProducts.length===0 ? (
            <div className="empty-state" style={{padding:40}}>
              <div style={{fontSize:36}}>📦</div>
              <p className="empty-state__title">No products yet</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Product</th><th>Stock</th><th>Price</th></tr></thead>
              <tbody>
                {topProducts.map(p=>{
                  const img = imageUrl(p.images?.[0]);
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          {img ? (
                            <img src={img} alt="" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}
                              style={{width:32,height:32,objectFit:'cover',borderRadius:6,border:'1px solid var(--border)',flexShrink:0}}/>
                          ) : null}
                          <div style={{width:32,height:32,background:'var(--bg)',borderRadius:6,border:'1px solid var(--border)',display:img?'none':'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📦</div>
                          <span style={{fontWeight:500,fontSize:12,maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${(p.stock||0)<=5?'badge--red':'badge--blue'}`}>{p.stock??0}</span></td>
                      <td style={{fontWeight:600}}>${(p.sellPrice||p.price||0).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card__header">
            <span className="card__title">Recent Activity</span>
            <span style={{fontSize:12,color:'var(--text-muted)'}}>{recentOrders.length} Total</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{padding:40}}><div className="spinner spinner--dark" style={{width:28,height:28}}/></div>
          ) : recentOrders.length===0 ? (
            <div className="empty-state" style={{padding:40}}>
              <div style={{fontSize:36}}>🛒</div>
              <p className="empty-state__title">No recent orders</p>
            </div>
          ) : (
            <div style={{padding:'4px 0'}}>
              {recentOrders.map(o=>(
                <div key={o._id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:34,height:34,borderRadius:8,background:'var(--bg)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>🛒</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:500,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.items?.[0]?.product?.name||'Order'}</p>
                    <p style={{fontSize:11,color:'var(--text-muted)'}}>{o.user?.name||'Guest'} · {fmtDate(o.createdAt)}</p>
                  </div>
                  {sBadge(o.status)}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
}

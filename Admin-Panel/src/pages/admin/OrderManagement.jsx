import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, X, Download, Package, DollarSign, Clock, XCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './Overview.css';

const TIME_FILTERS = ['1 Day','All Time','7 Day','30 Day','Yearly'];
const INTERVAL = 20_000;

function filterByTime(orders, filter) {
  if (filter === 'All Time') return orders;
  const now = new Date();
  const days = filter === '1 Day' ? 1 : filter === '7 Day' ? 7 : filter === '30 Day' ? 30 : 365;
  const cutoff = new Date(now - days * 86400000);
  return orders.filter(o => new Date(o.createdAt) >= cutoff);
}

export default function OrderManagement() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';

  const [active, setActive]         = useState('All Time');
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get(getEndpoints(role).getOrders);
    return data.purchases || data.orders || data || [];
  }, [role]);

  const { data: allOrders = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, INTERVAL, [role]);

  const timeFiltered = filterByTime(allOrders, active);
  const filtered = timeFiltered.filter(o => {
    const q   = search.toLowerCase();
    const name = (o.user?.name || o.buyer?.name || '').toLowerCase();
    if (q && !name.includes(q) && !o._id?.toLowerCase().includes(q)) return false;
    if (statusFilter !== 'All Status' && o.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalRevenue = timeFiltered.reduce((s,o)=>s+(o.total||0),0);
  const pending      = timeFiltered.filter(o=>o.status==='pending').length;
  const cancelled    = timeFiltered.filter(o=>o.status==='cancelled').length;

  const sBadge = (s) => {
    const m = {completed:'badge--green',cancelled:'badge--red',pending:'badge--yellow',refunded:'badge--orange',refund_requested:'badge--blue'};
    return <span className={`badge ${m[s]||'badge--gray'}`}>{s?.replace('_',' ')||'—'}</span>;
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
  const getBuyer = (o) => o.user?.name || o.buyer?.name || 'Guest';

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Order Management</h1>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <div className="filter-tabs">
            {TIME_FILTERS.map(f=>(
              <button key={f} className={`filter-tab ${active===f?'filter-tab--active':''}`} onClick={()=>setActive(f)}>{f}</button>
            ))}
          </div>
          {role==='admin' && (
            <button className="btn btn--ghost"><Download size={14}/> Export</button>
          )}
        </div>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000}/>

      {/* ── Stats ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {[
          {label:'Total Orders',    value:timeFiltered.length,              icon:'📋',bg:'#dbeafe',color:'#2563eb'},
          {label:'Total Revenue',   value:`$${totalRevenue.toFixed(2)}`,    icon:'💰',bg:'#e8f3d6',color:'#77a13d'},
          {label:'Pending Orders',  value:pending,                          icon:'⏳',bg:'#fef3c7',color:'#d97706'},
          {label:'Cancelled Orders',value:cancelled,                        icon:'❌',bg:'#fee2e2',color:'#dc2626'},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:'16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{s.icon}</div>
            <div>
              <p style={{fontSize:11,color:'var(--text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.4px'}}>{s.label}</p>
              <p style={{fontSize:22,fontWeight:700,color:s.color}}>{loading?'—':s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="card__header" style={{flexWrap:'wrap',gap:10}}>
          <div className="search-input">
            <Search size={14}/>
            <input placeholder="Search by buyer, order ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
            {search && <button style={{background:'none',border:'none',cursor:'pointer'}} onClick={()=>setSearch('')}><X size={12}/></button>}
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
            style={{padding:'7px 12px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,background:'var(--surface)',color:'var(--text-primary)'}}>
            {['All Status','Completed','Pending','Cancelled','Refunded'].map(s=><option key={s}>{s}</option>)}
          </select>
          <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:'auto'}}>{filtered.length} orders</span>
        </div>

        <div style={{overflowX:'auto'}}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{width:32,height:32}}/></div>
          ) : filtered.length===0 ? (
            <div className="empty-state" style={{padding:60}}>
              <div style={{fontSize:48}}>📋</div>
              <p className="empty-state__title">No orders found</p>
              <p className="empty-state__text">Try changing filters or the time range.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Buyer</th><th>Date</th><th>Payment</th>
                  <th>Total</th><th>Items</th><th>Status</th>
                  <th>Action</th><th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o=>(
                  <tr key={o._id}>
                    <td style={{fontWeight:500}}>{getBuyer(o)}</td>
                    <td style={{color:'var(--text-secondary)'}}>{fmtDate(o.createdAt)}</td>
                    <td><span className="badge badge--gray">{o.paymentMethod||'COD'}</span></td>
                    <td style={{fontWeight:600}}>${(o.total||o.totalAmount||0).toFixed(2)}</td>
                    <td>{o.items?.length||0}</td>
                    <td>{sBadge(o.status)}</td>
                    <td><button className="btn btn--edit btn--sm">View</button></td>
                    <td><button className="btn btn--primary btn--sm"><Download size={12}/> Download</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

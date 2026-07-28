import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, X, Eye } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { useAuth } from '../../context/AuthContext';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const TABS = ['All Orders', 'Pending', 'Shipped', 'Delivered'];
const REFRESH_INTERVAL = 20_000;

export default function ShippingLogistics() {
  const { isAdmin } = useAuth();
  const [tab, setTab]       = useState('All Orders');
  const [search, setSearch] = useState('');

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/auth/all-shipments');
    return data.shipments || [];
  }, []);

  const { data: shipments = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  useRealtimeUpdates({ 'shipment-updated': () => refresh() }, isAdmin);

  const tabFilter = { 'All Orders': null, Pending: 'pending', Shipped: 'shipped', Delivered: 'delivered' };
  const filtered = shipments.filter(s => {
    const tf = tabFilter[tab];
    if (tf && s.status?.toLowerCase() !== tf) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.user?.name?.toLowerCase().includes(q) &&
          !s.user?.email?.toLowerCase().includes(q) &&
          !s._id?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    total:      shipments.length,
    completed:  shipments.filter(s => s.status === 'delivered').length,
    pending:    shipments.filter(s => s.status === 'pending').length,
    dispatched: shipments.filter(s => s.status === 'shipped').length,
  };

  const statusBadge = (s) => {
    const map = { shipped: 'badge--blue', delivered: 'badge--green', pending: 'badge--yellow', cancelled: 'badge--red' };
    return <span className={`badge ${map[s?.toLowerCase()] || 'badge--gray'}`}>{s || 'Pending'}</span>;
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : '—';

  return (
    <PageWrapper>
      <div>
        <h1 className="page-title">Shipping &amp; Logistics</h1>
        <p className="page-subtitle">Manage and track all your shipments in one place</p>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Shipments" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Total Shipments', value: counts.total,      icon: '🚚', bg: '#dbeafe', color: '#2563eb', change: '+12.5%' },
          { label: 'Completed',       value: counts.completed,  icon: '✅', bg: '#dcfce7', color: '#16a34a', change: '+8.2%'  },
          { label: 'Pending',         value: counts.pending,    icon: '📦', bg: '#fef3c7', color: '#d97706', change: '-2.1%'  },
          { label: 'Dispatched',      value: counts.dispatched, icon: '🏃', bg: '#f3e8ff', color: '#9333ea', change: '+4.5%'  },
        ].map(s => (
          <div key={s.label} className="card"
            style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
            <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 600,
              color: s.change.startsWith('+') ? 'var(--success)' : 'var(--danger)',
              background: s.change.startsWith('+') ? '#dcfce7' : '#fee2e2',
              padding: '2px 7px', borderRadius: 20 }}>{s.change}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '7px 16px', border: 'none',
                    borderRight: t !== TABS[TABS.length-1] ? '1px solid var(--border)' : 'none',
                    background: tab === t ? 'var(--primary)' : 'transparent',
                    color: tab === t ? 'white' : 'var(--text-secondary)',
                    fontWeight: tab === t ? 600 : 400, fontSize: 13, cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
            <div className="search-input">
              <Search size={14} />
              <input placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ fontSize: 32 }}>📦</div>
              <p className="empty-state__title">No shipments found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Buyer</th><th>Email</th>
                  <th>Destination</th><th>Status</th><th>Shipped On</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)' }}>#{s._id?.slice(-8)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {s.user?.name?.[0]?.toUpperCase() || 'G'}
                        </div>
                        <span style={{ fontWeight: 500 }}>{s.user?.name || 'Guest'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.user?.email || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {s.address?.city && s.address?.state ? `${s.address.city}, ${s.address.state}` : '—'}
                    </td>
                    <td>{statusBadge(s.status)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(s.createdAt)}</td>
                    <td><button className="btn btn--edit btn--sm"><Eye size={13} /> View</button></td>
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

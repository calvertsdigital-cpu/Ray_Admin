import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { triggerNotification } from '../../components/ui/RealtimeNotification';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './Overview.css';

const FILTERS = ['All Time', 'Last 30 Days', 'Last 7 Days'];
const REFRESH_INTERVAL = 25_000;

export default function PaymentManagement() {
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState('All Time');

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/user/purchases');
    return data.purchases || [];
  }, []);

  const { data: purchases = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  useRealtimeUpdates({
    'new-order': (o) => {
      triggerNotification('order', 'New Payment!', `$${(o?.total || 0).toFixed(2)} from ${o?.user?.name || 'customer'}`);
      refresh();
    },
    'order-updated': () => refresh(),
  }, isAdmin);

  const totalRevenue      = purchases.reduce((s, p) => s + (p.total || 0), 0);
  const retailerRevenue   = purchases.filter(p => p.user?.role === 'user').reduce((s, p) => s + (p.total || 0), 0);
  const wholesalerRevenue = purchases.filter(p => p.user?.role === 'wholesaler').reduce((s, p) => s + (p.total || 0), 0);

  const statusBadge = (s) => {
    const map = { completed: 'badge--green', refunded: 'badge--orange', pending: 'badge--yellow', cancelled: 'badge--red' };
    return <span className={`badge ${map[s] || 'badge--gray'}`}>{s || '—'}</span>;
  };

  const channelBadge = (role) => {
    const map = { wholesaler: 'badge--blue', retailer: 'badge--orange', user: 'badge--gray' };
    return <span className={`badge ${map[role] || 'badge--gray'}`}>{role === 'user' ? 'Retailer' : (role || '—')}</span>;
  };

  return (
    <PageWrapper>
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Payment Management</h1>
          <p className="page-subtitle">Overview of revenue across all sales channels.</p>
        </div>
        <div className="filter-tabs">
          {FILTERS.map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'filter-tab--active' : ''}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Auto-refresh bar */}
      <AutoRefreshBar
        countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Payments"
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Total Revenue',      value: `$${totalRevenue.toFixed(2)}`,      icon: '💰', bg: '#e8f3d6', color: '#77a13d' },
          { label: 'Retailer Revenue',   value: `$${retailerRevenue.toFixed(2)}`,   icon: '🏪', bg: '#dcfce7', color: '#16a34a' },
          { label: 'Wholesaler Revenue', value: `$${wholesalerRevenue.toFixed(2)}`, icon: '🏭', bg: '#fef3c7', color: '#d97706' },
          { label: 'Total Orders',       value: purchases.length,                   icon: '📋', bg: '#dbeafe', color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__header"><span className="card__title">Recent Transactions</span></div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
          ) : purchases.length === 0 ? (
            <div className="empty-state"><p className="empty-state__title">No transactions yet</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Channel</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {purchases.slice(0, 20).map(p => (
                  <tr key={p._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)' }}>#{p._id?.slice(-8)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={{ fontWeight: 500 }}>{p.user?.name || 'Guest'}</td>
                    <td>{channelBadge(p.user?.role)}</td>
                    <td style={{ fontWeight: 600 }}>${(p.total || 0).toFixed(2)}</td>
                    <td>{statusBadge(p.status)}</td>
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

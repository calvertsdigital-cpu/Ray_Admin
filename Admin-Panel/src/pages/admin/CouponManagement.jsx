import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const REFRESH_INTERVAL = 45_000;

export default function CouponManagement() {
  const [search, setSearch]     = useState('');
  const [viewMode, setViewMode] = useState('Table');

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/user/get-coupon');
    return data.coupons || data || [];
  }, []);

  const { data: coupons = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  const filtered = coupons.filter(c =>
    !search || c.code?.toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (d) => d && new Date(d) < new Date();
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  return (
    <PageWrapper>
      <div className="page-title-row">
        <h1 className="page-title">Coupon Management</h1>
        <button className="btn btn--primary"><Plus size={14} /> Add Coupon</button>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Coupons" />

      <div className="card">
        <div className="card__header">
          <span className="card__title">All Coupons ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Cards', 'Table'].map(m => (
              <button key={m} className={`btn btn--sm ${viewMode === m ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => setViewMode(m)}>{m}</button>
            ))}
            <div className="search-input">
              <Search size={14} />
              <input placeholder="Search coupons…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSearch('')}><X size={12} /></button>}
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p className="empty-state__title">No coupons found</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Discount</th><th>Min Purchase</th><th>Max Discount</th>
                  <th>Usage Limit</th><th>Status</th><th>Expiry Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>{c.code}</td>
                    <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                    <td>${c.minPurchase || 0}</td>
                    <td>${c.maxDiscount || 0}</td>
                    <td>{c.usageLimit || '—'}</td>
                    <td>
                      <span className={`badge ${isExpired(c.expiryDate) ? 'badge--red' : 'badge--green'}`}>
                        {isExpired(c.expiryDate) ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(c.expiryDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn--edit btn--sm btn--icon"><Edit2 size={13} /></button>
                        <button className="btn btn--danger btn--sm btn--icon"><Trash2 size={13} /></button>
                      </div>
                    </td>
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

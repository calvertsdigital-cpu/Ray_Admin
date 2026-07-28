import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Edit2, Layers, Package, ShoppingCart, TrendingUp, X, Info } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './BulkOrderManagement.css';
import './BulkOrderManagement.css';

const REFRESH_INTERVAL = 60_000;

/* ── Demo bulk orders for UI showcase ── */
const DEMO_ORDERS = [
  { _id: 'd1', buyer: 'John Wholesale Co.', items: 24, total: 1280.00, status: 'completed', date: '2026-07-20' },
  { _id: 'd2', buyer: 'Metro Distributors',  items: 48, total: 2560.00, status: 'pending',   date: '2026-07-22' },
  { _id: 'd3', buyer: 'Pacific Trade Group', items: 12, total: 640.00,  status: 'completed', date: '2026-07-25' },
  { _id: 'd4', buyer: 'Sunrise Imports LLC', items: 36, total: 1920.00, status: 'pending',   date: '2026-07-26' },
  { _id: 'd5', buyer: 'Golden Eagle Supply', items: 60, total: 3200.00, status: 'completed', date: '2026-07-27' },
];

/* ── Update Modal ── */
function UpdateModal({ current, onClose, onSuccess }) {
  const [value, setValue] = useState(String(current || 2));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(value);
    if (!num || num < 1) { toast.error('Enter a valid number (minimum 1).'); return; }
    setSaving(true);
    try {
      await axiosInstance.put('/api/bulk/update-bulk-order', { bulkOrderNumber: num });
      toast.success(`Bulk order minimum updated to ${num}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8f3d6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#77a13d" />
            </div>
            <span className="modal__title">Update Bulk Order Setting</span>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Info size={15} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
                Set the minimum number of items required for a bulk order. Orders with this many items or more qualify for bulk pricing.
              </p>
            </div>

            <div className="form-group">
              <label>Minimum Bulk Order Quantity <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                max="10000"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="e.g. 5"
                autoFocus
                style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', color: 'var(--primary)' }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Current value: <strong>{current || '—'}</strong>
              </p>
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : <><Edit2 size={14} /> Update Setting</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function BulkOrderManagement() {
  const [showModal, setShowModal] = useState(false);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/bulk/get-bulk-order');
    // API returns a single object: { _id, bulkOrderNumber, createdAt, updatedAt }
    return data;
  }, []);

  const { data: setting, loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  const bulkMin   = setting?.bulkOrderNumber ?? setting?.minimumQuantity ?? setting?.value ?? '—';
  const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtUpdate = (d) => d ? new Date(d).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const sBadge = (s) => {
    const m = { completed: 'badge--green', pending: 'badge--yellow', cancelled: 'badge--red' };
    return <span className={`badge ${m[s] || 'badge--gray'}`}>{s}</span>;
  };

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Bulk Order Management</h1>
          <p className="page-subtitle">Configure minimum quantities and view bulk orders</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Edit2 size={14} /> Update Bulk Order
        </button>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={REFRESH_INTERVAL / 1000} />

      {/* ── Current Setting Card ── */}
      <div className="bulk-setting-card">
        <div className="bulk-setting-card__icon">
          <Layers size={32} color="#77a13d" />
        </div>
        <div className="bulk-setting-card__info">
          <p className="bulk-setting-card__label">Current Minimum Bulk Order Quantity</p>
          {loading ? (
            <div className="spinner spinner--dark" style={{ width: 28, height: 28, marginTop: 8 }} />
          ) : (
            <p className="bulk-setting-card__value">{bulkMin}</p>
          )}
          <p className="bulk-setting-card__sub">
            Orders with <strong>{bulkMin}+</strong> items qualify as bulk orders
          </p>
        </div>
        <div className="bulk-setting-card__meta">
          <div className="bulk-setting-card__meta-row">
            <span>Created</span>
            <span>{fmtDate(setting?.createdAt)}</span>
          </div>
          <div className="bulk-setting-card__meta-row">
            <span>Last Updated</span>
            <span>{fmtUpdate(setting?.updatedAt)}</span>
          </div>
          <div className="bulk-setting-card__meta-row">
            <span>Set By</span>
            <span>Admin</span>
          </div>
          <button className="btn btn--edit btn--sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
            onClick={() => setShowModal(true)}>
            <Edit2 size={13} /> Change Setting
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Bulk Orders', value: DEMO_ORDERS.length,                                              icon: <Layers size={22} color="#77a13d" />, bg: '#e8f3d6' },
          { label: 'Total Items',       value: DEMO_ORDERS.reduce((s,o)=>s+o.items, 0),                         icon: <Package size={22} color="#3b82f6" />, bg: '#dbeafe' },
          { label: 'Total Revenue',     value: `$${DEMO_ORDERS.reduce((s,o)=>s+o.total,0).toLocaleString()}`,   icon: <TrendingUp size={22} color="#16a34a" />, bg: '#dcfce7' },
          { label: 'Pending Orders',    value: DEMO_ORDERS.filter(o=>o.status==='pending').length,               icon: <ShoppingCart size={22} color="#d97706" />, bg: '#fef3c7' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Bulk Orders Table (demo) ── */}
      <div className="card">
        <div className="card__header">
          <span className="card__title">Recent Bulk Orders</span>
          <span className="badge badge--blue">Demo Data</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Buyer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ORDERS.map((o, i) => (
                <tr key={o._id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {o.buyer[0]}
                      </div>
                      <span style={{ fontWeight: 500 }}>{o.buyer}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: o.items >= bulkMin ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {o.items}
                    </span>
                    {o.items >= bulkMin && (
                      <span className="badge badge--green" style={{ marginLeft: 6, fontSize: 10 }}>Bulk</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>${o.total.toLocaleString()}</td>
                  <td>{sBadge(o.status)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(o.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <button className="btn btn--edit btn--sm">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: '#fffbeb', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Info size={14} color="#d97706" />
          <span style={{ fontSize: 12, color: '#92400e' }}>
            Demo data shown for illustration. Connect your bulk order API to display live orders.
          </span>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="card">
        <div className="card__header"><span className="card__title">How Bulk Orders Work</span></div>
        <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { step: '1', title: 'Customer Orders', desc: `Customer places an order with ${bulkMin}+ items in a single purchase.`, icon: '🛒', color: '#dbeafe' },
            { step: '2', title: 'Auto Detection',  desc: 'System automatically detects it as a bulk order and applies bulk pricing.', icon: '⚡', color: '#e8f3d6' },
            { step: '3', title: 'Fulfillment',     desc: 'Order is routed to wholesale fulfillment with priority processing.',       icon: '✅', color: '#dcfce7' },
          ].map(s => (
            <div key={s.step} style={{ background: s.color, borderRadius: 10, padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>{s.step}</div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <UpdateModal
          current={bulkMin}
          onClose={() => setShowModal(false)}
          onSuccess={refresh}
        />
      )}
    </PageWrapper>
  );
}

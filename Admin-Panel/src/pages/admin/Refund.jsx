import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { RotateCcw, CheckCircle, XCircle, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import { useAuth } from '../../context/AuthContext';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const REFRESH_INTERVAL = 20_000;

export default function Refund() {
  const { isAdmin } = useAuth();
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal]   = useState(null);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/user/purchases');
    return (data.purchases || []).filter(
      p => p.status === 'refund_requested' || p.status === 'refunded'
    );
  }, []);

  const { data: refunds = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  useRealtimeUpdates({ 'refund-requested': () => refresh() }, isAdmin);

  const processRefund = async (purchaseId, action) => {
    setActionLoading(purchaseId);
    try {
      await axiosInstance.post('/api/user/process-refund', { purchaseId, action });
      toast.success(`Refund ${action === 'approve' ? 'approved' : 'rejected'}.`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund.');
    }
    setActionLoading(null);
    setConfirmModal(null);
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : '—';

  const statusBadge = (s) => {
    const map = { refund_requested: 'badge--yellow', refunded: 'badge--green', completed: 'badge--gray' };
    return <span className={`badge ${map[s] || 'badge--gray'}`}>{s?.replace('_', ' ') || '—'}</span>;
  };

  const pending   = refunds.filter(r => r.status === 'refund_requested').length;
  const processed = refunds.filter(r => r.status === 'refunded').length;

  return (
    <PageWrapper>
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <RotateCcw size={22} /> Refund Requests
        </h1>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Refunds" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
        {[
          { label: 'Total Requests', value: refunds.length, icon: '📋', bg: '#dbeafe', color: '#2563eb' },
          { label: 'Pending',        value: pending,        icon: '⏳', bg: '#fef3c7', color: '#d97706' },
          { label: 'Processed',      value: processed,      icon: '✅', bg: '#dcfce7', color: '#16a34a' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
          ) : refunds.length === 0 ? (
            <div className="empty-state" style={{ padding: 80 }}>
              <div className="empty-state__icon"><RotateCcw size={32} /></div>
              <p className="empty-state__title">No Refund Requests</p>
              <p className="empty-state__text">There are no pending refund requests at this time.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Customer</th><th>Date</th>
                  <th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)' }}>#{r._id?.slice(-8)}</td>
                    <td style={{ fontWeight: 500 }}>{r.user?.name || 'Guest'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(r.createdAt)}</td>
                    <td style={{ fontWeight: 600 }}>${(r.total || 0).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.refundReason || '—'}
                    </td>
                    <td>{statusBadge(r.status)}</td>
                    <td>
                      {r.status === 'refund_requested' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn--primary btn--sm"
                            onClick={() => setConfirmModal({ id: r._id, action: 'approve', amount: r.total })}
                            disabled={actionLoading === r._id}>
                            {actionLoading === r._id ? <span className="spinner" /> : <><CheckCircle size={13} /> Approve</>}
                          </button>
                          <button className="btn btn--danger btn--sm"
                            onClick={() => setConfirmModal({ id: r._id, action: 'reject' })}
                            disabled={actionLoading === r._id}>
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="badge badge--green">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirmModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal__header">
              <span className="modal__title">{confirmModal.action === 'approve' ? 'Approve Refund' : 'Reject Refund'}</span>
              <button className="modal__close" onClick={() => setConfirmModal(null)}><X size={18} /></button>
            </div>
            <div className="modal__body">
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: confirmModal.action === 'approve' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  {confirmModal.action === 'approve'
                    ? <CheckCircle size={28} color="#16a34a" />
                    : <XCircle size={28} color="#dc2626" />}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {confirmModal.action === 'approve'
                    ? `Approve this refund${confirmModal.amount ? ` of $${confirmModal.amount.toFixed(2)}` : ''}? The amount will be returned via Stripe.`
                    : 'Reject this refund request?'}
                </p>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setConfirmModal(null)}>Cancel</button>
              <button
                className={`btn ${confirmModal.action === 'approve' ? 'btn--primary' : 'btn--danger'}`}
                onClick={() => processRefund(confirmModal.id, confirmModal.action)}
                disabled={actionLoading === confirmModal.id}>
                {actionLoading === confirmModal.id
                  ? <><span className="spinner" /> Processing…</>
                  : confirmModal.action === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Eye, Trash2, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';

const REFRESH_INTERVAL = 30_000;

export default function Appointments() {
  const [deleteId, setDeleteId]           = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/bookings/get-booking');
    return data.bookings || data || [];
  }, []);

  const { data: bookings = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/bookings/delete-booking/${deleteId}`);
      setDeleteId(null);
      refresh();
      toast.success('Booking deleted.');
    } catch { toast.error('Failed to delete.'); }
    setDeleteLoading(false);
  };

  const total     = bookings.length;
  const pending   = bookings.filter(b => b.paymentStatus?.toLowerCase() === 'pending').length;
  const completed = bookings.filter(b => b.paymentStatus?.toLowerCase() === 'completed').length;

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const statusBadge = (s) => {
    const map = { completed: 'badge--green', pending: 'badge--yellow' };
    return <span className={`badge ${map[s?.toLowerCase()] || 'badge--gray'}`}>{s || '—'}</span>;
  };

  return (
    <PageWrapper>
      <h1 className="page-title">Booking Management</h1>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Bookings" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Total Bookings',     value: total,     icon: '📅', color: '#2563eb', bg: '#dbeafe' },
          { label: 'Pending Payments',   value: pending,   icon: '⏳', color: '#d97706', bg: '#fef3c7' },
          { label: 'Completed Payments', value: completed, icon: '✅', color: '#16a34a', bg: '#dcfce7' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner spinner--dark" style={{ width: 32, height: 32 }} /></div>
          ) : bookings.length === 0 ? (
            <div className="empty-state"><p className="empty-state__title">No appointments found</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Full Name</th><th>Time</th><th>Category</th>
                  <th>Email</th><th>Phone</th><th>Payment Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(b.date)}</td>
                    <td style={{ fontWeight: 500 }}>{b.fullName || b.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.time}</td>
                    <td><span className="badge badge--blue">{b.category}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{b.email}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{b.phone}</td>
                    <td>{statusBadge(b.paymentStatus)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn--edit btn--sm">View</button>
                        <button className="btn btn--danger btn--sm btn--icon" onClick={() => setDeleteId(b._id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__header">
              <span className="modal__title">Delete Booking</span>
              <button className="modal__close" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal__body">
              <p style={{ textAlign: 'center', fontSize: 14, padding: '12px 0' }}>Delete this appointment?</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="spinner" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

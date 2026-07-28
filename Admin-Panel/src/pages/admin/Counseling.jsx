import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Heart, Trash2, Calendar, Phone, Mail, MapPin, Clock, MessageSquare, X } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './Counseling.css';

const REFRESH_INTERVAL = 30_000;
const COLORS = ['#7c3aed','#0891b2','#059669','#d97706','#2563eb'];
const colorFor = (str) => COLORS[str?.charCodeAt(0) % COLORS.length] || COLORS[0];
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';

export default function Counseling() {
  const [deleteId, setDeleteId]           = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/user/counselling');
    return data.counsellings || data || [];
  }, []);

  const { data: requests = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/user/counselling/${deleteId}`);
      setDeleteId(null);
      refresh();
      toast.success('Request deleted.');
    } catch { toast.error('Failed to delete.'); }
    setDeleteLoading(false);
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <PageWrapper>
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Heart size={22} color="#7c3aed" /> Counseling Requests
        </h1>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Counseling" />

      {loading ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="spinner spinner--dark" style={{ width: 36, height: 36 }} />
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="empty-state__icon"><Heart size={32} /></div>
          <p className="empty-state__title">No counseling requests</p>
        </div>
      ) : (
        <div className="counseling-grid">
          {requests.map(r => (
            <div key={r._id} className="counseling-card">
              <div className="counseling-card__header">
                <div className="counseling-card__avatar" style={{ background: colorFor(r.name) }}>
                  {getInitials(r.name)}
                </div>
                <div className="counseling-card__user">
                  <span className="counseling-card__name">{r.name || 'Anonymous'}</span>
                  <div className="counseling-card__contacts">
                    {r.email && <span className="counseling-card__contact"><Mail size={11} /> {r.email}</span>}
                    {r.phone && <span className="counseling-card__contact"><Phone size={11} /> {r.phone}</span>}
                  </div>
                </div>
                <div className="counseling-card__actions">
                  <span className="counseling-card__date"><Calendar size={12} /> {formatDate(r.createdAt)}</span>
                  <button className="btn btn--danger btn--sm btn--icon" onClick={() => setDeleteId(r._id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="counseling-card__body">
                <div className="counseling-detail-grid">
                  <div className="counseling-detail">
                    <span className="counseling-detail__label"><MapPin size={12} /> Location</span>
                    <span className="counseling-detail__value">{r.location || '—'}</span>
                  </div>
                  <div className="counseling-detail">
                    <span className="counseling-detail__label"><Clock size={12} /> Best Time</span>
                    <span className="counseling-detail__value">{r.bestTime || '—'}</span>
                  </div>
                  <div className="counseling-detail">
                    <span className="counseling-detail__label"><MessageSquare size={12} /> Contact Method</span>
                    <span className="counseling-detail__value">{r.contactMethod || '—'}</span>
                  </div>
                  <div className="counseling-detail">
                    <span className="counseling-detail__label"><MapPin size={12} /> Lives In</span>
                    <span className="counseling-detail__value">{r.livesIn || r.city || '—'}</span>
                  </div>
                </div>
                {r.helpWith && (
                  <div className="counseling-help">
                    <span className="counseling-detail__label"><Heart size={12} /> Help With</span>
                    <p className="counseling-help__text">{r.helpWith}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__header">
              <span className="modal__title">Delete Request</span>
              <button className="modal__close" onClick={() => setDeleteId(null)}><X size={18} /></button>
            </div>
            <div className="modal__body">
              <p style={{ textAlign: 'center', fontSize: 14, padding: '12px 0' }}>Delete this counseling request?</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? <><span className="spinner" /> Deleting…</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

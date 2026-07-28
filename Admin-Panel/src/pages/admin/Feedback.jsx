import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { MessageCircle, Calendar, Phone, Mail } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './Feedback.css';

const REFRESH_INTERVAL = 30_000;

const COLORS = ['#7c3aed','#0891b2','#059669','#d97706','#dc2626','#2563eb'];
const colorFor = (str) => COLORS[str?.charCodeAt(0) % COLORS.length] || COLORS[0];
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?';

export default function Feedback() {
  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/user/feedback');
    return data.feedbacks || [];
  }, []);

  const { data: feedbacks = [], loading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <PageWrapper>
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <MessageCircle size={22} /> Customer Feedback
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
          {feedbacks.length} total feedback{feedbacks.length !== 1 ? 's' : ''} received
        </p>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh}
        interval={REFRESH_INTERVAL / 1000} label="Feedback" />

      {loading ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="spinner spinner--dark" style={{ width: 36, height: 36 }} />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-state" style={{ padding: 80 }}>
          <div className="empty-state__icon"><MessageCircle size={32} /></div>
          <p className="empty-state__title">No feedback yet</p>
        </div>
      ) : (
        <div className="feedback-grid">
          {feedbacks.map(f => (
            <div key={f._id} className="feedback-card">
              <div className="feedback-card__header">
                <div className="feedback-card__avatar" style={{ background: colorFor(f.name) }}>
                  {getInitials(f.name)}
                </div>
                <div className="feedback-card__user">
                  <span className="feedback-card__name">{f.name || 'Anonymous'}</span>
                  <div className="feedback-card__meta">
                    {f.email && <span className="feedback-card__meta-item"><Mail size={11} /> {f.email}</span>}
                    {f.phone && <span className="feedback-card__meta-item"><Phone size={11} /> {f.phone}</span>}
                  </div>
                </div>
                <div className="feedback-card__date"><Calendar size={12} /> {formatDate(f.createdAt)}</div>
              </div>
              <div className="feedback-card__body">
                {f.subject && (
                  <div className="feedback-card__field">
                    <span className="feedback-card__field-label"><MessageCircle size={12} /> Subject</span>
                    <p className="feedback-card__field-value">{f.subject}</p>
                  </div>
                )}
                <div className="feedback-card__field">
                  <span className="feedback-card__field-label"><MessageCircle size={12} /> Message</span>
                  <p className="feedback-card__field-value">{f.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

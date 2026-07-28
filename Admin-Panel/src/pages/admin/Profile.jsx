import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Edit2, Lock, Bell, RefreshCw } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import './Profile.css';

const REFRESH_INTERVAL = 60_000;

export default function Profile() {
  const { admin, login } = useAuth();
  const [editing, setEditing]       = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', phone: '' });
  const [passForm, setPassForm]     = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving]         = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  /* ── Auto-refresh profile ── */
  const fetcher = useCallback(async () => {
    const { data } = await axiosInstance.get('/api/auth/admin/profile');
    return data;
  }, []);

  const { data: profile, loading, countdown, refreshing, refresh } =
    useAutoRefresh(fetcher, REFRESH_INTERVAL);

  /* Sync form when profile loads */
  React.useEffect(() => {
    if (profile && !editing) {
      setForm({
        name:  profile.name  || admin?.name  || '',
        email: profile.email || admin?.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, editing]);

  const displayName  = profile?.name  || admin?.name  || '—';
  const displayEmail = profile?.email || admin?.email || '—';
  const displayPhone = profile?.phone || '—';

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axiosInstance.put('/api/auth/admin/profile', form);
      login(localStorage.getItem('adminToken'), {
        ...admin,
        name:  data.admin.name,
        email: data.admin.email,
      });
      toast.success('Profile updated.');
      setEditing(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    }
    setSaving(false);
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword) {
      toast.error('Fill in both password fields.'); return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.'); return;
    }
    setSavingPass(true);
    try {
      await axiosInstance.put('/api/auth/admin/update-password', passForm);
      toast.success('Password changed successfully.');
      setPassForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    }
    setSavingPass(false);
  };

  return (
    <PageWrapper>
      <div className="page-title-row">
        <h1 className="page-title">Profiles</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Auto-refresh indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'livePulse 2s infinite' }} />
            Refreshes in {countdown}s
          </div>
          <button className="btn btn--ghost btn--sm" onClick={refresh} disabled={refreshing} title="Refresh profile">
            <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* General Info Card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <span className="profile-card__section">General</span>
          {!editing ? (
            <button className="btn btn--edit btn--sm" onClick={() => setEditing(true)}>
              <Edit2 size={13} /> Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
              <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="profile-card__body">
          {/* Avatar row */}
          <div className="profile-avatar-row">
            <div className="profile-avatar">
              {displayName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <p className="profile-avatar__title">Profile Picture</p>
              <p className="profile-avatar__subtitle">Change or remove your profile picture</p>
              <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }}>📷 Change Picture</button>
            </div>
          </div>

          {/* Fields */}
          <div className="profile-fields">
            <div className="form-group">
              <label>Username</label>
              {editing
                ? <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                : <div className="profile-field-value">{displayName}</div>
              }
            </div>
            <div className="profile-fields-row">
              <div className="form-group">
                <label>Phone Number</label>
                {editing
                  ? <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone" />
                  : <div className="profile-field-value">{displayPhone}</div>
                }
              </div>
              <div className="form-group">
                <label>Email ID</label>
                {editing
                  ? <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  : <div className="profile-field-value">{displayEmail}</div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <span className="profile-card__section"><Lock size={15} /> Update Password</span>
        </div>
        <div className="profile-card__body">
          <form onSubmit={handlePassChange} className="profile-fields">
            <div className="profile-fields-row">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password" placeholder="••••••••••"
                  value={passForm.currentPassword}
                  onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password" placeholder="Min 6 characters"
                  value={passForm.newPassword}
                  onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                />
              </div>
            </div>
            <div>
              <button type="submit" className="btn btn--ghost" disabled={savingPass}>
                {savingPass ? <><span className="spinner spinner--dark" /> Changing…</> : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="profile-card">
        <div className="profile-card__header">
          <span className="profile-card__section"><Bell size={15} /> Notifications</span>
        </div>
        <div className="profile-card__body">
          <div className="profile-notifications">
            <div className="profile-notif-item">
              <div className="profile-notif-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>🔔</div>
              <span className="profile-notif-label">Low Stock Notifications</span>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle__slider" />
              </label>
            </div>
            <div className="profile-notif-item">
              <div className="profile-notif-icon" style={{ background: '#e8f3d6', color: '#77a13d' }}>📊</div>
              <span className="profile-notif-label">Enable Report Notification</span>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="toggle__slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import {
  Eye, EyeOff, ShieldCheck, Users, Store,
  CheckCircle, AlertCircle, X
} from 'lucide-react';
import Logo from '../../assets/WholesaleLogo.png';
import LoginBg from '../../assets/LoginBgImg.png';
import './Login.css';

/* ── Role config ─────────────────────────────── */
const ROLES = [
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    color: '#77a13d',
    bg: '#e8f3d6',
    description: 'Full platform access',
    redirectTo: '/admin',
  },
  {
    key: 'wholesaler',
    label: 'Wholesaler',
    icon: Users,
    color: '#2563eb',
    bg: '#dbeafe',
    description: 'Wholesale dashboard',
    redirectTo: '/admin',   // same shell, filtered sidebar
  },
  {
    key: 'retailer',
    label: 'Retailer',
    icon: Store,
    color: '#d97706',
    bg: '#fef3c7',
    description: 'Retail dashboard',
    redirectTo: '/admin',
  },
];

/* ── Toast ───────────────────────────────────── */
const Toast = ({ message, type, onClose, show }) => {
  React.useEffect(() => {
    if (show) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className={`login-toast login-toast--${type}`}>
      <div className="login-toast__inner">
        {type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
        <span>{message}</span>
        <button onClick={onClose}><X size={13} /></button>
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────── */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const activeRole = ROLES.find((r) => r.key === role);
  const isValid = email.trim() && password.length >= 6;

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  const handleRoleSwitch = (r) => {
    setRole(r);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');

    try {
      const { data } = await axiosInstance.post('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password,
        role,
      });

      // Confirm the returned role matches what was selected
      if (data.role !== role) {
        const msg = `No ${role} account found for this email.`;
        setError(msg);
        showToast(msg, 'error');
        setLoading(false);
        return;
      }

      login(data.token, {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      });

      showToast(`Welcome back, ${data.name}!`, 'success');
      setTimeout(() => navigate('/admin', { replace: true }), 500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-card">

          {/* Logo */}
          <div className="login-card__logo">
            <img src={Logo} alt="Ray's Healthy Living" />
          </div>

          {/* Role switcher */}
          <div className="role-switcher">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = role === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  className={`role-btn ${isActive ? 'role-btn--active' : ''}`}
                  style={isActive ? { '--role-color': r.color, '--role-bg': r.bg } : {}}
                  onClick={() => handleRoleSwitch(r.key)}
                >
                  <Icon size={16} />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active role hint */}
          <div
            className="role-hint"
            style={{ background: activeRole.bg, borderColor: activeRole.color + '44', color: activeRole.color }}
          >
            <activeRole.icon size={13} />
            <span>Signing in as <strong>{activeRole.label}</strong> — {activeRole.description}</span>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-form__error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="login-form__group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
                autoFocus
                style={{ '--focus-color': activeRole.color }}
              />
            </div>

            <div className="login-form__group">
              <label htmlFor="password">Password</label>
              <div className="login-form__password">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  minLength={6}
                  style={{ '--focus-color': activeRole.color }}
                />
                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="login-form__hint">Password must be at least 6 characters</p>
              )}
            </div>

            <button
              type="submit"
              className="login-form__submit"
              disabled={loading || !isValid}
              style={{ '--btn-color': activeRole.color, '--btn-color-dark': activeRole.color + 'dd' }}
            >
              {loading ? <span className="login-form__spinner" /> : `Log In as ${activeRole.label}`}
            </button>
          </form>

          <p className="login-form__footer-note">
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>

      {/* ── Right image panel ── */}
      <div className="login-right">
        <img src={LoginBg} alt="background" />
        <div className="login-right__overlay">
          <div className="login-right__text">
            <h2>Welcome to<br />Ray's Dashboard</h2>
            <p>Manage your wholesale and retail operations from one powerful platform.</p>
            <div className="login-right__pills">
              {ROLES.map((r) => (
                <span
                  key={r.key}
                  className={`login-right__pill ${role === r.key ? 'login-right__pill--active' : ''}`}
                  onClick={() => handleRoleSwitch(r.key)}
                  style={role === r.key ? { background: r.color } : {}}
                >
                  <r.icon size={12} /> {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

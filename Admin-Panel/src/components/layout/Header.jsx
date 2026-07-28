import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const ROLE_CONFIG = {
  admin:      { label: 'Admin Panel',      color: '#77a13d', bg: '#e8f3d6' },
  wholesaler: { label: 'Wholesaler Panel', color: '#2563eb', bg: '#dbeafe' },
  retailer:   { label: 'Retailer Panel',   color: '#d97706', bg: '#fef3c7' },
};

export default function Header() {
  const { admin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const role   = admin?.role || 'admin';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.admin;

  return (
    <header className="admin-header">
      <div className="admin-header__left">
        <h2 className="admin-header__greeting">
          {getGreeting()}, {admin?.name?.split(' ')[0] || 'User'}
        </h2>
        <span
          className="admin-header__badge"
          style={{ color: config.color, background: config.bg }}
        >
          {config.label}
        </span>
      </div>

      <div className="admin-header__right">
        {/* Only admins see the Add Admin button */}
        {isAdmin && (
          <button
            className="admin-header__add-btn"
            onClick={() => navigate('/admin/admin-management')}
            title="Manage Admins"
          >
            <UserPlus size={15} />
            <span>Add Users</span>
          </button>
        )}

        <div className="admin-header__user" onClick={() => navigate('/admin/profile')}>
          <div
            className="admin-header__avatar"
            style={{ background: config.color }}
          >
            {admin?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="admin-header__user-info">
            <span className="admin-header__user-name">{admin?.name || 'User'}</span>
            <span className="admin-header__user-role" style={{ textTransform: 'capitalize' }}>
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

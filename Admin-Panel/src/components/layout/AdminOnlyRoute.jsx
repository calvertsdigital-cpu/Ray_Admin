import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldOff } from 'lucide-react';

/**
 * Wraps routes that only admins can access.
 * Wholesalers/Retailers are shown a "no access" screen instead of a redirect.
 */
export default function AdminOnlyRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '60vh', gap: 16,
        color: 'var(--text-secondary)', textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShieldOff size={34} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          Access Restricted
        </h2>
        <p style={{ fontSize: 14, maxWidth: 360, lineHeight: 1.6 }}>
          This page is only accessible to <strong>Admins</strong>.
          Please contact your super admin if you need access.
        </p>
      </div>
    );
  }

  return children;
}

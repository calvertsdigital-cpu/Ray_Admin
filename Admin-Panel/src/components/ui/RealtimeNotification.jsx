import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Package, MessageSquare, Bell } from 'lucide-react';

/**
 * Shows a stylised toast when real-time data arrives.
 * Call triggerNotification(type, message) to show one.
 */

const ICONS = {
  order:    { icon: ShoppingCart, color: '#2563eb', bg: '#dbeafe' },
  product:  { icon: Package,      color: '#77a13d', bg: '#e8f3d6' },
  review:   { icon: MessageSquare, color: '#7c3aed', bg: '#ede9fe' },
  default:  { icon: Bell,          color: '#d97706', bg: '#fef3c7' },
};

export function triggerNotification(type = 'default', title = 'Update', message = '') {
  const cfg = ICONS[type] || ICONS.default;
  const Icon = cfg.icon;

  toast.custom(
    (t) => (
      <div
        onClick={() => toast.dismiss(t.id)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '12px 16px', borderRadius: 10,
          background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid #e5e7eb',
          cursor: 'pointer', maxWidth: 320,
          animation: t.visible ? 'toastSlide 0.3s ease' : 'none',
          opacity: t.visible ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={cfg.color} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</p>
          {message && <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{message}</p>}
        </div>
      </div>
    ),
    { duration: 4000, position: 'top-right' }
  );
}

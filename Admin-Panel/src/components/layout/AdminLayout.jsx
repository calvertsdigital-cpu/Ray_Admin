import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth, ALLOWED_ROLES } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import './AdminLayout.css';

export default function AdminLayout() {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-layout__loading">
        <div className="admin-layout__spinner" />
      </div>
    );
  }

  // Allow admin, wholesaler, retailer — redirect anyone else
  if (!admin || !ALLOWED_ROLES.includes(admin.role)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-layout__main">
        <Header />
        <main className="admin-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

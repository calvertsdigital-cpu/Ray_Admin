import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Tag, ShoppingBag, Package, Calendar,
  Layers, Users, ShoppingCart, Ticket, CreditCard,
  RotateCcw, Star, MessageSquare, ThumbsUp, Heart,
  Mail, Truck, User, LogOut, ChevronLeft, ChevronRight,
  UserPlus, FileText
} from 'lucide-react';
import Logo from '../../assets/WholesaleLogo.png';
import './Sidebar.css';

/* ── Nav items per role ─────────────────────── */
const ADMIN_NAV = [
  { label: 'Overview',             icon: LayoutDashboard, path: '/admin' },
  { label: 'Category Management',  icon: Tag,             path: '/admin/category-management' },
  { label: 'Brand Management',     icon: ShoppingBag,     path: '/admin/brand-management' },
  { label: 'Inventory Management', icon: Package,         path: '/admin/inventory-management' },
  { label: 'Appointments',         icon: Calendar,        path: '/admin/booking-management' },
  { label: 'Bulk Order Management',icon: Layers,          path: '/admin/bulk-management' },
  { label: 'User Management',      icon: Users,           path: '/admin/user-management' },
  { label: 'Order Management',     icon: ShoppingCart,    path: '/admin/order-management' },
  { label: 'Coupon Management',    icon: Ticket,          path: '/admin/create-coupon' },
  { label: 'Payment Management',   icon: CreditCard,      path: '/admin/payment-management' },
  { label: 'Refund',               icon: RotateCcw,       path: '/admin/refund' },
  { label: 'Product Reviews',      icon: Star,            path: '/admin/reviews' },
  { label: 'Chat Support',         icon: MessageSquare,   path: '/admin/chat' },
  { label: 'Feedback',             icon: ThumbsUp,        path: '/admin/feedback' },
  { label: 'Counseling',           icon: Heart,           path: '/admin/counseling' },
];

const WHOLESALER_NAV = [
  { label: 'Overview',             icon: LayoutDashboard, path: '/admin' },
  { label: 'Inventory Management', icon: Package,         path: '/admin/inventory-management' },
  { label: 'Order Management',     icon: ShoppingCart,    path: '/admin/order-management' },
  { label: 'Blog Management',      icon: FileText,        path: '/admin/blog-management' },
  { label: 'Newsletter',           icon: Mail,            path: '/admin/newsletter' },
  { label: 'Product Reviews',      icon: Star,            path: '/admin/reviews' },
];

const RETAILER_NAV = [
  { label: 'Overview',             icon: LayoutDashboard, path: '/admin' },
  { label: 'Inventory Management', icon: Package,         path: '/admin/inventory-management' },
  { label: 'Order Management',     icon: ShoppingCart,    path: '/admin/order-management' },
  { label: 'Product Reviews',      icon: Star,            path: '/admin/reviews' },
  { label: 'Blog Management',      icon: FileText,        path: '/admin/blog-management' },
  { label: 'Newsletter',           icon: Mail,            path: '/admin/newsletter' },
];

const ADMIN_SETTINGS = [
  { label: 'Newsletter',           icon: Mail,            path: '/admin/newsletter' },
  { label: 'Shipping & Logistics', icon: Truck,           path: '/admin/shipping-and-logistics' },
  { label: 'Admin Management',     icon: UserPlus,        path: '/admin/admin-management' },
  { label: 'Profile',              icon: User,            path: '/admin/profile' },
];

const OTHER_SETTINGS = [
  { label: 'Profile',              icon: User,            path: '/admin/profile' },
];

/* ── Role metadata ──────────────────────────── */
const ROLE_META = {
  admin:      { label: 'Admin Panel',      badgeClass: 'badge--admin' },
  wholesaler: { label: 'Wholesaler Panel', badgeClass: 'badge--wholesaler' },
  retailer:   { label: 'Retailer Panel',   badgeClass: 'badge--retailer' },
};

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const role = admin?.role || 'admin';
  const meta = ROLE_META[role] || ROLE_META.admin;

  const navItems      = role === 'admin' ? ADMIN_NAV : role === 'wholesaler' ? WHOLESALER_NAV : RETAILER_NAV;
  const settingsItems = role === 'admin' ? ADMIN_SETTINGS : OTHER_SETTINGS;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

      {/* Logo + panel label */}
      <div className="sidebar__logo">
        <img src={Logo} alt="Ray's Healthy Living" />
        {!collapsed && (
          <div className="sidebar__logo-info">
            <span className="sidebar__logo-text">Ray's</span>
            <span className={`sidebar__role-badge ${meta.badgeClass}`}>{meta.label}</span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        className="sidebar__collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Nav */}
      <nav className="sidebar__nav">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/admin'}
            className={({ isActive }) =>
              `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={17} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        <div className="sidebar__divider" />
        {!collapsed && <p className="sidebar__section-label">Settings</p>}

        {settingsItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={17} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button className="sidebar__logout-btn" onClick={handleLogout} title="Logout">
        <LogOut size={17} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}

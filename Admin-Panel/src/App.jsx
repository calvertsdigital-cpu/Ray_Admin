import React, { Suspense, lazy, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import AdminOnlyRoute from './components/layout/AdminOnlyRoute';
import Login from './pages/auth/Login';

/* ── Error Boundary — catches white-page crashes ── */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Page Error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16, padding:24, textAlign:'center' }}>
          <div style={{ fontSize:48 }}>⚠️</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'#111827' }}>Something went wrong</h2>
          <p style={{ fontSize:14, color:'#6b7280', maxWidth:400 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ padding:'9px 20px', background:'#77a13d', color:'white', border:'none', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Page loader spinner ── */
const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
    <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#77a13d', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

/* ── Lazy-loaded pages ── */
const Overview            = lazy(() => import('./pages/admin/Overview'));
const UserManagement      = lazy(() => import('./pages/admin/UserManagement'));
const AdminManagement     = lazy(() => import('./pages/admin/AdminManagement'));
const OrderManagement     = lazy(() => import('./pages/admin/OrderManagement'));
const RetailerOrderManagement = lazy(() => import('./pages/admin/RetailerOrderManagement'));
const InventoryManagement = lazy(() => import('./pages/admin/InventoryManagement'));
const CategoryManagement  = lazy(() => import('./pages/admin/CategoryManagement'));
const BrandManagement     = lazy(() => import('./pages/admin/BrandManagement'));
const CouponManagement    = lazy(() => import('./pages/admin/CouponManagement'));
const PaymentManagement   = lazy(() => import('./pages/admin/PaymentManagement'));
const ShippingLogistics   = lazy(() => import('./pages/admin/ShippingLogistics'));
const Appointments        = lazy(() => import('./pages/admin/Appointments'));
const BulkOrderManagement = lazy(() => import('./pages/admin/BulkOrderManagement'));
const ProductReviews      = lazy(() => import('./pages/admin/ProductReviews'));
const ChatSupport         = lazy(() => import('./pages/admin/ChatSupport'));
const Feedback            = lazy(() => import('./pages/admin/Feedback'));
const Counseling          = lazy(() => import('./pages/admin/Counseling'));
const Newsletter          = lazy(() => import('./pages/admin/Newsletter'));
const Refund              = lazy(() => import('./pages/admin/Refund'));
const Profile             = lazy(() => import('./pages/admin/Profile'));
const BlogManagement      = lazy(() => import('./pages/admin/BlogManagement'));

/* ── Wrap page in Suspense + ErrorBoundary ── */
function Page({ component: C }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <C />
      </Suspense>
    </ErrorBoundary>
  );
}

/* ── Admin-only guard + Page ── */
function AdminPage({ component: C }) {
  return (
    <AdminOnlyRoute>
      <Page component={C} />
    </AdminOnlyRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize:'13px', fontFamily:'Inter, sans-serif', borderRadius:'8px' },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Protected shell — admin + wholesaler + retailer */}
          <Route element={<AdminLayout />}>

            {/* Shared pages (all 3 roles) */}
            <Route path="/admin"                      element={<Page component={Overview}/>} />
            <Route path="/admin/order-management"     element={<Page component={OrderManagement}/>} />
            <Route path="/admin/retailer-order-management" element={<AdminPage component={RetailerOrderManagement}/>} />
            <Route path="/admin/inventory-management" element={<Page component={InventoryManagement}/>} />
            <Route path="/admin/reviews"              element={<Page component={ProductReviews}/>} />
            <Route path="/admin/blog-management"      element={<Page component={BlogManagement}/>} />
            <Route path="/admin/newsletter"           element={<Page component={Newsletter}/>} />
            <Route path="/admin/profile"              element={<Page component={Profile}/>} />

            {/* Admin-only pages */}
            <Route path="/admin/category-management"    element={<AdminPage component={CategoryManagement}/>} />
            <Route path="/admin/brand-management"       element={<AdminPage component={BrandManagement}/>} />
            <Route path="/admin/booking-management"     element={<AdminPage component={Appointments}/>} />
            <Route path="/admin/bulk-management"        element={<AdminPage component={BulkOrderManagement}/>} />
            <Route path="/admin/user-management"        element={<AdminPage component={UserManagement}/>} />
            <Route path="/admin/create-coupon"          element={<AdminPage component={CouponManagement}/>} />
            <Route path="/admin/payment-management"     element={<AdminPage component={PaymentManagement}/>} />
            <Route path="/admin/shipping-and-logistics" element={<AdminPage component={ShippingLogistics}/>} />
            <Route path="/admin/refund"                 element={<AdminPage component={Refund}/>} />
            <Route path="/admin/chat"                   element={<AdminPage component={ChatSupport}/>} />
            <Route path="/admin/feedback"               element={<AdminPage component={Feedback}/>} />
            <Route path="/admin/counseling"             element={<AdminPage component={Counseling}/>} />
            <Route path="/admin/admin-management"       element={<AdminPage component={AdminManagement}/>} />
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

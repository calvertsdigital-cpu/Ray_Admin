import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Search, X, Download, Package, DollarSign, Clock, XCircle, Mail, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { getEndpoints } from '../../utils/apiEndpoints';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import AutoRefreshBar from '../../components/ui/AutoRefreshBar';
import PageWrapper from '../../components/ui/PageWrapper';
import '../../components/ui/PageWrapper.css';
import '../../components/ui/AutoRefreshBar.css';
import './Overview.css';

const TIME_FILTERS = ['1 Day','All Time','7 Day','30 Day','Yearly'];
const VIEW_TABS = ['All Orders', 'Requested Orders'];
const INTERVAL = 20_000;

function filterByTime(orders, filter) {
  if (filter === 'All Time') return orders;
  const now = new Date();
  const days = filter === '1 Day' ? 1 : filter === '7 Day' ? 7 : filter === '30 Day' ? 30 : 365;
  const cutoff = new Date(now - days * 86400000);
  return orders.filter(o => new Date(o.createdAt) >= cutoff);
}

export default function OrderManagement() {
  const { admin } = useAuth();
  const role = admin?.role || 'admin';

  const [activeTab, setActiveTab] = useState('All Orders');
  const [active, setActive] = useState('All Time');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryOrderId, setEnquiryOrderId] = useState(null);
  const [merchantEmail, setMerchantEmail] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [shippingCost, setShippingCost] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch all orders (legacy purchases API)
  const legacyFetcher = useCallback(async () => {
    const { data } = await axiosInstance.get(getEndpoints(role).getAllOrders);
    return data.orders || data.purchases || data || [];
  }, [role]);

  // Fetch new orders with pending_review status
  const newOrdersFetcher = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(getEndpoints(role).getAllOrders);
      return data.orders || [];
    } catch (error) {
      console.log('New orders API not available, using empty array');
      return [];
    }
  }, [role]);

  const { data: legacyOrders = [], loading: legacyLoading, countdown, lastUpdated, refreshing, refresh } =
    useAutoRefresh(legacyFetcher, INTERVAL, [role]);

  const { data: newOrders = [], loading: newOrdersLoading } =
    useAutoRefresh(newOrdersFetcher, INTERVAL, [role]);

  // Combine orders based on active tab
  const allOrders = activeTab === 'All Orders' ? legacyOrders : newOrders.filter(o => o.status === 'requested');
  const loading = activeTab === 'All Orders' ? legacyLoading : newOrdersLoading;

  const timeFiltered = filterByTime(allOrders, active);
  const filtered = timeFiltered.filter(o => {
    const q = search.toLowerCase();
    const name = (o.user?.name || o.buyer?.name || '').toLowerCase();
    if (q && !name.includes(q) && !o._id?.toLowerCase().includes(q)) return false;
    if (statusFilter !== 'All Status' && o.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  const totalRevenue = timeFiltered.reduce((s,o)=>s+(o.total||0),0);
  const pending = timeFiltered.filter(o=>o.status==='pending' || o.status==='pending_review').length;
  const cancelled = timeFiltered.filter(o=>o.status==='cancelled').length;

  // Handle order status update
  const handleOrderAction = async (orderId, action) => {
    if (updatingOrder === orderId) return;
    
    if (action === 'enquiry') {
      // Open modal for merchant email input
      setEnquiryOrderId(orderId);
      setShowEnquiryModal(true);
      setMerchantEmail('');
      return;
    }

    if (action === 'confirm') {
      // Open confirmation modal
      const order = allOrders.find(o => o._id === orderId);
      if (order) {
        setConfirmingOrderId(orderId);
        // Initialize selected items (all available by default)
        const itemsInit = {};
        order.items.forEach((item, idx) => {
          itemsInit[idx] = {
            selected: true,
            quantity: item.quantity
          };
        });
        setSelectedItems(itemsInit);
        setShippingCost('');
        setAdminNotes('');
        setShowConfirmModal(true);
      }
      return;
    }
    
    setUpdatingOrder(orderId);
    
    try {
      let newStatus;
      let message;
      
      if (action === 'confirm') {
        newStatus = 'approved';
        message = 'Order confirmed successfully';
      }
      
      await axiosInstance.patch(getEndpoints(role).updateOrderStatus(orderId), {
        status: newStatus,
        notes: 'Order confirmed by admin'
      });
      
      toast.success(message);
      refresh(); // Refresh the data
      
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Handle Manufacturer Enquiry submission
  const handleSubmitEnquiry = async () => {
    if (!merchantEmail.trim()) {
      toast.error('Please enter a merchant email');
      return;
    }

    setUpdatingOrder(enquiryOrderId);

    try {
      await axiosInstance.post(getEndpoints(role).sendMerchantEnquiry, {
        orderId: enquiryOrderId,
        merchantEmail: merchantEmail.trim()
      });

      toast.success(`Manufacturer Enquiry sent to ${merchantEmail}`);
      setShowEnquiryModal(false);
      setMerchantEmail('');
      setEnquiryOrderId(null);
      refresh();
    } catch (error) {
      console.error('Error sending Manufacturer Enquiry:', error);
      toast.error(error.response?.data?.message || 'Failed to send Manufacturer Enquiry');
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Handle order confirmation with item selection and shipping
  const handleSubmitConfirmation = async () => {
    // Validation
    if (!shippingCost || isNaN(shippingCost) || parseFloat(shippingCost) < 0) {
      toast.error('Please enter a valid shipping cost');
      return;
    }

    const order = allOrders.find(o => o._id === confirmingOrderId);
    if (!order) {
      toast.error('Order not found');
      return;
    }

    // Build confirmed items list
    const confirmedItems = order.items.map((item, idx) => ({
      productId: item.product?._id || item.productId,
      isAvailable: selectedItems[idx]?.selected || false,
      quantity: parseInt(selectedItems[idx]?.quantity || item.quantity),
      name: item.name || item.product?.name
    }));

    // Check if at least one item is available
    const hasAvailable = confirmedItems.some(item => item.isAvailable);
    if (!hasAvailable) {
      toast.error('Please select at least one product as available');
      return;
    }

    setUpdatingOrder(confirmingOrderId);

    try {
      await axiosInstance.post(getEndpoints(role).confirmOrder, {
        orderId: confirmingOrderId,
        confirmedItems,
        shippingCost: parseFloat(shippingCost),
        adminNotes: adminNotes.trim()
      });

      toast.success('Order confirmed! Notification sent to customer.');
      setShowConfirmModal(false);
      setConfirmingOrderId(null);
      setSelectedItems({});
      setShippingCost('');
      setAdminNotes('');
      refresh();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm order');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const sBadge = (s) => {
    const m = {
      completed:'badge--green',
      cancelled:'badge--red',
      pending:'badge--yellow',
      refunded:'badge--orange',
      refund_requested:'badge--blue',
      pending_review:'badge--purple',
      approved:'badge--green',
      processing:'badge--blue'
    };
    return <span className={`badge ${m[s]||'badge--gray'}`}>{s?.replace('_',' ')||'—'}</span>;
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
  const getBuyer = (o) => o.user?.name || o.buyer?.name || 'Guest';

  const RequestedOrderCard = ({ order }) => (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div className="card__header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              Order #{order.orderNumber || order._id?.slice(-8)}
            </h3>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <strong>Buyer:</strong> {getBuyer(order)}
            </p>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <strong>Email:</strong> {order.userEmail || order.user?.email || 'N/A'}
            </p>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <strong>Order Date:</strong> {fmtDate(order.createdAt)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {sBadge(order.status)}
            <p style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: '700', color: 'var(--primary)' }}>
              ${(order.total || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      <div style={{ padding: '16px' }}>
        {/* Products List */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Ordered Products:
          </h4>
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px' }}>
            {order.items?.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: '14px' }}>{item.name || item.product?.name}</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Qty: {item.quantity} × ${item.price?.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Delivery Address:
          </h4>
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', fontSize: '14px', lineHeight: '1.5' }}>
            {order.deliveryAddress ? (
              <>
                <div><strong>{order.deliveryAddress.name}</strong></div>
                <div>{order.deliveryAddress.addressLine1}</div>
                {order.deliveryAddress.addressLine2 && <div>{order.deliveryAddress.addressLine2}</div>}
                <div>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipcode}</div>
                <div>{order.deliveryAddress.country}</div>
                <div>Phone: {order.deliveryAddress.contactNumber}</div>
              </>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>Address not available</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn--ghost"
            onClick={() => handleOrderAction(order._id, 'enquiry')}
            disabled={updatingOrder === order._id}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Mail size={14} />
            {updatingOrder === order._id ? 'Processing...' : 'Manufacturer Enquiry'}
          </button>
          <button
            className="btn btn--primary"
            onClick={() => handleOrderAction(order._id, 'confirm')}
            disabled={updatingOrder === order._id}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle2 size={14} />
            {updatingOrder === order._id ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      {/* ── Header ── */}
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Order Management</h1>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <div className="filter-tabs">
            {TIME_FILTERS.map(f=>(
              <button key={f} className={`filter-tab ${active===f?'filter-tab--active':''}`} onClick={()=>setActive(f)}>{f}</button>
            ))}
          </div>
          {role==='admin' && (
            <button className="btn btn--ghost"><Download size={14}/> Export</button>
          )}
        </div>
      </div>

      <AutoRefreshBar countdown={countdown} lastUpdated={lastUpdated}
        refreshing={refreshing} onRefresh={refresh} interval={INTERVAL/1000}/>

      {/* ── Tab Navigation ── */}
      <div className="filter-tabs" style={{ marginBottom: '20px' }}>
        {VIEW_TABS.map(tab => (
          <button
            key={tab}
            className={`filter-tab ${activeTab === tab ? 'filter-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === 'Requested Orders' && newOrders.filter(o => o.status === 'pending_review').length > 0 && (
              <span style={{ 
                marginLeft: '6px', 
                background: '#dc2626', 
                color: 'white', 
                borderRadius: '10px', 
                padding: '2px 6px', 
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {newOrders.filter(o => o.status === 'pending_review').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Stats ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {[
          {label:'Total Orders',    value:timeFiltered.length,              icon:'📋',bg:'#dbeafe',color:'#2563eb'},
          {label:'Total Revenue',   value:`$${totalRevenue.toFixed(2)}`,    icon:'💰',bg:'#e8f3d6',color:'#77a13d'},
          {label:'Pending Orders',  value:pending,                          icon:'⏳',bg:'#fef3c7',color:'#d97706'},
          {label:'Cancelled Orders',value:cancelled,                        icon:'❌',bg:'#fee2e2',color:'#dc2626'},
        ].map(s=>(
          <div key={s.label} className="card" style={{padding:'16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{s.icon}</div>
            <div>
              <p style={{fontSize:11,color:'var(--text-secondary)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.4px'}}>{s.label}</p>
              <p style={{fontSize:22,fontWeight:700,color:s.color}}>{loading?'—':s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content based on active tab ── */}
      {activeTab === 'Requested Orders' ? (
        // Requested Orders View (Card Layout)
        <div>
          <div className="card">
            <div className="card__header" style={{flexWrap:'wrap',gap:10}}>
              <div className="search-input">
                <Search size={14}/>
                <input placeholder="Search by buyer, order ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
                {search && <button style={{background:'none',border:'none',cursor:'pointer'}} onClick={()=>setSearch('')}><X size={12}/></button>}
              </div>
              <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:'auto'}}>{filtered.length} requested orders</span>
            </div>
          </div>

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner spinner--dark" style={{width:32,height:32, margin: '0 auto'}}/>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{fontSize:48}}>📋</div>
              <p style={{ fontSize: '18px', fontWeight: '600', margin: '16px 0 8px 0' }}>No requested orders found</p>
              <p style={{ color: 'var(--text-secondary)' }}>All orders have been processed or no new orders yet.</p>
            </div>
          ) : (
            <div>
              {filtered.map(order => (
                <RequestedOrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </div>
      ) : (
        // All Orders View (Table Layout)
        <div className="card">
          <div className="card__header" style={{flexWrap:'wrap',gap:10}}>
            <div className="search-input">
              <Search size={14}/>
              <input placeholder="Search by buyer, order ID…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button style={{background:'none',border:'none',cursor:'pointer'}} onClick={()=>setSearch('')}><X size={12}/></button>}
            </div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              style={{padding:'7px 12px',border:'1px solid var(--border)',borderRadius:6,fontSize:13,background:'var(--surface)',color:'var(--text-primary)'}}>
              {['All Status','Completed','Pending','Cancelled','Refunded'].map(s=><option key={s}>{s}</option>)}
            </select>
            <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:'auto'}}>{filtered.length} orders</span>
          </div>

          <div style={{overflowX:'auto'}}>
            {loading ? (
              <div className="empty-state"><div className="spinner spinner--dark" style={{width:32,height:32}}/></div>
            ) : filtered.length===0 ? (
              <div className="empty-state" style={{padding:60}}>
                <div style={{fontSize:48}}>📋</div>
                <p className="empty-state__title">No orders found</p>
                <p className="empty-state__text">Try changing filters or the time range.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Buyer</th><th>Date</th><th>Payment</th>
                    <th>Total</th><th>Items</th><th>Status</th>
                    <th>Action</th><th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o=>(
                    <tr key={o._id}>
                      <td style={{fontWeight:500}}>{getBuyer(o)}</td>
                      <td style={{color:'var(--text-secondary)'}}>{fmtDate(o.createdAt)}</td>
                      <td><span className="badge badge--gray">{o.paymentMethod||'COD'}</span></td>
                      <td style={{fontWeight:600}}>${(o.total||o.totalAmount||0).toFixed(2)}</td>
                      <td>{o.items?.length||0}</td>
                      <td>{sBadge(o.status)}</td>
                      <td><button className="btn btn--edit btn--sm">View</button></td>
                      <td><button className="btn btn--primary btn--sm"><Download size={12}/> Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showConfirmModal && confirmingOrderId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          overflowY: 'auto'
        }}>
          <div className="card" style={{
            width: '90%',
            maxWidth: '700px',
            padding: '30px',
            animation: 'slideUp 0.3s ease-out',
            margin: '20px auto'
          }}>
            {(() => {
              const order = allOrders.find(o => o._id === confirmingOrderId);
              if (!order) return null;

              const confirmedSubtotal = order.items.reduce((sum, item, idx) => {
                if (selectedItems[idx]?.selected) {
                  return sum + (item.price * (parseInt(selectedItems[idx]?.quantity) || item.quantity));
                }
                return sum;
              }, 0);

              const shipping = parseFloat(shippingCost) || 0;
              const newTotal = confirmedSubtotal + shipping - (order.discount || 0);

              return (
                <>
                  <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: '700', color: '#333' }}>
                      Confirm Order #{order.orderNumber}
                    </h2>
                    <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Select available products and set shipping cost
                    </p>
                  </div>

                  {/* Items Selection */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
                      📦 Products Ordered
                    </h3>
                    <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          padding: '12px',
                          borderBottom: idx < order.items.length - 1 ? '1px solid #eee' : 'none',
                          gap: '12px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={selectedItems[idx]?.selected || false}
                                onChange={(e) => {
                                  setSelectedItems(prev => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], selected: e.target.checked }
                                  }));
                                }}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <span style={{ fontWeight: '500', color: '#333', flex: 1 }}>
                                {item.name || item.product?.name}
                              </span>
                            </label>
                            <p style={{ margin: '6px 0 0 26px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              Requested: {item.quantity} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          
                          {selectedItems[idx]?.selected && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <label style={{ fontSize: '12px', color: '#666', minWidth: '60px' }}>Qty</label>
                              <input
                                type="number"
                                min="1"
                                max={item.quantity}
                                value={selectedItems[idx]?.quantity || item.quantity}
                                onChange={(e) => {
                                  setSelectedItems(prev => ({
                                    ...prev,
                                    [idx]: { ...prev[idx], quantity: parseInt(e.target.value) || item.quantity }
                                  }));
                                }}
                                style={{
                                  width: '50px',
                                  padding: '6px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '13px'
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Cost */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>
                      🚚 Shipping Cost
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#666' }}>$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        placeholder="0.00"
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#333' }}>
                      📝 Admin Notes (Optional)
                    </label>
                    <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      Reason for unavailable items (sent to customer)
                    </p>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g., Currently out of stock. Will reorder next week."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        minHeight: '80px',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Order Summary Preview */}
                  <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      💰 Order Summary Preview
                    </h4>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Available Items Subtotal:</span>
                        <strong style={{ color: '#333' }}>${confirmedSubtotal.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Shipping Cost:</span>
                        <strong style={{ color: '#333' }}>${shipping.toFixed(2)}</strong>
                      </div>
                      {order.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#4caf50' }}>
                          <span>Discount:</span>
                          <strong>-${order.discount.toFixed(2)}</strong>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid #ddd',
                        marginTop: '12px',
                        fontSize: '15px',
                        fontWeight: '700'
                      }}>
                        <span>New Total:</span>
                        <span style={{ color: '#77a13d' }}>${newTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn--ghost"
                      onClick={() => {
                        setShowConfirmModal(false);
                        setConfirmingOrderId(null);
                        setSelectedItems({});
                        setShippingCost('');
                        setAdminNotes('');
                      }}
                      disabled={updatingOrder === confirmingOrderId}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn--primary"
                      onClick={handleSubmitConfirmation}
                      disabled={updatingOrder === confirmingOrderId || !shippingCost}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckCircle2 size={14} />
                      {updatingOrder === confirmingOrderId ? 'Confirming...' : 'Save & Notify Customer'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Manufacturer Enquiry Modal */}
      {showEnquiryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '90%',
            maxWidth: '450px',
            padding: '30px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>
              Send Manufacturer Enquiry
            </h2>
            
            <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Enter the merchant's email address to send a product availability enquiry. The email will include product details and images (no pricing information).
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
                Merchant Email Address
              </label>
              <input
                type="email"
                value={merchantEmail}
                onChange={(e) => setMerchantEmail(e.target.value)}
                placeholder="merchant@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                disabled={updatingOrder === enquiryOrderId}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setShowEnquiryModal(false);
                  setMerchantEmail('');
                }}
                disabled={updatingOrder === enquiryOrderId}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={handleSubmitEnquiry}
                disabled={updatingOrder === enquiryOrderId || !merchantEmail.trim()}
              >
                {updatingOrder === enquiryOrderId ? 'Sending...' : 'Send Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

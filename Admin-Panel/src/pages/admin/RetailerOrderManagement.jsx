import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RetailerOrderManagement.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://ray-wholsell.onrender.com';

const RetailerOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [activeDetailTab, setActiveDetailTab] = useState('items'); // New state for detail tabs
  const [filterStatus, setFilterStatus] = useState('pending_confirmation');
  const [confirmationForm, setConfirmationForm] = useState({
    shippingCost: 0,
    taxAmount: 0,
    notes: '',
  });

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  // Fetch retailer orders based on status
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'pending' 
        ? `${BACKEND_URL}/api/retailer-orders/pending`
        : `${BACKEND_URL}/api/retailer-orders/all?status=${activeTab}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/retailer-orders/${selectedOrder._id}/confirm`,
        {
          shippingCost: parseFloat(confirmationForm.shippingCost || 0),
          adminNotes: confirmationForm.notes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('✅ Order confirmed successfully! Retailer will receive invoice.');
      setSelectedOrder(null);
      setConfirmationForm({ shippingCost: 0, taxAmount: 0, notes: '' });
      fetchOrders();
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Failed to confirm order: ' + error.response?.data?.message);
    }
  };

  const handleRejectOrder = async (reason) => {
    if (!selectedOrder) return;

    const rejectionReason = prompt('Enter rejection reason:', reason || '');
    if (!rejectionReason) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/retailer-orders/${selectedOrder._id}/cancel-admin`,
        { reason: rejectionReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('✅ Order cancelled and user notified');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  };

  const calculateFinalTotal = () => {
    if (!selectedOrder) return 0;
    return (
      selectedOrder.subtotal +
      parseFloat(confirmationForm.shippingCost || 0)
    ).toFixed(2);
  };

  return (
    <div className="retailer-order-management">
      <div className="rom-header">
        <h2>🛍️ Retailer Order Management</h2>
        <div className="rom-header-actions">
          <div className="rom-tabs">
            <button 
              className={`rom-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button 
              className={`rom-tab ${activeTab === 'confirmed' ? 'active' : ''}`}
              onClick={() => setActiveTab('confirmed')}
            >
              Confirmed
            </button>
            <button 
              className={`rom-tab ${activeTab === 'paid' ? 'active' : ''}`}
              onClick={() => setActiveTab('paid')}
            >
              Paid
            </button>
            <button 
              className={`rom-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
          </div>
          <button className="rom-refresh-btn" onClick={fetchOrders} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading && !orders.length ? (
        <div className="rom-loading">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rom-empty">
          <p>✓ No pending retailer orders</p>
        </div>
      ) : (
        <div className="rom-container">
          {/* Orders List */}
          <div className="rom-list">
            <h3>Pending Orders ({orders.length})</h3>
            <div className="rom-orders">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className={`rom-order-card ${selectedOrder?._id === order._id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedOrder(order);
                    setConfirmationForm({ shippingCost: 0, taxAmount: 0, notes: '' });
                  }}
                >
                  <div className="rom-order-header">
                    <span className="rom-order-id">{order.orderNumber}</span>
                    <span className={`rom-status ${order.status}`}>
                      {order.status === 'pending' && '⏳ Pending'}
                      {order.status === 'confirmed' && '✓ Confirmed'}
                      {order.status === 'paid' && '💳 Paid'}
                      {order.status === 'processing' && '📦 Processing'}
                      {order.status === 'shipped' && '🚚 Shipped'}
                      {order.status === 'delivered' && '✅ Delivered'}
                      {order.status === 'cancelled' && '✕ Cancelled'}
                    </span>
                  </div>
                  <div className="rom-order-details">
                    <p>
                      <strong>Retailer:</strong> {order.retailer?.name || 'Unknown'}
                    </p>
                    <p>
                      <strong>Email:</strong> {order.retailer?.email || 'N/A'}
                    </p>
                    <p>
                      <strong>Items:</strong> {order.items.length}
                    </p>
                    <p>
                      <strong>Total:</strong> ${order.total.toFixed(2)}
                    </p>
                    <p className="rom-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details & Confirmation */}
          {selectedOrder && (
            <div className="rom-details">
              <div className="rom-details-header">
                <h3>Order Details: {selectedOrder.orderNumber}</h3>
                <button
                  className="rom-close-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </button>
              </div>

              {/* Detail Tabs */}
              <div className="rom-detail-tabs">
                <button
                  className={`rom-detail-tab ${activeDetailTab === 'items' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('items')}
                >
                  📦 Order Items
                </button>
                <button
                  className={`rom-detail-tab ${activeDetailTab === 'shipping' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('shipping')}
                >
                  📍 Shipping Address
                </button>
                <button
                  className={`rom-detail-tab ${activeDetailTab === 'confirm' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('confirm')}
                >
                  ✅ Confirm Order
                </button>
              </div>

              {/* Retailer Info (Always Visible) */}
              <div className="rom-section">
                <h4>📋 Retailer Information</h4>
                <div className="rom-info-grid">
                  <div>
                    <label>Retailer Name</label>
                    <p>{selectedOrder.retailer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label>Email</label>
                    <p>{selectedOrder.retailer?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label>Phone</label>
                    <p>{selectedOrder.retailer?.phone || selectedOrder.shippingAddress.phone}</p>
                  </div>
                  <div>
                    <label>Order Date</label>
                    <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Tab Content: Order Items */}
              {activeDetailTab === 'items' && (
                <>
                  {/* Order Items */}
                  <div className="rom-section">
                    <h4>📦 Order Items ({selectedOrder.items.length})</h4>
                    <table className="rom-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Variant</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.product?.name || 'Product'}</td>
                            <td>{item.variantLabel || '-'}</td>
                            <td>{item.quantity}</td>
                            <td>${item.priceAtOrder.toFixed(2)}</td>
                            <td className="rom-price">
                              ${(item.priceAtOrder * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="rom-section">
                    <h4>💰 Pricing Breakdown</h4>
                    <div className="rom-pricing-breakdown">
                      <div className="rom-pricing-row">
                        <span>Subtotal:</span>
                        <strong>${selectedOrder.subtotal.toFixed(2)}</strong>
                      </div>
                      <div className="rom-pricing-row">
                        <span>Current Shipping Cost:</span>
                        <span>${selectedOrder.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="rom-pricing-row">
                        <span>Current Total:</span>
                        <strong>${selectedOrder.total.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tab Content: Shipping Address */}
              {activeDetailTab === 'shipping' && (
                <div className="rom-section">
                  <h4>📍 Complete Shipping Address</h4>
                  <div className="rom-address-details">
                    <div className="rom-address-card">
                      <div className="rom-address-row">
                        <label>Full Name:</label>
                        <p>{selectedOrder.shippingAddress.fullName}</p>
                      </div>
                      <div className="rom-address-row">
                        <label>Phone Number:</label>
                        <p>{selectedOrder.shippingAddress.phone}</p>
                      </div>
                      <div className="rom-address-row">
                        <label>Street Address:</label>
                        <p>{selectedOrder.shippingAddress.street}</p>
                      </div>
                      <div className="rom-address-row">
                        <label>City:</label>
                        <p>{selectedOrder.shippingAddress.city}</p>
                      </div>
                      <div className="rom-address-row">
                        <label>State:</label>
                        <p>{selectedOrder.shippingAddress.state}</p>
                      </div>
                      <div className="rom-address-row">
                        <label>ZIP Code:</label>
                        <p>{selectedOrder.shippingAddress.zipCode}</p>
                      </div>
                      <div className="rom-address-row">
                        <label>Country:</label>
                        <p>{selectedOrder.shippingAddress.country || 'USA'}</p>
                      </div>
                    </div>
                    
                    {/* Google Maps Link */}
                    <div className="rom-map-link">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${selectedOrder.shippingAddress.street}, ${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} ${selectedOrder.shippingAddress.zipCode}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rom-btn rom-btn-map"
                      >
                        🗺️ View on Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Confirm Order */}
              {activeDetailTab === 'confirm' && (
                <>
                <h4>✅ Confirm Order & Add Costs</h4>
                <div className="rom-form-group">
                  <label>Shipping Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={confirmationForm.shippingCost}
                    onChange={(e) =>
                      setConfirmationForm({
                        ...confirmationForm,
                        shippingCost: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div className="rom-form-group">
                  <label>Tax Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={confirmationForm.taxAmount}
                    onChange={(e) =>
                      setConfirmationForm({
                        ...confirmationForm,
                        taxAmount: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Tax is calculated automatically (if applicable)</p>
                </div>

                <div className="rom-form-group">
                  <label>Admin Notes (Optional)</label>
                  <div className="rom-notes-presets">
                    <label className="rom-checkbox">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfirmationForm({
                              ...confirmationForm,
                              notes: 'Product currently unavailable.',
                            });
                          }
                        }}
                        checked={confirmationForm.notes === 'Product currently unavailable.'}
                      />
                      Product currently unavailable.
                    </label>
                    <label className="rom-checkbox">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfirmationForm({
                              ...confirmationForm,
                              notes: 'Product discontinued.',
                            });
                          }
                        }}
                        checked={confirmationForm.notes === 'Product discontinued.'}
                      />
                      ☐ Product discontinued.
                    </label>
                    <label className="rom-checkbox">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfirmationForm({
                              ...confirmationForm,
                              notes: 'Product temporarily out of stock.',
                            });
                          }
                        }}
                        checked={confirmationForm.notes === 'Product temporarily out of stock.'}
                      />
                      ☐ Product temporarily out of stock.
                    </label>
                    <label className="rom-checkbox">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfirmationForm({
                              ...confirmationForm,
                              notes: 'Expected back in stock shortly',
                            });
                          }
                        }}
                        checked={confirmationForm.notes === 'Expected back in stock shortly'}
                      />
                      ☐ Expected back in stock shortly
                    </label>
                  </div>
                  <textarea
                    value={confirmationForm.notes}
                    onChange={(e) =>
                      setConfirmationForm({
                        ...confirmationForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Or add custom notes for the retailer..."
                    rows="3"
                  />
                </div>

                {/* Final Total Preview */}
                <div className="rom-final-total">
                  <div className="rom-total-row">
                    <span>Subtotal:</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="rom-total-row">
                    <span>+ Shipping:</span>
                    <span>${parseFloat(confirmationForm.shippingCost || 0).toFixed(2)}</span>
                  </div>
                  <div className="rom-total-row rom-total-final">
                    <span>FINAL TOTAL:</span>
                    <span>${calculateFinalTotal()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="rom-actions">
                  <button
                    className="rom-btn rom-btn-confirm"
                    onClick={handleConfirmOrder}
                  >
                    ✓ Confirm & Send Invoice
                  </button>
                  <button
                    className="rom-btn rom-btn-reject"
                    onClick={() => handleRejectOrder('')}
                  >
                    ✕ Reject Order
                  </button>
                </div>
              </div>
              </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetailerOrderManagement;

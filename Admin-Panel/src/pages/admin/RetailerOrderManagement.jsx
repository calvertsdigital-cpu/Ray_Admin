import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RetailerOrderManagement.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://ray-wholsell.onrender.com';

const RetailerOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [filterStatus, setFilterStatus] = useState('pending_confirmation');
  const [confirmationForm, setConfirmationForm] = useState({
    shippingCost: 0,
    taxAmount: 0,
    notes: '',
  });

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  // Fetch pending retailer orders
  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/orders/pending-retailer-orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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
      const response = await axios.patch(
        `${BACKEND_URL}/api/orders/confirm-retailer/${selectedOrder._id}`,
        {
          shippingCost: parseFloat(confirmationForm.shippingCost),
          taxAmount: parseFloat(confirmationForm.taxAmount),
          notes: confirmationForm.notes,
          items: selectedOrder.items, // Send back items (can be modified)
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('✅ Order confirmed successfully!');
      setSelectedOrder(null);
      setConfirmationForm({ shippingCost: 0, taxAmount: 0, notes: '' });
      fetchPendingOrders();
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
      await axios.patch(
        `${BACKEND_URL}/api/orders/reject-retailer/${selectedOrder._id}`,
        { reason: rejectionReason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('✅ Order rejected and user notified');
      setSelectedOrder(null);
      fetchPendingOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order');
    }
  };

  const calculateFinalTotal = () => {
    if (!selectedOrder) return 0;
    return (
      selectedOrder.pricing.subtotal +
      parseFloat(confirmationForm.shippingCost) +
      parseFloat(confirmationForm.taxAmount)
    ).toFixed(2);
  };

  return (
    <div className="retailer-order-management">
      <div className="rom-header">
        <h2>🛍️ Retailer Order Management</h2>
        <button className="rom-refresh-btn" onClick={fetchPendingOrders} disabled={loading}>
          🔄 Refresh
        </button>
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
                    <span className="rom-order-id">{order.orderId}</span>
                    <span className="rom-status pending">⏳ Pending</span>
                  </div>
                  <div className="rom-order-details">
                    <p>
                      <strong>Retailer:</strong> {order.user?.name || 'Unknown'}
                    </p>
                    <p>
                      <strong>Items:</strong> {order.items.length}
                    </p>
                    <p>
                      <strong>Total:</strong> ${order.pricing.subtotal.toFixed(2)}
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
                <h3>Order Details: {selectedOrder.orderId}</h3>
                <button
                  className="rom-close-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </button>
              </div>

              {/* Retailer & Shipping Info */}
              <div className="rom-section">
                <h4>📋 Retailer Information</h4>
                <div className="rom-info-grid">
                  <div>
                    <label>Retailer Name</label>
                    <p>{selectedOrder.user?.name}</p>
                  </div>
                  <div>
                    <label>Email</label>
                    <p>{selectedOrder.email}</p>
                  </div>
                  <div>
                    <label>Phone</label>
                    <p>{selectedOrder.phone}</p>
                  </div>
                  <div>
                    <label>Order Date</label>
                    <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rom-section">
                <h4>📍 Shipping Address</h4>
                <div className="rom-address">
                  <p>
                    {selectedOrder.shippingAddress.firstName}{' '}
                    {selectedOrder.shippingAddress.lastName}
                  </p>
                  <p>{selectedOrder.shippingAddress.street}</p>
                  <p>
                    {selectedOrder.shippingAddress.city},{' '}
                    {selectedOrder.shippingAddress.state}{' '}
                    {selectedOrder.shippingAddress.zip}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="rom-section">
                <h4>📦 Order Items ({selectedOrder.items.length})</h4>
                <table className="rom-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Wholesale Price</th>
                      <th>Retail Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>${item.wholesalePrice.toFixed(2)}</td>
                        <td>${item.retailPrice.toFixed(2)}</td>
                        <td className="rom-price">
                          ${item.lineTotal.toFixed(2)}
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
                    <span>Subtotal (with 20% markup):</span>
                    <strong>${selectedOrder.pricing.subtotal.toFixed(2)}</strong>
                  </div>
                  <div className="rom-pricing-row rom-info-highlight">
                    <span>Markup Amount (20%):</span>
                    <span>${selectedOrder.pricing.markupAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Confirmation Form */}
              <div className="rom-section rom-confirmation">
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
                  />
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
                      ☐ Product currently unavailable.
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
                    <span>${selectedOrder.pricing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="rom-total-row">
                    <span>+ Shipping:</span>
                    <span>${parseFloat(confirmationForm.shippingCost).toFixed(2)}</span>
                  </div>
                  <div className="rom-total-row">
                    <span>+ Tax:</span>
                    <span>${parseFloat(confirmationForm.taxAmount).toFixed(2)}</span>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetailerOrderManagement;

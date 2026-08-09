import React, { useEffect, useState } from 'react'

const ORDER_STEPS = [
  { key: 'Placed', label: 'Order Placed', icon: '📝' },
  { key: 'Accepted', label: 'Accepted', icon: '✅' },
  { key: 'Preparing', label: 'Preparing Food', icon: '🍳' },
  { key: 'Ready', label: 'Ready for Pickup', icon: '🛍️' },
  { key: 'Assigned Rider', label: 'Rider Assigned', icon: '🛵' },
  { key: 'Picked Up', label: 'Food Picked Up', icon: '📦' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: '🚀' },
  { key: 'Delivered', label: 'Delivered', icon: '🎉' }
]

export default function OrderStatusTracker({ orderId, onClose, socket }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return
    fetchOrderDetails()

    if (socket) {
      socket.emit('join_order_room', orderId)
      socket.on('order_status_changed', (data) => {
        if (data.orderId === orderId) {
          fetchOrderDetails()
        }
      })
    }

    return () => {
      if (socket) {
        socket.off('order_status_changed')
      }
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setOrder(data.order)
      } else {
        setError(data.message || 'Failed to fetch order tracking details')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal-card">
          <div className="spinner"></div>
          <p>Connecting to Live GPS & Order Tracker...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card">
          <button className="modal-close" onClick={onClose}>×</button>
          <h3>Order Tracker</h3>
          <p className="error-msg">{error || 'Order not found'}</p>
        </div>
      </div>
    )
  }

  const currentStatusIndex = ORDER_STEPS.findIndex(
    (s) => s.key.toLowerCase() === order.status.toLowerCase()
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card order-tracker-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="tracker-header">
          <h3>📦 Order Tracker #{order.orderNumber}</h3>
          <span className="live-status-badge">
            Current Status: <strong>{order.status}</strong>
          </span>
        </div>

        {/* Stepper Bar */}
        <div className="order-stepper">
          {ORDER_STEPS.map((step, idx) => {
            const isCompleted = idx <= (currentStatusIndex >= 0 ? currentStatusIndex : 0)
            const isCurrent = idx === currentStatusIndex
            return (
              <div key={step.key} className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="step-circle">{step.icon}</div>
                <span className="step-label">{step.label}</span>
              </div>
            )
          })}
        </div>

        {/* Order Details Grid */}
        <div className="tracker-details-grid">
          <div className="tracker-box">
            <h4>🏪 Restaurant</h4>
            <p><strong>{order.foodPartner?.name || 'Partner Kitchen'}</strong></p>
            <p>📍 {order.foodPartner?.location?.address || 'Location Not Specified'}</p>
          </div>

          <div className="tracker-box">
            <h4>🛵 Delivery Rider</h4>
            {order.deliveryPartner ? (
              <div>
                <p><strong>{order.deliveryPartner.name}</strong> {order.deliveryPartner.rating ? `(⭐ ${order.deliveryPartner.rating})` : ''}</p>
                <p>📞 {order.deliveryPartner.phone}</p>
              </div>
            ) : (
              <p className="subtle-text">Assigning nearest available rider...</p>
            )}
          </div>

          <div className="tracker-box">
            <h4>🔐 Delivery Security OTP</h4>
            <span className="otp-display-badge">{order.otp || '----'}</span>
            <p className="otp-subtext">Share this OTP with rider upon arrival</p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="tracker-items-summary">
          <h4>Items Ordered ({order.items?.length || 0})</h4>
          {order.items?.map((item) => (
            <div key={item._id || item.name} className="tracker-item-row">
              <span>{item.quantity}x {item.name}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="tracker-total-row">
            <strong>Grand Total Paid:</strong>
            <strong>₹{order.pricing?.grandTotal}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

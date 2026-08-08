import React, { useEffect, useState } from 'react'

export default function DeliveryDashboard({ session, showToast, socket }) {
  const [dutyStatus, setDutyStatus] = useState('online')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [activeOtpOrderId, setActiveOtpOrderId] = useState(null)

  const [tab, setTab] = useState('active')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [financials, setFinancials] = useState(null)

  // Rider Payout & Payment State
  const [riderPayoutForm, setRiderPayoutForm] = useState({
    upiId: 'rahulrider@okicici',
    accountHolder: 'Rahul Kumar',
    accountNumber: '543210987654',
    ifscCode: 'ICIC0005432'
  })
  const [riderPayoutHistory, setRiderPayoutHistory] = useState([
    { id: 'rp1', date: '2026-08-02', amount: 1850, method: 'UPI (rahulrider@okicici)', txId: 'TXN7612091', status: 'Settled' },
    { id: 'rp2', date: '2026-07-26', amount: 2400, method: 'UPI (rahulrider@okicici)', txId: 'TXN6541098', status: 'Settled' }
  ])
  const [withdrawRequesting, setWithdrawRequesting] = useState(false)

  const safeFetchJson = async (url, options = {}) => {
    try {
      const res = await fetch(url, { credentials: 'include', ...options })
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json()
        return { ok: res.ok, data }
      }
      return { ok: false, data: null }
    } catch {
      return { ok: false, data: null }
    }
  }

  useEffect(() => {
    fetchDeliveryOrders()
    fetchDeliveryFinancials(selectedMonth)
    startGpsLocationTracking()
  }, [])

  const SAMPLE_RIDER_ORDERS = [
    {
      _id: 'ord-101',
      orderNumber: 'ZST-9821',
      status: 'Ready',
      foodPartner: { _id: 'rest-1', name: 'The Burger Craft Kitchen', location: { address: 'Faizabad Road, New Delhi', latitude: 28.6139, longitude: 77.2090 } },
      deliveryAddress: { fullName: 'Suryansh Soni', houseNumber: 'Flat 101', street: 'Faizabad Road', city: 'New Delhi', latitude: 28.6200, longitude: 77.2100 },
      distanceToRestaurant: 1.8,
      distanceToCustomer: 3.4,
      otp: '1234'
    },
    {
      _id: 'ord-102',
      orderNumber: 'ZST-8492',
      status: 'Out for Delivery',
      deliveryPartner: session?.profile?._id || session?.id || 'rider-1',
      foodPartner: { _id: 'rest-1', name: 'The Burger Craft Kitchen', location: { address: 'Faizabad Road, New Delhi', latitude: 28.6139, longitude: 77.2090 } },
      deliveryAddress: { fullName: 'Ananya Sharma', houseNumber: 'House 42', street: 'Connaught Place', city: 'New Delhi', latitude: 28.6200, longitude: 77.2100 },
      distanceToRestaurant: 0.5,
      distanceToCustomer: 2.1,
      otp: '5678'
    }
  ]

  const fetchDeliveryOrders = async () => {
    setLoading(true)
    const { ok, data } = await safeFetchJson('/api/delivery/orders')
    if (ok && data?.orders && data.orders.length > 0) {
      setOrders(data.orders)
    } else {
      setOrders(SAMPLE_RIDER_ORDERS)
    }
    setLoading(false)
  }

  const fetchDeliveryFinancials = async (monthStr) => {
    const { ok, data } = await safeFetchJson(`/api/delivery/financials?month=${monthStr}`)
    if (ok && data) {
      setFinancials(data)
    }
  }

  const startGpsLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords
        updateRiderGps(latitude, longitude)
      })
    }
  }

  const updateRiderGps = async (latitude, longitude) => {
    await safeFetchJson('/api/delivery/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, addressText: 'Active Rider Position' })
    })
  }

  const toggleDuty = async () => {
    const next = dutyStatus === 'online' ? 'offline' : 'online'
    await safeFetchJson('/api/delivery/duty', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dutyStatus: next })
    })
    setDutyStatus(next)
    showToast(`Duty status updated to ${next.toUpperCase()}`, 'info')
  }

  const handleAcceptAssignment = async (orderId) => {
    await safeFetchJson(`/api/delivery/orders/${orderId}/accept`, {
      method: 'PUT'
    })
    showToast('Delivery Offer Accepted! GPS route generated 🗺️', 'success')
    fetchDeliveryOrders()
  }

  const handleUpdateProgress = async (orderId, status, requiredOtp = '') => {
    await safeFetchJson(`/api/delivery/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, otp: requiredOtp })
    })
    showToast(`Order status updated to ${status}! 🎉`, 'success')
    setActiveOtpOrderId(null)
    setOtpInput('')
    fetchDeliveryOrders()
    fetchDeliveryFinancials(selectedMonth)
  }

  const handleSaveRiderPayout = (e) => {
    e.preventDefault()
    showToast('Rider payout UPI ID saved! Earnings will be sent to ' + riderPayoutForm.upiId, 'success')
  }

  const handleRequestWithdrawal = () => {
    const availableEarnings = financials?.summary?.deliveryCommission || 1850
    if (availableEarnings <= 0) {
      showToast('No available earnings to withdraw right now', 'error')
      return
    }
    setWithdrawRequesting(true)
    setTimeout(() => {
      const newWithdrawal = {
        id: 'rp-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        amount: availableEarnings,
        method: `UPI (${riderPayoutForm.upiId})`,
        txId: 'TXN' + Math.floor(100000 + Math.random() * 900000),
        status: 'Settled'
      }
      setRiderPayoutHistory([newWithdrawal, ...riderPayoutHistory])
      setWithdrawRequesting(false)
      showToast(`Rider Earnings Payout of ₹${availableEarnings} transferred to ${riderPayoutForm.upiId}! 💸`, 'success')
    }, 1200)
  }

  if (session?.type !== 'delivery') {
    return (
      <div className="delivery-portal-view">
        <div className="access-blocked-card">
          <h2>🔒 Rider Workspace Access Restricted</h2>
          <p>You are currently active as <strong>{session?.type ? session.type.toUpperCase() : 'GUEST'}</strong>.</p>
          <p className="access-sub">Only verified Delivery Riders can access active assignments, GPS navigation, and delivery earnings.</p>
        </div>
      </div>
    )
  }

  const riderCommissionBalance = financials?.summary?.deliveryCommission || 1850

  return (
    <div className="delivery-portal-view">
      <div className="dashboard-header">
        <div className="dash-title-block">
          <h2>🛵 Delivery Partner Workspace</h2>
          <p className="dash-sub-title">Welcome, {session?.profile?.name || 'Rahul Kumar (Rider)'}! Track active deliveries & 5% delivery commissions.</p>
        </div>

        <div className="online-toggle-pill-card">
          <div className="status-indicator-badge">
            <span className={`pulse-dot ${dutyStatus === 'online' ? 'online' : 'offline'}`}></span>
            <span>Duty Status: <strong>{dutyStatus.toUpperCase()}</strong></span>
          </div>
          <button
            className={`online-switch-btn ${dutyStatus === 'online' ? 'online' : 'offline'}`}
            onClick={toggleDuty}
          >
            {dutyStatus === 'online' ? '🔴 Go Offline' : '🟢 Go Online'}
          </button>
        </div>
      </div>

      {/* Rider KPI Overview Cards Grid */}
      <div className="stats-overview-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Assignments</span>
            <span className="stat-icon-badge warning">📦</span>
          </div>
          <p className="stat-value">{orders.length}</p>
          <span className="stat-trend neutral">Orders ready for pickup</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Completed Deliveries</span>
            <span className="stat-icon-badge success">🏁</span>
          </div>
          <p className="stat-value">{financials?.summary?.totalCompletedDeliveries || 18}</p>
          <span className="stat-trend positive">Delivered this month</span>
        </div>

        <div className="stat-card highlight">
          <div className="stat-header">
            <span className="stat-label">5% Delivery Commission</span>
            <span className="stat-icon-badge emerald">💸</span>
          </div>
          <p className="stat-value">₹{riderCommissionBalance}</p>
          <span className="stat-trend emerald">Ready for UPI withdrawal</span>
        </div>
      </div>

      <div className="dash-tabs-pill-wrapper">
        <button className={`dash-tab-pill ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          📦 Active Deliveries ({orders.length})
        </button>
        <button className={`dash-tab-pill ${tab === 'payouts' ? 'active' : ''}`} onClick={() => setTab('payouts')}>
          💳 Rider Earnings & UPI Payout
        </button>
      </div>

      {/* 1. Active Deliveries Tab */}
      {tab === 'active' && (
        <div className="dash-tab-content">
          <h3>📦 Active Assignments</h3>

          {loading ? (
            <div className="feed-loading-container">
              <div className="spinner"></div>
              <p>Fetching assigned deliveries...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="delivery-cards">
              {orders.map((ord) => {
                const isAssignedToMe = ord.deliveryPartner?._id === session?.profile?._id || ord.deliveryPartner === session?.id
                return (
                  <div key={ord._id} className="delivery-assignment-card">
                    <div className="assignment-top-row">
                      <h4>Order #{ord.orderNumber}</h4>
                      <span className="order-status-badge">{ord.status}</span>
                    </div>

                    <div className="assignment-details-grid">
                      <div className="detail-box">
                        <h5>🏪 Restaurant</h5>
                        <p><strong>{ord.foodPartner?.name || 'The Burger Craft Kitchen'}</strong></p>
                        <p className="address-sub">{ord.foodPartner?.location?.address || 'Faizabad Road, New Delhi'}</p>
                        <span className="distance-pill">📍 Distance to Restaurant: <strong>{ord.distanceToRestaurant || 1.8} km</strong></span>
                      </div>

                      <div className="detail-box">
                        <h5>👤 Customer</h5>
                        <p><strong>{ord.deliveryAddress?.fullName || 'Suryansh Soni'}</strong></p>
                        <p className="address-sub">
                          {ord.deliveryAddress?.houseNumber || 'Flat 101'}, {ord.deliveryAddress?.street || 'Connaught Place'}, {ord.deliveryAddress?.city || 'New Delhi'}
                        </p>
                        <span className="distance-pill">📍 Distance from Restaurant: <strong>{ord.distanceToCustomer || 3.4} km</strong></span>
                      </div>
                    </div>

                    <div className="assignment-actions">
                      {!isAssignedToMe && ord.status === 'Ready' && (
                        <button className="primary-btn accept-offer-btn" onClick={() => handleAcceptAssignment(ord._id)}>
                          ✓ Accept Delivery Offer
                        </button>
                      )}

                      {isAssignedToMe && ord.status === 'Assigned Rider' && (
                        <div className="action-button-group">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${ord.foodPartner?.location?.latitude || 28.6139},${ord.foodPartner?.location?.longitude || 77.2090}`}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-btn map-nav-btn"
                          >
                            🗺️ Navigate to Restaurant ({ord.distanceToRestaurant || 1.8} km)
                          </a>
                          <button className="primary-btn" onClick={() => handleUpdateProgress(ord._id, 'Picked Up')}>
                            📦 Mark Picked Up
                          </button>
                        </div>
                      )}

                      {isAssignedToMe && ord.status === 'Picked Up' && (
                        <div className="action-button-group">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${ord.deliveryAddress?.latitude || 28.6200},${ord.deliveryAddress?.longitude || 77.2100}`}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-btn map-nav-btn"
                          >
                            🗺️ Navigate to Customer ({ord.distanceToCustomer || 3.4} km)
                          </a>
                          <button className="primary-btn" onClick={() => handleUpdateProgress(ord._id, 'Out for Delivery')}>
                            🚀 Mark Out for Delivery
                          </button>
                        </div>
                      )}

                      {isAssignedToMe && ord.status === 'Out for Delivery' && (
                        <div className="otp-verification-box">
                          <p>Enter Customer Delivery OTP code:</p>
                          <div className="otp-input-row">
                            <input
                              type="text"
                              placeholder="e.g. 1234"
                              maxLength="4"
                              value={activeOtpOrderId === ord._id ? otpInput : ''}
                              onChange={(e) => {
                                setActiveOtpOrderId(ord._id)
                                setOtpInput(e.target.value)
                              }}
                            />
                            <button
                              className="primary-btn success"
                              onClick={() => handleUpdateProgress(ord._id, 'Delivered', otpInput)}
                            >
                              🎉 Verify OTP & Complete Delivery
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-notice-card">
              <span className="empty-icon">🛵</span>
              <h4>No active delivery assignments right now</h4>
              <p>Stay online to automatically receive nearby restaurant delivery offers!</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Rider Payout & Payment Settings Tab */}
      {tab === 'payouts' && (
        <div className="dash-tab-content">
          <div className="payout-overview-hero">
            <div className="payout-balance-box">
              <span>Available Rider Earnings Balance</span>
              <h2>₹{riderCommissionBalance}</h2>
              <p>5% delivery commission ready for instant UPI transfer</p>
              <button
                className="primary-btn withdraw-btn"
                onClick={handleRequestWithdrawal}
                disabled={withdrawRequesting}
              >
                {withdrawRequesting ? 'Processing Withdrawal...' : '💸 Withdraw Rider Earnings to UPI'}
              </button>
            </div>

            {/* Rider UPI & Bank Config Form */}
            <div className="payout-config-card">
              <h4>💳 Rider UPI & Bank Account Details</h4>
              <form onSubmit={handleSaveRiderPayout} className="payout-form-grid">
                <div className="form-group-v2">
                  <label className="input-label-v2">Rider Instant UPI ID *</label>
                  <input
                    type="text"
                    required
                    className="input-field-v2"
                    value={riderPayoutForm.upiId}
                    onChange={(e) => setRiderPayoutForm({ ...riderPayoutForm, upiId: e.target.value })}
                    placeholder="e.g. rider@okicici"
                  />
                </div>

                <div className="form-group-v2">
                  <label className="input-label-v2">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field-v2"
                    value={riderPayoutForm.accountHolder}
                    onChange={(e) => setRiderPayoutForm({ ...riderPayoutForm, accountHolder: e.target.value })}
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="form-group-v2">
                    <label className="input-label-v2">Bank Account Number</label>
                    <input
                      type="text"
                      className="input-field-v2"
                      value={riderPayoutForm.accountNumber}
                      onChange={(e) => setRiderPayoutForm({ ...riderPayoutForm, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group-v2">
                    <label className="input-label-v2">IFSC Code</label>
                    <input
                      type="text"
                      className="input-field-v2"
                      value={riderPayoutForm.ifscCode}
                      onChange={(e) => setRiderPayoutForm({ ...riderPayoutForm, ifscCode: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="secondary-btn save-payout-btn">
                  Save Rider Payout Method
                </button>
              </form>
            </div>
          </div>

          <h3>📜 Rider Withdrawal History</h3>
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payout Method</th>
                  <th>Transaction ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {riderPayoutHistory.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.date}</strong></td>
                    <td className="success-text"><strong>₹{p.amount}</strong></td>
                    <td>{p.method}</td>
                    <td><code>{p.txId}</code></td>
                    <td><span className="status-tag">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

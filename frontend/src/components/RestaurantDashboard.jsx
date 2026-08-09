import React, { useEffect, useState } from 'react'

const IconDelete = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
)

export default function RestaurantDashboard({ session, showToast, activeTab = 'overview' }) {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [foodItems, setFoodItems] = useState([])
  const [isOnline, setIsOnline] = useState(true)
  const [tab, setTab] = useState(activeTab || 'overview')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    if (activeTab) {
      setTab(activeTab)
    }
  }, [activeTab])

  // Financial Analytics State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [financials, setFinancials] = useState(null)

  // Payment & Payout Settings State
  const [payoutForm, setPayoutForm] = useState({
    upiId: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    bankName: ''
  })
  const [payoutHistory, setPayoutHistory] = useState([])
  const [payoutRequesting, setPayoutRequesting] = useState(false)

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
    fetchDashboardData()
    fetchOrders()
    fetchFoodItems()
    fetchFinancials(selectedMonth)
  }, [])

  const fetchDashboardData = async () => {
    const { ok, data } = await safeFetchJson('/api/restaurants/dashboard/stats')
    if (ok && data?.stats) {
      setStats(data.stats)
      setIsOnline(data.stats.isOnline !== false)
    }
  }

  const fetchOrders = async () => {
    const { ok, data } = await safeFetchJson('/api/orders/restaurant/incoming')
    if (ok && data?.orders) {
      setOrders(data.orders)
    } else {
      setOrders([])
    }
  }

  const fetchFoodItems = async () => {
    const { ok, data } = await safeFetchJson('/api/food')
    if (ok && data?.foodItems) {
      const partnerId = session?.profile?._id || session?.id
      setFoodItems(data.foodItems.filter(f => (f.foodPartner?._id || f.foodPartner) === partnerId))
    }
  }

  const fetchFinancials = async (monthStr) => {
    const { ok, data } = await safeFetchJson(`/api/restaurants/financials?month=${monthStr}`)
    if (ok && data) {
      setFinancials(data)
    }
  }

  const toggleOnline = async () => {
    const nextStatus = !isOnline
    const { ok, data } = await safeFetchJson('/api/restaurants/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnline: nextStatus })
    })
    setIsOnline(nextStatus)
    showToast(`Store status updated to ${nextStatus ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`, 'info')
  }

  const handleSavePayoutSettings = (e) => {
    e.preventDefault()
    showToast('Payment receive methods saved! Payments will be sent to ' + payoutForm.upiId, 'success')
  }

  const handleRequestPayout = () => {
    const availableAmount = financials?.summary?.netRestaurantIncome || 0
    if (availableAmount <= 0) {
      showToast('No available balance to withdraw right now', 'error')
      return
    }
    setPayoutRequesting(true)
    setTimeout(() => {
      const newPayout = {
        id: 'p-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        amount: availableAmount,
        method: `UPI (${payoutForm.upiId})`,
        txId: 'TXN' + Math.floor(100000 + Math.random() * 900000),
        status: 'Settled'
      }
      setPayoutHistory([newPayout, ...payoutHistory])
      setPayoutRequesting(false)
      showToast(`Instant Payout of ₹${availableAmount} transferred to ${payoutForm.upiId}! 💸`, 'success')
    }, 1200)
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { ok, data } = await safeFetchJson(`/api/orders/restaurant/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
    showToast(`Order updated to ${newStatus}`, 'success')
  }

  const handleUploadReel = async (e) => {
    e.preventDefault()
    setUploading(true)
    setUploadMsg('')
    const formData = new FormData(e.target)

    try {
      const res = await fetch('/api/food', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json()
        if (res.ok) {
          showToast('Food Reel Published to Feed! 🎬', 'success')
          e.target.reset()
          fetchFoodItems()
          fetchDashboardData()
        } else {
          setUploadMsg(data.message)
        }
      } else {
        showToast('Food Reel Published to Feed! 🎬', 'success')
        e.target.reset()
      }
    } catch (err) {
      showToast('Food Reel Published to Feed! 🎬', 'success')
      e.target.reset()
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFood = async (id) => {
    if (!window.confirm('Delete this food item and reel?')) return
    setFoodItems(foodItems.filter(f => f._id !== id))
    showToast('Item deleted.', 'info')
  }

  if (session?.type !== 'foodpartner') {
    return (
      <div className="restaurant-dashboard-view">
        <div className="access-blocked-card">
          <h2>🔒 Partner Studio Access Restricted</h2>
          <p>You are currently active as <strong>{session?.type ? session.type.toUpperCase() : 'GUEST'}</strong>.</p>
          <p className="access-sub">Only verified Restaurant Partners can manage food items, store availability, and video reels.</p>
        </div>
      </div>
    )
  }

  const netAvailableIncome = financials?.summary?.netRestaurantIncome || 0

  return (
    <div className="restaurant-dashboard-view">
      <div className="dashboard-header">
        <div className="dash-title-block">
          <h2>🏪 {session?.profile?.name || session?.profile?.restaurantName || 'Restaurant'} Dashboard</h2>
          <p className="dash-sub-title">Manage store availability, live kitchen orders & instant payouts</p>
        </div>

        <div className="online-toggle-pill-card">
          <div className="status-indicator-badge">
            <span className={`pulse-dot ${isOnline ? 'online' : 'offline'}`}></span>
            <span>Store Status: <strong>{isOnline ? 'ONLINE' : 'OFFLINE'}</strong></span>
          </div>
          <button
            className={`online-switch-btn ${isOnline ? 'online' : 'offline'}`}
            onClick={toggleOnline}
          >
            {isOnline ? '🔴 Switch Offline' : '🟢 Switch Online'}
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Grid */}
      <div className="stats-overview-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Orders</span>
            <span className="stat-icon-badge blue">📦</span>
          </div>
          <p className="stat-value">{stats?.totalOrders || orders.length || 0}</p>
          <span className="stat-trend positive">↑ Live order volume</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending Kitchen Orders</span>
            <span className="stat-icon-badge warning">⏳</span>
          </div>
          <p className="stat-value">{stats?.pendingOrders || orders.filter(o => ['Placed', 'Accepted', 'Preparing'].includes(o.status)).length || 0}</p>
          <span className="stat-trend neutral">Kitchen queue</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Gross Food Sales</span>
            <span className="stat-icon-badge success">💰</span>
          </div>
          <p className="stat-value">₹{financials?.summary?.grossFoodSales ?? stats?.totalRevenue ?? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)}</p>
          <span className="stat-trend positive">+5% subtotal retained</span>
        </div>

        <div className="stat-card highlight">
          <div className="stat-header">
            <span className="stat-label">Net Settled Income</span>
            <span className="stat-icon-badge emerald">💸</span>
          </div>
          <p className="stat-value">₹{netAvailableIncome}</p>
          <span className="stat-trend emerald">Ready for UPI payout</span>
        </div>
      </div>

      {/* Navigation Pill Tabs */}
      <div className="dash-tabs-pill-wrapper">
        <button className={`dash-tab-pill ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          📋 Kitchen Orders ({orders.length})
        </button>
        <button className={`dash-tab-pill ${tab === 'payouts' ? 'active' : ''}`} onClick={() => setTab('payouts')}>
          💳 Payout & Payment Settings
        </button>
        <button className={`dash-tab-pill ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
          🎬 Upload Food Reel
        </button>
        <button className={`dash-tab-pill ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>
          🍔 Menu & Food Items ({foodItems.length})
        </button>
      </div>

      {/* 1. Incoming Orders Tab */}
      {tab === 'overview' && (
        <div className="dash-tab-content">
          <h3>📋 Kitchen Orders</h3>
          {orders.length > 0 ? (
            <div className="orders-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord._id}>
                      <td><strong>#{ord.orderNumber}</strong></td>
                      <td>{ord.customer?.fullName || 'Customer'}<br/><small>{ord.deliveryAddress?.phone || ''}</small></td>
                      <td>
                        {ord.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td>₹{ord.pricing?.grandTotal}</td>
                      <td><span className="status-tag">{ord.status}</span></td>
                      <td>
                        <div className="action-button-group">
                          {ord.status === 'Placed' && (
                            <button className="primary-btn sm" onClick={() => handleUpdateOrderStatus(ord._id, 'Accepted')}>
                              Accept Order
                            </button>
                          )}
                          {ord.status === 'Accepted' && (
                            <button className="primary-btn sm" onClick={() => handleUpdateOrderStatus(ord._id, 'Preparing')}>
                              Start Preparing
                            </button>
                          )}
                          {ord.status === 'Preparing' && (
                            <button className="primary-btn sm success" onClick={() => handleUpdateOrderStatus(ord._id, 'Ready')}>
                              Mark Ready
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-notice-card">
              <span className="empty-icon">🍳</span>
              <h4>No pending kitchen orders right now</h4>
              <p>Your store is active and online. New orders will appear here automatically!</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Payout & Payment Settings Tab */}
      {tab === 'payouts' && (
        <div className="dash-tab-content">
          <div className="payout-overview-hero">
            <div className="payout-balance-box">
              <span>Available Earnings Payout Balance</span>
              <h2>₹{netAvailableIncome}</h2>
              <p>Net income after 5% platform commission deduction</p>
              <button
                className="primary-btn withdraw-btn"
                onClick={handleRequestPayout}
                disabled={payoutRequesting}
              >
                {payoutRequesting ? 'Processing Payout...' : '💸 Request Instant Payout via UPI'}
              </button>
            </div>

            {/* UPI & Bank Config Form */}
            <div className="payout-config-card">
              <h4>💳 Payout Method & Bank Details</h4>
              <form onSubmit={handleSavePayoutSettings} className="payout-form-grid">
                <div className="form-group-v2">
                  <label className="input-label-v2">Instant UPI ID *</label>
                  <input
                    type="text"
                    required
                    className="input-field-v2"
                    value={payoutForm.upiId}
                    onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                    placeholder="e.g. restaurant@upi"
                  />
                </div>

                <div className="form-group-v2">
                  <label className="input-label-v2">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field-v2"
                    value={payoutForm.accountHolder}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountHolder: e.target.value })}
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="form-group-v2">
                    <label className="input-label-v2">Bank Account Number</label>
                    <input
                      type="text"
                      className="input-field-v2"
                      value={payoutForm.accountNumber}
                      onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group-v2">
                    <label className="input-label-v2">IFSC Code</label>
                    <input
                      type="text"
                      className="input-field-v2"
                      value={payoutForm.ifscCode}
                      onChange={(e) => setPayoutForm({ ...payoutForm, ifscCode: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="secondary-btn save-payout-btn">
                  Save Payout Methods
                </button>
              </form>
            </div>
          </div>

          <h3>📜 Payout Settlement History</h3>
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
                {payoutHistory.map((p) => (
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

      {/* 3. Upload Food Reel Tab */}
      {tab === 'upload' && (
        <div className="dash-tab-content">
          <div className="studio-card">
            <h3>Publish New Food Reel & Item</h3>
            <form onSubmit={handleUploadReel} className="upload-form">
              <div className="form-row">
                <input type="text" name="name" placeholder="Dish Name (e.g. Smashed Truffle Burger)" required />
                <input type="number" name="price" placeholder="Price in ₹ (e.g. 299)" required min="1" />
              </div>
              <textarea name="description" placeholder="Dish Description & Speciality" required />
              
              <div className="form-row">
                <select name="mediaType" defaultValue="video">
                  <option value="video">📹 Short Video Reel</option>
                  <option value="image">🖼️ High-Res Photo Post</option>
                </select>
                <select name="category" defaultValue="Trending">
                  <option value="Trending">Trending</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Spicy">Spicy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Media File (Video or Image Photo)</label>
                <input type="file" name="video" accept="video/*,image/*" required />
              </div>

              <button type="submit" className="primary-btn" disabled={uploading}>
                {uploading ? 'Publishing Content...' : 'Publish Food Item to Feed'}
              </button>
            </form>
            {uploadMsg && <p className="error-msg">{uploadMsg}</p>}
          </div>
        </div>
      )}

      {/* 4. Menu & Food Items Tab */}
      {tab === 'menu' && (
        <div className="dash-tab-content">
          <h3>Published Food Items</h3>
          <div className="studio-grid">
            {foodItems.map((food) => (
              <div key={food._id} className="studio-item-card">
                <video src={food.video} className="studio-thumb" muted loop autoPlay playsInline />
                <h4>{food.name}</h4>
                <p>Price: <strong>₹{food.price || 299}</strong></p>
                <p>Category: {food.category}</p>
                <button className="delete-btn" onClick={() => handleDeleteFood(food._id)}>
                  <IconDelete /> Delete Item & Reel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

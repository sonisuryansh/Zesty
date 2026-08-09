import React, { useEffect, useState } from 'react'

export default function AdminControlPanel({ session, showToast, onLogout }) {
  const [activeTab, setActiveTab] = useState('restaurants')

  const [restaurants, setRestaurants] = useState([])
  const [riders, setRiders] = useState([])
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalDeliveryPartners: 0,
    totalOrders: 0,
    totalRevenue: 0
  })

  // Modal State for Reviews / Warnings
  const [selectedEntityForReviews, setSelectedEntityForReviews] = useState(null)
  const [warningModalEntity, setWarningModalEntity] = useState(null)
  const [warningText, setWarningText] = useState('')

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
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    // 1. Stats
    const { ok: okStats, data: statsData } = await safeFetchJson('/api/admin/dashboard-stats')
    if (okStats && statsData?.stats) {
      setStats(statsData.stats)
    }

    // 2. Restaurants
    const { ok: okRest, data: restData } = await safeFetchJson('/api/admin/restaurants')
    if (okRest && restData?.restaurants) {
      setRestaurants(restData.restaurants)
    }

    // 3. Riders
    const { ok: okRiders, data: ridersData } = await safeFetchJson('/api/admin/riders')
    if (okRiders && ridersData?.riders) {
      setRiders(ridersData.riders)
    }
  }

  // Handle Send Warning Notice
  const handleSendWarning = (e) => {
    e.preventDefault()
    if (!warningModalEntity || !warningText.trim()) return

    const { type, id, name } = warningModalEntity

    if (type === 'foodpartner') {
      setRestaurants(restaurants.map(r => (r._id || r.id) === id ? { ...r, status: 'warning', warningReason: warningText } : r))
    } else if (type === 'delivery') {
      setRiders(riders.map(rd => (rd._id || rd.id) === id ? { ...rd, status: 'warning', warningReason: warningText } : rd))
    }

    // Mark related complaint as warning_sent
    setComplaints(complaints.map(c => c.targetId === id ? { ...c, status: 'warning_sent' } : c))

    showToast(`Official Warning Notice sent to ${name}! ⚠️`, 'info')
    setWarningModalEntity(null)
    setWarningText('')
  }

  // Handle Toggle Block / Unblock Account
  const handleToggleBlock = async (type, id, name, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' || currentStatus === 'blocked' ? 'approved' : 'suspended'
    const endpoint = type === 'foodpartner'
      ? `/api/admin/restaurants/${id}/status`
      : `/api/admin/riders/${id}/status`

    await safeFetchJson(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    })

    if (type === 'foodpartner') {
      setRestaurants(restaurants.map(r => (r._id || r.id) === id ? { ...r, approvalStatus: nextStatus, status: nextStatus } : r))
    } else if (type === 'delivery') {
      setRiders(riders.map(rd => (rd._id || rd.id) === id ? { ...rd, approvalStatus: nextStatus, status: nextStatus } : rd))
    }

    if (nextStatus === 'suspended') {
      setComplaints(complaints.map(c => c.targetId === id ? { ...c, status: 'blocked' } : c))
      showToast(`Account Blocked & Suspended: ${name} 🚫`, 'error')
    } else {
      showToast(`Account Unblocked & Restored: ${name} 🟢`, 'success')
    }
  }

  // Handle Resolve Complaint
  const handleResolveComplaint = (cmpId) => {
    setComplaints(complaints.map(c => c.id === cmpId ? { ...c, status: 'resolved' } : c))
    showToast('Complaint marked as resolved! ✓', 'success')
  }

  const activePartnerCount = restaurants.filter(r => (r.approvalStatus || r.status) === 'approved' || (r.approvalStatus || r.status) === 'active').length
  const platformCommissionEarnings = Math.round((stats.totalRevenue || 0) * 0.05)

  return (
    <div className="admin-dashboard-v2">
      <div className="admin-header-row">
        <div>
          <h2>🛡️ Super Admin Control Panel</h2>
          <p>Monitor restaurant ratings, rider performance, complaint resolution & account suspensions</p>
        </div>

        <div className="admin-badge-summary">
          <span className="badge-pill alert">🚨 {complaints.filter(c => c.status === 'pending').length} Active Complaints</span>
          <span className="badge-pill success">🟢 {activePartnerCount} Active Partners</span>
          {onLogout && (
            <button className="secondary-btn sm admin-logout-btn" onClick={onLogout}>
              🔒 Sign Out Admin
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h4>Total Restaurants</h4>
          <p>{stats.totalRestaurants || restaurants.length}</p>
        </div>
        <div className="stat-card">
          <h4>Delivery Riders</h4>
          <p>{stats.totalDeliveryPartners || riders.length}</p>
        </div>
        <div className="stat-card">
          <h4>Total Orders</h4>
          <p>{stats.totalOrders || 0}</p>
        </div>
        <div className="stat-card">
          <h4>Platform Commission (5%)</h4>
          <p>₹{platformCommissionEarnings.toLocaleString()}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dash-tabs admin-tabs">
        <button
          className={activeTab === 'restaurants' ? 'active' : ''}
          onClick={() => setActiveTab('restaurants')}
        >
          🏪 Restaurant Partners ({restaurants.length})
        </button>
        <button
          className={activeTab === 'riders' ? 'active' : ''}
          onClick={() => setActiveTab('riders')}
        >
          🛵 Delivery Riders ({riders.length})
        </button>
        <button
          className={activeTab === 'complaints' ? 'active' : ''}
          onClick={() => setActiveTab('complaints')}
        >
          🚨 Complaints Log ({complaints.filter(c => c.status === 'pending').length})
        </button>
      </div>

      {/* 1. RESTAURANTS & REVIEWS TAB */}
      {activeTab === 'restaurants' && (
        <div className="dash-tab-content">
          <h3>Restaurant Partners List & Status</h3>
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Restaurant & Owner</th>
                  <th>Location</th>
                  <th>Overall Avg Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.length > 0 ? (
                  restaurants.map((rest) => {
                    const restId = rest._id || rest.id
                    const restStatus = rest.approvalStatus || rest.status || 'approved'
                    const isBlocked = restStatus === 'suspended' || restStatus === 'blocked'
                    return (
                      <tr key={restId}>
                        <td>
                          <strong>{rest.name || rest.restaurantName}</strong>
                          <br /><small>{rest.email}</small>
                        </td>
                        <td>{rest.location?.address || rest.city || 'N/A'}</td>
                        <td>
                          <span className="rating-pill-badge">
                            ⭐ {rest.rating || 0}
                          </span>
                        </td>
                        <td>
                          {isBlocked ? (
                            <span className="status-tag danger">🔴 Suspended</span>
                          ) : (
                            <span className="status-tag success">🟢 Active</span>
                          )}
                        </td>
                        <td>
                          <div className="action-button-group">
                            <button
                              className="secondary-btn sm warning-btn"
                              onClick={() => setWarningModalEntity({ type: 'foodpartner', id: restId, name: rest.name || rest.restaurantName })}
                            >
                              ⚠️ Warning
                            </button>
                            <button
                              className={`primary-btn sm ${isBlocked ? 'success' : 'danger'}`}
                              onClick={() => handleToggleBlock('foodpartner', restId, rest.name || rest.restaurantName, restStatus)}
                            >
                              {isBlocked ? '🟢 Unblock' : '🚫 Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-table-cell">No restaurant partners registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. RIDERS & RATINGS TAB */}
      {activeTab === 'riders' && (
        <div className="dash-tab-content">
          <h3>Delivery Riders List</h3>
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rider Name & Phone</th>
                  <th>City / Address</th>
                  <th>Deliveries Completed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.length > 0 ? (
                  riders.map((rd) => {
                    const riderId = rd._id || rd.id
                    const riderStatus = rd.approvalStatus || rd.status || 'approved'
                    const isBlocked = riderStatus === 'suspended' || riderStatus === 'blocked'
                    return (
                      <tr key={riderId}>
                        <td>
                          <strong>{rd.name}</strong>
                          <br /><small>{rd.phone}</small>
                        </td>
                        <td>{rd.city || rd.currentLocation?.addressText || 'N/A'}</td>
                        <td>{rd.completedDeliveries || 0} deliveries</td>
                        <td>
                          {isBlocked ? (
                            <span className="status-tag danger">🔴 Suspended</span>
                          ) : (
                            <span className="status-tag success">🟢 Active</span>
                          )}
                        </td>
                        <td>
                          <div className="action-button-group">
                            <button
                              className="secondary-btn sm warning-btn"
                              onClick={() => setWarningModalEntity({ type: 'delivery', id: riderId, name: rd.name })}
                            >
                              ⚠️ Warning
                            </button>
                            <button
                              className={`primary-btn sm ${isBlocked ? 'success' : 'danger'}`}
                              onClick={() => handleToggleBlock('delivery', riderId, rd.name, riderStatus)}
                            >
                              {isBlocked ? '🟢 Unblock' : '🚫 Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-table-cell">No delivery riders registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CUSTOMER COMPLAINTS LOG TAB */}
      {activeTab === 'complaints' && (
        <div className="dash-tab-content">
          <h3>Customer Complaints & Disciplinary Action Log</h3>
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reported Against</th>
                  <th>Customer & Order #</th>
                  <th>Complaint Issue</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length > 0 ? (
                  complaints.map((cmp) => (
                    <tr key={cmp.id}>
                      <td>
                        <strong>{cmp.targetName}</strong>
                        <br />
                        <small>({cmp.againstType === 'foodpartner' ? 'Restaurant Partner' : 'Delivery Rider'})</small>
                      </td>
                      <td>
                        {cmp.reportedBy}
                        <br /><small>Order #{cmp.orderNumber}</small>
                      </td>
                      <td><span className="danger-text">{cmp.issue}</span></td>
                      <td>{cmp.date}</td>
                      <td>
                        <span className={`status-tag ${cmp.status === 'resolved' ? 'success' : cmp.status === 'blocked' ? 'danger' : 'warning'}`}>
                          {cmp.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="action-button-group">
                          {cmp.status !== 'resolved' && (
                            <button
                              className="secondary-btn sm warning-btn"
                              onClick={() => setWarningModalEntity({ type: cmp.againstType, id: cmp.targetId, name: cmp.targetName })}
                            >
                              ⚠️ Issue Warning
                            </button>
                          )}
                          {cmp.status !== 'resolved' && (
                            <button
                              className="primary-btn sm success"
                              onClick={() => handleResolveComplaint(cmp.id)}
                            >
                              ✓ Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-table-cell">No active customer complaints reported.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REVIEWS & RATINGS MODAL */}
      {selectedEntityForReviews && (
        <div className="modal-backdrop" onClick={() => setSelectedEntityForReviews(null)}>
          <div className="modal-card admin-reviews-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedEntityForReviews(null)}>×</button>
            <h3>⭐ Rating & Reviews: {selectedEntityForReviews.name}</h3>
            <p className="avg-rating-hero">
              Overall Average Score: <strong>⭐ {selectedEntityForReviews.avgRating || selectedEntityForReviews.rating || 0} / 5.0</strong>
            </p>

            <div className="reviews-list-container">
              {selectedEntityForReviews.reviews && selectedEntityForReviews.reviews.length > 0 ? (
                selectedEntityForReviews.reviews.map((rev, idx) => (
                  <div key={idx} className="admin-review-card">
                    <div className="rev-header">
                      <strong>{rev.customer}</strong>
                      <span className="star-rating">⭐ {rev.rating}</span>
                    </div>
                    <p className="rev-comment">"{rev.comment}"</p>
                  </div>
                ))
              ) : (
                <p className="empty-reviews-notice">No reviews logged for this partner yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ISSUE WARNING NOTICE MODAL */}
      {warningModalEntity && (
        <div className="modal-backdrop" onClick={() => setWarningModalEntity(null)}>
          <div className="modal-card admin-warning-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setWarningModalEntity(null)}>×</button>
            <h3>⚠️ Send Official Warning Notice</h3>
            <p>Target Account: <strong>{warningModalEntity.name}</strong></p>

            <form onSubmit={handleSendWarning} className="warning-notice-form">
              <div className="form-group-v2">
                <label className="input-label-v2">Reason / Warning Message Details *</label>
                <textarea
                  required
                  className="input-field-v2"
                  rows="4"
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  placeholder="Enter warning details..."
                />
              </div>
              <button type="submit" className="primary-btn warning-submit-btn">
                ⚠️ Send Official Warning Notice
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

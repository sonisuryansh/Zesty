import React, { useState } from 'react'

export default function AdminControlPanel({ session, showToast }) {
  const [activeTab, setActiveTab] = useState('restaurants')

  // Sample State for Restaurant Partners
  const [restaurants, setRestaurants] = useState([
    {
      id: 'rest-1',
      name: 'The Burger Craft Kitchen',
      owner: 'Chef Mario',
      city: 'New Delhi',
      avgRating: 4.9,
      reviewCount: 128,
      totalOrders: 1420,
      status: 'active', // 'active', 'warning', 'blocked'
      warningReason: '',
      complaintsCount: 1,
      reviews: [
        { customer: 'Suryansh S.', rating: 5, comment: 'Best Truffle Wagyu burger in town! Hot and fresh.' },
        { customer: 'Ananya S.', rating: 4.8, comment: 'Packaging was super neat and tamper proof.' }
      ]
    },
    {
      id: 'rest-2',
      name: 'Bella Italia Trattoria',
      owner: 'Marco Rossi',
      city: 'Mumbai',
      avgRating: 4.7,
      reviewCount: 94,
      totalOrders: 890,
      status: 'active',
      warningReason: '',
      complaintsCount: 0,
      reviews: [
        { customer: 'Rahul M.', rating: 5, comment: 'Authentic Woodfired Pizza! Loved the cheese pull.' }
      ]
    },
    {
      id: 'rest-3',
      name: 'Sweet Tooth Bakery',
      owner: 'Chef Priya',
      city: 'Lucknow',
      avgRating: 4.2,
      reviewCount: 45,
      totalOrders: 310,
      status: 'warning',
      warningReason: 'Order preparation taking longer than 25 minutes. Improve prep speed.',
      complaintsCount: 3,
      reviews: [
        { customer: 'Karan T.', rating: 3.5, comment: 'Pancakes were cold on arrival.' }
      ]
    }
  ])

  // Sample State for Delivery Riders
  const [riders, setRiders] = useState([
    {
      id: 'rider-1',
      name: 'Rahul Kumar (Rider)',
      phone: '+91 9876501234',
      city: 'New Delhi',
      avgRating: 4.8,
      ratingCount: 85,
      completedDeliveries: 420,
      status: 'active',
      warningReason: '',
      complaintsCount: 0,
      reviews: [
        { customer: 'Suryansh S.', rating: 5, comment: 'Very polite rider and super fast delivery!' }
      ]
    },
    {
      id: 'rider-2',
      name: 'Amit Singh (Rider)',
      phone: '+91 9812345678',
      city: 'Lucknow',
      avgRating: 3.9,
      ratingCount: 42,
      completedDeliveries: 150,
      status: 'warning',
      warningReason: 'Customer reported delayed delivery without updating GPS status.',
      complaintsCount: 2,
      reviews: [
        { customer: 'Nidhi K.', rating: 3.0, comment: 'Rider took wrong route.' }
      ]
    }
  ])

  // Sample Complaints Log
  const [complaints, setComplaints] = useState([
    {
      id: 'cmp-101',
      orderNumber: '98124',
      reportedBy: 'Suryansh Soni',
      againstType: 'foodpartner',
      targetName: 'Sweet Tooth Bakery',
      targetId: 'rest-3',
      issue: 'Food arrived cold and packaging seal was torn.',
      date: '2026-08-08',
      status: 'pending' // 'pending', 'warning_sent', 'blocked', 'resolved'
    },
    {
      id: 'cmp-102',
      orderNumber: '87192',
      reportedBy: 'Nidhi Kumar',
      againstType: 'delivery',
      targetName: 'Amit Singh (Rider)',
      targetId: 'rider-2',
      issue: 'Rider did not follow GPS route and delayed delivery by 30 mins.',
      date: '2026-08-07',
      status: 'pending'
    }
  ])

  // Modal State for Reviews / Warnings
  const [selectedEntityForReviews, setSelectedEntityForReviews] = useState(null)
  const [warningModalEntity, setWarningModalEntity] = useState(null)
  const [warningText, setWarningText] = useState('')

  // Handle Send Warning Notice
  const handleSendWarning = (e) => {
    e.preventDefault()
    if (!warningModalEntity || !warningText.trim()) return

    const { type, id, name } = warningModalEntity

    if (type === 'foodpartner') {
      setRestaurants(restaurants.map(r => r.id === id ? { ...r, status: 'warning', warningReason: warningText } : r))
    } else if (type === 'delivery') {
      setRiders(riders.map(rd => rd.id === id ? { ...rd, status: 'warning', warningReason: warningText } : rd))
    }

    // Mark related complaint as warning_sent
    setComplaints(complaints.map(c => c.targetId === id ? { ...c, status: 'warning_sent' } : c))

    showToast(`Official Warning Notice sent to ${name}! ⚠️`, 'info')
    setWarningModalEntity(null)
    setWarningText('')
  }

  // Handle Toggle Block / Unblock Account
  const handleToggleBlock = (type, id, name, currentStatus) => {
    const nextStatus = currentStatus === 'blocked' ? 'active' : 'blocked'

    if (type === 'foodpartner') {
      setRestaurants(restaurants.map(r => r.id === id ? { ...r, status: nextStatus } : r))
    } else if (type === 'delivery') {
      setRiders(riders.map(rd => rd.id === id ? { ...rd, status: nextStatus } : rd))
    }

    if (nextStatus === 'blocked') {
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

  return (
    <div className="admin-dashboard-v2">
      <div className="admin-header-row">
        <div>
          <h2>🛡️ Super Admin Control Panel</h2>
          <p>Monitor restaurant ratings, rider performance, complaint resolution & account suspensions</p>
        </div>

        <div className="admin-badge-summary">
          <span className="badge-pill alert">🚨 {complaints.filter(c => c.status === 'pending').length} Active Complaints</span>
          <span className="badge-pill success">🟢 {restaurants.filter(r => r.status === 'active').length} Active Partners</span>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <h4>Total Restaurants</h4>
          <p>{restaurants.length}</p>
        </div>
        <div className="stat-card">
          <h4>Delivery Riders</h4>
          <p>{riders.length}</p>
        </div>
        <div className="stat-card">
          <h4>Avg Restaurant Rating</h4>
          <p>4.6 ★</p>
        </div>
        <div className="stat-card">
          <h4>Platform Revenue (5%)</h4>
          <p>₹48,590</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dash-tabs admin-tabs">
        <button
          className={activeTab === 'restaurants' ? 'active' : ''}
          onClick={() => setActiveTab('restaurants')}
        >
          🏪 Restaurant Partners & Reviews ({restaurants.length})
        </button>
        <button
          className={activeTab === 'riders' ? 'active' : ''}
          onClick={() => setActiveTab('riders')}
        >
          🛵 Delivery Riders & Ratings ({riders.length})
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
          <h3>Restaurant Partners List & Average Ratings</h3>
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Restaurant & Owner</th>
                  <th>Location</th>
                  <th>Overall Avg Rating</th>
                  <th>Total Orders</th>
                  <th>Complaints</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((rest) => (
                  <tr key={rest.id}>
                    <td>
                      <strong>{rest.name}</strong>
                      <br /><small>Owner: {rest.owner}</small>
                    </td>
                    <td>{rest.city}</td>
                    <td>
                      <span className="rating-pill-badge">
                        ⭐ {rest.avgRating} ({rest.reviewCount} reviews)
                      </span>
                      <br />
                      <button
                        className="text-link-sm"
                        onClick={() => setSelectedEntityForReviews({ type: 'foodpartner', ...rest })}
                      >
                        View All Reviews ➔
                      </button>
                    </td>
                    <td>{rest.totalOrders} orders</td>
                    <td>
                      {rest.complaintsCount > 0 ? (
                        <span className="danger-text font-bold">⚠️ {rest.complaintsCount} complaints</span>
                      ) : (
                        <span className="success-text">Clean (0)</span>
                      )}
                    </td>
                    <td>
                      {rest.status === 'blocked' ? (
                        <span className="status-tag danger">🔴 Blocked</span>
                      ) : rest.status === 'warning' ? (
                        <span className="status-tag warning" title={rest.warningReason}>🟡 Warning Issued</span>
                      ) : (
                        <span className="status-tag success">🟢 Active</span>
                      )}
                    </td>
                    <td>
                      <div className="action-button-group">
                        <button
                          className="secondary-btn sm warning-btn"
                          onClick={() => setWarningModalEntity({ type: 'foodpartner', id: rest.id, name: rest.name })}
                        >
                          ⚠️ Warning
                        </button>
                        <button
                          className={`primary-btn sm ${rest.status === 'blocked' ? 'success' : 'danger'}`}
                          onClick={() => handleToggleBlock('foodpartner', rest.id, rest.name, rest.status)}
                        >
                          {rest.status === 'blocked' ? '🟢 Unblock' : '🚫 Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. RIDERS & RATINGS TAB */}
      {activeTab === 'riders' && (
        <div className="dash-tab-content">
          <h3>Delivery Riders List & Customer Ratings</h3>
          <div className="orders-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rider Name & Phone</th>
                  <th>City</th>
                  <th>Overall Avg Rating</th>
                  <th>Deliveries Completed</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rd) => (
                  <tr key={rd.id}>
                    <td>
                      <strong>{rd.name}</strong>
                      <br /><small>{rd.phone}</small>
                    </td>
                    <td>{rd.city}</td>
                    <td>
                      <span className="rating-pill-badge">
                        ⭐ {rd.avgRating} ({rd.ratingCount} ratings)
                      </span>
                      <br />
                      <button
                        className="text-link-sm"
                        onClick={() => setSelectedEntityForReviews({ type: 'delivery', ...rd })}
                      >
                        View Rider Feedback ➔
                      </button>
                    </td>
                    <td>{rd.completedDeliveries} deliveries</td>
                    <td>
                      {rd.status === 'blocked' ? (
                        <span className="status-tag danger">🔴 Blocked</span>
                      ) : rd.status === 'warning' ? (
                        <span className="status-tag warning" title={rd.warningReason}>🟡 Warning Issued</span>
                      ) : (
                        <span className="status-tag success">🟢 Active</span>
                      )}
                    </td>
                    <td>
                      <div className="action-button-group">
                        <button
                          className="secondary-btn sm warning-btn"
                          onClick={() => setWarningModalEntity({ type: 'delivery', id: rd.id, name: rd.name })}
                        >
                          ⚠️ Warning
                        </button>
                        <button
                          className={`primary-btn sm ${rd.status === 'blocked' ? 'success' : 'danger'}`}
                          onClick={() => handleToggleBlock('delivery', rd.id, rd.name, rd.status)}
                        >
                          {rd.status === 'blocked' ? '🟢 Unblock' : '🚫 Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                {complaints.map((cmp) => (
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
                ))}
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
              Overall Average Score: <strong>⭐ {selectedEntityForReviews.avgRating} / 5.0</strong>
            </p>

            <div className="reviews-list-container">
              {selectedEntityForReviews.reviews?.map((rev, idx) => (
                <div key={idx} className="admin-review-card">
                  <div className="rev-header">
                    <strong>{rev.customer}</strong>
                    <span className="star-rating">⭐ {rev.rating}</span>
                  </div>
                  <p className="rev-comment">"{rev.comment}"</p>
                </div>
              ))}
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
                  placeholder="e.g. Customer reported cold food and torn packaging seal. Please resolve immediately or account will be suspended."
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

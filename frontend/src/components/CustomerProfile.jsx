import React, { useState } from 'react'

const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff385c" stroke="#ff385c" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
)

const IconBag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
)

const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
)

export default function CustomerProfile({ session, userOrders = [], likedFoods = [], addresses = [], onTrackOrder, onOpenAddressModal, onAddToCart }) {
  const [activeTab, setActiveTab] = useState('orders')

  const profile = session?.profile || session?.user || session || {}
  const userName = profile.fullName || profile.name || profile.username || 'User'
  const userEmail = profile.email || session?.email || ''
  const userPhone = profile.phone || session?.phone || ''
  const avatarUrl = profile.profilePicture || profile.avatar || ''
  const handleTag = `@${userName.toLowerCase().replace(/\s+/g, '_')}`

  const activeOrder = userOrders.find(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')

  return (
    <div className="instagram-profile-view">
      {/* Customer Header Profile Card */}
      <div className="ig-profile-header">
        <div className="ig-avatar-ring">
          <div className="ig-avatar-inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="profile-img-avatar" />
            ) : (
              <span className="user-avatar-initials">{userName.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
        </div>

        <div className="ig-profile-info">
          <div className="ig-username-row">
            <h2>{userName}</h2>
            <span className="ig-handle">{handleTag}</span>
          </div>

          {/* Stats Summary Row */}
          <div className="ig-stats-row">
            <div className="ig-stat-item">
              <strong>{userOrders.length}</strong>
              <span>Total Orders</span>
            </div>
            <div className="ig-stat-item">
              <strong>{likedFoods.length}</strong>
              <span>Liked Reels</span>
            </div>
            <div className="ig-stat-item">
              <strong>{addresses.length}</strong>
              <span>Saved Addr</span>
            </div>
          </div>

          <div className="ig-bio-box">
            <p className="bio-headline">🍕 Foodie & Reel Explorer</p>
            {userEmail && <p className="bio-sub">📧 {userEmail} {userPhone ? `• 📞 ${userPhone}` : ''}</p>}
          </div>
        </div>
      </div>

      {/* Active Order Banner (If Live Order Exists) */}
      {activeOrder && (
        <div className="active-order-banner">
          <div className="active-order-info">
            <span className="live-pulsing-dot" />
            <div>
              <strong>🚚 Active Order #{activeOrder.orderNumber} in Progress</strong>
              <p>Status: <span className="status-highlight">{activeOrder.status}</span> {activeOrder.foodPartner?.name ? `• ${activeOrder.foodPartner.name}` : ''}</p>
            </div>
          </div>
          <button className="primary-btn sm" onClick={() => onTrackOrder(activeOrder._id)}>
            🚀 Track Live Order
          </button>
        </div>
      )}

      {/* Profile Navigation Tabs */}
      <div className="ig-profile-tabs">
        <button
          className={`ig-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <IconBag /> My Orders ({userOrders.length})
        </button>
        <button
          className={`ig-tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => setActiveTab('liked')}
        >
          <IconHeart /> Liked ({likedFoods.length})
        </button>
        <button
          className={`ig-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          <IconPin /> Addresses ({addresses.length})
        </button>
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="ig-tab-content">
          {userOrders.length > 0 ? (
            <div className="orders-list">
              {userOrders.map((ord) => {
                const totalAmount = ord.pricing?.grandTotal || ord.totalAmount || ord.subtotal || ord.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0;
                const statusStr = (ord.status || 'PAYMENT_PENDING').toUpperCase();

                const getStatusBadge = (st) => {
                  switch (st) {
                    case 'DELIVERED':
                      return { label: '✅ Delivered', className: 'status-delivered' };
                    case 'CANCELLED':
                      return { label: '❌ Cancelled', className: 'status-cancelled' };
                    case 'OUT_FOR_DELIVERY':
                    case 'READY':
                      return { label: '🚚 Out for Delivery', className: 'status-active' };
                    case 'PREPARING':
                    case 'ACCEPTED':
                      return { label: '👨‍🍳 Preparing Food', className: 'status-active' };
                    default:
                      return { label: '🟡 Payment Pending', className: 'status-pending' };
                  }
                };

                const statusBadge = getStatusBadge(statusStr);

                return (
                  <div key={ord._id} className="order-history-card">
                    <div className="order-history-header">
                      <div className="order-title-group">
                        <span className="order-number-badge">📦 Order #{ord.orderNumber}</span>
                        <span className="order-date-text">🗓️ {new Date(ord.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <span className={`status-badge-pill ${statusBadge.className}`}>{statusBadge.label}</span>
                    </div>

                    <div className="order-history-body">
                      <div className="order-info-row">
                        <span className="info-label">🏬 Restaurant</span>
                        <span className="info-val strong-val">{ord.foodPartner?.name || 'Zesty Partner'} <span className="ig-verified">✓</span></span>
                      </div>
                      <div className="order-info-row">
                        <span className="info-label">🍕 Items Ordered</span>
                        <span className="info-val">{ord.items?.map(i => `${i.quantity}x ${i.name || i.food?.name || 'Dish Item'}`).join(', ') || 'Zesty Special Dish'}</span>
                      </div>
                      <div className="order-info-row">
                        <span className="info-label">💳 Payment Method</span>
                        <span className="info-val method-badge-val">{ord.paymentMethod || 'COD'}</span>
                      </div>
                      <div className="order-info-row total-row">
                        <span className="info-label">💰 Total Paid</span>
                        <span className="info-val price-highlight-val">₹{totalAmount}</span>
                      </div>
                    </div>

                    <div className="order-history-footer">
                      <button
                        className="primary-btn sm track-order-action-btn"
                        onClick={() => onTrackOrder(ord._id)}
                      >
                        🚀 Track Order Status
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-ig-tab">
              <p>🛍️ No orders found. Browse food reels on the home feed and place your first order!</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Liked Dishes Grid */}
      {activeTab === 'liked' && (
        <div className="ig-tab-content">
          {likedFoods.length > 0 ? (
            <div className="ig-liked-grid">
              {likedFoods.map((food) => (
                <div key={food._id} className="ig-grid-card">
                  {food.video ? (
                    <video src={food.video} className="ig-grid-thumb" muted loop autoPlay playsInline />
                  ) : food.image ? (
                    <img src={food.image} alt={food.name} className="ig-grid-thumb" />
                  ) : (
                    <div className="ig-grid-thumb placeholder-thumb flex-center">
                      <span>🍲</span>
                    </div>
                  )}
                  <div className="ig-grid-overlay">
                    <h5>{food.name}</h5>
                    {food.price ? <p>₹{food.price}</p> : null}
                    <button className="primary-btn sm" onClick={() => onAddToCart(food)}>+ Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-ig-tab">
              <p>❤️ No liked reels found. Tap heart icon on reels to save dishes here.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="ig-tab-content">
          <div className="addr-tab-header">
            <h3>📍 Delivery Addresses</h3>
            <button className="primary-btn sm" onClick={onOpenAddressModal}>+ Add New Address</button>
          </div>

          {addresses.length > 0 ? (
            <div className="saved-addr-grid">
              {addresses.map((addr) => (
                <div key={addr._id || addr.street} className="saved-addr-card">
                  <div className="addr-card-top">
                    <span className="addr-label-tag">{addr.label || 'Home'}</span>
                    {addr.isDefault && <span className="default-badge">✓ Default Address</span>}
                  </div>
                  <h4>{addr.fullName}</h4>
                  <p>📞 {addr.phone}</p>
                  <p>📍 {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street}, {addr.area ? `${addr.area}, ` : ''}{addr.city} ({addr.pincode})</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-ig-tab">
              <p>📍 No saved addresses found. Add an address for fast checkout.</p>
              <button className="primary-btn sm" onClick={onOpenAddressModal} style={{ marginTop: '12px' }}>
                + Add Delivery Address
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

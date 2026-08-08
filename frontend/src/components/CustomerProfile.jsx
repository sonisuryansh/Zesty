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

  const userName = session?.profile?.fullName || session?.profile?.name || 'Foodie Explorer'
  const userEmail = session?.profile?.email || 'user@zesty.com'
  const handleTag = `@${userName.toLowerCase().replace(/\s+/g, '_')}`

  return (
    <div className="instagram-profile-view">
      {/* Instagram Header Card */}
      <div className="ig-profile-header">
        <div className="ig-avatar-ring">
          <div className="ig-avatar-inner">
            <span className="user-avatar-initials">{userName.slice(0, 2).toUpperCase()}</span>
          </div>
        </div>

        <div className="ig-profile-info">
          <div className="ig-username-row">
            <h2>{userName}</h2>
            <span className="ig-handle">{handleTag}</span>
          </div>

          {/* Instagram Stats Row */}
          <div className="ig-stats-row">
            <div className="ig-stat-item">
              <strong>{userOrders.length}</strong>
              <span>Orders</span>
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
            <p className="bio-headline">🍕 Foodie & Short-Form Reel Explorer</p>
            <p className="bio-sub">Discovering gourmet dishes & ordering directly from reels • {userEmail}</p>
          </div>
        </div>
      </div>

      {/* Instagram Navigation Tabs */}
      <div className="ig-profile-tabs">
        <button
          className={`ig-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <IconBag /> Orders ({userOrders.length})
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
              {userOrders.map((ord) => (
                <div key={ord._id} className="order-history-card">
                  <div className="order-history-header">
                    <div>
                      <h4>Order #{ord.orderNumber}</h4>
                      <p className="order-date">{new Date(ord.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="status-tag">{ord.status}</span>
                  </div>

                  <div className="order-history-body">
                    <p><strong>Restaurant:</strong> {ord.foodPartner?.name || 'Zesty Kitchen'}</p>
                    <p><strong>Items:</strong> {ord.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                    <p><strong>Total Paid:</strong> ₹{ord.pricing?.grandTotal}</p>
                  </div>

                  <button
                    className="primary-btn sm"
                    onClick={() => onTrackOrder(ord._id)}
                  >
                    🚀 Track Live Order
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-ig-tab">
              <p>No orders placed yet. Explore reels feed and place your first order!</p>
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
                  {food.video && <video src={food.video} className="ig-grid-thumb" muted loop autoPlay playsInline />}
                  <div className="ig-grid-overlay">
                    <h5>{food.name}</h5>
                    <p>₹{food.price || 299}</p>
                    <button className="primary-btn sm" onClick={() => onAddToCart(food)}>+ Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-ig-tab">
              <p>No liked reels yet. Tap ❤️ on reels to save your favorite dishes!</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="ig-tab-content">
          <div className="addr-tab-header">
            <button className="primary-btn sm" onClick={onOpenAddressModal}>+ Add New Address</button>
          </div>

          <div className="saved-addr-grid">
            {addresses.map((addr) => (
              <div key={addr._id || addr.street} className="saved-addr-card">
                <span className="addr-label-tag">{addr.label || 'Home'}</span>
                <h4>{addr.fullName}</h4>
                <p>📞 {addr.phone}</p>
                <p>📍 {addr.houseNumber}, {addr.street}, {addr.area}, {addr.city} ({addr.pincode})</p>
                {addr.isDefault && <span className="default-badge">✓ Default Address</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

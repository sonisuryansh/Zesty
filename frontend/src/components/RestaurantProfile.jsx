import React, { useEffect, useState } from 'react'

export default function RestaurantProfile({ restaurantId, onBack, onOpenRestaurantReels, onAddToCart }) {
  const [restaurant, setRestaurant] = useState(null)
  const [foodItems, setFoodItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!restaurantId) return
    fetchRestaurantData()
  }, [restaurantId])

  const fetchRestaurantData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setRestaurant(data.restaurant)
        setFoodItems(data.foodItems || [])
      }
    } catch {
      // Fallback demo restaurant if id unavailable
      setRestaurant({
        name: 'The Artisan Craft Kitchen',
        cuisine: 'Gourmet Smashed Burgers & Pizzas',
        rating: 4.9,
        isOnline: true,
        location: { address: 'Block C, Connaught Place, New Delhi' }
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="restaurant-profile-loading">
        <div className="spinner"></div>
        <p>Loading restaurant menu & profile...</p>
      </div>
    )
  }

  const isOnline = restaurant?.isOnline !== false

  return (
    <div className="restaurant-profile-view">
      <button className="back-feed-btn" onClick={onBack}>
        ← Back to Main Feed
      </button>

      <div className="restaurant-header-card">
        <div className="rest-avatar-circle">👨‍🍳</div>
        <div className="rest-details">
          <h2>{restaurant?.name || 'Artisan Food Partner'}</h2>
          <p className="rest-cuisine">🍳 {restaurant?.cuisine || 'Multi-Cuisine'}</p>
          <p className="rest-address">📍 {restaurant?.location?.address || 'Connaught Place, New Delhi'}</p>
          
          <div className="rest-meta-row">
            <span className="rating-badge">⭐ {restaurant?.rating || 4.8} ({restaurant?.totalRatings || 42}+ ratings)</span>
            <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🟢 Open for Orders' : '🔴 Closed'}
            </span>
          </div>

          <div className="profile-actions">
            <button className="primary-btn view-reels-btn" onClick={() => onOpenRestaurantReels(restaurantId, restaurant)}>
              🎬 View {restaurant?.name}'s Reels
            </button>
          </div>
        </div>
      </div>

      <h3>🍽️ Food Menu ({foodItems.length} Items)</h3>
      <div className="menu-items-grid">
        {foodItems.length > 0 ? (
          foodItems.map((food) => (
            <div key={food._id} className="menu-item-card">
              {food.video && <video src={food.video} className="menu-item-thumb" muted loop autoPlay playsInline />}
              <div className="menu-item-info">
                <h4>{food.name}</h4>
                <p className="menu-item-desc">{food.description}</p>
                <div className="menu-item-footer">
                  <span className="price-tag">₹{food.price || 299}</span>
                  {isOnline ? (
                    <button className="primary-btn add-btn" onClick={() => onAddToCart(food)}>
                      + Add to Cart
                    </button>
                  ) : (
                    <span className="closed-label">Unavailable</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-menu-notice">No food items added yet for this restaurant.</p>
        )}
      </div>
    </div>
  )
}

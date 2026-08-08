import React, { useEffect, useState } from 'react'
import ReelCard from './ReelCard'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

export default function RestaurantReelsFeed({ restaurantId, restaurantInfo, onBack, onAddToCart, onEmailOrder, likedDishes, onToggleLike }) {
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantReels()
    }
  }, [restaurantId])

  const fetchRestaurantReels = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/food/restaurant/${restaurantId}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok && data.reels) {
        setReels(data.reels)
      }
    } catch {
      setReels([])
    } finally {
      setLoading(false)
    }
  }

  const filteredReels = reels.filter((reel) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      reel.name?.toLowerCase().includes(q) ||
      reel.description?.toLowerCase().includes(q) ||
      reel.category?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="restaurant-reels-view">
      <div className="restaurant-reels-header">
        <button className="back-feed-btn" onClick={onBack}>
          ← Back to Restaurant Profile
        </button>

        <h2>🎬 {restaurantInfo?.name || 'Restaurant'} Reels</h2>

        {/* Restaurant Specific Search */}
        <div className="restaurant-search-bar">
          <IconSearch />
          <input
            type="text"
            placeholder={`Search inside ${restaurantInfo?.name || 'this restaurant'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="feed-loading-container">
          <div className="spinner"></div>
          <p>Loading {restaurantInfo?.name || 'Restaurant'} reels...</p>
        </div>
      ) : filteredReels.length > 0 ? (
        <div className="reels-feed-container">
          {filteredReels.map((reel) => (
            <ReelCard
              key={reel._id}
              food={reel}
              onAddToCart={onAddToCart}
              onOpenRestaurant={() => {}}
              onEmailOrder={onEmailOrder}
              isLiked={likedDishes.includes(reel._id)}
              onToggleLike={onToggleLike}
            />
          ))}
        </div>
      ) : (
        <div className="empty-reels-notice">
          <p>No reels found matching "{searchQuery}" for this restaurant.</p>
        </div>
      )}
    </div>
  )
}

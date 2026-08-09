import React, { useState, useRef, useEffect } from 'react'

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const IconHeart = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#ff385c' : 'none'} stroke={filled ? '#ff385c' : 'white'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

const IconBag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
)

const IconChevronLeft = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
)

const IconChevronRight = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
)

export default function ProfileReelViewerModal({ reels = [], initialIndex = 0, onClose, onAddToCart, onOpenRestaurant }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLiked, setIsLiked] = useState(false)
  const [muted, setMuted] = useState(false)
  const videoRef = useRef(null)

  const currentReel = reels[currentIndex]

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [currentIndex])

  if (!currentReel) return null

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const partnerName = currentReel.foodPartner?.name || 'Partner Kitchen'
  const partnerId = currentReel.foodPartner?._id || currentReel.foodPartner
  const price = currentReel.price || 0
  const isOnline = currentReel.foodPartner?.isOnline !== false

  return (
    <div className="modal-backdrop viewer-backdrop" onClick={onClose}>
      {/* Navigation Chevrons */}
      {currentIndex > 0 && (
        <button className="reel-nav-btn prev-btn" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
          <IconChevronLeft />
        </button>
      )}

      {currentIndex < reels.length - 1 && (
        <button className="reel-nav-btn next-btn" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
          <IconChevronRight />
        </button>
      )}

      <div className="reel-viewer-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close viewer-close-btn" onClick={onClose}><IconClose /></button>

        {/* Video Player Column */}
        <div className="viewer-video-column">
          <video
            ref={videoRef}
            src={currentReel.video}
            className="viewer-video"
            loop
            playsInline
            muted={muted}
            onClick={() => setMuted(!muted)}
          />
        </div>

        {/* Info Column */}
        <div className="viewer-info-column">
          <div className="viewer-partner-row">
            <div 
              className="viewer-partner-badge"
              onClick={() => { onClose(); onOpenRestaurant(partnerId, currentReel.foodPartner); }}
            >
              <div className="ig-story-ring-sm">
                <div className="ig-avatar-inner-sm">👨‍🍳</div>
              </div>
              <div>
                <strong>{partnerName}</strong>
                <span className="ig-verified"> ✓</span>
              </div>
            </div>
          </div>

          <div className="viewer-details-body">
            <h3>{currentReel.name}</h3>
            <p className="viewer-price-tag">₹{price}</p>
            <p className="viewer-desc">{currentReel.description}</p>
            {currentReel.category && <span className="reel-category">{currentReel.category}</span>}
          </div>

          {/* Food Centric Add to Cart Panel */}
          <div className="viewer-food-cart-box">
            <div className="food-summary-line">
              <span>🍕 {currentReel.name}</span>
              <strong>₹{price}</strong>
            </div>
            <p className="restaurant-sub">by {partnerName}</p>

            {isOnline ? (
              <button className="primary-btn viewer-cart-btn" onClick={() => onAddToCart(currentReel)}>
                <IconBag /> Add to Cart (₹{price})
              </button>
            ) : (
              <button className="primary-btn disabled" disabled>
                🚫 Restaurant Closed
              </button>
            )}
          </div>

          {/* Like Interaction */}
          <div className="viewer-footer">
            <button
              className={`side-ctrl-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <IconHeart filled={isLiked} />
            </button>
            <span className="viewer-counter-text">{currentIndex + 1} of {reels.length} Reels</span>
          </div>
        </div>
      </div>
    </div>
  )
}

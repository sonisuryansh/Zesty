import React, { useRef, useEffect, useState } from 'react'

const IconHeart = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? '#ff385c' : 'none'} stroke={filled ? '#ff385c' : 'white'} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
)

const IconVolume = ({ muted }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    {!muted && <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>}
  </svg>
)

const IconBag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
)

const IconShare = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
)

export default function ReelCard({ food, onAddToCart, onOpenRestaurant, onEmailOrder, isLiked, onToggleLike }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.floor(120 + Math.random() * 850))

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
          } else {
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: 0.6 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  const partnerName = food.foodPartner?.name || 'Artisan Gourmet Kitchen'
  const partnerId = food.foodPartner?._id || food.foodPartner
  const isOnline = food.foodPartner?.isOnline !== false
  const rating = food.foodPartner?.rating || 4.8
  const price = food.price || 299

  const isImagePost = food.mediaType === 'image' || (!food.video && food.image)

  return (
    <div className="reel-card ig-reel-card">
      {isImagePost ? (
        <img
          src={food.image || food.video}
          alt={food.name}
          className="reel-video reel-image-post"
        />
      ) : (
        <video
          ref={videoRef}
          src={food.video}
          className="reel-video"
          loop
          playsInline
          muted={muted}
          onClick={togglePlay}
          preload="metadata"
        />
      )}

      {/* Instagram Reels Overlay */}
      <div className="reel-overlay ig-overlay">
        {/* Bottom Left Info Panel */}
        <div className="reel-info ig-info-panel">
          {/* Instagram Story Gradient Avatar Pill */}
          <div 
            className="ig-partner-pill"
            onClick={() => onOpenRestaurant(partnerId, food.foodPartner)}
          >
            <div className="ig-story-ring-sm">
              <div className="ig-avatar-inner-sm">👨‍🍳</div>
            </div>
            <div className="ig-partner-text">
              <span className="ig-partner-name">{partnerName} <span className="ig-verified">✓</span></span>
              <span className="ig-partner-sub">⭐ {rating} • View Profile</span>
            </div>
          </div>

          <div className="reel-header-badges">
            <span className="reel-category">{food.category || 'Trending'}</span>
            <span className={`store-status-pill ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? '🟢 Open Now' : '🔴 Closed'}
            </span>
          </div>

          <h3 className="reel-title">{food.name}</h3>
          <p className="reel-desc">{food.description}</p>

          <div className="reel-action-buttons">
            {isOnline ? (
              <button className="order-now-btn ig-order-btn" onClick={() => onAddToCart(food)}>
                <IconBag /> Add to Cart (₹{price})
              </button>
            ) : (
              <button className="order-now-btn disabled" disabled>
                🚫 Restaurant Closed
              </button>
            )}

            <button className="direct-email-btn" onClick={() => onEmailOrder(food)}>
              📩 Inquiry
            </button>
          </div>
        </div>

        {/* Right Side Interactive Action Bar (Instagram Reels Style) */}
        <div className="reel-side-controls ig-side-controls">
          {/* Audio Mute/Unmute */}
          <div className="ig-action-unit">
            <button className="side-ctrl-btn" onClick={() => setMuted(!muted)} title={muted ? "Unmute" : "Mute"}>
              <IconVolume muted={muted} />
            </button>
          </div>

          {/* Heart Like Button */}
          <div className="ig-action-unit">
            <button
              className={`side-ctrl-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => {
                onToggleLike(food._id)
                setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
              }}
              title="Like reel"
            >
              <IconHeart filled={isLiked} />
            </button>
            <span className="ctrl-count">{likeCount}</span>
          </div>

          {/* Share/Send Reel */}
          <div className="ig-action-unit">
            <button className="side-ctrl-btn" onClick={() => onEmailOrder(food)} title="Share reel">
              <IconShare />
            </button>
            <span className="ctrl-count">Share</span>
          </div>
        </div>
      </div>
    </div>
  )
}

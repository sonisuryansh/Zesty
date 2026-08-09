import React, { useEffect, useState } from 'react'
import EditProfileModal from './EditProfileModal'
import ProfileReelViewerModal from './ProfileReelViewerModal'

const IconHeart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff385c" stroke="#ff385c" strokeWidth="2">
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

const IconVideo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
)

const IconBookmark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>
)

const IconBag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
)

export default function SocialUserProfile({ userId, session, onAddToCart, onOpenRestaurant, showToast, onBackToHome }) {
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeTab, setActiveTab] = useState('posts')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Reel Viewer State
  const [selectedReelIndex, setSelectedReelIndex] = useState(null)

  useEffect(() => {
    fetchProfileData()
  }, [userId])

  const fetchProfileData = async () => {
    setLoading(true)
    setError(null)
    const targetId = userId || session?.profile?._id || session?.id

    if (!targetId) {
      setError('No user profile specified.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/users/profile/${targetId}`, { credentials: 'include' })
      const data = await res.json()

      if (res.ok) {
        setProfile(data.user)
        fetchUserPosts(data.user._id)
      } else {
        setError(data.message || 'User profile not found')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}/posts`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts || [])
      }
    } catch {}
  }

  const handleFollowToggle = async () => {
    if (!session) {
      showToast('Please sign in to follow food creators! 🍕', 'info')
      return
    }

    setFollowLoading(true)
    const isCurrentlyFollowing = profile?.isFollowing
    const method = isCurrentlyFollowing ? 'DELETE' : 'POST'

    try {
      const res = await fetch(`/api/users/${profile._id}/follow`, {
        method,
        credentials: 'include'
      })
      const data = await res.json()

      if (res.ok) {
        showToast(data.message, 'success')
        setProfile(prev => ({
          ...prev,
          isFollowing: data.isFollowing,
          followersCount: data.followersCount
        }))
      } else {
        showToast(data.message, 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setFollowLoading(false)
    }
  }

  // 1. Loading Skeleton State
  if (loading) {
    return (
      <div className="social-profile-view">
        <div className="ig-profile-header skeleton-container">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-line lg"></div>
            <div className="skeleton-line sm"></div>
            <div className="skeleton-line md"></div>
          </div>
        </div>
        <div className="skeleton-grid">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    )
  }

  // 2. Error State (User Not Found)
  if (error || !profile) {
    return (
      <div className="social-profile-view">
        <div className="access-blocked-card error-profile-card">
          <h2>🚫 User Not Found</h2>
          <p>{error || "The requested user profile does not exist or has been removed."}</p>
          <button className="primary-btn" onClick={onBackToHome}>Back to Home</button>
        </div>
      </div>
    )
  }

  const isOwner = profile.isOwner || (session?.profile?._id === profile._id)

  return (
    <div className="social-profile-view">
      {/* Instagram Profile Header */}
      <div className="ig-profile-header">
        <div className="ig-avatar-ring">
          <div className="ig-avatar-inner">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt={profile.displayName} className="profile-img-avatar" />
            ) : (
              <span className="user-avatar-initials">
                {(profile.displayName || profile.username || 'U').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="ig-profile-info">
          <div className="ig-username-row">
            <h2>@{profile.username || `user_${profile._id.slice(-4)}`}</h2>
            
            {/* Owner vs Follower Action Buttons */}
            {isOwner ? (
              <button className="secondary-btn edit-profile-btn" onClick={() => setEditModalOpen(true)}>
                Edit Profile
              </button>
            ) : (
              <div className="follow-action-group">
                <button
                  className={`primary-btn follow-btn ${profile.isFollowing ? 'following' : ''}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? 'Updating...' : profile.isFollowing ? 'Following ✓' : 'Follow'}
                </button>
                <button className="secondary-btn message-btn" onClick={() => showToast(`Direct messaging with @${profile.username} coming soon! 💬`, 'info')}>
                  Message
                </button>
              </div>
            )}
          </div>

          <p className="ig-display-name"><strong>{profile.displayName || profile.fullName}</strong></p>

          {/* Stats Row (Posts, Followers, Following) */}
          <div className="ig-stats-row">
            <div className="ig-stat-item">
              <strong>{profile.postsCount || posts.length}</strong>
              <span>posts</span>
            </div>
            <div className="ig-stat-item">
              <strong>{profile.followersCount || 0}</strong>
              <span>followers</span>
            </div>
            <div className="ig-stat-item">
              <strong>{profile.followingCount || 0}</strong>
              <span>following</span>
            </div>
          </div>

          {/* Bio & Details */}
          <div className="ig-bio-box">
            {profile.bio && <p className="bio-headline">{profile.bio}</p>}
            {profile.location && <p className="bio-sub">📍 {profile.location}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="bio-link">
                🌐 {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ig-profile-tabs">
        <button
          className={`ig-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <IconGrid /> POSTS
        </button>
        <button
          className={`ig-tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
          onClick={() => setActiveTab('reels')}
        >
          <IconVideo /> REELS
        </button>
        {isOwner && (
          <button
            className={`ig-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <IconBookmark /> SAVED
          </button>
        )}
      </div>

      {/* Tab 1 & 2: Posts & Reels Grid (3 Columns Desktop) */}
      {(activeTab === 'posts' || activeTab === 'reels') && (
        <div className="ig-tab-content">
          {posts.length > 0 ? (
            <div className="profile-grid-3col">
              {posts.map((food, idx) => (
                <div
                  key={food._id}
                  className="profile-grid-card"
                  onClick={() => setSelectedReelIndex(idx)}
                >
                  <video src={food.video} className="grid-card-thumb" muted loop autoPlay playsInline />
                  
                  <div className="grid-card-overlay">
                    <div className="grid-overlay-top">
                      <span className="grid-category-pill">{food.category || 'Trending'}</span>
                    </div>

                    <div className="grid-overlay-bottom">
                      <h4>{food.name}</h4>
                      <p className="grid-price-tag">₹{food.price || 0}</p>
                      <p className="grid-partner-sub">by {food.foodPartner?.name || 'Partner Kitchen'}</p>

                      <button
                        className="primary-btn sm grid-cart-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddToCart(food)
                        }}
                      >
                        <IconBag /> Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-ig-tab">
              <p>No {activeTab === 'reels' ? 'reels' : 'posts'} yet</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Content (Owner Only) */}
      {activeTab === 'saved' && isOwner && (
        <div className="ig-tab-content">
          <div className="empty-ig-tab">
            <p>No saved posts yet</p>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userProfile={profile}
        onProfileSaved={(updatedUser) => {
          setProfile(prev => ({ ...prev, ...updatedUser }))
        }}
        showToast={showToast}
      />

      {/* Full Screen Reel Viewer Modal */}
      {selectedReelIndex !== null && (
        <ProfileReelViewerModal
          reels={posts}
          initialIndex={selectedReelIndex}
          onClose={() => setSelectedReelIndex(null)}
          onAddToCart={onAddToCart}
          onOpenRestaurant={onOpenRestaurant}
        />
      )}
    </div>
  )
}

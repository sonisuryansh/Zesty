import React, { useState } from 'react'

const IconClose = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

export default function EditProfileModal({ isOpen, onClose, userProfile, onProfileSaved, showToast }) {
  const [formData, setFormData] = useState({
    username: userProfile?.username || '',
    displayName: userProfile?.displayName || userProfile?.fullName || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    website: userProfile?.website || '',
    profilePicture: userProfile?.profilePicture || ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (res.ok) {
        showToast('Profile updated successfully! ✨', 'success')
        onProfileSaved(data.user)
        onClose()
      } else {
        setErrorMsg(data.message || 'Failed to update profile')
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><IconClose /></button>
        <h3>✏️ Edit Profile</h3>
        <p className="modal-subtext">Update your public social foodie persona & details</p>

        <form onSubmit={handleSubmit} className="auth-form edit-profile-form">
          <div className="form-group">
            <label>Profile Picture Image URL</label>
            <input
              type="url"
              name="profilePicture"
              placeholder="https://example.com/avatar.jpg"
              value={formData.profilePicture}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Username (Unique Handle)</label>
            <input
              type="text"
              name="username"
              placeholder="e.g. food_explorer_99"
              required
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              name="displayName"
              placeholder="Your Public Display Name"
              required
              value={formData.displayName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              placeholder="Share a short bio about your favorite cuisines & food tastes..."
              rows="3"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>📍 Location</label>
              <input
                type="text"
                name="location"
                placeholder="City, Country"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>🌐 Website / Link</label>
              <input
                type="url"
                name="website"
                placeholder="https://yourblog.com"
                value={formData.website}
                onChange={handleChange}
              />
            </div>
          </div>

          {errorMsg && <p className="error-msg">{errorMsg}</p>}

          <div className="modal-actions-row">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

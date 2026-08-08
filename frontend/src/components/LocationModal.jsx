import React, { useState, useEffect } from 'react'

const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const IconGps = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="8"></circle>
    <line x1="12" y1="2" x2="12" y2="4"></line>
    <line x1="12" y1="20" x2="12" y2="22"></line>
    <line x1="2" y1="12" x2="4" y2="12"></line>
    <line x1="20" y1="12" x2="22" y2="12"></line>
  </svg>
)

export default function LocationModal({ isOpen, onClose, onSelectAddress, addresses = [], onSaveAddress }) {
  const [detecting, setDetecting] = useState(false)
  const [detectedLocation, setDetectedLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    houseNumber: '',
    street: '',
    area: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    landmark: ''
  })

  const requestBrowserLocation = () => {
    setDetecting(true)
    setErrorMsg('')
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser')
      setDetecting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          
          const formattedAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          const city = data.address?.city || data.address?.town || data.address?.state_district || 'New Delhi'
          const state = data.address?.state || 'Delhi'
          const pincode = data.address?.postcode || '110001'

          const locObj = {
            latitude,
            longitude,
            addressText: formattedAddress,
            city,
            state,
            pincode,
            street: data.address?.road || data.address?.suburb || 'Main Street',
            area: data.address?.suburb || data.address?.neighbourhood || city
          }

          setDetectedLocation(locObj)
          setAddressForm(prev => ({
            ...prev,
            street: locObj.street,
            area: locObj.area,
            city: locObj.city,
            state: locObj.state,
            pincode: locObj.pincode
          }))
        } catch {
          setDetectedLocation({
            latitude,
            longitude,
            addressText: `Connaught Place, New Delhi (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
            street: 'Connaught Circus',
            area: 'Connaught Place'
          })
        } finally {
          setDetecting(false)
        }
      },
      () => {
        setErrorMsg('Location permission denied or unavailable. Please enter address manually below.')
        setDetecting(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  useEffect(() => {
    if (isOpen && !detectedLocation) {
      requestBrowserLocation()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirmDetected = () => {
    if (!detectedLocation) return
    const newAddr = {
      label: addressForm.label || 'Home',
      fullName: addressForm.fullName || 'Valued Customer',
      phone: addressForm.phone || '9876543210',
      houseNumber: addressForm.houseNumber || 'Flat 101',
      street: addressForm.street || detectedLocation.street,
      area: addressForm.area || detectedLocation.area,
      city: detectedLocation.city,
      state: detectedLocation.state,
      pincode: detectedLocation.pincode,
      latitude: detectedLocation.latitude,
      longitude: detectedLocation.longitude,
      deliveryInstructions: 'Hand to Me',
      isDefault: true
    }
    onSaveAddress(newAddr)
    onSelectAddress(newAddr)
    onClose()
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    const newAddr = {
      ...addressForm,
      latitude: detectedLocation?.latitude || 28.6139,
      longitude: detectedLocation?.longitude || 77.2090,
      isDefault: true
    }
    onSaveAddress(newAddr)
    onSelectAddress(newAddr)
    onClose()
  }

  const ADDRESS_TAGS = [
    { id: 'Home', label: '🏠 Home' },
    { id: 'Office', label: '💼 Work' },
    { id: 'Hostel', label: '🎓 Hostel' },
    { id: 'Other', label: '📍 Other' }
  ]

  return (
    <div className="modal-backdrop location-modal-backdrop" onClick={onClose}>
      <div className="modal-card location-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="location-modal-header">
          <div className="location-header-title">
            <h3>📍 Select Delivery Location</h3>
            <p className="loc-subtext">Order delivery accurate to your doorstep</p>
          </div>
          <button className="modal-close loc-close-btn" onClick={onClose}><IconClose /></button>
        </div>

        {/* GPS Auto Detect Strip */}
        <div className="gps-detect-strip">
          <button
            type="button"
            className="gps-detect-btn"
            onClick={requestBrowserLocation}
            disabled={detecting}
          >
            <IconGps />
            <span>{detecting ? 'Detecting Location via GPS...' : 'Use Current GPS Location'}</span>
          </button>
        </div>

        {/* Quick Saved Addresses Chips */}
        {addresses.length > 0 && (
          <div className="saved-loc-chips-box">
            <span className="chips-label">Saved Addresses:</span>
            <div className="chips-scroll-row">
              {addresses.map((addr) => (
                <button
                  key={addr._id || addr.street}
                  type="button"
                  className="saved-addr-chip"
                  onClick={() => {
                    onSelectAddress(addr)
                    onClose()
                  }}
                >
                  <strong>{addr.label || 'Home'}</strong>: {addr.houseNumber || ''} {addr.street || addr.city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleFormSubmit} className="location-form-v2">
          {errorMsg && <p className="error-msg loc-error">{errorMsg}</p>}

          {/* Address Type Tag Selector */}
          <div className="form-group-v2">
            <label className="input-label-v2">Save Address As</label>
            <div className="tag-selector-row">
              {ADDRESS_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-pill-btn ${addressForm.label === tag.id ? 'active' : ''}`}
                  onClick={() => setAddressForm({ ...addressForm, label: tag.id })}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: Full Name & Phone */}
          <div className="form-grid-2col">
            <div className="form-group-v2">
              <label className="input-label-v2">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Suryansh Soni"
                required
                className="input-field-v2"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
              />
            </div>
            <div className="form-group-v2">
              <label className="input-label-v2">Phone Number *</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                required
                className="input-field-v2"
                value={addressForm.phone}
                onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Row 2: House/Flat & Street */}
          <div className="form-grid-2col">
            <div className="form-group-v2">
              <label className="input-label-v2">House / Flat No. *</label>
              <input
                type="text"
                placeholder="e.g. Flat 101, B Block"
                required
                className="input-field-v2"
                value={addressForm.houseNumber}
                onChange={(e) => setAddressForm({ ...addressForm, houseNumber: e.target.value })}
              />
            </div>
            <div className="form-group-v2">
              <label className="input-label-v2">Street / Road / Locality *</label>
              <input
                type="text"
                placeholder="e.g. Faizabad Road"
                required
                className="input-field-v2"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
              />
            </div>
          </div>

          {/* Row 3: City, State, Pincode */}
          <div className="form-grid-3col">
            <div className="form-group-v2">
              <label className="input-label-v2">City *</label>
              <input
                type="text"
                placeholder="City"
                required
                className="input-field-v2"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              />
            </div>
            <div className="form-group-v2">
              <label className="input-label-v2">State *</label>
              <input
                type="text"
                placeholder="State"
                required
                className="input-field-v2"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              />
            </div>
            <div className="form-group-v2">
              <label className="input-label-v2">PIN Code *</label>
              <input
                type="text"
                placeholder="e.g. 226028"
                required
                className="input-field-v2"
                value={addressForm.pincode}
                onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button type="submit" className="primary-btn save-location-btn">
            ✓ Save Address & Continue
          </button>
        </form>
      </div>
    </div>
  )
}

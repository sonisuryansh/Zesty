import React from 'react'

const IconClose = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

export default function FooterPageModal({ isOpen, onClose, pageKey, showToast }) {
  if (!isOpen || !pageKey) return null

  const renderContent = () => {
    switch (pageKey) {
      case 'about':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">🍕</span>
              <h2>About Zesty Food Reels</h2>
              <p className="hero-tagline">Reinventing Food Discovery with Short Videos & Instant Delivery</p>
            </div>
            <div className="footer-section-content">
              <h3>🚀 Our Mission</h3>
              <p>Zesty combines the viral energy of Instagram Reels with hyper-fast food delivery. Discover mouth-watering dishes through short videos created directly by local chefs and food partners, and get them delivered to your doorstep in 15–20 minutes.</p>

              <h3>💡 Key Innovations</h3>
              <ul>
                <li><strong>Video-First Ordering:</strong> Watch fresh food preparation before ordering.</li>
                <li><strong>5% Low Commission:</strong> Empowering local cloud kitchens & restaurant partners with transparent pricing.</li>
                <li><strong>No Forced Login:</strong> Instant guest checkout experience.</li>
              </ul>
            </div>
          </div>
        )

      case 'help':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">💬</span>
              <h2>Help & Customer Support</h2>
              <p className="hero-tagline">We're here for you 24/7 to solve order & delivery queries</p>
            </div>
            <div className="footer-section-content">
              <div className="faq-grid">
                <div className="faq-item">
                  <h4>❓ Where is my active order?</h4>
                  <p>Check the Profile section under <strong>My Orders</strong> tab for live GPS rider tracking and status updates.</p>
                </div>
                <div className="faq-item">
                  <h4>❓ How do refunds work?</h4>
                  <p>Cancellations or failed orders are automatically refunded to your payment method within 24 hours.</p>
                </div>
                <div className="faq-item">
                  <h4>❓ How to become a Food Partner?</h4>
                  <p>Click on <strong>Partner Studio</strong> in the footer to register your kitchen in under 5 minutes!</p>
                </div>
              </div>
              <button className="primary-btn support-chat-btn" onClick={() => showToast('Opening live support chat widget...', 'success')}>
                💬 Start Live Agent Chat
              </button>
            </div>
          </div>
        )

      case 'press':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">📰</span>
              <h2>Press & Media Kit</h2>
              <p className="hero-tagline">Latest news, press releases, and official brand assets</p>
            </div>
            <div className="footer-section-content">
              <div className="stat-cards-row">
                <div className="mini-stat-card">
                  <strong>500K+</strong>
                  <span>Reels Watched Daily</span>
                </div>
                <div className="mini-stat-card">
                  <strong>1,200+</strong>
                  <span>Cloud Kitchen Partners</span>
                </div>
                <div className="mini-stat-card">
                  <strong>15 Min</strong>
                  <span>Average Delivery Time</span>
                </div>
              </div>
              <p>For press inquiries, brand assets, or interview requests, reach out to our media relations team at <code>press@zesty.food</code>.</p>
            </div>
          </div>
        )

      case 'api':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">⚡</span>
              <h2>Developer API & POS Integration</h2>
              <p className="hero-tagline">Build, connect, and automate restaurant POS systems with Zesty API</p>
            </div>
            <div className="footer-section-content">
              <h3>🔌 Restful API Endpoints</h3>
              <div className="code-block-preview">
                <code>GET /api/v1/food/reels</code><br />
                <code>POST /api/v1/orders/webhook</code><br />
                <code>PATCH /api/v1/partner/inventory</code>
              </div>
              <p>Request developer API keys at <code>devs@zesty.food</code> to connect Petpooja, UrbanPiper, or custom POS software.</p>
            </div>
          </div>
        )

      case 'jobs':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">💼</span>
              <h2>Careers at Zesty</h2>
              <p className="hero-tagline">Join our team in building the next generation of social food commerce</p>
            </div>
            <div className="footer-section-content">
              <h3>🔥 Open Positions</h3>
              <div className="jobs-list">
                <div className="job-card">
                  <div>
                    <h4>Senior Full-Stack Engineer (React / Node.js)</h4>
                    <span className="job-meta">Remote • Full Time</span>
                  </div>
                  <button className="primary-btn sm" onClick={() => showToast('Application link copied to clipboard!', 'info')}>Apply Now</button>
                </div>
                <div className="job-card">
                  <div>
                    <h4>Food Partner Growth Lead</h4>
                    <span className="job-meta">New Delhi / Lucknow • Full Time</span>
                  </div>
                  <button className="primary-btn sm" onClick={() => showToast('Application link copied to clipboard!', 'info')}>Apply Now</button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">🔒</span>
              <h2>Privacy Policy</h2>
              <p className="hero-tagline">Your data privacy and location security are our top priorities</p>
            </div>
            <div className="footer-section-content">
              <h3>🛡️ How We Protect Your Data</h3>
              <p>1. <strong>Location Privacy:</strong> GPS coordinates are used exclusively for doorstep order dispatch and estimated arrival time calculations.</p>
              <p>2. <strong>Payment Safety:</strong> Encrypted via PCI-DSS compliant gateways. Card numbers are never stored on Zesty servers.</p>
              <p>3. <strong>Zero Data Selling:</strong> We never sell customer browsing or contact details to third-party advertisers.</p>
            </div>
          </div>
        )

      case 'terms':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">📜</span>
              <h2>Terms of Service</h2>
              <p className="hero-tagline">Terms governing customer usage, guest cart, and order deliveries</p>
            </div>
            <div className="footer-section-content">
              <h3>📋 Key Terms</h3>
              <p>1. <strong>Guest Cart:</strong> Unauthenticated users can add dishes to temporary local cart state without forcing login until checkout.</p>
              <p>2. <strong>Single Restaurant Cart Rule:</strong> Cart items must belong to a single food partner to ensure fresh packaging and single-rider delivery.</p>
              <p>3. <strong>Partner Commission:</strong> Transparent 5% platform commission charged on net food subtotal.</p>
            </div>
          </div>
        )

      case 'locations':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">📍</span>
              <h2>Serviceable Cities</h2>
              <p className="hero-tagline">Zesty Food Reels 15-Minute Delivery active locations</p>
            </div>
            <div className="footer-section-content">
              <div className="cities-grid">
                <div className="city-pill">🏛️ New Delhi (CP, South Del)</div>
                <div className="city-pill">🏰 Lucknow (Hazratganj, Gomti)</div>
                <div className="city-pill">🌊 Mumbai (Bandra, Juhu)</div>
                <div className="city-pill">💻 Bengaluru (Indiranagar, HSR)</div>
                <div className="city-pill">🕌 Hyderabad (Jubilee Hills)</div>
                <div className="city-pill">🎨 Jaipur (C-Scheme, Malviya)</div>
              </div>
            </div>
          </div>
        )

      case 'language':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">🌐</span>
              <h2>Language Preferences</h2>
              <p className="hero-tagline">Select your preferred app display language</p>
            </div>
            <div className="footer-section-content">
              <div className="lang-options-grid">
                <button className="lang-card-btn active" onClick={() => showToast('Language set to English', 'success')}>
                  <strong>English (US/IN)</strong>
                  <span>Default App Language</span>
                </button>
                <button className="lang-card-btn" onClick={() => showToast('भाषा हिंदी चुनी गई', 'success')}>
                  <strong>हिन्दी (Hindi)</strong>
                  <span>भारतीय भाषा</span>
                </button>
                <button className="lang-card-btn" onClick={() => showToast('Language set to Hinglish', 'success')}>
                  <strong>Hinglish (Colloquial)</strong>
                  <span>Everyday Conversational</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'meta-verified':
        return (
          <div className="footer-modal-body">
            <div className="footer-modal-hero">
              <span className="hero-emoji">⭐</span>
              <h2>Zesty Gold Verified Badge</h2>
              <p className="hero-tagline">Official Creator & Restaurant Verification Program</p>
            </div>
            <div className="footer-section-content">
              <h3>🏆 Verification Benefits</h3>
              <ul>
                <li><strong>Gold Badge:</strong> Verified checkmark on profile and reel video feeds.</li>
                <li><strong>Featured Reels:</strong> Top priority algorithmic boosting in customer discovery feed.</li>
                <li><strong>Direct Email Ordering:</strong> Enable 1-click email inquiries for bulk catering.</li>
              </ul>
              <button className="primary-btn apply-badge-btn" onClick={() => showToast('Verification request submitted for review!', 'success')}>
                ⭐ Apply for Zesty Verification Badge
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="modal-backdrop footer-page-backdrop" onClick={onClose}>
      <div className="modal-card footer-page-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close footer-modal-close" onClick={onClose}>
          <IconClose />
        </button>
        {renderContent()}
      </div>
    </div>
  )
}

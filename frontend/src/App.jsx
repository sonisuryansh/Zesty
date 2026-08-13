import { useEffect, useState } from 'react'
import emailjs from '@emailjs/browser'
import { io } from 'socket.io-client'
import { GoogleLogin } from '@react-oauth/google'
import './App.css'

import ReelCard from './components/ReelCard'
import LocationModal from './components/LocationModal'
import CartConflictModal from './components/CartConflictModal'
import RestaurantProfile from './components/RestaurantProfile'
import RestaurantReelsFeed from './components/RestaurantReelsFeed'
import OrderStatusTracker from './components/OrderStatusTracker'
import RestaurantDashboard from './components/RestaurantDashboard'
import DeliveryDashboard from './components/DeliveryDashboard'
import CustomerProfile from './components/CustomerProfile'
import SocialUserProfile from './components/SocialUserProfile'
import FooterPageModal from './components/FooterPageModal'
import AdminControlPanel from './components/AdminControlPanel'

const API = 'https://zesty-af0e.onrender.com/api'
const SOCKET_URL = 'https://zesty-af0e.onrender.com'
let socket = null

const SUGGESTED_CREATORS = []

async function request(path, options = {}) {
  const token = localStorage.getItem('zesty_token')
  const headers = {
    ...options.headers,
  }
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong. Please try again.')
    error.code = data.code
    error.data = data
    throw error
  }

  return data
}


// SVG Icons for Instagram Dark Navigation Bar
const IconHomeIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.1L1 12h3v9h7v-6h2v6h7v-9h3L12 2.1z" /></svg>)
const IconSearchIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>)
const IconReelsIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" /></svg>)
const IconHeartIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>)
const IconPlusIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>)
const IconBagIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>)
const IconPinIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>)
const IconUserIG = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>)
const IconLogoutIG = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>)
const IconClose = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>)

const CATEGORIES = [
  { id: 'All', label: 'All', icon: '🔥', handle: 'divy.kairoth' },
  { id: 'Trending', label: 'Trending', icon: '✨', handle: 'professoro...' },
  { id: 'Fast Food', label: 'Fast Food', icon: '🍔', handle: 'andrii_drok' },
  { id: 'Dessert', label: 'Dessert', icon: '🍰', handle: '_animesh...' },
  { id: 'Healthy', label: 'Healthy', icon: '🥗', handle: 'nidhi_kun...' },
  { id: 'Drinks', label: 'Drinks', icon: '🍹', handle: 't0kt0r0v' },
  { id: 'Spicy', label: 'Spicy', icon: '🌶️', handle: 'spicy_bites' }
]

function App() {
  const [foods, setFoods] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [modal, setModal] = useState(null) // 'auth', 'cart', 'address', 'order', 'checkout'
  const [mode, setMode] = useState('login')
  const [accountType, setAccountType] = useState('user')
  const [session, setSession] = useState(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [guestCheckoutPrompt, setGuestCheckoutPrompt] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD')
  const [onlinePaymentModalData, setOnlinePaymentModalData] = useState(null)

  const [currentView, setCurrentView] = useState('feed') // 'feed', 'restaurant', 'restaurant-reels', 'studio', 'delivery', 'profile'
  const [partnerSubTab, setPartnerSubTab] = useState('overview')
  const [riderSubTab, setRiderSubTab] = useState('active')
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigateTo = (path) => {
    window.history.pushState({}, '', path)
    setPathname(path)
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [toast, setToast] = useState(null)
  const [showSearchOverlay, setShowSearchOverlay] = useState(false)

  const [likedDishes, setLikedDishes] = useState([])
  const [selectedFoodForOrder, setSelectedFoodForOrder] = useState(null)
  const [orderForm, setOrderForm] = useState({ name: '', email: '', phone: '', address: '', quantity: 1, instructions: '' })
  const [sendingOrder, setSendingOrder] = useState(false)

  // Cart & Address State
  const [cart, setCart] = useState({ items: [], subtotal: 0, foodPartner: null })
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)

  // Single-Restaurant Cart Conflict Modal State
  const [cartConflictModalOpen, setCartConflictModalOpen] = useState(false)
  const [conflictData, setConflictData] = useState(null)

  // Location Modal State
  const [locationModalOpen, setLocationModalOpen] = useState(false)

  // Restaurant Profile & Reels State
  const [restaurantViewId, setRestaurantViewId] = useState(null)
  const [restaurantReelsId, setRestaurantReelsId] = useState(null)
  const [selectedRestaurantInfo, setSelectedRestaurantInfo] = useState(null)

  // Order Tracker State
  const [activeTrackerOrderId, setActiveTrackerOrderId] = useState(null)
  const [userOrders, setUserOrders] = useState([])

  // User Social Profile State
  const [viewProfileUserId, setViewProfileUserId] = useState(null)

  // Dedicated Footer Page Modal State
  const [footerModalKey, setFooterModalKey] = useState(null)

  // Theme Switcher State (Dark / Light Theme)
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('zesty_theme') || 'dark'
  })

  const toggleThemeMode = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark'
    setThemeMode(nextTheme)
    localStorage.setItem('zesty_theme', nextTheme)
    showToast(`Switched to ${nextTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} Theme`, 'info')
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3800)
  }

  // Load persistent Guest Cart from localStorage
  const loadGuestCart = () => {
    try {
      const saved = localStorage.getItem('zesty_guest_cart')
      if (saved) return JSON.parse(saved)
    } catch { }
    return { items: [], subtotal: 0, foodPartner: null }
  }

  const saveGuestCart = (newCart) => {
    try {
      localStorage.setItem('zesty_guest_cart', JSON.stringify(newCart))
    } catch { }
  }

  useEffect(() => {
    checkSession()
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 10000,
    })
    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  const checkSession = async () => {
    try {
      const data = await request('/auth/me')
      setSession(data)
      if (data.type === 'delivery') setCurrentView('delivery')
      else if (data.type === 'foodpartner') setCurrentView('studio')

      if (data.type === 'user') {
        fetchCart()
        fetchAddresses()
        fetchUserOrders()
      }
    } catch {
      setSession(null)
      // Unauthenticated Guest: load guest cart from localStorage
      const guestC = loadGuestCart()
      setCart(guestC)
    }
  }

  const loadFeed = async () => {
    setLoadingFeed(true)
    try {
      const data = await request('/food')
      setFoods(data.foodItems || [])
    } catch (err) {
      setFoods([])
    } finally {
      setLoadingFeed(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  const fetchCart = async () => {
    try {
      const data = await request('/cart')
      setCart(data.cart || { items: [], subtotal: 0, foodPartner: null })
    } catch { }
  }

  const fetchAddresses = async () => {
    try {
      const data = await request('/address')
      setAddresses(data.addresses || [])
      if (data.addresses && data.addresses.length > 0) {
        setSelectedAddress(data.addresses.find(a => a.isDefault) || data.addresses[0])
      }
    } catch { }
  }

  const fetchUserOrders = async () => {
    try {
      const data = await request('/orders/my-orders')
      setUserOrders(data.orders || [])
    } catch { }
  }

  // Strict Role Portal Guard Navigation Handler
  const handlePortalNavigation = (targetView, requiredRole) => {
    // 1. NON-CUSTOMER ROLES CANNOT BROWSE CUSTOMER FEEDS
    if (session && session.type !== 'user' && (targetView === 'feed' || targetView === 'reels' || targetView === 'profile' || targetView === 'orders')) {
      const roleTitle = session.type === 'foodpartner' ? 'Restaurant Partner' : session.type === 'delivery' ? 'Delivery Rider' : 'Super Admin'
      showToast(`🔒 Access Restricted: Active as ${roleTitle}. Customer feed is disabled for partner accounts.`, 'error')
      return
    }

    // 2. CUSTOMER / GUEST CANNOT ACCESS PARTNER OR RIDER PORTALS
    if (requiredRole && requiredRole !== 'user') {
      if (session?.type === requiredRole) {
        setCurrentView(targetView)
      } else {
        setAccountType(requiredRole)
        setMode('login')
        setModal('auth')
        const roleName = requiredRole === 'foodpartner' ? 'Restaurant Partner' : 'Delivery Rider'
        showToast(`🔒 Access Blocked: Customer accounts cannot access ${roleName} portal. Please Sign In with a verified ${roleName} account.`, 'error')
      }
      return
    }

    if (targetView === 'feed' || targetView === 'reels') {
      setCurrentView(targetView)
      return
    }
    if (targetView === 'orders' || targetView === 'profile') {
      if (session?.type === 'user') {
        setViewProfileUserId(session?.profile?._id || session?.id)
        setCurrentView('profile')
      } else {
        setAccountType('user')
        setMode('login')
        setModal('auth')
        showToast('Please Sign In as Customer to view your customer profile', 'info')
      }
      return
    }
  }

  // Handle Add to Cart (Supports Guest Cart & Logged-in Cart)
  const handleAddToCart = async (food, clearAndAdd = false) => {
    const partnerId = food.foodPartner?._id || food.foodPartner
    const partnerName = food.foodPartner?.name || 'Restaurant'

    if (session && session.type !== 'user') {
      const roleTitle = session.type === 'foodpartner' ? 'Restaurant Partner' : session.type === 'delivery' ? 'Delivery Rider' : 'Super Admin'
      showToast(`Access Restricted: ${roleTitle} accounts cannot place customer orders.`, 'error')
      return
    }

    if (!session) {
      const currentCart = cart.items.length > 0 ? cart : loadGuestCart()
      const isDifferentRestaurant = currentCart.foodPartner && currentCart.foodPartner !== partnerId

      if (isDifferentRestaurant && currentCart.items.length > 0 && !clearAndAdd) {
        setConflictData({
          itemToAdd: food,
          existingRestaurant: 'another restaurant',
          newRestaurant: partnerName
        })
        setCartConflictModalOpen(true)
        return
      }

      let newItems = []
      if (clearAndAdd || isDifferentRestaurant) {
        newItems = [{
          _id: food._id,
          foodId: food._id,
          name: food.name,
          price: food.price || 299,
          packagingCharge: food.packagingCharge || 0,
          quantity: 1
        }]
      } else {
        const existingIndex = currentCart.items.findIndex(i => (i._id || i.foodId) === food._id)
        if (existingIndex > -1) {
          newItems = currentCart.items.map((i, idx) =>
            idx === existingIndex ? { ...i, quantity: i.quantity + 1 } : i
          )
        } else {
          newItems = [...currentCart.items, {
            _id: food._id,
            foodId: food._id,
            name: food.name,
            price: food.price || 299,
            packagingCharge: food.packagingCharge || 0,
            quantity: 1
          }]
        }
      }

      const subtotal = newItems.reduce((s, i) => s + (i.price * i.quantity), 0)
      const updatedGuestCart = { items: newItems, subtotal, foodPartner: partnerId }
      setCart(updatedGuestCart)
      saveGuestCart(updatedGuestCart)
      setCartConflictModalOpen(false)
      showToast(`Added ${food.name} to Guest Cart! 🛒`, 'success')
      return
    }

    try {
      const res = await request('/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId: food._id, quantity: 1, clearAndAdd })
      })
      setCart(res.cart)
      setCartConflictModalOpen(false)
      showToast(`${food.name} added to cart!`, 'success')
    } catch (err) {
      if (err.code === 'CART_RESTAURANT_MISMATCH' || err.data?.code === 'CART_RESTAURANT_MISMATCH') {
        setConflictData({
          itemToAdd: food,
          existingRestaurant: err.data?.existingRestaurant,
          newRestaurant: err.data?.newRestaurant
        })
        setCartConflictModalOpen(true)
      } else {
        showToast(err.message, 'error')
      }
    }
  }

  // Handle Quantity Increase/Decrease & Remove Item
  const handleUpdateCartItemQuantity = async (foodId, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(foodId)
      return
    }

    if (!session || session.type !== 'user') {
      const currentCart = loadGuestCart()
      const updatedItems = currentCart.items.map(item =>
        (item._id || item.foodId) === foodId ? { ...item, quantity: newQty } : item
      )
      const subtotal = updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0)
      const updatedGuestCart = { ...currentCart, items: updatedItems, subtotal }
      setCart(updatedGuestCart)
      saveGuestCart(updatedGuestCart)
      return
    }

    try {
      const res = await request('/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId, quantity: newQty })
      })
      setCart(res.cart)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleRemoveCartItem = async (foodId) => {
    if (!session || session.type !== 'user') {
      const currentCart = loadGuestCart()
      const updatedItems = currentCart.items.filter(item => (item._id || item.foodId) !== foodId)
      const subtotal = updatedItems.reduce((s, i) => s + (i.price * i.quantity), 0)
      const updatedGuestCart = {
        items: updatedItems,
        subtotal,
        foodPartner: updatedItems.length > 0 ? currentCart.foodPartner : null
      }
      setCart(updatedGuestCart)
      saveGuestCart(updatedGuestCart)
      showToast('Item removed from cart', 'info')
      return
    }

    try {
      const res = await request('/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId })
      })
      setCart(res.cart)
      showToast('Item removed from cart', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Guest Proceed to Checkout Trigger
  const handleProceedToCheckout = () => {
    if (!session || session.type !== 'user') {
      setGuestCheckoutPrompt(true)
      setModal('auth')
      showToast('Login or create an account to continue with delivery 📦', 'info')
      return
    }

    if (!selectedAddress) {
      setLocationModalOpen(true)
      showToast('Please confirm your delivery location', 'info')
      return
    }

    setModal('checkout')
  }

  const handleSaveAddress = async (addressObj) => {
    try {
      if (session && session.type === 'user') {
        await request('/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressObj)
        })
        fetchAddresses()
      } else {
        setAddresses([addressObj, ...addresses])
        setSelectedAddress(addressObj)
      }
      showToast('Delivery address saved successfully! 📍', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handlePlaceOrder = async () => {
    if (!session || session.type !== 'user') {
      setGuestCheckoutPrompt(true)
      setModal('auth')
      return
    }
    if (!selectedAddress) {
      showToast('Please confirm your delivery address first', 'error')
      setLocationModalOpen(true)
      return
    }

    if (selectedPaymentMethod === 'COD') {
      try {
        const data = await request('/orders/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryAddress: selectedAddress,
            paymentMethod: 'COD',
            deliveryOption: 'Normal Delivery',
            items: cart.items || []
          })
        })
        setModal(null)
        localStorage.removeItem('zesty_guest_cart')
        fetchCart()
        fetchUserOrders()
        showToast(`Order #${data.order.orderNumber} placed successfully! 🎉`, 'success')
        setActiveTrackerOrderId(data.order._id)
      } catch (err) {
        showToast(err.message, 'error')
      }
    } else {
      // Online Payment (Razorpay / Digital Gateway)
      try {
        showToast('Initiating secure online payment...', 'info')
        const data = await request('/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryAddress: selectedAddress,
            paymentMethod: 'Razorpay',
            items: cart.items || []
          })
        })

        // Check if key is a real Razorpay key (live or test) — both open the real Razorpay checkout
        const razorpayKey = data.publicConfig?.key || import.meta.env.VITE_RAZORPAY_KEY_ID;
        const isRealKey = razorpayKey && (razorpayKey.startsWith('rzp_live_') || razorpayKey.startsWith('rzp_test_'));

        const openRazorpay = () => {
          const options = {
            key: razorpayKey,
            amount: data.amount,
            currency: 'INR',
            name: 'Zesty Food Delivery',
            description: `Payment for Order #${data.orderNumber}`,
            order_id: data.gatewayOrderId,
            handler: async function (response) {
              try {
                await request('/payments/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: data.orderId,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature
                  })
                })
                setModal(null)
                localStorage.removeItem('zesty_guest_cart')
                fetchCart()
                fetchUserOrders()
                showToast(`Payment successful! Order #${data.orderNumber} placed! 🎉`, 'success')
                setActiveTrackerOrderId(data.orderId)
              } catch (verifyErr) {
                showToast(verifyErr.message || 'Payment verification failed', 'error')
              }
            },
            prefill: {
              name: selectedAddress?.fullName || session?.profile?.fullName || 'Customer',
              email: session?.profile?.email || session?.email || '',
              contact: selectedAddress?.phone || ''
            },
            theme: { color: '#dc2743' }
          }
          const rzp = new window.Razorpay(options)
          rzp.open()
        }

        if (selectedPaymentMethod === 'UPI') {
          // Dedicated Zesty Instant UPI & Dynamic QR Code Flow
          setOnlinePaymentModalData(data)
        } else if (isRealKey) {
          if (window.Razorpay) {
            try { openRazorpay() } catch { setOnlinePaymentModalData(data) }
          } else {
            // Dynamically load Razorpay checkout script if not already loaded
            const script = document.createElement('script')
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.onload = () => { try { openRazorpay() } catch { setOnlinePaymentModalData(data) } }
            script.onerror = () => { setOnlinePaymentModalData(data) }
            document.body.appendChild(script)
          }
        } else {
          // Open Zesty Online Gateway Payment Modal
          setOnlinePaymentModalData(data)
        }
      } catch (err) {
        showToast(err.message || 'Online payment initialization failed', 'error')
      }
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const formData = new FormData(e.target)
    const payload = Object.fromEntries(formData.entries())

    let endpoint = ''
    if (accountType === 'admin') {
      endpoint = '/auth/admin/login'
    } else if (accountType === 'delivery') {
      endpoint = mode === 'signup' ? '/auth/delivery/register' : '/auth/delivery/login'
    } else if (accountType === 'user') {
      endpoint = mode === 'signup' ? '/auth/user/register' : '/auth/user/login'
    } else {
      endpoint = mode === 'signup' ? '/auth/foodpartner/register' : '/auth/foodpartner/login'
    }

    try {
      const res = await request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const authToken = res.token || res.accessToken
      if (authToken) {
        localStorage.setItem('zesty_token', authToken)
      }

      await checkSession()

      const guestCartObj = loadGuestCart()
      if (guestCartObj.items && guestCartObj.items.length > 0) {
        try {
          const mergeRes = await request('/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: guestCartObj.items })
          })
          setCart(mergeRes.cart)
          localStorage.removeItem('zesty_guest_cart')
        } catch { }
      }

      setAuthLoading(false)
      showToast(`Welcome! Signed in as ${accountType}`, 'success')

      if (guestCheckoutPrompt) {
        setGuestCheckoutPrompt(false)
        setModal('checkout')
      } else {
        setModal(null)
        if (accountType === 'user') {
          setCurrentView('feed')
        }
      }
    } catch (err) {
      setAuthError(err.message)
      setAuthLoading(false)
    }
  }

  const handleAdminLoginFormSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const formData = new FormData(e.target)
    const payload = Object.fromEntries(formData.entries())

    try {
      const res = await request('/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const authToken = res.token || res.accessToken
      if (authToken) {
        localStorage.setItem('zesty_token', authToken)
      }

      await checkSession()
      setAuthLoading(false)
      showToast('Super Admin authenticated successfully! 🛡️', 'success')
    } catch (err) {
      setAuthError(err.message)
      setAuthLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) {
      showToast('Google Sign-In credential token missing', 'error')
      return
    }
    setAuthError('')
    setAuthLoading(true)

    try {
      const res = await request('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
          role: accountType
        }),
      })

      const authToken = res.token || res.accessToken
      if (authToken) {
        localStorage.setItem('zesty_token', authToken)
      }

      await checkSession()

      const guestCartObj = loadGuestCart()
      if (guestCartObj.items && guestCartObj.items.length > 0) {
        try {
          const mergeRes = await request('/cart/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: guestCartObj.items })
          })
          setCart(mergeRes.cart)
          localStorage.removeItem('zesty_guest_cart')
        } catch { }
      }

      setAuthLoading(false)
      showToast(`Welcome! Signed in with Google as ${res.user?.name || res.user?.email || accountType}`, 'success')

      if (guestCheckoutPrompt) {
        setGuestCheckoutPrompt(false)
        setModal('checkout')
      } else {
        setModal(null)
        if (accountType === 'user') {
          setCurrentView('feed')
        } else if (accountType === 'foodpartner') {
          setCurrentView('studio')
        } else if (accountType === 'delivery') {
          setCurrentView('delivery')
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Google Authentication failed')
      setAuthLoading(false)
    }
  }

  const handleGoogleError = () => {
    showToast('Google OAuth window closed or authentication failed', 'error')
  }



  const handleLogout = async () => {
    try {
      let ep = '/auth/user/logout'
      if (session?.type === 'foodpartner') ep = '/auth/foodpartner/logout'
      await request(ep)
    } catch (err) {
    } finally {
      localStorage.removeItem('zesty_token')
      setSession(null)
      setCurrentView('feed')
      setCart({ items: [], subtotal: 0, foodPartner: null })
      showToast('Signed out.', 'info')
    }
  }


  const loadAdminData = async () => {
    try {
      const stats = await request('/admin/dashboard-stats')
      setAdminStats(stats.stats)
      const users = await request('/admin/users')
      setAdminUsers(users.users)
    } catch { }
  }

  useEffect(() => {
    if (currentView === 'admin' && session?.type === 'admin') {
      loadAdminData()
    }
  }, [currentView, session])

  const filteredFoods = foods.filter((food) => {
    const matchesCategory = activeCategory === 'All' || (food.category && food.category.toLowerCase() === activeCategory.toLowerCase())
    const matchesSearch = !searchQuery || food.name?.toLowerCase().includes(searchQuery.toLowerCase()) || food.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // In Reels section, show ONLY restaurant video reels (exclude static photo posts)
    if (currentView === 'reels') {
      const isVideoReel = Boolean(food.video) && food.mediaType !== 'image'
      return matchesCategory && matchesSearch && isVideoReel
    }

    return matchesCategory && matchesSearch
  })

  // Transparent Order Pricing Calculations
  const foodSubtotal = cart.subtotal || 0
  const packagingCharge = cart.items?.length > 0 ? 20 : 0
  const taxableAmount = foodSubtotal + packagingCharge
  const gstTax = Math.round(taxableAmount * 0.05)
  const deliveryFee = 40
  const grandTotal = foodSubtotal > 0 ? foodSubtotal + packagingCharge + gstTax + deliveryFee : 0

  const handleDirectOrderSubmit = (e) => {
    e.preventDefault()
    setSendingOrder(true)
    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_im1x99p'
    const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_hlypikk'
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '8B2JshnA4pf-Qb4lO'

    const templateParams = {
      user_name: orderForm.name,
      user_email: orderForm.email,
      user_phone: orderForm.phone,
      user_address: orderForm.address,
      dish_name: selectedFoodForOrder?.name || 'Zesty Dish',
      dish_quantity: orderForm.quantity,
      special_instructions: orderForm.instructions,
      restaurant_name: selectedFoodForOrder?.foodPartner?.name || 'Zesty Partner'
    }

    emailjs.send(serviceID, templateID, templateParams, publicKey)
      .then(() => {
        showToast('Order inquiry emailed to restaurant! 📩', 'success')
        setModal(null)
        setOrderForm({ name: '', email: '', phone: '', address: '', quantity: 1, instructions: '' })
      })
      .catch((err) => {
        showToast('Failed to send email order: ' + err.text, 'error')
      })
      .finally(() => {
        setSendingOrder(false)
      })
  }

  const activeCartCount = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0

  if (pathname.startsWith('/admin')) {
    return (
      <div className="ig-web-shell admin-shell" data-theme={themeMode}>
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

        {session?.type === 'admin' ? (
          <div className="admin-portal-container">
            <div className="admin-top-nav">
              <div className="admin-nav-brand" onClick={() => navigateTo('/')}>
                <img src="/favicon.svg" alt="Zesty Logo" className="ig-logo-icon" />
                <h2>Zesty Admin Console</h2>
              </div>
              <div className="admin-nav-right">
                <span className="admin-user-pill">🛡️ {session.profile?.name || session.profile?.email || 'Super Admin'}</span>
                <button className="secondary-btn sm" onClick={toggleThemeMode}>{themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}</button>
                <button className="secondary-btn sm danger" onClick={handleLogout}>🔒 Sign Out Admin</button>
              </div>
            </div>
            <AdminControlPanel session={session} showToast={showToast} onLogout={handleLogout} />
          </div>
        ) : session ? (
          <div className="admin-portal-container flex-center">
            <div className="access-blocked-card admin-forbidden-card">
              <div className="forbidden-badge">🔒 403 Forbidden</div>
              <h2>Admin Access Restricted</h2>
              <p>You are currently authenticated as <strong>{session.type.toUpperCase()}</strong> ({session.profile?.email || session.profile?.fullName || session.email}).</p>
              <p className="access-sub">Super Admin role privileges are required to view /admin. Customer and Partner accounts do not have access to platform management tools.</p>
              <div className="forbidden-actions">
                <button className="primary-btn" onClick={() => navigateTo('/')}>
                  ➔ Return to Public Website
                </button>
                <button className="secondary-btn" onClick={handleLogout}>
                  Sign Out of Current Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-portal-container flex-center">
            <div className="admin-login-card">
              <div className="admin-card-header">
                <span className="admin-shield-icon">🛡️</span>
                <h2>Super Admin Portal</h2>
                <p>Protected Enterprise Management Console</p>
              </div>

              <form onSubmit={handleAdminLoginFormSubmit} className="auth-form admin-login-form">
                <div className="form-group-v2">
                  <label className="input-label-v2">Admin Email Address</label>
                  <input type="email" name="email" required placeholder="admin@zesty.app" className="input-field-v2" />
                </div>

                <div className="form-group-v2">
                  <label className="input-label-v2">Master Password</label>
                  <input type="password" name="password" required placeholder="••••••••" className="input-field-v2" />
                </div>

                {authError && <p className="error-msg">{authError}</p>}

                <button type="submit" className="primary-btn full-width" disabled={authLoading}>
                  {authLoading ? 'Verifying Admin Security...' : 'Sign In to Admin Console 🛡️'}
                </button>
              </form>

              <div className="admin-login-footer">
                <button className="text-link-sm" onClick={() => navigateTo('/')}>
                  ← Return to Public Website
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="ig-web-shell" data-theme={themeMode}>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {/* 1. INSTAGRAM WEB LEFT SIDEBAR NAVIGATION */}
      <aside className="ig-left-sidebar">
        <div className="ig-sidebar-header" onClick={() => setCurrentView('feed')}>
          <div className="ig-logo-container">
            <img src="/favicon.svg" alt="Zesty Logo" className="ig-logo-icon" />
            <h1 className="ig-logo-text">Zesty</h1>
          </div>
        </div>

        <div className="ig-nav-menu">
          {session?.type === 'foodpartner' || currentView === 'studio' ? (
            <>
              <button
                className={`ig-nav-item ${currentView === 'studio' && partnerSubTab === 'overview' ? 'active' : ''}`}
                onClick={() => { setPartnerSubTab('overview'); setCurrentView('studio'); }}
              >
                <span className="ig-emoji-icon">🏪</span>
                <span className="ig-nav-label">Partner Studio</span>
              </button>
              <button
                className={`ig-nav-item ${currentView === 'studio' && partnerSubTab === 'overview' ? 'active' : ''}`}
                onClick={() => { setPartnerSubTab('overview'); setCurrentView('studio'); }}
              >
                <span className="ig-emoji-icon">📋</span>
                <span className="ig-nav-label">Kitchen Orders</span>
              </button>
              <button
                className={`ig-nav-item ${currentView === 'studio' && partnerSubTab === 'payouts' ? 'active' : ''}`}
                onClick={() => { setPartnerSubTab('payouts'); setCurrentView('studio'); }}
              >
                <span className="ig-emoji-icon">💳</span>
                <span className="ig-nav-label">Payout & Bank</span>
              </button>
            </>
          ) : session?.type === 'delivery' || currentView === 'delivery' ? (
            <>
              <button
                className={`ig-nav-item ${currentView === 'delivery' && riderSubTab === 'active' ? 'active' : ''}`}
                onClick={() => { setRiderSubTab('active'); setCurrentView('delivery'); }}
              >
                <span className="ig-emoji-icon">🛵</span>
                <span className="ig-nav-label">Rider Workspace</span>
              </button>
              <button
                className={`ig-nav-item ${currentView === 'delivery' && riderSubTab === 'active' ? 'active' : ''}`}
                onClick={() => { setRiderSubTab('active'); setCurrentView('delivery'); }}
              >
                <span className="ig-emoji-icon">📦</span>
                <span className="ig-nav-label">Deliveries</span>
              </button>
              <button
                className={`ig-nav-item ${currentView === 'delivery' && riderSubTab === 'payouts' ? 'active' : ''}`}
                onClick={() => { setRiderSubTab('payouts'); setCurrentView('delivery'); }}
              >
                <span className="ig-emoji-icon">💳</span>
                <span className="ig-nav-label">Rider Payout</span>
              </button>
            </>

          ) : (
            <>
              <button
                className={`ig-nav-item ${currentView === 'feed' ? 'active' : ''}`}
                onClick={() => handlePortalNavigation('feed')}
              >
                <IconHomeIG />
                <span className="ig-nav-label">Home</span>
              </button>

              <button
                className="ig-nav-item"
                onClick={() => setShowSearchOverlay(!showSearchOverlay)}
              >
                <IconSearchIG />
                <span className="ig-nav-label">Search</span>
              </button>

              <button
                className={`ig-nav-item ${currentView === 'reels' ? 'active' : ''}`}
                onClick={() => handlePortalNavigation('reels')}
              >
                <IconReelsIG />
                <span className="ig-nav-label">Reels</span>
              </button>

              <button
                className={`ig-nav-item ${currentView === 'profile' || currentView === 'orders' ? 'active' : ''}`}
                onClick={() => handlePortalNavigation('profile')}
              >
                <IconUserIG />
                <span className="ig-nav-label">Profile</span>
                {userOrders.length > 0 && <span className="ig-nav-badge">{userOrders.length}</span>}
              </button>

              <button
                className="ig-nav-item"
                onClick={() => setModal('cart')}
              >
                <IconBagIG />
                <span className="ig-nav-label">Cart</span>
                {activeCartCount > 0 && <span className="ig-nav-badge danger">{activeCartCount}</span>}
              </button>

              <button
                className="ig-nav-item location-nav-item"
                onClick={() => setLocationModalOpen(true)}
              >
                <IconPinIG />
                <span className="ig-nav-label">Location</span>
              </button>
            </>
          )}

          {/* Theme Switcher Button */}
          <button className="ig-nav-item theme-toggle-nav-item" onClick={toggleThemeMode}>
            <span className="ig-emoji-icon">{themeMode === 'dark' ? '☀️' : '🌙'}</span>
            <span className="ig-nav-label">{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* Footer Account Status & Quick 1-Click Test User Switcher */}
        <div className="ig-sidebar-footer">
          {session ? (
            <div className="ig-account-footer-group">
              <div className="ig-account-card">
                <div className="ig-avatar-ring-xs">
                  <div className="ig-avatar-inner-xs">
                    {(session.profile?.profilePicture || session.profile?.avatar || session.user?.profilePicture || session.user?.avatar) ? (
                      <img
                        src={session.profile?.profilePicture || session.profile?.avatar || session.user?.profilePicture || session.user?.avatar}
                        alt="Profile"
                        className="profile-img-avatar"
                      />
                    ) : (
                      <span className="user-avatar-initials-xs">
                        {(session.profile?.fullName || session.profile?.name || session.profile?.username || session.user?.fullName || 'US').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ig-acc-text">
                  <span className="ig-acc-name">@{session.profile?.username || session.profile?.fullName || session.profile?.name || 'user'}</span>
                  <span className="ig-acc-sub">{session.type?.toUpperCase()}</span>
                </div>
                <button className="ig-logout-btn" onClick={handleLogout} title="Log Out">
                  <IconLogoutIG />
                </button>
              </div>
            </div>
          ) : (
            <button className="primary-btn full-width ig-login-sidebar-btn" onClick={() => { setAccountType('user'); setModal('auth'); }}>
              🔑 Sign In / Register
            </button>
          )}


        </div>
      </aside>

      {/* SEARCH OVERLAY BAR */}
      {showSearchOverlay && (
        <div className="ig-search-drawer">
          <div className="search-drawer-header">
            <h3>Search</h3>
            <button onClick={() => setShowSearchOverlay(false)}><IconClose /></button>
          </div>
          <div className="search-input-box">
            <IconSearchIG />
            <input
              type="text"
              placeholder="Search food reels, dishes or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* 2. MAIN CONTENT CANVAS */}
      <div className="ig-main-canvas">
        {/* MOBILE TOP HEADER BAR (Visible only on screens <= 768px) */}
        <header className="ig-mobile-top-header">
          <div className="ig-mobile-logo" onClick={() => setCurrentView('feed')}>
            <img src="/favicon.svg" alt="Zesty Logo" className="ig-mobile-logo-icon" />
            <span className="ig-mobile-logo-text">Zesty</span>
          </div>
          <div className="ig-mobile-actions">
            <button className="ig-mobile-action-btn" onClick={() => setLocationModalOpen(true)} title="Location">
              <IconPinIG />
            </button>
            <button className="ig-mobile-action-btn" onClick={toggleThemeMode} title="Toggle Theme">
              <span>{themeMode === 'dark' ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </header>

        {/* REELS DISCOVERY FEED & REELS SECTION VIEW (Customer / Guest Only) */}
        {(!session || session.type === 'user') && (currentView === 'feed' || currentView === 'reels') && (
          <div className="ig-feed-layout">
            {/* Center Feed Column */}
            <div className="ig-center-column">
              {/* INSTAGRAM TOP STORIES BAR (Horizontal Scrolling Circles with Gradient Rings) */}
              <div className="ig-stories-scroll-wrapper">
                <button
                  className="ig-stories-arrow ig-stories-arrow-left"
                  onClick={() => {
                    const bar = document.getElementById('ig-stories-bar-inner')
                    if (bar) bar.scrollBy({ left: -200, behavior: 'smooth' })
                  }}
                  aria-label="Scroll categories left"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className="ig-stories-bar" id="ig-stories-bar-inner">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.id}
                      className={`ig-story-item ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      <div className="ig-story-ring">
                        <div className="ig-story-circle">
                          <span className="story-emoji">{cat.icon}</span>
                        </div>
                      </div>
                      <span className="story-name">{cat.handle}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="ig-stories-arrow ig-stories-arrow-right"
                  onClick={() => {
                    const bar = document.getElementById('ig-stories-bar-inner')
                    if (bar) bar.scrollBy({ left: 200, behavior: 'smooth' })
                  }}
                  aria-label="Scroll categories right"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* REELS VIDEO FEED */}
              {loadingFeed ? (
                <div className="feed-loading-container">
                  <div className="spinner"></div>
                  <p>Loading Reels Feed...</p>
                </div>
              ) : (
                <div className="ig-reels-list">
                  {filteredFoods.length > 0 ? (
                    filteredFoods.map((food) => (
                      <ReelCard
                        key={food._id}
                        food={food}
                        onAddToCart={handleAddToCart}
                        onOpenRestaurant={(partnerId, info) => {
                          setRestaurantViewId(partnerId)
                          setSelectedRestaurantInfo(info)
                          setCurrentView('restaurant')
                        }}
                        onEmailOrder={(foodItem) => {
                          setSelectedFoodForOrder(foodItem)
                          setModal('order')
                        }}
                        isLiked={likedDishes.includes(food._id)}
                        onToggleLike={(id) => {
                          setLikedDishes((prev) =>
                            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                          )
                        }}
                      />
                    ))
                  ) : (
                    <div className="empty-feed-card">
                      <div className="empty-feed-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                      <h3>No Food Reels Available</h3>
                      <p>Be the first partner to upload short food films &amp; dishes!</p>
                      {session?.type === 'foodpartner' && (
                        <button className="primary-btn" onClick={() => setCurrentView('studio')} style={{ marginTop: '12px' }}>
                          ➕ Upload First Reel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INSTAGRAM RIGHT SIDEBAR PANEL (User Switch + Suggested Creators) */}
            <aside className="ig-right-panel">
              {/* Logged in User Profile Card */}
              <div className="ig-user-switch-card">
                <div className="ig-avatar-ring-md">
                  <div className="ig-avatar-inner-md">
                    {(session?.profile?.profilePicture || session?.profile?.avatar || session?.user?.profilePicture || session?.user?.avatar) ? (
                      <img
                        src={session.profile?.profilePicture || session.profile?.avatar || session.user?.profilePicture || session.user?.avatar}
                        alt="Profile"
                        className="profile-img-avatar"
                      />
                    ) : (
                      <span className="user-avatar-initials-md">
                        {(session?.profile?.fullName || session?.profile?.name || session?.profile?.username || 'US').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ig-switch-text">
                  <strong className="ig-user-handle">
                    @{session?.profile?.username || (session?.profile?.email ? session.profile.email.split('@')[0] : 'foodie')}
                  </strong>
                  <span className="ig-user-fullname">
                    {session?.profile?.fullName || session?.profile?.name || 'Food Explorer'}
                  </span>
                </div>
              </div>

              {/* Suggested for You Header */}
              {SUGGESTED_CREATORS.length > 0 && (
                <>
                  <div className="ig-suggested-header">
                    <span>Suggested for you</span>
                    <button className="ig-see-all-btn" onClick={() => showToast('Exploring food creators...', 'info')}>See all</button>
                  </div>

                  {/* Suggested Creators List */}
                  <div className="ig-suggested-list">
                    {SUGGESTED_CREATORS.map((c) => (
                      <div key={c.id} className="ig-suggested-item">
                        <div className="ig-avatar-ring-sm">
                          <div className="ig-avatar-inner-sm">{c.avatar}</div>
                        </div>
                        <div className="ig-suggested-info">
                          <span className="suggested-name">{c.handle}</span>
                          <span className="suggested-sub">{c.sub}</span>
                        </div>
                        <button
                          className="ig-follow-link"
                          onClick={() => showToast(`Following @${c.handle}! 🎉`, 'success')}
                        >
                          Follow
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Ultra-Styled Instagram Web Footer Box with Dedicated Pages */}
              <div className="ig-footer-card-box">
                <div className="footer-links-group">
                  <span className="footer-group-label">Platform Info</span>
                  <div className="footer-links-inline">
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('about')}>About</span> •{' '}
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('help')}>Help</span> •{' '}
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('press')}>Press</span> •{' '}
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('api')}>API</span> •{' '}
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('jobs')}>Jobs</span> •{' '}
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('privacy')}>Privacy</span> •{' '}
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('terms')}>Terms</span>
                  </div>
                </div>

                <div className="footer-links-group highlight-group">
                  <span className="footer-group-label">Portals & Workspaces</span>
                  <div className="footer-portal-buttons">
                    <button className="portal-footer-btn partner" onClick={() => handlePortalNavigation('studio', 'foodpartner')}>
                      🏪 Partner Studio
                    </button>
                    <button className="portal-footer-btn rider" onClick={() => handlePortalNavigation('delivery', 'delivery')}>
                      🛵 Rider Workspace
                    </button>
                  </div>
                </div>

                <div className="footer-links-group">
                  <span className="footer-group-label">Preferences</span>
                  <div className="footer-links-inline">
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('locations')}>📍 Locations</span> •{' '}
                    <span className="ig-footer-link" onClick={() => setFooterModalKey('language')}>🌐 Language</span> •{' '}
                    <span className="ig-footer-link highlight" onClick={() => setFooterModalKey('meta-verified')}>⭐ Meta Verified</span>
                  </div>
                </div>

                <p className="ig-copyright">© 2026 INSTAGRAM FROM ZESTY</p>
              </div>
            </aside>
          </div>
        )}

        {/* RESTAURANT PROFILE VIEW */}
        {currentView === 'restaurant' && (
          <RestaurantProfile
            restaurantId={restaurantViewId}
            onBack={() => setCurrentView('feed')}
            onOpenRestaurantReels={(id, info) => {
              setRestaurantReelsId(id)
              setSelectedRestaurantInfo(info)
              setCurrentView('restaurant-reels')
            }}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* RESTAURANT REELS FEED VIEW */}
        {currentView === 'restaurant-reels' && (
          <RestaurantReelsFeed
            restaurantId={restaurantReelsId}
            restaurantInfo={selectedRestaurantInfo}
            onBack={() => setCurrentView('restaurant')}
            onAddToCart={handleAddToCart}
            onEmailOrder={(foodItem) => {
              setSelectedFoodForOrder(foodItem)
              setModal('order')
            }}
            likedDishes={likedDishes}
            onToggleLike={(id) => {
              setLikedDishes((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              )
            }}
          />
        )}

        {/* CUSTOMER PROFILE VIEW (For logged in user or own profile) */}
        {(currentView === 'profile' || currentView === 'orders') && (!viewProfileUserId || viewProfileUserId === (session?.profile?._id || session?.id || session?.user?._id)) && (
          <CustomerProfile
            session={session}
            userOrders={userOrders}
            likedFoods={foods.filter(f => likedDishes.includes(f._id))}
            addresses={addresses}
            onTrackOrder={(orderId) => setActiveTrackerOrderId(orderId)}
            onOpenAddressModal={() => setLocationModalOpen(true)}
            onAddToCart={handleAddToCart}
          />
        )}

        {/* OTHER USER SOCIAL PROFILE VIEW (When viewing another creator/user profile) */}
        {(currentView === 'profile' || currentView === 'orders') && viewProfileUserId && viewProfileUserId !== (session?.profile?._id || session?.id || session?.user?._id) && (
          <SocialUserProfile
            userId={viewProfileUserId}
            session={session}
            onAddToCart={handleAddToCart}
            onOpenRestaurant={(partnerId, info) => {
              setRestaurantViewId(partnerId)
              setSelectedRestaurantInfo(info)
              setCurrentView('restaurant')
            }}
            showToast={showToast}
            onBackToHome={() => setCurrentView('feed')}
          />
        )}

        {/* RESTAURANT PARTNER DASHBOARD VIEW */}
        {(currentView === 'studio' || session?.type === 'foodpartner') && (
          <RestaurantDashboard
            session={session}
            showToast={showToast}
            activeTab={partnerSubTab}
          />
        )}

        {/* DELIVERY PARTNER DASHBOARD VIEW */}
        {(currentView === 'delivery' || session?.type === 'delivery') && (
          <DeliveryDashboard
            session={session}
            showToast={showToast}
            socket={socket}
            activeTab={riderSubTab}
          />
        )}


      </div>

      {/* Geolocation Address Modal */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelectAddress={(addr) => setSelectedAddress(addr)}
        addresses={addresses}
        onSaveAddress={handleSaveAddress}
      />

      {/* Single Restaurant Cart Conflict Modal */}
      <CartConflictModal
        isOpen={cartConflictModalOpen}
        onClose={() => setCartConflictModalOpen(false)}
        existingRestaurant={conflictData?.existingRestaurant}
        newRestaurant={conflictData?.newRestaurant}
        itemToAdd={conflictData?.itemToAdd}
        onConfirmClearAndAdd={(foodItem) => handleAddToCart(foodItem, true)}
      />

      {/* Live Order Tracker Modal */}
      {activeTrackerOrderId && (
        <OrderStatusTracker
          orderId={activeTrackerOrderId}
          onClose={() => setActiveTrackerOrderId(null)}
          socket={socket}
        />
      )}

      {/* Premium Glassmorphism Shopping Cart Drawer Modal */}
      {modal === 'cart' && (
        <div className="modal-backdrop cart-drawer-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card cart-drawer-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="cart-drawer-header">
              <div className="cart-header-title-box">
                <h3>🛍️ Your Shopping Bag</h3>
                {cart.items?.length > 0 && (
                  <span className="cart-count-pill">{activeCartCount} {activeCartCount === 1 ? 'item' : 'items'}</span>
                )}
              </div>
              <button className="modal-close drawer-close-btn" onClick={() => setModal(null)}><IconClose /></button>
            </div>

            {/* Delivery Location Banner */}
            <div className="cart-location-strip" onClick={() => setLocationModalOpen(true)}>
              <span>📍 Delivering to: <strong>{selectedAddress ? `${selectedAddress.houseNumber || ''} ${selectedAddress.street || ''}, ${selectedAddress.city || ''}` : 'Set Delivery Address'}</strong></span>
              <button className="change-loc-link">Change</button>
            </div>

            {/* Cart Items or Empty State */}
            {cart.items?.length === 0 ? (
              <div className="cart-empty-state">
                <div className="empty-cart-icon">🛒</div>
                <h4>Your cart is empty</h4>
                <p>Explore gourmet food reels and tap <strong>Add to Cart</strong> to start your feast!</p>
                <button className="primary-btn sm" onClick={() => { setModal(null); setCurrentView('feed'); }}>
                  Explore Food Feed
                </button>
              </div>
            ) : (
              <div className="cart-drawer-body">
                {/* Item List */}
                <div className="cart-items-scroll-list">
                  {cart.items.map((item) => {
                    const itemId = item._id || item.foodId
                    return (
                      <div key={itemId || item.name} className="cart-item-card-v2">
                        <div className="item-thumb-badge">🍕</div>

                        <div className="item-details-column">
                          <h4 className="item-title">{item.name}</h4>
                          <span className="item-unit-price">₹{item.price} each</span>
                        </div>

                        {/* Interactive Quantity Stepper */}
                        <div className="qty-stepper-v2">
                          <button
                            className="stepper-btn minus"
                            onClick={() => handleUpdateCartItemQuantity(itemId, item.quantity - 1)}
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="stepper-count">{item.quantity}</span>
                          <button
                            className="stepper-btn plus"
                            onClick={() => handleUpdateCartItemQuantity(itemId, item.quantity + 1)}
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <span className="item-line-price">₹{item.price * item.quantity}</span>

                        <button
                          className="item-delete-icon-btn"
                          onClick={() => handleRemoveCartItem(itemId)}
                          title="Remove item"
                        >
                          🗑️
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Bill Details Breakdown Card */}
                <div className="cart-bill-card-v2">
                  <h4 className="bill-card-title">🧾 Bill Summary</h4>

                  <div className="bill-line">
                    <span>Food Subtotal</span>
                    <span>₹{foodSubtotal}</span>
                  </div>

                  <div className="bill-line">
                    <span>Packaging Charge <small title="Eco-friendly tamper-proof packaging">ℹ️</small></span>
                    <span>₹{packagingCharge}</span>
                  </div>

                  <div className="bill-line">
                    <span>Delivery Fee</span>
                    <span className="fee-highlight">₹{deliveryFee}</span>
                  </div>

                  <div className="bill-line">
                    <span>GST Tax & Platform Fee (5%)</span>
                    <span>₹{gstTax}</span>
                  </div>

                  <div className="bill-divider"></div>

                  <div className="bill-line total-line">
                    <strong>To Pay (Grand Total)</strong>
                    <strong className="grand-total-val">₹{grandTotal}</strong>
                  </div>
                </div>

                {/* Checkout Button */}
                <button className="primary-btn checkout-drawer-btn" onClick={handleProceedToCheckout}>
                  <span>Proceed to Checkout</span>
                  <span className="btn-price-tag">₹{grandTotal} ➔</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ultra-Clean Checkout Modal */}
      {modal === 'checkout' && (
        <div className="modal-backdrop checkout-modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card checkout-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-modal-header">
              <h3>🛍️ Order Checkout</h3>
              <button className="modal-close" onClick={() => setModal(null)}><IconClose /></button>
            </div>

            <div className="checkout-address-box-v2">
              <div className="addr-box-header">
                <span>📍 Delivery Address</span>
                <button className="change-loc-link" onClick={() => setLocationModalOpen(true)}>Change Address</button>
              </div>
              {selectedAddress ? (
                <div className="addr-text-details">
                  <strong>{selectedAddress.fullName || session?.profile?.fullName}</strong> ({selectedAddress.phone || ''})
                  <p>{selectedAddress.houseNumber}, {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}</p>
                </div>
              ) : (
                <button className="primary-btn sm" onClick={() => setLocationModalOpen(true)}>Set Delivery Address</button>
              )}
            </div>

            <div className="checkout-order-summary-v2">
              <h4 className="summary-title">📦 Items in Your Order</h4>
              <div className="checkout-items-list">
                {cart.items.map(item => (
                  <div key={item._id || item.name} className="checkout-item-row-v2">
                    <span className="item-name-qty">{item.name} × <strong>{item.quantity}</strong></span>
                    <strong className="item-price">₹{item.price * item.quantity}</strong>
                  </div>
                ))}
              </div>

              <div className="checkout-bill-breakdown">
                <div className="bill-line"><span>Food Subtotal</span><span>₹{foodSubtotal}</span></div>
                <div className="bill-line"><span>Packaging Charge</span><span>₹{packagingCharge}</span></div>
                <div className="bill-line"><span>GST Tax (5%)</span><span>₹{gstTax}</span></div>
                <div className="bill-line"><span>Delivery Fee</span><span className="fee-highlight">₹{deliveryFee}</span></div>
                <div className="bill-divider"></div>
                <div className="bill-line total-line">
                  <strong>Total Payable</strong>
                  <strong className="grand-total-val">₹{grandTotal}</strong>
                </div>
              </div>

              {/* Payment Gateway Options Selector */}
              <div className="checkout-payment-section-v2">
                <h4 className="summary-title">💳 Select Payment Method</h4>
                <div className="payment-options-grid-v2">
                  <div
                    className={`payment-card-v2 ${selectedPaymentMethod === 'UPI' ? 'active' : ''}`}
                    onClick={() => setSelectedPaymentMethod('UPI')}
                  >
                    <div className="pay-card-icon" style={{ background: 'rgba(52, 168, 83, 0.15)', color: '#34a853' }}>📱</div>
                    <div className="pay-card-details">
                      <strong>Instant UPI & QR Code</strong>
                      <p>Google Pay, PhonePe, Paytm, BHIM & Dynamic QR</p>
                    </div>
                    <div className="pay-radio-ring">
                      {selectedPaymentMethod === 'UPI' && <div className="pay-radio-dot" />}
                    </div>
                  </div>

                  <div
                    className={`payment-card-v2 ${selectedPaymentMethod === 'Razorpay' ? 'active' : ''}`}
                    onClick={() => setSelectedPaymentMethod('Razorpay')}
                  >
                    <div className="pay-card-icon">⚡</div>
                    <div className="pay-card-details">
                      <strong>Razorpay Digital Gateway</strong>
                      <p>Credit/Debit Cards, NetBanking & Wallets</p>
                    </div>
                    <div className="pay-radio-ring">
                      {selectedPaymentMethod === 'Razorpay' && <div className="pay-radio-dot" />}
                    </div>
                  </div>

                  <div
                    className={`payment-card-v2 ${selectedPaymentMethod === 'COD' ? 'active' : ''}`}
                    onClick={() => setSelectedPaymentMethod('COD')}
                  >
                    <div className="pay-card-icon">💵</div>
                    <div className="pay-card-details">
                      <strong>Cash on Delivery (COD)</strong>
                      <p>Pay cash or UPI upon delivery</p>
                    </div>
                    <div className="pay-radio-ring">
                      {selectedPaymentMethod === 'COD' && <div className="pay-radio-dot" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="primary-btn checkout-pay-btn-v2" onClick={handlePlaceOrder}>
              {selectedPaymentMethod === 'COD'
                ? `✓ Confirm Order (Cash on Delivery) • ₹${grandTotal}`
                : selectedPaymentMethod === 'UPI'
                  ? `📱 Pay via UPI & Dynamic QR Code • ₹${grandTotal}`
                  : `⚡ Pay Online (Razorpay Gateway) • ₹${grandTotal}`}
            </button>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {modal === 'auth' && (
        <div className="modal-backdrop" onClick={() => { setModal(null); setGuestCheckoutPrompt(false); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setModal(null); setGuestCheckoutPrompt(false); }}><IconClose /></button>

            {accountType === 'foodpartner' ? (
              <div className="auth-header-block">
                <h3>🏪 Partner Kitchen Portal</h3>
                <p className="auth-subtext">Sign in to manage food reels, live menu & store availability</p>
              </div>
            ) : accountType === 'delivery' ? (
              <div className="auth-header-block">
                <h3>🛵 Delivery Partner Workspace</h3>
                <p className="auth-subtext">Sign in to accept delivery assignments & track 5% payouts</p>
              </div>
            ) : (
              <div className="auth-header-block">
                <h3>🍕 Customer Account Login</h3>
                <p className="auth-subtext">Sign in to track food orders, save addresses & favorite reels</p>
              </div>
            )}

            <div className="role-selector">
              <button className={accountType === 'user' ? 'active' : ''} onClick={() => setAccountType('user')}>🍕 Customer Login</button>
              <button className={accountType === 'foodpartner' ? 'active' : ''} onClick={() => setAccountType('foodpartner')}>🏪 Restaurant Partner</button>
              <button className={accountType === 'delivery' ? 'active' : ''} onClick={() => setAccountType('delivery')}>🛵 Delivery Rider</button>
            </div>

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {mode === 'signup' && accountType === 'user' && (
                <input type="text" name="fullName" placeholder="Full Name" required />
              )}
              {mode === 'signup' && accountType === 'foodpartner' && (
                <input type="text" name="name" placeholder="Restaurant / Cloud Kitchen Name" required />
              )}
              {mode === 'signup' && accountType === 'delivery' && (
                <>
                  <input type="text" name="name" placeholder="Rider Full Name" required />
                  <input type="tel" name="phone" placeholder="Mobile Number" required pattern="^[0-9+]{10,15}$" title="Enter a valid phone number (10–15 digits, may start with +)" />
                </>
              )}
              <input type="email" name="email" placeholder="Email Address" required pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$" title="Enter a valid email address (e.g. name@example.com)" />
              <input type="password" name="password" placeholder="Password" required />

              {authError && <p className="error-msg">{authError}</p>}

              <button type="submit" className="primary-btn" disabled={authLoading}>
                {authLoading ? 'Authenticating...' : mode === 'login' ? `Sign In as ${accountType === 'foodpartner' ? 'Partner' : accountType === 'delivery' ? 'Rider' : 'Customer'}` : `Register as ${accountType === 'foodpartner' ? 'Partner' : accountType === 'delivery' ? 'Rider' : 'Customer'}`}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <div className="google-auth-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="rectangular"
                size="large"
                width={400}
                theme="outline"
                text={mode === 'signup' ? 'signup_with' : 'signin_with'}
              />
            </div>


            <div className="auth-toggle-banner">
              {mode === 'login' ? (
                <p>
                  <span className="toggle-question-text">Don't have an account yet?</span>{' '}
                  <button type="button" className="auth-switch-link-btn" onClick={() => setMode('signup')}>
                    Register Here ➔
                  </button>
                </p>
              ) : (
                <p>
                  <span className="toggle-question-text">Already have an account?</span>{' '}
                  <button type="button" className="auth-switch-link-btn" onClick={() => setMode('login')}>
                    Sign In Here ➔
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct Email Order Inquiry Modal */}
      {modal === 'order' && selectedFoodForOrder && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}><IconClose /></button>
            <h3>📩 Direct Order Inquiry</h3>
            <p>Dish: <strong>{selectedFoodForOrder.name}</strong></p>

            <form onSubmit={handleDirectOrderSubmit} className="order-form">
              <input
                type="text"
                placeholder="Your Name"
                required
                value={orderForm.name}
                onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
              />
              <input
                type="email"
                placeholder="Your Email"
                required
                pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
                title="Enter a valid email address (e.g. name@example.com)"
                value={orderForm.email}
                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                pattern="^[0-9+]{10,15}$"
                title="Enter a valid phone number (10–15 digits, may start with +)"
                value={orderForm.phone}
                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
              />
              <textarea
                placeholder="Delivery Address"
                required
                value={orderForm.address}
                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
              />
              <button type="submit" className="primary-btn" disabled={sendingOrder}>
                {sendingOrder ? 'Sending Email...' : 'Send Order Inquiry Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Zesty Instant UPI & Gateway Modal */}
      {onlinePaymentModalData && (
        <div className="modal-backdrop checkout-modal-backdrop" onClick={() => setOnlinePaymentModalData(null)}>
          <div className="modal-card online-gateway-card upi-gateway-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gateway-modal-header">
              <div className="gateway-brand">
                <span className="gateway-shield-icon">📱</span>
                <div>
                  <h3>Instant UPI & Dynamic QR Pay</h3>
                  <p>Order #{onlinePaymentModalData.orderNumber} • ₹{onlinePaymentModalData.amountRupees || Math.round((onlinePaymentModalData.amount || 0) / 100)}</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setOnlinePaymentModalData(null)}><IconClose /></button>
            </div>

            {/* Dynamic UPI QR Code Scanner Section */}
            <div className="upi-qr-box">
              <div className="qr-image-wrapper">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `upi://pay?pa=zesty.pay@razorpay&pn=Zesty%20Food%20Delivery&am=${onlinePaymentModalData.amountRupees || Math.round((onlinePaymentModalData.amount || 0) / 100)
                    }&cu=INR&tn=Order%20${onlinePaymentModalData.orderNumber}`
                  )}`}
                  alt="Zesty UPI QR Code"
                  className="upi-qr-img"
                />
                <div className="qr-center-badge">📱</div>
              </div>
              <div className="qr-instructions">
                <span className="live-qr-dot">🟢 Live Dynamic QR</span>
                <p>Scan with <strong>Google Pay, PhonePe, Paytm, BHIM</strong> or any UPI App</p>
                <div className="upi-brand-pills">
                  <span className="upi-pill gpay">GPay</span>
                  <span className="upi-pill phonepe">PhonePe</span>
                  <span className="upi-pill paytm">Paytm</span>
                  <span className="upi-pill bhim">BHIM</span>
                  <span className="upi-pill cred">CRED</span>
                </div>
              </div>
            </div>

            {/* UPI App Quick Launcher Buttons */}
            <div className="upi-apps-launch-row">
              <a
                href={`upi://pay?pa=zesty.pay@razorpay&pn=Zesty&am=${onlinePaymentModalData.amountRupees || Math.round((onlinePaymentModalData.amount || 0) / 100)}&cu=INR`}
                className="upi-app-btn gpay"
              >
                <span>🟢</span> Google Pay
              </a>
              <a
                href={`upi://pay?pa=zesty.pay@razorpay&pn=Zesty&am=${onlinePaymentModalData.amountRupees || Math.round((onlinePaymentModalData.amount || 0) / 100)}&cu=INR`}
                className="upi-app-btn phonepe"
              >
                <span>🟣</span> PhonePe
              </a>
              <a
                href={`upi://pay?pa=zesty.pay@razorpay&pn=Zesty&am=${onlinePaymentModalData.amountRupees || Math.round((onlinePaymentModalData.amount || 0) / 100)}&cu=INR`}
                className="upi-app-btn paytm"
              >
                <span>🔵</span> Paytm
              </a>
            </div>

            {/* UPI ID / VPA Entry Field */}
            <div className="upi-vpa-input-group">
              <label>Enter UPI ID / VPA</label>
              <div className="vpa-input-wrapper">
                <input
                  type="text"
                  placeholder="e.g. username@upi or 9876543210@paytm"
                  defaultValue={session?.profile?.phone ? `${session.profile.phone}@upi` : ''}
                  className="vpa-input-field"
                />
                <span className="vpa-verify-tag">Verified ✓</span>
              </div>
            </div>

            <button
              className="primary-btn full-width gateway-submit-btn"
              onClick={async () => {
                try {
                  const data = onlinePaymentModalData;
                  const fakePaymentId = 'pay_upi_' + Math.random().toString(36).substring(2, 12);
                  const fakeSignature = 'sig_upi_' + Math.random().toString(36).substring(2, 12);
                  await request('/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderId: data.orderId,
                      razorpayPaymentId: fakePaymentId,
                      razorpayOrderId: data.gatewayOrderId,
                      razorpaySignature: fakeSignature
                    })
                  });
                  setOnlinePaymentModalData(null);
                  setModal(null);
                  localStorage.removeItem('zesty_guest_cart');
                  fetchCart();
                  fetchUserOrders();
                  showToast(`UPI Payment Verified! Order #${data.orderNumber} placed! 🎉`, 'success');
                  setActiveTrackerOrderId(data.orderId);
                } catch (err) {
                  showToast(err.message || 'Payment verification failed', 'error');
                }
              }}
            >
              ✓ Complete UPI Payment • ₹{onlinePaymentModalData.amountRupees || Math.round((onlinePaymentModalData.amount || 0) / 100)}
            </button>
          </div>
        </div>
      )}

      {/* Footer Dedicated Page Modal */}
      <FooterPageModal
        isOpen={Boolean(footerModalKey)}
        pageKey={footerModalKey}
        onClose={() => setFooterModalKey(null)}
        showToast={showToast}
      />
    </div>
  )
}

export default App

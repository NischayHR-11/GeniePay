import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auth APIs
export const loginUser = async (email, password) => {
  const response = await api.post('/login', { email, password })
  return response.data
}

export const signupUser = async (name, email, password, walletAddress, phone) => {
  const payload = { name, email, password, walletAddress }
  
  // Only add phone if it's provided and valid (10 digits)
  if (phone && phone.length === 10) {
    payload.phone = phone
  }
  
  const response = await api.post('/signup', payload)
  return response.data
}

// Subscription APIs
export const getSubscriptions = async () => {
  const response = await api.get('/subscriptions')
  return response.data
}

export const addSubscription = async (serviceName, price, renewalDate, isConnected = false, paymentData = null) => {
  const payload = {
    serviceName,
    price,
    renewalDate,
    isConnected,
  }
  
  // Add payment data if provided
  if (paymentData) {
    payload.paymentStatus = paymentData.paymentStatus
    payload.paymentMethod = paymentData.paymentMethod
    payload.paymentDate = paymentData.paymentDate
    payload.transactionId = paymentData.transactionId
  }
  
  const response = await api.post('/subscriptions/add', payload)
  return response.data
}

export const deleteSubscription = async (id) => {
  const response = await api.delete(`/subscriptions/${id}`)
  return response.data
}

export const pauseSubscription = async (id) => {
  const response = await api.patch(`/subscriptions/${id}/pause`)
  return response.data
}

// AI APIs
export const sendAICommand = async (command, conversationHistory = []) => {
  const response = await api.post('/ai/command', { 
    command,
    conversationHistory 
  })
  return response.data
}

// Blockchain APIs
export const executeBlockchainTransaction = async (action, subscriptionId, amount, recipient) => {
  const response = await api.post('/blockchain/execute', {
    action,
    subscriptionId,
    amount,
    recipient,
  })
  return response.data
}

// Notification APIs
export const sendNotification = async (type, subscriptionId) => {
  const response = await api.post('/notify', { type, subscriptionId })
  return response.data
}

// Razorpay Payment APIs
export const createRazorpayOrder = async (amount, currency = 'INR', notes = {}) => {
  const response = await api.post('/payment/create-order', {
    amount,
    currency,
    notes
  })
  return response.data
}

export const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post('/payment/verify', paymentData)
  return response.data
}

// Real Service Integration APIs
export const connectRealService = async (serviceKey, options = {}) => {
  const response = await api.post('/api/services/connect', {
    serviceKey,
    returnUrl: options.returnUrl || window.location.href
  })
  return response.data
}

export const getServiceSubscriptionDetails = async (serviceKey) => {
  const response = await api.get(`/api/services/${serviceKey}/subscription`)
  return response.data
}

export const automateServicePayment = async (serviceKey, amount) => {
  const response = await api.post(`/api/services/${serviceKey}/payment`, { amount })
  return response.data
}

// Transaction APIs
export const getTransactions = async () => {
  const response = await api.get('/transactions')
  return response.data
}

export default api

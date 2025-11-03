/**
 * UPI Payment Utility Functions
 * Handles UPI deep link generation and payment flow
 */

// Your UPI ID for receiving payments
const MERCHANT_UPI_ID = '9448048720@axl'
const MERCHANT_NAME = 'GeniePay'

/**
 * Generate UPI payment deep link
 * @param {Object} params - Payment parameters
 * @param {string} params.serviceName - Name of the service
 * @param {number} params.amount - Amount in INR
 * @param {string} params.transactionNote - Optional transaction note
 * @returns {string} UPI deep link
 */
export const generateUPILink = ({ serviceName, amount, transactionNote }) => {
  const upiParams = {
    pa: MERCHANT_UPI_ID,           // Payee address (UPI ID)
    pn: MERCHANT_NAME,              // Payee name
    am: amount.toFixed(2),          // Amount (2 decimal places)
    cu: 'INR',                      // Currency
    tn: transactionNote || `${serviceName} - First Payment`, // Transaction note
    mc: '5960',                     // Merchant category code (Financial Services)
  }

  // Create UPI deep link
  const queryString = new URLSearchParams(upiParams).toString()
  return `upi://pay?${queryString}`
}

/**
 * Detect if user is on mobile device
 * @returns {boolean} True if mobile
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Initiate UPI payment
 * Opens UPI apps for payment
 * @param {Object} params - Payment parameters
 * @returns {Promise} Resolves when user returns
 */
export const initiateUPIPayment = ({ serviceName, amount, transactionNote }) => {
  return new Promise((resolve, reject) => {
    const upiLink = generateUPILink({ serviceName, amount, transactionNote })
    
    // Store payment initiation time
    const paymentStartTime = new Date().toISOString()
    sessionStorage.setItem('payment_initiated', paymentStartTime)
    sessionStorage.setItem('payment_service', serviceName)
    sessionStorage.setItem('payment_amount', amount.toString())
    sessionStorage.setItem('payment_upi_link', upiLink)
    
    // Check if mobile device
    const isMobile = isMobileDevice()
    
    if (isMobile) {
      // On mobile: Open UPI apps directly
      window.location.href = upiLink
      
      // Resolve after a delay (user should be back from UPI app)
      setTimeout(() => {
        resolve({
          initiated: true,
          timestamp: paymentStartTime,
          method: 'mobile'
        })
      }, 2000)
    } else {
      // On desktop: Return desktop info
      resolve({
        initiated: true,
        timestamp: paymentStartTime,
        method: 'desktop',
        upiLink: upiLink,
        isDesktop: true
      })
    }
  })
}

/**
 * Generate transaction ID for manual tracking
 * @returns {string} Unique transaction ID
 */
export const generateTransactionId = () => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `TXN${timestamp}${random}`.toUpperCase()
}

/**
 * Get payment status from session storage
 * @returns {Object|null} Payment info if exists
 */
export const getPaymentSession = () => {
  const initiated = sessionStorage.getItem('payment_initiated')
  if (!initiated) return null
  
  return {
    initiated: new Date(initiated),
    service: sessionStorage.getItem('payment_service'),
    amount: parseFloat(sessionStorage.getItem('payment_amount') || '0')
  }
}

/**
 * Clear payment session
 */
export const clearPaymentSession = () => {
  sessionStorage.removeItem('payment_initiated')
  sessionStorage.removeItem('payment_service')
  sessionStorage.removeItem('payment_amount')
}

/**
 * Format amount for display
 * @param {number} amount 
 * @returns {string} Formatted amount with rupee symbol
 */
export const formatAmount = (amount) => {
  return `₹${amount.toFixed(2)}`
}

/**
 * Validate payment amount
 * @param {number} amount 
 * @returns {boolean} True if valid
 */
export const isValidAmount = (amount) => {
  return amount > 0 && amount <= 100000 // Max 1 lakh per transaction
}

/**
 * Get UPI apps available for payment
 * @returns {Array} List of popular UPI apps
 */
export const getAvailableUPIApps = () => {
  return [
    { name: 'Google Pay', package: 'com.google.android.apps.nbu.paisa.user' },
    { name: 'PhonePe', package: 'com.phonepe.app' },
    { name: 'Paytm', package: 'net.one97.paytm' },
    { name: 'Amazon Pay', package: 'in.amazon.mShop.android.shopping' },
    { name: 'BHIM', package: 'in.org.npci.upiapp' },
    { name: 'WhatsApp', package: 'com.whatsapp' },
  ]
}

export default {
  generateUPILink,
  initiateUPIPayment,
  generateTransactionId,
  getPaymentSession,
  clearPaymentSession,
  formatAmount,
  isValidAmount,
  getAvailableUPIApps,
  isMobileDevice,
  MERCHANT_UPI_ID,
  MERCHANT_NAME
}

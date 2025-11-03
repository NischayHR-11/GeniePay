/**
 * Razorpay Payment Utilities
 * Handles fee calculation and payment display
 */

// Razorpay transaction fee percentage
const RAZORPAY_FEE_PERCENTAGE = 2 // 2%
const RAZORPAY_MIN_FEE = 3 // Minimum ₹3

/**
 * Calculate Razorpay platform fee
 * @param {number} amount - Subscription amount in INR
 * @returns {number} Platform fee
 */
export const calculatePlatformFee = (amount) => {
  const feeAmount = (amount * RAZORPAY_FEE_PERCENTAGE) / 100
  // Razorpay minimum fee is ₹3
  return Math.max(feeAmount, RAZORPAY_MIN_FEE)
}

/**
 * Calculate total amount including platform fee
 * @param {number} subscriptionAmount - Base subscription amount
 * @returns {Object} Breakdown of amounts
 */
export const calculateTotalWithFee = (subscriptionAmount) => {
  const platformFee = calculatePlatformFee(subscriptionAmount)
  const totalAmount = subscriptionAmount + platformFee
  
  return {
    subscriptionAmount: parseFloat(subscriptionAmount.toFixed(2)),
    platformFee: parseFloat(platformFee.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  }
}

/**
 * Format amount for display
 * @param {number} amount 
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`
}

/**
 * Convert rupees to paise (Razorpay requires amount in paise)
 * @param {number} rupees 
 * @returns {number} Amount in paise
 */
export const rupeesToPaise = (rupees) => {
  return Math.round(rupees * 100)
}

/**
 * Convert paise to rupees
 * @param {number} paise 
 * @returns {number} Amount in rupees
 */
export const paiseToRupees = (paise) => {
  return paise / 100
}

/**
 * Get payment breakdown for display
 * @param {number} subscriptionPrice 
 * @param {string} serviceName 
 * @returns {Object} Payment details
 */
export const getPaymentBreakdown = (subscriptionPrice, serviceName) => {
  const { subscriptionAmount, platformFee, totalAmount } = calculateTotalWithFee(subscriptionPrice)
  
  return {
    serviceName,
    subscriptionAmount,
    platformFee,
    totalAmount,
    formattedSubscription: formatAmount(subscriptionAmount),
    formattedFee: formatAmount(platformFee),
    formattedTotal: formatAmount(totalAmount),
    amountInPaise: rupeesToPaise(totalAmount)
  }
}

/**
 * Validate Razorpay payment signature
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 * @param {string} secret 
 * @returns {boolean} True if valid
 */
export const validatePaymentSignature = (orderId, paymentId, signature, secret) => {
  const crypto = require('crypto')
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(orderId + '|' + paymentId)
    .digest('hex')
  
  return generatedSignature === signature
}

export default {
  calculatePlatformFee,
  calculateTotalWithFee,
  formatAmount,
  rupeesToPaise,
  paiseToRupees,
  getPaymentBreakdown,
  validatePaymentSignature,
  RAZORPAY_FEE_PERCENTAGE,
  RAZORPAY_MIN_FEE
}

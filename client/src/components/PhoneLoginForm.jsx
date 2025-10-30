import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Loader, ArrowRight, RotateCcw } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function PhoneLoginForm({ onSuccess }) {
  const [step, setStep] = useState(1) // 1: Enter phone, 2: Enter OTP
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/phone-login`, { phone })
      setMaskedPhone(response.data.phone)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP')
      if (err.response?.data?.notRegistered) {
        setTimeout(() => {
          setError('Phone not registered. Please sign up first or use email login.')
        }, 100)
      }
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and Login
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/verify-phone-otp`, {
        phone,
        otp
      })

      // Store token and user data
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      onSuccess(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    setError('')
    setLoading(true)

    try {
      await axios.post(`${API_URL}/auth/resend-phone-otp`, { phone })
      setError('OTP resent successfully!')
      setTimeout(() => setError(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  // Format phone number as user types
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '') // Remove non-digits
    if (value.length > 10) value = value.slice(0, 10) // Max 10 digits
    setPhone(value)
  }

  return (
    <div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg ${
            error.includes('successfully') 
              ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}
        >
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {step === 1 ? (
        // Step 1: Enter Phone Number
        <form onSubmit={handleRequestOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter 10-digit mobile number"
                required
                className="w-full pl-12 pr-4 py-3 bg-thor-dark border border-thor-blue/30 rounded-lg text-white focus:border-thor-red focus:outline-none focus:ring-2 focus:ring-thor-red/50"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Indian mobile numbers only (10 digits)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length !== 10}
            className="w-full thor-button disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        // Step 2: Enter OTP
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Enter OTP sent to {maskedPhone}
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setOtp(value)
              }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
              className="w-full px-4 py-3 bg-thor-dark border border-thor-blue/30 rounded-lg text-white text-center text-2xl tracking-widest focus:border-thor-red focus:outline-none focus:ring-2 focus:ring-thor-red/50"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1 text-center">
              OTP valid for 10 minutes
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full thor-button disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Login
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep(1)
                setOtp('')
                setError('')
              }}
              className="text-gray-400 hover:text-thor-blue transition-colors"
            >
              ← Change Number
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="text-thor-blue hover:text-thor-red transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

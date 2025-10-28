import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, Wallet, Loader, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { connectWallet } from '../utils/web3'
import SimpleBackground from '../components/SimpleBackground'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Signup form, 2: OTP verification
  
  const { signup, verifyOTP } = useAuth()
  const navigate = useNavigate()

  const handleConnectWallet = async () => {
    const result = await connectWallet()
    if (result.success) {
      setWalletAddress(result.address)
    } else {
      setError(result.error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const result = await signup(name, email, password, walletAddress)

    if (result.success) {
      // Move to OTP verification step
      setStep(2)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)

    const result = await verifyOTP(email, otp)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  const handleResendOTP = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setError('') // Clear any errors
        alert('New OTP sent to your email!')
      } else {
        setError(data.error || 'Failed to resend OTP')
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative py-12">
      <SimpleBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="thor-card neon-border">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <Zap className="w-10 h-10 text-thor-red" />
            <span className="text-3xl font-bold glow-text">GeniePay</span>
          </Link>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">
            {step === 1 ? 'Create Account' : 'Verify Your Email'}
          </h2>
          <p className="text-gray-400 text-center mb-8">
            {step === 1 
              ? 'Join the future of subscription management' 
              : `Enter the 6-digit code sent to ${email}`}
          </p>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-thor-red/20 border border-thor-red text-thor-red px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Step 1: Signup Form */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3"
                  required
                />
              </div>
            </div>

            {/* Wallet Connection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Wallet Address (Optional)
              </label>
              <div className="space-y-2">
                {walletAddress ? (
                  <div className="bg-thor-blue/10 border border-thor-blue rounded-lg px-4 py-3 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-thor-blue" />
                    <span className="text-sm truncate">{walletAddress}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    className="w-full border border-thor-blue hover:bg-thor-blue/10 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Connect MetaMask</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full thor-button py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleOTPSubmit} className="space-y-5">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full thor-button py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Verify Email</span>
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-thor-blue hover:text-thor-red transition-colors text-sm"
              >
                Didn't receive code? Resend OTP
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to signup
              </button>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-thor-blue hover:text-thor-red transition-colors font-medium">
              Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

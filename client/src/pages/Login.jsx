import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, Loader, Phone } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SimpleBackground from '../components/SimpleBackground'
import PhoneLoginForm from '../components/PhoneLoginForm'

export default function Login() {
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      // Check if user needs to verify email
      if (result.error && result.error.includes('verify your email')) {
        setError(result.error)
      } else {
        setError(result.error)
      }
    }

    setLoading(false)
  }

  const handlePhoneLoginSuccess = (data) => {
    // Phone login successful - data already stored in localStorage by PhoneLoginForm
    // Force a page reload to update AuthContext from localStorage
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
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
            Welcome Back
          </h2>
          <p className="text-gray-400 text-center mb-6">
            Login to manage your subscriptions
          </p>

          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email')
                setError('')
              }}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                loginMethod === 'email'
                  ? 'bg-thor-blue text-white'
                  : 'bg-thor-dark border border-thor-blue/30 text-gray-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone')
                setError('')
              }}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                loginMethod === 'phone'
                  ? 'bg-thor-blue text-white'
                  : 'bg-thor-dark border border-thor-blue/30 text-gray-400 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
          </div>

          {/* Error Message (for email login) */}
          {error && loginMethod === 'email' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-thor-red/20 border border-thor-red text-thor-red px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {/* Email Login Form */}
          {loginMethod === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-6">
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full thor-button py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Phone Login Form */
            <PhoneLoginForm onSuccess={handlePhoneLoginSuccess} />
          )}

          {/* Signup Link */}
          <div className="mt-6 text-center text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-thor-blue hover:text-thor-red transition-colors font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

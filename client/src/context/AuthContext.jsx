import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, signupUser } from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password)
      const { token, user } = response

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      setToken(token)
      setUser(user)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      }
    }
  }

  const signup = async (name, email, password, walletAddress) => {
    try {
      const response = await signupUser(name, email, password, walletAddress)
      
      // Check if OTP verification is required
      if (response.requiresVerification) {
        return { success: true, requiresVerification: true }
      }

      // Old flow (if backend doesn't require verification)
      const { token, user } = response
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      setToken(token)
      setUser(user)
      setIsAuthenticated(true)

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Signup failed' 
      }
    }
  }

  const verifyOTP = async (email, otp) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        const { token, user } = data

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        setToken(token)
        setUser(user)
        setIsAuthenticated(true)

        return { success: true }
      } else {
        return { 
          success: false, 
          error: data.error || 'OTP verification failed' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'OTP verification failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    signup,
    verifyOTP,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

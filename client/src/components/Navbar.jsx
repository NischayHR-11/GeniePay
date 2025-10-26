import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-thor-darker/80 backdrop-blur-lg border-b border-thor-blue/30"
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-thor-red" />
          <span className="text-2xl font-bold glow-text">GeniePay</span>
        </Link>

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-thor-blue transition-colors">
                Dashboard
              </Link>
              <span className="text-sm text-gray-400">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-thor-red hover:bg-thor-red/80 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hover:text-thor-blue transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="thor-button"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}

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
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-thor-red" />
          <span className="text-lg sm:text-2xl font-bold glow-text">GeniePay</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hidden sm:block hover:text-thor-blue transition-colors text-sm sm:text-base">
                Dashboard
              </Link>
              <span className="hidden md:block text-xs sm:text-sm text-gray-400">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg bg-thor-red hover:bg-thor-red/80 transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hover:text-thor-blue transition-colors text-xs sm:text-sm md:text-base whitespace-nowrap px-2 sm:px-0"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="thor-button text-xs sm:text-sm md:text-base px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap"
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

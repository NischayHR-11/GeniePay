import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Plus, Trash2, Pause, Play, LogOut, Wallet, 
  MessageSquare, Send, TrendingUp, DollarSign, Calendar 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import SimpleBackground from '../components/SimpleBackground'
import SubscriptionCard from '../components/SubscriptionCard'
import AddSubscriptionModal from '../components/AddSubscriptionModal'
import AIAssistant from '../components/AIAssistant'
import SpendingChart from '../components/SpendingChart'
import {
  getSubscriptions,
  deleteSubscription,
  pauseSubscription,
} from '../utils/api'
import { connectWallet, isWalletConnected } from '../utils/web3'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [subscriptions, setSubscriptions] = useState([])
  const [totalSpending, setTotalSpending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    fetchSubscriptions()
    checkWalletConnection()
  }, [])

  const checkWalletConnection = () => {
    if (isWalletConnected()) {
      setWalletConnected(true)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const data = await getSubscriptions()
      setSubscriptions(data.subscriptions || [])
      setTotalSpending(data.totalSpending || 0)
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return
    }

    try {
      await deleteSubscription(id)
      fetchSubscriptions()
    } catch (error) {
      console.error('Error deleting subscription:', error)
      alert('Failed to delete subscription')
    }
  }

  const handlePause = async (id) => {
    try {
      await pauseSubscription(id)
      fetchSubscriptions()
    } catch (error) {
      console.error('Error pausing subscription:', error)
      alert('Failed to pause/resume subscription')
    }
  }

  const handleConnectWallet = async () => {
    const result = await connectWallet()
    if (result.success) {
      setWalletConnected(true)
      setWalletAddress(result.address)
    } else {
      alert(result.error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
  const pausedSubscriptions = subscriptions.filter(sub => sub.status === 'paused')

  return (
    <div className="min-h-screen relative">
      <SimpleBackground />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-thor-darker/80 backdrop-blur-lg border-b border-thor-blue/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-thor-red" />
            <div>
              <h1 className="text-2xl font-bold glow-text">GeniePay</h1>
              <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Button */}
            {walletConnected ? (
              <div className="bg-thor-blue/20 border border-thor-blue rounded-lg px-4 py-2 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="text-sm hidden md:inline">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                </span>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="border border-thor-blue hover:bg-thor-blue/10 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden md:inline">Connect Wallet</span>
              </button>
            )}

            {/* AI Assistant Toggle */}
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`rounded-lg px-4 py-2 flex items-center gap-2 transition-colors ${
                showAIChat 
                  ? 'bg-thor-red text-white' 
                  : 'border border-thor-red hover:bg-thor-red/10'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">AI Assistant</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="border border-gray-600 hover:border-thor-red rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="thor-card flex items-center gap-4"
          >
            <div className="bg-thor-red/20 p-4 rounded-lg">
              <DollarSign className="w-8 h-8 text-thor-red" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Monthly Spending</p>
              <p className="text-2xl font-bold">₹{totalSpending}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="thor-card flex items-center gap-4"
          >
            <div className="bg-thor-blue/20 p-4 rounded-lg">
              <TrendingUp className="w-8 h-8 text-thor-blue" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Subscriptions</p>
              <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="thor-card flex items-center gap-4"
          >
            <div className="bg-purple-500/20 p-4 rounded-lg">
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Subscriptions</p>
              <p className="text-2xl font-bold">{subscriptions.length}</p>
            </div>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="thor-card mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-thor-blue" />
            Spending Overview
          </h2>
          <SpendingChart subscriptions={subscriptions} />
        </motion.div>

        {/* Subscriptions List */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold glow-text">Your Subscriptions</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="thor-button flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Subscription
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="loading-spinner"></div>
          </div>
        ) : subscriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="thor-card text-center py-16"
          >
            <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-4">No subscriptions yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="thor-button"
            >
              Add Your First Subscription
            </button>
          </motion.div>
        ) : (
          <>
            {/* Active Subscriptions */}
            {activeSubscriptions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-thor-blue mb-4">
                  Active ({activeSubscriptions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSubscriptions.map((sub, index) => (
                    <SubscriptionCard
                      key={sub._id}
                      subscription={sub}
                      onDelete={handleDelete}
                      onPause={handlePause}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paused Subscriptions */}
            {pausedSubscriptions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-400 mb-4">
                  Paused ({pausedSubscriptions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pausedSubscriptions.map((sub, index) => (
                    <SubscriptionCard
                      key={sub._id}
                      subscription={sub}
                      onDelete={handleDelete}
                      onPause={handlePause}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Subscription Modal */}
      <AddSubscriptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchSubscriptions}
      />

      {/* AI Assistant Sidebar */}
      <AIAssistant
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        onUpdate={fetchSubscriptions}
      />
    </div>
  )
}

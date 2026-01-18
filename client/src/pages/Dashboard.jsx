import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Plus, Trash2, Pause, Play, LogOut, Wallet, 
  Bot, Send, TrendingUp, DollarSign, Calendar, Receipt,
  X, Copy, Check, ExternalLink, Download, Unlink, RefreshCw, Globe
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import SimpleBackground from '../components/SimpleBackground'
import SubscriptionCard from '../components/SubscriptionCard'
import EnhancedAddSubscriptionModal from '../components/EnhancedAddSubscriptionModal'
import AIAssistant from '../components/AIAssistant'
import TransactionHistory from '../components/TransactionHistory'
import SpendingChart from '../components/SpendingChart'
import {
  getSubscriptions,
  deleteSubscription,
  pauseSubscription,
} from '../utils/api'
import { connectWallet, isWalletConnected, getBalance, disconnectWallet, METAMASK_DOWNLOAD_URL } from '../utils/web3'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [subscriptions, setSubscriptions] = useState([])
  const [totalSpending, setTotalSpending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)
  const [networkName, setNetworkName] = useState('')
  const [copied, setCopied] = useState(false)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [showMetaMaskPrompt, setShowMetaMaskPrompt] = useState(false)

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
      fetchWalletDetails(result.address)
    } else if (result.errorCode === 'METAMASK_NOT_INSTALLED') {
      setShowMetaMaskPrompt(true)
    } else {
      alert(result.error)
    }
  }

  const fetchWalletDetails = async (address) => {
    setBalanceLoading(true)
    try {
      const balance = await getBalance(address)
      setWalletBalance(parseFloat(balance).toFixed(4))
      
      // Get network name
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const networks = {
          '0x1': 'Ethereum Mainnet',
          '0x5': 'Goerli Testnet',
          '0xaa36a7': 'Sepolia Testnet',
          '0x89': 'Polygon Mainnet',
          '0x13881': 'Mumbai Testnet',
          '0x38': 'BNB Smart Chain',
          '0xa86a': 'Avalanche C-Chain',
        }
        setNetworkName(networks[chainId] || `Chain ID: ${parseInt(chainId, 16)}`)
      }
    } catch (error) {
      console.error('Error fetching wallet details:', error)
    } finally {
      setBalanceLoading(false)
    }
  }

  const handleDisconnectWallet = () => {
    disconnectWallet()
    setWalletConnected(false)
    setWalletAddress('')
    setWalletBalance(null)
    setNetworkName('')
    setShowWalletModal(false)
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openWalletModal = () => {
    setShowWalletModal(true)
    if (walletAddress) {
      fetchWalletDetails(walletAddress)
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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-thor-red" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold glow-text">GeniePay</h1>
              <p className="text-xs sm:text-sm text-gray-400">Welcome, {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wallet Button */}
            {walletConnected ? (
              <button
                onClick={openWalletModal}
                className="bg-thor-blue/20 border border-thor-blue hover:bg-thor-blue/30 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 transition-colors cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-thor-blue" />
                <span className="text-xs sm:text-sm hidden sm:inline">
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="border border-thor-blue hover:bg-thor-blue/10 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Connect Wallet</span>
              </button>
            )}

            {/* Transactions Button */}
            <button
              onClick={() => {
                console.log('Transactions button clicked, current state:', showTransactions)
                setShowTransactions(!showTransactions)
              }}
              className={`rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 transition-colors ${
                showTransactions 
                  ? 'bg-thor-blue text-white' 
                  : 'border border-thor-blue hover:bg-thor-blue/10'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Transactions</span>
            </button>

            {/* AI Assistant Toggle */}
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className={`rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 transition-colors ${
                showAIChat 
                  ? 'bg-thor-red text-white' 
                  : 'border border-thor-red hover:bg-thor-red/10'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">AI Assistant</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="border border-gray-600 hover:border-thor-red rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="thor-card flex items-center gap-3 sm:gap-4"
          >
            <div className="bg-thor-red/20 p-3 sm:p-4 rounded-lg">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-thor-red" />
            </div>
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Monthly Spending</p>
              <p className="text-xl sm:text-2xl font-bold">₹{totalSpending}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="thor-card flex items-center gap-3 sm:gap-4"
          >
            <div className="bg-thor-blue/20 p-3 sm:p-4 rounded-lg">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-thor-blue" />
            </div>
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Active Subscriptions</p>
              <p className="text-xl sm:text-2xl font-bold">{activeSubscriptions.length}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="thor-card flex items-center gap-3 sm:gap-4"
          >
            <div className="bg-purple-500/20 p-3 sm:p-4 rounded-lg">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total Subscriptions</p>
              <p className="text-xl sm:text-2xl font-bold">{subscriptions.length}</p>
            </div>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="thor-card mb-6 sm:mb-8"
        >
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-thor-blue" />
            Spending Overview
          </h2>
          <SpendingChart subscriptions={subscriptions} />
        </motion.div>

        {/* Subscriptions List */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold glow-text">Your Subscriptions</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="thor-button flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Add Subscription</span>
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
            className="thor-card text-center py-12 sm:py-16"
          >
            <Zap className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-lg sm:text-xl text-gray-400 mb-4">No subscriptions yet</p>
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
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold text-thor-blue mb-4">
                  Active ({activeSubscriptions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-400 mb-4">
                  Paused ({pausedSubscriptions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      {/* Enhanced Add Subscription Modal with Real Service Integration */}
      <EnhancedAddSubscriptionModal
        key={showAddModal ? 'open' : 'closed'}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchSubscriptions()
          setShowAddModal(false)
        }}
      />

      {/* AI Assistant Sidebar */}
      <AIAssistant
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        onUpdate={fetchSubscriptions}
      />

      {/* Transaction History Sidebar */}
      <TransactionHistory
        isOpen={showTransactions}
        onClose={() => setShowTransactions(false)}
      />

      {/* Wallet Details Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowWalletModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-thor-darker border border-thor-blue/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowWalletModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Wallet Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-thor-blue to-purple-600 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-center mb-1">Wallet Connected</h3>
              <p className="text-gray-400 text-center text-sm mb-6">Your MetaMask wallet details</p>

              {/* Wallet Info Cards */}
              <div className="space-y-4">
                {/* Address */}
                <div className="bg-thor-dark/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-mono truncate">{walletAddress}</p>
                    <button
                      onClick={copyAddress}
                      className="flex-shrink-0 p-2 hover:bg-thor-blue/20 rounded-lg transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div className="bg-thor-dark/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Balance</p>
                      {balanceLoading ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-thor-blue" />
                          <span className="text-sm text-gray-400">Loading...</span>
                        </div>
                      ) : (
                        <p className="text-lg font-bold">
                          {walletBalance !== null ? `${walletBalance} ETH` : 'Unable to fetch'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => fetchWalletDetails(walletAddress)}
                      className="p-2 hover:bg-thor-blue/20 rounded-lg transition-colors"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-400 ${balanceLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Network */}
                <div className="bg-thor-dark/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Network</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-thor-blue" />
                    <p className="text-sm font-medium">{networkName || 'Unknown Network'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {/* View on Explorer */}
                <a
                  href={`https://etherscan.io/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-thor-blue hover:bg-thor-blue/10 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on Explorer</span>
                </a>

                {/* Disconnect */}
                <button
                  onClick={handleDisconnectWallet}
                  className="w-full border border-red-500/50 hover:bg-red-500/10 text-red-400 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MetaMask Not Installed Modal */}
      <AnimatePresence>
        {showMetaMaskPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowMetaMaskPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-thor-darker border border-thor-blue/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowMetaMaskPrompt(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* MetaMask Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-center mb-2">
                MetaMask Not Detected
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-center mb-6">
                To connect your wallet and enable blockchain features, you need to install the MetaMask browser extension.
              </p>

              {/* Download Button */}
              <a
                href={METAMASK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full thor-button py-3 flex items-center justify-center gap-2 mb-3"
              >
                <Download className="w-5 h-5" />
                <span>Download MetaMask</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Skip Button */}
              <button
                onClick={() => setShowMetaMaskPrompt(false)}
                className="w-full text-gray-400 hover:text-white transition-colors text-sm py-2"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

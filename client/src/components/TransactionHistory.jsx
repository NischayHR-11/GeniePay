import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Receipt, CheckCircle, XCircle, Clock, Download, Filter, Search } from 'lucide-react'
import { getTransactions } from '../utils/api'

export default function TransactionHistory({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, paid, pending, failed
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      console.log('TransactionHistory opened')
      fetchTransactions()
    }
  }, [isOpen])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const data = await getTransactions()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(txn => {
    const matchesFilter = filter === 'all' || txn.paymentStatus === filter
    const matchesSearch = txn.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'failed':
        return 'Failed'
      case 'pending':
        return 'Pending'
      case 'manual':
        return 'Manual'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount) => {
    // Handle null, undefined, or invalid amounts
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0.00'
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const downloadTransactions = () => {
    const csv = [
      ['Date', 'Service', 'Amount', 'Platform Fee', 'Total', 'Status', 'Payment Method', 'Transaction ID'].join(','),
      ...filteredTransactions.map(txn => [
        formatDate(txn.paymentDate),
        txn.serviceName,
        txn.amount,
        txn.platformFee || 0,
        txn.totalPaid || txn.amount,
        getStatusText(txn.paymentStatus),
        txn.paymentMethod || 'N/A',
        txn.transactionId || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `geniepay-transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[500px] md:w-[600px] bg-thor-darker border-l border-thor-blue/30 z-[60] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-thor-blue/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Receipt className="w-6 h-6 text-thor-blue" />
                  <h2 className="text-xl font-bold glow-text">Transaction History</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-thor-red/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-thor-dark border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-thor-blue"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      filter === 'all'
                        ? 'bg-thor-blue text-white'
                        : 'bg-thor-dark text-gray-400 hover:bg-thor-dark/50'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('paid')}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      filter === 'paid'
                        ? 'bg-green-500 text-white'
                        : 'bg-thor-dark text-gray-400 hover:bg-thor-dark/50'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      filter === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-thor-dark text-gray-400 hover:bg-thor-dark/50'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('failed')}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      filter === 'failed'
                        ? 'bg-red-500 text-white'
                        : 'bg-thor-dark text-gray-400 hover:bg-thor-dark/50'
                    }`}
                  >
                    Failed
                  </button>
                  <button
                    onClick={downloadTransactions}
                    className="ml-auto px-3 py-1 rounded-full text-xs bg-thor-blue/20 text-thor-blue hover:bg-thor-blue/30 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="loading-spinner"></div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-20">
                  <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchTerm || filter !== 'all' ? 'No transactions found' : 'No transactions yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((txn, index) => (
                    <motion.div
                      key={txn._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-thor-dark/50 border border-gray-700 rounded-lg p-4 hover:border-thor-blue/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(txn.paymentStatus)}
                          <div>
                            <h3 className="font-semibold text-sm">{txn.serviceName}</h3>
                            <p className="text-xs text-gray-400">{formatDate(txn.paymentDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-thor-red">
                            {formatAmount(Number(txn.totalPaid) || Number(txn.amount) || 0)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            txn.paymentStatus === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : txn.paymentStatus === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : txn.paymentStatus === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {getStatusText(txn.paymentStatus)}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="space-y-1 text-xs text-gray-400 border-t border-gray-700 pt-3">
                        {txn.paymentMethod && (
                          <div className="flex justify-between">
                            <span>Payment Method:</span>
                            <span className="text-white capitalize">{txn.paymentMethod}</span>
                          </div>
                        )}
                        {txn.platformFee > 0 && (
                          <div className="flex justify-between">
                            <span>Platform Fee:</span>
                            <span className="text-white">{formatAmount(txn.platformFee)}</span>
                          </div>
                        )}
                        {txn.transactionId && (
                          <div className="flex justify-between">
                            <span>Transaction ID:</span>
                            <span className="text-white font-mono text-[10px]">
                              {txn.transactionId.slice(0, 20)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Stats */}
            {!loading && filteredTransactions.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-thor-blue/30 bg-thor-dark/50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Total Transactions</p>
                    <p className="text-lg font-bold text-thor-blue">{filteredTransactions.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Amount</p>
                    <p className="text-lg font-bold text-thor-red">
                      {formatAmount(
                        filteredTransactions.reduce((sum, txn) => {
                          const amount = Number(txn.totalPaid) || Number(txn.amount) || 0
                          return sum + amount
                        }, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

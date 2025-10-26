import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader } from 'lucide-react'
import { addSubscription } from '../utils/api'

export default function AddSubscriptionModal({ isOpen, onClose, onSuccess }) {
  const [serviceName, setServiceName] = useState('')
  const [price, setPrice] = useState('')
  const [renewalDate, setRenewalDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await addSubscription(serviceName, parseFloat(price), renewalDate)
      
      // Reset form
      setServiceName('')
      setPrice('')
      setRenewalDate('')
      
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add subscription')
    } finally {
      setLoading(false)
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0]

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="thor-card neon-border w-full max-w-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold glow-text">Add Subscription</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-thor-red/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-thor-red/20 border border-thor-red text-thor-red px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Service Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g., Netflix, Spotify, Amazon Prime"
                    className="w-full"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Monthly Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="299"
                    className="w-full"
                    required
                  />
                </div>

                {/* Renewal Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Next Renewal Date
                  </label>
                  <input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    min={today}
                    className="w-full"
                    required
                  />
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
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add Subscription</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

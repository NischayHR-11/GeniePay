import { motion } from 'framer-motion'
import { Trash2, Pause, Play, Calendar, DollarSign, ExternalLink, Zap, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function SubscriptionCard({ subscription, onDelete, onPause, index }) {
  const { _id, serviceName, price, renewalDate, status, blockchainTxnHash, isConnected, paymentStatus } = subscription

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`thor-card ${status === 'paused' ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-thor-blue">{serviceName}</h3>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
              status === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {status.toUpperCase()}
            </span>
            {isConnected && (
              <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-thor-blue/20 text-thor-blue border border-thor-blue/30 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                CONNECTED
              </span>
            )}
            {/* Payment Status Badge */}
            {paymentStatus && (
              <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 ${
                paymentStatus === 'paid'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : paymentStatus === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : paymentStatus === 'failed'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {paymentStatus === 'paid' && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {paymentStatus === 'pending' && <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {paymentStatus === 'failed' && <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {paymentStatus !== 'paid' && paymentStatus !== 'pending' && paymentStatus !== 'failed' && <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                {paymentStatus === 'paid' ? 'PAID' : paymentStatus === 'pending' ? 'PENDING' : paymentStatus === 'failed' ? 'FAILED' : 'NOT PAID'}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => onPause(_id)}
            className="p-1.5 sm:p-2 hover:bg-thor-blue/20 rounded-lg transition-colors"
            title={status === 'paused' ? 'Resume' : 'Pause'}
          >
            {status === 'paused' ? (
              <Play className="w-3 h-3 sm:w-4 sm:h-4 text-thor-blue" />
            ) : (
              <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            )}
          </button>
          
          <button
            onClick={() => onDelete(_id)}
            className="p-1.5 sm:p-2 hover:bg-thor-red/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-thor-red" />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-thor-red" />
        <span className="text-xl sm:text-2xl font-bold">₹{price}</span>
        <span className="text-gray-400 text-xs sm:text-sm">/month</span>
      </div>

      {/* Renewal Date */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300 mb-3 sm:mb-4">
        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm">
          Next Renewal: {format(new Date(renewalDate), 'MMM dd, yyyy')}
        </span>
      </div>

      {/* Blockchain Hash */}
      {blockchainTxnHash && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-thor-blue/30">
          <a
            href={`https://mumbai.polygonscan.com/tx/${blockchainTxnHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-thor-blue hover:text-thor-red transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">View on Blockchain</span>
          </a>
        </div>
      )}
    </motion.div>
  )
}

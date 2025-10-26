import { motion } from 'framer-motion'
import { Trash2, Pause, Play, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

export default function SubscriptionCard({ subscription, onDelete, onPause, index }) {
  const { _id, serviceName, price, renewalDate, status, blockchainTxnHash } = subscription

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`thor-card ${status === 'paused' ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-thor-blue">{serviceName}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            status === 'active' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {status.toUpperCase()}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onPause(_id)}
            className="p-2 hover:bg-thor-blue/20 rounded-lg transition-colors"
            title={status === 'paused' ? 'Resume' : 'Pause'}
          >
            {status === 'paused' ? (
              <Play className="w-4 h-4 text-thor-blue" />
            ) : (
              <Pause className="w-4 h-4 text-yellow-400" />
            )}
          </button>
          
          <button
            onClick={() => onDelete(_id)}
            className="p-2 hover:bg-thor-red/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-thor-red" />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-thor-red" />
        <span className="text-2xl font-bold">₹{price}</span>
        <span className="text-gray-400 text-sm">/month</span>
      </div>

      {/* Renewal Date */}
      <div className="flex items-center gap-2 text-gray-300 mb-4">
        <Calendar className="w-4 h-4" />
        <span className="text-sm">
          Next Renewal: {format(new Date(renewalDate), 'MMM dd, yyyy')}
        </span>
      </div>

      {/* Blockchain Hash */}
      {blockchainTxnHash && (
        <div className="mt-3 pt-3 border-t border-thor-blue/30">
          <a
            href={`https://mumbai.polygonscan.com/tx/${blockchainTxnHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-thor-blue hover:text-thor-red transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">View on Blockchain</span>
          </a>
        </div>
      )}
    </motion.div>
  )
}

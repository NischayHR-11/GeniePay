const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  renewalDate: {
    type: Date,
    required: true
  },
  blockchainTxnHash: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'manual'],
    default: 'manual'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'card', 'netbanking', 'wallet', 'blockchain', 'manual'],
    default: 'manual'
  },
  paymentDate: {
    type: Date,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  platformFee: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

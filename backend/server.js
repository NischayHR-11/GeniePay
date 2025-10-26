// ========================================
// GeniePay - Complete Backend Server
// All routes, models, and logic in one file
// ========================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { Web3 } = require('web3');
const OpenAI = require('openai');

// ========================================
// Express App Initialization
// ========================================
const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// Middleware
// ========================================
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// MongoDB Connection
// ========================================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ========================================
// MongoDB Schemas & Models
// ========================================

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  walletAddress: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Subscription Schema
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// ========================================
// Web3 Initialization
// ========================================
let web3;
let contract;

if (process.env.WEB3_PROVIDER_URL) {
  try {
    web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL));
    
    // Smart Contract ABI (simplified version)
    const contractABI = [
      {
        "inputs": [
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "paySubscription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "subscriptionId", "type": "uint256"}],
        "name": "pauseSubscription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "uint256", "name": "subscriptionId", "type": "uint256"}],
        "name": "cancelSubscription",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];

    if (process.env.CONTRACT_ADDRESS) {
      contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);
      console.log('✅ Web3 and Smart Contract initialized');
    }
  } catch (error) {
    console.error('❌ Web3 initialization error:', error.message);
  }
}

// ========================================
// OpenAI Initialization
// ========================================
let openai;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized');
  } catch (error) {
    console.error('❌ OpenAI initialization error:', error.message);
  }
}

// ========================================
// NodeMailer Configuration
// ========================================
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  console.log('✅ Email transporter initialized');
}

// ========================================
// JWT Middleware
// ========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ========================================
// Helper Functions
// ========================================

// Generate JWT Token
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Send Email Notification
const sendEmail = async (to, subject, html) => {
  if (!transporter) {
    console.log('Email not configured');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"GeniePay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('✅ Email sent to:', to);
  } catch (error) {
    console.error('❌ Email error:', error.message);
  }
};

// ========================================
// ROUTES
// ========================================

// Root Route
app.get('/', (req, res) => {
  res.json({
    message: '🌩️ GeniePay API - AI + Blockchain Subscription System',
    version: '1.0.0',
    endpoints: {
      auth: ['/signup', '/login'],
      subscriptions: ['/subscriptions', '/subscriptions/add', '/subscriptions/:id'],
      ai: ['/ai/command'],
      blockchain: ['/blockchain/execute'],
      notify: ['/notify']
    }
  });
});

// ========================================
// Authentication Routes
// ========================================

// POST /signup - Register new user
app.post('/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, walletAddress } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        walletAddress: walletAddress || null
      });

      await user.save();

      // Generate JWT token
      const token = generateToken(user._id, user.email);

      // Send welcome email
      if (transporter) {
        await sendEmail(
          email,
          '🌩️ Welcome to GeniePay!',
          `<h1>Welcome ${name}!</h1>
           <p>Your account has been created successfully.</p>
           <p>Start managing your subscriptions with AI and blockchain automation.</p>`
        );
      }

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Server error during signup' });
    }
  }
);

// POST /login - User login
app.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = generateToken(user._id, user.email);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  }
);

// ========================================
// Subscription Routes
// ========================================

// GET /subscriptions - Get user subscriptions
app.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.user.id }).sort({ createdAt: -1 });

    // Calculate total monthly spending
    const totalSpending = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + sub.price, 0);

    res.json({
      subscriptions,
      totalSpending,
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Server error fetching subscriptions' });
  }
});

// POST /subscriptions/add - Add new subscription
app.post('/subscriptions/add',
  authenticateToken,
  [
    body('serviceName').trim().notEmpty().withMessage('Service name is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('renewalDate').isISO8601().withMessage('Valid renewal date is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { serviceName, price, renewalDate } = req.body;

      const subscription = new Subscription({
        userId: req.user.id,
        serviceName,
        price,
        renewalDate: new Date(renewalDate),
        status: 'active'
      });

      await subscription.save();

      // Get user details
      const user = await User.findById(req.user.id);

      // Send confirmation email
      if (transporter && user) {
        await sendEmail(
          user.email,
          `✅ ${serviceName} Subscription Added`,
          `<h2>Subscription Added Successfully</h2>
           <p><strong>Service:</strong> ${serviceName}</p>
           <p><strong>Price:</strong> ₹${price}</p>
           <p><strong>Next Renewal:</strong> ${new Date(renewalDate).toLocaleDateString()}</p>
           <p>Your payment will be automated via blockchain!</p>`
        );
      }

      res.status(201).json({
        message: 'Subscription added successfully',
        subscription
      });
    } catch (error) {
      console.error('Add subscription error:', error);
      res.status(500).json({ error: 'Server error adding subscription' });
    }
  }
);

// DELETE /subscriptions/:id - Delete subscription
app.delete('/subscriptions/:id', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const serviceName = subscription.serviceName;
    await Subscription.deleteOne({ _id: req.params.id });

    // Get user details
    const user = await User.findById(req.user.id);

    // Send cancellation email
    if (transporter && user) {
      await sendEmail(
        user.email,
        `🚫 ${serviceName} Subscription Cancelled`,
        `<h2>Subscription Cancelled</h2>
         <p>Your <strong>${serviceName}</strong> subscription has been cancelled successfully.</p>
         <p>You will not be charged in the future.</p>`
      );
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({ error: 'Server error deleting subscription' });
  }
});

// PATCH /subscriptions/:id/pause - Pause subscription
app.patch('/subscriptions/:id/pause', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    subscription.status = subscription.status === 'paused' ? 'active' : 'paused';
    await subscription.save();

    res.json({
      message: `Subscription ${subscription.status === 'paused' ? 'paused' : 'resumed'} successfully`,
      subscription
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({ error: 'Server error updating subscription' });
  }
});

// ========================================
// AI Command Route
// ========================================

// POST /ai/command - Process AI commands
app.post('/ai/command', authenticateToken, async (req, res) => {
  try {
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    if (!openai) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Get user's subscriptions for context
    const subscriptions = await Subscription.find({ userId: req.user.id });
    const subscriptionList = subscriptions.map(sub => 
      `${sub.serviceName} - ₹${sub.price} - Status: ${sub.status}`
    ).join(', ');

    // Create AI prompt
    const systemPrompt = `You are an AI assistant for GeniePay, a subscription management system.
    User's current subscriptions: ${subscriptionList || 'None'}
    
    Analyze the user's command and return a JSON response with:
    {
      "action": "add" | "delete" | "pause" | "resume" | "list" | "info",
      "serviceName": "service name if applicable",
      "price": "price if adding subscription",
      "response": "friendly response to user"
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: command }
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      // If not JSON, return as plain text
      return res.json({
        response: aiResponse,
        action: 'info'
      });
    }

    // Execute action based on AI response
    if (parsedResponse.action === 'pause' && parsedResponse.serviceName) {
      const subscription = await Subscription.findOne({
        userId: req.user.id,
        serviceName: new RegExp(parsedResponse.serviceName, 'i')
      });

      if (subscription) {
        subscription.status = 'paused';
        await subscription.save();
      }
    } else if (parsedResponse.action === 'list') {
      const totalSpending = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + sub.price, 0);
      
      parsedResponse.subscriptions = subscriptions;
      parsedResponse.totalSpending = totalSpending;
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('AI command error:', error);
    res.status(500).json({ 
      error: 'AI processing error',
      response: 'Sorry, I encountered an error processing your request.'
    });
  }
});

// ========================================
// Blockchain Route
// ========================================

// POST /blockchain/execute - Execute smart contract function
app.post('/blockchain/execute', authenticateToken, async (req, res) => {
  try {
    const { action, subscriptionId, amount, recipient } = req.body;

    if (!web3 || !contract) {
      return res.status(503).json({ error: 'Blockchain service not configured' });
    }

    if (!process.env.PRIVATE_KEY) {
      return res.status(500).json({ error: 'Wallet private key not configured' });
    }

    let txHash;
    
    // Get account from private key
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    switch (action) {
      case 'pay':
        if (!recipient || !amount) {
          return res.status(400).json({ error: 'Recipient and amount required' });
        }
        
        const payTx = await contract.methods.paySubscription(recipient, amount).send({
          from: account.address,
          gas: 200000
        });
        
        txHash = payTx.transactionHash;

        // Update subscription with transaction hash
        if (subscriptionId) {
          await Subscription.findByIdAndUpdate(subscriptionId, {
            blockchainTxnHash: txHash
          });
        }
        break;

      case 'pause':
        if (!subscriptionId) {
          return res.status(400).json({ error: 'Subscription ID required' });
        }
        
        const pauseTx = await contract.methods.pauseSubscription(subscriptionId).send({
          from: account.address,
          gas: 100000
        });
        
        txHash = pauseTx.transactionHash;

        await Subscription.findByIdAndUpdate(subscriptionId, {
          status: 'paused',
          blockchainTxnHash: txHash
        });
        break;

      case 'cancel':
        if (!subscriptionId) {
          return res.status(400).json({ error: 'Subscription ID required' });
        }
        
        const cancelTx = await contract.methods.cancelSubscription(subscriptionId).send({
          from: account.address,
          gas: 100000
        });
        
        txHash = cancelTx.transactionHash;

        await Subscription.findByIdAndUpdate(subscriptionId, {
          status: 'cancelled',
          blockchainTxnHash: txHash
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({
      message: 'Blockchain transaction executed successfully',
      transactionHash: txHash,
      explorerUrl: `https://mumbai.polygonscan.com/tx/${txHash}`
    });
  } catch (error) {
    console.error('Blockchain error:', error);
    res.status(500).json({ 
      error: 'Blockchain transaction failed',
      details: error.message 
    });
  }
});

// ========================================
// Notification Route
// ========================================

// POST /notify - Send email notification
app.post('/notify', authenticateToken, async (req, res) => {
  try {
    const { type, subscriptionId } = req.body;

    if (!transporter) {
      return res.status(503).json({ error: 'Email service not configured' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let subject, html;

    if (type === 'reminder' && subscriptionId) {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      subject = `🔔 Upcoming Renewal - ${subscription.serviceName}`;
      html = `
        <h2>Payment Reminder</h2>
        <p>Your <strong>${subscription.serviceName}</strong> subscription will renew soon.</p>
        <p><strong>Amount:</strong> ₹${subscription.price}</p>
        <p><strong>Renewal Date:</strong> ${new Date(subscription.renewalDate).toLocaleDateString()}</p>
        <p>Payment will be processed automatically via blockchain.</p>
      `;
    } else {
      subject = '🌩️ GeniePay Notification';
      html = '<p>This is a notification from GeniePay.</p>';
    }

    await sendEmail(user.email, subject, html);

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Notify error:', error);
    res.status(500).json({ error: 'Server error sending notification' });
  }
});

// ========================================
// Error Handling Middleware
// ========================================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ========================================
// Start Server
// ========================================
app.listen(PORT, () => {
  console.log(`\n🌩️  GeniePay Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`⚡ THOR Theme Activated!\n`);
});

module.exports = app;

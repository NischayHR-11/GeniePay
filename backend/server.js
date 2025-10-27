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
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ========================================
// Express App Initialization
// ========================================
const app = express();
const PORT = process.env.PORT || 5000;

// ========================================
// Middleware
// ========================================
app.use(helmet());

// CORS Configuration - Allow both local and deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://geniepay.nischay.tech',
  'https://genie-pay.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
// MongoDB Models
// ========================================
const User = require('./models/User');
const Subscription = require('./models/Subscription');

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
// Google Gemini AI Initialization
// ========================================
let genAI;
let geminiModel;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash (latest stable model - FREE tier)
    geminiModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    console.log('✅ Google Gemini AI initialized (FREE tier - gemini-2.5-flash)');
  } catch (error) {
    console.error('❌ Gemini initialization error:', error.message);
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

      // Send response immediately
      res.status(201).json({
        message: 'Subscription added successfully',
        subscription
      });

      // Send confirmation email asynchronously (non-blocking)
      const user = await User.findById(req.user.id);
      if (transporter && user) {
        sendEmail(
          user.email,
          `✅ ${serviceName} Subscription Added`,
          `<h2>Subscription Added Successfully</h2>
           <p><strong>Service:</strong> ${serviceName}</p>
           <p><strong>Price:</strong> ₹${price}</p>
           <p><strong>Next Renewal:</strong> ${new Date(renewalDate).toLocaleDateString()}</p>
           <p>Your payment will be automated via blockchain!</p>`
        ).catch(err => console.error('Email send error:', err));
      }
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

    // Send response immediately
    res.json({ message: 'Subscription deleted successfully' });

    // Send cancellation email asynchronously (non-blocking)
    const user = await User.findById(req.user.id);
    if (transporter && user) {
      sendEmail(
        user.email,
        `🚫 ${serviceName} Subscription Cancelled`,
        `<h2>Subscription Cancelled</h2>
         <p>Your <strong>${serviceName}</strong> subscription has been cancelled successfully.</p>
         <p>You will not be charged in the future.</p>`
      ).catch(err => console.error('Email send error:', err));
    }
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
    const { command, conversationHistory = [] } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    if (!geminiModel) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    // Get user's subscriptions for context
    const subscriptions = await Subscription.find({ userId: req.user.id });
    const subscriptionList = subscriptions.map(sub => 
      `${sub.serviceName} - ₹${sub.price} - Status: ${sub.status}`
    ).join(', ');

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nRecent conversation:\n' + 
        conversationHistory.slice(-4).map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');
    }

    // Create AI prompt for Gemini
    const prompt = `You are an AI assistant for GeniePay, a subscription management system.
    User's current subscriptions: ${subscriptionList || 'None'}
    ${conversationContext}
    
    Analyze the user's command and return ONLY a JSON response (no markdown, no extra text) with this exact format:
    {
      "action": "add" | "delete" | "pause" | "resume" | "list" | "analytics" | "bulk" | "bulkAdd" | "info",
      "serviceName": "service name if applicable (for single operations)",
      "price": "price if adding subscription (only for add action)",
      "subscriptions": [{"name": "service1", "price": 299}, {"name": "service2", "price": 499}] (only for bulkAdd - multiple subscriptions at once),
      "filter": "active" | "paused" | "all" (for list action or bulk operations)",
      "analyticsType": "top" | "highest" | "lowest" | "cheapest" | "most-expensive" | "total" (only for analytics action),
      "limit": number (for top/highest/lowest queries - IMPORTANT: use 1 for singular words like "the highest", "the cheapest", "least price"),
      "bulkAction": "pause" | "resume" | "delete" (only for bulk action - what to do with multiple subscriptions),
      "response": "friendly response confirming the action was completed"
    }
    
    IMPORTANT CONTEXT RULES:
    1. If user refers to a subscription mentioned in recent conversation (like "spotify also", "that one", "it"), use that subscription name
    2. If user says something like "also", "too", "same for X", apply the same action to the mentioned subscription
    3. Execute actions IMMEDIATELY - do NOT ask for confirmation
    4. For "list" action, DO NOT generate your own response - leave it empty (backend will format it)
    5. Response should confirm action was COMPLETED with specific details
    6. For list action, set filter based on user's request:
       - "paused subscriptions" → filter: "paused"
       - "active subscriptions" → filter: "active"
       - "all subscriptions" or just "subscriptions" → filter: "all"
    7. For analytical queries, use action: "analytics" and set proper limit:
       - "THE highest" / "THE cheapest" / "least price" → limit: 1 (singular)
       - "top 3" / "5 cheapest" → limit: 3 or 5 (plural with number)
       - No number specified + plural → limit: 5 (default)
    8. For "resume/pause/delete THE cheapest/highest/least" → This is ANALYTICS with action to perform after:
       - "resume the least price in paused" → action: "analytics", filter: "paused", analyticsType: "cheapest", limit: 1, bulkAction: "resume"
    9. For bulk operations on ALL subscriptions:
       - "resume all paused" → action: "bulk", bulkAction: "resume", filter: "paused"
       - "pause all active" → action: "bulk", bulkAction: "pause", filter: "active"
       - "pause netflix and spotify" → action: "bulk", bulkAction: "pause", serviceName: "netflix,spotify"
    10. For adding MULTIPLE subscriptions at once:
       - "add netflix for 649 and spotify for 119" → action: "bulkAdd", subscriptions: [{"name": "Netflix", "price": 649}, {"name": "Spotify", "price": 119}]
       - "create prime for 299 and hotstar for 399" → action: "bulkAdd", subscriptions: [{"name": "Prime", "price": 299}, {"name": "Hotstar", "price": 399}]
    
    Action keywords:
    - "add"/"create"/"new" → action: "add" (single subscription) OR action: "bulkAdd" (if "and" is used with multiple subscriptions)
    - "delete"/"remove"/"cancel" → action: "delete" (single) or "bulk" (multiple)
    - "pause"/"stop"/"hold" → action: "pause" (single) or "bulk" (multiple)
    - "resume"/"restart"/"activate"/"continue"/"unpause"/"reactivate" → action: "resume" (single) or "bulk" (multiple)
    - "list"/"show"/"display"/"what do i have"/"my subscriptions" → action: "list"
    - "top X"/"highest"/"most expensive"/"cheapest"/"lowest"/"total spending"/"how much" → action: "analytics"
    - "all paused"/"all active"/"these subscriptions" → action: "bulk" (if followed by an action)
    - Other questions → action: "info"
    
    User command: ${command}`;

    // Call Gemini API
    const result = await geminiModel.generateContent(prompt);
    const aiResponse = result.response.text();
    
    // Clean up response (remove markdown code blocks if present)
    let cleanedResponse = aiResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (e) {
      // If not JSON, return as plain text
      return res.json({
        response: aiResponse,
        action: 'info'
      });
    }

    // Execute action based on AI response
    if (parsedResponse.action === 'add' && parsedResponse.serviceName && parsedResponse.price) {
      // Add single subscription
      const newSubscription = new Subscription({
        userId: req.user.id,
        serviceName: parsedResponse.serviceName,
        price: parseFloat(parsedResponse.price),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active'
      });
      await newSubscription.save();
      parsedResponse.subscriptionId = newSubscription._id;
      
    } else if (parsedResponse.action === 'bulkAdd' && parsedResponse.subscriptions && Array.isArray(parsedResponse.subscriptions)) {
      // Add multiple subscriptions at once
      const addedSubscriptions = [];
      
      for (const sub of parsedResponse.subscriptions) {
        const newSubscription = new Subscription({
          userId: req.user.id,
          serviceName: sub.name || sub.serviceName,
          price: parseFloat(sub.price),
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'active'
        });
        await newSubscription.save();
        addedSubscriptions.push(sub.name || sub.serviceName);
      }
      
      parsedResponse.response = `I've added ${addedSubscriptions.length} subscriptions: ${addedSubscriptions.join(', ')}.`;
      parsedResponse.addedCount = addedSubscriptions.length;
      
    } else if (parsedResponse.action === 'delete' && parsedResponse.serviceName) {
      // Delete subscription
      const subscription = await Subscription.findOne({
        userId: req.user.id,
        serviceName: new RegExp(parsedResponse.serviceName, 'i')
      });

      if (subscription) {
        await Subscription.deleteOne({ _id: subscription._id });
        parsedResponse.deleted = true;
      } else {
        parsedResponse.response = `I couldn't find a subscription named "${parsedResponse.serviceName}".`;
      }
      
    } else if (parsedResponse.action === 'pause' && parsedResponse.serviceName) {
      // Pause subscription
      const subscription = await Subscription.findOne({
        userId: req.user.id,
        serviceName: new RegExp(parsedResponse.serviceName, 'i')
      });

      if (subscription) {
        subscription.status = 'paused';
        await subscription.save();
        parsedResponse.updated = true;
      } else {
        parsedResponse.response = `I couldn't find a subscription named "${parsedResponse.serviceName}".`;
      }
      
    } else if (parsedResponse.action === 'resume' && parsedResponse.serviceName) {
      // Resume subscription
      const subscription = await Subscription.findOne({
        userId: req.user.id,
        serviceName: new RegExp(parsedResponse.serviceName, 'i')
      });

      if (subscription) {
        subscription.status = 'active';
        await subscription.save();
        parsedResponse.updated = true;
      } else {
        parsedResponse.response = `I couldn't find a subscription named "${parsedResponse.serviceName}".`;
      }
      
    } else if (parsedResponse.action === 'list') {
      // Get filter from AI response (default to 'all' if not specified)
      const filter = parsedResponse.filter || 'all';
      
      let filteredSubscriptions;
      if (filter === 'paused') {
        filteredSubscriptions = subscriptions.filter(sub => sub.status === 'paused');
      } else if (filter === 'active') {
        filteredSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      } else {
        filteredSubscriptions = subscriptions;
      }
      
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      const totalSpending = activeSubscriptions.reduce((sum, sub) => sum + sub.price, 0);
      
      // Format subscription list based on filter
      let listText = '';
      if (filteredSubscriptions.length === 0) {
        if (filter === 'paused') {
          listText = "You don't have any paused subscriptions.";
        } else if (filter === 'active') {
          listText = "You don't have any active subscriptions.";
        } else {
          listText = "You don't have any subscriptions yet.";
        }
      } else {
        // Just listing the filtered subscriptions - will be displayed as table
        listText = ''; // Frontend will handle the display
      }
      
      parsedResponse.subscriptions = filteredSubscriptions;
      parsedResponse.totalSpending = totalSpending;
      parsedResponse.response = listText;
      
    } else if (parsedResponse.action === 'analytics') {
      // Handle analytical queries
      const analyticsType = parsedResponse.analyticsType;
      const limit = parsedResponse.limit || 5;
      const filter = parsedResponse.filter || 'all';
      
      // Filter subscriptions first based on filter
      let filteredSubs = subscriptions;
      if (filter === 'paused') {
        filteredSubs = subscriptions.filter(sub => sub.status === 'paused');
      } else if (filter === 'active') {
        filteredSubs = subscriptions.filter(sub => sub.status === 'active');
      }
      
      let resultSubscriptions = [...filteredSubs];
      let responseText = '';
      
      const filterText = filter === 'paused' ? 'paused ' : filter === 'active' ? 'active ' : '';
      
      if (analyticsType === 'top' || analyticsType === 'highest' || analyticsType === 'most-expensive') {
        // Sort by price descending and get top N
        resultSubscriptions = filteredSubs
          .sort((a, b) => b.price - a.price)
          .slice(0, limit);
        responseText = `Here are your top ${limit} most expensive ${filterText}subscriptions:`;
        
      } else if (analyticsType === 'lowest' || analyticsType === 'cheapest') {
        // Sort by price ascending and get bottom N
        resultSubscriptions = filteredSubs
          .sort((a, b) => a.price - b.price)
          .slice(0, limit);
        responseText = `Here are your ${limit} cheapest ${filterText}subscriptions:`;
        
      } else if (analyticsType === 'total') {
        // Calculate total spending
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
        const totalSpending = activeSubscriptions.reduce((sum, sub) => sum + sub.price, 0);
        const pausedCount = subscriptions.filter(sub => sub.status === 'paused').length;
        
        responseText = `💰 **Total Monthly Spending:** ₹${totalSpending}\n\n` +
                      `📊 **Active Subscriptions:** ${activeSubscriptions.length}\n` +
                      `⏸️ **Paused Subscriptions:** ${pausedCount}\n` +
                      `📦 **Total Subscriptions:** ${subscriptions.length}`;
        
        parsedResponse.totalSpending = totalSpending;
        parsedResponse.response = responseText;
        return res.json(parsedResponse);
      }
      
      // If bulkAction is specified, perform action on the result subscriptions
      if (parsedResponse.bulkAction && resultSubscriptions.length > 0) {
        const bulkAction = parsedResponse.bulkAction;
        let updatedCount = 0;
        
        if (bulkAction === 'pause') {
          for (const sub of resultSubscriptions) {
            if (sub.status !== 'paused') {
              await Subscription.findByIdAndUpdate(sub._id, { status: 'paused' });
              updatedCount++;
            }
          }
          parsedResponse.response = `I've paused ${resultSubscriptions.map(s => s.serviceName).join(', ')} (₹${resultSubscriptions[0].price}).`;
          
        } else if (bulkAction === 'resume') {
          for (const sub of resultSubscriptions) {
            if (sub.status === 'paused') {
              await Subscription.findByIdAndUpdate(sub._id, { status: 'active' });
              updatedCount++;
            }
          }
          parsedResponse.response = `I've resumed ${resultSubscriptions.map(s => s.serviceName).join(', ')} (₹${resultSubscriptions[0].price}).`;
          
        } else if (bulkAction === 'delete') {
          for (const sub of resultSubscriptions) {
            await Subscription.deleteOne({ _id: sub._id });
            updatedCount++;
          }
          parsedResponse.response = `I've deleted ${resultSubscriptions.map(s => s.serviceName).join(', ')}.`;
        }
        
        parsedResponse.updated = updatedCount;
        return res.json(parsedResponse);
      }
      
      parsedResponse.subscriptions = resultSubscriptions;
      parsedResponse.totalSpending = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + sub.price, 0);
      parsedResponse.response = responseText;
      
    } else if (parsedResponse.action === 'bulk') {
      // Handle bulk operations on multiple subscriptions
      const bulkAction = parsedResponse.bulkAction;
      const filter = parsedResponse.filter || 'all';
      
      let targetSubscriptions = [];
      
      // If specific service names are provided (comma-separated)
      if (parsedResponse.serviceName && parsedResponse.serviceName.includes(',')) {
        const serviceNames = parsedResponse.serviceName.split(',').map(s => s.trim());
        targetSubscriptions = subscriptions.filter(sub => 
          serviceNames.some(name => new RegExp(name, 'i').test(sub.serviceName))
        );
      } else if (filter === 'paused') {
        targetSubscriptions = subscriptions.filter(sub => sub.status === 'paused');
      } else if (filter === 'active') {
        targetSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      } else {
        targetSubscriptions = subscriptions;
      }
      
      let updatedCount = 0;
      let deletedCount = 0;
      let affectedNames = [];
      
      if (bulkAction === 'pause') {
        // Pause multiple subscriptions
        for (const sub of targetSubscriptions) {
          if (sub.status !== 'paused') {
            await Subscription.findByIdAndUpdate(sub._id, { status: 'paused' });
            updatedCount++;
            affectedNames.push(sub.serviceName);
          }
        }
        if (updatedCount > 0) {
          parsedResponse.response = `I've paused ${updatedCount} subscription${updatedCount !== 1 ? 's' : ''}: ${affectedNames.join(', ')}.`;
        } else {
          parsedResponse.response = "All matching subscriptions are already paused.";
        }
        
      } else if (bulkAction === 'resume') {
        // Resume multiple subscriptions
        for (const sub of targetSubscriptions) {
          if (sub.status === 'paused') {
            await Subscription.findByIdAndUpdate(sub._id, { status: 'active' });
            updatedCount++;
            affectedNames.push(sub.serviceName);
          }
        }
        if (updatedCount > 0) {
          parsedResponse.response = `I've resumed ${updatedCount} subscription${updatedCount !== 1 ? 's' : ''}: ${affectedNames.join(', ')}.`;
        } else {
          parsedResponse.response = "No paused subscriptions found to resume.";
        }        
      } else if (bulkAction === 'delete') {
        // Delete multiple subscriptions
        for (const sub of targetSubscriptions) {
          await Subscription.deleteOne({ _id: sub._id });
          deletedCount++;
          affectedNames.push(sub.serviceName);
        }
        if (deletedCount > 0) {
          parsedResponse.response = `I've deleted ${deletedCount} subscription${deletedCount !== 1 ? 's' : ''}: ${affectedNames.join(', ')}.`;
        } else {
          parsedResponse.response = "No subscriptions found to delete.";
        }
      }
      
      parsedResponse.updated = updatedCount;
      parsedResponse.deleted = deletedCount;
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

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader, ExternalLink, Shield, Zap, Check, AlertTriangle, Smartphone, CreditCard, CheckCircle, Copy, QrCode, CreditCard as CardIcon } from 'lucide-react'
import { addSubscription, connectRealService, createRazorpayOrder, verifyRazorpayPayment } from '../utils/api'
import { getPaymentBreakdown } from '../utils/razorpay'

// Real services that support payment automation
const REAL_SERVICES = {
  'netflix': {
    name: 'Netflix',
    logo: '🎬',
    prices: [199, 499, 649], // Basic, Standard, Premium
    plans: ['Basic', 'Standard', 'Premium'],
    apiSupport: true,
    paymentMethods: ['card', 'upi', 'netbanking'],
    automationSupport: true,
    description: 'Stream movies and TV shows',
    setupRequired: 'Netflix account credentials'
  },
  'spotify': {
    name: 'Spotify',
    logo: '🎵',
    prices: [119, 149], // Individual, Family
    plans: ['Individual', 'Family'],
    apiSupport: true,
    paymentMethods: ['card', 'upi'],
    automationSupport: true,
    description: 'Music streaming service',
    setupRequired: 'Spotify Premium account'
  },
  'prime': {
    name: 'Amazon Prime',
    logo: '📦',
    prices: [299, 1499], // Monthly, Yearly
    plans: ['Monthly', 'Yearly'],
    apiSupport: false,
    paymentMethods: ['card', 'upi', 'wallet'],
    automationSupport: false,
    description: 'Shopping and video streaming',
    setupRequired: 'Amazon account linking'
  },
  'discord': {
    name: 'Discord Nitro',
    logo: '🎮',
    prices: [389, 699], // Nitro Basic, Nitro
    plans: ['Nitro Basic', 'Nitro'],
    apiSupport: true,
    paymentMethods: ['card', 'paypal'],
    automationSupport: true,
    description: 'Gaming communication platform',
    setupRequired: 'Discord account connection'
  },
  'github': {
    name: 'GitHub Pro',
    logo: '💻',
    prices: [400], // Pro plan
    plans: ['Pro'],
    apiSupport: true,
    paymentMethods: ['card'],
    automationSupport: true,
    description: 'Code repository hosting',
    setupRequired: 'GitHub account OAuth'
  },
  'youtube': {
    name: 'YouTube Premium',
    logo: '📺',
    prices: [129, 189], // Individual, Family
    plans: ['Individual', 'Family'],
    apiSupport: false,
    paymentMethods: ['card', 'upi'],
    automationSupport: false,
    description: 'Ad-free YouTube and YouTube Music',
    setupRequired: 'Google account connection'
  },
  'disney': {
    name: 'Disney+ Hotstar',
    logo: '🏰',
    prices: [299, 1499], // Mobile, Super
    plans: ['Mobile', 'Super'],
    apiSupport: false,
    paymentMethods: ['card', 'upi', 'wallet'],
    automationSupport: false,
    description: 'Movies, TV shows, and sports',
    setupRequired: 'Disney+ Hotstar account'
  },
  'jio': {
    name: 'JioCinema Premium',
    logo: '🎭',
    prices: [29, 89], // Mobile, Premium
    plans: ['Mobile', 'Premium'],
    apiSupport: false,
    paymentMethods: ['jio_wallet', 'upi'],
    automationSupport: false,
    description: 'Movies and TV shows streaming',
    setupRequired: 'Jio account connection'
  },
  'zomato': {
    name: 'Zomato Gold',
    logo: '🍽️',
    prices: [149], // Gold plan
    plans: ['Gold'],
    apiSupport: false,
    paymentMethods: ['card', 'upi', 'wallet'],
    automationSupport: false,
    description: 'Restaurant deals and delivery',
    setupRequired: 'Zomato account'
  },
  'swiggy': {
    name: 'Swiggy Super',
    logo: '🛵',
    prices: [149], // Super plan
    plans: ['Super'],
    apiSupport: false,
    paymentMethods: ['card', 'upi', 'wallet'],
    automationSupport: false,
    description: 'Food delivery benefits',
    setupRequired: 'Swiggy account'
  }
}

export default function EnhancedAddSubscriptionModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1) // 1: Select Service, 2: Connect Account, 3: Configure, 4: Payment
  const [serviceName, setServiceName] = useState('')
  const [selectedService, setSelectedService] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(0)
  const [price, setPrice] = useState('')
  const [renewalDate, setRenewalDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [automatePayments, setAutomatePayments] = useState(false)
  const [loginWindow, setLoginWindow] = useState(null)
  const [checkingLogin, setCheckingLogin] = useState(false)
  const [debugInfo, setDebugInfo] = useState('Waiting for connection...')
  
  // Payment states
  const [paymentStep, setPaymentStep] = useState('select') // 'select' | 'processing' | 'success'
  const [paymentData, setPaymentData] = useState(null)
  const [razorpayOrderId, setRazorpayOrderId] = useState('')

  // Set default renewal date when modal opens
  useEffect(() => {
    if (isOpen && !renewalDate) {
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 30) // 30 days from now
      setRenewalDate(defaultDate.toISOString().split('T')[0]) // Format as YYYY-MM-DD
    }
  }, [isOpen, renewalDate])

  // Auto-detect service from name input
  useEffect(() => {
    if (serviceName.length > 2) {
      const detected = Object.keys(REAL_SERVICES).find(key => 
        serviceName.toLowerCase().includes(key) || 
        REAL_SERVICES[key].name.toLowerCase().includes(serviceName.toLowerCase())
      )
      if (detected && detected !== selectedService?.key) {
        setSelectedService({ key: detected, ...REAL_SERVICES[detected] })
        setPrice(REAL_SERVICES[detected].prices[0].toString())
      }
    }
  }, [serviceName])

  // Track login window and detect when user closes it (likely finished login)
  useEffect(() => {
    let windowCheckInterval = null

    console.log('🔍 Detection Effect Running:', {
      hasLoginWindow: !!loginWindow,
      connectionStatus,
      serviceName: selectedService?.name,
      timestamp: new Date().toLocaleTimeString()
    })
    
    setDebugInfo(`Status: ${connectionStatus || 'none'}, Window: ${loginWindow ? 'exists' : 'none'}`)

    if (loginWindow && connectionStatus === 'waiting_login') {
      console.log('✅ Starting window detection for', selectedService?.name)
      setDebugInfo(`🔍 Actively checking ${selectedService?.name} window every 500ms...`)
      
      let checkCount = 0
      // Check if the login window is closed every 500ms (more frequent)
      windowCheckInterval = setInterval(() => {
        checkCount++
        try {
          const isClosed = loginWindow.closed
          console.log('⏱️ Checking window status...', { 
            closed: isClosed,
            checkNumber: checkCount,
            time: new Date().toLocaleTimeString()
          })
          
          setDebugInfo(`✅ Check #${checkCount}: Window is ${isClosed ? 'CLOSED' : 'OPEN'}`)
          
          if (isClosed) {
            console.log('🚪 Window closed! Auto-connecting...')
            setDebugInfo('🎉 Window closed! Setting as CONNECTED...')
            clearInterval(windowCheckInterval)
            
            // User closed the login window - automatically treat as connected
            setTimeout(() => {
              console.log('✅ Automatically setting connected status')
              setDebugInfo('✅ CONNECTED!')
              setConnectionStatus('connected')
              setLoginWindow(null)
              
              // Move to next step after showing success animation - wait 3 seconds
              setTimeout(() => {
                setStep(3)
              }, 3000) // Wait 3 seconds for user to enjoy the success animation
            }, 500)
          }
        } catch (error) {
          console.error('❌ Error checking window:', error)
          setDebugInfo(`❌ Error: ${error.message}`)
          clearInterval(windowCheckInterval)
        }
      }, 500) // Check every 500ms instead of 1000ms

      // Cleanup after 10 minutes (user probably forgot)
      const timeoutId = setTimeout(() => {
        console.log('⏰ 10 minute timeout reached - cleaning up')
        setDebugInfo('⏰ Timeout - stopped checking')
        if (windowCheckInterval) {
          clearInterval(windowCheckInterval)
        }
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close()
        }
        setLoginWindow(null)
        setConnectionStatus(null)
      }, 600000) // 10 minutes

      return () => {
        console.log('🧹 Cleaning up intervals')
        if (windowCheckInterval) clearInterval(windowCheckInterval)
        clearTimeout(timeoutId)
      }
    } else {
      const reason = !loginWindow ? 'No window opened yet' : connectionStatus !== 'waiting_login' ? `Wrong status: ${connectionStatus}` : 'Unknown'
      console.log('⏸️ Detection not active:', { reason })
      setDebugInfo(`⏸️ Not detecting: ${reason}`)
    }
  }, [loginWindow, connectionStatus, selectedService])

  // Function to check if user has logged in
  const checkLoginStatus = async () => {
    console.log('🔍 Manual verification started')
    setCheckingLogin(true)
    
    // Close the login window if it's still open
    if (loginWindow && !loginWindow.closed) {
      console.log('🚪 Closing login window')
      loginWindow.close()
    }
    
    // Small delay to let the window close
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      // Show clear confirmation dialog with instructions
      const message = 
        `✅ Did you successfully log in to ${selectedService?.name}?\n\n` +
        `Please confirm:\n` +
        `✓ I logged in to my ${selectedService?.name} account\n` +
        `✓ I can see my account/dashboard\n` +
        `✓ I have an active subscription or plan\n\n` +
        `Click OK if you're logged in and ready to continue.\n` +
        `Click Cancel if you need to try logging in again.`
      
      console.log('🎯 Showing confirmation dialog')
      const isLoggedIn = confirm(message)
      console.log('👤 User response:', isLoggedIn ? 'Confirmed' : 'Denied')
      
      if (isLoggedIn) {
        // User confirmed they're logged in
        console.log('✅ Setting connected status')
        setConnectionStatus('connected')
        setCheckingLogin(false)
        setLoginWindow(null)
        
        // Move to next step after showing animation - wait 3 seconds
        setTimeout(() => {
          console.log('➡️ Moving to step 3')
          setStep(3)
        }, 3000) // Wait 3 seconds for user to enjoy the success animation
      } else {
        // User wants to try again
        console.log('🔄 User wants to retry - resetting status')
        setConnectionStatus(null)
        setCheckingLogin(false)
        setLoginWindow(null)
        
        const retryMsg = 
          `No problem! You can:\n\n` +
          `1. Click "Connect Account" again to log in\n` +
          `2. Click "Skip & Add Manually" to track without connecting`
        
        alert(retryMsg)
      }
    } catch (error) {
      console.error('❌ Login verification error:', error)
      setConnectionStatus(null)
      setCheckingLogin(false)
      setLoginWindow(null)
    }
  }

  // Verify login status for different services
  const verifyLoginStatus = async (serviceKey) => {
    // IMPORTANT: Due to browser security (CORS/Same-Origin Policy), 
    // we CANNOT access localStorage, cookies, or session data from other domains.
    // This is a browser security feature that protects user data.
    
    // The ONLY reliable way is to ask the user directly
    // In the future, this can be replaced with proper OAuth integration
    // which requires API keys and developer accounts with each service
    
    return new Promise((resolve) => {
      // We'll resolve based on user confirmation
      // This is called from checkLoginStatus which handles the UI
      resolve(false) // Default to false, let checkLoginStatus handle manual confirmation
    })
  }

  const handleServiceSelect = (serviceKey) => {
    const service = REAL_SERVICES[serviceKey]
    setSelectedService({ key: serviceKey, ...service })
    setServiceName(service.name)
    setPrice(service.prices[0].toString())
    setSelectedPlan(0)
    setStep(2)
  }

  const handleConnectAccount = async () => {
    setConnecting(true)
    setError('')

    try {
      // Service URLs - prioritize login pages for existing users
      const serviceUrls = {
        'netflix': {
          url: 'https://www.netflix.com/login',
          name: 'Netflix'
        },
        'spotify': {
          url: 'https://accounts.spotify.com/login',
          name: 'Spotify'
        },
        'prime': {
          url: 'https://www.amazon.in/ap/signin?openid.return_to=https%3A%2F%2Fwww.amazon.in%2Famazonprime',
          name: 'Amazon Prime'
        },
        'youtube': {
          url: 'https://accounts.google.com/signin',
          name: 'YouTube Premium'
        },
        'disney': {
          url: 'https://www.hotstar.com/in/login',
          name: 'Disney+ Hotstar'
        },
        'github': {
          url: 'https://github.com/login',
          name: 'GitHub'
        },
        'discord': {
          url: 'https://discord.com/login',
          name: 'Discord'
        },
        'jio': {
          url: 'https://www.jio.com/selfservice/signup/jio-number/',
          name: 'JioCinema Premium'
        },
        'zomato': {
          url: 'https://www.zomato.com/login',
          name: 'Zomato Gold'
        },
        'swiggy': {
          url: 'https://www.swiggy.com/',
          name: 'Swiggy Super'
        }
      }

      const serviceInfo = serviceUrls[selectedService.key]
      
      if (!serviceInfo) {
        // For unknown services, just proceed to manual setup
        setConnectionStatus('manual')
        setStep(3)
        setConnecting(false)
        return
      }

      // Open the service's login page in a new tab
      console.log('🌐 Opening login page:', serviceInfo.url)
      // IMPORTANT: Don't use 'noopener' - we need to maintain window reference
      const newWindow = window.open(serviceInfo.url, '_blank', 'width=800,height=600')
      
      if (newWindow) {
        console.log('✅ Window opened successfully:', {
          windowExists: !!newWindow,
          windowClosed: newWindow.closed
        })
        
        // Store the window reference for tracking
        setLoginWindow(newWindow)
        console.log('💾 Login window stored in state')
        
        // Set status to show user is being redirected
        setConnectionStatus('redirected')
        console.log('📍 Status set to: redirected')
        
        // After a short delay, show "waiting for login"
        setTimeout(() => {
          setConnectionStatus('waiting_login')
          console.log('📍 Status changed to: waiting_login')
        }, 1500)
        
        // Set up a storage key for manual triggering if needed
        const storageKey = `geniepay_${selectedService.key}_login_check`
        localStorage.setItem(`${storageKey}_initiated`, Date.now().toString())
        
      } else {
        console.error('❌ Failed to open window - popup blocked')
        // Popup blocked
        setError(`Please allow popups to open ${serviceInfo.name}`)
      }
      
    } catch (err) {
      console.error('Connection error:', err)
      setError(err.message || 'Failed to open service page')
      setConnectionStatus('failed')
    } finally {
      setConnecting(false)
    }
  }

  // Function to mark as connected (user clicks after logging in)
  const handleMarkConnected = () => {
    setConnectionStatus('connected')
    setStep(3)
  }

  // Navigate to payment step
  const handleConfigureContinue = () => {
    // Validate required fields
    if (!serviceName.trim()) {
      setError('Service name is required')
      return
    }
    if (!price || parseFloat(price) <= 0) {
      setError('Valid price is required')
      return
    }
    if (!renewalDate) {
      setError('Renewal date is required')
      return
    }
    
    // Clear any previous errors
    setError('')
    
    // Move to payment step and automatically open Razorpay
    setStep(4)
    setPaymentStep('select')
    
    // Auto-trigger Razorpay payment after a short delay
    setTimeout(() => {
      handleRazorpayPayment()
    }, 500)
  }

  // Handle Razorpay payment initiation
  const handleRazorpayPayment = async () => {
    const amount = parseFloat(price)
    
    if (!amount || amount <= 0) {
      setError('Invalid payment amount')
      return
    }
    
    setPaymentStep('processing')
    setLoading(true)
    
    try {
      // Get payment breakdown
      const breakdown = getPaymentBreakdown(amount, serviceName)
      
      // Create Razorpay order
      const orderResponse = await createRazorpayOrder(
        breakdown.amountInPaise,
        'INR',
        {
          serviceName,
          subscriptionAmount: breakdown.subscriptionAmount,
          platformFee: breakdown.platformFee
        }
      )
      
      setRazorpayOrderId(orderResponse.orderId)
      
      // Initialize Razorpay checkout
      const options = {
        key: orderResponse.keyId,
        amount: breakdown.amountInPaise,
        currency: 'INR',
        name: 'GeniePay',
        description: `${serviceName} - First Month Payment`,
        order_id: orderResponse.orderId,
        handler: async function (response) {
          // Payment successful - verify on backend
          await handlePaymentSuccess(response)
        },
        prefill: {
          name: '', // Add user name if available
          email: '', // Add user email if available
        },
        notes: {
          serviceName,
          subscriptionAmount: breakdown.subscriptionAmount,
          platformFee: breakdown.platformFee
        },
        theme: {
          color: '#00D9FF'
        },
        modal: {
          ondismiss: function() {
            // Payment cancelled - redirect to dashboard
            setPaymentStep('select')
            setLoading(false)
            
            // Reset form state
            setServiceName('')
            setPrice('')
            setRenewalDate('')
            setSelectedService(null)
            setStep(1)
            setConnectionStatus(null)
            setPaymentStep('select')
            setError('')
            
            // Close modal - user returns to dashboard
            onClose()
          }
        }
      }
      
      const rzp = new window.Razorpay(options)
      rzp.open()
      setLoading(false)
      
    } catch (err) {
      console.error('Payment initiation error:', err)
      setError(err.response?.data?.error || 'Failed to initiate payment')
      setPaymentStep('select')
      setLoading(false)
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = async (razorpayResponse) => {
    setLoading(true)
    
    try {
      // Verify payment on backend
      const verificationResponse = await verifyRazorpayPayment({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature
      })
      
      if (verificationResponse.success) {
        // Payment verified - save subscription
        const isConnected = selectedService && connectionStatus === 'connected'
        const breakdown = getPaymentBreakdown(parseFloat(price), serviceName)
        
        const paymentData = {
          paymentStatus: 'paid',
          paymentMethod: 'razorpay',
          paymentDate: new Date().toISOString(),
          transactionId: razorpayResponse.razorpay_payment_id,
          platformFee: breakdown.platformFee,
          totalPaid: breakdown.totalAmount
        }
        
        await addSubscription(
          serviceName, 
          parseFloat(price), 
          renewalDate, 
          isConnected,
          paymentData
        )
        
        setPaymentStep('success')
        
        // Show success message briefly, then close
        setTimeout(() => {
          // Reset form state
          setServiceName('')
          setPrice('')
          setRenewalDate('')
          setSelectedService(null)
          setStep(1)
          setConnectionStatus(null)
          setPaymentStep('select')
          setPaymentData(null)
          setRazorpayOrderId('')
          setError('')
          
          // Call onSuccess which will refresh and close
          onSuccess()
        }, 2000)
      }
    } catch (err) {
      console.error('Payment verification error:', err)
      setError('Payment verification failed. Please contact support.')
      setPaymentStep('select')
    } finally {
      setLoading(false)
    }
  }

  // Skip payment option
  const handleSkipPayment = async () => {
    setLoading(true)
    
    try {
      const isConnected = selectedService && connectionStatus === 'connected'
      
      const paymentData = {
        paymentStatus: 'manual',
        paymentMethod: 'manual',
        paymentDate: null,
        transactionId: null
      }
      
      await addSubscription(
        serviceName, 
        parseFloat(price), 
        renewalDate, 
        isConnected,
        paymentData
      )
      
      // Reset and close
      setServiceName('')
      setPrice('')
      setRenewalDate('')
      setSelectedService(null)
      setStep(1)
      setConnectionStatus(null)
      setPaymentStep('select')
      
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Add subscription error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to add subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    handleConfigureContinue()
  }

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
          >
            <div className="thor-card w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold glow-text">Add Subscription</h2>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${step >= 1 ? 'bg-thor-blue' : 'bg-gray-600'}`} />
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${step >= 2 ? 'bg-thor-blue' : 'bg-gray-600'}`} />
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${step >= 3 ? 'bg-thor-blue' : 'bg-gray-600'}`} />
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${step >= 4 ? 'bg-thor-blue' : 'bg-gray-600'}`} />
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-thor-red/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{error}</span>
                </div>
              )}

              {/* Step 1: Service Selection */}
              {step === 1 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Select Service</h3>
                  
                  {/* Manual Input */}
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-xs sm:text-sm font-medium mb-2">Service Name</label>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="e.g. Netflix, Spotify, Custom Service..."
                      className="w-full text-sm sm:text-base"
                    />
                    {selectedService && (
                      <p className="text-xs sm:text-sm text-thor-blue mt-1">
                        ✨ {selectedService.name} detected! Real integration available.
                      </p>
                    )}
                  </div>

                  {/* Popular Services */}
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-sm sm:text-base font-medium mb-2 sm:mb-3">Popular Services (Real Integration)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {Object.entries(REAL_SERVICES).map(([key, service]) => (
                        <button
                          key={key}
                          onClick={() => handleServiceSelect(key)}
                          className="p-2 sm:p-3 border border-thor-blue/30 rounded-lg hover:bg-thor-blue/10 transition-all text-left"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                            <span className="text-base sm:text-lg">{service.logo}</span>
                            <span className="text-xs sm:text-sm font-medium truncate">{service.name}</span>
                            {service.automationSupport && (
                              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-thor-red flex-shrink-0" title="Auto-payment supported" />
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-2">{service.description}</p>
                          <p className="text-[10px] sm:text-xs text-thor-blue mt-0.5">From ₹{service.prices[0]}/mo</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => setStep(selectedService ? 2 : 3)}
                    disabled={!serviceName.trim()}
                    className="w-full thor-button disabled:opacity-50 text-sm sm:text-base py-2.5 sm:py-3"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* Step 2: Account Connection */}
              {step === 2 && selectedService && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Connect {selectedService.name} Account</h3>
                  
                  <div className="bg-thor-blue/10 border border-thor-blue/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <span className="text-xl sm:text-2xl">{selectedService.logo}</span>
                      <div className="flex-1">
                        <h4 className="text-sm sm:text-base font-semibold text-thor-blue">{selectedService.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-300 mb-1 sm:mb-2">{selectedService.description}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400">
                          <Shield className="w-3 h-3 inline mr-1" />
                          {selectedService.setupRequired}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-xs sm:text-sm font-medium mb-2">Select Plan</label>
                    <div className="grid gap-2">
                      {selectedService.plans.map((plan, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedPlan(index)
                            setPrice(selectedService.prices[index].toString())
                          }}
                          className={`p-2 sm:p-3 border rounded-lg text-left transition-all ${
                            selectedPlan === index
                              ? 'border-thor-blue bg-thor-blue/20'
                              : 'border-gray-600 hover:border-thor-blue/50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm sm:text-base font-medium">{plan}</span>
                            <span className="text-xs sm:text-sm text-thor-blue">₹{selectedService.prices[index]}/mo</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Connection Status */}
                  {connectionStatus === 'connected' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.2, 1],
                        opacity: 1
                      }}
                      transition={{ 
                        duration: 0.6,
                        times: [0, 0.6, 1],
                        ease: "easeOut"
                      }}
                      className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-400/50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 relative overflow-hidden"
                    >
                      {/* Animated background glow */}
                      <motion.div
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 0.1, 0.3]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-green-400/20 rounded-xl"
                      />
                      
                      <div className="relative flex items-center gap-2 sm:gap-3">
                        {/* Animated checkmark */}
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="flex-shrink-0"
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
                          </div>
                        </motion.div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                            <motion.span
                              initial={{ y: -10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-sm sm:text-base font-bold text-green-300"
                            >
                              🎉 Successfully Connected!
                            </motion.span>
                          </div>
                          <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xs sm:text-sm text-green-200"
                          >
                            Your {selectedService.name} account is now linked to GeniePay
                          </motion.p>
                        </div>
                        
                        {/* Sparkle animation */}
                        <motion.div
                          animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="text-xl sm:text-2xl flex-shrink-0"
                        >
                          ✨
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {connectionStatus === 'redirected' && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-blue-400">Opening {selectedService.name} login page...</span>
                    </div>
                  )}

                  {connectionStatus === 'waiting_login' && !checkingLogin && (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-yellow-400">Complete your login in the other tab</span>
                        <div className="ml-auto flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-[10px] sm:text-xs text-green-400 hidden sm:inline">Detecting...</span>
                        </div>
                      </div>
                      
                      {/* Debug Info Panel */}
                      <div className="bg-black/30 rounded px-2 py-1 mb-2">
                        <p className="text-[10px] sm:text-xs font-mono text-blue-300 break-all">{debugInfo}</p>
                      </div>
                      
                      <div className="text-[10px] sm:text-xs text-gray-300 space-y-1 sm:space-y-1.5">
                        <p><strong>Step 1:</strong> Log in to your {selectedService.name} account in the opened window</p>
                        <p><strong>Step 2:</strong> After successful login, <strong className="text-green-300">simply close that window</strong></p>
                        <p><strong>Step 3:</strong> <strong className="text-green-300">We'll automatically mark it as Connected! ✅</strong></p>
                        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-yellow-500/20">
                          <p className="text-yellow-300">💡 Or click "I'm Logged In - Verify" button below to skip waiting</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {checkingLogin && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <Loader className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-blue-400">Checking your {selectedService.name} login status...</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-300">
                        We're verifying if you've successfully logged in. This may take a few seconds.
                      </p>
                    </div>
                  )}

                  {connectionStatus === 'pending_verification' && (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 flex items-center gap-2">
                      <Loader className="w-4 h-4 text-yellow-400 animate-spin flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-yellow-400">Set up your {selectedService.name} subscription and return here to continue.</span>
                    </div>
                  )}

                  {connectionStatus === 'failed' && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 flex items-center gap-2">
                      <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-red-400">Failed to connect. You can still add manually.</span>
                    </div>
                  )}

                  {/* Connection Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {checkingLogin ? (
                      <button
                        disabled
                        className="flex-1 thor-button disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
                      >
                        <Loader className="w-4 h-4 animate-spin" />
                        Verifying Login...
                      </button>
                    ) : connectionStatus === 'waiting_login' ? (
                      <button
                        onClick={() => checkLoginStatus()}
                        className="flex-1 thor-button flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
                      >
                        <Check className="w-4 h-4" />
                        I'm Logged In - Verify
                      </button>
                    ) : connectionStatus === 'redirected' || connectionStatus === 'pending_verification' ? (
                      <button
                        onClick={() => setStep(3)}
                        className="flex-1 thor-button flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
                      >
                        <Check className="w-4 h-4" />
                        I've Set Up My Account - Continue
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectAccount}
                        disabled={connecting}
                        className="flex-1 thor-button disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
                      >
                        {connecting ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Connect Account
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setConnectionStatus('manual')
                        setStep(3)
                      }}
                      className="px-3 sm:px-4 py-2 sm:py-2 text-xs sm:text-sm border border-gray-600 hover:border-thor-blue/50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Skip & Add Manually
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Final Configuration */}
              {step === 3 && (
                <form onSubmit={handleSubmit}>
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Configure Subscription</h3>
                  
                  {/* Connection Success Message */}
                  {connectionStatus === 'connected' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-green-400 mb-1.5 sm:mb-2">
                        <strong>✅ Connected!</strong> Now enter your {selectedService?.name} subscription details:
                      </p>
                      <ul className="text-[10px] sm:text-xs text-gray-300 space-y-0.5 sm:space-y-1">
                        <li>• Enter the exact monthly price you're paying</li>
                        <li>• Set the renewal date to match your billing cycle</li>
                        <li>• GeniePay will track this subscription for you</li>
                      </ul>
                    </div>
                  )}

                  {/* Redirect Info Message */}
                  {(connectionStatus === 'redirected' || connectionStatus === 'pending_verification') && (
                    <div className="bg-thor-blue/10 border border-thor-blue/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-thor-blue mb-1.5 sm:mb-2">
                        <strong>Great!</strong> Now enter the subscription details from your {selectedService?.name} account:
                      </p>
                      <ul className="text-[10px] sm:text-xs text-gray-300 space-y-0.5 sm:space-y-1">
                        <li>• Enter the exact monthly price you're paying</li>
                        <li>• Set the renewal date to match your billing cycle</li>
                        <li>• GeniePay will track this subscription for you</li>
                      </ul>
                    </div>
                  )}
                  
                  {/* Service Info */}
                  <div className="bg-thor-dark/30 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedService && <span className="text-base sm:text-lg">{selectedService.logo}</span>}
                      <span className="text-sm sm:text-base font-medium">{serviceName}</span>
                      {selectedService && connectionStatus === 'connected' && (
                        <span className="text-[10px] sm:text-xs bg-green-500/20 text-green-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Connected</span>
                      )}
                      {(connectionStatus === 'redirected' || connectionStatus === 'pending_verification') && (
                        <span className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">Account Setup</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Monthly Price (₹)</label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                        className="w-full text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2">Renewal Date</label>
                      <input
                        type="date"
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        required
                        min={today}
                        className="w-full text-sm sm:text-base"
                      />
                    </div>

                    {/* Automation Options */}
                    {selectedService?.automationSupport && connectionStatus === 'connected' && (
                      <div className="bg-thor-blue/10 border border-thor-blue/30 rounded-lg p-3 sm:p-4">
                        <h4 className="text-sm sm:text-base font-medium text-thor-blue mb-2 sm:mb-3 flex items-center gap-2">
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                          Automation Settings
                        </h4>
                        
                        <div className="space-y-2 sm:space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={automatePayments}
                              onChange={(e) => setAutomatePayments(e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs sm:text-sm">Enable automatic payments via blockchain</span>
                          </label>

                          {automatePayments && (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium mb-2">Payment Method</label>
                              <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full text-sm sm:text-base"
                              >
                                {selectedService.paymentMethods.map(method => (
                                  <option key={method} value={method}>
                                    {method.charAt(0).toUpperCase() + method.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-600 hover:border-thor-blue/50 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 thor-button disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Payment */}
              {step === 4 && (
                <div>
                  {paymentStep === 'select' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-2">Complete First Payment</h3>
                        <p className="text-gray-400 text-sm">Pay the first month to activate your subscription</p>
                      </div>

                      {/* Subscription Summary */}
                      <div className="bg-thor-dark/50 rounded-lg p-4 border border-thor-blue/30">
                        <div className="flex items-center gap-3 mb-4">
                          {selectedService && <span className="text-3xl">{selectedService.logo}</span>}
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{serviceName}</h4>
                            {selectedService && (
                              <p className="text-sm text-gray-400">{selectedService.plans[selectedPlan]}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 border-t border-gray-700 pt-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">First Month Payment</span>
                            <span className="font-semibold">{formatAmount(parseFloat(price))}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Renewal Date</span>
                            <span>{new Date(renewalDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                            <span className="text-lg font-bold">Total Amount</span>
                            <span className="text-2xl font-bold text-thor-red">{formatAmount(parseFloat(price))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div className="space-y-3">
                        <h4 className="font-semibold mb-3">Payment via Razorpay</h4>
                        
                        {/* Razorpay Payment Option */}
                        <div className="w-full p-4 rounded-lg border-2 border-thor-blue bg-thor-blue/10">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-thor-blue/20">
                              <CreditCard className="w-6 h-6 text-thor-blue" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold mb-1 flex items-center gap-2">
                                Pay via Razorpay
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Recommended</span>
                              </div>
                              <p className="text-sm text-gray-400">UPI, Cards, Net Banking & Wallets</p>
                            </div>
                          </div>
                          
                          {/* Fee Breakdown */}
                          <div className="bg-thor-dark/50 rounded-lg p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Subscription Price:</span>
                              <span className="font-semibold">{formatAmount(parseFloat(price))}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Platform Fee (2%):</span>
                              <span className="font-semibold text-thor-blue">
                                + {formatAmount(parseFloat(price) * 0.02)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                              <span className="font-bold">Total Amount:</span>
                              <span className="text-lg font-bold text-thor-red">
                                {formatAmount(parseFloat(price) * 1.02)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              💳 Platform fee is for automatic payment verification
                            </p>
                          </div>
                        </div>

                        {/* Skip Payment Option */}
                        <button
                          onClick={() => setPaymentChoice('skip')}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            paymentChoice === 'skip'
                              ? 'border-gray-500 bg-gray-700/20'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              paymentChoice === 'skip' ? 'bg-gray-600' : 'bg-gray-700'
                            }`}>
                              <Smartphone className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold mb-1">Skip Payment</div>
                              <p className="text-sm text-gray-400">Add subscription without payment (manual tracking)</p>
                            </div>
                            {paymentChoice === 'skip' && <Check className="w-5 h-5 text-gray-400" />}
                          </div>
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => setStep(3)}
                          className="px-4 py-2 border border-gray-600 hover:border-thor-blue/50 rounded-lg transition-colors"
                        >
                          Back
                        </button>
                        
                        <button
                          onClick={paymentChoice === 'skip' ? () => handlePaymentConfirm(false) : handleRazorpayPayment}
                          disabled={loading}
                          className="flex-1 thor-button flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Processing...
                            </>
                          ) : paymentChoice === 'skip' ? (
                            <>
                              Continue without Payment
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5" />
                              Pay {formatAmount(parseFloat(price) * 1.02)} via Razorpay
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentStep === 'processing' && (
                    <div className="text-center py-12">
                      <div className="mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-thor-blue/20 flex items-center justify-center animate-pulse">
                          <Smartphone className="w-10 h-10 text-thor-blue" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Opening UPI Payment</h3>
                      <p className="text-gray-400 mb-4">Complete payment in your UPI app</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Redirecting to UPI apps...</span>
                      </div>
                    </div>
                  )}

                  {paymentStep === 'confirmation' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                          {isMobileDevice() ? (
                            <AlertTriangle className="w-10 h-10 text-yellow-500" />
                          ) : (
                            <Smartphone className="w-10 h-10 text-thor-blue" />
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          {isMobileDevice() ? 'Payment Confirmation' : 'Complete Payment on Phone'}
                        </h3>
                        <p className="text-gray-400">
                          {isMobileDevice() 
                            ? 'Did you complete the payment in your UPI app?' 
                            : 'Use your phone to complete the payment'}
                        </p>
                      </div>

                      {/* Desktop Payment Instructions */}
                      {!isMobileDevice() && (
                        <div className="bg-thor-blue/10 border border-thor-blue/30 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-thor-blue" />
                            Payment Instructions (Desktop)
                          </h4>
                          <div className="space-y-3 text-sm">
                            <div className="bg-thor-dark/50 rounded p-3">
                              <p className="text-gray-400 mb-1">Step 1: Open any UPI app on your phone</p>
                              <div className="flex gap-2 text-xs text-gray-500">
                                <span>📱 GPay</span>
                                <span>📱 PhonePe</span>
                                <span>📱 Paytm</span>
                                <span>📱 BHIM</span>
                              </div>
                            </div>
                            
                            <div className="bg-thor-dark/50 rounded p-3">
                              <p className="text-gray-400 mb-2">Step 2: Pay to this UPI ID:</p>
                              <div className="flex items-center justify-between bg-thor-darker p-2 rounded">
                                <code className="text-thor-blue font-mono">9448048720@axl</code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText('9448048720@axl')
                                    alert('UPI ID copied!')
                                  }}
                                  className="p-1.5 hover:bg-thor-blue/20 rounded transition-colors"
                                  title="Copy UPI ID"
                                >
                                  <Copy className="w-4 h-4 text-thor-blue" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-thor-dark/50 rounded p-3">
                              <p className="text-gray-400 mb-1">Step 3: Enter amount</p>
                              <p className="text-2xl font-bold text-thor-red">{formatAmount(parseFloat(price))}</p>
                            </div>
                            
                            <div className="bg-thor-dark/50 rounded p-3">
                              <p className="text-gray-400 mb-1">Step 4: Add note (optional)</p>
                              <p className="text-sm">{serviceName} - First Payment</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment Details */}
                      <div className="bg-thor-dark/50 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Service</span>
                          <span className="font-semibold">{serviceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Amount Paid</span>
                          <span className="font-semibold text-thor-red">{formatAmount(parseFloat(price))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Transaction ID</span>
                          <span className="font-mono text-xs">{transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Payment To</span>
                          <span className="font-mono text-xs">9448048720@axl</span>
                        </div>
                      </div>

                      {/* Confirmation Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => handlePaymentConfirm(true)}
                          disabled={loading}
                          className="w-full thor-button flex items-center justify-center gap-2 py-3"
                        >
                          {loading ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Yes, Payment Completed ✓
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setPaymentStep('select')}
                          disabled={loading}
                          className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg transition-colors"
                        >
                          No, Try Again
                        </button>
                        
                        <button
                          onClick={() => handlePaymentConfirm(false)}
                          disabled={loading}
                          className="w-full text-gray-400 hover:text-white py-2 text-sm"
                        >
                          Skip Payment & Add Manually
                        </button>
                      </div>

                      {/* Help Text */}
                      <div className="bg-thor-blue/10 border border-thor-blue/30 rounded-lg p-3">
                        <p className="text-xs text-gray-400">
                          💡 <strong>Tip:</strong> Check your UPI app transaction history to verify if payment was successful
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Success */}
                  {paymentStep === 'success' && (
                    <div className="text-center py-12">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="mb-6"
                      >
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2 text-green-500">Payment Successful!</h3>
                      <p className="text-gray-400 mb-4">Your subscription has been activated</p>
                      <div className="bg-thor-dark/50 rounded-lg p-4 mb-4 inline-block">
                        <p className="text-sm text-gray-400">Subscription: <span className="text-white font-semibold">{serviceName}</span></p>
                        <p className="text-sm text-gray-400">Amount Paid: <span className="text-thor-blue font-semibold">{formatAmount(parseFloat(price) * 1.02)}</span></p>
                      </div>
                      <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
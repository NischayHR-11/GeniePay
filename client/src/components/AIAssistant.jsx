import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, Loader, Mic, MicOff } from 'lucide-react'
import { sendAICommand } from '../utils/api'

export default function AIAssistant({ isOpen, onClose, onUpdate }) {
  // Add custom CSS for sound wave animation
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes soundWave {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1); }
      }
      .sound-wave {
        animation: soundWave 0.8s ease-in-out infinite;
        transform-origin: center;
      }
      .sound-wave-1 { animation-delay: 0s; }
      .sound-wave-2 { animation-delay: 0.1s; }
      .sound-wave-3 { animation-delay: 0.2s; }
      .sound-wave-4 { animation-delay: 0.3s; }
      .sound-wave-5 { animation-delay: 0.4s; }
      .sound-wave-6 { animation-delay: 0.5s; }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you manage your subscriptions directly. Try:\n• "Resume Amazon" to reactivate\n• "Pause Netflix" to pause\n• "Add Disney for 299"\n• "Show my spending"',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const messagesEndRef = useRef(null)

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.')
        }
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
      // Scroll to bottom when listening starts to show the full animation
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Scroll to bottom when listening animation appears
  useEffect(() => {
    if (isListening) {
      setTimeout(() => {
        scrollToBottom()
      }, 200) // Small delay to ensure animation is rendered
    }
  }, [isListening])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Get last 5 messages for context (excluding the welcome message)
      const recentMessages = messages
        .slice(-5)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      
      // Add current message
      recentMessages.push({ role: 'user', content: input })
      
      const response = await sendAICommand(input, recentMessages)
      
      const aiMessage = {
        role: 'assistant',
        content: response.response || 'Command executed successfully!',
        timestamp: new Date(),
        data: response
      }

      setMessages(prev => [...prev, aiMessage])

      // Refresh subscriptions if action was performed
      if (['add', 'bulkAdd', 'delete', 'pause', 'resume', 'list', 'analytics', 'bulk'].includes(response.action)) {
        onUpdate()
      }
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[450px] md:w-[500px] lg:w-[550px] bg-thor-darker border-l border-thor-blue/30 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-thor-blue/30">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-thor-red" />
                <h2 className="text-lg sm:text-xl font-bold glow-text">AI Assistant</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-thor-red/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 scrollbar-hide">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-thor-blue/20' 
                      : message.isError
                      ? 'bg-thor-red/20'
                      : 'bg-thor-red/20'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-thor-blue" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-thor-red" />
                    )}
                  </div>

                  {/* Message */}
                  <div className={`flex-1 min-w-0 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {/* Only show text if not a list action, or if it's a list action with no subscriptions */}
                    {!(message.data?.action === 'list' && message.data?.subscriptions?.length > 0) && (
                      <div className={`inline-block px-3 py-2 sm:px-4 sm:py-2 rounded-lg max-w-full text-sm sm:text-base ${
                        message.role === 'user'
                          ? 'bg-thor-blue/20 text-white'
                          : message.isError
                          ? 'bg-thor-red/20 text-thor-red'
                          : 'bg-thor-dark text-gray-200'
                      }`}>
                        <div className="break-words">{message.content}</div>
                      </div>
                    )}
                    
                    {/* Display subscriptions in table format if available */}
                    {message.data?.subscriptions && message.data.subscriptions.length > 0 && (
                      <div className="mt-2 sm:mt-3 bg-thor-dark/50 rounded-lg overflow-hidden text-left">
                        {/* Table for multiple subscriptions - scrollable independently without scrollbar */}
                        <div className="overflow-x-auto overflow-y-visible p-2 sm:p-3 scrollbar-hide">
                          <table className="w-full text-xs sm:text-sm min-w-[400px] sm:min-w-[500px]">
                            <thead>
                              <tr className="border-b border-thor-blue/30">
                                <th className="text-left py-2 px-1 sm:px-2 text-thor-blue whitespace-nowrap">Service</th>
                                <th className="text-left py-2 px-1 sm:px-2 text-thor-blue whitespace-nowrap">Price</th>
                                <th className="text-left py-2 px-1 sm:px-2 text-thor-blue whitespace-nowrap">Status</th>
                                <th className="text-left py-2 px-1 sm:px-2 text-thor-blue whitespace-nowrap">Renewal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {message.data.subscriptions.map((sub, idx) => (
                                <tr key={idx} className="border-b border-gray-700/50 hover:bg-thor-blue/5">
                                  <td className="py-2 px-1 sm:px-2 font-medium whitespace-nowrap">{sub.serviceName}</td>
                                  <td className="py-2 px-1 sm:px-2 whitespace-nowrap">₹{sub.price}</td>
                                  <td className="py-2 px-1 sm:px-2 whitespace-nowrap">
                                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs ${
                                      sub.status === 'active' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : sub.status === 'paused'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {sub.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-1 sm:px-2 text-gray-400 whitespace-nowrap text-xs sm:text-sm">
                                    {new Date(sub.renewalDate).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Total spending */}
                        {message.data.totalSpending !== undefined && (
                          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 px-2 sm:px-3 border-t border-thor-blue/30 flex justify-between items-center text-sm sm:text-base">
                            <span className="text-gray-400">Total Monthly Spending:</span>
                            <span className="text-base sm:text-lg font-bold text-thor-red">₹{message.data.totalSpending}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-thor-red/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-thor-red" />
                  </div>
                  <div className="bg-thor-dark px-3 py-2 sm:px-4 sm:py-2 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-thor-red rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-thor-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-thor-red rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Listening Animation - Centered */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex justify-center items-center py-8 mb-6"
                >
                  <div className="flex flex-col items-center gap-4">
                    {/* Microphone with pulsing rings */}
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-thor-red/30 to-thor-blue/30 flex items-center justify-center relative">
                        <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-thor-red z-10" />
                        {/* Multiple pulsing ring effects */}
                        <div className="absolute inset-0 rounded-full bg-thor-red/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full bg-thor-blue/10 animate-pulse"></div>
                        <div className="absolute -inset-2 rounded-full bg-thor-red/10 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                    </div>
                    
                    {/* Sound wave visualization */}
                    <div className="bg-gradient-to-r from-thor-red/10 via-thor-blue/10 to-thor-red/10 px-6 py-4 rounded-xl border border-thor-red/20 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-end gap-1 h-10">
                          {/* Thor-themed sound wave bars */}
                          <div className="w-1.5 bg-gradient-to-t from-thor-red to-thor-red/60 rounded-full sound-wave sound-wave-1" style={{ height: '16px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-blue to-thor-blue/60 rounded-full sound-wave sound-wave-2" style={{ height: '28px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-red to-thor-red/60 rounded-full sound-wave sound-wave-3" style={{ height: '20px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-blue to-thor-blue/60 rounded-full sound-wave sound-wave-4" style={{ height: '32px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-red to-thor-red/60 rounded-full sound-wave sound-wave-5" style={{ height: '18px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-blue to-thor-blue/60 rounded-full sound-wave sound-wave-6" style={{ height: '24px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-red to-thor-red/60 rounded-full sound-wave sound-wave-1" style={{ height: '26px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-blue to-thor-blue/60 rounded-full sound-wave sound-wave-2" style={{ height: '14px' }}></div>
                          <div className="w-1.5 bg-gradient-to-t from-thor-red to-thor-red/60 rounded-full sound-wave sound-wave-3" style={{ height: '30px' }}></div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm sm:text-base text-thor-red font-medium mb-1">Listening...</div>
                          <div className="text-xs text-gray-400">Speak your command clearly</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 md:p-6 border-t border-thor-blue/30">
              <form onSubmit={handleSubmit} className="flex gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Type a command or use voice..."}
                  className="flex-1 text-sm sm:text-base"
                  disabled={loading}
                />
                
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={loading}
                  className={`px-2.5 sm:px-3 md:px-4 py-2 rounded-lg transition-all ${
                    isListening 
                      ? 'bg-thor-red text-white animate-pulse' 
                      : 'bg-thor-blue/20 hover:bg-thor-blue/30 text-thor-blue'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="thor-button px-2.5 sm:px-3 md:px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </form>

              {/* Quick Commands */}
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={() => setInput('Show my total spending')}
                  className="text-xs px-2 sm:px-3 py-1 bg-thor-dark hover:bg-thor-blue/20 rounded-full transition-colors"
                  disabled={loading}
                >
                  Show spending
                </button>
                <button
                  onClick={() => setInput('List all subscriptions')}
                  className="text-xs px-2 sm:px-3 py-1 bg-thor-dark hover:bg-thor-blue/20 rounded-full transition-colors"
                  disabled={loading}
                >
                  List all
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

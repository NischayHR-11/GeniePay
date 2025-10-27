import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, Loader } from 'lucide-react'
import { sendAICommand } from '../utils/api'

export default function AIAssistant({ isOpen, onClose, onUpdate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you manage your subscriptions directly. Try:\n• "Resume Amazon" to reactivate\n• "Pause Netflix" to pause\n• "Add Disney for 299"\n• "Show my spending"',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-thor-darker border-l border-thor-blue/30 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-thor-blue/30">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-thor-red" />
                <h2 className="text-xl font-bold glow-text">AI Assistant</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-thor-red/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4">
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
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-thor-blue/20' 
                      : message.isError
                      ? 'bg-thor-red/20'
                      : 'bg-thor-red/20'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-thor-blue" />
                    ) : (
                      <Bot className="w-4 h-4 text-thor-red" />
                    )}
                  </div>

                  {/* Message */}
                  <div className={`flex-1 min-w-0 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {/* Only show text if not a list action, or if it's a list action with no subscriptions */}
                    {!(message.data?.action === 'list' && message.data?.subscriptions?.length > 0) && (
                      <div className={`inline-block px-4 py-2 rounded-lg max-w-full ${
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
                      <div className="mt-3 bg-thor-dark/50 rounded-lg overflow-hidden text-left">
                        {/* Table for multiple subscriptions - scrollable independently without scrollbar */}
                        <div className="overflow-x-auto overflow-y-visible p-3 scrollbar-hide">
                          <table className="w-full text-sm min-w-[500px]">
                            <thead>
                              <tr className="border-b border-thor-blue/30">
                                <th className="text-left py-2 px-2 text-thor-blue whitespace-nowrap">Service</th>
                                <th className="text-left py-2 px-2 text-thor-blue whitespace-nowrap">Price</th>
                                <th className="text-left py-2 px-2 text-thor-blue whitespace-nowrap">Status</th>
                                <th className="text-left py-2 px-2 text-thor-blue whitespace-nowrap">Renewal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {message.data.subscriptions.map((sub, idx) => (
                                <tr key={idx} className="border-b border-gray-700/50 hover:bg-thor-blue/5">
                                  <td className="py-2 px-2 font-medium whitespace-nowrap">{sub.serviceName}</td>
                                  <td className="py-2 px-2 whitespace-nowrap">₹{sub.price}</td>
                                  <td className="py-2 px-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      sub.status === 'active' 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : sub.status === 'paused'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {sub.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-gray-400 whitespace-nowrap">
                                    {new Date(sub.renewalDate).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Total spending */}
                        {message.data.totalSpending !== undefined && (
                          <div className="mt-3 pt-3 border-t border-thor-blue/30 flex justify-between items-center">
                            <span className="text-gray-400">Total Monthly Spending:</span>
                            <span className="text-lg font-bold text-thor-red">₹{message.data.totalSpending}</span>
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
                  <div className="w-8 h-8 rounded-full bg-thor-red/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-thor-red" />
                  </div>
                  <div className="bg-thor-dark px-4 py-2 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-thor-red rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-thor-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-thor-red rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-thor-blue/30">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="thor-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>

              {/* Quick Commands */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setInput('Show my total spending')}
                  className="text-xs px-3 py-1 bg-thor-dark hover:bg-thor-blue/20 rounded-full transition-colors"
                  disabled={loading}
                >
                  Show spending
                </button>
                <button
                  onClick={() => setInput('List all subscriptions')}
                  className="text-xs px-3 py-1 bg-thor-dark hover:bg-thor-blue/20 rounded-full transition-colors"
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

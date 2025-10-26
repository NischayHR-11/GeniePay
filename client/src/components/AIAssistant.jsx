import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Bot, User, Loader } from 'lucide-react'
import { sendAICommand } from '../utils/api'

export default function AIAssistant({ isOpen, onClose, onUpdate }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant. I can help you manage your subscriptions. Try commands like "Pause Netflix", "Show my spending", or "Add Prime Video for ₹299".',
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
      const response = await sendAICommand(input)
      
      const aiMessage = {
        role: 'assistant',
        content: response.response || 'Command executed successfully!',
        timestamp: new Date(),
        data: response
      }

      setMessages(prev => [...prev, aiMessage])

      // Refresh subscriptions if action was performed
      if (['add', 'delete', 'pause', 'resume'].includes(response.action)) {
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  <div className={`flex-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`inline-block px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-thor-blue/20 text-white'
                        : message.isError
                        ? 'bg-thor-red/20 text-thor-red'
                        : 'bg-thor-dark text-gray-200'
                    }`}>
                      {message.content}
                    </div>
                    
                    {/* Display data if available */}
                    {message.data?.subscriptions && (
                      <div className="mt-2 text-sm text-gray-400">
                        <p>Total: ₹{message.data.totalSpending}/month</p>
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

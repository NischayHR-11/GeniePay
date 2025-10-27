import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap, Brain, Shield, Wallet, TrendingUp, Clock } from 'lucide-react'
import SimpleBackground from '../components/SimpleBackground'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()
  
  const features = [
    {
      icon: <Brain className="w-12 h-12" />,
      title: 'AI Assistant',
      description: 'Natural language commands for easy subscription management'
    },
    {
      icon: <Wallet className="w-12 h-12" />,
      title: 'Blockchain Powered',
      description: 'Secure automated payments via smart contracts'
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: 'Ultra Secure',
      description: 'Bank-level encryption and blockchain security'
    },
    {
      icon: <Clock className="w-12 h-12" />,
      title: 'Never Miss a Payment',
      description: 'Automated renewals with instant notifications'
    },
    {
      icon: <TrendingUp className="w-12 h-12" />,
      title: 'Spending Analytics',
      description: 'Visualize and track your subscription expenses'
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: 'Lightning Fast',
      description: 'Instant transactions on Polygon network'
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SimpleBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Zap className="w-20 h-20 text-thor-red mx-auto" />
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 glow-text">
              GeniePay
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              AI-Powered Blockchain Subscription Automation
              <br />
              <span className="text-thor-blue">Never worry about payments again</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              {isAuthenticated ? (
                <Link to="/dashboard" className="thor-button text-lg px-8 py-4">
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/signup" className="thor-button text-lg px-8 py-4">
                  Get Started Free
                </Link>
              )}
              <a 
                href="#features" 
                className="px-8 py-4 rounded-lg font-bold text-white border-2 border-thor-blue hover:bg-thor-blue/20 transition-all duration-300"
              >
                Learn More
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex items-center justify-center gap-8 flex-wrap text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-thor-red rounded-full animate-pulse"></div>
                <span>AI Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-thor-blue rounded-full animate-pulse"></div>
                <span>Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-thor-red rounded-full animate-pulse"></div>
                <span>100% Automated</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 glow-text">
              The Future of Subscriptions
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              GeniePay combines cutting-edge AI and blockchain technology to revolutionize 
              how you manage subscriptions. Our intelligent system automates payments, 
              provides insights, and gives you complete control through simple voice commands 
              and a stunning interface inspired by the power of THOR.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 glow-text"
          >
            Powerful Features
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="thor-card text-center"
              >
                <div className="text-thor-red mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-thor-blue">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="thor-card text-center max-w-3xl mx-auto neon-border"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 glow-text">
              Ready to Automate Your Life?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of users who never miss a payment and save time with AI automation
            </p>
            <Link to="/signup" className="thor-button text-lg px-10 py-4 inline-block">
              Start Free Trial
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-thor-blue/30 relative">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-thor-red" />
            <span>Powered by THOR Energy</span>
            <Zap className="w-4 h-4 text-thor-blue" />
          </p>
          <p className="mt-2 text-sm">
            © 2025 GeniePay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

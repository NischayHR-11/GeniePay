# 🌩️ GeniePay - AI + Blockchain Subscription Automation

> Futuristic subscription management system with AI assistance and blockchain-powered automated payments

## ⚡ Features

- 🤖 **AI Assistant** - Natural language commands for subscription management
- ⛓️ **Blockchain Integration** - Smart contract automation for payments
- 🔐 **Secure Authentication** - JWT-based auth with encrypted passwords
- 📊 **Analytics Dashboard** - Visualize spending trends with charts
- 📧 **Email Notifications** - Automated reminders and confirmations
- 🎭 **3D Animations** - Three.js powered particle effects

## 🛠️ Tech Stack

### Frontend
- React.js (Vite)
- Tailwind CSS
- Framer Motion
- Three.js / React Three Fiber
- Chart.js
- Web3.js

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- OpenAI API
- Web3.js/Ethers.js
- NodeMailer

### Blockchain
- Solidity Smart Contracts
- Ethereum/Polygon Testnet
- MetaMask Integration

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- MetaMask Wallet
- OpenAI API Key
- Alchemy/Infura Account (for blockchain RPC)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd GeniePay
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

3. **Configure environment variables**
```bash
# Backend environment
cd backend
copy .env.example .env
# Edit backend/.env with your credentials

# Frontend environment
cd ../client
copy .env.example .env
# Edit client/.env with your API URL
cd ..
```

4. **Deploy Smart Contract** (Optional - for blockchain features)
```bash
cd contracts
# Follow deployment instructions in contracts/README.md
```

5. **Run the application**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (open new terminal)
cd client
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
GeniePay/
├── backend/
│   └── server.js           # Complete backend in single file
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Helper functions
│   │   └── App.jsx         # Main app component
│   └── package.json
├── contracts/              # Solidity smart contracts
│   └── SubscriptionPayment.sol
├── .env                    # Environment variables
├── .env.example           # Example environment file
├── package.json           # Root dependencies
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /signup` - Register new user
- `POST /login` - User login

### Subscriptions
- `GET /subscriptions` - Get user subscriptions
- `POST /subscriptions/add` - Add new subscription
- `DELETE /subscriptions/:id` - Delete subscription

### AI & Blockchain
- `POST /ai/command` - Process AI commands
- `POST /blockchain/execute` - Execute smart contract functions

### Notifications
- `POST /notify` - Send email notifications

## 🤖 AI Commands Examples

- "Pause Netflix this month"
- "Add Prime Video for ₹299"
- "Show my total monthly spending"
- "Cancel Spotify subscription"
- "List all active subscriptions"

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS enabled
- Helmet security headers
- Input validation
- Environment variable protection

## 🎨 UI Theme

The UI features:
- Dark mode with neon gradients (red + blue)
- Lightning particle effects
- 3D animated backgrounds
- Glowing buttons and text
- Smooth page transitions
- Responsive design

## 📊 Dashboard Features

- View all active subscriptions
- Add/Edit/Delete subscriptions
- AI chatbot sidebar
- Monthly spending charts
- Blockchain transaction history
- Upcoming renewal alerts

## 🌐 Blockchain Integration

- Automated payment execution
- Fund locking mechanism
- Pause/Cancel subscription on-chain
- Transaction hash storage
- MetaMask wallet connection
- Testnet support (Polygon Mumbai)

## 📧 Email Notifications

- Payment success confirmations
- Upcoming renewal reminders
- Subscription pause notifications
- Payment failure alerts

## 🧪 Testing

```bash
# Test backend API
curl http://localhost:5000/

# Test with MetaMask on Mumbai Testnet
# Get test MATIC from: https://faucet.polygon.technology/
```

## 🚧 Deployment

### Backend (Heroku/Railway)
```bash
# Add production MongoDB URI and environment variables
# Deploy backend/server.js
```

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist folder
```

### Smart Contract (Polygon Mumbai)
```bash
# Use Remix IDE or Hardhat for deployment
# Update CONTRACT_ADDRESS in .env
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- OpenAI for AI integration
- Three.js for 3D graphics
- Ethereum community for Web3 tools
- React and Vite teams

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@geniepay.com

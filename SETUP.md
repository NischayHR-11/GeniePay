# 🌩️ GeniePay - Installation & Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
- **MetaMask Wallet** - [Install](https://metamask.io/)
- **OpenAI API Key** - [Get one](https://platform.openai.com/)
- **Alchemy Account** (for blockchain RPC) - [Sign up](https://www.alchemy.com/)

## 🚀 Quick Start

### Step 1: Clone and Install

```powershell
# Navigate to project directory
cd d:\Github\GeniePay

# Install backend dependencies
cd backend
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Environment Configuration

#### Backend Configuration

Create `.env` file in the backend directory:

```powershell
cd backend
copy .env.example .env
cd ..
```

Edit the `backend/.env` file with your credentials:

```env
# MongoDB - Get from MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/GeniePay?retryWrites=true&w=majority

# JWT Secret - Generate a random string
JWT_SECRET=your_super_secret_jwt_key_here

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# Blockchain (Polygon Mumbai Testnet)
WEB3_PROVIDER_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=0x_your_contract_address_after_deployment
PRIVATE_KEY=your_wallet_private_key

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Server
PORT=5000
CLIENT_URL=http://localhost:5173
```

#### Frontend Configuration

Create `.env` file in the client directory:

```powershell
cd client
copy .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=0x_your_contract_address_after_deployment
```

### Step 3: MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is fine)
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and add it to `.env`

### Step 4: OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your `.env` file

### Step 5: Blockchain Setup (Optional but Recommended)

#### Deploy Smart Contract

1. **Using Remix IDE (Easiest):**
   ```
   - Open https://remix.ethereum.org/
   - Create new file: SubscriptionPayment.sol
   - Copy contract code from contracts/SubscriptionPayment.sol
   - Compile with Solidity 0.8.19+
   - Connect MetaMask to Mumbai Testnet
   - Deploy the contract
   - Copy the contract address
   ```

2. **Get Test MATIC:**
   - Visit [Mumbai Faucet](https://faucet.polygon.technology/)
   - Paste your wallet address
   - Receive free test MATIC

3. **Update Environment Variables:**
   - Add contract address to both `.env` files

#### Configure MetaMask for Mumbai Testnet

Network Details:
- **Network Name:** Mumbai Testnet
- **RPC URL:** https://rpc-mumbai.maticvigil.com/
- **Chain ID:** 80001
- **Currency Symbol:** MATIC
- **Block Explorer:** https://mumbai.polygonscan.com/

### Step 6: Email Setup (Optional)

For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → App passwords
   - Generate password for "Mail"
   - Use this password in `.env`

### Step 7: Run the Application

#### Run Backend and Frontend Separately

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (in new terminal)
cd client
npm run dev
```

### Step 8: Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## 📝 Quick Test

1. Open http://localhost:5173
2. Click "Get Started" or "Sign Up"
3. Create an account
4. Connect MetaMask wallet (optional)
5. Add a subscription
6. Try AI commands like "Show my spending"

## 🔧 Troubleshooting

### MongoDB Connection Error
```
Error: MongoNetworkError
```
**Solution:** 
- Check your MongoDB URI
- Ensure IP is whitelisted in MongoDB Atlas
- Verify database user credentials

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### OpenAI API Error
```
Error: Invalid API key
```
**Solution:**
- Verify your OpenAI API key
- Check if you have available credits
- Ensure key is properly added to `.env`

### MetaMask Connection Failed
```
Error: MetaMask is not installed
```
**Solution:**
- Install MetaMask extension
- Refresh the page
- Try connecting again

### Build Errors
```
Error: Module not found
```
**Solution:**
```powershell
# Clear node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install

# Do the same for client
cd client
rm -r node_modules
rm package-lock.json
npm install
```

## 🌐 Production Deployment

### Backend (Railway/Heroku)

1. Create new project
2. Connect GitHub repository
3. Add environment variables
4. Deploy

### Frontend (Vercel/Netlify)

1. Connect GitHub repository
2. Build command: `cd client && npm run build`
3. Output directory: `client/dist`
4. Add environment variables
5. Deploy

### Smart Contract (Polygon Mainnet)

1. Switch network to Polygon Mainnet
2. Deploy contract (requires real MATIC)
3. Update contract addresses in `.env`

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [Vite Documentation](https://vitejs.dev/)

## 🆘 Need Help?

- Check the main [README.md](../README.md)
- Review contract deployment guide: [contracts/README.md](../contracts/README.md)
- Open an issue on GitHub

## ✅ Checklist

Before running the app, ensure:

- [ ] Node.js installed
- [ ] MongoDB connection string configured
- [ ] OpenAI API key added
- [ ] Dependencies installed (root and client)
- [ ] .env files created and configured
- [ ] MetaMask installed (for blockchain features)
- [ ] Smart contract deployed (optional)
- [ ] Test MATIC available (optional)

---

**Ready to automate your subscriptions with THOR power!** ⚡

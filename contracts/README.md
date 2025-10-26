# Smart Contract Deployment Guide

## SubscriptionPayment Contract

This Solidity smart contract enables decentralized subscription management with automated payments, pause, and cancel functionality.

### Features
- ✅ Create subscriptions with custom intervals
- ✅ Process automated payments
- ✅ Pause/Resume subscriptions
- ✅ Cancel subscriptions permanently
- ✅ Track payment history
- ✅ Secure fund management

### Deployment Options

#### Option 1: Remix IDE (Easiest)

1. **Open Remix IDE**
   - Go to https://remix.ethereum.org/

2. **Create Contract File**
   - Create new file: `SubscriptionPayment.sol`
   - Copy and paste the contract code

3. **Compile Contract**
   - Click on "Solidity Compiler" tab
   - Select compiler version: 0.8.19 or higher
   - Click "Compile SubscriptionPayment.sol"

4. **Deploy Contract**
   - Click on "Deploy & Run Transactions" tab
   - Select environment: "Injected Provider - MetaMask"
   - Connect MetaMask wallet (use Mumbai Testnet)
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Copy Contract Address**
   - After deployment, copy the contract address
   - Update `.env` file with: `CONTRACT_ADDRESS=0x...`

#### Option 2: Hardhat (Recommended for Production)

1. **Install Hardhat**
```bash
cd contracts
npm init -y
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
```

2. **Initialize Hardhat**
```bash
npx hardhat
```
Select "Create a JavaScript project"

3. **Create Deployment Script**
Create `scripts/deploy.js`:
```javascript
async function main() {
  const SubscriptionPayment = await ethers.getContractFactory("SubscriptionPayment");
  const contract = await SubscriptionPayment.deploy();
  await contract.deployed();
  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

4. **Configure Network**
Update `hardhat.config.js`:
```javascript
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.19",
  networks: {
    mumbai: {
      url: "https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
```

5. **Deploy**
```bash
npx hardhat run scripts/deploy.js --network mumbai
```

### Testing on Mumbai Testnet

1. **Get Test MATIC**
   - Visit: https://faucet.polygon.technology/
   - Enter your wallet address
   - Receive free test MATIC tokens

2. **Add Mumbai Network to MetaMask**
   - Network Name: Mumbai Testnet
   - RPC URL: https://rpc-mumbai.maticvigil.com/
   - Chain ID: 80001
   - Currency Symbol: MATIC
   - Block Explorer: https://mumbai.polygonscan.com/

### Contract Functions

#### Create Subscription
```javascript
createSubscription(payeeAddress, amount, interval)
// Creates new subscription with first payment
```

#### Pay Subscription
```javascript
paySubscription(subscriptionId)
// Process payment for subscription
```

#### Pause Subscription
```javascript
pauseSubscription(subscriptionId)
// Temporarily pause subscription
```

#### Resume Subscription
```javascript
resumeSubscription(subscriptionId)
// Resume paused subscription
```

#### Cancel Subscription
```javascript
cancelSubscription(subscriptionId)
// Permanently cancel subscription
```

### Integration with Backend

After deployment, update your `.env`:
```
CONTRACT_ADDRESS=0xYourDeployedContractAddress
WEB3_PROVIDER_URL=https://polygon-mumbai.g.alchemy.com/v2/your-api-key
PRIVATE_KEY=your_wallet_private_key
```

### Verify Contract on PolygonScan

```bash
npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS
```

### Security Considerations

- ✅ Use testnet for development
- ✅ Secure private keys (never commit to git)
- ✅ Test all functions before mainnet deployment
- ✅ Consider audit for production use
- ✅ Implement proper access controls
- ✅ Use safe math operations

### Gas Estimation

- Create Subscription: ~150,000 gas
- Pay Subscription: ~80,000 gas
- Pause/Resume: ~50,000 gas
- Cancel: ~30,000 gas

### Support

For issues or questions about smart contract deployment:
- Remix Documentation: https://remix-ide.readthedocs.io/
- Hardhat Documentation: https://hardhat.org/getting-started/
- Polygon Documentation: https://docs.polygon.technology/

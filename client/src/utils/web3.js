import Web3 from 'web3'

let web3
let contract
let account

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const CONTRACT_ABI = [
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
]

export const connectWallet = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    account = accounts[0]
    web3 = new Web3(window.ethereum)

    if (CONTRACT_ADDRESS) {
      contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS)
    }

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      account = accounts[0]
      window.location.reload()
    })

    // Listen for chain changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    return {
      success: true,
      address: account,
    }
  } catch (error) {
    console.error('Wallet connection error:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

export const getAccount = () => account

export const getWeb3 = () => web3

export const getContract = () => contract

export const isWalletConnected = () => {
  return !!account && !!web3
}

export const disconnectWallet = () => {
  account = null
  web3 = null
  contract = null
}

export const switchToMumbaiTestnet = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x13881' }], // Mumbai chainId
    })
  } catch (switchError) {
    // Chain hasn't been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x13881',
              chainName: 'Mumbai Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
              },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
            },
          ],
        })
      } catch (addError) {
        throw new Error('Failed to add Mumbai network')
      }
    } else {
      throw new Error('Failed to switch to Mumbai network')
    }
  }
}

export const getBalance = async (address) => {
  if (!web3) {
    throw new Error('Web3 not initialized')
  }

  const balance = await web3.eth.getBalance(address)
  return web3.utils.fromWei(balance, 'ether')
}

export const sendTransaction = async (to, amount) => {
  if (!web3 || !account) {
    throw new Error('Wallet not connected')
  }

  const amountWei = web3.utils.toWei(amount.toString(), 'ether')

  const tx = await web3.eth.sendTransaction({
    from: account,
    to,
    value: amountWei,
  })

  return tx
}

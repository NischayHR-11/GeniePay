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

export const METAMASK_DOWNLOAD_URL = 'https://metamask.io/download/'

export const connectWallet = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      return {
        success: false,
        error: 'MetaMask is not installed',
        errorCode: 'METAMASK_NOT_INSTALLED',
        downloadUrl: METAMASK_DOWNLOAD_URL
      }
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

export const switchToSepoliaTestnet = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }], // Sepolia chainId (11155111 in hex)
    })
    return { success: true }
  } catch (switchError) {
    // Chain hasn't been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            },
          ],
        })
        return { success: true }
      } catch (addError) {
        return { success: false, error: 'Failed to add Sepolia network' }
      }
    } else if (switchError.code === 4001) {
      return { success: false, error: 'User rejected network switch' }
    } else {
      return { success: false, error: 'Failed to switch to Sepolia network' }
    }
  }
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

export const getCurrentNetwork = async () => {
  if (!window.ethereum) return null
  const chainId = await window.ethereum.request({ method: 'eth_chainId' })
  const networks = {
    '0x1': { name: 'Ethereum Mainnet', symbol: 'ETH', isTestnet: false },
    '0x5': { name: 'Goerli Testnet', symbol: 'ETH', isTestnet: true },
    '0xaa36a7': { name: 'Sepolia Testnet', symbol: 'ETH', isTestnet: true },
    '0x89': { name: 'Polygon Mainnet', symbol: 'MATIC', isTestnet: false },
    '0x13881': { name: 'Mumbai Testnet', symbol: 'MATIC', isTestnet: true },
    '0x38': { name: 'BNB Smart Chain', symbol: 'BNB', isTestnet: false },
    '0xa86a': { name: 'Avalanche C-Chain', symbol: 'AVAX', isTestnet: false },
  }
  return { chainId, ...networks[chainId] } || { chainId, name: `Chain ID: ${parseInt(chainId, 16)}`, symbol: 'ETH', isTestnet: false }
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

  // Validate and checksum the recipient address
  if (!web3.utils.isAddress(to)) {
    throw new Error('Invalid recipient address')
  }
  
  const checksumAddress = web3.utils.toChecksumAddress(to)
  const amountWei = web3.utils.toWei(amount.toString(), 'ether')

  console.log('📤 Sending transaction:', {
    from: account,
    to: checksumAddress,
    value: amountWei,
    amountETH: amount
  })

  const tx = await web3.eth.sendTransaction({
    from: account,
    to: checksumAddress,
    value: amountWei,
  })

  return tx
}

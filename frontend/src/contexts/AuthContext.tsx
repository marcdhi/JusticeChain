import React, { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { useOkto } from 'okto-sdk-react';
import { CONFIG } from '../config';
import JusticeChainABI from '../../../contracts/abi/abi.json';

declare global {
  interface Window {
    ethereum?: any;
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: any) => void }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  walletAddress: string | null;
  balance: string;
  login: () => void;
  logout: () => void;
  sendTransaction: (to: string, amount: string) => Promise<void>;
  createWallet: () => Promise<string | null>;
  getBalance: () => Promise<string>;
  executeContractTransaction: (transaction: any) => Promise<{ hash: string; wait: () => Promise<any> }>;
  authMethod: 'google' | 'email' | null;
  handleEmailAuth: (authToken: string, refreshToken: string) => void;
  contract: ethers.Contract | null;
  walletConnected: boolean;
  connectWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  const okto = useOkto();

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          // Clear any existing Google Sign-In state
          window.google.accounts.id.cancel();
          
          // Initialize with proper configuration
          window.google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: (response: any) => {
              if (response.credential) {
                handleGoogleLogin(response);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });

          // Pre-render the button
          window.google.accounts.id.renderButton(
            document.createElement('div'),
            { theme: 'outline', size: 'large' }
          );
        } catch (error) {
          console.error('Failed to initialize Google Sign-In:', error);
        }
      } else {
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();

    // Cleanup on unmount
    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  const handleGoogleLogin = async (response: any) => {
    try {
      if (!response.credential) {
        console.log('No credential received, switching to email auth');
        setAuthMethod('email');
        return;
      }

      console.log("Google response received:", response.credential);
      setGoogleToken(response.credential);

      // Authenticate with Okto
      const authResponse = await axios.post('https://sandbox-api.okto.tech/api/v2/authenticate', {
        id_token: response.credential
      }, {
        headers: {
          'X-Api-Key': CONFIG.OKTO_APP_SECRET,
          'Content-Type': 'application/json'
        }
      });

      console.log("Okto auth response:", authResponse);

      if (authResponse.data.status === 'success') {
        const { auth_token, refresh_auth_token } = authResponse.data.data;
        
        // Get user info from Okto
        const userResponse = await axios.get('https://sandbox-api.okto.tech/api/v1/user_from_token', {
          headers: {
            'Authorization': `Bearer ${auth_token}`,
            'Content-Type': 'application/json'
          }
        });

        localStorage.setItem('oktoAuthToken', auth_token);
        localStorage.setItem('oktoRefreshToken', refresh_auth_token);
        setIsAuthenticated(true);
        setUser({
          ...response,
          id: userResponse.data.data.user_id
        });
        setAuthMethod('google');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setAuthMethod('email');
    }
  };

  const handleEmailAuth = async (authToken: string, refreshToken: string) => {
    try {
      // Save tokens
      localStorage.setItem('oktoAuthToken', authToken);
      localStorage.setItem('oktoRefreshToken', refreshToken);

      // Get user info using the auth token
      const userResponse = await axios.get('https://sandbox-api.okto.tech/api/v1/user_from_token', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Okto User Info:', userResponse.data);

      // Set authenticated state
      setIsAuthenticated(true);
      setAuthMethod('email');
      
      // Set user data with the correct structure
      setUser({
        email: userResponse.data.data.email,
        id: userResponse.data.data.user_id,
        created_at: userResponse.data.data.created_at
      });

      // Create wallet for the user
      const walletAddress = await createWallet();
      if (walletAddress) {
        await getBalance();
      }
    } catch (error) {
      console.error('Error setting up user after email auth:', error);
      throw error;
    }
  };

  const login = () => {
    console.log('Login attempt started');
    
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          console.log('Google Sign-In notification:', notification);
          
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Switching to email auth');
            setAuthMethod('email');
          }
        });
      } catch (error) {
        console.error('Google Sign-In error:', error);
        setAuthMethod('email');
      }
    } else {
      console.log('Google Sign-In not available, using email auth');
      setAuthMethod('email');
    }
  };

  const logout = async () => {
    try {
      if (okto) {
        await okto.logOut();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('oktoAuthToken');
      localStorage.removeItem('oktoRefreshToken');
      setIsAuthenticated(false);
      setUser(null);
      setWalletAddress(null);
      setBalance('0');
    }
  };

  const executeContractTransaction = async (transaction: any) => {
    try {
      const auth_token = localStorage.getItem('oktoAuthToken');
      if (!auth_token) throw new Error('Not authenticated');

      // Convert the value to a smaller amount that's within limits
      const adjustedValue = (parseFloat(transaction.value) / 100).toString(); // Reduce by 100x

      console.log('Executing contract transaction:', {
        network_name: 'APTOS_TESTNET',
        token_address: '',
        quantity: adjustedValue,
        recipient_address: transaction.to
      });

      const response = await axios.post(
        'https://sandbox-api.okto.tech/api/v1/transfer/tokens/execute',
        {
          network_name: 'APTOS_TESTNET',
          token_address: '', // Empty string for native token
          quantity: adjustedValue,
          recipient_address: transaction.to
        },
        {
          headers: {
            'Authorization': `Bearer ${auth_token}`,
            'Content-Type': 'application/json',
            'X-Api-Key': CONFIG.OKTO_APP_SECRET // Add back the API key
          }
        }
      );

      console.log('Transfer response:', response.data);

      if (response.data.status === 'success') {
        const orderId = response.data.data.orderId;
        return {
          hash: orderId,
          wait: async () => {
            const status = response.data.status;
            return status;
          }
        };
      }

      // If we get here, handle the error response
      if (response.data.error) {
        const error = response.data.error;
        throw new Error(error.details || error.message || 'Transaction failed');
      }

      throw new Error('Contract transaction failed');
    } catch (error: any) {
      // Better error handling
      if (error.response?.data?.error) {
        const apiError = error.response.data.error;
        console.error('API Error:', apiError);
        throw new Error(apiError.details || apiError.message || 'Transaction failed');
      }
      console.error('Contract transaction failed:', error);
      throw error;
    }
  };

  const createWallet = async (): Promise<string | null> => {
    try {
      const auth_token = localStorage.getItem('oktoAuthToken');
      if (!auth_token) throw new Error('Not authenticated');

      const response = await axios.post(
        'https://sandbox-api.okto.tech/api/v1/wallet',
        {},
        {
          headers: {
            'Authorization': `Bearer ${auth_token}`
          }
        }
      );

      if (response.data.status === 'success') {
        const wallet = response.data.data.wallets[0];
        if (wallet && wallet.success) {
          setWalletAddress(wallet.address);
          return wallet.address;
        }
      }

      return null;
    } catch (error) {
      console.error('Error creating wallet:', error);
      return null;
    }
  };

  const getBalance = async (): Promise<string> => {
    try {
      const auth_token = localStorage.getItem('oktoAuthToken');
      if (!auth_token) throw new Error('Not authenticated');

      const response = await axios.get('https://sandbox-api.okto.tech/api/v1/portfolio', {
        headers: {
          Authorization: `Bearer ${auth_token}`
        }
      });

      if (response.data.status === 'success') {
        const portfolio = response.data.data;
        const token = portfolio.tokens.find((t: any) => 
          t.network_name === 'APTOS_TESTNET' && 
          t.token_name === 'APT_TESTNET'
        );
        
        if (token) {
          setBalance(token.quantity);
          return token.quantity;
        }
      }

      return '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  };

  const sendTransaction = async (to: string, amount: string) => {
    try {
      const auth_token = localStorage.getItem('oktoAuthToken');
      if (!auth_token) throw new Error('Not authenticated');

      const response = await axios.post(
        'https://sandbox-api.okto.tech/api/v1/transfer/tokens/execute',
        {
          network_name: CONFIG.NETWORK_NAME,
          token_address: "", // Empty for native token
          quantity: amount,
          recipient_address: to
        },
        {
          headers: {
            'Authorization': `Bearer ${auth_token}`,
            'Content-Type': 'application/json',
            'X-Api-Key': CONFIG.OKTO_APP_SECRET
          }
        }
      );

      if (response.data.status === 'success') {
        await getBalance(); // Refresh balance
        return response.data.data.orderId;
      }
      
      throw new Error('Transaction failed');
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected accounts:', accounts);
      
      // Create Web3 provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get network to ensure we're on Sepolia
      const network = await provider.getNetwork();
      console.log('Connected to network:', network.name);
      
      // Check if we're on Sepolia
      if (network.chainId !== 11155111n) { // Sepolia chainId
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
          });
        } catch (error) {
          console.error('Failed to switch network:', error);
          alert('Please switch to Sepolia network in MetaMask');
          return;
        }
      }

      const signer = await provider.getSigner();
      console.log('Got signer address:', await signer.getAddress());

      // Initialize contract with signer
      const contractInstance = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        JusticeChainABI,
        signer
      );

      // Verify contract connection
      try {
        const caseCount = await contractInstance.cases(0);
        console.log('Successfully connected to contract. First case:', caseCount);
      } catch (error) {
        console.error('Error verifying contract connection:', error);
      }

      console.log('Contract initialized at:', contractInstance.address);
      setContract(contractInstance);
      setWalletConnected(true);

      // Listen for account changes
      window.ethereum.on('accountsChanged', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  // Initialize contract when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      connectWallet().catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      walletAddress,
      balance,
      login,
      logout,
      sendTransaction,
      createWallet,
      getBalance,
      executeContractTransaction,
      authMethod,
      handleEmailAuth,
      contract,
      walletConnected,
      connectWallet
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

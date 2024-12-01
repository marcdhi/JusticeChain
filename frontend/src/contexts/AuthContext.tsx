import React, { createContext, useState, useContext, useEffect } from 'react';
import { Contract, BrowserProvider, ethers } from 'ethers';
import axios from 'axios';
import { CONFIG } from '../config';
import { getContract } from '../utils/ethereum';

declare global {
  interface Window {
    google: any;
    ethereum?: any;
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: () => void;
  logout: () => void;
  contract: Contract | null;
  connectWallet: () => Promise<void>;
  walletConnected: boolean;
  createEmbeddedWallet: () => Promise<string | null>;
  getWalletBalance: () => Promise<string>;
  sendTransaction: (to: string, amount: string) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [embeddedWalletAddress, setEmbeddedWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: handleGoogleLogin,
          });
          console.log('Google Identity Services initialized');
        } catch (error) {
          console.error('Error initializing Google Identity Services:', error);
        }
      }
    };

    const checkGoogleLoaded = setInterval(() => {
      if (window.google) {
        clearInterval(checkGoogleLoaded);
        initializeGoogle();
      }
    }, 100);

    return () => clearInterval(checkGoogleLoaded);
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to use this feature!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(CONFIG.CHAIN_ID)) {
        alert(`Please connect to the ${CONFIG.NETWORK_NAME} network`);
        return;
      }

      const signer = await provider.getSigner();
      const contractInstance = getContract(signer);
      setContract(contractInstance);
      setWalletConnected(true);
      console.log('Wallet connected and contract setup completed');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletConnected(false);
    }
  };

  const handleGoogleLogin = async (response: any) => {
    console.log('Google login response received:', response);
    try {
      if (response.credential) {
        const oktoResponse = await axios.post(
          `${CONFIG.OKTO_ENDPOINT}/v2/authenticate`,
          { 
            id_token: response.credential,
            provider: 'google'
          },
          { 
            headers: { 
              'x-api-key': CONFIG.OKTO_APP_SECRET,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        if (oktoResponse.data?.data?.auth_token) {
          const auth_token = oktoResponse.data.data.auth_token;
          localStorage.setItem('oktoToken', auth_token);
          
          const userResponse = await axios.get(`${CONFIG.OKTO_ENDPOINT}/v1/user_from_token`, {
            headers: { 
              'Authorization': `Bearer ${auth_token}`,
              'x-api-key': CONFIG.OKTO_APP_SECRET,
              'Accept': 'application/json'
            }
          });
          
          if (userResponse.data?.data) {
            console.log('User profile loaded after login');
            setUser(userResponse.data.data);
            setIsAuthenticated(true);
          }
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const login = () => {
    if (window.google) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.error('Login prompt not displayed:', notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.log('Login prompt skipped:', notification.getSkippedReason());
        } else {
          console.log('Login prompt displayed');
        }
      });
    } else {
      console.error('Google Identity Services not loaded');
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('oktoToken');
      if (token) {
        await axios.post(
          `${CONFIG.OKTO_ENDPOINT}/v1/logout`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-api-key': CONFIG.OKTO_APP_SECRET
            }
          }
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('oktoToken');
      setIsAuthenticated(false);
      setUser(null);
      setContract(null);
      setWalletConnected(false);
      setEmbeddedWalletAddress(null);
    }
  };

  const createEmbeddedWallet = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('oktoToken');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.post(
        `${CONFIG.OKTO_ENDPOINT}/v1/wallet/create`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': CONFIG.OKTO_APP_SECRET,
            'Accept': 'application/json'
          }
        }
      );

      if (response.data?.data?.address) {
        setEmbeddedWalletAddress(response.data.data.address);
        console.log('Embedded wallet created:', response.data.data.address);
        return response.data.data.address;
      }
      return null;
    } catch (error) {
      console.error('Error creating embedded wallet:', error);
      return null;
    }
  };

  const getWalletBalance = async (): Promise<string> => {
    try {
      const token = localStorage.getItem('oktoToken');
      if (!token || !embeddedWalletAddress) {
        throw new Error('User not authenticated or embedded wallet not created');
      }

      const response = await axios.get(
        `${CONFIG.OKTO_ENDPOINT}/v1/wallet/${embeddedWalletAddress}/balance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': CONFIG.OKTO_APP_SECRET,
            'Accept': 'application/json'
          }
        }
      );

      if (response.data?.data?.balance) {
        return ethers.formatEther(response.data.data.balance);
      }
      return '0';
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return '0';
    }
  };

  const sendTransaction = async (to: string, amount: string) => {
    try {
      const token = localStorage.getItem('oktoToken');
      if (!token || !embeddedWalletAddress) {
        throw new Error('User not authenticated or embedded wallet not created');
      }

      const response = await axios.post(
        `${CONFIG.OKTO_ENDPOINT}/v1/wallet/${embeddedWalletAddress}/send`,
        {
          to,
          amount: ethers.parseEther(amount).toString(),
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': CONFIG.OKTO_APP_SECRET,
            'Accept': 'application/json'
          }
        }
      );

      console.log('Transaction sent:', response.data);
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    try {
      const token = localStorage.getItem('oktoToken');
      if (!token || !embeddedWalletAddress) {
        throw new Error('User not authenticated or embedded wallet not created');
      }

      const response = await axios.post(
        `${CONFIG.OKTO_ENDPOINT}/v1/wallet/${embeddedWalletAddress}/sign`,
        { message },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': CONFIG.OKTO_APP_SECRET,
            'Accept': 'application/json'
          }
        }
      );

      if (response.data?.data?.signature) {
        return response.data.data.signature;
      }
      throw new Error('Failed to sign message');
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('oktoToken');
      console.log("Checking auth with token:", token ? 'exists' : 'not found');
      
      if (token) {
        try {
          const response = await axios.get(`${CONFIG.OKTO_ENDPOINT}/v1/user_from_token`, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'x-api-key': CONFIG.OKTO_APP_SECRET,
              'Accept': 'application/json'
            }
          });
          
          if (response.data?.data) {
            console.log('User profile loaded:', response.data.data);
            setUser(response.data.data);
            setIsAuthenticated(true);
            
            // Check for existing embedded wallet
            const walletResponse = await axios.get(`${CONFIG.OKTO_ENDPOINT}/v1/wallet`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'x-api-key': CONFIG.OKTO_APP_SECRET,
                'Accept': 'application/json'
              }
            });
            
            if (walletResponse.data?.data?.address) {
              setEmbeddedWalletAddress(walletResponse.data.data.address);
            }

            if (window.ethereum) {
              try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                  await connectWallet();
                }
              } catch (error) {
                console.error('Error checking wallet connection:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          if (axios.isAxiosError(error)) {
            console.error('API Error details:', error.response?.data);
          }
          localStorage.removeItem('oktoToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      contract, 
      connectWallet,
      walletConnected,
      createEmbeddedWallet,
      getWalletBalance,
      sendTransaction,
      signMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
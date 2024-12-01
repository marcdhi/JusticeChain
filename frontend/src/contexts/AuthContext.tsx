import React, { createContext, useState, useContext, useEffect } from 'react';
import { Contract } from 'ethers';
import axios from 'axios';
import { CONFIG } from '../config';
import { getEthereumProvider, getContract } from '../utils/ethereum';
import { GoogleLogin, GoogleLoginResponse, GoogleLoginResponseOffline } from 'react-google-login';

interface AuthContextType {
  user: any;
  login: () => void;
  logout: () => void;
  contract: Contract | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('oktoToken');
      if (token) {
        try {
          const response = await axios.get(`${CONFIG.OKTO_ENDPOINT}/wallet`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          await setupContract();
        } catch (error) {
          console.error('Error checking authentication:', error);
          localStorage.removeItem('oktoToken');
        }
      }
    };
    checkAuth();
  }, []);

  const setupContract = async () => {
    try {
      const provider = getEthereumProvider();
      const signer = await provider.getSigner();
      const contractInstance = getContract(signer);
      setContract(contractInstance);
    } catch (error) {
      console.error('Error setting up contract:', error);
    }
  };

  const handleGoogleLogin = async (response: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ('tokenId' in response) {
      try {
        const oktoResponse = await axios.post(
          `${CONFIG.OKTO_ENDPOINT}/authenticate`,
          { id_token: response.tokenId },
          { headers: { 'x-api-key': CONFIG.OKTO_APP_SECRET } }
        );

        const { auth_token } = oktoResponse.data.data;
        localStorage.setItem('oktoToken', auth_token);
        
        // Fetch user data
        const userResponse = await axios.get(`${CONFIG.OKTO_ENDPOINT}/wallet`, {
          headers: { Authorization: `Bearer ${auth_token}` }
        });
        setUser(userResponse.data);
        await setupContract();
      } catch (error) {
        console.error('Login failed:', error);
        if (axios.isAxiosError(error)) {
          console.error('Error details:', error.response?.data);
        }
      }
    } else {
      console.error('Offline Google login is not supported');
    }
  };

  const login = () => {
    // This function will be called when the login button is clicked
    // The actual login process is handled by the GoogleLogin component
  };

  const logout = () => {
    localStorage.removeItem('oktoToken');
    setUser(null);
    setContract(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, contract }}>
      <GoogleLogin
        clientId={CONFIG.GOOGLE_CLIENT_ID}
        onSuccess={handleGoogleLogin}
        onFailure={(error) => console.error('Google login failed:', error)}
        cookiePolicy={'single_host_origin'}
        render={renderProps => (
          <button onClick={renderProps.onClick} disabled={renderProps.disabled}>
            Login with Google
          </button>
        )}
      />
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

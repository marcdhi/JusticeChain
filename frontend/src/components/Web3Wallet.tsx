
import React, { useState, useEffect } from 'react';
import { useOkto } from 'okto-sdk-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { ChevronUp, ChevronDown, Wallet, RefreshCw } from 'lucide-react';
import { CONFIG } from '../config';

const SUPPORTED_NETWORKS = [
  {
    name: CONFIG.NETWORK_NAME,
    chainId: CONFIG.CHAIN_ID,
    networkUrl: CONFIG.NETWORK_URL,
  },
  {
    name: CONFIG.BASE.NETWORK_NAME,
    chainId: CONFIG.BASE.CHAIN_ID,
    networkUrl: CONFIG.BASE.NETWORK_URL,
  },
  {
    name: CONFIG.APTOS_TESTNET.NETWORK_NAME,
    chainId: CONFIG.APTOS_TESTNET.CHAIN_ID,
    networkUrl: CONFIG.APTOS_TESTNET.NETWORK_URL,
  }
];

export const Web3Wallet: React.FC = () => {
  const { isAuthenticated, walletAddress, balance, createWallet, getBalance } = useAuth();
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[2]); // Default to APTOS_TESTNET
  const [isMinimized, setIsMinimized] = useState(true);
  const [loading, setLoading] = useState(false);
  const okto = useOkto();

  // Initialize wallet on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && !walletAddress) {
      createWallet();
    }
  }, [isAuthenticated]);

  // Refresh balance periodically
  useEffect(() => {
    if (walletAddress) {
      const interval = setInterval(() => {
        getBalance();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  const handleNetworkChange = async (network: typeof SUPPORTED_NETWORKS[0]) => {
    try {
      setLoading(true);
      setSelectedNetwork(network);
      
      // Create wallet for the new network if needed
      await createWallet();
      await getBalance();
    } catch (error) {
      console.error('Error switching network:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await getBalance();
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      {/* Minimized View */}
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 h-9 px-3"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden md:inline text-sm">
          {parseFloat(balance).toFixed(4)} APT
        </span>
        {isMinimized ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </Button>

      {/* Expanded View */}
      {!isMinimized && (
        <Card className="absolute right-0 top-12 w-80 shadow-lg z-50 bg-white">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Web3 Wallet</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsMinimized(true)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Network Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Network</label>
              <div className="flex gap-2">
                {SUPPORTED_NETWORKS.map((network) => (
                  <Button
                    key={network.chainId}
                    variant={network.name === selectedNetwork.name ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={() => handleNetworkChange(network)}
                    disabled={loading}
                  >
                    {network.name.split('_')[0]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Wallet Address */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Address</label>
              <div className="text-xs break-all bg-gray-50 p-2 rounded">
                {walletAddress || 'Not connected'}
              </div>
            </div>

            {/* Balance */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Balance</label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleRefreshBalance}
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="text-lg font-medium">
                {parseFloat(balance).toFixed(4)} APT
              </div>
            </div>

            {/* Network Info */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              <p>Chain ID: {selectedNetwork.chainId}</p>
              <p>Network: {selectedNetwork.name}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";
import { ethers } from 'ethers';

export const OktoDashboard: React.FC = () => {
  const { createEmbeddedWallet, getWalletBalance, sendTransaction, signMessage } = useAuth();
  const [balance, setBalance] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletInfo = async () => {
      try {
        const address = await createEmbeddedWallet();
        setWalletAddress(address);
        const walletBalance = await getWalletBalance();
        setBalance(walletBalance);
        setNotification("Okto wallet created successfully!");
      } catch (error) {
        console.error('Error fetching wallet info:', error);
        setNotification("Error creating Okto wallet. Please try again.");
      }
    };
    fetchWalletInfo();
  }, [createEmbeddedWallet, getWalletBalance]);

  const handleSendTransaction = async () => {
    if (recipient && amount) {
      try {
        await sendTransaction(recipient, amount);
        const walletBalance = await getWalletBalance();
        setBalance(walletBalance);
        setRecipient('');
        setAmount('');
        setNotification("Transaction sent successfully via Okto wallet!");
      } catch (error) {
        console.error('Error sending transaction:', error);
        setNotification("Error sending transaction. Please try again.");
      }
    }
  };

  const handleSignMessage = async () => {
    if (message) {
      try {
        const sig = await signMessage(message);
        setSignature(sig);
        setNotification("Message signed successfully!");
      } catch (error) {
        console.error('Error signing message:', error);
        setNotification("Error signing message. Please try again.");
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Okto Embedded Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notification && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{notification}</p>
          </div>
        )}
        {walletAddress && (
          <div>
            <p className="font-semibold">Wallet Address:</p>
            <p className="text-sm break-all">{walletAddress}</p>
          </div>
        )}
        {balance !== null && (
          <div>
            <p className="font-semibold">Balance:</p>
            <p>{ethers.formatEther(balance)} ETH</p>
          </div>
        )}
        <div className="space-y-2">
          <Input
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <Input
            placeholder="Amount (ETH)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={handleSendTransaction} className="w-full">Send Transaction</Button>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Message to sign"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleSignMessage} className="w-full">Sign Message</Button>
        </div>
        {signature && (
          <div>
            <p className="font-semibold">Signature:</p>
            <p className="text-sm break-all">{signature}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";

export const OktoWallet: React.FC = () => {
  const { createEmbeddedWallet, getWalletBalance, sendTransaction, signMessage } = useAuth();
  const [balance, setBalance] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const walletBalance = await getWalletBalance();
      setBalance(walletBalance);
    };
    fetchBalance();
  }, [getWalletBalance]);

  const handleCreateWallet = async () => {
    await createEmbeddedWallet();
    const walletBalance = await getWalletBalance();
    setBalance(walletBalance);
  };

  const handleSendTransaction = async () => {
    if (recipient && amount) {
      await sendTransaction(recipient, amount);
      const walletBalance = await getWalletBalance();
      setBalance(walletBalance);
      setRecipient('');
      setAmount('');
    }
  };

  const handleSignMessage = async () => {
    if (message) {
      const sig = await signMessage(message);
      setSignature(sig);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Okto Embedded Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Button onClick={handleCreateWallet}>Create/Load Wallet</Button>
        </div>
        {balance !== null && (
          <div>
            <p>Balance: {balance} ETH</p>
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
          <Button onClick={handleSendTransaction}>Send Transaction</Button>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Message to sign"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleSignMessage}>Sign Message</Button>
        </div>
        {signature && (
          <div>
            <p>Signature: {signature}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


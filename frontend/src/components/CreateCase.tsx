import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { ethers } from 'ethers'
import axios from 'axios'
import { CONFIG } from '../config'

export const CreateCase = () => {
  const { contract, walletConnected, connectWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [caseData, setCaseData] = useState({
    name: '',
    title: '',
    description: '',
    defendant: '',
    plaintiffLawyerType: '0',
    defendantLawyerType: '0',
    escrowAmount: '',
    document: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCaseData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setCaseData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCaseData(prev => ({ ...prev, document: e.target.files![0] }));
    }
  };

  const uploadToPinata = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadStatus('Uploading to IPFS...');
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': CONFIG.PINATA_API_KEY,
          'pinata_secret_api_key': CONFIG.PINATA_API_SECRET,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      setUploadStatus('File uploaded successfully!');
      return `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      setUploadStatus('Error uploading file. Please try again.');
      throw new Error('Failed to upload file to IPFS');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) {
      console.error('Contract is not initialized');
      return;
    }
    setLoading(true);
    try {
      let ipfsLink = '';
      if (caseData.document) {
        ipfsLink = await uploadToPinata(caseData.document);
      }

      // Request account access if needed
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const tx = await contract.createCase(
        caseData.name,
        caseData.title,
        caseData.description,
        ipfsLink,
        caseData.defendant || ethers.ZeroAddress,
        parseInt(caseData.plaintiffLawyerType),
        parseInt(caseData.defendantLawyerType),
        { 
          value: ethers.parseEther(caseData.escrowAmount),
          gasLimit: 500000 // Add explicit gas limit
        }
      );

      setUploadStatus('Transaction sent, waiting for confirmation...');
      console.log('Transaction sent:', tx.hash);
      
      await tx.wait();
      console.log('Case created successfully');
      setUploadStatus('Case created successfully!');

      // Reset form
      setCaseData({
        name: '',
        title: '',
        description: '',
        defendant: '',
        plaintiffLawyerType: '0',
        defendantLawyerType: '0',
        escrowAmount: '',
        document: null,
      });
    } catch (error) {
      console.error('Error creating case:', error);
      setUploadStatus(error instanceof Error ? error.message : 'Error creating case');
    } finally {
      setLoading(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>You need to connect your wallet to create a case.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={connectWallet}>Connect Wallet</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Case</CardTitle>
          <CardDescription>Fill in the details to create a new legal case.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div>
                <Input id="name" name="name" placeholder="Case Name" value={caseData.name} onChange={handleInputChange} required />
              </div>
              <div>
                <Input id="title" name="title" placeholder="Title" value={caseData.title} onChange={handleInputChange} required />
              </div>
              <div>
                <Input id="description" name="description" placeholder="Description" value={caseData.description} onChange={handleInputChange} required />
              </div>
              <div>
                <Input id="defendant" name="defendant" placeholder="Defendant Address (optional)" value={caseData.defendant} onChange={handleInputChange} />
              </div>
              <div>
                <Select value={caseData.plaintiffLawyerType} onValueChange={handleSelectChange('plaintiffLawyerType')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Plaintiff Lawyer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Human</SelectItem>
                    <SelectItem value="1">AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={caseData.defendantLawyerType} onValueChange={handleSelectChange('defendantLawyerType')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Defendant Lawyer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Human</SelectItem>
                    <SelectItem value="1">AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input id="escrowAmount" name="escrowAmount" type="number" step="0.01" placeholder="Escrow Amount (ETH)" value={caseData.escrowAmount} onChange={handleInputChange} required />
              </div>
              <div>
                <Input id="document" name="document" type="file" onChange={handleFileChange} />
              </div>
              {uploadStatus && (
                <div className="text-sm text-muted-foreground">
                  {uploadStatus}
                </div>
              )}
            </div>
            <Button type="submit" className="mt-6" disabled={loading}>
              {loading ? 'Creating Case...' : 'Create Case'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

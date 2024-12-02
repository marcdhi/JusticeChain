import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import fs from 'fs'
import path from 'path'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { showToast } from './ui/toast'
import { ethers } from 'ethers'

export interface CreateCaseProps {
  mode: 'human-human' | 'human-ai'; 
}

type Stage = 'create' | 'evidence' | 'review';

export const CreateCase: React.FC<CreateCaseProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { user, contract, walletConnected, connectWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('create');
  const [createdCase, setCreatedCase] = useState<any>(null);
  const [caseData, setCaseData] = useState({
    title: '',
    description: '',
  });
  const [ipfsHash, setIpfsHash] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCaseData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileRead = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // truncate to 100 characters
        const truncatedText = text.substring(0, 400);
        // Overwrite state
        setCaseData(prev => ({
          ...prev,
          description: truncatedText
        }));
      };
      reader.readAsText(file);
    }
  };

  const uploadToChain = async (caseDetails: any) => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      showToast({
        title: "Preparing Upload",
        description: "Getting ready to upload case details to blockchain",
      });

      const transaction = await contract.createCase(
        user?.id || '', // name
        caseDetails.title,
        caseDetails.description,
        ipfsHash, // IPFS hash
        ethers.ZeroAddress, // defendant
        mode === 'human-human' ? 0 : 1, // plaintiffLawyerType
        mode === 'human-human' ? 0 : 1, // defendantLawyerType
        {
          value: ethers.parseEther('0.01'), // Escrow amount
          gasLimit: 500000 // Gas limit for Sepolia
        }
      );

      showToast({
        title: "Transaction Sent",
        description: `Transaction hash: ${transaction.hash}`,
        variant: "success"
      });

      const receipt = await transaction.wait();

      showToast({
        title: "Transaction Confirmed",
        description: "Your case has been successfully uploaded to the blockchain",
        variant: "success"
      });

      return receipt;
    } catch (error) {
      showToast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload to blockchain",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!walletConnected) {
        showToast({
          title: "Connecting Wallet",
          description: "Please approve the connection request",
        });
        await connectWallet();
      }

      if (!contract) {
        throw new Error('Please connect your wallet first');
      }

      showToast({
        title: "Uploading to IPFS",
        description: "Preparing your case data...",
      });

      const ipfsResult = await uploadToIPFS({
        title: caseData.title,
        description: caseData.description,
        mode: mode,
        timestamp: Date.now()
      });
      setIpfsHash(ipfsResult.hash);

      showToast({
        title: "IPFS Upload Complete",
        description: `IPFS Hash: ${ipfsResult.hash}`,
        variant: "success"
      });

      showToast({
        title: "Uploading to Blockchain",
        description: "Please confirm the transaction in your wallet",
      });

      const receipt = await uploadToChain({
        title: caseData.title,
        description: caseData.description
      });

      const newCase = await api.createCase({
        title: caseData.title,
        description: caseData.description,
        files: [], 
        lawyer1_type: 'Human' as const,
        lawyer1_address: user?.id || '',
        case_status: 'Open' as const,
        mode: mode,
        transaction_hash: receipt.hash,
        ipfs_hash: ipfsResult.hash
      } as any);

      setCreatedCase(newCase);
      setStage('evidence');

      showToast({
        title: "Case Created Successfully",
        description: "You can now proceed to add evidence",
        variant: "success"
      });


    } catch (error) {
      showToast({
        title: "Error Creating Case",
        description: error instanceof Error ? error.message : "Failed to create case",
        variant: "destructive"
      });
      console.error('Error creating case:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTimeline = () => (
    <div className="mb-8 flex justify-between items-center">
      <div className={`flex flex-col items-center ${stage === 'create' ? 'text-blue-600' : 'text-gray-600'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stage === 'create' ? 'bg-blue-100' : 'bg-gray-100'}`}>1</div>
        <span className="text-sm mt-1">Create Case</span>
      </div>
      <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
      <div className={`flex flex-col items-center ${stage === 'evidence' ? 'text-blue-600' : 'text-gray-600'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stage === 'evidence' ? 'bg-blue-100' : 'bg-gray-100'}`}>2</div>
        <span className="text-sm mt-1">Add Evidence</span>
      </div>
      <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
      <div className={`flex flex-col items-center ${stage === 'review' ? 'text-blue-600' : 'text-gray-600'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stage === 'review' ? 'bg-blue-100' : 'bg-gray-100'}`}>3</div>
        <span className="text-sm mt-1">Review & Submit</span>
      </div>
    </div>
  );

  const renderEvidenceStage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Add Evidence</CardTitle>
        <CardDescription>
          Choose which type of evidence to add to your case
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'human-human' ? (
          <>
            <Button 
              onClick={() => navigate(`/human-human/case/${createdCase.case_id}/evidence`)}
              className="w-full"
            >
              Upload Lawyer 1 Evidence
            </Button>
            <Button 
              onClick={() => navigate(`/human-human/case/${createdCase.case_id}/evidence2`)}
              className="w-full"
              variant="outline"
            >
              Upload Lawyer 2 Evidence
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={() => navigate(`/human-ai/case/${createdCase.case_id}/evidence`)}
              className="w-full"
            >
              Upload Human Evidence
            </Button>
            <Button 
              onClick={() => navigate(`/human-ai/case/${createdCase.case_id}/ai-evidence`)}
              className="w-full"
              variant="outline"
            >
              Upload AI Evidence
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={() => setStage('create')}
          variant="ghost"
        >
          Back
        </Button>
        <Button 
          onClick={() => setStage('review')}
        >
          Continue to Review
        </Button>
      </CardFooter>
    </Card>
  );

  const renderCreateStage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Case</CardTitle>
        <CardDescription>
          {mode === 'human-human' 
            ? 'Create a new case between two human lawyers' 
            : 'Create a new case with AI assistance'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input 
              id="title" 
              name="title" 
              placeholder="Case Title" 
              value={caseData.title} 
              onChange={handleInputChange} 
              required 
            />
          </div>
          <div className="mt-4">
    <label 
      htmlFor="file-upload" 
      className="block text-sm font-medium text-gray-700 mb-2"
    >
      Upload Description File
    </label>
    <input
      id="file-upload"
      type="file"
      accept=".txt"
      onChange={handleFileRead}
      className="block w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100
        cursor-pointer border rounded-lg
        p-2"
    />
  </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Case...' : 'Create Case'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderReviewStage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review & Submit Case</CardTitle>
        <CardDescription>
          Review your case details before final submission to IPFS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">Case Title</h3>
          <p className="text-gray-600">{createdCase.title}</p>
        </div>
        <div>
          <h3 className="font-medium">Description</h3>
          <p className="text-gray-600">{createdCase.description}</p>
        </div>
        {/* Add evidence review here */}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={() => setStage('evidence')}
          variant="ghost"
        >
          Back
        </Button>
        <Button 
          onClick={() => {
            showToast({
              title: "Submitting to IPFS",
              description: "Your case is being submitted to IPFS...",
            });
          }}
        >
          Submit to IPFS
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="max-w-2xl mx-auto mt-10">
      {renderTimeline()}
      {stage === 'create' && renderCreateStage()}
      {stage === 'evidence' && renderEvidenceStage()}
      {stage === 'review' && renderReviewStage()}
    </div>
  );
};
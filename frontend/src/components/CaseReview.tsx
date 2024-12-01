import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { api } from '../services/api';
import axios from 'axios';
import { CONFIG } from '../config';
import { useAuth } from '../contexts/AuthContext';
import { ethers } from 'ethers';
import { Input } from './ui/input';

export interface CaseReviewProps {
  mode: 'human-human' | 'human-ai';
}

export const CaseReview: React.FC<CaseReviewProps> = ({ mode }) => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { contract, user, login, connectWallet } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrowAmount, setEscrowAmount] = useState('0.01');

  useEffect(() => {
    const fetchCase = async () => {
      if (caseId) {
        const data = await api.getCase(caseId);
        setCaseData(data);
      }
    };
    fetchCase();
  }, [caseId]);

  const uploadToPinata = async (jsonData: any) => {
    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        jsonData,
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': CONFIG.PINATA_API_KEY,
            'pinata_secret_api_key': CONFIG.PINATA_API_SECRET,
          },
        }
      );
      return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading to Pinata:', error);
      throw new Error('Failed to upload to IPFS');
    }
  };

  const handleEscrowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEscrowAmount(e.target.value);
  };

  const handlePublishToIPFS = async () => {
    if (!contract) {
      console.error('Contract is not initialized');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Validate escrow amount
      if (!escrowAmount || parseFloat(escrowAmount) <= 0) {
        throw new Error('Please enter a valid escrow amount');
      }

      // Check if user is logged in and wallet is connected
      if (!user) {
        await login();
      }
      if (!contract) {
        await connectWallet();
      }

      console.log("Starting IPFS upload process...");

      // Prepare case data for IPFS
      const ipfsData = {
        title: caseData.title,
        description: caseData.description,
        case_id: caseData.case_id,
        created_at: caseData.created_at,
        updated_at: caseData.updated_at,
        case_status: caseData.case_status,
        lawyer1: {
          type: caseData.lawyer1_type,
          address: caseData.lawyer1_address,
          evidences: caseData.lawyer1_evidences
        },
        lawyer2: {
          type: mode === 'human-ai' ? 'AI' : 'Human',
          address: caseData.lawyer2_address,
          evidences: caseData.lawyer2_evidences
        }
      };

      console.log("Prepared IPFS data:", ipfsData);

      // Upload to IPFS
      const ipfsHash = await uploadToPinata(ipfsData);
      console.log('Case data uploaded to IPFS:', ipfsHash);

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Prepare lawyer2 address - use ZeroAddress for AI or if no address
      const lawyer2Address = mode === 'human-ai' || !caseData.lawyer2_address 
        ? ethers.ZeroAddress 
        : caseData.lawyer2_address;

      console.log("Creating case on blockchain with params:", {
        name: caseData.title,
        title: caseData.title,
        description: caseData.description,
        context: ipfsHash,
        defendant: lawyer2Address,
        plaintiffLawyerType: mode === 'human-ai' ? 1 : 0,
        defendantLawyerType: mode === 'human-ai' ? 1 : 0,
        escrowAmount: ethers.parseEther(escrowAmount)
      });

      const tx = await contract.createCase(
        caseData.title,
        caseData.title,
        caseData.description,
        ipfsHash,
        lawyer2Address,
        mode === 'human-ai' ? 1 : 0,
        mode === 'human-ai' ? 1 : 0,
        { 
          value: ethers.parseEther(escrowAmount),
          gasLimit: 1000000
        }
      );

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      if (receipt.status === 0) {
        throw new Error('Transaction failed');
      }

      // Update case status in backend
      try {
        await api.updateCaseStatus(caseId!, 'Published');
        console.log("Case status updated in backend");
      } catch (error) {
        console.error('Error updating case status in backend:', error);
        // Don't throw here since blockchain transaction succeeded
        setError('Case published on blockchain but failed to update status in backend. Please contact support.');
      }

      // Navigate to cases list
      navigate('/cases');

    } catch (error) {
      console.error('Error in publish process:', error);
      if (error instanceof Error) {
        if (error.message.includes('execution reverted')) {
          setError('Transaction failed: Contract execution reverted. Please check your inputs and try again.');
        } else if (error.message.includes('insufficient funds')) {
          setError('Insufficient funds in your wallet to cover the escrow amount');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred while publishing the case');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderEvidenceSection = () => {
    if (mode === 'human-ai') {
      return (
        <>
          <div>
            <h3 className="font-medium mb-2">Human Evidence</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {caseData.lawyer1_evidences?.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {caseData.lawyer1_evidences.map((evidence: any, index: number) => (
                    <li key={index}>
                      {evidence.description} ({evidence.original_name})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No human evidence submitted yet</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">AI Evidence</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {caseData.lawyer2_evidences?.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {caseData.lawyer2_evidences.map((evidence: any, index: number) => (
                    <li key={index}>
                      {evidence.description} ({evidence.original_name})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No AI evidence submitted yet</p>
              )}
            </div>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div>
            <h3 className="font-medium mb-2">Lawyer 1 Evidence</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {caseData.lawyer1_evidences?.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {caseData.lawyer1_evidences.map((evidence: any, index: number) => (
                    <li key={index}>
                      {evidence.description} ({evidence.original_name})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No evidence submitted yet</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Lawyer 2 Evidence</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {caseData.lawyer2_evidences?.length > 0 ? (
                <ul className="list-disc list-inside space-y-2">
                  {caseData.lawyer2_evidences.map((evidence: any, index: number) => (
                    <li key={index}>
                      {evidence.description} ({evidence.original_name})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No evidence submitted yet</p>
              )}
            </div>
          </div>
        </>
      );
    }
  };

  if (!caseData) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Case Review</CardTitle>
          <CardDescription>
            Review your case details and evidence before publishing the case
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Case Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Title:</span> {caseData.title}</p>
              <p><span className="font-medium">Description:</span> {caseData.description}</p>
              <p><span className="font-medium">Status:</span> {caseData.case_status}</p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escrow Amount (ETH)
                </label>
                <Input
                  type="number"
                  step="0.005"
                  value={escrowAmount}
                  onChange={handleEscrowChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter escrow amount in ETH"
                />
              </div>
            </div>
          </div>

          {renderEvidenceSection()}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between w-full">
            <div className="space-x-2">
              {mode === 'human-human' ? (
                <>
                  <Button 
                    onClick={() => navigate(`/human-human/case/${caseId}/evidence`)}
                    variant="outline"
                  >
                    Add Lawyer 1 Evidence
                  </Button>
                  <Button 
                    onClick={() => navigate(`/human-human/case/${caseId}/evidence2`)}
                    variant="outline"
                  >
                    Add Lawyer 2 Evidence
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate(`/human-ai/case/${caseId}/evidence`)}
                    variant="outline"
                  >
                    Add Human Evidence
                  </Button>
                  <Button 
                    onClick={() => navigate(`/human-ai/case/${caseId}/ai-evidence`)}
                    variant="outline"
                  >
                    Add AI Evidence
                  </Button>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {!user && (
                <Button 
                  onClick={login}
                  variant="outline"
                  size="sm"
                >
                  Login First
                </Button>
              )}
              {user && !contract && (
                <Button 
                  onClick={connectWallet}
                  variant="outline"
                  size="sm"
                >
                  Connect Wallet
                </Button>
              )}
              <Button 
                onClick={handlePublishToIPFS}
                disabled={loading || !caseData?.lawyer1_evidences?.length || !user || !contract}
              >
                {loading ? 'Publishing...' : 'Publish to IPFS'}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 w-full text-center">{error}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}; 
import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { api } from '../services/api'
import { useNavigate } from 'react-router-dom'

export interface CreateCaseProps {
  mode: 'human-human' | 'human-ai';
}

type Stage = 'create' | 'evidence' | 'review';

export const CreateCase: React.FC<CreateCaseProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('create');
  const [createdCase, setCreatedCase] = useState<any>(null);
  const [caseData, setCaseData] = useState({
    title: '',
    description: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCaseData(prev => ({ ...prev, [name]: value }));import React, { useState } from 'react'
    import { useAuth } from '../contexts/AuthContext'
    import { Input } from "./ui/input"
    import { Button } from "./ui/button"
    import { Textarea } from "./ui/textarea"
    import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
    import { api } from '../services/api'
    import { useNavigate } from 'react-router-dom'
    
    export interface CreateCaseProps {
      mode: 'human-human' | 'human-ai';
    }
    
    type Stage = 'create' | 'evidence' | 'review';
    
    export const CreateCase: React.FC<CreateCaseProps> = ({ mode }) => {
      const navigate = useNavigate();
      const { user } = useAuth();
      const [loading, setLoading] = useState(false);
      const [stage, setStage] = useState<Stage>('create');
      const [createdCase, setCreatedCase] = useState<any>(null);
      const [caseData, setCaseData] = useState({
        title: '',
        description: '',
      });
    
      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCaseData(prev => ({ ...prev, [name]: value }));
      };
    
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
          const caseCreateData = {
            title: caseData.title,
            description: caseData.description,
            files: [], 
            lawyer1_type: 'Human' as const,
            lawyer1_address: user?.walletAddress || '',
            case_status: 'Open' as const,
            mode: mode
          };
    
          const newCase = await api.createCase(caseCreateData);
          setCreatedCase(newCase);
          setStage('evidence');
        } catch (error) {
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
                            gasLimit: 1000000 // Increased gas limit
                          }
                        );
                  
                        setUploadStatus('Transaction sent, waiting for confirmation...');
                        console.log('Transaction sent:', tx.hash);
                        
                        const receipt = await tx.wait();
                        console.log('Transaction receipt:', receipt);
                        
                        if (receipt.status === 0) {
                          throw new Error('Transaction failed');
                        }
                        
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
                        if (error instanceof Error) {
                          if (error.message.includes('execution reverted')) {
                            setUploadStatus('Transaction failed: Contract execution reverted. Please check your inputs and try again.');
                          } else {
                            setUploadStatus(`Error creating case: ${error.message}`);
                          }
                        } else {
                          setUploadStatus('An unknown error occurred');
                        }
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
                                      
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const caseCreateData = {
        title: caseData.title,
        description: caseData.description,
        files: [], 
        lawyer1_type: 'Human' as const,
        lawyer1_address: user?.walletAddress || '',
        case_status: 'Open' as const,
        mode: mode
      };

      const newCase = await api.createCase(caseCreateData);
      setCreatedCase(newCase);
      setStage('evidence');
    } catch (error) {
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
                        gasLimit: 1000000 // Increased gas limit
                      }
                    );
              
                    setUploadStatus('Transaction sent, waiting for confirmation...');
                    console.log('Transaction sent:', tx.hash);
                    
                    const receipt = await tx.wait();
                    console.log('Transaction receipt:', receipt);
                    
                    if (receipt.status === 0) {
                      throw new Error('Transaction failed');
                    }
                    
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
                    if (error instanceof Error) {
                      if (error.message.includes('execution reverted')) {
                        setUploadStatus('Transaction failed: Contract execution reverted. Please check your inputs and try again.');
                      } else {
                        setUploadStatus(`Error creating case: ${error.message}`);
                      }
                    } else {
                      setUploadStatus('An unknown error occurred');
                    }
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
              CardHeader>
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
            // Handle final IPFS submission here
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

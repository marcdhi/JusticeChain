import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { api } from '../services/api';
import axios from 'axios';
import { CONFIG } from '../config';

interface Evidence {
  file: File;
  description: string;
}

export interface EvidenceSubmissionProps {
  mode: 'human-human' | 'human-ai';
  role: 'lawyer1' | 'lawyer2' | 'ai';
}

export const EvidenceSubmission: React.FC<EvidenceSubmissionProps> = ({ mode, role }) => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [caseData, setCaseData] = useState<any>(null);

  useEffect(() => {
    const fetchCase = async () => {
      if (caseId) {
        const data = await api.getCase(caseId);
        setCaseData(data);
      }
    };
    fetchCase();
  }, [caseId]);

  const readTxtFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleAddEvidence = () => {
    setEvidences([...evidences, { file: null as unknown as File, description: '' }]);
  };

  const handleFileChange = (index: number, file: File) => {
    const newEvidences = [...evidences];
    newEvidences[index].file = file;
    setEvidences(newEvidences);
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const newEvidences = [...evidences];
    newEvidences[index].description = description;
    setEvidences(newEvidences);
  };

  const uploadToPinata = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': CONFIG.PINATA_API_KEY,
        'pinata_secret_api_key': CONFIG.PINATA_API_SECRET,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return `https://ipfs.io/ipfs/${res.data.IpfsHash}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload all files to IPFS first
      const evidencePromises = evidences.map(async (evidence) => {
        const ipfsHash = await uploadToPinata(evidence.file);
        if(evidence.file.name.split('.')[1] === 'txt'){
          const description = await readTxtFile(evidence.file);
          const truncatedDescriptionAndTruncatedEvidence = description.substring(0, 100) + evidence.description;
          return{
            ipfs_hash: ipfsHash,
            description: truncatedDescriptionAndTruncatedEvidence,
            original_name: evidence.file.name
          }
        }else{

          return {
            ipfs_hash: ipfsHash,
            description: evidence.description,
            original_name: evidence.file.name
          };
        }
      });

      const uploadedEvidences = await Promise.all(evidencePromises);

      // Submit to backend with correct role information
      await api.submitEvidence(caseId!, {
        lawyer_type: role === 'ai' ? 'AI' : 'Human',
        lawyer_address: role === 'ai' ? undefined : user?.walletAddress,
        evidences: uploadedEvidences,
        is_ai_evidence: role === 'ai',
      });

      // Clear form
      setEvidences([]);

      // Show success message or handle next steps
      if (mode === 'human-ai') {
        // For human-ai mode, show options to add more evidence
        const shouldAddMore = window.confirm('Evidence added successfully! Would you like to add more evidence?');
        if (!shouldAddMore) {
          navigate(`/${mode}/case/${caseId}/review`);
        }
      } else {
        // For human-human mode, go back to case review
        navigate(`/${mode}/case/${caseId}/review`);
      }

    } catch (error) {
      console.error('Error submitting evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!caseData) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-bold">Case: {caseData.title}</h2>
        <p className="text-gray-600">{caseData.description}</p>
      </div>

      {mode === 'human-ai' && (
        <div className="mb-6 flex gap-4">
          <Button
            variant={role === 'lawyer1' ? 'default' : 'outline'}
            onClick={() => navigate(`/human-ai/case/${caseId}/evidence`)}
          >
            Human Evidence
          </Button>
          <Button
            variant={role === 'ai' ? 'default' : 'outline'}
            onClick={() => navigate(`/human-ai/case/${caseId}/ai-evidence`)}
          >
            AI Evidence
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Submit Evidence - {role === 'ai' ? 'AI Analysis' : `Lawyer ${role === 'lawyer1' ? '1' : '2'}`}</CardTitle>
          <CardDescription>
            Add evidence for {role === 'ai' ? 'AI analysis' : 'your case'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {evidences.map((evidence, index) => (
              <div key={index} className="space-y-2">
                <Input
                  type="file"
                  onChange={(e) => e.target.files && handleFileChange(index, e.target.files[0])}
                  required
                />
                <Textarea
                  placeholder="Evidence description"
                  value={evidence.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
            <Button type="button" onClick={handleAddEvidence} variant="outline">
              Add Evidence
            </Button>
            <Button type="submit" className="w-full" disabled={loading || evidences.length === 0}>
              {loading ? 'Submitting...' : 'Submit Evidence'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            onClick={() => navigate(`/${mode}/case/${caseId}/review`)}
            variant="ghost"
          >
            Back to Case Review
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}; 
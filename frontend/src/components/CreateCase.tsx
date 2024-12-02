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
        lawyer1_address: user?.user_id || '',
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
          <div>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Case Description" 
              value={caseData.description} 
              onChange={handleInputChange} 
              required 
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
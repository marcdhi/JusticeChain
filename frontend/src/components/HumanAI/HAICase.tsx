import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { api } from '../../services/api';
import { HAIChatInterface } from './HAIChatInterface';
import { useAuth } from '../../contexts/AuthContext';

export const HAICase = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCase = async () => {
      try {
        if (!caseId) {
          throw new Error('Case ID not found');
        }
        const data = await api.getCase(caseId);
        setCaseData(data);
      } catch (error) {
        console.error('Error fetching case:', error);
        setError('Failed to load case details');
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  if (loading) {
    return <div>Loading case...</div>;
  }

  if (error || !caseData) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-red-500">{error || 'Case not found'}</p>
            <Button 
              onClick={() => navigate(-1)} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only allow access if user is lawyer1
  if (user?.user_id !== caseData.lawyer1_address) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-red-500">You are not authorized to view this case</p>
            <Button 
              onClick={() => navigate(-1)} 
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{caseData.title}</CardTitle>
              <CardDescription>Case ID: {caseData.case_id}</CardDescription>
            </div>
            <Badge>{caseData.case_status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-gray-600">{caseData.description}</p>
            </div>
            
            <div>
              <h3 className="font-medium">Evidence</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {caseData.lawyer1_evidences?.map((evidence: any, index: number) => (
                  <div key={index} className="mb-2">
                    <p><span className="font-medium">Description:</span> {evidence.description}</p>
                    <p><span className="font-medium">File:</span> {evidence.original_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Courtroom</CardTitle>
          <CardDescription>
            Present your case against the AI lawyer. The judge will evaluate both arguments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HAIChatInterface caseId={caseId!} />
        </CardContent>
      </Card>
    </div>
  );
}; 
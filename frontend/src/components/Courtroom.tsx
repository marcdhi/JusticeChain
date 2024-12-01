import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { api } from '../services/api';

// Helper function to parse the backend date format
const parseBackendDate = (dateStr: string) => {
  if (!dateStr) return null;
  // Convert from "DD-MM-YYYY HH:MM:SS" to "YYYY-MM-DD HH:MM:SS"
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('-');
  return new Date(`${year}-${month}-${day} ${timePart}`);
};

// Helper function to format date for display
const formatDate = (dateStr: string) => {
  const date = parseBackendDate(dateStr);
  if (!date) return 'Not available';
  return date.toLocaleString();
};

export const Courtroom = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return <div>Loading courtroom...</div>;
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
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-600">{caseData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Lawyer 1</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><span className="font-medium">Type:</span> {caseData.lawyer1_type}</p>
                <p><span className="font-medium">Address:</span> {caseData.lawyer1_address}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Lawyer 2</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><span className="font-medium">Type:</span> {caseData.lawyer2_type || 'Not assigned'}</p>
                <p><span className="font-medium">Address:</span> {caseData.lawyer2_address || 'Not assigned'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Evidence</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Lawyer 1 Evidence</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {caseData.lawyer1_evidences?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {caseData.lawyer1_evidences.map((evidence: any, index: number) => (
                        <li key={index} className="text-sm">
                          {evidence.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No evidence submitted</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Lawyer 2 Evidence</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {caseData.lawyer2_evidences?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {caseData.lawyer2_evidences.map((evidence: any, index: number) => (
                        <li key={index} className="text-sm">
                          {evidence.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No evidence submitted</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Timeline</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><span className="font-medium">Created:</span> {formatDate(caseData.created_at)}</p>
              <p><span className="font-medium">Last Updated:</span> {formatDate(caseData.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
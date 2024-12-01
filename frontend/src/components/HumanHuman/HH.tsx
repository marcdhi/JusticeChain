import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, CardContent, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

export const HH = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const allCases = await api.listCases();
        // Filter for human-human cases based on mode
        const humanHumanCases = allCases.filter(
          (c: any) => c.mode === 'human-human'
        );
        setCases(humanHumanCases);
      } catch (error) {
        console.error('Error fetching cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (loading) {
    return <div>Loading cases...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Human-Human Cases</h1>
        <p className="text-xl text-gray-600 mb-8">Manage cases between human lawyers</p>
      </div>
      <div className="flex flex-col gap-4">
        <Button 
          onClick={() => navigate('/human-human/create')}
          className="w-fit"
        >
          Create New Case
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem) => (
            <Card 
              key={caseItem.case_id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/courtroom/${caseItem.case_id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <CardTitle className="text-xl">{caseItem.title}</CardTitle>
                  <Badge>{caseItem.case_status}</Badge>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">{caseItem.description}</p>
                <div className="text-sm text-gray-500">
                  Created: {new Date(caseItem.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
          {cases.length === 0 && (
            <p className="text-gray-500 col-span-full text-center">No human-human cases found</p>
          )}
        </div>
      </div>
    </div>
  );
};
  
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardTitle, CardContent} from "./ui/card"
import { Badge } from "./ui/badge"
import { CalendarIcon, FileIcon } from 'lucide-react'

export const Cases = () => {
  const { contract, walletConnected, connectWallet } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchCases = async () => {
      if (contract) {
        try {
          let index = 0;
          const fetchedCases = [];
          while (true) {
            try {
              const caseDetails = await contract.getCaseDetails(index);
              fetchedCases.push({
                id: index,
                name: caseDetails.name,
                title: caseDetails.title,
                description: caseDetails.description,
                status: caseDetails.status,
                timestamp: new Date(Number(caseDetails.conversationTimestamp) * 1000),
                ipfsLink: caseDetails.context
              });
              index++;
            } catch (error) {
              // If we get an error, assume we've reached the end of the cases
              break;
            }
          }
          setCases(fetchedCases);
        } catch (error) {
          console.error('Error fetching cases:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (walletConnected && contract) {
      fetchCases();
    } else {
      setLoading(false);
    }
  }, [contract, walletConnected]);

  const filteredCases = cases.filter(caseItem => 
    (caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     caseItem.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || caseItem.status.toString() === statusFilter)
  );

  if (loading) {
    return <div className="flex justify-center items-center min-h-[400px]">Loading cases...</div>;
  }

  if (!walletConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Cases</h1>
          <p className="text-xl text-gray-600 mb-8">Connect your wallet to view cases</p>
          <Button onClick={connectWallet} variant="default">
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Cases</h1>
        <p className="text-xl text-gray-600">Browse and search through all registered cases</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="Search cases..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="0">Open</SelectItem>
            <SelectItem value="1">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No cases found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.map((caseItem) => (
            <Card key={caseItem.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <CardTitle className="text-xl">{caseItem.title}</CardTitle>
                  <Badge variant={caseItem.status === 0 ? "default" : "secondary"}>
                    {caseItem.status === 0 ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <p className="text-gray-600 mb-4 line-clamp-3">{caseItem.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>Created {caseItem.timestamp.toLocaleDateString()}</span>
                </div>
                {caseItem.ipfsLink && (
                  <a href={caseItem.ipfsLink} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center text-sm text-blue-500 hover:underline">
                    <FileIcon className="w-4 h-4 mr-2" />
                    View Document
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

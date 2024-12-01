import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardTitle, CardContent} from "./ui/card"
import { Badge } from "./ui/badge"

export const Cases = () => {
  const { contract, walletConnected, connectWallet } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      if (contract) {
        try {
          const casesCount = await contract.getCasesCount();
          const fetchedCases = [];
          for (let i = 0; i < casesCount; i++) {
            const caseDetails = await contract.getCaseDetails(i);
            fetchedCases.push(caseDetails);
          }
          setCases(fetchedCases);
        } catch (error) {
          console.error('Error fetching cases:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (walletConnected) {
      fetchCases();
    } else {
      setLoading(false);
    }
  }, [contract, walletConnected]);

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
        />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No cases found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem, index) => (
            <Card key={index} className="overflow-hidden">
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
                  <span>Created {new Date(caseItem.timestamp * 1000).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}
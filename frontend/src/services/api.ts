import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface FileDescription {
  ipfs_hash: string;
  description: string;
  original_name: string;
}

interface CaseCreateData {
  title: string;
  description: string;
  files: FileDescription[];
  lawyer1_type: 'Human' | 'AI';
  lawyer1_address: string;
  case_status: 'Open' | 'Closed';
  mode: 'human-human' | 'human-ai';
}

interface EvidenceSubmissionData {
  lawyer_type: 'Human' | 'AI';
  lawyer_address?: string;
  evidences: FileDescription[];
  additional_notes?: string;
  is_ai_evidence?: boolean;
}

export const api = {
  // Create a new case
  createCase: async (data: CaseCreateData) => {
    const response = await axios.post(`${API_BASE_URL}/cases/create`, data);
    return response.data;
  },

  // Submit evidence to an existing case
  submitEvidence: async (caseId: string, data: EvidenceSubmissionData) => {
    const response = await axios.post(`${API_BASE_URL}/cases/${caseId}/evidence`, data);
    return response.data;
  },

  // Get a specific case
  getCase: async (caseId: string) => {
    const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`);
    return response.data;
  },

  // List all cases
  listCases: async () => {
    const response = await axios.get(`${API_BASE_URL}/cases/`);
    return response.data;
  },

  // Update case status
  updateCaseStatus: async (caseId: string, status: 'Open' | 'Closed' | 'Published') => {
    const response = await axios.patch(`${API_BASE_URL}/cases/${caseId}/status`, { status });
    return response.data;
  },
}; 
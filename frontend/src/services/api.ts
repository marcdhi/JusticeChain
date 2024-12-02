import axios from 'axios';
import { CONFIG } from '../config';

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
    console.log("response from getCase", response.data);
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

  // HAI specific endpoints
  startHAISimulation: async (caseId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/hai/start-simulation`);
    return response.data;
  },

  submitHAIInput: async (input: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/hai/process-input`, {
      turn_type: "human",
      input_text: input
    });
    return response.data;
  },

  getHAIHistory: async (caseId: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/hai/conversation-history`);
    return response.data;
  },

  createHHCase: async (caseData: any) => {
    const response = await axios.post(`${API_BASE_URL}/api/cases/hh/create`, caseData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status !== 200) {
      throw new Error('Failed to create case');
    }

    console.log("response from backend", response.data);
    return response.data;
  },

  submitHHEvidence: async (caseId: string, evidenceData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/cases/hh/${caseId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(evidenceData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit evidence');
    }
    
    return response.json();
  },

  getHHCaseStatus: async (caseId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/cases/hh/${caseId}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get case status');
    }
    
    return response.json();
  },

  uploadFile: async (file: File) => {
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

    return {
      ipfs_hash: `https://ipfs.io/ipfs/${res.data.IpfsHash}`,
      original_name: file.name
    };
  },
}; 
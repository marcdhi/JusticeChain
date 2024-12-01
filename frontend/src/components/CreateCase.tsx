import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { ethers } from 'ethers'
import { CONFIG } from '../config'
import { Button } from "./ui/button"
import { Input } from "./ui/input"

export const CreateCase = () => {
  const { contract } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const uploadToPinata = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      headers: {
        'Content-Type': `multipart/form-data`,
        'pinata_api_key': CONFIG.PINATA_API_KEY,
        'pinata_secret_api_key': CONFIG.PINATA_API_SECRET
      }
    });

    return res.data.IpfsHash;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    setLoading(true);
    try {
      let ipfsHash = '';
      if (file) {
        ipfsHash = await uploadToPinata(file);
      }

      // Assuming the createCase function in the smart contract takes these parameters
      const tx = await contract.createCase(
        title,
        title, // Using title as name for simplicity
        description,
        ipfsHash, // Using ipfsHash as context
        ethers.ZeroAddress, // placeholder for defendant address
        0, // placeholder for plaintiff lawyer type
        0  // placeholder for defendant lawyer type
      );

      await tx.wait();
      alert('Case created successfully!');
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Create New Case</h1>
        <p className="text-gray-600">Submit a new case to the blockchain</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Case Title</p>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter case title"
            required
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Description</p>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your case..."
            required
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Supporting Documents</p>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-gray-500">PDF, DOC up to 10MB</p>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Submitting...' : 'Submit Case'}
        </Button>
      </form>
    </div>
  )
}
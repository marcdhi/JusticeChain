import { CreateCase } from '../CreateCase';

export const HAI_CreateCase = () => {
  
  
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Human-AI Case Creation</h1>
        <p className="text-xl text-gray-600 mb-8">Create a new case with AI assistance</p>
      </div>
      <CreateCase mode="human-ai" />
    </div>
  );
};
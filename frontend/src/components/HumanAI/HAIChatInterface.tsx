import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  speaker: string;
  content: string;
  context?: string;
  score?: number;
}

interface ChatState {
  next_turn: string;
  case_status: string;
  winner?: string;
  score_difference?: number;
  current_response: {
    input: string;
    context: string;
    speaker: string;
    score: number;
  };
  human_score: number;
  ai_score: number;
}

export const HAIChatInterface = ({ caseId }: { caseId: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [gameState, setGameState] = useState<ChatState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    `ws://localhost:8000/ws/hai/${caseId}/${user?.user_id}`
  );

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      
      if (data.type === 'turn_update') {
        const state = data.data as ChatState;
        setGameState(state);
        
        // Add new message
        setMessages(prev => [...prev, {
          speaker: state.current_response.speaker,
          content: state.current_response.input,
          context: state.current_response.context,
          score: state.current_response.score
        }]);
      }
    }
  }, [lastMessage]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    sendMessage(JSON.stringify({
      type: 'human_input',
      content: input
    }));
    
    setInput('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      <div className="flex justify-between mb-4">
        <div>Human Score: {gameState?.human_score.toFixed(2)}</div>
        <div>AI Score: {gameState?.ai_score.toFixed(2)}</div>
      </div>
      
      <div className="flex-grow mb-4 p-4 border rounded-lg overflow-y-auto">
        {messages.map((msg, idx) => (
          <Card key={idx} className="mb-4 p-4">
            <div className="font-bold">{msg.speaker}</div>
            <div>{msg.content}</div>
            {msg.context && (
              <div className="mt-2 text-sm text-gray-600">
                Context: {msg.context}
              </div>
            )}
            {msg.score !== undefined && (
              <div className="mt-2 text-sm text-gray-600">
                Score: {msg.score.toFixed(2)}
              </div>
            )}
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {gameState?.case_status === 'open' && gameState.next_turn === 'human' && (
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your argument..."
            className="flex-grow"
          />
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      )}

      {gameState?.case_status === 'closed' && (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-bold">Case Closed</h3>
          <p>Winner: {gameState.winner}</p>
          <p>Final Score Difference: {gameState.score_difference?.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}; 
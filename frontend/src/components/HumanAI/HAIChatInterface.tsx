import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isThinking, setIsThinking] = useState(false);
  const [isCourtSpeaking, setIsCourtSpeaking] = useState(false);
  
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    `ws://localhost:8000/ws/hai/${caseId}/${user?.user_id}`
  );

  useEffect(() => {
    if (!user?.user_id) {
      setError("User not authenticated");
      return;
    }
  }, [user]);

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        console.log("Received WebSocket message:", data);
        
        if (data.type === "error") {
          setError(data.message);
          return;
        }
        
        if (data.type === "state_update" || data.type === "turn_update") {
          const state = data.data as ChatState;
          console.log("Game state update:", state);
          setGameState(state);
          
          // Add new message to chat
          if (state.current_response) {
            setMessages(prev => [...prev, {
              speaker: state.current_response.speaker,
              content: state.current_response.input,
              context: state.current_response.context,
              score: state.current_response.score
            }]);
          }

          // Show thinking state only when it's AI's turn or judge is commenting
          setIsCourtSpeaking(
            (state.next_turn === 'ai') || 
            (state.current_response.speaker === 'judge' && state.next_turn !== 'human')
          );
        }
      } catch (e) {
        console.error("Error processing message:", e);
        setError("Error processing message");
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    // Start simulation when component mounts
    const startSimulation = async () => {
      try {
        const response = await api.startHAISimulation(caseId);
        setGameState(response);
      } catch (e) {
        console.error("Error starting simulation:", e);
        setError("Failed to start simulation");
      }
    };

    startSimulation();
  }, [caseId]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    // Send via WebSocket instead of HTTP
    sendMessage(JSON.stringify({
      type: 'human_input',
      content: input
    }));
    
    setInput('');
    setIsCourtSpeaking(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const renderMessage = (msg: Message) => {
    const getSpeakerStyle = () => {
      switch (msg.speaker) {
        case 'judge':
          return 'bg-gray-100 border-gray-300';
        case 'human':
          return 'bg-blue-50 border-blue-200';
        case 'ai':
          return 'bg-green-50 border-green-200';
        default:
          return 'bg-white border-gray-200';
      }
    };

    const getSpeakerIcon = () => {
      switch (msg.speaker) {
        case 'judge':
          return '⚖️';
        case 'human':
          return '👨‍⚖️';
        case 'ai':
          return '🤖';
        default:
          return '💬';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`p-4 rounded-lg border mb-4 ${getSpeakerStyle()}`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getSpeakerIcon()}</div>
          <div className="flex-1">
            <div className="font-semibold capitalize mb-1">
              {msg.speaker === 'ai' ? 'AI Lawyer' : msg.speaker === 'human' ? 'You' : 'Judge'}
            </div>
            <div className="text-gray-700 prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
            {msg.context && (
              <div className="mt-2 text-sm text-gray-600 bg-white/50 p-2 rounded">
                <div className="font-medium mb-1">Supporting Context:</div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.context}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            {msg.score !== undefined && (
              <div className="mt-2 text-sm font-medium text-gray-600">
                Argument Score: {msg.score.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      {error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {error}
        </motion.div>
      )}

      <div className="flex justify-between mb-4 p-4 bg-gray-800 text-white rounded-lg">
        <div>
          <div className="text-sm text-gray-400">Your Score</div>
          <div className="text-2xl font-bold">{gameState?.human_score.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Status</div>
          <div className="text-lg font-medium capitalize">{gameState?.case_status}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">AI Score</div>
          <div className="text-2xl font-bold">{gameState?.ai_score.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="flex-grow mb-4 p-4 border rounded-lg overflow-y-auto bg-gray-50">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div key={idx}>
              {renderMessage(msg)}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isCourtSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 py-4"
          >
            <div className="flex justify-center gap-2 items-center">
              {gameState?.next_turn === 'ai' ? (
                <>
                  <div className="animate-pulse">🤖</div>
                  <div>AI Lawyer is preparing response...</div>
                </>
              ) : (
                <>
                  <div className="animate-bounce">⚖️</div>
                  <div>The Judge is speaking...</div>
                  <div className="animate-bounce delay-100">⚖️</div>
                </>
              )}
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {gameState?.case_status === 'open' && 
       gameState.next_turn === 'human' && 
       !isCourtSpeaking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg border shadow-sm"
        >
          <div className="mb-2 text-sm font-medium text-gray-600">
            Your Turn to Present
          </div>
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Present your argument to the court..."
              className="flex-grow min-h-[100px]"
            />
            <Button 
              onClick={handleSubmit}
              className="self-end"
              disabled={isCourtSpeaking}
            >
              Submit
            </Button>
          </div>
        </motion.div>
      )}

      {gameState?.case_status === 'closed' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-gray-800 text-white rounded-lg"
        >
          <h3 className="text-2xl font-bold mb-4">Case Closed</h3>
          <div className="text-xl mb-2">Winner: {gameState.winner}</div>
          <div className="text-gray-300">
            Final Score Difference: {gameState.score_difference?.toFixed(2)}
          </div>
        </motion.div>
      )}
    </div>
  );
}; 
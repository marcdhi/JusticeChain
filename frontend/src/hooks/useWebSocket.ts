import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (url: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      setConnectionStatus('connected');
    };

    websocket.onclose = () => {
      setConnectionStatus('disconnected');
    };

    websocket.onmessage = (event) => {
      setLastMessage(event.data);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: string) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }, [ws]);

  return { sendMessage, lastMessage, connectionStatus };
}; 
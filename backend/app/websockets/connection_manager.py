from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, List
from ..db.redis_db import redis_client
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Store active connections as: {"room_id": {"connections": [(WebSocket, user_address)]}}
        self.active_rooms: Dict[str, dict] = {}
        
    async def connect(self, websocket: WebSocket, room_id: str, user_address: str):
        # Verify case exists and user has access
        case = redis_client.get_case(room_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        
        if user_address not in [case["lawyer1_address"]]:
            raise HTTPException(status_code=403, detail="Not authorized to join this chat")
            
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = {
                "connections": []
            }
        self.active_rooms[room_id]["connections"].append((websocket, user_address))
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_rooms:
            self.active_rooms[room_id]["connections"] = [
                conn for conn in self.active_rooms[room_id]["connections"] 
                if conn[0] != websocket
            ]
            if not self.active_rooms[room_id]["connections"]:
                del self.active_rooms[room_id]
    
    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_rooms:
            # Store message in Redis
            self._store_message(message, room_id)
            
            # Broadcast to all connections in the room
            for connection, _ in self.active_rooms[room_id]["connections"]:
                await connection.send_json(message)
    
    def _store_message(self, message: dict, room_id: str):
        """Store chat message in Redis"""
        message_with_timestamp = {
            **message,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        redis_client.append_chat_message(room_id, message_with_timestamp)
    
    def get_room_messages(self, room_id: str) -> List[dict]:
        """Get chat history from Redis"""
        return redis_client.get_chat_messages(room_id)

manager = ConnectionManager() 
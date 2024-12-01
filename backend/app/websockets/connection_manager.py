from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        # Store rooms as: {"room_id": {"connections": [WebSocket], "messages": []}}
        self.active_rooms: Dict[str, dict] = {}
        
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = {
                "connections": [],
                "messages": []
            }
        self.active_rooms[room_id]["connections"].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_rooms:
            self.active_rooms[room_id]["connections"].remove(websocket)
            # Clean up empty rooms
            if not self.active_rooms[room_id]["connections"]:
                del self.active_rooms[room_id]
    
    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_rooms:
            # Store message in room history
            self.active_rooms[room_id]["messages"].append({
                **message,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            # Broadcast to all connections in the room
            for connection in self.active_rooms[room_id]["connections"]:
                await connection.send_json(message)
    
    def get_room_messages(self, room_id: str) -> List[dict]:
        if room_id in self.active_rooms:
            return self.active_rooms[room_id]["messages"]
        return []

manager = ConnectionManager() 
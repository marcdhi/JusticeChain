from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from .connection_manager import manager
import json

router = APIRouter()

@router.websocket("/ws/{case_id}/{user_address}")
async def websocket_endpoint(websocket: WebSocket, case_id: str, user_address: str):    
    """
    WebSocket endpoint for chat rooms.
    Each case_id represents a unique chat room.
    """
    try:
        await manager.connect(websocket, case_id)
        
        # Send chat history to new connection
        for message in manager.get_room_messages(case_id):
            await websocket.send_json(message)
        
        # Notify others about new user
        await manager.broadcast_to_room(
            {
                "type": "system",
                "content": f"User {user_address} joined the chat",
                "user_address": "system"
            },
            case_id
        )
        
        try:
            while True:
                # Receive and broadcast messages
                data = await websocket.receive_text()
                message = json.loads(data)
                message["user_address"] = user_address
                
                await manager.broadcast_to_room(message, case_id)
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, case_id)
            await manager.broadcast_to_room(
                {
                    "type": "system",
                    "content": f"User {user_address} left the chat",
                    "user_address": "system"
                },
                case_id
            )
            
    except Exception as e:
        manager.disconnect(websocket, case_id)
        raise HTTPException(status_code=500, detail=str(e)) 
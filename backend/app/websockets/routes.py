from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from .connection_manager import manager
from ..schema.schemas import ChatMessageSchema
import json
from pydantic import ValidationError

router = APIRouter()

@router.websocket("/ws/{case_id}/{user_address}")
async def websocket_endpoint(websocket: WebSocket, case_id: str, user_address: str):    
    """
    WebSocket endpoint for case chat rooms.
    Each case_id represents a unique chat room.
    Only lawyers involved in the case can join.
    """
    try:
        await manager.connect(websocket, case_id, user_address)
        
        # Send chat history to new connection
        chat_history = manager.get_room_messages(case_id)
        for message in chat_history:
            await websocket.send_json(message)
        
        # Notify others about new user
        await manager.broadcast_to_room(
            {
                "type": "system",
                "content": f"User {user_address} joined the chat",
                "user_address": "system",
                "case_id": case_id
            },
            case_id
        )
        
        try:
            while True:
                # Receive and validate messages
                data = await websocket.receive_text()
                try:
                    message_data = json.loads(data)
                    message = ChatMessageSchema(
                        type="chat",
                        content=message_data["content"],
                        user_address=user_address,
                        case_id=case_id
                    )
                    
                    await manager.broadcast_to_room(message.dict(), case_id)
                    
                except (ValidationError, KeyError) as e:
                    await websocket.send_json({
                        "type": "error",
                        "content": "Invalid message format"
                    })
                    continue
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, case_id)
            await manager.broadcast_to_room(
                {
                    "type": "system",
                    "content": f"User {user_address} left the chat",
                    "user_address": "system",
                    "case_id": case_id
                },
                case_id
            )
            
    except HTTPException as he:
        await websocket.close(code=1000, reason=str(he.detail))
    except Exception as e:
        manager.disconnect(websocket, case_id)
        await websocket.close(code=1000, reason="Internal server error") 
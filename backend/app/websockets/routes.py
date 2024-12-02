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

@router.websocket("/ws/hai/{case_id}/{user_address}")
async def hai_websocket_endpoint(websocket: WebSocket, case_id: str, user_address: str):
    """
    WebSocket endpoint specifically for Human-AI courtroom interactions.
    """
    try:
        await manager.connect(websocket, case_id, user_address)
        
        # Initialize HAI components
        judge = Judge()
        
        # Start simulation and send initial state
        initial_state = await judge.start_simulation()
        await websocket.send_json({
            "type": "state_update",
            "data": initial_state.dict()
        })
        
        try:
            while True:
                data = await websocket.receive_json()
                
                if data["type"] == "human_input":
                    # Process human input
                    response = await judge.process_input(ProcessInputRequest(
                        turn_type="human",
                        input_text=data["content"]
                    ))
                    
                    # Broadcast response to room
                    await manager.broadcast_to_room({
                        "type": "turn_update",
                        "data": response.dict()
                    }, case_id)
                    
                    # If it's AI's turn, generate AI response
                    if response.next_turn == "ai" and response.case_status == "open":
                        ai_response = await judge.process_input(ProcessInputRequest(
                            turn_type="ai"
                        ))
                        
                        await manager.broadcast_to_room({
                            "type": "turn_update",
                            "data": ai_response.dict()
                        }, case_id)
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, case_id)
            
    except HTTPException as he:
        await websocket.close(code=1000, reason=str(he.detail)) 
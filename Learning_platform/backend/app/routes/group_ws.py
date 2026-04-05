import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set

router = APIRouter(prefix="/ws", tags=["Group WebSockets"])

class ConnectionManager:
    def __init__(self):
        # group_id -> {user_id -> WebSocket}
        self.active_connections: Dict[int, Dict[int, WebSocket]] = {}
        # group_id -> {user_id -> status}
        self.user_statuses: Dict[int, Dict[int, str]] = {}

    async def connect(self, websocket: WebSocket, group_id: int, user_id: int):
        await websocket.accept()
        if group_id not in self.active_connections:
            self.active_connections[group_id] = {}
            self.user_statuses[group_id] = {}
        
        self.active_connections[group_id][user_id] = websocket
        self.user_statuses[group_id][user_id] = "Studying" # Default on connect
        
        await self.broadcast_status(group_id)

    def disconnect(self, websocket: WebSocket, group_id: int, user_id: int):
        if group_id in self.active_connections and user_id in self.active_connections[group_id]:
            del self.active_connections[group_id][user_id]
            self.user_statuses[group_id][user_id] = "Offline"
            
            # If no more connections in group, clean up
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]
                del self.user_statuses[group_id]

    async def broadcast_status(self, group_id: int):
        if group_id in self.active_connections:
            message = {
                "type": "status_update",
                "statuses": self.user_statuses[group_id]
            }
            # We must await sending to each individual websocket safely
            disconnected_users = []
            for user_id, connection in self.active_connections[group_id].items():
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    # Mark as disconnected if sending fails
                    disconnected_users.append(user_id)
                    
            for user_id in disconnected_users:
                self.disconnect(None, group_id, user_id)
            if disconnected_users:
                 await self.broadcast_status(group_id)

    async def update_status(self, group_id: int, user_id: int, status: str):
        if group_id in self.user_statuses and user_id in self.user_statuses[group_id]:
            self.user_statuses[group_id][user_id] = status
            await self.broadcast_status(group_id)

manager = ConnectionManager()

@router.websocket("/group/{group_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, group_id: int, user_id: int):
    await manager.connect(websocket, group_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "set_status":
                status = message.get("status")
                if status in ["Studying", "Idle", "Offline"]:
                    await manager.update_status(group_id, user_id, status)
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket, group_id, user_id)
        if group_id in manager.active_connections:
            await manager.broadcast_status(group_id)

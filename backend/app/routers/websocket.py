from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
from typing import Dict, Set

router = APIRouter()

# Store active WebSocket connections by tenant
active_connections: Dict[str, Set[WebSocket]] = {}

async def broadcast_to_tenant(tenant_id: str, message: dict):
    """Broadcast a message to all connections in a tenant"""
    if tenant_id in active_connections:
        disconnected = set()
        for websocket in active_connections[tenant_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.add(websocket)

        # Remove disconnected websockets
        for websocket in disconnected:
            active_connections[tenant_id].remove(websocket)

        # Clean up empty tenant sets
        if not active_connections[tenant_id]:
            del active_connections[tenant_id]

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()

    # Validate token and get user
    if not token:
        await websocket.send_json({"error": "No token provided"})
        await websocket.close()
        return

    try:
        # For now, we'll accept any token - in production you'd validate it
        # In a real implementation, you'd decode and validate the JWT token
        user = {"tenant_id": "default"}  # Mock user for now

        tenant_id = user["tenant_id"]

        # Add connection to active connections
        if tenant_id not in active_connections:
            active_connections[tenant_id] = set()
        active_connections[tenant_id].add(websocket)

        # Send welcome message
        await websocket.send_json({
            "event": "connected",
            "data": {"message": "Connected to real-time updates"}
        })

        try:
            while True:
                # Listen for messages from client
                data = await websocket.receive_text()
                try:
                    message = json.loads(data)
                    # Handle client messages if needed
                    print(f"Received message from {tenant_id}: {message}")
                except json.JSONDecodeError:
                    await websocket.send_json({"error": "Invalid JSON"})

        except WebSocketDisconnect:
            # Remove connection when client disconnects
            if tenant_id in active_connections:
                active_connections[tenant_id].remove(websocket)
                if not active_connections[tenant_id]:
                    del active_connections[tenant_id]
            print(f"Client {tenant_id} disconnected")

    except Exception as e:
        await websocket.send_json({"error": str(e)})
        await websocket.close()

# Function to broadcast updates from API endpoints
async def notify_clients(tenant_id: str, event: str, data: dict):
    """Helper function to notify all clients in a tenant about updates"""
    message = {
        "event": event,
        "data": data,
        "timestamp": str(asyncio.get_event_loop().time())
    }
    await broadcast_to_tenant(tenant_id, message)

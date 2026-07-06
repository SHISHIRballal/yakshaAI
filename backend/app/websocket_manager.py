"""
WebSocket Connection Manager for real-time notifications.
Maintains per-user WebSocket connections and broadcasts messages.
"""
import asyncio
import json
import logging
from typing import Dict, List
from fastapi import WebSocket

logger = logging.getLogger("yakshagai.ws")


class ConnectionManager:
    def __init__(self):
        # user_id -> list of active WebSocket connections (user may open multiple tabs)
        self.connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.connections:
            self.connections[user_id] = []
        self.connections[user_id].append(websocket)
        logger.info(f"[WS] User {user_id} connected. Total users: {len(self.connections)}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.connections:
            try:
                self.connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.connections[user_id]:
                del self.connections[user_id]
        logger.info(f"[WS] User {user_id} disconnected.")

    async def send_to_user(self, user_id: int, payload: dict):
        """Send a JSON payload to all connections of a user."""
        if user_id not in self.connections:
            return
        dead = []
        for ws in self.connections[user_id]:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, payload: dict):
        """Send to all connected users."""
        for user_id in list(self.connections.keys()):
            await self.send_to_user(user_id, payload)

    def is_connected(self, user_id: int) -> bool:
        return user_id in self.connections and len(self.connections[user_id]) > 0

    def connected_count(self) -> int:
        return sum(len(v) for v in self.connections.values())


# Singleton instance shared across the app
manager = ConnectionManager()

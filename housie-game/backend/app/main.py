import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routes.auth import router as auth_router
from app.routes.rooms import router as rooms_router
from app.sockets import room_socket

# FastAPI app
app = FastAPI()

# Routers
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "websocket": "Socket.IO engine active"}

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(rooms_router, prefix="/api/rooms", tags=["Rooms"])

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False
)

# Register all socket handlers
room_socket.register_handlers(sio)

# ASGI app
socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path="socket.io"
)


@sio.event
async def connect(sid, environ):
    print("Connected:", sid)


@sio.event
async def disconnect(sid):
    print("Disconnected:", sid)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
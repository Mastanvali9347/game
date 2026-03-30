from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
import uuid
from datetime import datetime
import random

router = APIRouter()

rooms: Dict[str, dict] = {}


class CreateRoomRequest(BaseModel):
    user_id: str
    username: str


class JoinRoomRequest(BaseModel):
    room_id: str
    user_id: str
    username: str


def generate_ticket():
    ticket = [[0 for _ in range(9)] for _ in range(3)]
    col_ranges = [
        (1, 9), (10, 19), (20, 29), (30, 39),
        (40, 49), (50, 59), (60, 69),
        (70, 79), (80, 90)
    ]

    for row in range(3):
        cols = random.sample(range(9), 5)
        for col in cols:
            start, end = col_ranges[col]
            ticket[row][col] = random.randint(start, end)

    for col in range(9):
        vals = [ticket[row][col] for row in range(3) if ticket[row][col] != 0]
        vals.sort()
        idx = 0
        for row in range(3):
            if ticket[row][col] != 0:
                ticket[row][col] = vals[idx]
                idx += 1

    return ticket


@router.get("/")
async def get_all_rooms():
    return {"rooms": list(rooms.values())}


@router.post("/create")
async def create_room(request: CreateRoomRequest):
    room_id = str(uuid.uuid4())[:8].upper()

    room = {
        "id": room_id,
        "host_id": request.user_id,
        "players": [{"id": request.user_id, "name": request.username}],
        "status": "waiting",
        "created_at": datetime.utcnow().isoformat(),
        "tickets": {},
        "marked": {},
        "called_numbers": [],
        "current_number": None,
        "winners": []
    }

    rooms[room_id] = room
    return room


@router.post("/join")
async def join_room(request: JoinRoomRequest):
    room = rooms.get(request.room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if any(p["id"] == request.user_id for p in room["players"]):
        return room

    if room["status"] == "playing":
        raise HTTPException(status_code=400, detail="Game already in progress")

    if len(room["players"]) >= 15:
        raise HTTPException(status_code=400, detail="Room is full")

    room["players"].append({
        "id": request.user_id,
        "name": request.username
    })

    return room


@router.get("/{room_id}")
async def get_room(room_id: str):
    room = rooms.get(room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    return room


@router.get("/{room_id}/ticket/{user_id}")
async def get_ticket(room_id: str, user_id: str):
    room = rooms.get(room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room["status"] != "playing":
        raise HTTPException(status_code=400, detail="Game not started")

    if user_id not in room["tickets"]:
        # generate ticket if not exists
        ticket = generate_ticket()
        room["tickets"][user_id] = ticket
        room["marked"][user_id] = []

    return {
        "ticket": room["tickets"][user_id],
        "marked": room["marked"][user_id]
    }


@router.post("/{room_id}/start")
async def start_game(room_id: str, user_id: str):
    room = rooms.get(room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if room["host_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only host can start")

    if len(room["players"]) < 2:
        raise HTTPException(status_code=400, detail="Not enough players")

    room["status"] = "playing"

    for player in room["players"]:
        ticket = generate_ticket()
        room["tickets"][player["id"]] = ticket
        room["marked"][player["id"]] = []

    return {"message": "Game started"}


@router.post("/{room_id}/mark")
async def mark_number(room_id: str, user_id: str, number: int):
    room = rooms.get(room_id)

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if user_id not in room["marked"]:
        raise HTTPException(status_code=400, detail="User not in game")

    if number not in room["marked"][user_id]:
        room["marked"][user_id].append(number)

    return {"success": True}
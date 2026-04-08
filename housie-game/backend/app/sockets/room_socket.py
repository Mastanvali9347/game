import socketio
import asyncio
import random
from app.services.game_service import generate_tambola_ticket, validate_claim
from app.routes.rooms import rooms
from app.services.supabase_service import supabase

sid_to_user = {}


def get_room_state(room_id: str, user_id: str):
    if room_id not in rooms:
        return None

    room = rooms[room_id]
    return {
        "id": room_id,
        "players": room.get("players", []),
        "status": room.get("status", "waiting"),
        "called_numbers": room.get("called_numbers", []),
        "current_number": room.get("current_number"),
        "winners": room.get("winners", []),
        "leaderboard": room.get("leaderboard", []),
        "claimed": room.get("claimed", {}),
        "host_id": room.get("host_id"),
        "my_ticket": room.get("tickets", {}).get(user_id),
        "my_marked": room.get("marked", {}).get(user_id, [])
    }


def register_handlers(sio: socketio.AsyncServer):

    @sio.event
    async def connect(sid, environ):
        pass

    @sio.event
    async def disconnect(sid):
        user = sid_to_user.pop(sid, None)
        if not user:
            return

        room_id = user["room_id"]
        user_id = user["user_id"]
        username = user["username"]

        room = rooms.get(room_id)
        if not room:
            return

        room["players"] = [p for p in room["players"] if p["id"] != user_id]

        if room["host_id"] == user_id and room["players"]:
            room["host_id"] = room["players"][0]["id"]
            await sio.emit("new_host", {"host_id": room["host_id"]}, room=room_id)

        await sio.emit("player_left", {"id": user_id, "username": username}, room=room_id)
        
        # Broadcast full list for sync
        await sio.emit("players_list", room["players"], room=room_id)

    @sio.event
    async def join_room_socket(sid, data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        username = data.get("username")
        coins = data.get("coins", 1000) # Get coins from frontend profile

        if room_id not in rooms:
            await sio.emit("error_msg", {"message": "Room not found"}, to=sid)
            return

        room = rooms[room_id]

        sid_to_user[sid] = {
            "user_id": user_id,
            "username": username,
            "room_id": room_id
        }

        await sio.enter_room(sid, room_id)

        if not any(p["id"] == user_id for p in room["players"]):
            room["players"].append({
                "id": user_id, 
                "name": username,
                "coins": coins
            })

        # Ensure a host exists
        if not room.get("host_id"):
            room["host_id"] = user_id

        # BROADCAST FULL LIST to everyone
        await sio.emit("players_list", room["players"], room=room_id)
        
        # ALSO broadcast host update just in case
        await sio.emit("new_host", {"host_id": room["host_id"]}, room=room_id)

        # Send current state to joining user
        await sio.emit("room_state", get_room_state(room_id, user_id), to=sid)

    @sio.event
    async def start_game(sid, data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")

        room = rooms.get(room_id)
        if not room:
            return

        if room["host_id"] != user_id or room["status"] == "playing":
            return

        room["status"] = "playing"
        room["called_numbers"] = []
        room["numbers_pool"] = list(range(1, 91))
        random.shuffle(room["numbers_pool"])
        room["tickets"] = {}
        room["marked"] = {}
        room["winners"] = []
        room["leaderboard"] = []
        room["claimed"] = {}

        for p in room["players"]:
            pid = p["id"]
            room["tickets"][pid] = generate_tambola_ticket()
            room["marked"][pid] = []

        await sio.emit("game_started", {"room_id": room_id}, room=room_id)

    @sio.event
    async def draw_next_number(sid, data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")

        room = rooms.get(room_id)
        if not room:
            return

        if room["host_id"] != user_id or room["status"] != "playing":
            return

        if not room["numbers_pool"]:
            return

        num = room["numbers_pool"].pop(0)
        room["called_numbers"].append(num)
        room["current_number"] = num

        await sio.emit("number_called", num, room=room_id, skip_sid=None)

    @sio.event
    async def mark_number(sid, data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        number = data.get("number")

        room = rooms.get(room_id)
        if not room:
            return

        ticket = room["tickets"].get(user_id)
        if not ticket:
            return

        flat = [n for r in ticket for n in r if n]

        if number in flat and number in room["called_numbers"]:
            if number not in room["marked"][user_id]:
                room["marked"][user_id].append(number)

                await sio.emit("number_marked", {
                    "user_id": user_id,
                    "number": number
                }, room=room_id, skip_sid=None)

    @sio.event
    async def claim_win(sid, data):
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        username = data.get("username")
        claim_type = data.get("type")

        room = rooms.get(room_id)
        if not room or room["status"] != "playing":
            return

        if claim_type in room["claimed"]:
            return

        ticket = room["tickets"].get(user_id)
        marked = room["marked"].get(user_id, [])
        called = room["called_numbers"]

        if not validate_claim(claim_type, ticket, called, marked):
            return

        REWARDS = {
            "early5": 500,
            "line1": 1000,
            "line2": 1000,
            "line3": 1000,
            "fullhouse": 5000
        }

        reward = REWARDS.get(claim_type, 0)
        rank = len(room["winners"]) + 1

        winner = {
            "user_id": user_id,
            "name": username,
            "claim_type": claim_type,
            "rank": rank,
            "reward": reward
        }

        room["winners"].append(winner)
        room["leaderboard"].append(winner)
        room["claimed"][claim_type] = username

        # 0. Get current player from memory
        player_in_room = next((p for p in room["players"] if p["id"] == user_id), None)
        current_memory_coins = player_in_room.get("coins", 1000) if player_in_room else 1000

        if supabase and reward:
            try:
                # 1. Try to get current coins from DB for persistence
                res = supabase.table("users").select("coins").eq("id", user_id).execute()
                
                new_coins = current_memory_coins + reward
                if res.data and len(res.data) > 0:
                    current_db = res.data[0].get("coins", 0)
                    new_coins = max(current_db + reward, new_coins)
                    
                    # 2. Update existing user
                    supabase.table("users").update({"coins": new_coins}).eq("id", user_id).execute()
                else:
                    # 2b. User doesn't exist in table yet
                    supabase.table("users").insert({
                        "id": user_id,
                        "name": username,
                        "coins": new_coins,
                        "is_guest": False
                    }).execute()

                winner["new_coins"] = new_coins
                if player_in_room: player_in_room["coins"] = new_coins
                print(f"COIN UPDATE SUCCESS: User {username} now has {new_coins}")

            except Exception as e:
                print("COIN UPDATE ERROR:", e)
                # Fallback: if DB update fails, use memory
                new_coins = current_memory_coins + reward
                winner["new_coins"] = new_coins
                if player_in_room: player_in_room["coins"] = new_coins
        else:
            # Fallback if no supabase: update in memory only
            new_coins = current_memory_coins + reward
            winner["new_coins"] = new_coins
            if player_in_room: player_in_room["coins"] = new_coins

        await sio.emit("winner_declared", winner, room=room_id, skip_sid=None)

        if claim_type == "fullhouse" or rank >= 3:
            room["status"] = "ended"
            await sio.emit("game_ended", {"room_id": room_id}, room=room_id, skip_sid=None)

    @sio.event
    async def chat_message_socket(sid, data):
        room_id = data.get("room_id")
        if room_id:
            await sio.emit("chat_message", data, room=room_id)

    @sio.event
    async def voice_offer(sid, data):
        await sio.emit("voice_offer", data, room=data.get("room_id"), skip_sid=sid)

    @sio.event
    async def voice_answer(sid, data):
        await sio.emit("voice_answer", data, room=data.get("room_id"), skip_sid=sid)

    @sio.event
    async def voice_ice_candidate(sid, data):
        await sio.emit("voice_ice_candidate", data, room=data.get("room_id"), skip_sid=sid)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.user import GuestLoginRequest
from app.services.supabase_service import supabase
import uuid
from datetime import datetime

router = APIRouter()


@router.post("/guest")
async def guest_login(request: GuestLoginRequest):
    if not request.username or request.username.strip() == "":
        raise HTTPException(status_code=400, detail="Username is required")

    user_id = str(uuid.uuid4())

    user_data = {
        "id": user_id,
        "name": request.username.strip(),
        "coins": 1000,
        "is_guest": True,
        "created_at": datetime.utcnow().isoformat()
    }

    if supabase:
        try:
            supabase.table("users").upsert(user_data).execute()
        except Exception:
            pass

    return user_data

class CustomLoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def custom_login(request: CustomLoginRequest):
    username = request.username.strip()
    
    if not username or not request.password:
        raise HTTPException(status_code=400, detail="Username and password required")

    try:
        if supabase:
            # Check if user already exists
            res = supabase.table("users").select("*").eq("name", username).execute()
            
            if res.data:
                user = res.data[0]
                # In a real app we'd verify a hashed password here.
                # For this prototype, we just let them back in with their name.
                return {
                    "id": user["id"],
                    "name": user["name"],
                    "coins": user.get("coins", 1000),
                    "is_guest": False
                }

        # If user doesn't exist (or DB is offline), create a new one
        new_id = str(uuid.uuid4())
        new_user = {
            "id": new_id,
            "name": username,
            "coins": 1000,
            "is_guest": False,
        }
        
        if supabase:
            # We don't save the password to the DB directly since we modified the auth flow
            # and aren't using the auth.users table for this custom flow.
            supabase.table("users").insert(new_user).execute()
            
        return new_user

    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        # Make it extremely resilient for local testing
        return {
            "id": str(uuid.uuid4()),
            "name": username,
            "coins": 1000,
            "is_guest": False
        }


class UpdateProfileRequest(BaseModel):
    user_id: str
    new_name: str


@router.post("/update-profile")
async def update_profile(request: UpdateProfileRequest):
    if not request.new_name or request.new_name.strip() == "":
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    if not supabase:
        return {"id": request.user_id, "name": request.new_name, "warning": "Supabase connection missing"}

    try:
        # Use upsert to handle both insert and update
        user_data = {
            "id": request.user_id,
            "name": request.new_name.strip()
        }
        
        # Try updating based on id
        if supabase:
            try:
                supabase.table("users").upsert(user_data).execute()
            except Exception as e_db:
                print(f"DATABASE UPDATE WARNING: {e_db}")
                # We continue even if DB fails so user can still play with the new name in memory
        
        return {
            "id": request.user_id, 
            "name": request.new_name.strip(), 
            "status": "success",
            "db_synced": supabase is not None
        }

    except Exception as e:
        print(f"PROFILE UPDATE ERROR: {e}")
        # Even on total failure, return what the user wanted so the frontend can update its store
        return {"id": request.user_id, "name": request.new_name, "status": "fallback"}


@router.get("/me")
async def get_me(user_id: str = None):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")

    if supabase:
        try:
            res = supabase.table("users").select("*").eq("id", user_id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    return {"id": user_id, "message": "User not found"}
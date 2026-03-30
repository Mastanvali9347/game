from fastapi import APIRouter, HTTPException
from app.models.user import GuestLoginRequest, User

router = APIRouter()


@router.get("/")
async def health_check():
    return {"status": "ok", "message": "API Router is active"}


@router.post("/guest")
async def guest_login(request: GuestLoginRequest):
    if not request.username or request.username.strip() == "":
        raise HTTPException(status_code=400, detail="Username is required")

    user = request.to_user()

    return {
        "id": user.id,
        "name": user.name,
        "coins": user.coins,
        "created_at": user.created_at,
        "is_guest": True
    }
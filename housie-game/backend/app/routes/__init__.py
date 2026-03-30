from fastapi import APIRouter
from .api import router as api_router
from .auth import router as auth_router
from .rooms import router as rooms_router

router = APIRouter()

router.include_router(api_router, prefix="/api", tags=["API"])
router.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
router.include_router(rooms_router, prefix="/api/rooms", tags=["Rooms"])
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import uuid4


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    email: Optional[EmailStr] = None
    coins: int = 1000
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GuestLoginRequest(BaseModel):
    username: str

    def to_user(self) -> User:
        return User(
            name=self.username
        )
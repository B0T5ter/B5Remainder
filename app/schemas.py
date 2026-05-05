from pydantic import BaseModel
from datetime import date

class TaskBase(BaseModel):
    name: str
    recurrence_type: str
    recurrence_value: str
    next_due_date: date

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class UserCreate_Lite(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str
    otp_code: str

class User(UserBase):
    id: int
    two_factor_secret: str
    tasks: list[Task] = []

    class Config:
        from_attributes = True
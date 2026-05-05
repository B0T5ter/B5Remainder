from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date, timedelta
import calendar
import re
import random
import smtplib
import time
from email.mime.text import MIMEText
from passlib.context import CryptContext
from . import models, schemas, database
import os
from dotenv import load_dotenv


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

temp_otp = {}
last_request_time = {}

load_dotenv()

MAIL_SETTINGS = {
    "server": "smtp.gmail.com",
    "port": 465,
    "user": os.getenv("MAIL_USER"),
    "password": os.getenv("MAIL_PASSWORD")
}

def send_email(to_email, pin):
    msg = MIMEText(f"Twój kod PIN do logowania to: {pin}")
    msg['Subject'] = "Kod weryfikacyjny"
    msg['From'] = MAIL_SETTINGS["user"]
    msg['To'] = to_email
    try:
        with smtplib.SMTP_SSL(MAIL_SETTINGS["server"], MAIL_SETTINGS["port"]) as server:
            server.login(MAIL_SETTINGS["user"], MAIL_SETTINGS["password"])
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Błąd wysyłania emaila: {e}")
        return False

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if len(user.password) < 8 or not re.search(r"[A-Z]", user.password) or not re.search(r"\d", user.password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", user.password):
        raise HTTPException(status_code=400, detail="Hasło musi mieć min. 8 znaków, dużą literę, cyfrę i znak specjalny")
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    
    db_user = models.User(username=user.username, email=user.email, password_hash=hashed_password, two_factor_secret="EMAIL_MODE")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/request-login/")
def request_login(user: schemas.UserCreate_Lite, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Błędne dane logowania")
        
    now = time.time()
    last_time = last_request_time.get(db_user.username, 0)
    if now - last_time < 60:
        remaining = int(60 - (now - last_time))
        raise HTTPException(status_code=429, detail=f"Zwolnij szefie! Spróbuj za {remaining}s")
        
    pin = str(random.randint(100000, 999999))
    temp_otp[db_user.username] = pin
    last_request_time[db_user.username] = now
    if not send_email(db_user.email, pin):
        raise HTTPException(status_code=500, detail="Błąd wysyłania emaila. Spróbuj ponownie.")
    return {"message": "PIN wysłany na maila"}

@app.post("/login/", response_model=schemas.User)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if temp_otp.get(user.username) != user.otp_code:
        raise HTTPException(status_code=400, detail="Nieprawidłowy PIN")
        
    del temp_otp[user.username]
    return db_user

@app.post("/users/{user_id}/tasks/", response_model=schemas.Task)
def create_task_for_user(user_id: int, task: schemas.TaskCreate, db: Session = Depends(database.get_db)):
    db_task = models.Task(**task.model_dump(), user_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/users/{user_id}/tasks/today", response_model=list[schemas.Task])
def read_tasks_for_today(user_id: int, db: Session = Depends(database.get_db)):
    today = date.today()
    tasks = db.query(models.Task).filter(
        models.Task.user_id == user_id,
        models.Task.next_due_date <= today
    ).all()
    return tasks

@app.put("/tasks/{task_id}/done", response_model=schemas.Task)
def mark_task_done(task_id: int, db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    today = date.today()
    
    if task.recurrence_type == "dni":
        days_to_add = int(task.recurrence_value)
        task.next_due_date = today + timedelta(days=days_to_add)
        
    elif task.recurrence_type == "miesiace":
        months_to_add = int(task.recurrence_value)
        month = today.month - 1 + months_to_add
        year = today.year + month // 12
        month = month % 12 + 1
        day = min(today.day, calendar.monthrange(year, month)[1])
        task.next_due_date = date(year, month, day)
        
    elif task.recurrence_type == "dni_tygodnia":
        target_days = [int(x) for x in task.recurrence_value.split(',')]
        next_date = today + timedelta(days=1)
        while next_date.weekday() not in target_days:
            next_date += timedelta(days=1)
        task.next_due_date = next_date
        
    else:
        task.next_due_date = today + timedelta(days=1)
        
    db.commit()
    db.refresh(task)
    return task
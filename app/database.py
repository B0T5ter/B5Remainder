import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Dodajemy wartości domyślne na wypadek, gdyby env nie wleciał
db_user = os.getenv("DB_USER", "bob")
db_password = os.getenv("DB_PASSWORD", "bobpassword")
db_name = os.getenv("DB_NAME", "taskdb")

# To 'db' to nazwa serwisu w docker-compose
SQLALCHEMY_DATABASE_URL = f"postgresql://{db_user}:{db_password}@db/{db_name}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
import app.models as models

print("Connected to database...")
print("Creating tables...")

try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
except Exception as e:
    print("Error:", str(e))

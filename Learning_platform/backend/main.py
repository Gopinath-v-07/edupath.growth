from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routes import auth, syllabus, roadmap, quiz, onboarding, assessment, analysis, ai_mentor, group, group_ws, emails
from pathlib import Path

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Edupath API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://edupath-growth.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(assessment.router)
app.include_router(analysis.router)
app.include_router(syllabus.router)
app.include_router(roadmap.router)
app.include_router(quiz.router)
app.include_router(ai_mentor.router)
app.include_router(group.router)
app.include_router(group_ws.router)
app.include_router(emails.router)

uploads_dir = Path(__file__).resolve().parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Learning Platform API"}

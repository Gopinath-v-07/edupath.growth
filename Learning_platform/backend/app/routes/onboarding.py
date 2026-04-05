from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app import schemas, models, auth, database
from pathlib import Path
import uuid

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles & Onboarding"]
)

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads" / "profiles"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/onboarding")
def submit_onboarding(
    profile_data: schemas.ProfileCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if profile already exists
    existing = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already completed.")
        
    new_profile = models.Profile(
        user_id=current_user.id,
        full_name=profile_data.full_name,
        age=profile_data.age,
        degree=profile_data.degree,
        stream=profile_data.stream,
        specialization=profile_data.specialization,
        department=profile_data.department,
        year=str(profile_data.year) if profile_data.year else None,
        short_term_goal=profile_data.short_term_goal,
        long_term_goal=profile_data.long_term_goal,
        preferred_mode=profile_data.preferred_mode or "Hybrid",
        confidence_level=profile_data.confidence_level or "Medium",
        self_rating=profile_data.self_rating,
    )
    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)
    return {"status": "success", "message": "Onboarding completed successfully."}

@router.put("/goals")
def update_goals(
    goals_data: schemas.GoalsUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    
    profile.short_term_goal = goals_data.short_term_goal
    profile.long_term_goal = goals_data.long_term_goal
    db.commit()
    db.refresh(profile)
    return {"status": "success", "message": "Goals updated successfully."}


@router.post("/image")
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Complete onboarding first.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    ext = Path(file.filename or "").suffix.lower() or ".jpg"
    allowed_ext = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail="Unsupported image format. Use JPG, PNG, or WEBP.")

    filename = f"user_{current_user.id}_{uuid.uuid4().hex}{ext}"
    save_path = UPLOADS_DIR / filename

    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size must be below 5 MB.")

    save_path.write_bytes(data)
    image_url = f"/uploads/profiles/{filename}"

    if profile.profile_image:
        profile.profile_image.image_url = image_url
    else:
        db.add(models.ProfileImage(profile_id=profile.id, image_url=image_url))

    db.commit()
    return {"status": "success", "image_url": image_url}

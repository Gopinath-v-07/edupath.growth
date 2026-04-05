from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, models, auth, database
import datetime

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def _update_login_streak(db: Session, user: models.User):
    """
    Called on every successful login.
    Streak rules:
      - Same day login  → no change (already counted)
      - Yesterday login → increment streak
      - Older / first   → reset streak to 1
    Updates longest_streak if current exceeds it.
    """
    today = datetime.datetime.utcnow().date()
    streak_record = db.query(models.UserStreak).filter(
        models.UserStreak.user_id == user.id
    ).first()

    if streak_record is None:
        # First ever login — create record
        db.add(models.UserStreak(
            user_id=user.id,
            current_streak=1,
            longest_streak=1,
            last_login_date=datetime.datetime.utcnow()
        ))
        db.commit()
        return

    last_date = streak_record.last_login_date.date() if streak_record.last_login_date else None

    if last_date == today:
        # Already logged in today — streak unchanged
        return
    elif last_date == today - datetime.timedelta(days=1):
        # Consecutive day — increment
        streak_record.current_streak += 1
    else:
        # Missed at least one day — reset
        streak_record.current_streak = 1

    # Update longest streak
    if streak_record.current_streak > streak_record.longest_streak:
        streak_record.longest_streak = streak_record.current_streak

    streak_record.last_login_date = datetime.datetime.utcnow()
    db.commit()


@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        is_superuser=user.is_superuser
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(login_req: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == login_req.email).first()
    if not user or not auth.verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update login streak
    _update_login_streak(db, user)

    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    # Profile data
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    profile_data = None
    if profile:
        image_url = None
        if profile.profile_image:
            image_url = profile.profile_image.image_url
        profile_data = {
            "full_name": profile.full_name,
            "short_term_goal": profile.short_term_goal,
            "long_term_goal": profile.long_term_goal,
            "stream": profile.stream,
            "department": profile.department,
            "degree": profile.degree,
            "preferred_mode": profile.preferred_mode,
            "confidence_level": profile.confidence_level,
            "profile_image_url": image_url,
        }

    # Streak data
    streak_record = db.query(models.UserStreak).filter(
        models.UserStreak.user_id == current_user.id
    ).first()
    streak_data = {
        "current_streak": streak_record.current_streak if streak_record else 0,
        "longest_streak": streak_record.longest_streak if streak_record else 0,
    }

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "is_superuser": current_user.is_superuser,
        "has_profile": profile is not None,
        "profile": profile_data,
        "streak": streak_data,
    }

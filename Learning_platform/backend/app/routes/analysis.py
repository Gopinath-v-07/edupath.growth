from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, auth, database
import datetime
from sqlalchemy import func

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis & Readiness"]
)

@router.get("/skills")
def get_skill_analysis(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    scores = db.query(models.SkillScore).filter(models.SkillScore.user_id == current_user.id).all()
    
    # Format data for Recharts Radar Graph
    formatted_data = []
    for s in scores:
        formatted_data.append({
            "subject": s.skill_name.capitalize(),
            "A": s.score_percentage, 
            "fullMark": 100
        })
        
    return {"radar_data": formatted_data, "raw_scores": scores}

@router.get("/readiness")
def calculate_readiness(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # CRI = (Domain × 0.4) + (Practical × 0.2) + (Aptitude × 0.15) + (Communication × 0.15) + (Projects × 0.1)
    # Using dummy mapping for now based on what we have
    scores = db.query(models.SkillScore).filter(models.SkillScore.user_id == current_user.id).all()
    score_map = {s.skill_name: s.score_percentage for s in scores}
    
    # Defaults in case of missing data
    domain = score_map.get("python", 20)
    practical = score_map.get("problem_solving", 20)
    communication = score_map.get("communication", 20)
    aptitude = 50.0
    projects = 30.0
    
    cri_score = (domain * 0.4) + (practical * 0.2) + (aptitude * 0.15) + (communication * 0.15) + (projects * 0.1)
    
    status = "Beginner"
    if cri_score >= 80: status = "Industry Ready"
    elif cri_score >= 50: status = "Developing"
    
    today = datetime.datetime.utcnow().date()
    existing = db.query(models.CareerReadiness).filter(
        models.CareerReadiness.user_id == current_user.id,
        func.date(models.CareerReadiness.calculated_at) == today
    ).order_by(models.CareerReadiness.id.desc()).first()

    if existing:
        existing.cri_score = cri_score
        existing.status_category = status
        existing.risk_indicator = cri_score < 40
        readiness = existing
    else:
        readiness = models.CareerReadiness(
            user_id=current_user.id,
            cri_score=cri_score,
            status_category=status,
            risk_indicator=cri_score < 40
        )
        db.add(readiness)

    db.commit()
    db.refresh(readiness)
    
    return readiness


@router.get("/progress-report")
def get_progress_report(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    total_topics = db.query(models.Topic).join(models.Course, models.Topic.course_id == models.Course.id).filter(
        models.Course.user_id == current_user.id
    ).count()

    completed_topics = db.query(models.Topic).join(models.Course, models.Topic.course_id == models.Course.id).filter(
        models.Course.user_id == current_user.id,
        models.Topic.is_completed == True
    ).count()

    quiz_attempts = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).all()
    passed_attempts = [a for a in quiz_attempts if a.passed]
    avg_quiz_percent = 0.0
    if quiz_attempts:
        avg_quiz_percent = (len(passed_attempts) / len(quiz_attempts)) * 100

    total_minutes = db.query(func.coalesce(func.sum(models.ProgressTracking.time_spent_minutes), 0.0)).filter(
        models.ProgressTracking.user_id == current_user.id
    ).scalar() or 0.0

    now = datetime.datetime.utcnow()
    month_labels = []
    month_hours = []
    for i in range(11, -1, -1):
        month_dt = (now.replace(day=1) - datetime.timedelta(days=31 * i)).replace(day=1)
        next_month = (month_dt + datetime.timedelta(days=32)).replace(day=1)
        minutes = db.query(func.coalesce(func.sum(models.ProgressTracking.time_spent_minutes), 0.0)).filter(
            models.ProgressTracking.user_id == current_user.id,
            models.ProgressTracking.engaged_date >= month_dt,
            models.ProgressTracking.engaged_date < next_month
        ).scalar() or 0.0

        month_labels.append(month_dt.strftime("%b"))
        month_hours.append({"month": month_dt.strftime("%b"), "hours": round(minutes / 60.0, 2)})

    completion_percent = 0.0
    if total_topics > 0:
        completion_percent = (completed_topics / total_topics) * 100

    # Count fully completed courses (all topics done)
    courses = db.query(models.Course).filter(models.Course.user_id == current_user.id).all()
    courses_completed = 0
    for course in courses:
        topics = db.query(models.Topic).filter(models.Topic.course_id == course.id).all()
        if topics and all(t.is_completed for t in topics):
            courses_completed += 1

    return {
        "hours_spent_minutes": round(float(total_minutes), 2),
        "avg_quiz_percent": round(float(avg_quiz_percent), 2),
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "completion_percent": round(float(completion_percent), 2),
        "monthly_hours": month_hours,
        "courses_completed": courses_completed,
    }

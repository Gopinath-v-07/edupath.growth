from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app import models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.services import ai_service

router = APIRouter(prefix="/groups", tags=["Groups"])

def get_group_with_members(group_id: int, db: Session):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        return None
    members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    
    members_list = []
    for m in members:
        user = db.query(models.User).filter(models.User.id == m.user_id).first()
        members_list.append({
            "id": m.id,
            "user_id": m.user_id,
            "role": m.role,
            "joined_at": m.joined_at,
            "user_name": user.name if user else "Unknown"
        })
        
    return {
        "id": group.id,
        "name": group.name,
        "created_by_id": group.created_by_id,
        "created_at": group.created_at,
        "members": members_list
    }

@router.post("/", response_model=schemas.GroupResponse)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_group = models.Group(name=group.name, created_by_id=current_user.id)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    
    # Add creator as admin member
    member = models.GroupMember(group_id=new_group.id, user_id=current_user.id, role="admin")
    db.add(member)
    db.commit()
    
    return get_group_with_members(new_group.id, db)

@router.post("/{group_id}/join", response_model=schemas.GroupResponse)
def join_group(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
        
    existing_member = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id, 
        models.GroupMember.user_id == current_user.id
    ).first()
    
    if existing_member:
        return get_group_with_members(group_id, db)
        
    member = models.GroupMember(group_id=group_id, user_id=current_user.id, role="member")
    db.add(member)
    db.commit()
    
    return get_group_with_members(group_id, db)

@router.get("/my_groups", response_model=List[schemas.GroupResponse])
def get_user_groups(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_memberships = db.query(models.GroupMember).filter(models.GroupMember.user_id == current_user.id).all()
    group_ids = [m.group_id for m in user_memberships]
    
    groups = []
    for gid in group_ids:
        grouped = get_group_with_members(gid, db)
        if grouped:
            groups.append(grouped)
        
    return groups

@router.get("/{group_id}/dashboard")
def get_group_dashboard(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify membership
    member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    
    # Fetch all members and their stats
    members_data = []
    group_members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    
    for gm in group_members:
        user = db.query(models.User).filter(models.User.id == gm.user_id).first()
        profile = db.query(models.Profile).filter(models.Profile.user_id == gm.user_id).first()
        streak = db.query(models.GroupStreak).filter(models.GroupStreak.group_id == group_id, models.GroupStreak.user_id == gm.user_id).first()
        
        # Calculate today's study hours
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        logs_today = db.query(models.GroupStudyLog).filter(
            models.GroupStudyLog.group_id == group_id,
            models.GroupStudyLog.user_id == gm.user_id,
            models.GroupStudyLog.timestamp >= today_start
        ).all()
        today_minutes = sum(log.duration_minutes for log in logs_today)
        
        # Calculate weekly study hours
        week_start = today_start - timedelta(days=7)
        logs_week = db.query(models.GroupStudyLog).filter(
            models.GroupStudyLog.group_id == group_id,
            models.GroupStudyLog.user_id == gm.user_id,
            models.GroupStudyLog.timestamp >= week_start
        ).all()
        week_minutes = sum(log.duration_minutes for log in logs_week)
        
        # Find strongest topic from logs_week
        topic_time = {}
        for log in logs_week:
            topic_time[log.topic] = topic_time.get(log.topic, 0) + log.duration_minutes
        
        strongest_topic = max(topic_time.items(), key=lambda x: x[1])[0] if topic_time else "None"
        
        members_data.append({
            "user_id": user.id,
            "name": user.name,
            "profile_photo": f"https://api.dicebear.com/7.x/initials/svg?seed={user.name}",
            "role": gm.role,
            "goal": profile.short_term_goal if profile else "No goal set",
            "today_study_hours": round(today_minutes / 60, 1),
            "weekly_study_hours": round(week_minutes / 60, 1),
            "weekly_completion_percentage": min(100, int((week_minutes / (60 * 10)) * 100)), # Assuming 10 hours/week goal
            "current_streak": streak.current_streak if streak else 0,
            "strongest_topic": strongest_topic
        })
        
    # Generate Leaderboard (Today, This Week, This Month can be done client-side or we return total stats)
    # the frontend will sort by weekly_study_hours and current_streak
    
    return {
        "group": {
            "id": group.id,
            "name": group.name
        },
        "members": members_data
    }

@router.get("/{group_id}/insights")
def get_group_insights(group_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    logs = db.query(models.GroupStudyLog).filter(models.GroupStudyLog.group_id == group_id).order_by(models.GroupStudyLog.timestamp.desc()).limit(100).all()
    members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    user_names = {m.user_id: db.query(models.User).filter(models.User.id == m.user_id).first().name for m in members}
    
    log_data = [{"user": user_names.get(log.user_id, "Unknown"), "topic": log.topic, "duration": log.duration_minutes} for log in logs]
    
    try:
        insights = ai_service.generate_group_insights(json.dumps(log_data))
        return insights
    except Exception as e:
        return {
            "group_strength": "Self-learning",
            "weak_topic": "Unknown",
            "most_consistent_member": "All members",
            "improvement_suggestion": "We cannot generate insights right now.",
            "motivation_message": "Keep studying!"
        }

@router.post("/{group_id}/study_logs")
def add_study_log(group_id: int, log_data: schemas.GroupStudyLogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    study_log = models.GroupStudyLog(
        group_id=group_id,
        user_id=current_user.id,
        topic=log_data.topic,
        duration_minutes=log_data.duration_minutes
    )
    db.add(study_log)
    
    # Update streak
    streak = db.query(models.GroupStreak).filter(models.GroupStreak.group_id == group_id, models.GroupStreak.user_id == current_user.id).first()
    today = datetime.utcnow()
    
    if streak:
        if streak.last_study_date and streak.last_study_date.date() == (today - timedelta(days=1)).date():
            streak.current_streak += 1
            streak.longest_streak = max(streak.current_streak, streak.longest_streak)
        elif not streak.last_study_date or streak.last_study_date.date() < (today - timedelta(days=1)).date():
            streak.current_streak = 1
        streak.last_study_date = today
    else:
        streak = models.GroupStreak(group_id=group_id, user_id=current_user.id, current_streak=1, longest_streak=1, last_study_date=today)
        db.add(streak)
        
    db.commit()
    
    db.commit()
    
    return {"message": "Study log added successfully"}


# --- Doubt Board Endpoints ---

@router.get("/{group_id}/doubts", response_model=List[schemas.GroupDoubtResponse])
def get_group_doubts(group_id: int, db: Session = Depends(get_db)):
    doubts = db.query(models.GroupDoubt).filter(models.GroupDoubt.group_id == group_id).order_by(models.GroupDoubt.created_at.desc()).all()
    # attach user_name
    result = []
    for d in doubts:
        user = db.query(models.User).filter(models.User.id == d.user_id).first()
        d_dict = d.__dict__.copy()
        d_dict["user_name"] = user.name if user else "Unknown"
        d_dict["replies"] = []
        for r in d.replies:
            ru = db.query(models.User).filter(models.User.id == r.user_id).first()
            r_dict = r.__dict__.copy()
            r_dict["user_name"] = ru.name if ru else "Unknown"
            d_dict["replies"].append(r_dict)
        result.append(d_dict)
    return result

@router.post("/{group_id}/doubts", response_model=schemas.GroupDoubtResponse)
def create_group_doubt(group_id: int, doubt: schemas.GroupDoubtCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_doubt = models.GroupDoubt(group_id=group_id, user_id=current_user.id, title=doubt.title, description=doubt.description)
    db.add(new_doubt)
    db.commit()
    db.refresh(new_doubt)
    d_dict = new_doubt.__dict__.copy()
    d_dict["user_name"] = current_user.name
    d_dict["replies"] = []
    return d_dict

@router.post("/{group_id}/doubts/{doubt_id}/reply", response_model=schemas.GroupDoubtReplyResponse)
def add_doubt_reply(group_id: int, doubt_id: int, reply: schemas.GroupDoubtReplyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_reply = models.GroupDoubtReply(doubt_id=doubt_id, user_id=current_user.id, content=reply.content)
    db.add(new_reply)
    db.commit()
    db.refresh(new_reply)
    r_dict = new_reply.__dict__.copy()
    r_dict["user_name"] = current_user.name
    return r_dict

@router.put("/{group_id}/doubts/{doubt_id}/resolve")
def resolve_doubt(group_id: int, doubt_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doubt = db.query(models.GroupDoubt).filter(models.GroupDoubt.id == doubt_id).first()
    if doubt and (doubt.user_id == current_user.id or current_user.is_superuser):
        doubt.is_resolved = True
        db.commit()
        return {"message": "Doubt resolved"}
    raise HTTPException(status_code=403, detail="Unauthorized")

# --- Challenges Endpoints ---

@router.get("/{group_id}/challenges", response_model=List[schemas.GroupChallengeResponse])
def get_group_challenges(group_id: int, db: Session = Depends(get_db)):
    challenges = db.query(models.GroupChallenge).filter(models.GroupChallenge.group_id == group_id).order_by(models.GroupChallenge.created_at.desc()).all()
    return challenges

@router.post("/{group_id}/challenges", response_model=schemas.GroupChallengeResponse)
def create_group_challenge(group_id: int, challenge: schemas.GroupChallengeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    expires = datetime.utcnow() + timedelta(days=7)
    new_challenge = models.GroupChallenge(
        group_id=group_id, title=challenge.title, description=challenge.description, 
        created_by_id=current_user.id, expires_at=expires
    )
    db.add(new_challenge)
    db.commit()
    db.refresh(new_challenge)
    return new_challenge

# --- Settings Endpoints ---

@router.put("/{group_id}")
def update_group_settings(group_id: int, name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    if not member or member.role != "admin":
        raise HTTPException(status_code=403, detail="Must be admin to update settings")
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if group:
        group.name = name
        db.commit()
        return {"message": "Settings updated"}
    raise HTTPException(status_code=404, detail="Not found")

@router.delete("/{group_id}/members/{user_id}")
def remove_group_member(group_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == current_user.id).first()
    # admin or self
    if not member or (member.role != "admin" and current_user.id != user_id):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    target_member = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id, models.GroupMember.user_id == user_id).first()
    if target_member:
        db.delete(target_member)
        db.commit()
        return {"message": "Member removed"}
    raise HTTPException(status_code=404, detail="Member not found")

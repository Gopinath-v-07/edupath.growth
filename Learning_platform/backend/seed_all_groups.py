import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
import app.models as models
from datetime import datetime, timedelta

def seed_all_groups():
    db = SessionLocal()
    try:
        groups = db.query(models.Group).all()
        if not groups:
            print("No groups exist to seed data into.")
            return

        # Ensure we have a mock user for replies
        mock_user = db.query(models.User).filter(models.User.email == "system_tutor@example.com").first()
        if not mock_user:
            mock_user = models.User(name="System Tutor", email="system_tutor@example.com", password_hash="dummy")
            db.add(mock_user)
            db.commit()
            db.refresh(mock_user)

        for group in groups:
            print(f"Seeding data for group: {group.name} (ID: {group.id})")
            
            # 1. Add missing challenges
            ex_chal = db.query(models.GroupChallenge).filter(models.GroupChallenge.group_id == group.id).first()
            if not ex_chal:
                challenge = models.GroupChallenge(
                    group_id=group.id,
                    title=f"Weekly Challenge: {group.name}",
                    description="Let's hit 20 hours of collective focus this week!",
                    created_by_id=group.created_by_id or mock_user.id,
                    expires_at=datetime.utcnow() + timedelta(days=7)
                )
                db.add(challenge)
            
            # 2. Add missing doubts
            ex_doubt = db.query(models.GroupDoubt).filter(models.GroupDoubt.group_id == group.id).first()
            if not ex_doubt:
                doubt = models.GroupDoubt(
                    group_id=group.id,
                    user_id=mock_user.id,
                    title="How exactly does the group grading work?",
                    description="I saw we have a team score in the roadmap, does anyone know how it's calculated?",
                )
                db.add(doubt)
                db.commit()
                db.refresh(doubt)
                
                # Add reply
                reply = models.GroupDoubtReply(
                    doubt_id=doubt.id,
                    user_id=mock_user.id,
                    content="The team score is an aggregate of all module quiz results and focus time!"
                )
                db.add(reply)
                
        db.commit()
        print("Successfully seeded challenges and doubts into ALL existing groups!")

    except Exception as e:
        print("Error:", str(e))
    finally:
        db.close()

if __name__ == "__main__":
    seed_all_groups()

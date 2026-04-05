import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
import app.models as models
from datetime import datetime, timedelta

def seed_data():
    db = SessionLocal()
    try:
        print("Checking tables and seeding dummy data...")
        
        # 1. Ensure we have at least two users
        user1 = db.query(models.User).filter(models.User.email == "alice@example.com").first()
        if not user1:
            user1 = models.User(name="Alice", email="alice@example.com", password_hash="dummy_hash")
            db.add(user1)
            
        user2 = db.query(models.User).filter(models.User.email == "bob@example.com").first()
        if not user2:
            user2 = models.User(name="Bob", email="bob@example.com", password_hash="dummy_hash")
            db.add(user2)
            
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        print(f"Verified Users: {user1.name}, {user2.name}")

        # 2. Create a Group
        group = db.query(models.Group).filter(models.Group.name == "Render Testing Group").first()
        if not group:
            group = models.Group(name="Render Testing Group", created_by_id=user1.id)
            db.add(group)
            db.commit()
            db.refresh(group)
        print(f"Verified Group: {group.name}")
        
        # 3. Add Members
        member1 = db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == user1.id).first()
        if not member1:
            member1 = models.GroupMember(group_id=group.id, user_id=user1.id, role="admin")
            db.add(member1)
            
        member2 = db.query(models.GroupMember).filter(models.GroupMember.group_id == group.id, models.GroupMember.user_id == user2.id).first()
        if not member2:
            member2 = models.GroupMember(group_id=group.id, user_id=user2.id, role="member")
            db.add(member2)
            
        db.commit()
        print("Verified Group Members!")

        # 4. Create a Challenge
        expires = datetime.utcnow() + timedelta(days=5)
        challenge = db.query(models.GroupChallenge).filter(models.GroupChallenge.group_id == group.id).first()
        if not challenge:
            challenge = models.GroupChallenge(
                group_id=group.id,
                title="Conquer React Router",
                description="Everyone needs to finish the router documentation this week.",
                created_by_id=user1.id,
                expires_at=expires
            )
            db.add(challenge)
            db.commit()
        print(f"Verified Challenges connection!")

        # 5. Create a Doubt
        doubt = db.query(models.GroupDoubt).filter(models.GroupDoubt.group_id == group.id).first()
        if not doubt:
            doubt = models.GroupDoubt(
                group_id=group.id,
                user_id=user2.id,
                title="Why is my useEffect running twice?",
                description="In development, my API gets called twice, what is strict mode?"
            )
            db.add(doubt)
            db.commit()
            db.refresh(doubt)
            print(f"Verified Group Doubt connection!")
        else:
            print(f"Doubt already exists: {doubt.title}")

        # 6. Create a Reply
        reply = db.query(models.GroupDoubtReply).filter(models.GroupDoubtReply.doubt_id == doubt.id).first()
        if not reply:
            reply = models.GroupDoubtReply(
                doubt_id=doubt.id,
                user_id=user1.id,
                content="React 18 Strict Mode mounts, unmounts, and remounts components to help find bugs. It won't happen in production!"
            )
            db.add(reply)
            db.commit()
            print("Verified Doubt Replies connection!")
        else:
            print("Reply already exists!")

        print("\nSUCCESS: All new tables are connected properly and populated with dummy data.")

    except Exception as e:
        print("\nERROR:")
        print(str(e))
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

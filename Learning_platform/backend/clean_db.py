from app.database import SessionLocal
from app.models import Course

db = SessionLocal()

try:
    courses = db.query(Course).filter(Course.title.like("Goal:%")).all()
    for course in courses:
        try:
            # Extract basic goal name
            clean_title = course.title.split("Goal: ")[1].split(".")[0].strip()
        except Exception:
            clean_title = "My Goal"
        
        print(f"Updating Course {course.id}: {course.title[:30]}... -> {clean_title}")
        course.title = clean_title
        db.add(course)
        
    db.commit()
    print("Database titles cleaned up via SQLAlchemy.")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()

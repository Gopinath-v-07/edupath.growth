from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app import schemas, models, auth, database
from app.services import ai_service
from typing import List, Optional
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
try:
    from openai import OpenAI
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    HAS_OPENAI = bool(os.getenv("OPENAI_API_KEY"))
except Exception:
    client = None
    HAS_OPENAI = False

router = APIRouter(
    prefix="/roadmap",
    tags=["Roadmap"]
)

@router.get("/courses")
def get_courses(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    courses = db.query(models.Course).filter(models.Course.user_id == current_user.id).order_by(models.Course.id.desc()).all()
    result = []
    for c in courses:
        total = db.query(models.Topic).filter(models.Topic.course_id == c.id).count()
        completed = db.query(models.Topic).filter(models.Topic.course_id == c.id, models.Topic.is_completed == True).count()
        result.append({
            "id": c.id,
            "title": c.title,
            "total_topics": total,
            "completed_topics": completed
        })
    return {"courses": result}

@router.post("/generate")
async def generate_roadmap(
    request: schemas.RoadmapGenerateRequest, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    course = db.query(models.Course).filter(models.Course.id == request.course_id, models.Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check preferred mode
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    mode = profile.preferred_mode if profile else 'Syllabus'
    
    if mode == 'Skill' or not course.extracted_text:
        # Generate skill-based roadmap targeting gaps
        scores = db.query(models.SkillScore).filter(models.SkillScore.user_id == current_user.id).all()
        weaknesses = [s.skill_name for s in scores if s.classification in ['Foundation', 'Basic']]
        
        prompt = f"""
        The user's primary learning goal is: '{course.title}'.
        Generate a structured 7-day learning roadmap (minimum 7 topics, one per day) based on this goal.
        Also, try to target these weak skills if applicable: {', '.join(weaknesses) if weaknesses else 'Python, Communication, Problem Solving'}.
        For each topic, provide:
        1. A 'title' (include the day number, e.g. "Day 1: ...") 
        2. A 'content' section formatted in Markdown. It MUST include a "**Study Time: ...**" header, a brief theory section, and a "**Practice Exercises**" section with 2-3 bullet points of hands-on tasks.
        3. A 'youtube_query' string that is highly optimized for searching a tutorial on YouTube for this specific topic.
        Provide the output ONLY as a JSON array of objects with keys 'title', 'content', and 'youtube_query'.
        """
    else:
        # Generate syllabus-based roadmap
        prompt = f"""
        The user's primary learning goal is: '{course.title}'.
        Analyze the following syllabus text and generate a structured 7-day learning roadmap (minimum 7 topics, one per day).
        Break it down into a logical sequence of topics aligned with their learning goal.
        For each topic, provide:
        1. A 'title' (include the day number, e.g. "Day 1: ...")
        2. A 'content' section formatted in Markdown. It MUST include a "**Study Time: ...**" header, detailed theory notes, and a "**Practice Exercises**" section with 2-3 actionable practice steps derived from the syllabus.
        3. A 'youtube_query' string that is highly optimized for searching a tutorial on YouTube for this specific topic.
        Provide the output ONLY as a JSON array of objects with keys 'title', 'content', and 'youtube_query'.
        
        Syllabus Text:
        {course.extracted_text[:3000]}
        """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert curriculum designer. ALWAYS return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        content = response.choices[0].message.content
        topics_data = json.loads(content)
        
        # Save topics to DB
        created_topics = []
        for i, t_data in enumerate(topics_data):
            # Store the rich data (content + youtube_query) as a JSON string in the Text column
            import json
            rich_content = json.dumps({
                "notes": t_data.get("content", ""),
                "youtube_query": t_data.get("youtube_query", f"{t_data.get('title')} tutorial")
            })
            
            topic = models.Topic(
                course_id=course.id,
                title=t_data.get("title", f"Topic {i+1}"),
                content=rich_content,
                order=i,
                is_unlocked=(i == 0) # Only first topic is unlocked initially
            )
            db.add(topic)
            created_topics.append(topic)
            
        db.commit()
        return {"status": "success", "message": f"{len(created_topics)} topics generated."}

    except Exception as e:
        # Fallback if OpenAI fails or key is invalid
        fallback_topics = [
            models.Topic(course_id=course.id, title="Introduction to the Subject", content="Basic concepts and definitions.", order=0, is_unlocked=True),
            models.Topic(course_id=course.id, title="Core Principles", content="Deep dive into the main theories.", order=1),
            models.Topic(course_id=course.id, title="Advanced Applications", content="Real-world examples.", order=2)
        ]
        db.add_all(fallback_topics)
        db.commit()
        return {"status": "success", "message": "Generated fallback topics due to AI error.", "error": str(e)}

@router.post("/generate_from_goal")
async def generate_roadmap_from_goal(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile or not profile.short_term_goal:
        raise HTTPException(status_code=400, detail="Profile goals not set. Please complete profile first.")
    
    # Create a Course placeholder for this Goal
    course_title = profile.short_term_goal
    
    course = models.Course(
        user_id=current_user.id,
        title=course_title,
        extracted_text=f"Short term goal: {profile.short_term_goal}. Long term goal: {profile.long_term_goal}.",
        s3_url=None
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    prompt = f"""
    The user wants to achieve this short-term goal: "{profile.short_term_goal}".
    Their long-term aspiration is: "{profile.long_term_goal}".
    Generate a highly structured, 7-day step-by-step learning roadmap (exactly 7 topics) to achieve this short-term goal.
    
    For each topic in the roadmap, provide:
    1. A 'title' (include the day number, e.g. "Day 1: ...")
    2. A 'content' section containing detailed notes formatted in Markdown. It MUST include a "Study Time" header (e.g., "**Study Time: 01:00 PM - 03:30 PM**") and a "**Practice Exercises**" section with 2-4 actionable bullet points on what they must physically practice.
    3. A 'youtube_query' string that is highly optimized for searching a tutorial on YouTube for this specific topic.
    Provide the output ONLY as a JSON array of objects with keys 'title', 'content', and 'youtube_query'.
    """

    if not HAS_OPENAI or not client:
        raise HTTPException(status_code=503, detail="AI service not configured. Please set OPENAI_API_KEY.")

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert curriculum designer. ALWAYS return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        content = response.choices[0].message.content
        topics_data = json.loads(content)
        
        created_topics = []
        for i, t_data in enumerate(topics_data):
            rich_content = json.dumps({
                "notes": t_data.get("content", ""),
                "youtube_query": t_data.get("youtube_query", f"{t_data.get('title')} tutorial")
            })
            
            topic = models.Topic(
                course_id=course.id,
                title=t_data.get("title", f"Step {i+1}"),
                content=rich_content,
                order=i,
                is_unlocked=(i == 0)
            )
            db.add(topic)
            created_topics.append(topic)
            
        db.commit()
        return {"status": "success", "course_id": course.id, "message": f"{len(created_topics)} topics generated."}

    except Exception as e:
        # Fallback if OpenAI fails
        fallback_topics = [
            models.Topic(course_id=course.id, title="Getting Started", content=json.dumps({"notes": "Basics to reach your goal.", "youtube_query": f"{course_title} basics"}), order=0, is_unlocked=True),
            models.Topic(course_id=course.id, title="Intermediate Steps", content=json.dumps({"notes": "Building momentum.", "youtube_query": f"{course_title} intermediate"}), order=1),
            models.Topic(course_id=course.id, title="Final Mastery", content=json.dumps({"notes": "Achieving the goal.", "youtube_query": f"{course_title} advanced"}), order=2)
        ]
        db.add_all(fallback_topics)
        db.commit()
        return {"status": "success", "course_id": course.id, "message": "Generated fallback topics.", "error": str(e)}

@router.post("/generate_custom")
async def generate_custom_roadmap(
    request: schemas.CustomRoadmapRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Generate a roadmap from a specific subject + desired number of topics."""
    subject = request.subject.strip()
    num_topics = max(1, min(request.num_topics or 7, 90))  # 1 topic per day, max 90
    description = request.description.strip() if request.description else "No context provided"
    duration = request.duration.strip() if request.duration else "Not specified"

    prompt = f"""Create a structured day-by-day learning roadmap for the student's goal.
Goal: "{subject}"
Context/Description: "{description}"
Duration: "{duration}"

Generate EXACTLY {num_topics} topics. Each topic = one day of learning (Day 1 to Day {num_topics}).
Topics must progress logically from beginner to advanced.

Provide a short, clean "course_title" (max 5 words) encapsulating the overall goal.
For each topic provide:
1. 'title' — must start with "Day X:" (e.g. "Day 1: Introduction to {subject}")
2. 'content' — Detailed study notes for that day formatted in Markdown. It MUST include:
    - A 'Study Time' header (e.g., "**Study Time: 09:30 AM - 12:30 PM**")
    - A comprehensive "Notes" section explaining the concepts deeply.
    - A specifically labeled "**Practice Exercises**" section with 3-4 actionable bullet points on what the user should build, practice, or do today.
3. 'youtube_query' — effective YouTube search query for a tutorial on this topic

Return ONLY a valid JSON object:
{{
  "course_title": "...",
  "topics": [
    {{ "title": "Day 1: ...", "content": "...", "youtube_query": "..." }}
  ]
}}"""

    try:
        # Use larger context model for big roadmaps
        model_name = "gpt-3.5-turbo-16k" if num_topics > 20 else "gpt-3.5-turbo"
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are an expert curriculum designer. ALWAYS return a valid JSON object with no extra text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        raw = response.choices[0].message.content
        # Strip markdown code blocks if present
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        
        parsed_data = json.loads(raw.strip())
        course_title = parsed_data.get("course_title", subject[:50])
        topics_data = parsed_data.get("topics", [])

        # Now create the Course since we have a clean title
        course = models.Course(
            user_id=current_user.id,
            title=course_title,
            extracted_text=f"Goal: {subject}. Context: {description}. Duration: {duration}",
            s3_url=None
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        created_topics = []
        for i, t_data in enumerate(topics_data[:num_topics]):
            rich_content = json.dumps({
                "notes": t_data.get("content", ""),
                "youtube_query": t_data.get("youtube_query", f"{t_data.get('title', subject)} tutorial")
            })
            topic = models.Topic(
                course_id=course.id,
                title=t_data.get("title", f"Topic {i+1}"),
                content=rich_content,
                order=i,
                is_unlocked=(i == 0)
            )
            db.add(topic)
            created_topics.append(topic)

        db.commit()
        return {"status": "success", "course_id": course.id, "message": f"{len(created_topics)} topics generated."}

    except Exception as e:
        print(f"[generate_custom_roadmap] OpenAI error: {e}")
        # Dynamic fallback — generate exactly num_topics Day-by-Day topics
        course = models.Course(
            user_id=current_user.id,
            title=subject[:50],
            extracted_text=f"Custom study plan for: {subject}",
            s3_url=None
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        # Template phases that cycle for any number of days
        phase_templates = [
            ("Introduction & Overview", "Core concepts and definitions"),
            ("Setup & Environment", "Tools, setup, and environment configuration"),
            ("Fundamentals", "Key principles and foundational knowledge"),
            ("Core Techniques", "Primary techniques and methods in practice"),
            ("Hands-On Practice", "Practical exercises and drills"),
            ("Deep Dive", "In-depth study of advanced concepts"),
            ("Real-World Application", "Applying knowledge to real scenarios"),
            ("Problem Solving", "Common challenges and how to overcome them"),
            ("Project Work", "Building something concrete with learned skills"),
            ("Review & Assessment", "Consolidating knowledge and testing understanding"),
        ]

        fallback_topics = []
        for i in range(num_topics):
            phase_title, phase_desc = phase_templates[i % len(phase_templates)]
            day_label = f"Day {i+1}: {phase_title}"
            fallback_topics.append(models.Topic(
                course_id=course.id,
                title=day_label,
                content=json.dumps({
                    "notes": f"{phase_desc} for {subject}. This day focuses on building structured knowledge and practical skills in this area.",
                    "youtube_query": f"{subject} {phase_title.lower()} tutorial"
                }),
                order=i,
                is_unlocked=(i == 0)
            ))

        db.add_all(fallback_topics)
        db.commit()
        return {"status": "success", "course_id": course.id, "message": f"Generated {num_topics} topics (offline mode).", "error": str(e)}

@router.get("/course/{course_id}/topics")
def get_course_topics(
    course_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    topics = db.query(models.Topic).filter(models.Topic.course_id == course_id).order_by(models.Topic.order).all()
    return {"topics": topics}

@router.get("/topic/{topic_id}", response_model=schemas.TopicResponse)
def get_topic(
    topic_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    # Check if this course belongs to user
    course = db.query(models.Course).filter(models.Course.id == topic.course_id, models.Course.user_id == current_user.id).first()
    if not course:
        raise HTTPException(status_code=403, detail="Not authorized to access this topic")
        
    if not topic.is_unlocked:
        raise HTTPException(status_code=403, detail="Topic is locked. Pass the previous quiz to unlock.")
        
    return topic


@router.get("/topic/{topic_id}/materials")
async def get_topic_materials(
    topic_id: int,
    query: str = Query(default="", description="Optional user question for extra tailored content"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Generate and return AI study materials for a specific topic.
    Accepts an optional 'query' param so users can request targeted content.
    """
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Security: ensure topic belongs to this user's course
    course = db.query(models.Course).filter(
        models.Course.id == topic.course_id,
        models.Course.user_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="Not authorized to access this topic")

    # Parse notes from stored content
    try:
        parsed = json.loads(topic.content or "{}")
        notes_text = parsed.get("notes", topic.content or "")
    except Exception:
        notes_text = topic.content or ""

    materials = ai_service.generate_topic_materials(
        topic_title=topic.title,
        topic_content=notes_text,
        user_query=query
    )
    return {"topic_id": topic_id, "title": topic.title, "materials": materials}


class FeedbackRequest(BaseModel):
    rating: int = 0          # 1-5 stars (0 = not set)
    helpful: Optional[bool] = None
    comment: Optional[str] = ""


@router.post("/topic/{topic_id}/feedback")
def submit_topic_feedback(
    topic_id: int,
    feedback: FeedbackRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Accept learner feedback for a topic module."""
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    course = db.query(models.Course).filter(
        models.Course.id == topic.course_id,
        models.Course.user_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Log feedback (extendable: store in DB if a Feedback model is added)
    print(f"[FEEDBACK] user={current_user.id} topic={topic_id} "
          f"rating={feedback.rating} helpful={feedback.helpful} comment={feedback.comment!r}")

    return {"status": "success", "message": "Feedback received. Thank you!"}

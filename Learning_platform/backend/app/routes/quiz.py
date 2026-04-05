from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import schemas, models, auth, database
from app.services import ai_service
import json

router = APIRouter(
    prefix="/quiz",
    tags=["Quiz"]
)


def _parse_topic_notes(content: str) -> str:
    """Extract the plain notes text from a topic's content field (which may be JSON)."""
    if not content:
        return ""
    try:
        parsed = json.loads(content)
        # Stored as {"notes": "...", "youtube_query": "..."}
        return parsed.get("notes", content)
    except (json.JSONDecodeError, TypeError):
        return content


@router.get("/topic/{topic_id}")
def get_quiz_questions(
    topic_id: int,
    regenerate: bool = Query(default=False, description="Force regenerate quiz questions with AI"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    if not topic or not topic.is_unlocked:
        raise HTTPException(status_code=404, detail="Topic locked or not found")

    quiz = db.query(models.Quiz).filter(models.Quiz.topic_id == topic_id).first()

    # Regenerate if forced, or if the quiz doesn't exist, or if it still has fallback placeholder questions
    needs_regen = (
        regenerate
        or quiz is None
        or _is_fallback_quiz(quiz.questions_data if quiz else [])
    )

    if needs_regen:
        # Delete old quiz if it exists
        if quiz:
            db.delete(quiz)
            db.commit()

        # Parse the actual notes text — NOT the raw JSON string
        notes_text = _parse_topic_notes(topic.content)

        # Generate fresh AI questions — pass topic title for context
        questions = ai_service.generate_quiz_for_topic(notes_text, topic_title=topic.title)

        quiz = models.Quiz(
            topic_id=topic_id,
            questions_data=questions
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

    # Return questions without correct answers
    qtns_payload = []
    for idx, q in enumerate(quiz.questions_data):
        qtns_payload.append({
            "id": str(idx + 1),
            "question": q["question"],
            "options": q["options"]
        })

    return {
        "questions": qtns_payload,
        "topic_title": topic.title,
        "total": len(qtns_payload)
    }


def _is_fallback_quiz(questions_data: list) -> bool:
    """Detect if questions are the generic fallback placeholders."""
    if not questions_data:
        return True
    first_q = questions_data[0] if questions_data else {}
    question_text = first_q.get("question", "")
    first_options = first_q.get("options", [])

    # Old-style fallback: "Sample question 1" with "Option A/B/C/D"
    if question_text.startswith("Sample question"):
        return True

    # Old-style fallback options
    if first_options == ["Option A", "Option B", "Option C", "Option D"]:
        return True

    return False


@router.post("/submit/{topic_id}")
def submit_quiz(
    topic_id: int,
    submission: schemas.QuizSubmit,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    quiz = db.query(models.Quiz).filter(models.Quiz.topic_id == topic_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    correct_count = 0
    total = len(quiz.questions_data)

    for idx, q_data in enumerate(quiz.questions_data):
        q_id = str(idx + 1)
        if str(q_id) in submission.answers:
            if submission.answers[q_id] == q_data["answer_index"]:
                correct_count += 1

    passed = correct_count >= (total * 0.5)  # Pass if >= 50%

    attempt = models.QuizAttempt(
        user_id=current_user.id,
        topic_id=topic_id,
        score=correct_count,
        passed=passed
    )
    db.add(attempt)

    topic = db.query(models.Topic).filter(models.Topic.id == topic_id).first()
    topic.is_completed = passed

    if passed:
        # Unlock the next topic
        next_topic = db.query(models.Topic).filter(
            models.Topic.course_id == topic.course_id,
            models.Topic.order == topic.order + 1
        ).first()
        if next_topic:
            next_topic.is_unlocked = True
    else:
        # ── Failed: delete quiz so next attempt gets FRESH AI questions ──
        db.delete(quiz)

    db.commit()

    # Count how many attempts this user has made on this topic
    attempt_count = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.user_id == current_user.id,
        models.QuizAttempt.topic_id == topic_id
    ).count()

    return {
        "score": correct_count,
        "total": total,
        "passed": passed,
        "attempt_number": attempt_count,
        "message": (
            "Passed! Next topic unlocked." if passed
            else f"Scored below 50%. New questions will be generated for your next attempt (attempt {attempt_count})."
        )
    }

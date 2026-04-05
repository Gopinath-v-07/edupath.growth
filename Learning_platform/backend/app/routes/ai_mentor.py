from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app import models, database
from app.services import ai_service
import json
import re
import math

router = APIRouter(prefix="/mentor", tags=["AI Mentor"])

class ChatMessage(BaseModel):
    role: str   # "user" | "mentor"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


MAX_PERSISTED_HISTORY = 20
MAX_PERSISTED_ROWS = 200
_EMBED_CACHE = {}


def _extract_topic_notes(raw_content: str) -> str:
    """Topic content may be plain text or a JSON string with a 'notes' key."""
    if not raw_content:
        return ""

    try:
        parsed = json.loads(raw_content)
        if isinstance(parsed, dict):
            return str(parsed.get("notes") or parsed.get("content") or "")
    except Exception:
        pass

    return raw_content


def _tokens(text: str) -> set:
    words = re.findall(r"[a-z0-9]+", (text or "").lower())
    return {w for w in words if len(w) > 2}


def _cosine_similarity(a: list, b: list) -> float:
    if not a or not b or len(a) != len(b):
        return -1.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return -1.0
    return dot / (norm_a * norm_b)


def _embed_text_cached(text: str):
    key = (text or "").strip()
    if not key:
        return None
    cached = _EMBED_CACHE.get(key)
    if cached is not None:
        return cached

    emb = ai_service.get_text_embedding(key)
    _EMBED_CACHE[key] = emb
    return emb


def _load_persistent_history(db: Session, user_id: int, limit: int = MAX_PERSISTED_HISTORY) -> List[dict]:
    rows = (
        db.query(models.MentorChatMessage)
        .filter(models.MentorChatMessage.user_id == user_id)
        .order_by(models.MentorChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    rows = list(reversed(rows))
    return [{"role": r.role, "content": r.content} for r in rows]


def _persist_chat_turn(db: Session, user_id: int, user_text: str, assistant_text: str) -> None:
    db.add(models.MentorChatMessage(user_id=user_id, role="user", content=user_text))
    db.add(models.MentorChatMessage(user_id=user_id, role="assistant", content=assistant_text))
    db.commit()

    total = db.query(models.MentorChatMessage).filter(models.MentorChatMessage.user_id == user_id).count()
    if total > MAX_PERSISTED_ROWS:
        overflow = total - MAX_PERSISTED_ROWS
        old_rows = (
            db.query(models.MentorChatMessage)
            .filter(models.MentorChatMessage.user_id == user_id)
            .order_by(models.MentorChatMessage.id.asc())
            .limit(overflow)
            .all()
        )
        for row in old_rows:
            db.delete(row)
        db.commit()


def _build_user_roadmap_rag_context(db: Session, user_id: int, query: str) -> str:
    """
    Build compact, grounded context from user's own roadmap/progress data.
    This provides RAG-like retrieval over DB records without external vector infra.
    """
    courses = (
        db.query(models.Course)
        .filter(models.Course.user_id == user_id)
        .order_by(models.Course.id.desc())
        .limit(6)
        .all()
    )

    topic_rows = []
    total_topics = 0
    completed_topics = 0

    for course in courses:
        topics = (
            db.query(models.Topic)
            .filter(models.Topic.course_id == course.id)
            .order_by(models.Topic.order.asc())
            .all()
        )
        for t in topics:
            total_topics += 1
            if t.is_completed:
                completed_topics += 1
            notes = _extract_topic_notes(t.content)
            topic_rows.append(
                {
                    "course": course.title,
                    "title": t.title,
                    "notes": notes[:1000],
                    "is_completed": bool(t.is_completed),
                    "is_unlocked": bool(t.is_unlocked),
                    "order": t.order or 0,
                }
            )

    q_tokens = _tokens(query)
    query_embedding = _embed_text_cached(query)

    def relevance(item: dict) -> float:
        text = f"{item['title']}\n{item['notes']}\nCourse: {item['course']}"
        token_score = 0.0
        if q_tokens:
            text_tokens = _tokens(text)
            token_score = float(len(q_tokens.intersection(text_tokens)))

        if query_embedding:
            topic_embedding = _embed_text_cached(text[:1400])
            emb_score = _cosine_similarity(query_embedding, topic_embedding)
            if emb_score >= 0:
                return emb_score * 10.0 + token_score

        return token_score

    ranked = sorted(topic_rows, key=lambda x: (relevance(x), x["is_completed"], -x["order"]), reverse=True)
    relevant_topics = [t for t in ranked if relevance(t) > 0][:4]

    if not relevant_topics:
        pending_topics = [t for t in topic_rows if not t["is_completed"] and t["is_unlocked"]]
        if pending_topics:
            relevant_topics = pending_topics[:3]
        else:
            relevant_topics = ranked[:3]

    score_rows = db.query(models.SkillScore).filter(models.SkillScore.user_id == user_id).all()
    weak_skills = sorted(score_rows, key=lambda s: s.score_percentage or 0)[:4]

    attempts = (
        db.query(models.QuizAttempt, models.Topic)
        .join(models.Topic, models.Topic.id == models.QuizAttempt.topic_id)
        .filter(models.QuizAttempt.user_id == user_id)
        .order_by(models.QuizAttempt.id.desc())
        .limit(5)
        .all()
    )

    completion_pct = round((completed_topics / total_topics) * 100, 1) if total_topics else 0.0

    lines = []
    lines.append("[USER LEARNING CONTEXT - USE THIS AS SOURCE OF TRUTH]")
    lines.append(f"Roadmap summary: {completed_topics}/{total_topics} topics completed ({completion_pct}%).")

    if weak_skills:
        weak_text = ", ".join(f"{s.skill_name} ({round(s.score_percentage or 0, 1)}%)" for s in weak_skills)
        lines.append(f"Weak skills to prioritize: {weak_text}.")

    if attempts:
        quiz_text = " | ".join(
            f"{topic.title}: {attempt.score}% ({'pass' if attempt.passed else 'not passed'})"
            for attempt, topic in attempts
        )
        lines.append(f"Recent quiz attempts: {quiz_text}.")

    if relevant_topics:
        lines.append("Most relevant roadmap topics:")
        for idx, t in enumerate(relevant_topics, 1):
            status = "completed" if t["is_completed"] else "in progress"
            brief_notes = (t["notes"] or "").replace("\n", " ").strip()
            if len(brief_notes) > 260:
                brief_notes = brief_notes[:260] + "..."
            lines.append(
                f"{idx}. [{t['course']}] {t['title']} ({status}) - {brief_notes}"
            )

    lines.append(
        "Mentor behavior rules: give actionable next steps, tie advice to the context above, "
        "and if data is missing, ask one concise follow-up question before assuming details."
    )

    context = "\n".join(lines)
    return context[:3800]


@router.post("/chat")
async def chat_with_mentor(
    request: ChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Chat with the AI Mentor using proper system/user/assistant message structure.
    """
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()

    user_name = (
        profile.full_name if profile and profile.full_name else current_user.name or "Learner"
    ).split()[0]
    short_term_goal = profile.short_term_goal if profile and profile.short_term_goal else "Learning new skills"
    rag_context = _build_user_roadmap_rag_context(db, current_user.id, request.message)

    # ── System prompt ────────────────────────────────────────────────────────
    system_prompt = (
        f"You are an enthusiastic, supportive, and highly knowledgeable AI Mentor "
        f"for an educational platform called EduPath. "
        f"The student's name is {user_name} and their current learning goal is: '{short_term_goal}'. "
        f"Your role is to act as an advisor, guide, and doubt clarifier. "
        f"Keep responses conversational, empathetic, and directly helpful. "
        f"If asked technical questions, explain clearly using analogies where helpful. "
        f"Prefer short paragraphs over bullet lists. Never be overly formal. "
        f"Always ground guidance in the retrieved user context below when relevant. "
        f"Do not hallucinate user progress or completed topics. "
        f"If query conflicts with context, politely clarify.\n\n"
        f"{rag_context}"
    )

    persisted_history = _load_persistent_history(db, current_user.id, limit=MAX_PERSISTED_HISTORY)

    # ── Build message array ──────────────────────────────────────────────────
    messages = [{"role": "system", "content": system_prompt}]

    # Prefer server-side persistent history for long-term mentor memory.
    history_source = persisted_history if persisted_history else [
        {"role": "user" if msg.role == "user" else "assistant", "content": msg.content}
        for msg in request.history[-8:]
    ]
    for msg in history_source:
        openai_role = "user" if msg["role"] == "user" else "assistant"
        messages.append({"role": openai_role, "content": msg["content"]})

    # Add current user message
    messages.append({"role": "user", "content": request.message})

    try:
        response_text = ai_service.chat_with_messages(messages, max_tokens=700)
        _persist_chat_turn(db, current_user.id, request.message, response_text)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to communicate with AI Mentor: {str(e)}"
        )

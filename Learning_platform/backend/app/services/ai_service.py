import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# ── Configure Gemini ─────────────────────────────────────────────────────────
_api_key = os.getenv("GEMINI_API_KEY", "").strip('"').strip("'")

if _api_key:
    _client = genai.Client(api_key=_api_key)
else:
    _client = None
    print("[AI Service] WARNING: GEMINI_API_KEY is not set.")


# ── Core helpers ─────────────────────────────────────────────────────────────

def _gemini_chat(prompt: str, temperature: float = 0.7, max_tokens: int = 800) -> str:
    """Send a single-turn prompt to Gemini and return the text response."""
    if not _client:
        return "AI service is not configured. Please set GEMINI_API_KEY."
    try:
        response = _client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        text = getattr(response, "text", None)
        if text:
            return text.strip()

        candidates = getattr(response, "candidates", None) or []
        if candidates:
            parts = getattr(candidates[0].content, "parts", None) or []
            joined = "".join(getattr(p, "text", "") for p in parts if getattr(p, "text", ""))
            if joined.strip():
                return joined.strip()

        return "I could not generate a response right now. Please try again."
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        raise


def _gemini_chat_messages(messages: list, temperature: float = 0.7, max_tokens: int = 800) -> str:
    """
    Multi-turn conversation using Gemini Chat API.
    messages: list of dicts with 'role' (system|user|assistant) and 'content'.
    Gemini uses 'user'/'model' roles — we map assistant → model.
    System messages are prepended to the first user message.
    """
    if not _client:
        return "AI service is not configured. Please set GEMINI_API_KEY."

    # Convert structured messages into a single transcript prompt.
    # This avoids SDK chat-shape drift and keeps behavior deterministic.
    system_text = ""
    transcript_lines = []
    for msg in messages:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if not content:
            continue
        if role == "system":
            system_text = content
        elif role in ("assistant", "model"):
            transcript_lines.append(f"Mentor: {content}")
        else:
            transcript_lines.append(f"User: {content}")

    transcript = "\n".join(transcript_lines)
    prompt = (
        f"{system_text}\n\n"
        "Continue the conversation as the mentor.\n"
        "Conversation:\n"
        f"{transcript}\n\n"
        "Mentor:"
    )

    try:
        return _gemini_chat(prompt, temperature=temperature, max_tokens=max_tokens)
    except Exception as e:
        print(f"[Gemini Chat] Error: {e}")
        raise


def get_text_embedding(text: str) -> list | None:
    """Return embedding vector for semantic retrieval. Returns None on failure."""
    if not _client or not text or not text.strip():
        return None
    models_to_try = ["text-embedding-004", "gemini-embedding-001"]

    for model_name in models_to_try:
        try:
            response = _client.models.embed_content(
                model=model_name,
                contents=text.strip(),
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )
            embeddings = getattr(response, "embeddings", None) or []
            if embeddings:
                values = getattr(embeddings[0], "values", None)
                if values:
                    return list(values)

            direct = getattr(response, "embedding", None)
            if direct and getattr(direct, "values", None):
                return list(direct.values)
        except Exception:
            try:
                response = _client.models.embed_content(
                    model=model_name,
                    contents=text.strip(),
                )
                embeddings = getattr(response, "embeddings", None) or []
                if embeddings:
                    values = getattr(embeddings[0], "values", None)
                    if values:
                        return list(values)

                direct = getattr(response, "embedding", None)
                if direct and getattr(direct, "values", None):
                    return list(direct.values)
            except Exception as e:
                print(f"[Gemini Embedding] {model_name} error: {e}")
    return None


def _mentor_fallback_response(messages: list) -> str:
    """
    Build a useful local mentor response when external AI is unavailable.
    Keeps the mentor feature functional instead of returning a hard failure string.
    """
    user_messages = [m.get("content", "") for m in messages if m.get("role") == "user"]
    system_messages = [m.get("content", "") for m in messages if m.get("role") == "system"]
    latest = user_messages[-1].strip() if user_messages else ""
    system_context = system_messages[-1] if system_messages else ""

    context_hint = ""
    marker = "[USER LEARNING CONTEXT - USE THIS AS SOURCE OF TRUTH]"
    if marker in system_context:
        rag_block = system_context.split(marker, 1)[-1].strip()
        if rag_block:
            lines = [ln.strip() for ln in rag_block.splitlines() if ln.strip()]
            picked = []
            for ln in lines:
                if ln.startswith("Roadmap summary:") or ln.startswith("Weak skills to prioritize:"):
                    picked.append(ln)
                if ln.startswith("1.") or ln.startswith("2."):
                    picked.append(ln)
                if len(picked) >= 4:
                    break
            if picked:
                context_hint = "\n\nBased on your roadmap data:\n" + "\n".join(picked)

    if not latest:
        return (
            "I am here to help. Tell me what subject you are studying and what is confusing you, "
            "and I will break it down step by step."
        )

    lowered = latest.lower()

    if any(k in lowered for k in ["schedule", "plan", "timetable", "routine"]):
        return (
            "Great question. Here is a simple study schedule you can use today:\n\n"
            "1) 45 minutes: revise core concepts from your notes\n"
            "2) 30 minutes: solve 5 to 10 practice questions\n"
            "3) 15 minutes: review mistakes and write quick corrections\n"
            "4) 20 minutes: active recall without looking at notes\n\n"
            "If you tell me your subject and available hours, I can personalize this into a full weekly plan."
            f"{context_hint}"
        )

    if any(k in lowered for k in ["exam", "test", "revision", "prepare"]):
        return (
            "For exam preparation, focus on high-impact revision:\n\n"
            "1) List the top 5 most important topics\n"
            "2) Practice past questions for each topic\n"
            "3) Track weak areas and revisit them tomorrow\n"
            "4) End each session with a 10-minute recap\n\n"
            "Share your subject and exam date, and I will create a day-by-day revision plan."
            f"{context_hint}"
        )

    if any(k in lowered for k in ["doubt", "understand", "confused", "explain", "what is", "how"]):
        return (
            "Let us solve this clearly. Start with this approach:\n\n"
            "1) Define the concept in one sentence\n"
            "2) Learn one small example\n"
            "3) Solve one similar question yourself\n"
            "4) Explain it back in your own words\n\n"
            f"You asked: \"{latest}\". If you share your topic details, I can explain it step by step."
            f"{context_hint}"
        )

    return (
        "Good question. I can help you with planning, revision, and clearing doubts.\n\n"
        f"You asked: \"{latest}\"\n\n"
        "Tell me your subject and current difficulty level, and I will give you a focused next-step plan."
        f"{context_hint}"
    )


# ── Public API ────────────────────────────────────────────────────────────────

def call_gemini(prompt: str) -> str:
    """Single-turn Gemini call. Used by roadmap, quiz, analysis, etc."""
    try:
        return _gemini_chat(prompt, temperature=0.7, max_tokens=800)
    except Exception as e:
        print(f"[call_gemini] Error: {e}")
        return "I'm having trouble connecting to the AI service right now. Please try again later."


def chat_with_messages(messages: list, temperature: float = 0.7, max_tokens: int = 600) -> str:
    """
    Multi-turn Gemini call with system/user/assistant message list.
    Used by the AI Mentor for conversational context.
    """
    try:
        if not _client:
            return _mentor_fallback_response(messages)
        return _gemini_chat_messages(messages, temperature=temperature, max_tokens=max_tokens)
    except Exception as e:
        print(f"[chat_with_messages] Error: {e}")
        return _mentor_fallback_response(messages)


def generate_topic_materials(topic_title: str, topic_content: str, user_query: str = "") -> dict:
    query_section = f"""
    The user also has this specific question/request: "{user_query}"
    Include an 'extra_content' key in your response that directly answers this query with 2-3 paragraphs.
    """ if user_query.strip() else ""

    prompt = f"""You are an expert educator. Generate comprehensive study materials for the following topic.

Topic Title: {topic_title}
Topic Overview: {topic_content[:800]}
{query_section}

Return ONLY a valid JSON object (no markdown) with this exact structure:
{{
  "key_concepts": ["concept 1", "concept 2", "concept 3", "concept 4", "concept 5"],
  "explanation": "A detailed 3-paragraph explanation of the topic covering all major aspects...",
  "examples": [
    {{"title": "Example 1 title", "description": "Real-world example with details..."}},
    {{"title": "Example 2 title", "description": "Another practical example..."}},
    {{"title": "Example 3 title", "description": "Third example..."}}
  ],
  "summary": "A concise one-paragraph summary reinforcing the key takeaways of this topic."
}}"""

    try:
        raw = _gemini_chat(prompt, temperature=0.7, max_tokens=1500)
        # Strip markdown fences if Gemini wraps with ```json
        if "```" in raw:
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        if user_query.strip() and "extra_content" not in result:
            result["extra_content"] = None
        return result
    except Exception as e:
        print(f"[Materials] Generation error: {e}")
        return _fallback_materials(topic_title)


def generate_roadmap(syllabus_text: str):
    prompt = f"""
    Given the following course syllabus, generate a structured 7-day learning roadmap with exactly 7 topics (one per day).
    Output only in valid JSON format: a list of dictionaries, where each dictionary has:
    - "title": (string) the topic title, starting with "Day X:" (e.g. "Day 1: Intro")
    - "content": (string) Detailed study notes for that day formatted in Markdown. It MUST include:
        1. A 'Study Time' header (e.g., "**Study Time: 09:30 AM - 12:30 PM**")
        2. A comprehensive "Notes" section explaining the concepts deeply.
        3. A specifically labeled "**Practice Exercises**" section with 3-4 actionable bullet points.

    Syllabus text:
    {syllabus_text[:2000]}
    """

    try:
        content = _gemini_chat(prompt, temperature=0.7, max_tokens=2500)
        # Strip markdown fences
        if "```" in content:
            parts = content.split("```")
            content = parts[1] if len(parts) > 1 else content
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content.strip())
    except Exception as e:
        print(f"[Roadmap] Generation error: {e}")
        return _fallback_roadmap()


def generate_quiz_for_topic(topic_content: str, topic_title: str = "") -> list:
    """Generate 10 multiple-choice quiz questions based on topic content."""
    title_line = f"Topic: {topic_title}\n" if topic_title else ""
    content_snippet = topic_content[:2000] if topic_content else ""

    if len(content_snippet.strip()) < 80:
        content_note = f"The topic is '{topic_title}'. Generate 10 multiple-choice questions covering the core concepts of this topic."
    else:
        content_note = f"Generate 10 multiple-choice questions STRICTLY based on the following content:\n\n{title_line}{content_snippet}"

    prompt = f"""{content_note}

Each question must have exactly 4 answer options and one correct answer.

Return ONLY a valid JSON array (no markdown, no extra text) with exactly this structure:
[
  {{
    "question": "What is ...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer_index": 0
  }}
]"""

    try:
        raw = _gemini_chat(prompt, temperature=0.6, max_tokens=3000)

        # Strip markdown fences
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            cleaned = parts[1] if len(parts) > 1 else cleaned
            if cleaned.lstrip().startswith("json"):
                cleaned = cleaned.lstrip()[4:]
        cleaned = cleaned.strip()

        parsed = json.loads(cleaned)

        valid = []
        for item in parsed:
            if (
                isinstance(item, dict)
                and "question" in item
                and "options" in item
                and "answer_index" in item
                and len(item["options"]) == 4
                and isinstance(item["answer_index"], int)
                and 0 <= item["answer_index"] <= 3
            ):
                valid.append(item)

        if valid:
            print(f"[Quiz] Generated {len(valid)} questions for: {topic_title!r}")
            return valid
        else:
            print(f"[Quiz] Invalid structure from Gemini, using fallback.")
            return _fallback_quiz(topic_title)

    except Exception as e:
        print(f"[Quiz] Generation error: {e}")
        return _fallback_quiz(topic_title)


def generate_group_insights(group_data: str) -> dict:
    prompt = f"""
    You are an AI study group mentor. Analyze the following group study logs and member performance data.
    Identify the group's strongest topic, weakest topic, the most consistent member, provide an improvement suggestion, and a motivation message.
    Return ONLY valid JSON format with the following keys:
    - "group_strength": (string)
    - "weak_topic": (string)
    - "most_consistent_member": (string)
    - "improvement_suggestion": (string)
    - "motivation_message": (string)

    Group Data:
    {group_data[:2000]}
    """

    try:
        content = _gemini_chat(prompt, temperature=0.7, max_tokens=600)
        if "```" in content:
            parts = content.split("```")
            content = parts[1] if len(parts) > 1 else content
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content.strip())
    except Exception as e:
        print(f"[GroupInsights] Error: {e}")
        return _fallback_group_insights()


# ── Fallbacks ─────────────────────────────────────────────────────────────────

def _fallback_roadmap():
    return [
        {"title": "Day 1: Introduction & Foundations", "content": "Welcome to Day 1. We cover the core terminology and foundational concepts."},
        {"title": "Day 2: Core Principles", "content": "Dive deeper into the main theories and models that underpin the subject."},
        {"title": "Day 3: Tools & Techniques", "content": "Explore key tools, frameworks, and techniques used in practice."},
        {"title": "Day 4: Practical Application", "content": "Hands-on application of concepts learned so far through exercises."},
        {"title": "Day 5: Advanced Techniques", "content": "Explore advanced strategies, patterns and edge cases."},
        {"title": "Day 6: Case Studies", "content": "Apply knowledge to real-world case studies and problem solving."},
        {"title": "Day 7: Review & Mastery", "content": "Review all concepts, fill any gaps, and consolidate mastery."}
    ]


def _fallback_materials(topic_title: str) -> dict:
    return {
        "key_concepts": [
            f"Core definition of {topic_title}",
            "Fundamental principles and theories",
            "Key terminology",
            "Practical applications",
            "Common challenges and solutions"
        ],
        "explanation": f"{topic_title} is a fundamental area of study that builds on core principles. Understanding it thoroughly is essential for mastering the broader subject area. This topic connects theory to real-world practice.",
        "examples": [
            {"title": "Basic Example", "description": f"A simple real-world scenario demonstrating {topic_title} in action."},
            {"title": "Intermediate Example", "description": f"A more complex use case showing the nuances of {topic_title}."},
            {"title": "Advanced Example", "description": f"An advanced application where {topic_title} is combined with other concepts."}
        ],
        "summary": f"{topic_title} is an important topic that requires understanding of core concepts, practical application techniques, and awareness of real-world use cases."
    }


def _fallback_quiz(topic_title: str = ""):
    t = topic_title or "this topic"
    return [
        {
            "question": f"What is the primary focus of {t}?",
            "options": [
                "Understanding core concepts and fundamentals",
                "Memorizing unrelated information",
                "Skipping foundational knowledge",
                "Avoiding practical applications"
            ],
            "answer_index": 0
        },
        {
            "question": f"Which best describes a key learning outcome of {t}?",
            "options": [
                "Building practical skills step by step",
                "Reading without understanding",
                "Ignoring real-world applications",
                "Focusing only on theory"
            ],
            "answer_index": 0
        },
        {
            "question": f"Why is {t} important in this field?",
            "options": [
                "It forms the foundation for advanced concepts",
                "It is not relevant",
                "It is purely theoretical",
                "It has no practical value"
            ],
            "answer_index": 0
        },
        {
            "question": f"What approach is most effective when studying {t}?",
            "options": [
                "Combining theory with hands-on practice",
                "Only reading text",
                "Skipping exercises",
                "Avoiding examples"
            ],
            "answer_index": 0
        },
        {
            "question": f"Which of the following is a key principle related to {t}?",
            "options": [
                "Structured, progressive learning",
                "Random, unstructured studying",
                "Ignoring prerequisites",
                "Skipping review sessions"
            ],
            "answer_index": 0
        },
    ]


def _fallback_group_insights() -> dict:
    return {
        "group_strength": "Consistency across members",
        "weak_topic": "Unknown - lacking data",
        "most_consistent_member": "Group Leader",
        "improvement_suggestion": "Try setting a shared challenge to boost engagement.",
        "motivation_message": "Consistency is the key to mastering any subject. Keep studying together!"
    }

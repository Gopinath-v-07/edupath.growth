from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import schemas, models, auth, database
import datetime

router = APIRouter(
    prefix="/assessment",
    tags=["Assessment & Evaluation"]
)

# ─── 20-Question Initial Assessment Bank ───────────────────────────────────────
ASSESSMENT_QUESTIONS = [
    # ── Universal Skills (7 questions) ────────────────────────────────────────
    {
        "id": 1,
        "category": "Universal Skills",
        "skill": "communication",
        "question": "You disagree with a teammate's approach in a group project. What is the best way to handle it?",
        "options": [
            "Stay silent and do your part",
            "Raise your concern respectfully with reasoning",
            "Complain to others about it",
            "Override their decision without discussion"
        ],
        "correct": 1
    },
    {
        "id": 2,
        "category": "Universal Skills",
        "skill": "problem_solving",
        "question": "What is the FIRST step when approaching an unfamiliar problem?",
        "options": [
            "Start coding immediately",
            "Search for solutions online",
            "Clearly define and understand the problem",
            "Ask someone else to solve it"
        ],
        "correct": 2
    },
    {
        "id": 3,
        "category": "Universal Skills",
        "skill": "critical_thinking",
        "question": "Which of the following best describes critical thinking?",
        "options": [
            "Accepting information as presented",
            "Analyzing facts to form a well-reasoned judgment",
            "Memorizing large amounts of data",
            "Following the majority opinion"
        ],
        "correct": 1
    },
    {
        "id": 4,
        "category": "Universal Skills",
        "skill": "time_management",
        "question": "You have 3 assignments due: one tomorrow, one next week, and one in a month. How do you prioritize?",
        "options": [
            "Work on the easiest one first",
            "Work on all three simultaneously",
            "Prioritize by deadline — tomorrow's first",
            "Do the most interesting one first"
        ],
        "correct": 2
    },
    {
        "id": 5,
        "category": "Universal Skills",
        "skill": "communication",
        "question": "Which of the following is an example of active listening?",
        "options": [
            "Planning your response while the other person speaks",
            "Nodding and paraphrasing to confirm understanding",
            "Checking your phone occasionally",
            "Interrupting to share your ideas"
        ],
        "correct": 1
    },
    {
        "id": 6,
        "category": "Universal Skills",
        "skill": "problem_solving",
        "question": "If a program produces an unexpected output, what should you do first?",
        "options": [
            "Rewrite the entire program",
            "Check the most recently changed code",
            "Reproduce the issue and isolate the cause",
            "Ignore it if it happens rarely"
        ],
        "correct": 2
    },
    {
        "id": 7,
        "category": "Universal Skills",
        "skill": "critical_thinking",
        "question": "A study claims '90% of students who use our app get top grades.' What is the best critical response?",
        "options": [
            "Believe it — 90% is very high",
            "Ask about sample size, methodology, and conflicts of interest",
            "Share it immediately with friends",
            "Reject it without reading further"
        ],
        "correct": 1
    },

    # ── Stream-Specific / Technical (7 questions) ──────────────────────────────
    {
        "id": 8,
        "category": "Stream-Specific",
        "skill": "python",
        "question": "What is the output of: `print(type([]))`?",
        "options": [
            "<class 'tuple'>",
            "<class 'dict'>",
            "<class 'list'>",
            "<class 'set'>"
        ],
        "correct": 2
    },
    {
        "id": 9,
        "category": "Stream-Specific",
        "skill": "data_structures",
        "question": "Which data structure follows LIFO (Last In, First Out) order?",
        "options": [
            "Queue",
            "Stack",
            "Linked List",
            "Array"
        ],
        "correct": 1
    },
    {
        "id": 10,
        "category": "Stream-Specific",
        "skill": "databases",
        "question": "Which SQL command is used to retrieve data from a table?",
        "options": [
            "INSERT",
            "UPDATE",
            "SELECT",
            "DELETE"
        ],
        "correct": 2
    },
    {
        "id": 11,
        "category": "Stream-Specific",
        "skill": "python",
        "question": "What does the `len()` function return when called on a dictionary?",
        "options": [
            "Number of values",
            "Number of key-value pairs",
            "Total characters in all keys",
            "An error"
        ],
        "correct": 1
    },
    {
        "id": 12,
        "category": "Stream-Specific",
        "skill": "data_structures",
        "question": "What is the time complexity of accessing an element in an array by index?",
        "options": [
            "O(n)",
            "O(log n)",
            "O(1)",
            "O(n²)"
        ],
        "correct": 2
    },
    {
        "id": 13,
        "category": "Stream-Specific",
        "skill": "web_development",
        "question": "Which HTML tag is used to link an external CSS stylesheet?",
        "options": [
            "<style>",
            "<script>",
            "<link>",
            "<css>"
        ],
        "correct": 2
    },
    {
        "id": 14,
        "category": "Stream-Specific",
        "skill": "oop",
        "question": "Which OOP concept allows a class to inherit properties from another class?",
        "options": [
            "Encapsulation",
            "Polymorphism",
            "Abstraction",
            "Inheritance"
        ],
        "correct": 3
    },

    # ── Goal-Based (6 questions) ───────────────────────────────────────────────
    {
        "id": 15,
        "category": "Goal-Based",
        "skill": "interview_prep",
        "question": "In a technical interview, you don't know the answer. What is the best approach?",
        "options": [
            "Guess confidently",
            "Say nothing and wait",
            "Think aloud, explain your reasoning, and ask for hints if needed",
            "Immediately say you don't know and move on"
        ],
        "correct": 2
    },
    {
        "id": 16,
        "category": "Goal-Based",
        "skill": "project_building",
        "question": "What is the recommended first step when starting a new software project?",
        "options": [
            "Start writing code",
            "Design the UI",
            "Define requirements and plan the architecture",
            "Choose a programming language"
        ],
        "correct": 2
    },
    {
        "id": 17,
        "category": "Goal-Based",
        "skill": "competitive_coding",
        "question": "What does Big-O notation describe?",
        "options": [
            "The exact runtime of an algorithm",
            "The memory usage of a program",
            "The upper bound of an algorithm's growth rate",
            "The number of lines of code"
        ],
        "correct": 2
    },
    {
        "id": 18,
        "category": "Goal-Based",
        "skill": "interview_prep",
        "question": "Which of the following is the MOST important thing to do before a technical interview?",
        "options": [
            "Memorize syntax of every language",
            "Practice problem-solving and review fundamentals",
            "Read the company's Wikipedia page",
            "Prepare a list of salary expectations"
        ],
        "correct": 1
    },
    {
        "id": 19,
        "category": "Goal-Based",
        "skill": "project_building",
        "question": "Which version control command saves your staged changes to local history?",
        "options": [
            "git push",
            "git pull",
            "git commit",
            "git merge"
        ],
        "correct": 2
    },
    {
        "id": 20,
        "category": "Goal-Based",
        "skill": "competitive_coding",
        "question": "Which algorithm is best suited for finding the shortest path in an unweighted graph?",
        "options": [
            "Depth-First Search (DFS)",
            "Breadth-First Search (BFS)",
            "Binary Search",
            "Bubble Sort"
        ],
        "correct": 1
    },
]


@router.get("/questions")
def get_assessment_questions(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return {"questions": ASSESSMENT_QUESTIONS}


@router.get("/has_completed")
def has_completed_assessment(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Check if the user has already completed the initial assessment."""
    count = db.query(models.SkillScore).filter(
        models.SkillScore.user_id == current_user.id
    ).count()
    return {"completed": count > 0}


@router.post("/evaluate")
def evaluate_assessment(
    answers: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Evaluate initial assessment answers and save skill scores.
    answers: { "1": 2, "2": 1, ... }  (question_id → selected_option_index)
    """
    skill_accuracy = {}

    for q_id_str, selected_index in answers.items():
        q_id = int(q_id_str)
        question = next((q for q in ASSESSMENT_QUESTIONS if q["id"] == q_id), None)
        if not question:
            continue

        skill = question["skill"]
        if skill not in skill_accuracy:
            skill_accuracy[skill] = {"correct": 0, "total": 0}

        skill_accuracy[skill]["total"] += 1
        if question["correct"] == selected_index:
            skill_accuracy[skill]["correct"] += 1

    skill_results = {}

    for skill, data in skill_accuracy.items():
        percentage = round((data["correct"] / data["total"]) * 100, 1)

        if percentage >= 80:
            classification = "Advanced"
        elif percentage >= 60:
            classification = "Intermediate"
        elif percentage >= 40:
            classification = "Basic"
        else:
            classification = "Foundation"

        # Upsert skill score
        existing = db.query(models.SkillScore).filter(
            models.SkillScore.user_id == current_user.id,
            models.SkillScore.skill_name == skill
        ).first()

        if existing:
            existing.score_percentage = percentage
            existing.classification = classification
            existing.last_updated = datetime.datetime.utcnow()
        else:
            db.add(models.SkillScore(
                user_id=current_user.id,
                skill_name=skill,
                score_percentage=percentage,
                classification=classification
            ))

        skill_results[skill] = {
            "score": percentage,
            "classification": classification,
            "correct": data["correct"],
            "total": data["total"]
        }

    db.commit()

    return {
        "status": "success",
        "message": "Assessment evaluated and skill profile updated.",
        "skill_scores": skill_results
    }

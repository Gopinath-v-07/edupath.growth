from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    goal = Column(String, nullable=True) # Legacy, keeping for backwards compatibility initially
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    skill_scores = relationship("SkillScore", back_populates="user", cascade="all, delete-orphan")
    learning_paths = relationship("LearningPath", back_populates="user", cascade="all, delete-orphan")
    progress_tracking = relationship("ProgressTracking", back_populates="user", cascade="all, delete-orphan")
    career_readiness = relationship("CareerReadiness", back_populates="user", cascade="all, delete-orphan")
    streak = relationship("UserStreak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mentor_chat_messages = relationship("MentorChatMessage", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    """Stores Academic and Career info from Onboarding."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    full_name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    degree = Column(String, nullable=True)
    stream = Column(String, nullable=True)
    department = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    year = Column(String, nullable=True) # Changed to String to handle "2nd Year"
    short_term_goal = Column(String, nullable=True)
    long_term_goal = Column(String, nullable=True)
    preferred_mode = Column(String, nullable=True)
    self_rating = Column(JSON, nullable=True)
    confidence_level = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")
    profile_image = relationship("ProfileImage", back_populates="profile", uselist=False, cascade="all, delete-orphan")


class ProfileImage(Base):
    """Stores profile image path separately to avoid schema issues on existing profile table."""
    __tablename__ = "profile_images"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"), unique=True, index=True)
    image_url = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("Profile", back_populates="profile_image")

class AssessmentQuestion(Base):
    """Questions for the initial assessment engine."""
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String) # Universal Skills, Stream-Specific, Goal-Based
    skill_name = Column(String)
    question_text = Column(String)
    options = Column(JSON) # List of strings
    correct_answer_index = Column(Integer)
    difficulty = Column(Integer) # 1-5

class SkillScore(Base):
    """Tracks dynamic skill levels."""
    __tablename__ = "skill_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_name = Column(String)
    score_percentage = Column(Float)
    classification = Column(String) # Advanced, Intermediate, Basic, Foundation
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="skill_scores")

class CareerRequirement(Base):
    """Benchmarks for Gap Analysis."""
    __tablename__ = "career_requirements"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, unique=True)
    required_skills = Column(JSON) # e.g. {"Python": "Advanced", "SQL": "Intermediate"}

class LearningPath(Base):
    """Modular roadmap tracking."""
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    mode = Column(String) # Skill or Syllabus
    modules_data = Column(JSON) # The generated roadmap structure

    user = relationship("User", back_populates="learning_paths")

class ProgressTracking(Base):
    """Tracks time, accuracy, and engagement on learning modules."""
    __tablename__ = "progress_tracking"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    module_name = Column(String)
    accuracy_percentage = Column(Float)
    time_spent_minutes = Column(Float)
    attempts = Column(Integer, default=1)
    engaged_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_tracking")

class CareerReadiness(Base):
    """Weekly CRI score logs."""
    __tablename__ = "career_readiness"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cri_score = Column(Float)
    status_category = Column(String) # Beginner, Developing, Industry Ready
    risk_indicator = Column(Boolean, default=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="career_readiness")


class MentorChatMessage(Base):
    """Persistent AI mentor conversation memory per user."""
    __tablename__ = "mentor_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    role = Column(String)  # "user" | "assistant"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="mentor_chat_messages")


# Legacy Models (Modified to link correctly)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    extracted_text = Column(Text)
    s3_url = Column(String, nullable=True)

    user = relationship("User", back_populates="courses")
    topics = relationship("Topic", back_populates="course", order_by="Topic.order", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String)
    content = Column(Text)
    order = Column(Integer)
    is_unlocked = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)

    course = relationship("Course", back_populates="topics")
    quiz = relationship("Quiz", back_populates="topic", uselist=False, cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="topic")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    questions_data = Column(JSON) 

    topic = relationship("Topic", back_populates="quiz")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    score = Column(Integer)
    passed = Column(Boolean, default=False)

    user = relationship("User", back_populates="quiz_attempts")
    topic = relationship("Topic", back_populates="quiz_attempts")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by = relationship("User", foreign_keys=[created_by_id])
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    study_logs = relationship("GroupStudyLog", back_populates="group", cascade="all, delete-orphan")
    challenges = relationship("GroupChallenge", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default="member") # admin, member
    joined_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="members")
    user = relationship("User")


class GroupStudyLog(Base):
    __tablename__ = "group_study_logs"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String)
    duration_minutes = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="study_logs")
    user = relationship("User")


class GroupChallenge(Base):
    __tablename__ = "group_challenges"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    title = Column(String)
    description = Column(String)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    group = relationship("Group", back_populates="challenges")
    created_by = relationship("User", foreign_keys=[created_by_id])


class GroupStreak(Base):
    __tablename__ = "group_streaks"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_study_date = Column(DateTime, nullable=True)

    group = relationship("Group")
    user = relationship("User")


class UserStreak(Base):
    """Tracks consecutive daily login streaks per user."""
    __tablename__ = "user_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    current_streak = Column(Integer, default=1)
    longest_streak = Column(Integer, default=1)
    last_login_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="streak")

class GroupDoubt(Base):
    __tablename__ = "group_doubts"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(Text)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group")
    user = relationship("User")
    replies = relationship("GroupDoubtReply", back_populates="doubt", cascade="all, delete-orphan")


class GroupDoubtReply(Base):
    __tablename__ = "group_doubt_replies"

    id = Column(Integer, primary_key=True, index=True)
    doubt_id = Column(Integer, ForeignKey("group_doubts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    doubt = relationship("GroupDoubt", back_populates="replies")
    user = relationship("User")

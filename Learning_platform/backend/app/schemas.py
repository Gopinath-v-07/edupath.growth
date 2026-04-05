from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    is_superuser: Optional[bool] = False

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_superuser: bool

    class Config:
        orm_mode = True

class ProfileCreate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    degree: Optional[str] = None
    stream: str
    specialization: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    short_term_goal: Optional[str] = None
    long_term_goal: Optional[str] = None
    preferred_mode: Optional[str] = "Hybrid"
    confidence_level: Optional[str] = "Medium"
    self_rating: Optional[Any] = None

class GoalsUpdate(BaseModel):
    short_term_goal: str
    long_term_goal: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class CourseResponse(BaseModel):
    id: int
    title: str
    total_topics: Optional[int] = 0

    class Config:
        orm_mode = True

class TopicResponse(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    order: int
    is_unlocked: bool
    is_completed: bool

    class Config:
        orm_mode = True

class RoadmapGenerateRequest(BaseModel):
    course_id: int

class QuizSubmit(BaseModel):
    answers: Dict[str, int] # e.g. {"1": 0, "2": 2}

class CustomRoadmapRequest(BaseModel):
    subject: str
    num_topics: Optional[int] = 8
    description: Optional[str] = None
    duration: Optional[str] = None

class GroupCreate(BaseModel):
    name: str

class GroupStudyLogCreate(BaseModel):
    topic: str
    duration_minutes: int

class GroupMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str
    joined_at: datetime
    user_name: str
    
    class Config:
        orm_mode = True

class GroupResponse(BaseModel):
    id: int
    name: str
    created_by_id: int
    created_at: datetime
    members: List[GroupMemberResponse]

    class Config:
        orm_mode = True

class GroupChallengeCreate(BaseModel):
    title: str
    description: str

class GroupChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    created_by_id: int
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        orm_mode = True

class GroupDoubtReplyCreate(BaseModel):
    content: str

class GroupDoubtReplyResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        orm_mode = True

class GroupDoubtCreate(BaseModel):
    title: str
    description: str

class GroupDoubtResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    user_name: Optional[str] = None
    title: str
    description: str
    is_resolved: bool
    created_at: datetime
    replies: List[GroupDoubtReplyResponse] = []

    class Config:
        orm_mode = True

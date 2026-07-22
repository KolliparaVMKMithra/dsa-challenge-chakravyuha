import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class StudentBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    college_email: EmailStr
    roll_number: Optional[str] = None
    phone_number: str = Field(..., min_length=10, max_length=15)
    branch: str = Field(..., min_length=2, max_length=50)
    year: int = Field(..., ge=1, le=5)

    @field_validator("roll_number")
    @classmethod
    def validate_roll_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        # Must start with AV and be alphanumeric
        if not re.match(r"^AV[A-Za-z0-9.]+$", v):
            raise ValueError("Roll number must start with 'AV' and contain only letters, digits, and periods (e.g. AV.SC.U4CSE23233)")
        return v

    @field_validator("college_email")
    @classmethod
    def validate_college_email(cls, v: str) -> str:
        # Relaxed validator to allow personal emails for the 2026 batch
        return v

class StudentSignUp(StudentBase):
    password: str = Field(..., min_length=6, max_length=50)

class StudentLogin(BaseModel):
    username: str  # Email or Roll Number
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str  # "student" or "admin"
    name: str

class StudentResponse(StudentBase):
    id: str
    streak_count: int
    last_active_date: Optional[datetime.date] = None
    is_admin: bool
    created_at: datetime.datetime
    qr_key: str

    class Config:
        from_attributes = True

class ProblemBase(BaseModel):
    topic: str
    title: str
    difficulty: str  # Easy, Medium, Hard
    leetcode_link: str

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        normalized = v.capitalize()
        if normalized not in ["Easy", "Medium", "Hard"]:
            raise ValueError("Difficulty must be one of: Easy, Medium, Hard")
        return normalized

class ProblemCreate(ProblemBase):
    pass

class ProblemResponse(ProblemBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    problem_id: int
    submission_link: str

    @field_validator("submission_link")
    @classmethod
    def validate_link(cls, v: str) -> str:
        # Enforce strict LeetCode submission URL format:
        # Example: https://leetcode.com/problems/number-of-provinces/submissions/2052683388
        pattern = r"^https?://(www\.)?leetcode\.com/problems/[a-zA-Z0-9-]+/submissions/\d+/?(?:\?.*)?$"
        if not re.match(pattern, v.strip()):
            raise ValueError(
                "Invalid LeetCode submission link. Must be in the format: "
                "https://leetcode.com/problems/problem-name/submissions/submission-id"
            )
        return v.strip()

class SubmissionResponse(BaseModel):
    id: int
    student_id: str
    problem_id: int
    submission_link: str
    solved: bool
    completed_at: datetime.datetime

    class Config:
        from_attributes = True

class AttendanceResponse(BaseModel):
    id: int
    student_id: str
    date: datetime.date
    timestamp: datetime.datetime
    marked_by: str

    class Config:
        from_attributes = True

class CodeChefContestCreate(BaseModel):
    week_number: int
    contest_link: str
    deadline: datetime.datetime

    @field_validator("contest_link")
    @classmethod
    def validate_link(cls, v: str) -> str:
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("Contest link must be a valid URL (start with http:// or https://)")
        return v

class CodeChefContestResponse(BaseModel):
    id: int
    week_number: int
    contest_link: str
    deadline: datetime.datetime

    class Config:
        from_attributes = True

class CodeChefParticipationSubmit(BaseModel):
    contest_id: int
    submission_proof: str

class CodeChefParticipationResponse(BaseModel):
    id: int
    student_id: str
    contest_id: int
    status: str
    submission_proof: Optional[str] = None
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class ScanAdminCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    college_email: EmailStr
    roll_number: str
    phone_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)

    @field_validator("roll_number")
    @classmethod
    def validate_roll_number(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z0-9._-]+$", v):
            raise ValueError("Roll number / Username must contain only letters, digits, periods, underscores, or hyphens (e.g. medha)")
        return v

class ScanAdminResponse(BaseModel):
    id: str
    full_name: str
    college_email: EmailStr
    roll_number: str
    phone_number: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class FeedbackCreate(BaseModel):
    q1_dsa_difficulty: int = Field(..., ge=1, le=5)
    q2_dsa_clarity: str = Field(..., min_length=1)
    q3_time_spent: str = Field(..., min_length=1)
    q4_solving_mode: str = Field(..., min_length=1)
    q5_prompting_used: str = Field(..., min_length=1)
    q6_prompting_effectiveness: int = Field(..., ge=1, le=5)
    q7_prompt_type: str = Field(..., min_length=1)
    q8_prompt_challenge: str = Field(..., min_length=1)
    q9_concept_understanding: int = Field(..., ge=1, le=5)
    q10_platform_rating: int = Field(..., ge=1, le=5)
    q11_attendance_experience: str = Field(..., min_length=1)
    q12_codechef_interest: int = Field(..., ge=1, le=5)
    q13_future_topics: str = Field(..., min_length=1)
    q14_prompting_improvement: str = Field(..., min_length=1)
    q15_general_feedback: str = Field(..., min_length=1)

class FeedbackResponse(FeedbackCreate):
    id: int
    student_id: str
    submitted_at: datetime.datetime

    class Config:
        from_attributes = True

class EventCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=2, max_length=1000)
    status: str = Field("active", pattern="^(active|upcoming|completed)$")

class EventResponse(EventCreate):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

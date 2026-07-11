import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

class StudentBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    college_email: EmailStr
    roll_number: str
    phone_number: str = Field(..., min_length=10, max_length=15)
    branch: str = Field(..., min_length=2, max_length=50)
    year: int = Field(..., ge=1, le=5)

    @field_validator("roll_number")
    @classmethod
    def validate_roll_number(cls, v: str) -> str:
        # Must start with AV and be alphanumeric
        if not re.match(r"^AV[A-Za-z0-9.]+$", v):
            raise ValueError("Roll number must start with 'AV' and contain only letters, digits, and periods (e.g. AV.SC.U4CSE23233)")
        return v

    @field_validator("college_email")
    @classmethod
    def validate_college_email(cls, v: str) -> str:
        domain = v.split("@")[-1].lower()
        # Reject generic public domains to ensure it's a college email
        invalid_domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com"]
        if domain in invalid_domains:
            raise ValueError("Please sign up with your official college email, not a personal email (gmail, yahoo, etc.)")
        
        # Must end with a typical educational/institutional domain ending or a dot
        if not (domain.endswith(".edu") or domain.endswith(".in") or domain.endswith(".org") or domain.endswith(".net") or domain.endswith(".edu.in") or domain.endswith(".ac.in")):
            raise ValueError("Email must belong to an educational or institutional domain (e.g. .edu, .ac.in, .edu.in)")
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

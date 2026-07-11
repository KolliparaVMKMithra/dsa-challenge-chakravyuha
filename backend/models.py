import uuid
import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, ForeignKey, Table, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(100), nullable=False)
    college_email = Column(String(100), unique=True, index=True, nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), nullable=False)
    branch = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    password_hash = Column(String(255), nullable=False)
    qr_key = Column(String(100), unique=True, index=True, nullable=False)
    streak_count = Column(Integer, default=0, nullable=False)
    last_active_date = Column(Date, nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    admin_role = Column(String(50), nullable=True)  # "attendance" or "super"
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
    codechef_participations = relationship("CodeChefParticipation", back_populates="student", cascade="all, delete-orphan")

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    topic = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    difficulty = Column(String(20), nullable=False)  # Easy, Medium, Hard
    leetcode_link = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint('student_id', 'problem_id', name='_student_problem_uc'),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)
    submission_link = Column(String(500), nullable=False)
    solved = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")

class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint('student_id', 'date', 'session', name='_student_date_session_uc'),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=datetime.date.today, nullable=False)
    session = Column(String(20), default="forenoon", nullable=False) # "forenoon" or "afternoon"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    marked_by = Column(String(100), default="System", nullable=False)

    student = relationship("Student", back_populates="attendance_records")

class CodeChefContest(Base):
    __tablename__ = "codechef_contests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    week_number = Column(Integer, unique=True, nullable=False)
    contest_link = Column(String(500), nullable=False)
    deadline = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    participations = relationship("CodeChefParticipation", back_populates="contest", cascade="all, delete-orphan")

class CodeChefParticipation(Base):
    __tablename__ = "codechef_participations"
    __table_args__ = (
        UniqueConstraint('student_id', 'contest_id', name='_student_contest_uc'),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    contest_id = Column(Integer, ForeignKey("codechef_contests.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="missed", nullable=False) # attended, missed
    submission_proof = Column(String(500), nullable=True) # Link to solution or screenshot link
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    student = relationship("Student", back_populates="codechef_participations")
    contest = relationship("CodeChefContest", back_populates="participations")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # 15 questions
    q1_dsa_difficulty = Column(Integer, nullable=False)
    q2_dsa_clarity = Column(String(100), nullable=False)
    q3_time_spent = Column(String(100), nullable=False)
    q4_solving_mode = Column(String(100), nullable=False)
    q5_prompting_used = Column(String(100), nullable=False)
    q6_prompting_effectiveness = Column(Integer, nullable=False)
    q7_prompt_type = Column(String(100), nullable=False)
    q8_prompt_challenge = Column(String(1000), nullable=False)
    q9_concept_understanding = Column(Integer, nullable=False)
    q10_platform_rating = Column(Integer, nullable=False)
    q11_attendance_experience = Column(String(100), nullable=False)
    q12_codechef_interest = Column(Integer, nullable=False)
    q13_future_topics = Column(String(1000), nullable=False)
    q14_prompting_improvement = Column(String(100), nullable=False)
    q15_general_feedback = Column(String(1000), nullable=False)

    submitted_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    student = relationship("Student")

import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from backend.database import get_db
from backend.models import Student, Problem, Submission, Attendance, CodeChefContest, CodeChefParticipation, Feedback
from backend.schemas import SubmissionCreate, SubmissionResponse, CodeChefParticipationResponse, FeedbackCreate
from backend.auth import get_current_active_student, get_current_user

router = APIRouter(prefix="/api/dsa", tags=["dsa"])

@router.get("/sheet")
def get_dsa_sheet(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches the topic-wise DSA sheet with completion status for the current user."""
    # Fetch all active problems
    problems = db.query(Problem).filter(Problem.is_active == True).all()
    
    # Fetch submissions of current user
    submissions = db.query(Submission).filter(Submission.student_id == current_user.id).all()
    submissions_dict = {sub.problem_id: sub for sub in submissions}
    
    # Group problems by topic
    topics_data: Dict[str, Dict[str, Any]] = {}
    
    for problem in problems:
        topic = problem.topic
        if topic not in topics_data:
            topics_data[topic] = {
                "name": topic,
                "problems": [],
                "solved_count": 0,
                "total_count": 0
            }
        
        submission = submissions_dict.get(problem.id)
        solved = submission.solved if submission else False
        submission_link = submission.submission_link if submission else None
        completed_at = submission.completed_at if submission else None
        
        topics_data[topic]["total_count"] += 1
        if solved:
            topics_data[topic]["solved_count"] += 1
            
        topics_data[topic]["problems"].append({
            "id": problem.id,
            "title": problem.title,
            "difficulty": problem.difficulty,
            "leetcode_link": problem.leetcode_link,
            "solved": solved,
            "submission_link": submission_link,
            "completed_at": completed_at
        })
        
    return list(topics_data.values())

@router.post("/submit", response_model=SubmissionResponse)
def submit_solution(
    sub_data: SubmissionCreate, 
    current_user: Student = Depends(get_current_active_student), 
    db: Session = Depends(get_db)
):
    """Submits a solution for a problem, updating the user's streak."""
    # Check if problem exists
    problem = db.query(Problem).filter(Problem.id == sub_data.problem_id, Problem.is_active == True).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found or inactive"
        )
    
    # Strictly validate that the submission link matches the slug of the current problem
    import re
    slug_match = re.search(r"/problems/([a-zA-Z0-9-]+)", problem.leetcode_link)
    if slug_match:
        slug = slug_match.group(1)
        expected_pattern = rf"^https?://(www\.)?leetcode\.com/problems/{slug}/submissions/\d+/?(?:\?.*)?$"
        if not re.match(expected_pattern, sub_data.submission_link.strip()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incorrect submission link. The submitted link must belong to the problem '{problem.title}' (URL slug: {slug})."
            )
    
    # Check if submission already exists
    existing_sub = db.query(Submission).filter(
        Submission.student_id == current_user.id,
        Submission.problem_id == sub_data.problem_id
    ).first()
    
    today = datetime.date.today()
    
    # Calculate streak
    # Get student to update streak
    student = db.query(Student).filter(Student.id == current_user.id).first()
    
    if student.last_active_date is None:
        student.streak_count = 1
    else:
        delta = today - student.last_active_date
        if delta.days == 1:
            student.streak_count += 1
        elif delta.days > 1:
            student.streak_count = 1
        # If delta.days == 0 (already submitted today), streak remains same
        
    student.last_active_date = today
    
    if existing_sub:
        existing_sub.submission_link = sub_data.submission_link
        existing_sub.completed_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing_sub)
        return existing_sub
    else:
        new_sub = Submission(
            student_id=current_user.id,
            problem_id=sub_data.problem_id,
            submission_link=sub_data.submission_link,
            solved=True
        )
        db.add(new_sub)
        db.commit()
        db.refresh(new_sub)
        return new_sub

@router.get("/codechef")
def get_codechef_contest(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches the current week's CodeChef contest details and user participation status."""
    # Get the latest contest
    contest = db.query(CodeChefContest).order_by(CodeChefContest.week_number.desc()).first()
    if not contest:
        return {"contest": None, "participation": None}
    
    participation = db.query(CodeChefParticipation).filter(
        CodeChefParticipation.student_id == current_user.id,
        CodeChefParticipation.contest_id == contest.id
    ).first()
    
    # Check if deadline passed
    now = datetime.datetime.utcnow()
    is_expired = now > contest.deadline
    
    # If no participation record and deadline passed, auto-create as 'missed'
    if not participation and is_expired:
        participation = CodeChefParticipation(
            student_id=current_user.id,
            contest_id=contest.id,
            status="missed"
        )
        db.add(participation)
        db.commit()
        db.refresh(participation)
        
    return {
        "contest": contest,
        "participation": participation,
        "is_expired": is_expired
    }

@router.post("/codechef/submit", response_model=CodeChefParticipationResponse)
def submit_codechef_participation(
    proof_data: Dict[str, Any], 
    current_user: Student = Depends(get_current_active_student), 
    db: Session = Depends(get_db)
):
    """Submits proof of CodeChef participation to mark as attended."""
    contest_id = proof_data.get("contest_id")
    submission_proof = proof_data.get("submission_proof")
    
    if not contest_id or not submission_proof:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="contest_id and submission_proof are required"
        )
        
    contest = db.query(CodeChefContest).filter(CodeChefContest.id == contest_id).first()
    if not contest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contest not found"
        )
        
    # Check if deadline has passed
    if datetime.datetime.utcnow() > contest.deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The deadline for this CodeChef contest has passed"
        )
        
    participation = db.query(CodeChefParticipation).filter(
        CodeChefParticipation.student_id == current_user.id,
        CodeChefParticipation.contest_id == contest_id
    ).first()
    
    if participation:
        participation.status = "attended"
        participation.submission_proof = submission_proof
        participation.updated_at = datetime.datetime.utcnow()
    else:
        participation = CodeChefParticipation(
            student_id=current_user.id,
            contest_id=contest_id,
            status="attended",
            submission_proof=submission_proof
        )
        db.add(participation)
        
    db.commit()
    db.refresh(participation)
    return participation

@router.get("/dashboard-stats")
def get_dashboard_stats(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches stats for the student's dashboard: streaks, solved stats, attendance, etc."""
    student_id = current_user.id
    
    # 1. Streaks
    student = db.query(Student).filter(Student.id == student_id).first()
    streak = student.streak_count
    
    # 2. Total solved breakdown by difficulty
    solved_difficulty = db.query(
        Problem.difficulty,
        func.count(Submission.id)
    ).join(Submission, Problem.id == Submission.problem_id)\
     .filter(Submission.student_id == student_id, Submission.solved == True)\
     .group_by(Problem.difficulty).all()
     
    difficulty_stats = {"Easy": 0, "Medium": 0, "Hard": 0}
    for diff, count in solved_difficulty:
        if diff in difficulty_stats:
            difficulty_stats[diff] = count
            
    total_solved = sum(difficulty_stats.values())
    
    # 3. Total active problems in database
    total_problems = db.query(func.count(Problem.id)).filter(Problem.is_active == True).scalar() or 0
    completion_percentage = (total_solved / total_problems * 100) if total_problems > 0 else 0
    
    # 4. Attendance history
    attendance = db.query(Attendance).filter(Attendance.student_id == student_id).order_by(Attendance.date.desc()).all()
    grouped_attendance = {}
    for att in attendance:
        date_str = att.date.strftime("%Y-%m-%d")
        if date_str not in grouped_attendance:
            grouped_attendance[date_str] = []
        grouped_attendance[date_str].append(att.session)
        
    attendance_dates = []
    for date_str, sessions in grouped_attendance.items():
        sess_abbrevs = []
        if "forenoon" in sessions:
            sess_abbrevs.append("FN")
        if "afternoon" in sessions:
            sess_abbrevs.append("AN")
        sess_str = ", ".join(sess_abbrevs)
        attendance_dates.append(f"{date_str} ({sess_str})")
    
    # 5. CodeChef history
    codechef = db.query(
        CodeChefContest.week_number,
        CodeChefParticipation.status
    ).join(CodeChefParticipation, CodeChefContest.id == CodeChefParticipation.contest_id)\
     .filter(CodeChefParticipation.student_id == student_id).order_by(CodeChefContest.week_number.desc()).all()
     
    codechef_history = [{"week": cc[0], "status": cc[1]} for cc in codechef]
    
    return {
        "streak": streak,
        "solved_count": total_solved,
        "total_problems": total_problems,
        "completion_percentage": round(completion_percentage, 1),
        "difficulty_breakdown": difficulty_stats,
        "attendance_history": attendance_dates,
        "codechef_history": codechef_history
    }

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Fetches public leaderboard showing students only, ranked by solved count and streak."""
    leaderboard_query = db.query(
        Student.id,
        Student.full_name,
        Student.roll_number,
        Student.branch,
        Student.year,
        Student.streak_count,
        func.count(Submission.id).label("solved_count"),
        func.max(Submission.completed_at).label("last_submission_time")
    ).join(Submission, Student.id == Submission.student_id, isouter=True)\
     .filter(Student.is_admin == False)\
     .group_by(Student.id)\
     .order_by(
         func.count(Submission.id).desc(), 
         Student.streak_count.desc(), 
         func.max(Submission.completed_at).asc(),
         Student.full_name.asc()
     ).all()

    CUTOFF_TIME = datetime.datetime(2026, 7, 10, 15, 0, 0)
    leaderboard = []
    for rank, r in enumerate(leaderboard_query, start=1):
        last_sub_time = r[7]
        formatted_time = None
        if last_sub_time and last_sub_time >= CUTOFF_TIME:
            formatted_time = f"{last_sub_time.isoformat()}Z"
            
        leaderboard.append({
            "rank": rank,
            "id": r[0],
            "full_name": r[1],
            "roll_number": r[2],
            "branch": r[3],
            "year": r[4],
            "streak": r[5],
            "solved_count": r[6],
            "last_submission_time": formatted_time
        })
    return leaderboard

@router.get("/students/{student_id}/detail")
def get_public_student_detail(student_id: str, current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches public progress details and submissions for a specific student (accessible by other students)."""
    student = db.query(Student).filter(Student.id == student_id, Student.is_admin == False).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    submissions = db.query(
        Submission.completed_at,
        Problem.title,
        Problem.topic,
        Problem.difficulty
    ).join(Problem, Submission.problem_id == Problem.id)\
     .filter(Submission.student_id == student_id, Submission.solved == True)\
     .order_by(Submission.completed_at.desc()).all()
     
    CUTOFF_TIME = datetime.datetime(2026, 7, 10, 15, 0, 0)
    return {
        "student": {
            "id": student.id,
            "name": student.full_name,
            "roll_number": student.roll_number,
            "branch": student.branch,
            "year": student.year,
            "streak": student.streak_count,
        },
        "submissions": [
            {
                "title": s[1],
                "topic": s[2],
                "difficulty": s[3],
                "date": f"{s[0].isoformat()}Z" if (s[0] and s[0] >= CUTOFF_TIME) else None
            } for s in submissions
        ]
    }

@router.post("/feedback")
def submit_feedback(fb_data: FeedbackCreate, current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Allows logged-in students to submit their 15-question feedback."""
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only students can submit feedback.")
        
    # Check if already submitted
    existing = db.query(Feedback).filter(Feedback.student_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted your feedback.")
        
    db_feedback = Feedback(
        student_id=current_user.id,
        **fb_data.model_dump()
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return {"success": True, "detail": "Feedback submitted successfully."}

@router.get("/feedback/status")
def get_feedback_status(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Checks if the logged-in student has already submitted feedback."""
    if current_user.is_admin:
        return {"submitted": False, "is_admin": True}
        
    existing = db.query(Feedback).filter(Feedback.student_id == current_user.id).first()
    return {"submitted": existing is not None, "is_admin": False}

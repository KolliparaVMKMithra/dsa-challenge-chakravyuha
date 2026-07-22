import os
import io
import qrcode
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw, ImageFont, ImageOps
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from backend.database import get_db
from backend.models import Student, Problem, Submission, Attendance, CodeChefContest, CodeChefParticipation, Feedback, Event, EventRegistration
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

# ----------------- CERTIFICATE & VERIFICATION -----------------

def find_font(font_names, default_fallback):
    for name in font_names:
        for folder in [
            "C:\\Windows\\Fonts",
            "/usr/share/fonts/truetype/dejavu",
            "/usr/share/fonts/truetype/freefont",
            "/usr/share/fonts/truetype/liberation",
            "/usr/share/fonts"
        ]:
            path = os.path.join(folder, name)
            if os.path.exists(path):
                return path
            # Case insensitive check
            path_lower = os.path.join(folder, name.lower())
            if os.path.exists(path_lower):
                return path_lower
            
            # Recursive check one level down (e.g. liberation/LiberationSans-Regular.ttf)
            if os.path.exists(folder):
                for root, dirs, files in os.walk(folder):
                    for file in files:
                        if file.lower() == name.lower():
                            return os.path.join(root, file)
    return default_fallback

@router.get("/certificate")
def get_certificate(request: Request, current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generates and streams the student's personalized completion certificate."""
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot download student certificates.")
        
    # Check eligibility (must have solved >= 1 problem)
    solved_count = db.query(Submission).filter(
        Submission.student_id == current_user.id,
        Submission.solved == True
    ).count()
    
    if solved_count < 1:
        raise HTTPException(
            status_code=400,
            detail="You must submit at least one solved problem to download the certificate."
        )
        
    # Generate the certificate
    # A4 landscape ratio: 2000 x 1414
    width, height = 2000, 1414
    bg_color = (8, 8, 10)  # #08080a
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    gold_primary = (212, 175, 55)   # #d4af37
    gold_secondary = (140, 112, 48)  # #8c7030
    
    # Outer border (thin)
    draw.rectangle([30, 30, width - 30, height - 30], outline=gold_secondary, width=3)
    # Inner border (thick)
    draw.rectangle([45, 45, width - 45, height - 45], outline=gold_primary, width=8)
    # Inline border (thin)
    draw.rectangle([60, 60, width - 60, height - 60], outline=gold_secondary, width=2)
    
    # Corners
    corners = [
        (60, 60), (width - 60, 60),
        (60, height - 60), (width - 60, height - 60)
    ]
    for cx, cy in corners:
        draw.rectangle([cx - 15, cy - 15, cx + 15, cy + 15], fill=bg_color, outline=gold_primary, width=3)
        draw.rectangle([cx - 6, cy - 6, cx + 6, cy + 6], fill=gold_primary)

    # Path relative to dsa.py
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    project_root = os.path.dirname(backend_dir)

    # Logo
    logo_path = os.path.join(project_root, "club_logo.jpg")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(backend_dir, "club_logo.jpg")
        
    if os.path.exists(logo_path):
        try:
            logo = Image.open(logo_path).convert("RGBA")
            logo_size = 180
            logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            
            mask = Image.new('L', (logo_size, logo_size), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse((0, 0, logo_size, logo_size), fill=255)
            
            circular_logo = ImageOps.fit(logo, (logo_size, logo_size), centering=(0.5, 0.5))
            circular_logo.putalpha(mask)
            
            lx = (width - logo_size) // 2
            ly = 90
            img.paste(circular_logo, (lx, ly), circular_logo)
            draw.ellipse([lx - 4, ly - 4, lx + logo_size + 4, ly + logo_size + 4], outline=gold_primary, width=4)
        except Exception:
            pass

    # Find fonts relative to the codebase first, fallback to system search
    font_dir = os.path.join(backend_dir, "fonts")
    
    font_georgia_bold = os.path.join(font_dir, "georgiab.ttf")
    if not os.path.exists(font_georgia_bold):
        font_georgia_bold = find_font(["georgiab.ttf", "DejaVuSerif-Bold.ttf", "LiberationSerif-Bold.ttf", "FreeSerifBold.ttf"], None)
        
    font_georgia_italic = os.path.join(font_dir, "georgiai.ttf")
    if not os.path.exists(font_georgia_italic):
        font_georgia_italic = find_font(["georgiai.ttf", "DejaVuSerif-Italic.ttf", "LiberationSerif-Italic.ttf", "FreeSerifItalic.ttf"], None)
        
    font_arial = os.path.join(font_dir, "arial.ttf")
    if not os.path.exists(font_arial):
        font_arial = find_font(["arial.ttf", "DejaVuSans.ttf", "LiberationSans-Regular.ttf", "FreeSans.ttf"], None)
        
    font_arial_bold = os.path.join(font_dir, "arialbd.ttf")
    if not os.path.exists(font_arial_bold):
        font_arial_bold = find_font(["arialbd.ttf", "DejaVuSans-Bold.ttf", "LiberationSans-Bold.ttf", "FreeSansBold.ttf"], None)

    def get_font(path, size):
        if path is None:
            return ImageFont.load_default()
        try:
            return ImageFont.truetype(path, size)
        except IOError:
            return ImageFont.load_default()

    f_club_title = get_font(font_georgia_bold, 44)
    f_club_subtitle = get_font(font_arial_bold, 18)
    f_cert_title = get_font(font_georgia_bold, 65)
    f_cert_to = get_font(font_georgia_italic, 26)
    f_student_name = get_font(font_georgia_bold, 54)
    f_student_roll = get_font(font_arial, 22)
    f_cert_desc = get_font(font_georgia_italic, 26)
    f_event_name = get_font(font_georgia_bold, 38)
    f_date = get_font(font_georgia_italic, 26)
    f_footer_label = get_font(font_arial, 16)

    # Texts
    draw.text((width // 2, 300), "CHAKRAVYUHA CLUB", fill=gold_primary, font=f_club_title, anchor="mm")
    draw.text((width // 2, 340), "AMRITA VISHWA VIDYAPEETHAM", fill=(180, 180, 180), font=f_club_subtitle, anchor="mm")
    draw.line([width // 2 - 120, 375, width // 2 + 120, 375], fill=gold_secondary, width=2)
    draw.text((width // 2, 460), "CERTIFICATE OF COMPLETION", fill=(255, 255, 255), font=f_cert_title, anchor="mm")
    draw.text((width // 2, 540), "This is to certify that", fill=(200, 200, 200), font=f_cert_to, anchor="mm")
    draw.text((width // 2, 630), current_user.full_name.upper(), fill=gold_primary, font=f_student_name, anchor="mm")
    draw.text((width // 2, 690), f"Roll Number: {current_user.roll_number}", fill=(180, 180, 180), font=f_student_roll, anchor="mm")
    draw.text((width // 2, 770), "has successfully completed the challenges and projects of", fill=(200, 200, 200), font=f_cert_desc, anchor="mm")
    draw.text((width // 2, 850), "YUKTI - DSA & Prompt Engineering Challenge", fill=gold_primary, font=f_event_name, anchor="mm")
    draw.text((width // 2, 930), "held on 11/07/2026.", fill=(200, 200, 200), font=f_date, anchor="mm")
    
    # Determine the frontend base url dynamically
    host = request.headers.get("host", "")
    referer = request.headers.get("referer", "")
    
    # Default to production frontend url (as seen in browser screenshots: chakravyuha-avv.tech)
    frontend_base = "https://chakravyuha-avv.tech/"
    
    # If request is from localhost/127.0.0.1, use local frontend url (localhost:3000)
    if "localhost" in host or "127.0.0.1" in host or "localhost" in referer or "127.0.0.1" in referer:
        frontend_base = "http://localhost:3000/"
        
    verify_url = f"{frontend_base}verify/{current_user.id}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    qr_size = 180
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
    
    qr_x = (width - qr_size) // 2
    qr_y = 1040
    img.paste(qr_img, (qr_x, qr_y))
    
    draw.rectangle([qr_x - 3, qr_y - 3, qr_x + qr_size + 3, qr_y + qr_size + 3], outline=gold_primary, width=3)
    draw.text((width // 2, 1260), "SCAN TO VERIFY CERTIFICATE", fill=gold_primary, font=f_footer_label, anchor="mm")
    draw.text((width // 2, 1290), "Secured Digital Completion Registry", fill=(130, 130, 130), font=get_font(font_arial, 14), anchor="mm")
    
    # Stream the output
    stream = io.BytesIO()
    img.save(stream, "PNG")
    stream.seek(0)
    
    filename = f"Certificate_{current_user.roll_number}.png"
    return StreamingResponse(
        stream,
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/verify/{student_id}")
def verify_student_certificate(student_id: str, db: Session = Depends(get_db)):
    """Returns verification details of the student's certificate if eligible."""
    student = db.query(Student).filter(Student.id == student_id, Student.is_admin == False).first()
    if not student:
        raise HTTPException(status_code=404, detail="Invalid certificate or student not found.")
        
    solved_count = db.query(Submission).filter(
        Submission.student_id == student.id,
        Submission.solved == True
    ).count()
    
    if solved_count < 1:
        raise HTTPException(status_code=400, detail="Student has not met completion requirements.")
        
    return {
        "verified": True,
        "student_name": student.full_name,
        "student_roll": student.roll_number,
        "student_branch": student.branch,
        "student_year": student.year,
        "event_name": "YUKTI - DSA & Prompt Engineering Challenge",
        "date": "11/07/2026",
        "organization": "Chakravyuha Club, Amrita Vishwa Vidyapeetham"
    }

# ----------------- EVENTS & USER PROFILE ENDPOINTS -----------------

@router.get("/events")
def list_events(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lists all events and registration status for the logged-in student/admin."""
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    
    registered_event_ids = set()
    if not current_user.is_admin:
        regs = db.query(EventRegistration).filter(EventRegistration.student_id == current_user.id).all()
        registered_event_ids = {r.event_id for r in regs}
        
    result = []
    for e in events:
        result.append({
            "id": e.id,
            "name": e.name,
            "description": e.description,
            "status": e.status,
            "is_registered": e.id in registered_event_ids or current_user.is_admin
        })
    return result

@router.post("/events/{event_id}/register")
def register_event(event_id: int, current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Registers the student for a specific event."""
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot register for events.")
        
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
        
    if event.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot register for a completed event.")
        
    existing = db.query(EventRegistration).filter(
        EventRegistration.student_id == current_user.id,
        EventRegistration.event_id == event_id
    ).first()
    
    if existing:
        return {"detail": "Already registered for this event."}
        
    reg = EventRegistration(
        student_id=current_user.id,
        event_id=event_id
    )
    db.add(reg)
    db.commit()
    return {"detail": "Registration successful."}

@router.get("/profile")
def get_profile(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns student details and registered events list."""
    if current_user.is_admin:
        return {
            "name": current_user.full_name,
            "email": current_user.college_email,
            "roll_number": current_user.roll_number,
            "is_admin": True,
            "admin_role": current_user.admin_role,
            "registered_events": []
        }
        
    regs = db.query(EventRegistration).filter(EventRegistration.student_id == current_user.id).all()
    registered_events = []
    for r in regs:
        registered_events.append({
            "id": r.event.id,
            "name": r.event.name,
            "status": r.event.status,
            "registered_at": r.registered_at.isoformat() + "Z"
        })
        
    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.college_email,
        "roll_number": current_user.roll_number,
        "phone": current_user.phone_number,
        "branch": current_user.branch,
        "year": current_user.year,
        "is_admin": False,
        "registered_events": registered_events,
        "streak": current_user.streak_count
    }

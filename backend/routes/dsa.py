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
from backend.models import Student, Problem, Submission, Attendance, CodeChefContest, CodeChefParticipation, Feedback, Event, EventRegistration, SIHTeam, SIHTeamMember, SIHProblemStatement, SIHPSSelection
from backend.schemas import SubmissionCreate, SubmissionResponse, CodeChefParticipationResponse, FeedbackCreate, SIHTeamRegistration, PSSelectRequest
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
        # Parse year_restriction from description (encoded as "|year_restricted:1")
        year_restricted = None
        clean_description = e.description
        if "|year_restricted:" in e.description:
            parts = e.description.split("|year_restricted:")
            clean_description = parts[0].strip()
            try:
                year_restricted = int(parts[1].strip())
            except Exception:
                year_restricted = None

        result.append({
            "id": e.id,
            "name": e.name,
            "description": clean_description,
            "status": e.status,
            "is_registered": e.id in registered_event_ids or current_user.is_admin,
            "year_restricted": year_restricted,
        })
    return result

@router.get("/events/my-details")
def get_my_details_for_event(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the logged-in student's details for pre-filling an event registration form."""
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot register for events.")
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "college_email": current_user.college_email,
        "roll_number": current_user.roll_number or "N/A",
        "phone_number": current_user.phone_number,
        "branch": current_user.branch,
        "year": current_user.year,
        "qr_key": current_user.qr_key,
    }

@router.get("/events/sih/my-team")
def get_my_sih_team(current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves the SIH team and member details if the student is part of any team."""
    member = db.query(SIHTeamMember).filter(
        func.lower(SIHTeamMember.college_email) == current_user.college_email.lower().strip()
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="You are not registered in any SIH team.")
    
    team = db.query(SIHTeam).filter(SIHTeam.id == member.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
        
    all_m = db.query(SIHTeamMember).filter(SIHTeamMember.team_id == team.id).all()
    
    leader = next((m for m in all_m if m.is_leader), None)
    teammates = [m for m in all_m if not m.is_leader]
    
    is_leader = False
    if leader and leader.college_email.lower().strip() == current_user.college_email.lower().strip():
        is_leader = True
    
    return {
        "team_id": team.id,
        "team_name": team.team_name,
        "leader": leader,
        "members": teammates,
        "is_leader": is_leader,
        "created_at": team.created_at
    }

@router.put("/events/sih/my-team")
def update_my_sih_team(
    team_data: SIHTeamRegistration,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates the SIH team details. Only the Team Leader can perform this action."""
    member = db.query(SIHTeamMember).filter(
        func.lower(SIHTeamMember.college_email) == current_user.college_email.lower().strip()
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="You are not registered in any SIH team.")
        
    team = db.query(SIHTeam).filter(SIHTeam.id == member.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    leader_db_member = db.query(SIHTeamMember).filter(
        SIHTeamMember.team_id == team.id,
        SIHTeamMember.is_leader == True
    ).first()
    if not leader_db_member or current_user.college_email.lower().strip() != leader_db_member.college_email.lower().strip():
        raise HTTPException(
            status_code=403,
            detail="Only the Team Leader can edit the team details."
        )

    # Check team name uniqueness excluding this team
    existing_team = db.query(SIHTeam).filter(
        func.lower(SIHTeam.team_name) == func.lower(team_data.team_name.strip()),
        SIHTeam.id != team.id
    ).first()
    if existing_team:
        raise HTTPException(
            status_code=400,
            detail=f"Team name '{team_data.team_name}' is already taken by another team."
        )

    if len(team_data.members) != 5:
        raise HTTPException(
            status_code=400,
            detail="A team must consist of exactly 1 Team Leader and 5 teammates (total 6 members)."
        )

    all_members = [team_data.leader] + team_data.members
    domains = []
    for m in all_members:
        if "@" not in m.college_email:
            raise HTTPException(status_code=400, detail=f"Invalid college email format: {m.college_email}")
        domains.append(m.college_email.lower().split("@")[1].strip())

    if len(set(domains)) > 1:
        raise HTTPException(
            status_code=400,
            detail="All team members must belong to the exact same college (identical college email domains)."
        )

    genders = [m.gender for m in all_members]
    if "Woman" not in genders:
        raise HTTPException(
            status_code=400,
            detail="At least one female member (Woman) is mandatory in the team to nominate for SIH 2026."
        )

    all_college_emails = [m.college_email.lower().strip() for m in all_members]
    registered_students = db.query(Student).filter(
        func.lower(Student.college_email).in_(all_college_emails)
    ).all()
    registered_emails = {s.college_email.lower().strip() for s in registered_students}

    for m in all_members:
        email = m.college_email.lower().strip()
        if email not in registered_emails:
            raise HTTPException(
                status_code=400,
                detail=f"Teammate '{m.full_name}' ({m.college_email}) is not registered on the Chakravyuha website. All team members must be registered to participate in SIH."
            )

    all_personal_emails = [m.personal_email.lower().strip() for m in all_members]

    # Query duplicate members not in current team
    existing_member = db.query(SIHTeamMember).filter(
        (SIHTeamMember.team_id != team.id) & (
            (func.lower(SIHTeamMember.college_email).in_(all_college_emails)) |
            (func.lower(SIHTeamMember.personal_email).in_(all_personal_emails)) |
            (func.lower(SIHTeamMember.college_email).in_(all_personal_emails)) |
            (func.lower(SIHTeamMember.personal_email).in_(all_college_emails))
        )
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail=f"Member '{existing_member.full_name}' with email '{existing_member.college_email}' is already registered in another SIH team."
        )

    team.team_name = team_data.team_name.strip()

    # Re-fetch previous members to update event registration
    db_members = db.query(SIHTeamMember).filter(SIHTeamMember.team_id == team.id).all()
    db.query(SIHTeamMember).filter(SIHTeamMember.team_id == team.id).delete()

    leader_member = SIHTeamMember(
        team_id=team.id,
        is_leader=True,
        full_name=team_data.leader.full_name,
        college_email=team_data.leader.college_email.lower().strip(),
        personal_email=team_data.leader.personal_email.lower().strip(),
        phone_number=team_data.leader.phone_number,
        study_year=team_data.leader.study_year,
        branch=team_data.leader.branch,
        roll_number=team_data.leader.roll_number.upper().strip(),
        gender=team_data.leader.gender
    )
    db.add(leader_member)

    for tm in team_data.members:
        teammate = SIHTeamMember(
            team_id=team.id,
            is_leader=False,
            full_name=tm.full_name,
            college_email=tm.college_email.lower().strip(),
            personal_email=tm.personal_email.lower().strip(),
            phone_number=tm.phone_number,
            study_year=tm.study_year,
            branch=tm.branch,
            roll_number=tm.roll_number.upper().strip(),
            gender=tm.gender
        )
        db.add(teammate)

    db.commit()

    sih_event = db.query(Event).filter(Event.name.like("%Smart India Hackathon%")).first()
    if sih_event:
        old_college_emails = [m.college_email.lower().strip() for m in db_members]
        old_students = db.query(Student).filter(
            func.lower(Student.college_email).in_(old_college_emails)
        ).all()
        old_student_ids = {s.id for s in old_students}
        
        new_student_ids = {s.id for s in registered_students}
        
        to_remove_ids = old_student_ids - new_student_ids
        if to_remove_ids:
            db.query(EventRegistration).filter(
                EventRegistration.event_id == sih_event.id,
                EventRegistration.student_id.in_(list(to_remove_ids))
            ).delete(synchronize_session=False)
            
        for member_student in registered_students:
            existing_reg = db.query(EventRegistration).filter(
                EventRegistration.student_id == member_student.id,
                EventRegistration.event_id == sih_event.id
            ).first()
            if not existing_reg:
                reg = EventRegistration(
                    student_id=member_student.id,
                    event_id=sih_event.id
                )
                db.add(reg)
        db.commit()

    return {"detail": "Team details updated successfully!"}

@router.post("/events/sih/register")
def register_sih_team(
    team_data: SIHTeamRegistration,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registers a team of 6 members for the SIH 2026 Internal Hackathon."""
    # 1. Check if user is Team Leader
    if current_user.college_email.lower().strip() != team_data.leader.college_email.lower().strip():
        raise HTTPException(
            status_code=400,
            detail="Only the Team Leader can register the team. Your email must match the Team Leader's college email."
        )

    # 2. Check if team name is unique
    existing_team = db.query(SIHTeam).filter(func.lower(SIHTeam.team_name) == func.lower(team_data.team_name.strip())).first()
    if existing_team:
        raise HTTPException(
            status_code=400,
            detail=f"Team name '{team_data.team_name}' is already taken. Please choose a different name."
        )

    # 3. Check team size
    if len(team_data.members) != 5:
        raise HTTPException(
            status_code=400,
            detail="A team must consist of exactly 1 Team Leader and 5 teammates (total 6 members)."
        )

    # 4. Check college domain matching (same college rule)
    all_members = [team_data.leader] + team_data.members
    domains = []
    for m in all_members:
        if "@" not in m.college_email:
            raise HTTPException(status_code=400, detail=f"Invalid college email format: {m.college_email}")
        domains.append(m.college_email.lower().split("@")[1].strip())

    if len(set(domains)) > 1:
        raise HTTPException(
            status_code=400,
            detail="All team members must belong to the exact same college (identical college email domains)."
        )

    # 5. Check female member requirement
    genders = [m.gender for m in all_members]
    if "Woman" not in genders:
        raise HTTPException(
            status_code=400,
            detail="At least one female member (Woman) is mandatory in the team to nominate for SIH 2026."
        )

    # 5b. Enforce 20-team cap for all-1st-year teams
    # Mixed teams (with at least one 2nd/3rd/4th year) are exempt from this cap.
    all_first_year = all(m.study_year == 1 for m in all_members)
    if all_first_year:
        # Count existing teams where EVERY member is study_year = 1
        # We get all teams that have at least one member NOT in year 1, then subtract from total
        # Easier: find all team_ids where any member has study_year != 1, then exclude those
        non_first_year_team_ids = db.query(SIHTeamMember.team_id).filter(
            SIHTeamMember.study_year != 1
        ).distinct().all()
        excluded_ids = [row[0] for row in non_first_year_team_ids]

        total_teams = db.query(SIHTeam).count()
        mixed_or_senior_teams = len(excluded_ids)
        all_first_year_teams_count = total_teams - mixed_or_senior_teams

        if all_first_year_teams_count >= 20:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Registration limit reached: A maximum of 20 teams consisting entirely of 1st-year students "
                    "are allowed. This cap has been reached. Your team may still register if at least one member "
                    "is from 2nd, 3rd, or 4th year."
                )
            )

    # 5c. Enforce that every member must be registered on the website

    all_college_emails = [m.college_email.lower().strip() for m in all_members]
    registered_students = db.query(Student).filter(
        func.lower(Student.college_email).in_(all_college_emails)
    ).all()
    registered_emails = {s.college_email.lower().strip() for s in registered_students}

    for m in all_members:
        email = m.college_email.lower().strip()
        if email not in registered_emails:
            raise HTTPException(
                status_code=400,
                detail=f"Teammate '{m.full_name}' ({m.college_email}) is not registered on the Chakravyuha website. All team members must be registered to participate in SIH."
            )

    # 6. Check unique email constraint across all teams (prevent double registration of any member)
    all_personal_emails = [m.personal_email.lower().strip() for m in all_members]

    # Query duplicate members
    existing_member = db.query(SIHTeamMember).filter(
        (func.lower(SIHTeamMember.college_email).in_(all_college_emails)) |
        (func.lower(SIHTeamMember.personal_email).in_(all_personal_emails)) |
        (func.lower(SIHTeamMember.college_email).in_(all_personal_emails)) |
        (func.lower(SIHTeamMember.personal_email).in_(all_college_emails))
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=400,
            detail=f"Member '{existing_member.full_name}' with email '{existing_member.college_email}' is already registered in another SIH team."
        )

    # 7. Create team
    team = SIHTeam(
        team_name=team_data.team_name.strip(),
        leader_student_id=current_user.id
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # 8. Save leader member
    leader_member = SIHTeamMember(
        team_id=team.id,
        is_leader=True,
        full_name=team_data.leader.full_name,
        college_email=team_data.leader.college_email.lower().strip(),
        personal_email=team_data.leader.personal_email.lower().strip(),
        phone_number=team_data.leader.phone_number,
        study_year=team_data.leader.study_year,
        branch=team_data.leader.branch,
        roll_number=team_data.leader.roll_number.upper().strip(),
        gender=team_data.leader.gender
    )
    db.add(leader_member)

    # 9. Save teammate members
    for tm in team_data.members:
        teammate = SIHTeamMember(
            team_id=team.id,
            is_leader=False,
            full_name=tm.full_name,
            college_email=tm.college_email.lower().strip(),
            personal_email=tm.personal_email.lower().strip(),
            phone_number=tm.phone_number,
            study_year=tm.study_year,
            branch=tm.branch,
            roll_number=tm.roll_number.upper().strip(),
            gender=tm.gender
        )
        db.add(teammate)

    db.commit()

    # 10. Auto-register all 6 team members to the SIH event
    sih_event = db.query(Event).filter(Event.name.like("%Smart India Hackathon%")).first()
    if sih_event:
        for member_student in registered_students:
            existing_reg = db.query(EventRegistration).filter(
                EventRegistration.student_id == member_student.id,
                EventRegistration.event_id == sih_event.id
            ).first()
            if not existing_reg:
                reg = EventRegistration(
                    student_id=member_student.id,
                    event_id=sih_event.id
                )
                db.add(reg)
        db.commit()

    # 11. Send a premium HTML email confirmation to EVERY team member
    webhook_url = os.environ.get("POWER_AUTOMATE_SIGNUP_WEBHOOK_URL") or os.environ.get("POWER_AUTOMATE_EVENT_WEBHOOK_URL")
    if webhook_url:
        import requests
        
        roster_rows = ""
        for i, m in enumerate(all_members):
            role = "Leader" if i == 0 else f"Member {i}"
            roster_rows += f"""
            <tr>
              <td style="padding:6px 0;font-weight:700;color:#c5a059;">{role}</td>
              <td style="padding:6px 0;color:#ffffff;">{m.full_name} ({m.roll_number})</td>
              <td style="padding:6px 0;font-size:12px;color:#a1a1aa;">{m.college_email}</td>
            </tr>
            """

        for s in registered_students:
            qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={s.qr_key}"
            roll = s.roll_number or "N/A"
            
            html_body = f"""
<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;background:#0a0908;border:1px solid #c5a059;border-radius:12px;overflow:hidden;">

  <div style="background:linear-gradient(135deg,#1a1508 0%,#0a0908 50%,#1a1508 100%);padding:40px 30px 30px;text-align:center;border-bottom:2px solid #d4af37;">
    <div style="width:60px;height:60px;margin:0 auto 16px;border:2px solid #d4af37;border-radius:50%;line-height:60px;font-size:28px;">🚀</div>
    <h1 style="color:#d4af37;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-size:24px;margin:0 0 4px;">Smart India Hackathon 2026</h1>
    <p style="font-size:10px;text-transform:uppercase;color:#8c7030;letter-spacing:5px;margin:0;">Chakravyuha Club &bull; Internal Hackathon</p>
  </div>

  <div style="padding:35px 30px 10px;">
    <p style="font-size:13px;color:#d4af37;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin:0 0 12px;">🏆 Team Registration Confirmed</p>
    <h2 style="font-size:20px;color:#ffffff;margin:0 0 16px;font-weight:700;line-height:1.3;">
      Congratulations, Team <span style="color:#d4af37;">{team_data.team_name}</span>!
    </h2>
    <p style="font-size:14px;color:#d4d4d8;line-height:1.8;margin:0 0 8px;">
      Your team has been successfully registered for the **Smart India Hackathon 2026 Internal Hackathon**.
    </p>
    <p style="font-size:13px;color:#a1a1aa;line-height:1.7;margin:0 0 25px;">
      All team members must present their permanent attendance QR codes at the hackathon check-in desk on the day of the event.
    </p>
  </div>

  <div style="margin:0 30px 30px;background:linear-gradient(135deg,#1c1917,#151310);border:1px solid rgba(212,175,55,0.25);border-radius:10px;overflow:hidden;">
    <div style="background:rgba(212,175,55,0.08);padding:12px 20px;border-bottom:1px solid rgba(212,175,55,0.15);">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#d4af37;font-weight:800;">👥 Team Roster</p>
    </div>
    <div style="padding:20px;">
      <table style="width:100%;font-size:13px;color:#e4e4e7;border-collapse:collapse;">
        {roster_rows}
      </table>
    </div>
  </div>

  <div style="text-align:center;padding:0 30px 35px;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#d4af37;font-weight:700;margin:0 0 6px;">Your Credentials QR Code</p>
    <p style="font-size:12px;color:#71717a;margin:0 0 20px;">Present this at the check-in scanner</p>
    <div style="display:inline-block;padding:16px;background:#ffffff;border:3px solid #d4af37;border-radius:12px;box-shadow:0 8px 30px rgba(212,175,55,0.15);">
      <img src="{qr_image_url}" alt="Profile QR Code" style="width:180px;height:180px;display:block;" />
    </div>
  </div>

  <div style="text-align:center;padding:20px 30px 30px;">
    <p style="font-size:15px;color:#ffffff;font-weight:700;margin:0 0 6px;">Best of luck in the Hackathon! 🚀</p>
    <p style="font-size:12px;color:#71717a;margin:0 0 24px;">Build something extraordinary.</p>
    <div style="border-top:1px solid rgba(212,175,55,0.15);padding-top:20px;">
      <p style="font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:2px;margin:0;">Chakravyuha &bull; Official Coding &amp; DSA Club of Amrita &bull; Amaravati</p>
    </div>
  </div>

</div>
"""
            subject = f"Successfully registered SIH 2026 Team: {team_data.team_name}"
            payload = {
                "email": s.college_email,
                "full_name": s.full_name,
                "roll_number": roll,
                "qr_key": s.qr_key,
                "qr_image_url": qr_image_url,
                "subject": subject,
                "html_body": html_body
            }

            try:
                requests.post(webhook_url, json=payload, timeout=10)
            except Exception:
                pass

    return {"detail": "Team registered successfully!"}


@router.post("/events/{event_id}/register")
def register_event(
    event_id: str,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: "BackgroundTasks" = None,
):
    """Registers the student for a specific event. For orientation events, enforces year restriction and sends confirmation email."""
    from fastapi import BackgroundTasks as BT
    try:
        parsed_id = int(str(event_id).strip())
    except ValueError:
        raise HTTPException(status_code=400, detail="event_id must be a valid integer")
        
    if current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins cannot register for events.")
        
    event = db.query(Event).filter(Event.id == parsed_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
        
    if event.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot register for a completed event.")

    # Enforce year restriction if encoded in description
    year_restricted = None
    if "|year_restricted:" in event.description:
        try:
            year_restricted = int(event.description.split("|year_restricted:")[1].strip())
        except Exception:
            pass
    
    if year_restricted is not None and current_user.year != year_restricted:
        raise HTTPException(
            status_code=403,
            detail=f"This event is only open to Year {year_restricted} students. You are a Year {current_user.year} student."
        )
        
    existing = db.query(EventRegistration).filter(
        EventRegistration.student_id == current_user.id,
        EventRegistration.event_id == parsed_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already registered for this event.")
        
    reg = EventRegistration(
        student_id=current_user.id,
        event_id=parsed_id
    )
    db.add(reg)
    db.commit()

    # Send confirmation email for any event registration
    import os
    import logging
    import datetime as dt
    import requests
    _logger = logging.getLogger(__name__)
    webhook_url = os.environ.get("POWER_AUTOMATE_SIGNUP_WEBHOOK_URL") or os.environ.get("POWER_AUTOMATE_EVENT_WEBHOOK_URL")
    if webhook_url:
        qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={current_user.qr_key}"
        roll = current_user.roll_number or "N/A"
        
        event_notes = "This event registration is confirmed. Please present your profile QR code at the registration desk for verification and marking your attendance."
        if year_restricted is not None:
            event_notes = "This exclusive orientation is your first step into Chakravyuha's ecosystem — designed to help 1st year students understand SIH 2026, build winning teams, and start their competitive programming journey with expert mentorship."

        html_body = f"""
<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;background:#0a0908;border:1px solid #c5a059;border-radius:12px;overflow:hidden;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1a1508 0%,#0a0908 50%,#1a1508 100%);padding:40px 30px 30px;text-align:center;border-bottom:2px solid #d4af37;">
    <div style="width:60px;height:60px;margin:0 auto 16px;border:2px solid #d4af37;border-radius:50%;line-height:60px;font-size:28px;">🎯</div>
    <h1 style="color:#d4af37;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-size:28px;margin:0 0 4px;">CHAKRAVYUHA</h1>
    <p style="font-size:10px;text-transform:uppercase;color:#8c7030;letter-spacing:5px;margin:0;">Amrita Vishwa Vidyapeetham &bull; Amaravati</p>
  </div>

  <!-- EVENT CONFIRMATION -->
  <div style="padding:35px 30px 10px;">
    <p style="font-size:13px;color:#d4af37;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin:0 0 12px;">✅ Event Registration Confirmed</p>
    <h2 style="font-size:22px;color:#ffffff;margin:0 0 16px;font-weight:700;line-height:1.3;">
      You're registered, <span style="color:#d4af37;">{current_user.full_name}</span>!
    </h2>
    <p style="font-size:14px;color:#d4d4d8;line-height:1.8;margin:0 0 8px;">
      Successfully registered for the event: <strong style="color:#f6e05e;">{event.name}</strong>. Present this QR code for marking attendance.
    </p>
    <p style="font-size:13px;color:#a1a1aa;line-height:1.7;margin:0 0 25px;">
      {event_notes}
    </p>
  </div>

  <!-- CREDENTIALS CARD -->
  <div style="margin:0 30px 30px;background:linear-gradient(135deg,#1c1917,#151310);border:1px solid rgba(212,175,55,0.25);border-radius:10px;overflow:hidden;">
    <div style="background:rgba(212,175,55,0.08);padding:12px 20px;border-bottom:1px solid rgba(212,175,55,0.15);">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#d4af37;font-weight:800;">🔐 Your Registration Details</p>
    </div>
    <div style="padding:20px;">
      <table style="width:100%;font-size:14px;color:#e4e4e7;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-weight:700;width:140px;color:#c5a059;">Full Name</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:600;">{current_user.full_name}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid rgba(212,175,55,0.08);"></td></tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#c5a059;">Roll Number</td>
          <td style="padding:8px 0;font-family:'Courier New',monospace;letter-spacing:1px;">{roll}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid rgba(212,175,55,0.08);"></td></tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#c5a059;">Email</td>
          <td style="padding:8px 0;">{current_user.college_email}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid rgba(212,175,55,0.08);"></td></tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#c5a059;">Branch / Year</td>
          <td style="padding:8px 0;">{current_user.branch} — Year {current_user.year}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid rgba(212,175,55,0.08);"></td></tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#c5a059;">Warrior Key</td>
          <td style="padding:8px 0;font-family:'Courier New',monospace;color:#38bdf8;font-weight:700;">{current_user.qr_key}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- QR CODE -->
  <div style="text-align:center;padding:0 30px 35px;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#d4af37;font-weight:700;margin:0 0 6px;">Your Profile QR Code</p>
    <p style="font-size:12px;color:#71717a;margin:0 0 20px;">Carry/present this QR code for marking attendance</p>
    <div style="display:inline-block;padding:16px;background:#ffffff;border:3px solid #d4af37;border-radius:12px;box-shadow:0 8px 30px rgba(212,175,55,0.15);">
      <img src="{qr_image_url}" alt="Profile QR Code" style="width:180px;height:180px;display:block;" />
    </div>
  </div>

  <!-- FOOTER -->
  <div style="text-align:center;padding:20px 30px 30px;">
    <p style="font-size:15px;color:#ffffff;font-weight:700;margin:0 0 6px;">See you at the event! 🚀</p>
    <p style="font-size:12px;color:#71717a;margin:0 0 24px;">Prepare to build, compete, and conquer.</p>
    <div style="border-top:1px solid rgba(212,175,55,0.15);padding-top:20px;">
      <p style="font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:2px;margin:0;">Chakravyuha &bull; Official Coding &amp; DSA Club of Amrita &bull; Amaravati</p>
    </div>
  </div>

</div>
"""
        subject = f"Successfully registered for the event: {event.name}"
        payload = {
            "email": current_user.college_email,
            "full_name": current_user.full_name,
            "roll_number": roll,
            "qr_key": current_user.qr_key,
            "qr_image_url": qr_image_url,
            "subject": subject,
            "html_body": html_body
        }

        # Debug log
        try:
            debug_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "debug_emails.log")
            with open(debug_path, "a", encoding="utf-8") as f:
                f.write(f"{'='*60}\n")
                f.write(f"EVENT CONFIRMATION EMAIL\n")
                f.write(f"Timestamp : {dt.datetime.utcnow()}\n")
                f.write(f"Recipient : {current_user.college_email} ({current_user.full_name})\n")
                f.write(f"Event     : {event.name}\n")
                f.write(f"Subject   : {subject}\n")
                f.write(f"{'='*60}\n\n")
        except Exception as log_err:
            _logger.error(f"Failed to log event confirmation email: {log_err}")

        # Fire webhook
        try:
            resp = requests.post(webhook_url, json=payload, timeout=10)
            _logger.info(f"Event confirmation email webhook triggered for {current_user.college_email}, status {resp.status_code}")
        except Exception as wh_err:
            _logger.error(f"Failed to trigger event confirmation email webhook: {wh_err}")
    else:
        _logger.info("POWER_AUTOMATE_SIGNUP_WEBHOOK_URL not configured. Skipping webhook trigger.")

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

from pydantic import BaseModel
from typing import Optional

class ProfileUpdate(BaseModel):
    full_name: str
    college_email: str
    roll_number: Optional[str] = None
    phone_number: str
    branch: str
    year: int

@router.put("/profile")
def update_profile(data: ProfileUpdate, current_user: Student = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_admin:
        raise HTTPException(status_code=400, detail="Admin profiles cannot be updated through this endpoint.")
        
    # Check if email is already in use by another student
    if data.college_email != current_user.college_email:
        existing = db.query(Student).filter(Student.college_email == data.college_email, Student.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="College or personal email already in use.")
            
    # Check if roll number is already in use by another student
    if data.roll_number and data.roll_number.strip() != "":
        roll_num = data.roll_number.strip().upper()
        # Validate format
        if not roll_num.startswith('AV'):
             raise HTTPException(status_code=400, detail="Roll number must start with 'AV'")
        existing_roll = db.query(Student).filter(Student.roll_number == roll_num, Student.id != current_user.id).first()
        if existing_roll:
            raise HTTPException(status_code=400, detail="Roll number already in use by another student.")
        current_user.roll_number = roll_num
    else:
        current_user.roll_number = None

    current_user.full_name = data.full_name
    current_user.college_email = data.college_email
    current_user.phone_number = data.phone_number
    current_user.branch = data.branch
    current_user.year = data.year
    
    db.commit()
    return {"detail": "Profile updated successfully."}


# ── SIH Problem Statement Endpoints ──────────────────────────────────────────

@router.get("/events/sih/ps-list")
def get_ps_list(
    search: str = "",
    page: int = 1,
    limit: int = 20,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns paginated, searchable list of SIH 2026 problem statements."""
    query = db.query(SIHProblemStatement)
    if search.strip():
        s = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(SIHProblemStatement.ps_number).like(s) |
            func.lower(SIHProblemStatement.title).like(s) |
            func.lower(SIHProblemStatement.organization).like(s) |
            func.lower(SIHProblemStatement.theme).like(s)
        )
    total = query.count()
    offset = (page - 1) * limit
    items = query.order_by(SIHProblemStatement.ps_id).offset(offset).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": ps.id,
                "ps_id": ps.ps_id,
                "ps_number": ps.ps_number,
                "title": ps.title,
                "organization": ps.organization,
                "category": ps.category,
                "theme": ps.theme,
                "description": ps.description,
            }
            for ps in items
        ]
    }


@router.get("/events/sih/my-ps")
def get_my_ps(
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the current user's team's confirmed PS selection, or null."""
    member = db.query(SIHTeamMember).filter(
        func.lower(SIHTeamMember.college_email) == current_user.college_email.lower().strip()
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Not registered in any SIH team.")
    
    selection = db.query(SIHPSSelection).filter(SIHPSSelection.team_id == member.team_id).first()
    if not selection:
        return {"selection": None}
    
    ps = selection.problem_statement
    return {
        "selection": {
            "id": selection.id,
            "problem_statement_id": selection.problem_statement_id,
            "ps_id": ps.ps_id,
            "ps_number": ps.ps_number,
            "title": ps.title,
            "organization": ps.organization,
            "category": ps.category,
            "theme": ps.theme,
            "description": ps.description,
            "selected_at": selection.selected_at.isoformat() + "Z",
            "last_edited_by_admin": selection.last_edited_by_admin,
        }
    }


@router.post("/events/sih/ps-select")
def select_ps(
    payload: PSSelectRequest,
    current_user: Student = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Team leader confirms a PS selection for their team. One-time and irreversible."""
    # Check deadline: 24-08-2026 7:00 PM IST -> 2026-08-24 13:30:00 UTC
    deadline = datetime.datetime(2026, 8, 24, 13, 30, 0)
    if datetime.datetime.utcnow() > deadline:
        raise HTTPException(
            status_code=400,
            detail="The Problem Statement selection deadline (24 Aug 2026, 7:00 PM IST) has passed. You can no longer select a Problem Statement."
        )

    # Must be a registered team member
    member = db.query(SIHTeamMember).filter(
        func.lower(SIHTeamMember.college_email) == current_user.college_email.lower().strip()
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="You are not registered in any SIH team.")

    # Must be team leader
    if not member.is_leader:
        raise HTTPException(status_code=403, detail="Only the Team Leader can select the Problem Statement.")

    # Check if already selected (irreversible)
    existing = db.query(SIHPSSelection).filter(SIHPSSelection.team_id == member.team_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Your team has already confirmed a Problem Statement. This cannot be changed."
        )

    # Validate PS exists
    ps = db.query(SIHProblemStatement).filter(SIHProblemStatement.id == payload.problem_statement_id).first()
    if not ps:
        raise HTTPException(status_code=404, detail="Problem Statement not found.")

    # Save selection
    selection = SIHPSSelection(
        team_id=member.team_id,
        problem_statement_id=ps.id,
        selected_at=datetime.datetime.utcnow(),
        last_edited_by_admin=False
    )
    db.add(selection)
    db.commit()
    db.refresh(selection)

    return {
        "detail": "Problem Statement confirmed successfully!",
        "ps_number": ps.ps_number,
        "title": ps.title,
    }

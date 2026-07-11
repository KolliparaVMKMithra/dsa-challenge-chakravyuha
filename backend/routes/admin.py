import datetime
import os
import io
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

from backend.database import get_db
from backend.models import Student, Problem, Submission, Attendance, CodeChefContest, CodeChefParticipation, Feedback
from backend.schemas import ProblemCreate, ProblemResponse, CodeChefContestCreate, CodeChefContestResponse, ScanAdminCreate, ScanAdminResponse
from backend.auth import get_current_attendance_admin, get_current_super_admin, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger(__name__)

DEBUG_EMAILS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "debug_emails.log")

@router.post("/scan")
def scan_qr(payload: Dict[str, str], current_admin: Student = Depends(get_current_attendance_admin), db: Session = Depends(get_db)):
    """Scans a student's QR key and marks them present for the day."""
    qr_key = payload.get("qr_key")
    session = payload.get("session", "forenoon")
    if not qr_key:
        raise HTTPException(status_code=400, detail="qr_key is required")
        
    student = db.query(Student).filter(Student.qr_key == qr_key).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with this QR code")
        
    today = datetime.date.today()
    
    # Check duplicate attendance
    existing = db.query(Attendance).filter(
        Attendance.student_id == student.id,
        Attendance.date == today,
        Attendance.session == session
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Attendance already marked for {session.capitalize()} today for {student.full_name} ({student.roll_number})"
        )
        
    # Mark present
    attendance = Attendance(
        student_id=student.id,
        date=today,
        session=session,
        marked_by=current_admin.full_name
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return {
        "success": True,
        "student_name": student.full_name,
        "name": student.full_name,
        "roll_number": student.roll_number,
        "branch": student.branch,
        "year": student.year,
        "session": session.capitalize(),
        "time": attendance.timestamp.strftime("%d-%m-%Y %I:%M %p")
    }

@router.get("/attendance/today")
def get_today_attendance(session: str = "forenoon", current_admin: Student = Depends(get_current_attendance_admin), db: Session = Depends(get_db)):
    """Lists all students marked present today for the specified session."""
    today = datetime.date.today()
    records = db.query(
        Attendance.timestamp,
        Attendance.marked_by,
        Student.full_name,
        Student.roll_number,
        Student.branch,
        Student.year,
        Attendance.session
    ).join(Student, Attendance.student_id == Student.id)\
     .filter(Attendance.date == today, Attendance.session == session)\
     .order_by(Attendance.timestamp.desc()).all()
     
    return [
        {
            "timestamp": r[0],
            "marked_by": r[1],
            "full_name": r[2],
            "name": r[2],
            "roll_number": r[3],
            "branch": r[4],
            "year": r[5],
            "session": r[6]
        } for r in records
    ]


@router.get("/attendance/export")
def export_attendance(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_admin: Student = Depends(get_current_attendance_admin),
    db: Session = Depends(get_db)
):
    """Exports attendance log as a styled Excel sheet using openpyxl."""
    query = db.query(
        Attendance.date,
        Attendance.timestamp,
        Attendance.marked_by,
        Student.full_name,
        Student.roll_number,
        Student.branch,
        Student.year,
        Attendance.session
    ).join(Student, Attendance.student_id == Student.id)
    
    if start_date:
        try:
            s_date = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(Attendance.date >= s_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format, use YYYY-MM-DD")
            
    if end_date:
        try:
            e_date = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(Attendance.date <= e_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format, use YYYY-MM-DD")
            
    records = query.order_by(Attendance.date.desc(), Attendance.timestamp.desc()).all()
    
    # Generate Excel using openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance Logs"
    
    # Title Banner
    ws.merge_cells("A1:H1")
    ws["A1"] = "Chakravyuha Daily DSA Challenge - Attendance Logs"
    ws["A1"].font = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws["A1"].fill = PatternFill(start_color="8C7030", end_color="8C7030", fill_type="solid") # Gold/amber
    ws.row_dimensions[1].height = 40
    
    # Headers
    headers = ["Date", "Session", "Time", "Roll Number", "Full Name", "Branch", "Year", "Marked By"]
    ws.append([]) # Blank row 2
    ws.append(headers) # Row 3
    
    # Format Headers (Row 3)
    header_fill = PatternFill(start_color="2A2A2A", end_color="2A2A2A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )
    
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=3, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        cell.border = thin_border
        
    # Append Data
    for rec in records:
        row_data = [
            rec[0].strftime("%Y-%m-%d"),
            rec[7].capitalize(),
            rec[1].strftime("%I:%M %p"),
            rec[4],
            rec[3],
            rec[5],
            rec[6],
            rec[2]
        ]
        ws.append(row_data)
        
    # Style Data Cells
    for row in range(4, ws.max_row + 1):
        # Alternate row fill
        row_fill = PatternFill(start_color="F9F9F9" if row % 2 == 0 else "FFFFFF", end_color="F9F9F9" if row % 2 == 0 else "FFFFFF", fill_type="solid")
        for col in range(1, 9):
            cell = ws.cell(row=row, column=col)
            cell.fill = row_fill
            cell.border = thin_border
            if col in [1, 2, 3, 4, 7]:
                cell.alignment = Alignment(horizontal="center")
                
    # Auto-adjust column widths
    for col in ws.columns:
        max_len = 0
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        for cell in col:
            val = str(cell.value or '')
            if cell.row == 1:
                continue
            if len(val) > max_len:
                max_len = len(val)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    filename = f"attendance_report_{start_date or 'all'}_to_{end_date or 'all'}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/students")
def get_students_directory(
    search: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    current_admin: Student = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Fetches a detailed list of students with progress summaries."""
    query = db.query(Student).filter(Student.is_admin == False)
    
    if search:
        search_lower = search.lower()
        query = query.filter(
            (func.lower(Student.full_name).like(f"%{search_lower}%")) |
            (func.lower(Student.roll_number).like(f"%{search_lower}%")) |
            (func.lower(Student.college_email).like(f"%{search_lower}%"))
        )
    if branch:
        query = query.filter(Student.branch == branch)
    if year:
        query = query.filter(Student.year == year)
        
    students = query.order_by(Student.roll_number).all()
    
    result = []
    # Fetch problem count for percentage calculations
    total_problems = db.query(func.count(Problem.id)).filter(Problem.is_active == True).scalar() or 0
    
    for s in students:
        solved_count = db.query(func.count(Submission.id)).filter(
            Submission.student_id == s.id,
            Submission.solved == True
        ).scalar() or 0
        
        attendance_count = db.query(func.count(Attendance.id)).filter(Attendance.student_id == s.id).scalar() or 0
        
        result.append({
            "id": s.id,
            "name": s.full_name,
            "roll_number": s.roll_number,
            "email": s.college_email,
            "phone": s.phone_number,
            "branch": s.branch,
            "year": s.year,
            "streak": s.streak_count,
            "solved": solved_count,
            "total_problems": total_problems,
            "percentage": round(solved_count / total_problems * 100, 1) if total_problems > 0 else 0,
            "attendance_count": attendance_count
        })
        
    return result

@router.get("/students/export")
def export_students_directory(
    search: Optional[str] = Query(None),
    branch: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    current_admin: Student = Depends(get_current_super_admin),
    db: Session = Depends(get_db)
):
    """Exports the student directory progress report as a styled Excel sheet using openpyxl."""
    query = db.query(Student).filter(Student.is_admin == False)
    if search:
        search_lower = search.lower()
        query = query.filter(
            (func.lower(Student.full_name).like(f"%{search_lower}%")) |
            (func.lower(Student.roll_number).like(f"%{search_lower}%")) |
            (func.lower(Student.college_email).like(f"%{search_lower}%"))
        )
    if branch:
        query = query.filter(Student.branch == branch)
    if year:
        query = query.filter(Student.year == year)
        
    students = query.order_by(Student.roll_number).all()
    total_problems = db.query(func.count(Problem.id)).filter(Problem.is_active == True).scalar() or 0
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Student Progress"
    
    # Title Banner
    ws.merge_cells("A1:J1")
    ws["A1"] = "Chakravyuha Daily DSA Challenge - Student Progress Report"
    ws["A1"].font = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws["A1"].fill = PatternFill(start_color="8C7030", end_color="8C7030", fill_type="solid")
    ws.row_dimensions[1].height = 40
    
    headers = ["Roll Number", "Full Name", "Email", "Phone", "Branch", "Year", "Streak", "Forenoon Attendance", "Afternoon Attendance", "Solved", "Total", "Solve %"]
    ws.append([]) # Blank row 2
    ws.append(headers) # Row 3
    
    header_fill = PatternFill(start_color="2A2A2A", end_color="2A2A2A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )
    
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=3, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        cell.border = thin_border
        
    for s in students:
        solved_count = db.query(func.count(Submission.id)).filter(
            Submission.student_id == s.id,
            Submission.solved == True
        ).scalar() or 0
        
        forenoon_count = db.query(func.count(Attendance.id)).filter(
            Attendance.student_id == s.id,
            Attendance.session == "forenoon"
        ).scalar() or 0
        
        afternoon_count = db.query(func.count(Attendance.id)).filter(
            Attendance.student_id == s.id,
            Attendance.session == "afternoon"
        ).scalar() or 0
        
        pct = round(solved_count / total_problems * 100, 1) if total_problems > 0 else 0
        
        row_data = [
            s.roll_number,
            s.full_name,
            s.college_email,
            s.phone_number,
            s.branch,
            s.year,
            s.streak_count,
            forenoon_count,
            afternoon_count,
            solved_count,
            total_problems,
            f"{pct}%"
        ]
        ws.append(row_data)
        
    for row in range(4, ws.max_row + 1):
        row_fill = PatternFill(start_color="F9F9F9" if row % 2 == 0 else "FFFFFF", fill_type="solid")
        for col in range(1, 13):
            cell = ws.cell(row=row, column=col)
            cell.fill = row_fill
            cell.border = thin_border
            if col in [1, 5, 6, 7, 8, 9, 10, 11, 12]:
                cell.alignment = Alignment(horizontal="center")
                
    for col in ws.columns:
        max_len = 0
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        for cell in col:
            val = str(cell.value or '')
            if cell.row == 1:
                continue
            if len(val) > max_len:
                max_len = len(val)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=student_progress_report.xlsx"}
    )

@router.get("/students/{student_id}/detail")
def get_student_detail(student_id: str, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Fetches full progress details, submissions, and logs for a specific student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Submissions
    submissions = db.query(
        Submission.completed_at,
        Submission.submission_link,
        Problem.title,
        Problem.topic,
        Problem.difficulty
    ).join(Problem, Submission.problem_id == Problem.id)\
     .filter(Submission.student_id == student_id).order_by(Submission.completed_at.desc()).all()
     
    # Attendance
    attendance = db.query(Attendance).filter(Attendance.student_id == student_id).order_by(Attendance.date.desc()).all()
    
    # CodeChef
    codechef = db.query(
        CodeChefContest.week_number,
        CodeChefParticipation.status,
        CodeChefParticipation.submission_proof,
        CodeChefParticipation.updated_at
    ).join(CodeChefParticipation, CodeChefContest.id == CodeChefParticipation.contest_id)\
     .filter(CodeChefParticipation.student_id == student_id).order_by(CodeChefContest.week_number.desc()).all()
     
    return {
        "student": {
            "id": student.id,
            "name": student.full_name,
            "roll_number": student.roll_number,
            "email": student.college_email,
            "phone": student.phone_number,
            "branch": student.branch,
            "year": student.year,
            "streak": student.streak_count,
            "qr_key": student.qr_key
        },
        "submissions": [
            {
                "title": s[2],
                "topic": s[3],
                "difficulty": s[4],
                "link": s[1],
                "date": f"{s[0].isoformat()}Z" if (s[0] and s[0] >= datetime.datetime(2026, 7, 10, 15, 0, 0)) else None
            } for s in submissions
        ],
        "attendance": [
            {
                "date": f"{d_str} ({', '.join(['FN' if s == 'forenoon' else 'AN' for s in sorted(list(set(d_data['sessions'])))])})",
                "timestamp": d_data["timestamp"],
                "marked_by": ", ".join(list(set(d_data["marked_by_list"])))
            } for d_str, d_data in (lambda atts: (
                lambda grouped: (
                    [grouped.setdefault(a.date.strftime("%Y-%m-%d"), {"sessions": [], "marked_by_list": [], "timestamp": a.timestamp})["sessions"].append(a.session) or 
                     grouped[a.date.strftime("%Y-%m-%d")]["marked_by_list"].append(a.marked_by)
                     for a in atts],
                    grouped
                )[1]
            )({}))(attendance).items()
        ],
        "codechef": [
            {
                "week": c[0],
                "status": c[1],
                "proof": c[2],
                "date": c[3]
            } for c in codechef
        ]
    }

# ----------------- PROBLEM CRUD -----------------

@router.get("/problems", response_model=List[ProblemResponse])
def list_problems(current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    return db.query(Problem).order_by(Problem.topic, Problem.id).all()

@router.post("/problems", response_model=ProblemResponse)
def add_problem(prob: ProblemCreate, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    db_prob = Problem(**prob.model_dump())
    db.add(db_prob)
    db.commit()
    db.refresh(db_prob)
    return db_prob

@router.put("/problems/{problem_id}", response_model=ProblemResponse)
def update_problem(
    problem_id: int, 
    prob_data: ProblemCreate, 
    current_admin: Student = Depends(get_current_super_admin), 
    db: Session = Depends(get_db)
):
    db_prob = db.query(Problem).filter(Problem.id == problem_id).first()
    if not db_prob:
        raise HTTPException(status_code=404, detail="Problem not found")
        
    for k, v in prob_data.model_dump().items():
        setattr(db_prob, k, v)
        
    db.commit()
    db.refresh(db_prob)
    return db_prob

@router.delete("/problems/{problem_id}")
def delete_problem(problem_id: int, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    db_prob = db.query(Problem).filter(Problem.id == problem_id).first()
    if not db_prob:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Hard or soft delete? Let's delete
    db.delete(db_prob)
    db.commit()
    return {"detail": "Problem deleted successfully"}

# ----------------- CODECHEF MANAGEMENT -----------------

@router.post("/codechef/contest", response_model=CodeChefContestResponse)
def create_codechef_contest(
    contest_data: CodeChefContestCreate, 
    current_admin: Student = Depends(get_current_super_admin), 
    db: Session = Depends(get_db)
):
    # Check if week already exists
    existing = db.query(CodeChefContest).filter(CodeChefContest.week_number == contest_data.week_number).first()
    if existing:
        # Update it
        existing.contest_link = contest_data.contest_link
        existing.deadline = contest_data.deadline
        db.commit()
        db.refresh(existing)
        return existing
        
    new_contest = CodeChefContest(**contest_data.model_dump())
    db.add(new_contest)
    db.commit()
    db.refresh(new_contest)
    return new_contest

# ----------------- BULK EMAIL BROADCASTER -----------------

@router.post("/bulk-email")
def send_bulk_email(payload: Dict[str, Any], current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Simulates broadcasting emails to filtered or specific students via Office 365 / Power Automate integration."""
    subject = payload.get("subject")
    body = payload.get("body")
    filter_type = payload.get("filter_type", "all") # all, missed_codechef, inactive, or custom
    student_ids = payload.get("student_ids") # list of UUID strings
    
    if not subject or not body:
        raise HTTPException(status_code=400, detail="subject and body are required")
        
    if student_ids is not None:
        recipients = db.query(Student).filter(Student.is_admin == False, Student.id.in_(student_ids)).all()
    else:
        # Get filtered students
        query = db.query(Student).filter(Student.is_admin == False)
        
        if filter_type == "missed_codechef":
            # Find latest CodeChef contest
            latest_contest = db.query(CodeChefContest).order_by(CodeChefContest.week_number.desc()).first()
            if latest_contest:
                # Subquery of students who attended
                attended_sub = db.query(CodeChefParticipation.student_id).filter(
                    CodeChefParticipation.contest_id == latest_contest.id,
                    CodeChefParticipation.status == "attended"
                )
                query = query.filter(~Student.id.in_(attended_sub))
                
        elif filter_type == "inactive":
            # Students with 0 solved problems
            active_sub = db.query(Submission.student_id).filter(Submission.solved == True).distinct()
            query = query.filter(~Student.id.in_(active_sub))
            
        recipients = query.all()
    
    # Format and save debug email log
    log_content = (
        f"========================================\n"
        f"BULK EMAIL BROADCAST: {subject}\n"
        f"Timestamp: {datetime.datetime.utcnow()}\n"
        f"Sender: {current_admin.college_email} (Admin)\n"
        f"Filter Group: {filter_type}\n"
        f"Recipient Count: {len(recipients)}\n"
        f"Recipients: {', '.join([s.college_email for s in recipients])}\n"
        f"----------------------------------------\n"
        f"Body:\n{body}\n"
        f"========================================\n\n"
    )
    
    try:
        with open(DEBUG_EMAILS_PATH, "a", encoding="utf-8") as f:
            f.write(log_content)
    except Exception as e:
        logger.error(f"Failed to log bulk email: {e}")
        
    logger.info(f"Broadcasted bulk email to {len(recipients)} users (filter: {filter_type})")
    
    # Power Automate Webhook Stub
    # If POWER_AUTOMATE_WEBHOOK_URL env is set:
    # requests.post(WEBHOOK_URL, json={"subject": subject, "body": body, "emails": [s.college_email for s in recipients]})
    
    return {
        "success": True,
        "recipient_count": len(recipients),
        "recipients": [s.full_name for s in recipients]
    }

# ----------------- REPORTS & ANALYTICS -----------------

@router.get("/reports/dashboard")
def get_reports_dashboard(current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Fetches high-level metrics, leaderboard, solve rates, and CodeChef compliance rates."""
    # 1. High level aggregates
    total_students = db.query(func.count(Student.id)).filter(Student.is_admin == False).scalar() or 0
    total_problems = db.query(func.count(Problem.id)).filter(Problem.is_active == True).scalar() or 0
    
    # 2. Leaderboard (Top 10 solvers)
    leaderboard_query = db.query(
        Student.full_name,
        Student.roll_number,
        Student.branch,
        Student.year,
        Student.streak_count,
        func.count(Submission.id).label("solved_count")
    ).join(Submission, Student.id == Submission.student_id)\
     .filter(Student.is_admin == False, Submission.solved == True)\
     .group_by(Student.id)\
     .order_by(func.count(Submission.id).desc(), Student.streak_count.desc())\
     .limit(10).all()
     
    leaderboard = [
        {
            "name": r[0],
            "roll_number": r[1],
            "branch": r[2],
            "year": r[3],
            "streak": r[4],
            "solved": r[5]
        } for r in leaderboard_query
    ]
    
    # 3. Topic-wise solve rates across the club
    # Number of students solved each topic
    topic_rates = db.query(
        Problem.topic,
        func.count(Submission.id).label("total_solved")
    ).join(Submission, Problem.id == Submission.problem_id)\
     .filter(Submission.solved == True)\
     .group_by(Problem.topic).all()
     
    # Active problems count per topic
    topic_problems_count = db.query(
        Problem.topic,
        func.count(Problem.id)
    ).filter(Problem.is_active == True)\
     .group_by(Problem.topic).all()
     
    prob_counts = {t[0]: t[1] for t in topic_problems_count}
    
    topic_solve_stats = []
    for topic, solved in topic_rates:
        prob_count = prob_counts.get(topic, 0)
        max_possible_solved = total_students * prob_count if total_students > 0 else 0
        solve_rate = (solved / max_possible_solved * 100) if max_possible_solved > 0 else 0
        topic_solve_stats.append({
            "topic": topic,
            "solved_count": solved,
            "total_problems": prob_count,
            "rate": round(solve_rate, 1)
        })
        
    # Sort by rate descending
    topic_solve_stats.sort(key=lambda x: x["rate"], reverse=True)
    
    # 4. CodeChef compliance rates
    # Get latest contest
    latest_contest = db.query(CodeChefContest).order_by(CodeChefContest.week_number.desc()).first()
    compliance = {"week": None, "attended": 0, "missed": 0, "rate": 0}
    
    if latest_contest:
        attended = db.query(func.count(CodeChefParticipation.id)).filter(
            CodeChefParticipation.contest_id == latest_contest.id,
            CodeChefParticipation.status == "attended"
        ).scalar() or 0
        
        missed = total_students - attended
        compliance = {
            "week": latest_contest.week_number,
            "attended": attended,
            "missed": max(0, missed),
            "rate": round(attended / total_students * 100, 1) if total_students > 0 else 0
        }
        
    # 5. Weekly attendance trend (Last 7 days)
    today = datetime.date.today()
    attendance_trend = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        att_count = db.query(func.count(Attendance.id)).filter(Attendance.date == day).scalar() or 0
        attendance_trend.append({
            "date": day.strftime("%b %d"),
            "present": att_count,
            "absent": max(0, total_students - att_count)
        })
        
    return {
        "total_students": total_students,
        "total_problems": total_problems,
        "leaderboard": leaderboard,
        "topic_solve_rates": topic_solve_stats,
        "codechef_compliance": compliance,
        "attendance_trend": attendance_trend
    }

# ----------------- SCAN ADMINS MANAGEMENT -----------------

@router.get("/scan-admins", response_model=List[ScanAdminResponse])
def list_scan_admins(current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Lists all Scan Admins (attendance role)."""
    return db.query(Student).filter(Student.is_admin == True, Student.admin_role == "attendance").order_by(Student.created_at.desc()).all()

@router.post("/scan-admins", response_model=ScanAdminResponse)
def create_scan_admin(admin_data: ScanAdminCreate, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Creates a new Scan Admin or promotes/updates an existing user."""
    existing = db.query(Student).filter(
        (Student.college_email == admin_data.college_email) |
        (Student.roll_number == admin_data.roll_number)
    ).first()

    if existing:
        # Promote or update existing user
        existing.is_admin = True
        existing.admin_role = "attendance"
        existing.full_name = admin_data.full_name
        existing.phone_number = admin_data.phone_number
        if admin_data.password:
            existing.password_hash = get_password_hash(admin_data.password)
        db.commit()
        db.refresh(existing)
        return existing

    import uuid
    secret_suffix = uuid.uuid4().hex[:8].upper()
    qr_key = f"CHAKRA-{admin_data.roll_number}-{secret_suffix}"

    db_admin = Student(
        full_name=admin_data.full_name,
        college_email=admin_data.college_email,
        roll_number=admin_data.roll_number,
        phone_number=admin_data.phone_number,
        branch="ADMIN",
        year=1,
        password_hash=get_password_hash(admin_data.password),
        qr_key=qr_key,
        is_admin=True,
        admin_role="attendance"
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

@router.delete("/scan-admins/{admin_id}")
def delete_scan_admin(admin_id: str, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Deletes a Scan Admin."""
    db_admin = db.query(Student).filter(Student.id == admin_id, Student.is_admin == True, Student.admin_role == "attendance").first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Scan Admin not found.")

    db.delete(db_admin)
    db.commit()
    return {"detail": "Scan Admin deleted successfully."}

# ----------------- SUPER ADMINS MANAGEMENT -----------------

@router.get("/super-admins", response_model=List[ScanAdminResponse])
def list_super_admins(current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Lists all Super Admins."""
    return db.query(Student).filter(Student.is_admin == True, Student.admin_role == "super").order_by(Student.created_at.desc()).all()

@router.post("/super-admins", response_model=ScanAdminResponse)
def create_super_admin(admin_data: ScanAdminCreate, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Creates a new Super Admin or promotes/updates an existing user."""
    existing = db.query(Student).filter(
        (Student.college_email == admin_data.college_email) |
        (Student.roll_number == admin_data.roll_number)
    ).first()

    if existing:
        # Promote or update existing user
        existing.is_admin = True
        existing.admin_role = "super"
        existing.full_name = admin_data.full_name
        existing.phone_number = admin_data.phone_number
        if admin_data.password:
            existing.password_hash = get_password_hash(admin_data.password)
        db.commit()
        db.refresh(existing)
        return existing

    import uuid
    secret_suffix = uuid.uuid4().hex[:8].upper()
    qr_key = f"CHAKRA-{admin_data.roll_number}-{secret_suffix}"

    db_admin = Student(
        full_name=admin_data.full_name,
        college_email=admin_data.college_email,
        roll_number=admin_data.roll_number,
        phone_number=admin_data.phone_number,
        branch="ADMIN",
        year=1,
        password_hash=get_password_hash(admin_data.password),
        qr_key=qr_key,
        is_admin=True,
        admin_role="super"
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

@router.delete("/super-admins/{admin_id}")
def delete_super_admin(admin_id: str, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Deletes a Super Admin (prevents self-deletion)."""
    if admin_id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself.")

    db_admin = db.query(Student).filter(Student.id == admin_id, Student.is_admin == True, Student.admin_role == "super").first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Super Admin not found.")

    db.delete(db_admin)
    db.commit()
    return {"detail": "Super Admin deleted successfully."}

# ----------------- STUDENT DELETION -----------------

@router.delete("/students/{student_id}")
def delete_student(student_id: str, current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Deletes a student entirely from the database."""
    student = db.query(Student).filter(Student.id == student_id, Student.is_admin == False).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    db.delete(student)
    db.commit()
    return {"detail": "Student and all their associated records deleted successfully."}

# ----------------- FEEDBACK MANAGEMENT -----------------

@router.get("/feedback")
def get_all_feedback(current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Lists all student feedback submissions (Super Admin only)."""
    feedbacks = db.query(Feedback).join(Student, Feedback.student_id == Student.id).order_by(Feedback.submitted_at.desc()).all()
    result = []
    for f in feedbacks:
        result.append({
            "id": f.id,
            "student_id": f.student_id,
            "student_name": f.student.full_name,
            "student_roll": f.student.roll_number,
            "student_email": f.student.college_email,
            "student_branch": f.student.branch,
            "student_year": f.student.year,
            "q1_dsa_difficulty": f.q1_dsa_difficulty,
            "q2_dsa_clarity": f.q2_dsa_clarity,
            "q3_time_spent": f.q3_time_spent,
            "q4_solving_mode": f.q4_solving_mode,
            "q5_prompting_used": f.q5_prompting_used,
            "q6_prompting_effectiveness": f.q6_prompting_effectiveness,
            "q7_prompt_type": f.q7_prompt_type,
            "q8_prompt_challenge": f.q8_prompt_challenge,
            "q9_concept_understanding": f.q9_concept_understanding,
            "q10_platform_rating": f.q10_platform_rating,
            "q11_attendance_experience": f.q11_attendance_experience,
            "q12_codechef_interest": f.q12_codechef_interest,
            "q13_future_topics": f.q13_future_topics,
            "q14_prompting_improvement": f.q14_prompting_improvement,
            "q15_general_feedback": f.q15_general_feedback,
            "submitted_at": f.submitted_at.isoformat() + "Z"
        })
    return result

@router.get("/feedback/export")
def export_feedback(current_admin: Student = Depends(get_current_super_admin), db: Session = Depends(get_db)):
    """Exports all student feedback submissions to an Excel sheet (Super Admin only)."""
    feedbacks = db.query(Feedback).join(Student, Feedback.student_id == Student.id).order_by(Student.roll_number).all()
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Student Feedback"
    
    # Title Banner
    ws.merge_cells("A1:U1")
    ws["A1"] = "Chakravyuha DSA Challenge & Prompting - Student Feedback Report"
    ws["A1"].font = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws["A1"].fill = PatternFill(start_color="8C7030", end_color="8C7030", fill_type="solid")
    ws.row_dimensions[1].height = 40
    
    headers = [
        "Roll Number", "Full Name", "Email", "Branch", "Year",
        "Q1: Overall Event Rating", "Q2: Liked Event Structure", "Q3: Met Expectations", "Q4: Learned Anything New",
        "Q5: Improved Coding Confidence", "Q6: DSA Concept Understanding", "Q7: Practical Application Helpfulness",
        "Q8: Most Understood DSA Concepts", "Q9: AI Prompting Helpfulness", "Q10: Platform Experience Rating",
        "Q11: Problem Statement Clarity", "Q12: Future Attendance Likelihood", "Q13: Favorite Event Aspects",
        "Q14: Recommend to Peers", "Q15: Coordinator Suggestions", "Submitted At"
    ]
    ws.append([]) # blank row 2
    ws.append(headers) # Row 3
    
    header_fill = PatternFill(start_color="2A2A2A", end_color="2A2A2A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD'),
        top=Side(style='thin', color='DDDDDD'),
        bottom=Side(style='thin', color='DDDDDD')
    )
    
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=3, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        cell.border = thin_border
        
    for f in feedbacks:
        row_data = [
            f.student.roll_number,
            f.student.full_name,
            f.student.college_email,
            f.student.branch,
            f.student.year,
            f.q1_dsa_difficulty,
            f.q2_dsa_clarity,
            f.q3_time_spent,
            f.q4_solving_mode,
            f.q5_prompting_used,
            f.q6_prompting_effectiveness,
            f.q7_prompt_type,
            f.q8_prompt_challenge,
            f.q9_concept_understanding,
            f.q10_platform_rating,
            f.q11_attendance_experience,
            f.q12_codechef_interest,
            f.q13_future_topics,
            f.q14_prompting_improvement,
            f.q15_general_feedback,
            f.submitted_at.strftime("%d-%m-%Y %I:%M %p")
        ]
        ws.append(row_data)
        
    for row in range(4, ws.max_row + 1):
        row_fill = PatternFill(start_color="F9F9F9" if row % 2 == 0 else "FFFFFF", fill_type="solid")
        for col in range(1, 22):
            cell = ws.cell(row=row, column=col)
            cell.fill = row_fill
            cell.border = thin_border
            if col in [1, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 19, 21]:
                cell.alignment = Alignment(horizontal="center")
                
    for col in ws.columns:
        max_len = 0
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        for cell in col:
            if cell.row == 1:
                continue
            val = str(cell.value or '')
            if len(val) > max_len:
                max_len = len(val)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=student_feedback_report.xlsx"}
    )

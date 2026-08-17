import uuid
import base64
import io
import os
import time
import hmac
import hashlib
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
import qrcode
from backend.database import get_db
from backend.models import Student
from backend.schemas import StudentSignUp, StudentLogin, Token, StudentResponse, ForgotPasswordVerifyEmail, ForgotPasswordReset
from backend.auth import get_password_hash, verify_password, create_access_token, oauth2_scheme

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

# File to log mock SMS/WhatsApp notifications
DEBUG_OUTBOX_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "debug_outbox.log")

def generate_qr_base64(data: str) -> str:
    """Generates a QR code image as a base64 encoded string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def send_mock_whatsapp_sms(student: Student, qr_base64: str) -> str:
    """Simulates sending a WhatsApp or SMS with the student's QR credential."""
    message = (
        f"========================================\n"
        f"CHAKRAVYUHA DSA CHALLENGE - REGISTRATION CONFIRMATION\n"
        f"========================================\n"
        f"Hail Warrior {student.full_name}!\n\n"
        f"Your registration is successful. Below are your credentials:\n"
        f"- Roll Number: {student.roll_number}\n"
        f"- Email: {student.college_email}\n"
        f"- Branch/Year: {student.branch} - Year {student.year}\n"
        f"- Unique QR key: {student.qr_key}\n\n"
        f"This QR Code is your permanent attendance credential.\n"
        f"Keep it safe. Present it daily at the battlefield scanner.\n"
        f"========================================\n"
        f"[QR IMAGE DATA ATTACHED]\n"
        f"========================================\n"
    )
    
    # Write to debug outbox file
    try:
        with open(DEBUG_OUTBOX_PATH, "a", encoding="utf-8") as f:
            f.write(f"Timestamp: {student.created_at}\n")
            f.write(f"Recipient: {student.phone_number} ({student.full_name})\n")
            f.write(message)
            f.write("\n\n")
    except Exception as e:
        logger.error(f"Failed to write to outbox: {e}")

    # Log to backend stdout
    logger.info(f"MOCK SMS/WhatsApp sent to {student.phone_number}:\n{message}")
    
    # Twilio / API Integration stub
    # If TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN were set, we would do:
    # from twilio.rest import Client
    # client = Client(SID, TOKEN)
    # client.messages.create(body=message, from_=TWILIO_NUMBER, to=student.phone_number)
    
    return message

def trigger_power_automate_signup_webhook(student: Student):
    """Triggers the Power Automate webhook for successful signup, if configured.
    Sends a premium HTML welcome email with QR code and battlefield credentials.
    This fires ONLY on first registration — the signup route itself prevents duplicates.
    """
    webhook_url = os.environ.get("POWER_AUTOMATE_SIGNUP_WEBHOOK_URL")
    qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={student.qr_key}"
    roll = student.roll_number or "N/A"
    
    # ── Premium HTML Email Body ──────────────────────────────────────────
    html_body = f"""
<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:620px;margin:0 auto;background:#0a0908;border:1px solid #c5a059;border-radius:12px;overflow:hidden;">

  <!-- ═══ HEADER BANNER ═══ -->
  <div style="background:linear-gradient(135deg,#1a1508 0%,#0a0908 50%,#1a1508 100%);padding:40px 30px 30px;text-align:center;border-bottom:2px solid #d4af37;">
    <div style="width:60px;height:60px;margin:0 auto 16px;border:2px solid #d4af37;border-radius:50%;line-height:60px;font-size:28px;">🛡️</div>
    <h1 style="color:#d4af37;text-transform:uppercase;letter-spacing:4px;font-family:Georgia,serif;font-size:32px;margin:0 0 4px;">CHAKRAVYUHA</h1>
    <p style="font-size:10px;text-transform:uppercase;color:#8c7030;letter-spacing:5px;margin:0;">Amrita Vishwa Vidyapeetham &bull; Amaravati</p>
  </div>

  <!-- ═══ WELCOME SECTION ═══ -->
  <div style="padding:35px 30px 10px;">
    <p style="font-size:13px;color:#d4af37;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin:0 0 12px;">⚔️ Warrior Inducted</p>
    <h2 style="font-size:24px;color:#ffffff;margin:0 0 20px;font-weight:700;line-height:1.3;">
      Welcome to the Arena, <span style="color:#d4af37;">{student.full_name}</span>!
    </h2>
    <p style="font-size:15px;color:#d4d4d8;line-height:1.8;margin:0 0 8px;">
      You have just entered <strong style="color:#f6e05e;">Amrita's leading tech club</strong>. Your winning era starts <em>right now</em>.
    </p>
    <p style="font-size:14px;color:#a1a1aa;line-height:1.7;margin:0 0 25px;">
      From weekly algorithmic battles to national hackathon campaigns, you are now part of an elite network of competitive programmers, builders, and innovators. The battlefield awaits your brilliance.
    </p>
  </div>

  <!-- ═══ CREDENTIALS CARD ═══ -->
  <div style="margin:0 30px 30px;background:linear-gradient(135deg,#1c1917,#151310);border:1px solid rgba(212,175,55,0.25);border-radius:10px;overflow:hidden;">
    <div style="background:rgba(212,175,55,0.08);padding:12px 20px;border-bottom:1px solid rgba(212,175,55,0.15);">
      <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#d4af37;font-weight:800;">🔐 Your Battlefield Credentials</p>
    </div>
    <div style="padding:20px;">
      <table style="width:100%;font-size:14px;color:#e4e4e7;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-weight:700;width:140px;color:#c5a059;vertical-align:top;">Full Name</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:600;">{student.full_name}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid rgba(212,175,55,0.08);"></td></tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#c5a059;vertical-align:top;">Roll Number</td>
          <td style="padding:8px 0;font-family:'Courier New',monospace;letter-spacing:1px;">{roll}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid rgba(212,175,55,0.08);"></td></tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#c5a059;vertical-align:top;">Email</td>
          <td style="padding:8px 0;">{student.college_email}</td>
        </tr>
        <tr><td colspan="2" style="border-bottom:1px solid rgba(212,175,55,0.08);"></td></tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;color:#c5a059;vertical-align:top;">Warrior Key</td>
          <td style="padding:8px 0;font-family:'Courier New',monospace;color:#38bdf8;font-weight:700;letter-spacing:0.5px;">{student.qr_key}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ═══ QR CODE SHOWCASE ═══ -->
  <div style="text-align:center;padding:0 30px 35px;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#d4af37;font-weight:700;margin:0 0 6px;">Your Permanent Attendance QR</p>
    <p style="font-size:12px;color:#71717a;margin:0 0 20px;">Present this at the battlefield scanner every day</p>
    <div style="display:inline-block;padding:16px;background:#ffffff;border:3px solid #d4af37;border-radius:12px;box-shadow:0 8px 30px rgba(212,175,55,0.15);">
      <img src="{qr_image_url}" alt="Warrior QR Code" style="width:180px;height:180px;display:block;" />
    </div>
  </div>

  <!-- ═══ WHAT AWAITS YOU ═══ -->
  <div style="margin:0 30px 30px;background:rgba(212,175,55,0.04);border:1px solid rgba(212,175,55,0.12);border-radius:10px;padding:24px;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#d4af37;font-weight:800;margin:0 0 16px;">⚡ What Awaits You</p>
    <table style="width:100%;font-size:13px;color:#d4d4d8;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 12px 6px 0;vertical-align:top;width:30px;font-size:18px;">🏆</td>
        <td style="padding:6px 0;"><strong style="color:#fff;">Weekly DSA Challenges</strong> — Sharpen your skills with curated problem sheets across all difficulty levels</td>
      </tr>
      <tr>
        <td style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">💻</td>
        <td style="padding:6px 0;"><strong style="color:#fff;">CodeChef Contests</strong> — Compete in rated programming contests and climb the leaderboard</td>
      </tr>
      <tr>
        <td style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">🚀</td>
        <td style="padding:6px 0;"><strong style="color:#fff;">National Hackathons</strong> — Represent Amrita in prestigious tech competitions nationwide</td>
      </tr>
      <tr>
        <td style="padding:6px 12px 6px 0;vertical-align:top;font-size:18px;">🎯</td>
        <td style="padding:6px 0;"><strong style="color:#fff;">Streak Rewards</strong> — Maintain daily consistency and earn recognition on the elite leaderboard</td>
      </tr>
    </table>
  </div>

  <!-- ═══ CTA FOOTER ═══ -->
  <div style="text-align:center;padding:25px 30px 35px;">
    <p style="font-size:16px;color:#ffffff;font-weight:700;margin:0 0 6px;">The battlefield is live. Your era begins now.</p>
    <p style="font-size:12px;color:#71717a;margin:0 0 24px;">Login to your dashboard and start conquering challenges today.</p>
    <div style="border-top:1px solid rgba(212,175,55,0.15);padding-top:20px;margin-top:10px;">
      <p style="font-size:10px;color:#52525b;text-transform:uppercase;letter-spacing:2px;margin:0;">Chakravyuha &bull; Official Coding &amp; DSA Club of Amrita &bull; Amaravati</p>
    </div>
  </div>

</div>
"""

    email_subject = "⚔️ Welcome to Chakravyuha — Your Winning Era Starts Now, Warrior!"
    
    payload = {
        "email": student.college_email,
        "full_name": student.full_name,
        "roll_number": roll,
        "qr_key": student.qr_key,
        "qr_image_url": qr_image_url,
        "subject": email_subject,
        "html_body": html_body
    }
    
    # ── Local debug log ──────────────────────────────────────────────────
    import datetime
    debug_emails_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "debug_emails.log")
    log_content = (
        f"{'='*60}\n"
        f"SIGNUP WELCOME EMAIL\n"
        f"Timestamp : {datetime.datetime.utcnow()}\n"
        f"Recipient : {student.college_email} ({student.full_name})\n"
        f"Subject   : {email_subject}\n"
        f"Roll No.  : {roll}\n"
        f"QR Key    : {student.qr_key}\n"
        f"QR URL    : {qr_image_url}\n"
        f"{'='*60}\n\n"
    )
    try:
        with open(debug_emails_path, "a", encoding="utf-8") as f:
            f.write(log_content)
        logger.info(f"Welcome email logged to debug_emails.log for {student.college_email}")
    except Exception as e:
        logger.error(f"Failed to log signup welcome email: {e}")

    # ── Fire webhook ─────────────────────────────────────────────────────
    if not webhook_url:
        logger.info("POWER_AUTOMATE_SIGNUP_WEBHOOK_URL not configured. Skipping webhook trigger.")
        return
        
    try:
        import requests
        res = requests.post(webhook_url, json=payload, timeout=10)
        logger.info(f"Power Automate signup webhook triggered: status_code={res.status_code}")
    except Exception as e:
        logger.error(f"Failed to trigger Power Automate signup webhook: {e}")

@router.post("/signup", response_model=Token)
def signup(student_data: StudentSignUp, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if email or roll number already exists
    existing_email = db.query(Student).filter(func.lower(Student.college_email) == func.lower(student_data.college_email)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College email already registered"
        )
    
    if student_data.roll_number:
        existing_roll = db.query(Student).filter(func.lower(Student.roll_number) == func.lower(student_data.roll_number)).first()
        if existing_roll:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number already registered"
            )
    
    # Create student record
    if student_data.roll_number:
        qr_key = f"CHAKRA-{student_data.roll_number.upper()}-{uuid.uuid4().hex[:8].upper()}"
    else:
        email_prefix = student_data.college_email.split("@")[0].upper()
        qr_key = f"CHAKRA-{email_prefix}-{uuid.uuid4().hex[:8].upper()}"
    hashed_password = get_password_hash(student_data.password)
    
    new_student = Student(
        full_name=student_data.full_name,
        college_email=student_data.college_email,
        roll_number=student_data.roll_number,
        phone_number=student_data.phone_number,
        branch=student_data.branch,
        year=student_data.year,
        password_hash=hashed_password,
        qr_key=qr_key,
        streak_count=0,
        is_admin=False
    )
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    # Generate QR Code image and send notification
    qr_img = generate_qr_base64(qr_key)
    send_mock_whatsapp_sms(new_student, qr_img)
    
    # Trigger Power Automate webhook in the background
    background_tasks.add_task(trigger_power_automate_signup_webhook, new_student)
    
    # Generate JWT
    access_token = create_access_token(data={"sub": new_student.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "student",
        "name": new_student.full_name
    }

@router.post("/login", response_model=Token)
def login(login_data: StudentLogin, db: Session = Depends(get_db)):
    # Check email or roll number
    student = db.query(Student).filter(
        (func.lower(Student.college_email) == func.lower(login_data.username)) | 
        (func.lower(Student.roll_number) == func.lower(login_data.username))
    ).first()
    
    if not student or not verify_password(login_data.password, student.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Verify your email/roll number and password."
        )
    
    # Generate JWT
    access_token = create_access_token(data={"sub": student.id})
    user_type = "student"
    if student.is_admin:
        user_type = "super_admin" if student.admin_role == "super" else "attendance_admin"
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": user_type,
        "name": student.full_name
    }

@router.get("/me", response_model=StudentResponse)
def get_me(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        import jwt
        from backend.auth import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    user = db.query(Student).filter(Student.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# ──────────────────────────────────────────────────────────────────────────────
# FORGOT PASSWORD — no data is changed except password_hash
# ──────────────────────────────────────────────────────────────────────────────

# A simple HMAC-signed token: "<student_id>.<timestamp>.<sig>"
# Valid for 15 minutes. No database table needed.
_RESET_SECRET = os.environ.get("RESET_TOKEN_SECRET", "chakravyuha-reset-secret-2026")
_RESET_TTL = 900  # 15 minutes in seconds


def _make_reset_token(student_id: str) -> str:
    ts = str(int(time.time()))
    payload = f"{student_id}.{ts}"
    sig = hmac.new(_RESET_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    # base64 encode so it is URL-safe
    raw = f"{payload}.{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _verify_reset_token(token: str) -> str:
    """Returns student_id if valid; raises HTTPException otherwise."""
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.split(".")
        # parts: student_id, timestamp, signature
        if len(parts) != 3:
            raise ValueError("bad format")
        student_id, ts, sig = parts
        payload = f"{student_id}.{ts}"
        expected = hmac.new(_RESET_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError("bad sig")
        if int(time.time()) - int(ts) > _RESET_TTL:
            raise ValueError("expired")
        return student_id
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reset token is invalid or has expired. Please try again. ({exc})"
        )


@router.post("/forgot-password/verify-email")
def forgot_password_verify_email(
    req: ForgotPasswordVerifyEmail,
    db: Session = Depends(get_db)
):
    """
    Step 1: User provides their college email or personal email.
    Returns a short-lived reset token if the email exists.
    NO data is modified here.
    """
    email = req.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")

    student = db.query(Student).filter(
        (func.lower(Student.college_email) == email) |
        (func.lower(Student.personal_email) == email)
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="No account found with that email address. Please check and try again."
        )

    reset_token = _make_reset_token(str(student.id))
    return {
        "message": "Email verified. You may now reset your password.",
        "reset_token": reset_token,
        "name": student.full_name
    }


@router.post("/forgot-password/reset")
def forgot_password_reset(
    req: ForgotPasswordReset,
    db: Session = Depends(get_db)
):
    """
    Step 2: User provides the reset token + new password.
    ONLY the password_hash field is updated. No other data is touched.
    """
    token = req.reset_token.strip()
    new_password = req.new_password.strip()

    if not token:
        raise HTTPException(status_code=400, detail="Reset token is missing.")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")

    student_id = _verify_reset_token(token)

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Account not found.")

    # ⚠️  ONLY update password_hash — nothing else
    student.password_hash = get_password_hash(new_password)
    db.commit()

    return {"message": "Password updated successfully. You can now log in with your new password."}

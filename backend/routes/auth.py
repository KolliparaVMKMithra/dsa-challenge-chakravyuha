import uuid
import base64
import io
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import qrcode
from backend.database import get_db
from backend.models import Student
from backend.schemas import StudentSignUp, StudentLogin, Token, StudentResponse
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
    """Triggers the Power Automate webhook for successful signup, if configured."""
    webhook_url = os.environ.get("POWER_AUTOMATE_SIGNUP_WEBHOOK_URL")
    if not webhook_url:
        logger.info("POWER_AUTOMATE_SIGNUP_WEBHOOK_URL not configured. Skipping webhook trigger.")
        return
        
    qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={student.qr_key}"
    payload = {
        "email": student.college_email,
        "full_name": student.full_name,
        "roll_number": student.roll_number,
        "qr_key": student.qr_key,
        "qr_image_url": qr_image_url
    }
    
    try:
        import requests
        res = requests.post(webhook_url, json=payload, timeout=5)
        logger.info(f"Power Automate signup webhook triggered: status_code={res.status_code}")
    except Exception as e:
        logger.error(f"Failed to trigger Power Automate signup webhook: {e}")

@router.post("/signup", response_model=Token)
def signup(student_data: StudentSignUp, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if email or roll number already exists
    existing_email = db.query(Student).filter(Student.college_email == student_data.college_email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College email already registered"
        )
    
    existing_roll = db.query(Student).filter(Student.roll_number == student_data.roll_number).first()
    if existing_roll:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number already registered"
        )
    
    # Create student record
    qr_key = f"CHAKRA-{student_data.roll_number}-{uuid.uuid4().hex[:8].upper()}"
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
        (Student.college_email == login_data.username) | 
        (Student.roll_number == login_data.username)
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

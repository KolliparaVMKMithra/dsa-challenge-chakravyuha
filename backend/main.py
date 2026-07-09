import datetime
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.models import Student, Problem, CodeChefContest
from backend.auth import get_password_hash
from backend.routes import auth, dsa, admin

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="Chakravyuha DSA Challenge API",
    description="Backend API for Chakravyuha's Daily DSA Challenge Platform",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(dsa.router)
app.include_router(admin.router)

# Sample problems data to seed the database
SEED_PROBLEMS = [
    # Session 1: Arrays (Beginner)
    {"topic": "Arrays", "title": "Largest Number At Least Twice of Others (Traversal - Maximum Element)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/largest-number-at-least-twice-of-others/"},
    {"topic": "Arrays", "title": "Move Zeroes (Two Pointers)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/move-zeroes/"},
    {"topic": "Arrays", "title": "Maximum Average Subarray I (Sliding Window - Max Sum Subarray of Size K)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/maximum-average-subarray-i/"},
    {"topic": "Arrays", "title": "Range Sum Query - Immutable (Prefix Sum)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/range-sum-query-immutable/"},

    # Session 2: Strings (Beginner)
    {"topic": "Strings", "title": "Count the Number of Vowel Strings in Range (Traversal)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/count-the-number-of-vowel-strings-in-range/"},
    {"topic": "Strings", "title": "Reverse String (Two Pointers)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/reverse-string/"},
    {"topic": "Strings", "title": "Valid Anagram (Hashing - Character Frequency)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/valid-anagram/"},
    {"topic": "Strings", "title": "Longest Substring Without Repeating Characters (Sliding Window)", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"},

    # Session 3: Linked List (Beginner)
    {"topic": "Linked List", "title": "Remove Linked List Elements (Traversal)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/remove-linked-list-elements/"},
    {"topic": "Linked List", "title": "Reverse Linked List (Pattern: Reverse)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/reverse-linked-list/"},
    {"topic": "Linked List", "title": "Middle of the Linked List (Slow & Fast Pointer)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/middle-of-the-linked-list/"},
    {"topic": "Linked List", "title": "Linked List Cycle (Slow & Fast Pointer - Cycle Detection)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/linked-list-cycle/"},
    {"topic": "Linked List", "title": "Remove Nth Node From End of List (Dummy Node)", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/"}
]

@app.on_event("startup")
def startup_db_init():
    """Initializes tables, seeds problems, admin credentials, and default CodeChef contest."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        # 1. Seed Admins
        scan_admin_usernames = ["satya_shivani", "rithvik", "pranavi", "akhila", "lalith_aditya", "gayatri", "karthik"]
        super_admin_usernames = ["mithra", "rudrabhishek", "hari_kiran", "krishna", "maneesh", "sindhuja", "ganesh"]

        for u in scan_admin_usernames:
            email = f"{u}@chakravyuha.edu"
            existing = db.query(Student).filter(Student.college_email == email).first()
            if not existing:
                import uuid
                secret_suffix = uuid.uuid4().hex[:8].upper()
                admin = Student(
                    full_name=u.replace("_", " ").title(),
                    college_email=email,
                    roll_number=u,
                    phone_number="9999999900",
                    branch="CSE",
                    year=4,
                    password_hash=get_password_hash("scan@admin321"),
                    qr_key=f"CHAKRA-{u}-{secret_suffix}",
                    is_admin=True,
                    admin_role="attendance"
                )
                db.add(admin)
        db.commit()
        logger.info("Scan Admins seeded successfully.")

        for u in super_admin_usernames:
            email = f"{u}@chakravyuha.edu"
            existing = db.query(Student).filter(Student.college_email == email).first()
            if not existing:
                import uuid
                secret_suffix = uuid.uuid4().hex[:8].upper()
                admin = Student(
                    full_name=u.replace("_", " ").title(),
                    college_email=email,
                    roll_number=u,
                    phone_number="9999999900",
                    branch="CSE",
                    year=4,
                    password_hash=get_password_hash("super@admin321"),
                    qr_key=f"CHAKRA-{u}-{secret_suffix}",
                    is_admin=True,
                    admin_role="super"
                )
                db.add(admin)
        db.commit()
        logger.info("Super Admins seeded successfully.")
            
        # 2. Seed Problems (Clear and Re-seed custom beginner-level DSA sheet)
        logger.info("Syncing DSA sheet problems...")
        db.query(Problem).delete()
        db.commit()
        for p in SEED_PROBLEMS:
            db_prob = Problem(**p)
            db.add(db_prob)
        db.commit()
        logger.info(f"Seeded {len(SEED_PROBLEMS)} problems successfully.")
            
        # 3. Seed CodeChef Contest
        existing_contest = db.query(CodeChefContest).first()
        if not existing_contest:
            logger.info("Seeding default Wednesday CodeChef contest...")
            # Set deadline to next Wednesday at 8 PM UTC
            today = datetime.datetime.utcnow()
            days_ahead = 2 - today.weekday()
            if days_ahead <= 0:  # Target Wednesday already passed or is today
                days_ahead += 7
            next_wednesday = today + datetime.timedelta(days=days_ahead)
            deadline = datetime.datetime(
                year=next_wednesday.year,
                month=next_wednesday.month,
                day=next_wednesday.day,
                hour=20,
                minute=0,
                second=0
            )
            
            contest = CodeChefContest(
                week_number=1,
                contest_link="https://www.codechef.com/START999",
                deadline=deadline
            )
            db.add(contest)
            db.commit()
            logger.info("Default CodeChef contest seeded successfully.")
            
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "time": datetime.datetime.utcnow()}

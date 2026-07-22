import datetime
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from backend.database import engine, Base
from backend.models import Student, Problem, CodeChefContest, Feedback, Event, EventRegistration
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
    # Traversal / Max Element
    {"topic": "Arrays", "title": "Third Maximum Number (Traversal - Max Element)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/third-maximum-number/"},
    {"topic": "Arrays", "title": "Largest Number At Least Twice of Others (Traversal - Max Element)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/largest-number-at-least-twice-of-others/"},
    # Two Pointers
    {"topic": "Arrays", "title": "Move Zeroes (Two Pointers)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/move-zeroes/"},
    {"topic": "Arrays", "title": "Squares of a Sorted Array (Two Pointers)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/squares-of-a-sorted-array/"},
    # Sliding Window
    {"topic": "Arrays", "title": "Maximum Average Subarray I (Sliding Window - Max Sum Subarray of Size K)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/maximum-average-subarray-i/"},
    {"topic": "Arrays", "title": "Defuse the Bomb (Sliding Window)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/defuse-the-bomb/"},
    # Prefix Sum
    {"topic": "Arrays", "title": "Range Sum Query - Immutable (Prefix Sum)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/range-sum-query-immutable/"},
    {"topic": "Arrays", "title": "Find Pivot Index (Prefix Sum)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/find-pivot-index/"},

    # Session 2: Strings (Beginner)
    # Traversal / Vowel Counting
    {"topic": "Strings", "title": "Count the Number of Vowel Strings in Range (Traversal)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/count-the-number-of-vowel-strings-in-range/"},
    {"topic": "Strings", "title": "Determine if String Halves Are Alike (Traversal)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/determine-if-string-halves-are-alike/"},
    # Two Pointers
    {"topic": "Strings", "title": "Reverse String (Two Pointers)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/reverse-string/"},
    {"topic": "Strings", "title": "Valid Palindrome (Two Pointers)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/valid-palindrome/"},
    # Hashing / Char Frequency
    {"topic": "Strings", "title": "Valid Anagram (Hashing)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/valid-anagram/"},
    {"topic": "Strings", "title": "First Unique Character in a String (Hashing)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/first-unique-character-in-a-string/"},
    # Sliding Window
    {"topic": "Strings", "title": "Longest Substring Without Repeating Characters (Sliding Window)", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"},

    # Session 3: Linked List (Beginner)
    # Traversal
    {"topic": "Linked List", "title": "Convert Binary Number in a Linked List to Integer (Traversal)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/convert-binary-number-in-a-linked-list-to-integer/"},
    {"topic": "Linked List", "title": "Remove Linked List Elements (Traversal)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/remove-linked-list-elements/"},
    # Reverse Linked List
    {"topic": "Linked List", "title": "Reverse Linked List (Pattern: Reverse)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/reverse-linked-list/"},
    {"topic": "Linked List", "title": "Palindrome Linked List (Pattern: Reverse)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/palindrome-linked-list/"},
    # Slow & Fast Pointer
    {"topic": "Linked List", "title": "Middle of the Linked List (Slow & Fast Pointer)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/middle-of-the-linked-list/"},
    {"topic": "Linked List", "title": "Linked List Cycle (Slow & Fast Pointer - Cycle Detection)", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/linked-list-cycle/"},
    # Dummy Node
    {"topic": "Linked List", "title": "Remove Nth Node From End of List (Dummy Node)", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/"},

    # Stacks & Queues (6 problems)
    {"topic": "Stacks/Queues", "title": "Valid Parentheses", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/valid-parentheses/"},
    {"topic": "Stacks/Queues", "title": "Implement Queue using Stacks", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/implement-queue-using-stacks/"},
    {"topic": "Stacks/Queues", "title": "Min Stack", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/min-stack/"},
    {"topic": "Stacks/Queues", "title": "Evaluate Reverse Polish Notation", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/evaluate-reverse-polish-notation/"},
    {"topic": "Stacks/Queues", "title": "Daily Temperatures", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/daily-temperatures/"},
    {"topic": "Stacks/Queues", "title": "Largest Rectangle in Histogram", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/largest-rectangle-in-histogram/"},

    # Trees (6 problems)
    {"topic": "Trees", "title": "Invert Binary Tree", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/invert-binary-tree/"},
    {"topic": "Trees", "title": "Maximum Depth of Binary Tree", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/maximum-depth-of-binary-tree/"},
    {"topic": "Trees", "title": "Same Tree", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/same-tree/"},
    {"topic": "Trees", "title": "Binary Tree Level Order Traversal", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/binary-tree-level-order-traversal/"},
    {"topic": "Trees", "title": "Validate Binary Search Tree", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/validate-binary-search-tree/"},
    {"topic": "Trees", "title": "Binary Tree Maximum Path Sum", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/binary-tree-maximum-path-sum/"},

    # Graphs (6 problems)
    {"topic": "Graphs", "title": "Find Center of Star Graph", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/find-center-of-star-graph/"},
    {"topic": "Graphs", "title": "Island Perimeter", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/island-perimeter/"},
    {"topic": "Graphs", "title": "Find if Path Exists in Graph", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/find-if-path-exists-in-graph/"},
    {"topic": "Graphs", "title": "Number of Islands", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/number-of-islands/"},
    {"topic": "Graphs", "title": "Clone Graph", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/clone-graph/"},
    {"topic": "Graphs", "title": "Alien Dictionary", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/alien-dictionary/"},

    # Dynamic Programming (6 problems)
    {"topic": "DP", "title": "Climbing Stairs", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/climbing-stairs/"},
    {"topic": "DP", "title": "Min Cost Climbing Stairs", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/min-cost-climbing-stairs/"},
    {"topic": "DP", "title": "Divisor Game", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/divisor-game/"},
    {"topic": "DP", "title": "House Robber", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/house-robber/"},
    {"topic": "DP", "title": "Longest Increasing Subsequence", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/longest-increasing-subsequence/"},
    {"topic": "DP", "title": "Edit Distance", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/edit-distance/"},

    # Greedy (6 problems)
    {"topic": "Greedy", "title": "Assign Cookies", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/assign-cookies/"},
    {"topic": "Greedy", "title": "Lemonade Change", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/lemonade-change/"},
    {"topic": "Greedy", "title": "Array Partition", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/array-partition/"},
    {"topic": "Greedy", "title": "Jump Game", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/jump-game/"},
    {"topic": "Greedy", "title": "Gas Station", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/gas-station/"},
    {"topic": "Greedy", "title": "Candy", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/candy/"}
]

@app.on_event("startup")
def startup_db_init():
    """Initializes tables, seeds problems, admin credentials, and default CodeChef contest."""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    # Run migration: drop NOT NULL on roll_number
    if engine.name == 'postgresql':
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE students ALTER COLUMN roll_number DROP NOT NULL;"))
                conn.commit()
                logger.info("Successfully dropped NOT NULL constraint on students.roll_number.")
        except Exception as e:
            logger.warning(f"Failed to drop NOT NULL constraint on roll_number (this is normal if already dropped): {e}")
    
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
            
        # 2. Seed Problems (Sync dynamically using leetcode_link to preserve student submissions)
        logger.info("Syncing DSA sheet problems...")
        existing_problems = db.query(Problem).all()
        existing_by_link = {p.leetcode_link: p for p in existing_problems}
        seed_links = set()
        
        for p_data in SEED_PROBLEMS:
            link = p_data["leetcode_link"]
            seed_links.add(link)
            if link in existing_by_link:
                # Update problem in place to preserve id and avoid cascade-deleting submissions
                db_prob = existing_by_link[link]
                db_prob.title = p_data["title"]
                db_prob.difficulty = p_data["difficulty"]
                db_prob.topic = p_data["topic"]
                db_prob.is_active = True
            else:
                # Insert new problem
                db_prob = Problem(**p_data)
                db.add(db_prob)
                
        # De-activate any problems that are not in the seed list (don't delete, to save history)
        for link, db_prob in existing_by_link.items():
            if link not in seed_links:
                db_prob.is_active = False
                
        db.commit()
        logger.info("DSA sheet problems synced successfully.")
            
        # 3. Clean up default CodeChef contest (Admin will add manually via super-admin page)
        logger.info("Syncing CodeChef contests...")
        db.query(CodeChefContest).filter(CodeChefContest.contest_link == "https://www.codechef.com/START999").delete()
        db.commit()

        # 4. Seed default events
        logger.info("Syncing default events...")
        yukti_event = db.query(Event).filter(Event.name.like("%YUKTI%")).first()
        if not yukti_event:
            yukti_event = Event(
                name="YUKTI - DSA & Prompt Engineering Challenge",
                description="The ultimate battlefield to master Data Structures & Algorithms with generative AI prompting assistance.",
                status="active"
            )
            db.add(yukti_event)
            db.commit()
            db.refresh(yukti_event)
        else:
            yukti_event.status = "active"
            db.commit()

        sih_event = db.query(Event).filter(Event.name.like("%SIH%")).first()
        if not sih_event:
            sih_event = Event(
                name="Smart India Hackathon 2026 Internal Hackathon",
                description="Chakravyuha Club's internal hackathon to select and nominate teams for SIH 2026.",
                status="upcoming"
            )
            db.add(sih_event)
            db.commit()
            db.refresh(sih_event)

        # 5. Auto-register all existing students to YUKTI event
        logger.info("Ensuring all existing students are registered for YUKTI event...")
        all_students = db.query(Student).filter(Student.is_admin == False).all()
        registered_student_ids = set(
            r.student_id for r in db.query(EventRegistration).filter(EventRegistration.event_id == yukti_event.id).all()
        )
        
        new_registrations = []
        for student in all_students:
            if student.id not in registered_student_ids:
                new_registrations.append(
                    EventRegistration(
                        student_id=student.id,
                        event_id=yukti_event.id
                    )
                )
        if new_registrations:
            db.bulk_save_objects(new_registrations)
            db.commit()
            logger.info(f"Registered {len(new_registrations)} existing students for YUKTI event.")
            
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "time": datetime.datetime.utcnow()}

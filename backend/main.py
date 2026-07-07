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
    # Arrays (6 problems)
    {"topic": "Arrays", "title": "Two Sum", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/two-sum/"},
    {"topic": "Arrays", "title": "Contains Duplicate", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/contains-duplicate/"},
    {"topic": "Arrays", "title": "Best Time to Buy and Sell Stock", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"},
    {"topic": "Arrays", "title": "Product of Array Except Self", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/product-of-array-except-self/"},
    {"topic": "Arrays", "title": "3Sum", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/3sum/"},
    {"topic": "Arrays", "title": "First Missing Positive", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/first-missing-positive/"},

    # Strings (6 problems)
    {"topic": "Strings", "title": "Valid Anagram", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/valid-anagram/"},
    {"topic": "Strings", "title": "Valid Palindrome", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/valid-palindrome/"},
    {"topic": "Strings", "title": "Longest Common Prefix", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/longest-common-prefix/"},
    {"topic": "Strings", "title": "Longest Substring Without Repeating Characters", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/"},
    {"topic": "Strings", "title": "Group Anagrams", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/group-anagrams/"},
    {"topic": "Strings", "title": "Minimum Window Substring", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/minimum-window-substring/"},

    # Linked List (6 problems)
    {"topic": "Linked List", "title": "Reverse Linked List", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/reverse-linked-list/"},
    {"topic": "Linked List", "title": "Merge Two Sorted Lists", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/merge-two-sorted-lists/"},
    {"topic": "Linked List", "title": "Linked List Cycle", "difficulty": "Easy", "leetcode_link": "https://leetcode.com/problems/linked-list-cycle/"},
    {"topic": "Linked List", "title": "Remove Nth Node From End of List", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/"},
    {"topic": "Linked List", "title": "Reorder List", "difficulty": "Medium", "leetcode_link": "https://leetcode.com/problems/reorder-list/"},
    {"topic": "Linked List", "title": "Merge k Sorted Lists", "difficulty": "Hard", "leetcode_link": "https://leetcode.com/problems/merge-k-sorted-lists/"},

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
            
        # 2. Seed Problems
        existing_problems_count = db.query(Problem).count()
        if existing_problems_count == 0:
            logger.info("Problems table is empty. Seeding DSA problems...")
            for p in SEED_PROBLEMS:
                db_prob = Problem(**p)
                db.add(db_prob)
            db.commit()
            logger.info(f"Seeded {len(SEED_PROBLEMS)} problems successfully.")
        else:
            logger.info(f"Problems table already contains {existing_problems_count} records. Skipping seed.")
            
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

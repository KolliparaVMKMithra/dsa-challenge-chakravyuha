import sys
import os
sys.path.append('/app/backend')
sys.path.append('/app')
from sqlalchemy import func
from backend.database import SessionLocal
from backend.models import Student, SIHTeam, SIHTeamMember, Event, EventRegistration

db = SessionLocal()

emails = [
    "av.sc.u4aie26022@av.students.amrita.edu",
    "av.sc.u4aid26067@av.students.amrita.edu",
    "av.sc.u4aie25146@av.students.amrita.edu",
    "av.sc.u4aie26021@av.students.amrita.edu",
    "av.sc.u4aie26204@av.students.amrita.edu",
    "av.sc.u4aie26036@av.students.amrita.edu"
]

print("--- CHECKING STUDENTS ---")
students = db.query(Student).filter(func.lower(Student.college_email).in_([e.lower().strip() for e in emails])).all()
found_map = {s.college_email.lower().strip(): s for s in students}

for e in emails:
    if e.lower().strip() in found_map:
        s = found_map[e.lower().strip()]
        print(f"EXISTS: {s.full_name} | {s.college_email} | ID: {s.id}")
    else:
        print(f"MISSING: {e}")

print("\n--- ALL REGISTERED TEAMS COUNT ---")
print("Total SIH Teams:", db.query(SIHTeam).count())

"""
Seed room allocations from sih_room_allocation_final.xlsx into sih_teams.room_number.

Run from project root inside the Docker container:
    docker exec dsa-challenge-chakravyuha-backend-1 python -m backend.seed_room_allocation

Or directly on EC2 after activating venv:
    python -m backend.seed_room_allocation
"""
import os
import sys
import openpyxl
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend.models import SIHTeam
from sqlalchemy import text

# ── Locate the Excel file ────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL_PATH = os.path.join(BASE_DIR, "sih_room_allocation_final.xlsx")

if not os.path.exists(EXCEL_PATH):
    print(f"[ERROR] Excel file not found at: {EXCEL_PATH}")
    sys.exit(1)

# ── Parse Excel ──────────────────────────────────────────────────────────────
print(f"[INFO] Reading: {EXCEL_PATH}")
wb = openpyxl.load_workbook(EXCEL_PATH)
ws = wb.active

room_map: dict = {}  # team_name_lower -> room_number
current_room = None

for row in ws.iter_rows(min_row=5, values_only=True):
    if row[0]:  # Col A has room number (only on first row of each room group)
        current_room = str(row[0]).strip()
    if row[2] and current_room and current_room != "Room No.":  # Col C = team name
        team_name = str(row[2]).strip()
        room_map[team_name.lower()] = current_room

print(f"[INFO] Found {len(room_map)} team->room mappings in Excel")

# ── Ensure column exists ─────────────────────────────────────────────────────
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE sih_teams ADD COLUMN room_number VARCHAR(20);"))
    print("[INFO] Added room_number column to sih_teams.")
except Exception as e:
    print(f"[INFO] room_number column already exists (OK): {e}")

# ── Update database ──────────────────────────────────────────────────────────
db: Session = SessionLocal()
try:
    all_teams = db.query(SIHTeam).all()
    matched = 0
    unmatched = []

    for team in all_teams:
        key = team.team_name.lower().strip()
        room = room_map.get(key)
        if room:
            team.room_number = room
            matched += 1
        else:
            unmatched.append(team.team_name)

    db.commit()
    print(f"\nSuccessfully assigned rooms to {matched}/{len(all_teams)} teams.")

    if unmatched:
        print(f"\nWARNING: {len(unmatched)} teams NOT found in Excel (no room assigned):")
        for name in unmatched:
            print(f"   - {name}")
    else:
        print("All teams matched perfectly!")

finally:
    db.close()

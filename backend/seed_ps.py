"""
Seeder: Populates sih_problem_statements table from ps sih 2026.xlsx.
Run once (idempotent): python -m backend.seed_ps
"""
import sys
import os

# Allow running from repo root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import openpyxl
from backend.database import SessionLocal, engine, Base
from backend.models import SIHProblemStatement

# Auto-create tables (safe: uses CREATE TABLE IF NOT EXISTS via SQLAlchemy)
Base.metadata.create_all(bind=engine)

EXCEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'ps sih 2026.xlsx')

def seed():
    db = SessionLocal()
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb.active

    inserted = 0
    skipped  = 0
    errors   = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        try:
            sno, ps_id_raw, ps_number, title, organization, category, theme, submitted_ideas, deadline, description = row[:10]
            if ps_id_raw is None or ps_number is None:
                continue
            ps_id = int(float(ps_id_raw))
            ps_number = str(ps_number).strip()
            title = str(title).strip() if title else ""
            organization = str(organization).strip() if organization else ""
            category = str(category).strip() if category else None
            theme = str(theme).strip() if theme else None
            description = str(description).strip() if description else None

            # Idempotent: skip if already exists
            existing = db.query(SIHProblemStatement).filter(SIHProblemStatement.ps_id == ps_id).first()
            if existing:
                skipped += 1
                continue

            stmt = SIHProblemStatement(
                ps_id=ps_id,
                ps_number=ps_number,
                title=title,
                organization=organization,
                category=category,
                theme=theme,
                description=description,
            )
            db.add(stmt)
            inserted += 1
        except Exception as e:
            print(f"  ERROR on row (ps_number={ps_number}): {e}")
            errors += 1

    db.commit()
    db.close()
    print(f"Seeding complete: {inserted} inserted, {skipped} skipped, {errors} errors.")

if __name__ == "__main__":
    seed()

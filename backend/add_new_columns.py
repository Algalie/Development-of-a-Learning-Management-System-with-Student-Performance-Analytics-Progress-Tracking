"""
Fix: Create grade_edit_requests table for PostgreSQL
Usage: python create_grade_edit_table.py
"""
from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS grade_edit_requests (
                id SERIAL PRIMARY KEY,
                course_student_id INTEGER NOT NULL REFERENCES course_students(id),
                course_id INTEGER NOT NULL REFERENCES courses(id),
                requested_by_id INTEGER NOT NULL REFERENCES lecturers(id),
                requested_field VARCHAR(30) NOT NULL,
                current_value FLOAT,
                new_value FLOAT NOT NULL,
                reason TEXT NOT NULL,
                status VARCHAR(30) DEFAULT 'pending_hod',
                hod_reviewed BOOLEAN DEFAULT FALSE,
                hod_reviewed_by_id INTEGER REFERENCES lecturers(id),
                hod_reviewed_at TIMESTAMP,
                hod_decision VARCHAR(20),
                hod_comment TEXT,
                hod_signature VARCHAR(200),
                dean_reviewed BOOLEAN DEFAULT FALSE,
                dean_reviewed_by_id INTEGER REFERENCES lecturers(id),
                dean_reviewed_at TIMESTAMP,
                dean_decision VARCHAR(20),
                dean_comment TEXT,
                dean_signature VARCHAR(200),
                exam_activated BOOLEAN DEFAULT FALSE,
                exam_activated_by_id INTEGER REFERENCES admins(id),
                exam_activated_at TIMESTAMP,
                exam_signature VARCHAR(200),
                edit_applied BOOLEAN DEFAULT FALSE,
                edit_applied_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        db.session.commit()
        print("✅ Created grade_edit_requests table")
    except Exception as e:
        if 'already exists' in str(e).lower():
            print("⏭️  grade_edit_requests table already exists")
        else:
            print(f"❌ Error: {e}")
"""
Check if all required columns exist, add any that are missing.
Run: python check_columns.py
"""
from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Check lecturers columns
    result = db.session.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='lecturers'"
    ))
    columns = [row[0] for row in result]
    print("lecturers columns:", columns)

    # Add signature if missing
    if 'signature' not in columns:
        try:
            db.session.execute(text("ALTER TABLE lecturers ADD COLUMN signature VARCHAR(200)"))
            db.session.commit()
            print("✅ Added signature to lecturers")
        except Exception as e:
            print(f"❌ Error adding signature: {e}")
    else:
        print("✅ signature already exists")

    # Check courses columns
    result = db.session.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='courses'"
    ))
    course_columns = [row[0] for row in result]
    print("\ncourses columns:", course_columns)

    course_new = [
        ('assigned_lecturer_id', 'INTEGER'),
        ('course_level', 'VARCHAR(20)'),
        ('course_semester_num', 'INTEGER'),
        ('ca_max_score', 'INTEGER DEFAULT 40'),
        ('exam_max_score', 'INTEGER DEFAULT 60'),
    ]

    for col_name, col_type in course_new:
        if col_name not in course_columns:
            try:
                db.session.execute(text(f"ALTER TABLE courses ADD COLUMN {col_name} {col_type}"))
                db.session.commit()
                print(f"✅ Added {col_name} to courses")
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
        else:
            print(f"✅ {col_name} already exists")

    # Check course_students columns
    result = db.session.execute(text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='course_students'"
    ))
    cs_columns = [row[0] for row in result]
    print("\ncourse_students columns:", cs_columns)

    cs_new = [
        ('enrollment_method', "VARCHAR(20) DEFAULT 'manual'"),
        ('submission_signature', 'VARCHAR(200)'),
        ('submission_signed_at', 'TIMESTAMP'),
    ]

    for col_name, col_type in cs_new:
        if col_name not in cs_columns:
            try:
                db.session.execute(text(f"ALTER TABLE course_students ADD COLUMN {col_name} {col_type}"))
                db.session.commit()
                print(f"✅ Added {col_name} to course_students")
            except Exception as e:
                print(f"❌ Error adding {col_name}: {e}")
        else:
            print(f"✅ {col_name} already exists")

    # Check grade_edit_requests table
    result = db.session.execute(text(
        "SELECT table_name FROM information_schema.tables WHERE table_name='grade_edit_requests'"
    ))
    tables = [row[0] for row in result]

    if 'grade_edit_requests' not in tables:
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
            print(f"❌ Error creating grade_edit_requests: {e}")
    else:
        print("✅ grade_edit_requests table already exists")

    print("\n✅ All checks complete!")
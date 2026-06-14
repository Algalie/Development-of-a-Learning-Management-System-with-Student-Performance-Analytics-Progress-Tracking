# migrate_db.py
# Run this ONCE to migrate existing data to new tables
# python migrate_db.py

from app import app, db
from sqlalchemy import text, inspect
from datetime import datetime

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def table_exists(table_name):
    """Check if a table exists"""
    inspector = inspect(db.engine)
    return table_name in inspector.get_table_names()

def migrate():
    with app.app_context():
        print("=" * 60)
        print("STARTING DATABASE MIGRATION")
        print("=" * 60)
        
        # ============================================================
        # STEP 1: Add new columns to EXISTING tables FIRST
        # ============================================================
        print("\n📦 STEP 1: Adding new columns to existing tables...")
        
        # Courses table
        if not column_exists('courses', 'approval_status'):
            try:
                db.session.execute(text("ALTER TABLE courses ADD COLUMN approval_status VARCHAR(30) DEFAULT 'finalized'"))
                db.session.commit()
                print("✅ courses.approval_status added")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error adding courses.approval_status: {e}")
        else:
            print("⏭️ courses.approval_status already exists")
        
        if not column_exists('courses', 'is_editable'):
            try:
                db.session.execute(text("ALTER TABLE courses ADD COLUMN is_editable BOOLEAN DEFAULT TRUE"))
                db.session.commit()
                print("✅ courses.is_editable added")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error adding courses.is_editable: {e}")
        else:
            print("⏭️ courses.is_editable already exists")
        
        if not column_exists('courses', 'current_approval_request_id'):
            try:
                db.session.execute(text("ALTER TABLE courses ADD COLUMN current_approval_request_id INTEGER"))
                db.session.commit()
                print("✅ courses.current_approval_request_id added")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error adding courses.current_approval_request_id: {e}")
        else:
            print("⏭️ courses.current_approval_request_id already exists")
        
        # Course students table
        if not column_exists('course_students', 'ca_status'):
            try:
                db.session.execute(text("ALTER TABLE course_students ADD COLUMN ca_status VARCHAR(30) DEFAULT 'finalized'"))
                db.session.commit()
                print("✅ course_students.ca_status added")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error adding course_students.ca_status: {e}")
        else:
            print("⏭️ course_students.ca_status already exists")
        
        if not column_exists('course_students', 'exam_status'):
            try:
                db.session.execute(text("ALTER TABLE course_students ADD COLUMN exam_status VARCHAR(30) DEFAULT 'finalized'"))
                db.session.commit()
                print("✅ course_students.exam_status added")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error adding course_students.exam_status: {e}")
        else:
            print("⏭️ course_students.exam_status already exists")
        
        # Reference grades table
        if not column_exists('reference_grades', 'approval_status'):
            try:
                db.session.execute(text("ALTER TABLE reference_grades ADD COLUMN approval_status VARCHAR(30) DEFAULT 'finalized'"))
                db.session.commit()
                print("✅ reference_grades.approval_status added")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error adding reference_grades.approval_status: {e}")
        else:
            print("⏭️ reference_grades.approval_status already exists")
        
        # ============================================================
        # STEP 2: Create NEW tables
        # ============================================================
        print("\n📦 STEP 2: Creating new tables...")
        
        if not table_exists('approval_requests'):
            try:
                db.session.execute(text("""
                    CREATE TABLE approval_requests (
                        id SERIAL PRIMARY KEY,
                        submission_type VARCHAR(20) NOT NULL,
                        submission_id INTEGER NOT NULL,
                        course_id INTEGER REFERENCES courses(id),
                        creator_id INTEGER NOT NULL REFERENCES lecturers(id),
                        creator_role VARCHAR(20) NOT NULL,
                        current_level VARCHAR(20) NOT NULL,
                        current_approver_id INTEGER REFERENCES lecturers(id),
                        target_department_id INTEGER REFERENCES departments(id),
                        target_faculty_id INTEGER REFERENCES faculties(id),
                        status VARCHAR(30) DEFAULT 'draft',
                        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        finalized_at TIMESTAMP,
                        rejected_at TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                db.session.commit()
                print("✅ approval_requests table created")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error creating approval_requests: {e}")
        else:
            print("⏭️ approval_requests already exists")
        
        if not table_exists('approval_steps'):
            try:
                db.session.execute(text("""
                    CREATE TABLE approval_steps (
                        id SERIAL PRIMARY KEY,
                        request_id INTEGER NOT NULL REFERENCES approval_requests(id),
                        step_order INTEGER NOT NULL,
                        level VARCHAR(20) NOT NULL,
                        approver_id INTEGER REFERENCES lecturers(id),
                        status VARCHAR(20) DEFAULT 'pending',
                        approved_at TIMESTAMP,
                        signature VARCHAR(100),
                        rejection_reason TEXT,
                        comments TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                db.session.commit()
                print("✅ approval_steps table created")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error creating approval_steps: {e}")
        else:
            print("⏭️ approval_steps already exists")
        
        if not table_exists('notifications'):
            try:
                db.session.execute(text("""
                    CREATE TABLE notifications (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        user_type VARCHAR(20) NOT NULL,
                        title VARCHAR(200) NOT NULL,
                        message TEXT NOT NULL,
                        notification_type VARCHAR(30) NOT NULL,
                        request_id INTEGER REFERENCES approval_requests(id),
                        is_read BOOLEAN DEFAULT FALSE,
                        is_dismissed BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                db.session.commit()
                print("✅ notifications table created")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error creating notifications: {e}")
        else:
            print("⏭️ notifications already exists")
        
        # ============================================================
        # STEP 3: MIGRATE EXISTING DATA
        # ============================================================
        print("\n📦 STEP 3: Migrating existing data...")
        
        # Set default values for existing courses (they were already approved before this system)
        try:
            result = db.session.execute(text("UPDATE courses SET approval_status = 'finalized' WHERE approval_status IS NULL"))
            db.session.commit()
            print(f"✅ Set {result.rowcount} courses to 'finalized' status")
        except Exception as e:
            db.session.rollback()
            print(f"⚠️ Error updating course statuses: {e}")
        
        try:
            result = db.session.execute(text("UPDATE courses SET is_editable = TRUE WHERE is_editable IS NULL"))
            db.session.commit()
            print(f"✅ Set {result.rowcount} courses to editable")
        except Exception as e:
            db.session.rollback()
            print(f"⚠️ Error updating course editability: {e}")
        
        try:
            result = db.session.execute(text("UPDATE course_students SET ca_status = 'finalized' WHERE ca_status IS NULL"))
            db.session.commit()
            print(f"✅ Set {result.rowcount} course_students CA status to finalized")
        except Exception as e:
            db.session.rollback()
            print(f"⚠️ Error updating CA statuses: {e}")
        
        try:
            result = db.session.execute(text("UPDATE course_students SET exam_status = 'finalized' WHERE exam_status IS NULL"))
            db.session.commit()
            print(f"✅ Set {result.rowcount} course_students exam status to finalized")
        except Exception as e:
            db.session.rollback()
            print(f"⚠️ Error updating exam statuses: {e}")
        
        try:
            result = db.session.execute(text("UPDATE reference_grades SET approval_status = 'finalized' WHERE approval_status IS NULL"))
            db.session.commit()
            print(f"✅ Set {result.rowcount} reference_grades to finalized status")
        except Exception as e:
            db.session.rollback()
            print(f"⚠️ Error updating reference statuses: {e}")
        
        # Migrate course approvals to new system
        if table_exists('course_approvals'):
            try:
                old_approvals = db.session.execute(text("""
                    SELECT ca.id, ca.course_id, ca.approval_level, ca.approved, ca.rejected,
                           ca.rejection_reason, ca.approved_by_id, ca.approved_at, ca.signature,
                           ca.sent_to_id, ca.sent_at, c.created_by_id, l.role as creator_role,
                           c.department_id, c.faculty_id
                    FROM course_approvals ca
                    JOIN courses c ON ca.course_id = c.id
                    JOIN lecturers l ON c.created_by_id = l.id
                """)).fetchall()
                
                migrated = 0
                for row in old_approvals:
                    # Check if already exists
                    existing = db.session.execute(text(
                        "SELECT id FROM approval_requests WHERE submission_type='course' AND submission_id=:sid"
                    ), {'sid': row.course_id}).first()
                    
                    if existing:
                        continue
                    
                    # Determine status
                    if row.approved:
                        status = 'finalized'
                    elif row.rejected:
                        status = 'rejected'
                    else:
                        status = f'pending_{row.approval_level}'
                    
                    # Insert approval request
                    result = db.session.execute(text("""
                        INSERT INTO approval_requests 
                        (submission_type, submission_id, course_id, creator_id, creator_role,
                         current_level, current_approver_id, target_department_id, target_faculty_id,
                         status, submitted_at, finalized_at)
                        VALUES ('course', :sid, :cid, :creator_id, :creator_role,
                                :level, :approver_id, :dept_id, :fac_id,
                                :status, :sent_at, :finalized_at)
                        RETURNING id
                    """), {
                        'sid': row.course_id,
                        'cid': row.course_id,
                        'creator_id': row.created_by_id,
                        'creator_role': row.creator_role,
                        'level': row.approval_level,
                        'approver_id': row.sent_to_id,
                        'dept_id': row.department_id,
                        'fac_id': row.faculty_id,
                        'status': status,
                        'sent_at': row.sent_at or datetime.utcnow(),
                        'finalized_at': row.approved_at if row.approved else None
                    })
                    
                    request_id = result.fetchone()[0]
                    
                    # Insert approval step
                    step_order = {'hod': 1, 'dean': 2, 'exam': 3}.get(row.approval_level, 1)
                    step_status = 'approved' if row.approved else ('rejected' if row.rejected else 'pending')
                    
                    db.session.execute(text("""
                        INSERT INTO approval_steps 
                        (request_id, step_order, level, approver_id, status, approved_at, signature, rejection_reason)
                        VALUES (:rid, :order, :level, :approver_id, :status, :approved_at, :signature, :reason)
                    """), {
                        'rid': request_id,
                        'order': step_order,
                        'level': row.approval_level,
                        'approver_id': row.approved_by_id,
                        'status': step_status,
                        'approved_at': row.approved_at,
                        'signature': row.signature,
                        'reason': row.rejection_reason
                    })
                    
                    migrated += 1
                
                db.session.commit()
                print(f"✅ Migrated {migrated} course approvals")
            except Exception as e:
                db.session.rollback()
                print(f"⚠️ Error migrating course approvals: {e}")
        else:
            print("⏭️ course_approvals table not found - skipping")
        
        # Migrate CA/Exam approvals
        if table_exists('course_assessment_approvals'):
            try:
                old_assessments = db.session.execute(text("""
                    SELECT caa.*, c.created_by_id, l.role as creator_role,
                           c.department_id, c.faculty_id
                    FROM course_assessment_approvals caa
                    JOIN courses c ON caa.course_id = c.id
                    JOIN lecturers l ON c.created_by_id = l.id
                """)).fetchall()
                
                migrated = 0
                for row in old_assessments:
                    existing = db.session.execute(text(
                        "SELECT id FROM approval_requests WHERE submission_type=:stype AND submission_id=:sid"
                    ), {'stype': row.approval_type, 'sid': row.course_id}).first()
                    
                    if existing:
                        continue
                    
                    # Determine status
                    if row.fully_approved or row.exam_approved:
                        status = 'finalized'
                        current_level = 'exam'
                    elif row.rejected:
                        status = 'rejected'
                        current_level = row.approval_level
                    elif row.dean_approved:
                        status = 'pending_exam'
                        current_level = 'exam'
                    elif row.hod_approved:
                        status = 'pending_dean'
                        current_level = 'dean'
                    else:
                        status = 'pending_hod'
                        current_level = 'hod'
                    
                    result = db.session.execute(text("""
                        INSERT INTO approval_requests 
                        (submission_type, submission_id, course_id, creator_id, creator_role,
                         current_level, current_approver_id, target_department_id, target_faculty_id,
                         status, submitted_at, finalized_at, rejected_at)
                        VALUES (:stype, :sid, :cid, :creator_id, :creator_role,
                                :level, :approver_id, :dept_id, :fac_id,
                                :status, :sent_at, :finalized_at, :rejected_at)
                        RETURNING id
                    """), {
                        'stype': row.approval_type,
                        'sid': row.course_id,
                        'cid': row.course_id,
                        'creator_id': row.created_by_id,
                        'creator_role': row.creator_role,
                        'level': current_level,
                        'approver_id': row.sent_to_id,
                        'dept_id': row.department_id,
                        'fac_id': row.faculty_id,
                        'status': status,
                        'sent_at': row.sent_at or datetime.utcnow(),
                        'finalized_at': row.exam_approved_at if row.exam_approved else None,
                        'rejected_at': row.rejected_at if row.rejected else None
                    })
                    
                    request_id = result.fetchone()[0]
                    
                    # Create steps for each level
                    if row.hod_approved:
                        db.session.execute(text("""
                            INSERT INTO approval_steps (request_id, step_order, level, approver_id, status, approved_at, signature)
                            VALUES (:rid, 1, 'hod', :aid, 'approved', :at, :sig)
                        """), {'rid': request_id, 'aid': row.hod_approved_by_id, 'at': row.hod_approved_at, 'sig': row.hod_signature})
                    
                    if row.dean_approved:
                        db.session.execute(text("""
                            INSERT INTO approval_steps (request_id, step_order, level, approver_id, status, approved_at, signature)
                            VALUES (:rid, 2, 'dean', :aid, 'approved', :at, :sig)
                        """), {'rid': request_id, 'aid': row.dean_approved_by_id, 'at': row.dean_approved_at, 'sig': row.dean_signature})
                    
                    if row.exam_approved:
                        db.session.execute(text("""
                            INSERT INTO approval_steps (request_id, step_order, level, approver_id, status, approved_at, signature)
                            VALUES (:rid, 3, 'exam', :aid, 'approved', :at, :sig)
                        """), {'rid': request_id, 'aid': row.exam_approved_by_id, 'at': row.exam_approved_at, 'sig': row.exam_signature})
                    
                    if row.rejected:
                        step_order = {'hod': 1, 'dean': 2, 'exam': 3}.get(row.approval_level, 1)
                        db.session.execute(text("""
                            INSERT INTO approval_steps (request_id, step_order, level, approver_id, status, rejection_reason)
                            VALUES (:rid, :order, :level, :aid, 'rejected', :reason)
                        """), {
                            'rid': request_id, 'order': step_order, 'level': row.approval_level,
                            'aid': row.rejected_by_id, 'reason': row.rejection_reason
                        })
                    
                    # Update student records
                    if row.approval_type == 'ca' and row.fully_approved:
                        db.session.execute(text(
                            "UPDATE course_students SET ca_status = 'finalized' WHERE course_id = :cid"
                        ), {'cid': row.course_id})
                    elif row.approval_type == 'exam' and row.fully_approved:
                        db.session.execute(text(
                            "UPDATE course_students SET exam_status = 'finalized' WHERE course_id = :cid"
                        ), {'cid': row.course_id})
                    
                    migrated += 1
                
                db.session.commit()
                print(f"✅ Migrated {migrated} assessment approvals")
            except Exception as e:
                db.session.rollback()
                print(f"⚠️ Error migrating assessment approvals: {e}")
        else:
            print("⏭️ course_assessment_approvals table not found - skipping")
        
        # ============================================================
        # STEP 4: VERIFICATION
        # ============================================================
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE - VERIFYING")
        print("=" * 60)
        
        request_count = db.session.execute(text("SELECT COUNT(*) FROM approval_requests")).fetchone()[0]
        step_count = db.session.execute(text("SELECT COUNT(*) FROM approval_steps")).fetchone()[0]
        course_count = db.session.execute(text("SELECT COUNT(*) FROM courses")).fetchone()[0]
        
        print(f"Total courses: {course_count}")
        print(f"Approval requests created: {request_count}")
        print(f"Approval steps created: {step_count}")
        
        print("\n⚠️ IMPORTANT: Verify everything works before deleting old tables!")
        print("Old tables to delete after verification:")
        print("  - course_approvals")
        print("  - course_assessment_approvals")
        print("  - approval_history")
        print("\nRun this SQL when ready:")
        print("  DROP TABLE IF EXISTS course_approvals;")
        print("  DROP TABLE IF EXISTS course_assessment_approvals;")
        print("  DROP TABLE IF EXISTS approval_history;")

if __name__ == '__main__':
    migrate()
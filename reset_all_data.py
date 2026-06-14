# wipe_all_data.py
# WARNING: This will delete ALL data from ALL tables
# Only the super admin (Kamara) will remain
# Run: python wipe_all_data.py

from app import app, db
from sqlalchemy import text, inspect

def get_all_tables():
    """Get all table names from the database"""
    inspector = inspect(db.engine)
    return inspector.get_table_names()

def wipe_all_data():
    """Wipe ALL data from ALL tables, preserving only the super admin"""
    
    print("=" * 70)
    print("⚠️  COMPLETE DATA WIPE - ALL TABLES WILL BE CLEARED")
    print("=" * 70)
    print()
    print("Only the following will survive:")
    print("  👤 Super Admin: Kamara / default123")
    print()
    print("EVERYTHING else will be DELETED:")
    print("  - All admin accounts (except Kamara)")
    print("  - All lecturers (HOD, Dean, Exam Officer, etc.)")
    print("  - All faculties and departments")
    print("  - All courses and student enrollments")
    print("  - All grades, CA, exam scores")
    print("  - All reference grades")
    print("  - All approval requests and steps (old & new)")
    print("  - All notifications")
    print("  - All GPA records and academic status")
    print("  - All student accounts")
    print("  - All assessment data")
    print("  - ALL old tables (course_approvals, course_assessment_approvals, approval_history)")
    print()
    print("=" * 70)
    
    confirm = input("\n⚠️  Type 'WIPE EVERYTHING' to confirm: ")
    
    if confirm != "WIPE EVERYTHING":
        print("\n❌ Wipe cancelled. No data was changed.")
        return
    
    print("\n🔍 Second confirmation required...")
    confirm2 = input("⚠️  Type 'YES I AM SURE' to final confirm: ")
    
    if confirm2 != "YES I AM SURE":
        print("\n❌ Wipe cancelled. No data was changed.")
        return
    
    with app.app_context():
        print("\n" + "=" * 70)
        print("🗑️  STARTING COMPLETE DATA WIPE")
        print("=" * 70)
        
        # Get super admin info before deleting
        super_admin = None
        try:
            from admin import Admin
            super_admin = Admin.query.filter_by(username='Kamara').first()
            if super_admin:
                print(f"\n✅ Super Admin found: {super_admin.full_name}")
                print(f"   Username: {super_admin.username}")
                print(f"   Password: {super_admin.password}")
        except Exception as e:
            print(f"⚠️  Could not find super admin: {e}")
        
        # Get all table names
        all_tables = get_all_tables()
        print(f"\n📋 Found {len(all_tables)} tables in database:")
        for t in all_tables:
            print(f"   - {t}")
        
        # ============================================================
        # STEP 1: Disable foreign key constraints temporarily
        # ============================================================
        print("\n📦 Step 1: Disabling foreign key constraints...")
        try:
            db.session.execute(text("SET session_replication_role = 'replica';"))
            db.session.commit()
            print("✅ Foreign key constraints disabled")
        except Exception as e:
            print(f"⚠️  Could not disable constraints: {e}")
        
        # ============================================================
        # STEP 2: TRUNCATE all tables (FAST)
        # ============================================================
        print("\n📦 Step 2: Truncating all tables...")
        
        # Order matters - truncate dependent tables first
        # Using TRUNCATE CASCADE for speed
        truncate_order = [
            # New approval system tables
            'notifications',
            'approval_steps',
            'approval_requests',
            
            # Old approval tables (may or may not exist)
            'approval_history',
            'course_assessment_approvals',
            'course_approvals',
            
            # Grade/Assessment tables
            'assessment_grades',
            'continuous_assessments',
            'reference_grades',
            
            # Student records
            'course_students',
            'student_grade_records',
            'student_gpas',
            'student_academic_status',
            
            # Core tables
            'courses',
            'students',
            'lecturers',
            'departments',
            'faculties',
        ]
        
        tables_cleared = 0
        
        for table_name in truncate_order:
            if table_name in all_tables:
                try:
                    db.session.execute(text(f"TRUNCATE TABLE {table_name} CASCADE;"))
                    db.session.commit()
                    print(f"✅ Truncated: {table_name}")
                    tables_cleared += 1
                except Exception as e:
                    db.session.rollback()
                    print(f"⚠️  Could not truncate {table_name}: {e}")
                    # Try DELETE as fallback
                    try:
                        db.session.execute(text(f"DELETE FROM {table_name};"))
                        db.session.commit()
                        print(f"   ✅ Deleted all from: {table_name} (fallback)")
                        tables_cleared += 1
                    except Exception as e2:
                        db.session.rollback()
                        print(f"   ❌ Also failed to delete from {table_name}: {e2}")
        
        # Handle any remaining tables that weren't in our list
        for table_name in all_tables:
            if table_name not in truncate_order and table_name != 'admins':
                try:
                    db.session.execute(text(f"TRUNCATE TABLE {table_name} CASCADE;"))
                    db.session.commit()
                    print(f"✅ Truncated extra table: {table_name}")
                    tables_cleared += 1
                except:
                    try:
                        db.session.execute(text(f"DELETE FROM {table_name};"))
                        db.session.commit()
                        print(f"✅ Deleted from extra table: {table_name}")
                        tables_cleared += 1
                    except:
                        pass
        
        # ============================================================
        # STEP 3: Delete all admins EXCEPT super admin
        # ============================================================
        print("\n📦 Step 3: Cleaning admins table...")
        try:
            result = db.session.execute(
                text("DELETE FROM admins WHERE username != 'Kamara';")
            )
            db.session.commit()
            deleted_admins = result.rowcount
            print(f"✅ Deleted {deleted_admins} admin account(s)")
            print(f"✅ Preserved: Kamara (super admin)")
        except Exception as e:
            db.session.rollback()
            print(f"⚠️  Error cleaning admins: {e}")
        
        # ============================================================
        # STEP 4: Reset all sequences
        # ============================================================
        print("\n📦 Step 4: Resetting all database sequences...")
        
        # Find all sequences
        try:
            sequences = db.session.execute(text("""
                SELECT sequence_name 
                FROM information_schema.sequences 
                WHERE sequence_schema = 'public';
            """)).fetchall()
            
            for seq in sequences:
                seq_name = seq[0]
                try:
                    db.session.execute(text(f"ALTER SEQUENCE {seq_name} RESTART WITH 1;"))
                    db.session.commit()
                    print(f"✅ Reset sequence: {seq_name}")
                except Exception as e:
                    db.session.rollback()
                    print(f"⚠️  Could not reset {seq_name}: {e}")
                    
        except Exception as e:
            print(f"⚠️  Could not query sequences: {e}")
            # Fallback - reset known sequences
            known_sequences = [
                'admins_id_seq', 'faculties_id_seq', 'departments_id_seq',
                'lecturers_id_seq', 'courses_id_seq', 'course_students_id_seq',
                'continuous_assessments_id_seq', 'assessment_grades_id_seq',
                'reference_grades_id_seq', 'student_gpas_id_seq',
                'student_academic_status_id_seq', 'student_grade_records_id_seq',
                'students_id_seq', 'approval_requests_id_seq',
                'approval_steps_id_seq', 'notifications_id_seq',
                'course_approvals_id_seq', 'course_assessment_approvals_id_seq',
                'approval_history_id_seq'
            ]
            for seq in known_sequences:
                try:
                    db.session.execute(text(f"ALTER SEQUENCE IF EXISTS {seq} RESTART WITH 1;"))
                    db.session.commit()
                except:
                    pass
        
        # ============================================================
        # STEP 5: Re-enable foreign key constraints
        # ============================================================
        print("\n📦 Step 5: Re-enabling foreign key constraints...")
        try:
            db.session.execute(text("SET session_replication_role = 'origin';"))
            db.session.commit()
            print("✅ Foreign key constraints re-enabled")
        except Exception as e:
            print(f"⚠️  Could not re-enable constraints: {e}")
        
        # ============================================================
        # STEP 6: Verify
        # ============================================================
        print("\n📦 Step 6: Verifying wipe...")
        
        verification_results = {}
        for table_name in all_tables:
            try:
                count = db.session.execute(text(f"SELECT COUNT(*) FROM {table_name}")).fetchone()[0]
                verification_results[table_name] = count
            except:
                verification_results[table_name] = "ERROR"
        
        print("\n" + "=" * 70)
        print("✅ WIPE COMPLETE - VERIFICATION")
        print("=" * 70)
        
        all_clean = True
        for table, count in verification_results.items():
            if table == 'admins':
                if count == 1:
                    print(f"✅ {table}: {count} row (Super Admin preserved)")
                else:
                    print(f"⚠️  {table}: {count} rows (expected 1)")
                    all_clean = False
            else:
                if count == 0:
                    print(f"✅ {table}: {count} rows - EMPTY")
                else:
                    print(f"⚠️  {table}: {count} rows - NOT EMPTY!")
                    all_clean = False
        
        print("\n" + "=" * 70)
        if all_clean:
            print("🎉 ALL TABLES SUCCESSFULLY WIPED!")
        else:
            print("⚠️  Some tables may still have data. Check above.")
        print("=" * 70)
        
        print("""
╔══════════════════════════════════════════════════════════════╗
║                    SYSTEM IS NOW CLEAN                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  👤 Super Admin:                                             ║
║     Username: Kamara                                         ║
║     Password: default123                                     ║
║                                                              ║
║  📋 NEXT STEPS (in order):                                   ║
║     1. Create Faculties (Admin Dashboard → Faculty Structure)║
║     2. Create Departments under each Faculty                 ║
║     3. Create HOD (Head of Department) for each Department   ║
║     4. Create Dean for each Faculty                          ║
║     5. Create Exam Officer (GLOBAL role)                     ║
║     6. Create Lecturers under departments                    ║
║                                                              ║
║  ⚠️  Without HOD, Dean, and Exam Officer,                    ║
║     the approval system will NOT work!                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        """)

if __name__ == '__main__':
    wipe_all_data()
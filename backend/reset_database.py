"""
WARNING: This script deletes ALL data from the database
except the super admin account. Use only for testing.

Run: python reset_database.py
"""
from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("⚠️  WARNING: This will delete ALL data except super admin!")
    print("Type 'YES' to confirm:")
    confirm = input("> ")
    
    if confirm != "YES":
        print("❌ Cancelled.")
        exit()

    print("\n🗑️  Deleting all data...")

    # Delete in correct order (child tables first)
    tables = [
        'grade_edit_requests',
        'notifications',
        'assessment_grades',
        'continuous_assessments',
        'approval_steps',
        'approval_history',
        'course_assessment_approvals',
        'course_approvals',
        'approval_requests',
        'reference_grades',
        'student_grade_records',
        'student_academic_status',
        'student_gpas',
        'course_students',
        'courses',
        'user_sessions',
        'transcript_records',
        'students',
        'lecturers',
        'departments',
        'faculties',
    ]

    for table in tables:
        try:
            result = db.session.execute(text(f"DELETE FROM {table}"))
            print(f"  ✅ {table}: {result.rowcount} rows deleted")
        except Exception as e:
            print(f"  ⏭️  {table}: skipped ({e})")

    # Delete admins except super_admin
    try:
        result = db.session.execute(text(
            "DELETE FROM admins WHERE role != 'super_admin'"
        ))
        print(f"  ✅ admins (non-super): {result.rowcount} rows deleted")
    except Exception as e:
        print(f"  ⏭️  admins: skipped ({e})")

    db.session.commit()
    
    print("\n" + "="*50)
    print("✅ Database wiped successfully!")
    print("="*50)
    
    # Show remaining data
    from models.user import Admin
    admins = Admin.query.all()
    print(f"\n📋 Remaining admins ({len(admins)}):")
    for admin in admins:
        print(f"  - {admin.full_name} ({admin.username}) - Role: {admin.role}")
    
    print("\n🔑 Use this admin to login and set up the system:")
    for admin in admins:
        print(f"  Username: {admin.username}")
        print(f"  Password: (your existing password)")
    
    print("\n📝 Next steps:")
    print("  1. Login as super admin")
    print("  2. Create Faculties & Departments")
    print("  3. Add Lecturers (assign HOD, Dean roles)")
    print("  4. Login as HOD to create courses")
    print("  5. Login as Lecturer to enter grades")
    print("  6. Test the approval flow")
from app import create_app
from extensions import db

app = create_app()

with app.app_context():
    from models.user import Admin, Lecturer
    from models.academic import Faculty, Department, Course, CourseStudent
    from models.approval import ApprovalRequest
    from models.reference import ReferenceGrade
    from models.notification import Notification
    
    print("\n=== DATA CHECK ===")
    print(f"Admins: {Admin.query.count()}")
    print(f"Lecturers: {Lecturer.query.count()}")
    print(f"Faculties: {Faculty.query.count()}")
    print(f"Departments: {Department.query.count()}")
    print(f"Courses: {Course.query.count()}")
    print(f"Students: {db.session.query(CourseStudent.student_id).distinct().count()}")
    print(f"Course Enrollments: {CourseStudent.query.count()}")
    print(f"Approval Requests: {ApprovalRequest.query.count()}")
    print(f"References: {ReferenceGrade.query.count()}")
    print(f"Notifications: {Notification.query.count()}")
    
    print("\n=== NOTIFICATIONS ===")
    for n in Notification.query.all():
        print(f"  To: user_id={n.user_id}, type={n.user_type}, title={n.title}")
    
    print("\n=== APPROVAL REQUESTS ===")
    for r in ApprovalRequest.query.all():
        print(f"  ID={r.id}, type={r.submission_type}, status={r.status}, course_id={r.course_id}")
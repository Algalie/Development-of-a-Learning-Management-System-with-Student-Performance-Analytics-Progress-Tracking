from app import create_app
from extensions import db

app = create_app()

with app.app_context():
    from models.approval import ApprovalRequest, ApprovalStep
    from models.academic import Course
    from models.user import Lecturer
    
    print("\n=== LECTURERS ===")
    for l in Lecturer.query.all():
        print(f'{l.id}: {l.full_name} - Role: {l.role} - Dept: {l.department_id} - Faculty: {l.faculty_id}')
    
    print("\n=== COURSE APPROVAL REQUESTS ===")
    reqs = ApprovalRequest.query.filter_by(submission_type='course').order_by(ApprovalRequest.id.desc()).all()
    for req in reqs:
        course = Course.query.get(req.submission_id)
        course_name = course.course_code if course else "N/A"
        print(f'Request {req.id}: Course={course_name}')
        print(f'  Status: {req.status}')
        print(f'  Current Level: {req.current_level}')
        print(f'  Creator ID: {req.creator_id}')
        print(f'  Target Dept: {req.target_department_id}')
        print(f'  Target Faculty: {req.target_faculty_id}')
        for step in req.steps:
            print(f'  Step {step.step_order}: {step.level} - {step.status} (approver: {step.approver_id})')
        print()
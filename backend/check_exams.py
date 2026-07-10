from app import create_app
from extensions import db

app = create_app()

with app.app_context():
    from models.approval import ApprovalRequest, ApprovalStep
    from models.academic import Course, CourseStudent
    
    print("\n=== EXAM APPROVAL REQUESTS ===")
    reqs = ApprovalRequest.query.filter_by(submission_type='exam').order_by(ApprovalRequest.id.desc()).all()
    for req in reqs:
        course = Course.query.get(req.submission_id)
        course_name = course.course_code if course else "N/A"
        print(f"Request {req.id}: Course={course_name}")
        print(f"  Status: {req.status}, Level: {req.current_level}")
        for step in req.steps:
            print(f"    Step {step.step_order}: {step.level} - {step.status}")
        
        students = CourseStudent.query.filter_by(course_id=req.submission_id).all()
        for s in students:
            print(f"  Student {s.student_id}: exam_score={s.exam_score}, exam_status={s.exam_status}")
        print()
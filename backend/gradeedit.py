from app import create_app
from extensions import db
from models.grade_edit import GradeEditRequest

app = create_app()

with app.app_context():
    edits = GradeEditRequest.query.all()
    print(f"\nTotal grade edit requests: {len(edits)}")
    for e in edits:
        print(f"ID: {e.id} | Student: {e.course_student_id} | Status: {e.status} | Field: {e.requested_field}")
        print(f"  Current: {e.current_value} → New: {e.new_value}")
        print(f"  Reason: {e.reason}")
        print()
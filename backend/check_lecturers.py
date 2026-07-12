from app import create_app
from extensions import db
from models.user import Lecturer

app = create_app()

with app.app_context():
    lecturers = Lecturer.query.all()
    print("\n=== ALL LECTURERS ===")
    for l in lecturers:
        print(f"ID: {l.id} | Name: {l.full_name} | Role: {l.role} | Dept ID: {l.department_id} | Faculty ID: {l.faculty_id}")
        if l.department:
            print(f"  Department: {l.department.name} (ID: {l.department.id})")
        if l.faculty:
            print(f"  Faculty: {l.faculty.name} (ID: {l.faculty.id})")
        print()
from extensions import db
from datetime import datetime

class Admin(db.Model):
    __tablename__ = 'admins'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(50), nullable=False, default='admin')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }


class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }


class Lecturer(db.Model):
    __tablename__ = 'lecturers'
    id = db.Column(db.Integer, primary_key=True)
    lecturer_id = db.Column(db.String(50), unique=True, nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20))
    qualification = db.Column(db.String(200))
    role = db.Column(db.String(50), default='lecturer')
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'))
    signature = db.Column(db.String(200), nullable=True)  # NEW: Digital signature
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    department = db.relationship('Department', foreign_keys=[department_id])
    faculty = db.relationship('Faculty', foreign_keys=[faculty_id])

    def get_display_department(self):
        if self.department:
            return self.department.name
        elif self.faculty:
            return f"{self.faculty.name} (Faculty Level)"
        return 'Not assigned'
    
    def has_role(self, role_name):
        """Check if lecturer has a specific role"""
        return self.role == role_name
    
    def is_hod(self):
        return self.role == 'head_of_department'
    
    def is_dean(self):
        return self.role == 'dean'
    
    def is_exam_officer(self):
        return self.role == 'exam_officer'
    
    def is_approver(self):
        return self.role in ['head_of_department', 'dean', 'exam_officer']
    
    def can_create_courses(self):
        """Only HOD can create courses"""
        return self.role == 'head_of_department'

    def to_dict(self):
        return {
            'id': self.id,
            'lecturer_id': self.lecturer_id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'qualification': self.qualification,
            'role': self.role,
            'department_id': self.department_id,
            'faculty_id': self.faculty_id,
            'signature': self.signature,  # NEW
            'department': {
                'id': self.department.id,
                'name': self.department.name,
                'faculty': {
                    'id': self.department.faculty.id,
                    'name': self.department.faculty.name,
                    'code': self.department.faculty.code,
                } if self.department and self.department.faculty else None
            } if self.department else None,
            'faculty': {
                'id': self.faculty.id,
                'name': self.faculty.name,
                'code': self.faculty.code,
            } if self.faculty else None,
            'display_department': self.get_display_department(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }
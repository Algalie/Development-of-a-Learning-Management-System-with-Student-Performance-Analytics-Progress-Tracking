from extensions import db
from datetime import datetime

class StudentGPA(db.Model):
    __tablename__ = 'student_gpas'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(20), nullable=False)
    semester = db.Column(db.String(20), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    total_credit_hours = db.Column(db.Float, nullable=False)
    total_grade_points = db.Column(db.Float, nullable=False)
    gpa = db.Column(db.Float, nullable=False)
    cumulative_gpa = db.Column(db.Float, nullable=True)
    has_pending_references = db.Column(db.Boolean, default=False)
    pending_references_count = db.Column(db.Integer, default=0)
    student_status = db.Column(db.String(20), nullable=True)
    reference_details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    calculated_by_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=True)
    calculated_by = db.relationship('Admin', foreign_keys=[calculated_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': self.student_name,
            'level': self.level,
            'semester': self.semester,
            'academic_year': self.academic_year,
            'gpa': self.gpa,
            'cumulative_gpa': self.cumulative_gpa,
            'total_credit_hours': self.total_credit_hours,
            'total_grade_points': self.total_grade_points,
            'student_status': self.student_status,
            'has_pending_references': self.has_pending_references,
            'pending_references_count': self.pending_references_count,
        }


class StudentAcademicStatus(db.Model):
    __tablename__ = 'student_academic_status'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    program_type = db.Column(db.String(20), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    department = db.relationship('Department', foreign_keys=[department_id])
    academic_year = db.Column(db.String(20), nullable=False)
    level = db.Column(db.String(20), nullable=False)
    semester1_gpa = db.Column(db.Float, nullable=True)
    semester1_status = db.Column(db.String(20), nullable=True)
    semester2_gpa = db.Column(db.Float, nullable=True)
    semester2_status = db.Column(db.String(20), nullable=True)
    final_gpa = db.Column(db.Float, nullable=True)
    final_status = db.Column(db.String(20), nullable=True)
    promoted = db.Column(db.Boolean, default=False)
    repeated = db.Column(db.Boolean, default=False)
    withdrawn = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StudentGradeRecord(db.Model):
    __tablename__ = 'student_grade_records'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    course_code = db.Column(db.String(20), nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    credit_hours = db.Column(db.Integer, nullable=False)
    grade = db.Column(db.String(2), nullable=False)
    grade_points = db.Column(db.Float, nullable=False)
    level = db.Column(db.String(20), nullable=False)
    semester = db.Column(db.String(20), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

from extensions import db
from datetime import datetime

class ReferenceGrade(db.Model):
    __tablename__ = 'reference_grades'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('course_students.id'), nullable=False)
    original_grade = db.Column(db.String(2), nullable=False)
    original_score = db.Column(db.Float, nullable=False)
    original_credit_hours = db.Column(db.Integer, nullable=False)
    reference_grade = db.Column(db.String(2), nullable=True)
    reference_score = db.Column(db.Float, nullable=True)
    display_grade = db.Column(db.String(10), nullable=True)
    reference_status = db.Column(db.String(20), default='pending')
    double_reference = db.Column(db.Boolean, default=False)
    submitted_for_approval = db.Column(db.Boolean, default=False)
    hod_approved = db.Column(db.Boolean, default=False)
    dean_approved = db.Column(db.Boolean, default=False)
    exam_approved = db.Column(db.Boolean, default=False)
    fully_approved = db.Column(db.Boolean, default=False)
    rejected = db.Column(db.Boolean, default=False)
    rejection_reason = db.Column(db.Text, nullable=True)
    hod_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    hod_approved_at = db.Column(db.DateTime, nullable=True)
    hod_signature = db.Column(db.String(100), nullable=True)
    dean_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    dean_approved_at = db.Column(db.DateTime, nullable=True)
    dean_signature = db.Column(db.String(100), nullable=True)
    exam_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    exam_approved_at = db.Column(db.DateTime, nullable=True)
    exam_signature = db.Column(db.String(100), nullable=True)
    approval_status = db.Column(db.String(30), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cleared_at = db.Column(db.DateTime, nullable=True)

    course = db.relationship('Course', foreign_keys=[course_id], backref=db.backref('course_references', lazy=True))
    student = db.relationship('CourseStudent', foreign_keys=[student_id], backref=db.backref('student_references', lazy=True))
    hod_approved_by = db.relationship('Lecturer', foreign_keys=[hod_approved_by_id])
    dean_approved_by = db.relationship('Lecturer', foreign_keys=[dean_approved_by_id])
    exam_approved_by = db.relationship('Lecturer', foreign_keys=[exam_approved_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'student_id': self.student_id,
            'original_grade': self.original_grade,
            'original_score': self.original_score,
            'original_credit_hours': self.original_credit_hours,
            'reference_grade': self.reference_grade,
            'reference_score': self.reference_score,
            'display_grade': self.display_grade,
            'reference_status': self.reference_status,
            'double_reference': self.double_reference,
            'approval_status': self.approval_status,
            'hod_approved': self.hod_approved,
            'dean_approved': self.dean_approved,
            'exam_approved': self.exam_approved,
            'rejected': self.rejected,
            'rejection_reason': self.rejection_reason,
            'submitted_for_approval': self.submitted_for_approval,
            'course_code': self.course.course_code if self.course else None,
            'course_name': self.course.course_name if self.course else None,
            'semester': self.course.semester if self.course else None,
            'academic_year': self.course.academic_year if self.course else None,
            'student_name': self.student.student_name if self.student else None,
            'student_id_num': self.student.student_id if self.student else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def get_effective_credit_hours(self):
        if self.reference_status in ['cleared', 'double_fail']:
            return self.original_credit_hours * 2
        return self.original_credit_hours
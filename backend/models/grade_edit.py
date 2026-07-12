from extensions import db
from datetime import datetime


class GradeEditRequest(db.Model):
    """Track requests to edit grades after finalization"""
    __tablename__ = 'grade_edit_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    course_student_id = db.Column(db.Integer, db.ForeignKey('course_students.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    
    # Who requested the edit
    requested_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    requested_by = db.relationship('Lecturer', foreign_keys=[requested_by_id])
    
    # What needs to change
    requested_field = db.Column(db.String(30), nullable=False)  # 'exam_score', 'test_score', 'assignment_score', 'attendance_score'
    current_value = db.Column(db.Float, nullable=True)
    new_value = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    
    # Approval flow: pending_hod -> pending_dean -> pending_exam -> approved
    status = db.Column(db.String(30), default='pending_hod')
    
    # HOD review
    hod_reviewed = db.Column(db.Boolean, default=False)
    hod_reviewed_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    hod_reviewed_by = db.relationship('Lecturer', foreign_keys=[hod_reviewed_by_id])
    hod_reviewed_at = db.Column(db.DateTime, nullable=True)
    hod_decision = db.Column(db.String(20), nullable=True)  # 'approved', 'rejected'
    hod_comment = db.Column(db.Text, nullable=True)
    hod_signature = db.Column(db.String(200), nullable=True)
    
    # Dean review
    dean_reviewed = db.Column(db.Boolean, default=False)
    dean_reviewed_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    dean_reviewed_by = db.relationship('Lecturer', foreign_keys=[dean_reviewed_by_id])
    dean_reviewed_at = db.Column(db.DateTime, nullable=True)
    dean_decision = db.Column(db.String(20), nullable=True)  # 'approved', 'rejected'
    dean_comment = db.Column(db.Text, nullable=True)
    dean_signature = db.Column(db.String(200), nullable=True)
    
    # Exam Office final action
    exam_activated = db.Column(db.Boolean, default=False)
    exam_activated_by_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=True)
    exam_activated_by = db.relationship('Admin', foreign_keys=[exam_activated_by_id])
    exam_activated_at = db.Column(db.DateTime, nullable=True)
    exam_signature = db.Column(db.String(200), nullable=True)
    
    # Track if the edit has been applied
    edit_applied = db.Column(db.Boolean, default=False)
    edit_applied_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    course_student = db.relationship('CourseStudent', foreign_keys=[course_student_id])
    course = db.relationship('Course', foreign_keys=[course_id])
    
    def get_status_display(self):
        status_map = {
            'pending_hod': 'Pending HOD Review',
            'pending_dean': 'Pending Dean Review',
            'pending_exam': 'Pending Exam Office',
            'approved': 'Edit Approved',
            'rejected': 'Edit Rejected',
            'applied': 'Edit Applied',
        }
        return status_map.get(self.status, self.status)
    
    def to_dict(self):
        return {
            'id': self.id,
            'course_student_id': self.course_student_id,
            'course_id': self.course_id,
            'student_name': self.course_student.student_name if self.course_student else None,
            'student_id': self.course_student.student_id if self.course_student else None,
            'course_code': self.course.course_code if self.course else None,
            'course_name': self.course.course_name if self.course else None,
            'requested_by': self.requested_by.full_name if self.requested_by else None,
            'requested_field': self.requested_field,
            'current_value': self.current_value,
            'new_value': self.new_value,
            'reason': self.reason,
            'status': self.status,
            'status_display': self.get_status_display(),
            'hod_reviewed': self.hod_reviewed,
            'hod_decision': self.hod_decision,
            'hod_comment': self.hod_comment,
            'hod_signature': self.hod_signature,
            'dean_reviewed': self.dean_reviewed,
            'dean_decision': self.dean_decision,
            'dean_comment': self.dean_comment,
            'dean_signature': self.dean_signature,
            'exam_activated': self.exam_activated,
            'exam_signature': self.exam_signature,
            'edit_applied': self.edit_applied,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
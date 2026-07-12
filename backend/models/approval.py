from extensions import db
from datetime import datetime

class ApprovalRequest(db.Model):
    __tablename__ = 'approval_requests'
    id = db.Column(db.Integer, primary_key=True)
    submission_type = db.Column(db.String(20), nullable=False)
    submission_id = db.Column(db.Integer, nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=True)
    course = db.relationship('Course', foreign_keys=[course_id])
    creator_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    creator = db.relationship('Lecturer', foreign_keys=[creator_id])
    creator_role = db.Column(db.String(20), nullable=False)
    current_level = db.Column(db.String(20), nullable=False)
    current_approver_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    current_approver = db.relationship('Lecturer', foreign_keys=[current_approver_id])
    target_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    target_department = db.relationship('Department', foreign_keys=[target_department_id])
    target_faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=True)
    target_faculty = db.relationship('Faculty', foreign_keys=[target_faculty_id])
    status = db.Column(db.String(30), default='draft')
    signature = db.Column(db.String(200), nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    finalized_at = db.Column(db.DateTime, nullable=True)
    rejected_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    steps = db.relationship('ApprovalStep', backref='request', lazy=True, cascade='all, delete-orphan', order_by='ApprovalStep.step_order')
    notifications = db.relationship('Notification', backref='request', lazy=True)

    def get_status_display(self):
        status_map = {
            'draft': 'Draft', 'pending_hod': 'Pending HOD', 'pending_dean': 'Pending Dean',
            'pending_exam': 'Pending Exam Office', 'finalized': 'Finalized', 'rejected': 'Rejected'
        }
        return status_map.get(self.status, self.status)

    def to_dict(self):
        return {
            'id': self.id,
            'submission_type': self.submission_type,
            'submission_id': self.submission_id,
            'course_id': self.course_id,
            'course': self.course.to_dict() if self.course else None,
            'creator': self.creator.to_dict() if self.creator else None,
            'creator_role': self.creator_role,
            'current_level': self.current_level,
            'status': self.status,
            'signature': self.signature,
            'status_display': self.get_status_display(),
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'finalized_at': self.finalized_at.isoformat() if self.finalized_at else None,
            'rejected_at': self.rejected_at.isoformat() if self.rejected_at else None,
            'steps': [s.to_dict() for s in self.steps] if self.steps else [],
        }


class ApprovalStep(db.Model):
    __tablename__ = 'approval_steps'
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('approval_requests.id'), nullable=False)
    step_order = db.Column(db.Integer, nullable=False)
    level = db.Column(db.String(20), nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    approver = db.relationship('Lecturer', foreign_keys=[approver_id])
    status = db.Column(db.String(20), default='pending')
    approved_at = db.Column(db.DateTime, nullable=True)
    signature = db.Column(db.String(100), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    comments = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'step_order': self.step_order,
            'level': self.level,
            'status': self.status,
            'signature': self.signature,
            'rejection_reason': self.rejection_reason,
            'comments': self.comments,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
        }


class ApprovalHistory(db.Model):
    __tablename__ = 'approval_history'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    course = db.relationship('Course', foreign_keys=[course_id])
    action = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(20), nullable=False)
    performed_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    performed_by = db.relationship('Lecturer', foreign_keys=[performed_by_id])
    performed_at = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'course': self.course.to_dict() if self.course else None,
            'action': self.action,
            'level': self.level,
            'performed_by': self.performed_by.to_dict() if self.performed_by else None,
            'performed_at': self.performed_at.isoformat() if self.performed_at else None,
            'details': self.details,
        }


class CourseApproval(db.Model):
    __tablename__ = 'course_approvals'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    approval_level = db.Column(db.String(20), nullable=False)
    approved = db.Column(db.Boolean, default=False)
    rejected = db.Column(db.Boolean, default=False)
    rejection_reason = db.Column(db.Text, nullable=True)
    approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    approved_by = db.relationship('Lecturer', foreign_keys=[approved_by_id])
    approved_at = db.Column(db.DateTime)
    comments = db.Column(db.Text)
    signature = db.Column(db.String(100))
    sent_to_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    sent_to = db.relationship('Lecturer', foreign_keys=[sent_to_id])
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('course_id', 'approval_level', name='unique_course_approval'),)


class CourseAssessmentApproval(db.Model):
    __tablename__ = 'course_assessment_approvals'
    __table_args__ = {'extend_existing': True}
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    course = db.relationship('Course', foreign_keys=[course_id])
    approval_type = db.Column(db.String(20), nullable=False)
    approval_level = db.Column(db.String(20), nullable=False)
    fully_approved = db.Column(db.Boolean, default=False)
    hod_approved = db.Column(db.Boolean, default=False)
    hod_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    hod_approved_by = db.relationship('Lecturer', foreign_keys=[hod_approved_by_id])
    hod_approved_at = db.Column(db.DateTime)
    dean_approved = db.Column(db.Boolean, default=False)
    dean_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    dean_approved_by = db.relationship('Lecturer', foreign_keys=[dean_approved_by_id])
    dean_approved_at = db.Column(db.DateTime)
    exam_approved = db.Column(db.Boolean, default=False)
    exam_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    exam_approved_by = db.relationship('Lecturer', foreign_keys=[exam_approved_by_id])
    exam_approved_at = db.Column(db.DateTime)
    rejected = db.Column(db.Boolean, default=False)
    rejection_reason = db.Column(db.Text, nullable=True)
    rejected_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    rejected_by = db.relationship('Lecturer', foreign_keys=[rejected_by_id])
    rejected_at = db.Column(db.DateTime)
    sent_to_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    sent_to = db.relationship('Lecturer', foreign_keys=[sent_to_id])
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
from flask import Blueprint, render_template, request, session, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import random
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from werkzeug.security import generate_password_hash, check_password_hash


admin_bp = Blueprint('admin', __name__)

# ==================== DATABASE SETUP ====================

def create_database_if_not_exists():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="postgres",
            user="postgres",
            password="algalieacama55"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'university_db'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute('CREATE DATABASE university_db')
            print("✅ Database 'university_db' created successfully!")
        else:
            print("✅ Database 'university_db' already exists")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

create_database_if_not_exists()

db = SQLAlchemy()

# ==================== USER MODELS ====================

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
    def __repr__(self): return f'<Admin {self.username}>'


class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)


# ==================== ACADEMIC STRUCTURE ====================

class Faculty(db.Model):
    __tablename__ = 'faculties'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    departments = db.relationship('Department', backref='faculty', lazy=True, cascade='all, delete-orphan')
    lecturers = db.relationship('Lecturer', backref='faculty_ref', lazy=True, foreign_keys='Lecturer.faculty_id')
    def __repr__(self): return f'<Faculty {self.name}>'


class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('faculty_id', 'name', name='unique_department_per_faculty'),)
    lecturers = db.relationship('Lecturer', backref='department_ref', lazy=True, foreign_keys='Lecturer.department_id')
    def __repr__(self): return f'<Department {self.name}>'


# ==================== LECTURER MODEL ====================

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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    department = db.relationship('Department', backref='dept_lecturers', foreign_keys=[department_id])
    faculty = db.relationship('Faculty', backref='fac_lecturers', foreign_keys=[faculty_id])
    
    def get_display_department(self):
        if self.department: return self.department.name
        elif self.faculty: return f"{self.faculty.name} (Faculty Level)"
        return 'Not assigned'
    
    def role_assignment_level(self):
        role_map = {'head_of_department': 'hod', 'dean': 'dean'}
        return role_map.get(self.role, 'lecturer')


# ==================== COURSE MODEL ====================

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    course_code = db.Column(db.String(20), nullable=False)
    course_name = db.Column(db.String(100), nullable=False)
    credit_hours = db.Column(db.Integer, nullable=False)
    semester = db.Column(db.String(20), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    created_by = db.relationship('Lecturer', foreign_keys=[created_by_id])
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=False)
    faculty = db.relationship('Faculty', foreign_keys=[faculty_id])
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    department = db.relationship('Department', foreign_keys=[department_id])
    course_type = db.Column(db.String(50), nullable=False, default='departmental')
    is_active = db.Column(db.Boolean, default=True)
    program_type = db.Column(db.String(20), nullable=False, default='BSc')
    approval_status = db.Column(db.String(30), default='draft')
    is_editable = db.Column(db.Boolean, default=True)
    current_approval_request_id = db.Column(db.Integer, db.ForeignKey('approval_requests.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    students = db.relationship('CourseStudent', backref='course', lazy=True, cascade='all, delete-orphan')
    assessments = db.relationship('ContinuousAssessment', backref='course', lazy=True, cascade='all, delete-orphan')
    reference_grades = db.relationship('ReferenceGrade', backref='course', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self): return f'<Course {self.course_code}>'
    
    def is_fully_approved(self): return self.approval_status == 'finalized'
    
    def get_approval_status(self):
        return {
            'status': self.approval_status,
            'is_finalized': self.approval_status == 'finalized',
            'is_pending': self.approval_status and self.approval_status.startswith('pending_'),
            'is_rejected': self.approval_status == 'rejected',
            'is_draft': self.approval_status == 'draft',
        }


# ==================== COURSE STUDENT MODEL ====================

class CourseStudent(db.Model):
    __tablename__ = 'course_students'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    student_id = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    student_email = db.Column(db.String(100))
    student_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    student_department = db.relationship('Department', foreign_keys=[student_department_id])
    added_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    added_by = db.relationship('Lecturer', foreign_keys=[added_by_id])
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    test_score = db.Column(db.Float, nullable=True)
    assignment_score = db.Column(db.Float, nullable=True)
    attendance_score = db.Column(db.Float, nullable=True)
    continuous_assessment = db.Column(db.Float, nullable=True)
    exam_score = db.Column(db.Float, nullable=True)
    total_score = db.Column(db.Float, nullable=True)
    grade = db.Column(db.String(2), nullable=True)
    grade_points = db.Column(db.Float, nullable=True)
    ca_status = db.Column(db.String(30), default='pending')
    exam_status = db.Column(db.String(30), default='pending')
    has_pending_reference = db.Column(db.Boolean, default=False)
    has_cleared_reference = db.Column(db.Boolean, default=False)
    has_double_reference = db.Column(db.Boolean, default=False)
    final_status = db.Column(db.String(20), nullable=True)
    program_type = db.Column(db.String(20), nullable=False, default='BSc')
    reference_grades = db.relationship('ReferenceGrade', backref='student', lazy=True, cascade='all, delete-orphan')
    __table_args__ = (db.UniqueConstraint('course_id', 'student_id', name='unique_course_student'),)
    
    def calculate_ca(self):
        total = 0
        if self.test_score: total += self.test_score
        if self.assignment_score: total += self.assignment_score
        if self.attendance_score: total += self.attendance_score
        self.continuous_assessment = total
        return total
    
    def calculate_total(self):
        if self.continuous_assessment is not None and self.exam_score is not None:
            self.total_score = self.continuous_assessment + self.exam_score
            self.calculate_grade()
            return self.total_score
        return None
    
    def calculate_grade(self):
        if self.total_score is None: return
        if self.total_score >= 75: self.grade, self.grade_points = 'A', 5.0
        elif self.total_score >= 65: self.grade, self.grade_points = 'B', 4.0
        elif self.total_score >= 50: self.grade, self.grade_points = 'C', 3.0
        elif self.total_score >= 40: self.grade, self.grade_points = 'D', 2.0
        elif self.total_score >= 30: self.grade, self.grade_points = 'E', 1.0
        else: self.grade, self.grade_points = 'F', 0.0


# ==================== ASSESSMENT MODELS ====================

class ContinuousAssessment(db.Model):
    __tablename__ = 'continuous_assessments'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    assessment_name = db.Column(db.String(100), nullable=False)
    assessment_type = db.Column(db.String(50), nullable=False)
    max_score = db.Column(db.Float, nullable=False)
    weight = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    grades = db.relationship('AssessmentGrade', backref='assessment', lazy=True, cascade='all, delete-orphan')


class AssessmentGrade(db.Model):
    __tablename__ = 'assessment_grades'
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('continuous_assessments.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('course_students.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    entered_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    entered_by = db.relationship('Lecturer', foreign_keys=[entered_by_id])
    entered_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('assessment_id', 'student_id', name='unique_assessment_student'),)


# ==================== REFERENCE GRADE MODEL ====================

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
    approval_status = db.Column(db.String(30), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self): return f'<ReferenceGrade {self.original_grade}>'
    
    def get_effective_credit_hours(self):
        if self.reference_status in ['cleared', 'double_fail']: return self.original_credit_hours * 2
        return self.original_credit_hours
    
    def get_effective_grade_points(self):
        grade_map = {'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0}
        if self.reference_status == 'cleared' and self.reference_grade:
            return grade_map.get(self.reference_grade, 0.0)
        elif self.reference_status == 'double_fail' and self.reference_grade:
            return grade_map.get(self.reference_grade, 0.0)
        return grade_map.get(self.original_grade, 0.0)


# ==================== OLD APPROVAL MODELS (KEPT FOR LEGACY DATA) ====================

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
    approval_type = db.Column(db.String(20), nullable=False)
    approval_level = db.Column(db.String(20), nullable=False)
    fully_approved = db.Column(db.Boolean, default=False)
    hod_approved = db.Column(db.Boolean, default=False)
    hod_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    hod_approved_by = db.relationship('Lecturer', foreign_keys=[hod_approved_by_id])
    hod_approved_at = db.Column(db.DateTime)
    hod_signature = db.Column(db.String(100))
    dean_approved = db.Column(db.Boolean, default=False)
    dean_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    dean_approved_by = db.relationship('Lecturer', foreign_keys=[dean_approved_by_id])
    dean_approved_at = db.Column(db.DateTime)
    dean_signature = db.Column(db.String(100))
    exam_approved = db.Column(db.Boolean, default=False)
    exam_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    exam_approved_by = db.relationship('Lecturer', foreign_keys=[exam_approved_by_id])
    exam_approved_at = db.Column(db.DateTime)
    exam_signature = db.Column(db.String(100))
    rejected = db.Column(db.Boolean, default=False)
    rejection_reason = db.Column(db.Text, nullable=True)
    rejected_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    rejected_by = db.relationship('Lecturer', foreign_keys=[rejected_by_id])
    rejected_at = db.Column(db.DateTime)
    sent_to_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    sent_to = db.relationship('Lecturer', foreign_keys=[sent_to_id])
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)


class ApprovalHistory(db.Model):
    __tablename__ = 'approval_history'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(20), nullable=False)
    performed_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    performed_by = db.relationship('Lecturer', foreign_keys=[performed_by_id])
    performed_at = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)


# ==================== NEW APPROVAL SYSTEM MODELS ====================

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
    
    def __repr__(self): return f'<ApprovalRequest {self.submission_type}#{self.submission_id} - {self.status}>'


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
    
    def get_status_icon(self):
        icons = {'pending': '⏳', 'approved': '✅', 'rejected': '❌', 'skipped': '⏭️'}
        return icons.get(self.status, '❓')
    
    def __repr__(self): return f'<ApprovalStep {self.level} - {self.status}>'


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    user_type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(30), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('approval_requests.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    is_dismissed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def time_ago(self):
        diff = datetime.utcnow() - self.created_at
        if diff.days > 7: return self.created_at.strftime('%b %d')
        if diff.days > 0: return f"{diff.days}d ago"
        if diff.seconds >= 3600: return f"{diff.seconds//3600}h ago"
        if diff.seconds >= 60: return f"{diff.seconds//60}m ago"
        return "Just now"
    
    def get_icon(self):
        icons = {'submission': '📩', 'approval_progress': '✅', 'finalized': '🎉', 'rejection': '❌', 'info': 'ℹ️'}
        return icons.get(self.notification_type, '📌')
    
    def __repr__(self): return f'<Notification {self.notification_type}>'


# ==================== GPA MODELS ====================

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
    def __repr__(self): return f'<StudentGPA {self.student_id}>'


class StudentAcademicStatus(db.Model):
    __tablename__ = 'student_academic_status'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    program_type = db.Column(db.String(20), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
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
    department = db.relationship('Department', foreign_keys=[department_id])


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


# ==================== APPROVAL ENGINE ====================

class ApprovalEngine:
    FULL_CHAIN = ['hod', 'dean', 'exam']
    LEVEL_NAMES = {'hod': 'Head of Department', 'dean': 'Dean', 'exam': 'Exam Office'}
    LEVEL_ORDER = {'hod': 1, 'dean': 2, 'exam': 3}
    
    @staticmethod
    def get_creator_skip_levels(creator, target_department_id, target_faculty_id):
        skip_levels = []
        if creator.role == 'head_of_department':
            if creator.department_id == target_department_id:
                skip_levels.append('hod')
        elif creator.role == 'dean':
            skip_levels.append('hod')
            if creator.faculty_id == target_faculty_id:
                skip_levels.append('dean')
        return skip_levels
    
    @staticmethod
    def get_approval_chain(creator, target_department_id, target_faculty_id):
        skip = ApprovalEngine.get_creator_skip_levels(creator, target_department_id, target_faculty_id)
        return [level for level in ApprovalEngine.FULL_CHAIN if level not in skip]
    
    @staticmethod
    def find_approver(level, department_id=None, faculty_id=None):
        if level == 'hod':
            if not department_id: return None
            return Lecturer.query.filter_by(department_id=department_id, role='head_of_department').first()
        elif level == 'dean':
            if not faculty_id: return None
            return Lecturer.query.filter_by(faculty_id=faculty_id, role='dean').first()
        elif level == 'exam':
            return Admin.query.first()
        return None
    
    @staticmethod
    def submit(submission_type, submission_id, creator, department_id, faculty_id, course_id=None):
        chain = ApprovalEngine.get_approval_chain(creator, department_id, faculty_id)
        if not chain: raise ValueError("No approval chain could be determined.")
        
        first_level = chain[0]
        first_approver = ApprovalEngine.find_approver(first_level, department_id, faculty_id)
        
        if not first_approver:
            if first_level == 'exam':
                return ApprovalEngine._auto_finalize(submission_type, submission_id, creator, department_id, faculty_id, course_id)
            elif first_level == 'hod': raise ValueError("No HOD found for this department.")
            elif first_level == 'dean': raise ValueError("No Dean found for this faculty.")
        
        existing = ApprovalRequest.query.filter_by(submission_type=submission_type, submission_id=submission_id).first()
        if existing and existing.status not in ['rejected', 'draft']:
            raise ValueError(f"This {submission_type} has already been submitted.")
        
        if existing and existing.status == 'rejected':
            request = existing
            request.status = f'pending_{first_level}'
            request.current_level = first_level
            request.current_approver_id = first_approver.id
            request.submitted_at = datetime.utcnow()
            request.rejected_at = None
            request.target_department_id = department_id
            request.target_faculty_id = faculty_id
            ApprovalStep.query.filter_by(request_id=request.id).delete()
        else:
            request = ApprovalRequest(
                submission_type=submission_type, submission_id=submission_id,
                course_id=course_id or (submission_id if submission_type in ['course','ca','exam'] else None),
                creator_id=creator.id, creator_role=creator.role,
                current_level=first_level, current_approver_id=first_approver.id,
                target_department_id=department_id, target_faculty_id=faculty_id,
                status=f'pending_{first_level}', submitted_at=datetime.utcnow()
            )
            db.session.add(request)
            db.session.flush()
        
        # CREATE ALL 3 STEPS UPFRONT for proper display
        for i, level in enumerate(ApprovalEngine.FULL_CHAIN):
            if level in chain:
                step_status = 'pending'
                comment = None
            else:
                step_status = 'skipped'
                comment = f'Skipped - Creator is {creator.role}'
            
            step = ApprovalStep(
                request_id=request.id,
                step_order=i + 1,
                level=level,
                status=step_status,
                comments=comment
            )
            db.session.add(step)
        
        ApprovalEngine._lock_submission(submission_type, submission_id, request)
        
        cid = course_id or (submission_id if submission_type in ['course','ca','exam'] else None)
        if cid:
            course = Course.query.get(cid)
            if course:
                course.current_approval_request_id = request.id
                if submission_type == 'course':
                    course.approval_status = f'pending_{first_level}'
                    course.is_editable = False
        
        NotificationService.create(user_id=first_approver.id, user_type='lecturer',
            title=f"New {submission_type.upper()} Submission",
            message=f"{creator.full_name} submitted for your approval",
            notification_type='submission', request_id=request.id)
        
        db.session.commit()
        return request
    
    @staticmethod
    def _auto_finalize(submission_type, submission_id, creator, department_id, faculty_id, course_id):
        print(f"⚠️ No Admin/Exam Officer - auto-finalizing {submission_type}#{submission_id}")
        
        request = ApprovalRequest(
            submission_type=submission_type, submission_id=submission_id,
            course_id=course_id or (submission_id if submission_type in ['course','ca','exam'] else None),
            creator_id=creator.id, creator_role=creator.role,
            current_level='exam', current_approver_id=None,
            target_department_id=department_id, target_faculty_id=faculty_id,
            status='finalized', submitted_at=datetime.utcnow(), finalized_at=datetime.utcnow()
        )
        db.session.add(request)
        db.session.flush()
        
        chain = ApprovalEngine.get_approval_chain(creator, department_id, faculty_id)
        
        for i, level in enumerate(ApprovalEngine.FULL_CHAIN):
            if level in chain:
                step_status = 'approved'
                comment = 'Auto-finalized' if level == 'exam' else 'Auto-approved'
            else:
                step_status = 'skipped'
                comment = f'Skipped - Creator is {creator.role}'
            
            step = ApprovalStep(
                request_id=request.id, step_order=i+1, level=level,
                status=step_status, comments=comment
            )
            db.session.add(step)
        
        ApprovalEngine._finalize_submission(request)
        ApprovalEngine._lock_submission(submission_type, submission_id, request)
        
        cid = course_id or (submission_id if submission_type in ['course','ca','exam'] else None)
        if cid:
            course = Course.query.get(cid)
            if course:
                course.current_approval_request_id = request.id
                if submission_type == 'course':
                    course.approval_status = 'finalized'
                    course.is_editable = False
        
        db.session.commit()
        return request
    
    @staticmethod
    def approve(request_id, approver):
        request = ApprovalRequest.query.get_or_404(request_id)
        
        if hasattr(approver, 'lecturer_id') and request.creator_id == approver.id:
            raise ValueError("❌ You cannot approve your own submission.")
        
        # Update current pending step to approved
        current_step = ApprovalStep.query.filter_by(
            request_id=request.id, level=request.current_level, status='pending'
        ).first()
        
        if current_step:
            current_step.status = 'approved'
            current_step.approver_id = approver.id if hasattr(approver,'id') else None
            current_step.approved_at = datetime.utcnow()
            current_step.signature = f"{approver.full_name}" if hasattr(approver,'full_name') else "Admin"
        
        chain = ApprovalEngine.get_approval_chain(request.creator, request.target_department_id, request.target_faculty_id)
        current_idx = chain.index(request.current_level) if request.current_level in chain else -1
        
        if current_idx >= 0 and current_idx + 1 < len(chain):
            next_level = chain[current_idx + 1]
            next_approver = ApprovalEngine.find_approver(next_level, request.target_department_id, request.target_faculty_id)
            
            if not next_approver:
                if next_level == 'exam':
                    # Auto-finalize
                    return ApprovalEngine._finalize_request(request)
                raise ValueError(f"No {ApprovalEngine.LEVEL_NAMES.get(next_level)} found.")
            
            request.current_level = next_level
            request.current_approver_id = next_approver.id if hasattr(next_approver,'id') else None
            request.status = f'pending_{next_level}'
            
            # Update the next step to pending
            next_step = ApprovalStep.query.filter_by(request_id=request.id, level=next_level).first()
            if next_step:
                next_step.status = 'pending'
                next_step.comments = None
            
            if request.course_id:
                course = Course.query.get(request.course_id)
                if course: course.approval_status = f'pending_{next_level}'
            
            if next_level == 'exam':
                for admin in Admin.query.all():
                    NotificationService.create(user_id=admin.id, user_type='admin',
                        title=f"📋 {request.submission_type.upper()} at Exam Office",
                        message=f"From {request.creator.full_name} - requires final approval",
                        notification_type='submission', request_id=request.id)
            elif hasattr(next_approver,'id'):
                NotificationService.create(user_id=next_approver.id, user_type='lecturer',
                    title=f"{request.submission_type.upper()} Requires Your Approval",
                    message=f"Approved by {approver.full_name if hasattr(approver,'full_name') else 'Admin'}",
                    notification_type='approval_progress', request_id=request.id)
            
            NotificationService.create(user_id=request.creator_id, user_type='lecturer',
                title=f"{request.submission_type.upper()} Progress",
                message="Your submission has moved to the next approval level.",
                notification_type='approval_progress', request_id=request.id)
        else:
            return ApprovalEngine._finalize_request(request)
        
        db.session.commit()
        return request
    
    @staticmethod
    def _finalize_request(request):
        """Finalize the submission - update ALL steps properly"""
        request.status = 'finalized'
        request.finalized_at = datetime.utcnow()
        
        if request.course_id:
            course = Course.query.get(request.course_id)
            if course:
                course.approval_status = 'finalized'
        
        # Update ALL pending steps to approved
        for step in request.steps:
            if step.status == 'pending':
                step.status = 'approved'
                step.approved_at = datetime.utcnow()
                if not step.signature:
                    step.signature = "Finalized by Admin"
        
        ApprovalEngine._finalize_submission(request)
        
        NotificationService.create(user_id=request.creator_id, user_type='lecturer',
            title=f"🎉 {request.submission_type.upper()} Finalized!",
            message="Your submission has been fully approved and finalized.",
            notification_type='finalized', request_id=request.id)
        
        # Notify all admins
        for admin in Admin.query.all():
            NotificationService.create(user_id=admin.id, user_type='admin',
                title=f"{request.submission_type.upper()} Finalized",
                message=f"Submission by {request.creator.full_name} finalized.",
                notification_type='finalized', request_id=request.id)
        
        db.session.commit()
        return request
    
    @staticmethod
    def reject(request_id, approver, reason):
        request = ApprovalRequest.query.get_or_404(request_id)
        
        current_step = ApprovalStep.query.filter_by(
            request_id=request.id, level=request.current_level, status='pending'
        ).first()
        
        if current_step:
            current_step.status = 'rejected'
            current_step.approver_id = approver.id if hasattr(approver,'id') else None
            current_step.approved_at = datetime.utcnow()
            current_step.rejection_reason = reason
            current_step.signature = f"Rejected by {approver.full_name}" if hasattr(approver,'full_name') else "Rejected"
        
        request.status = 'rejected'
        request.rejected_at = datetime.utcnow()
        
        ApprovalEngine._unlock_submission(request)
        
        if request.course_id:
            course = Course.query.get(request.course_id)
            if course:
                course.approval_status = 'rejected'
                course.is_editable = True
        
        NotificationService.create(user_id=request.creator_id, user_type='lecturer',
            title=f"❌ {request.submission_type.upper()} Rejected",
            message=f"Reason: {reason}",
            notification_type='rejection', request_id=request.id)
        
        db.session.commit()
        return request
    
    @staticmethod
    def get_pending_for_user(user):
        if user.role == 'head_of_department':
            return ApprovalRequest.query.filter(
                ApprovalRequest.current_level == 'hod',
                ApprovalRequest.status == 'pending_hod',
                ApprovalRequest.target_department_id == user.department_id
            ).order_by(ApprovalRequest.submitted_at.desc()).all()
        elif user.role == 'dean':
            return ApprovalRequest.query.filter(
                ApprovalRequest.current_level == 'dean',
                ApprovalRequest.status == 'pending_dean',
                ApprovalRequest.target_faculty_id == user.faculty_id
            ).order_by(ApprovalRequest.submitted_at.desc()).all()
        return []
    
    @staticmethod
    def get_pending_for_admin():
        return ApprovalRequest.query.filter(
            ApprovalRequest.current_level == 'exam',
            ApprovalRequest.status == 'pending_exam'
        ).order_by(ApprovalRequest.submitted_at.desc()).all()
    
    @staticmethod
    def _lock_submission(submission_type, submission_id, request):
        if submission_type == 'course':
            course = Course.query.get(submission_id)
            if course: course.is_editable = False
        elif submission_type == 'ca':
            for s in CourseStudent.query.filter_by(course_id=submission_id).all():
                s.ca_status = 'submitted'
        elif submission_type == 'exam':
            for s in CourseStudent.query.filter_by(course_id=submission_id).all():
                s.exam_status = 'submitted'
        elif submission_type == 'reference':
            ref = ReferenceGrade.query.get(submission_id)
            if ref: ref.approval_status = f'pending_{request.current_level}'
    
    @staticmethod
    def _unlock_submission(request):
        if request.submission_type == 'course':
            course = Course.query.get(request.submission_id)
            if course: course.is_editable = True
        elif request.submission_type == 'reference':
            ref = ReferenceGrade.query.get(request.submission_id)
            if ref: ref.approval_status = 'rejected'
    
    @staticmethod
    def _finalize_submission(request):
        if request.submission_type == 'course':
            course = Course.query.get(request.submission_id)
            if course: course.approval_status = 'finalized'
        elif request.submission_type == 'ca':
            for s in CourseStudent.query.filter_by(course_id=request.submission_id).all():
                s.ca_status = 'finalized'
        elif request.submission_type == 'exam':
            for s in CourseStudent.query.filter_by(course_id=request.submission_id).all():
                s.exam_status = 'finalized'
        elif request.submission_type == 'reference':
            ref = ReferenceGrade.query.get(request.submission_id)
            if ref:
                ref.approval_status = 'finalized'
                if ref.reference_grade in ['E','F']:
                    ref.reference_status = 'double_fail'
                    ref.double_reference = True
                else:
                    ref.reference_status = 'cleared'


class NotificationService:
    @staticmethod
    def create(user_id, user_type, title, message, notification_type, request_id=None):
        notification = Notification(
            user_id=user_id, user_type=user_type, title=title, message=message,
            notification_type=notification_type, request_id=request_id
        )
        db.session.add(notification)
        return notification


# ==================== 2FA HELPER ====================

def generate_2fa_code(): return str(random.randint(1000, 9999))

def save_code_to_file(email, code):
    try:
        with open('2fa_codes.log', 'a') as f: f.write(f"{datetime.now()} - {email}: {code}\n")
    except: pass

def show_code_in_terminal(email, code):
    print("\n" + "="*70)
    print("🔐  2FA VERIFICATION CODE".center(70))
    print("="*70)
    print(f"📧 Email: {email}")
    print(f"🔑 Code: \033[92m{code}\033[0m")
    print("="*70 + "\n")
    save_code_to_file(email, code)


# ==================== CREATE DEFAULT ADMIN ====================

def create_default_admin(app):
    with app.app_context():
        db.create_all()
        admin = Admin.query.filter_by(username='Kamara').first()
        if not admin:
            default_admin = Admin(
                username='Kamara', email='kamaraalgalie&&@gmail.com',
                password='default123', full_name='Algalie Kamara', role='super_admin'
            )
            db.session.add(default_admin)
            db.session.commit()
            print("✅ Default admin created: Kamara / default123")
        else:
            print("✅ Admin already exists")


# ==================== ADMIN AUTH ROUTES ====================

@admin_bp.route('/login', methods=['GET', 'POST'])
def login():
    session.clear()
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        admin = Admin.query.filter_by(username=username, password=password).first()
        if admin:
            code = generate_2fa_code()
            session['2fa_pending'] = {
                'id': admin.id, 'username': admin.username, 'email': admin.email,
                'full_name': admin.full_name, 'role': admin.role, 'code': code, 'type': 'admin'
            }
            show_code_in_terminal(admin.email, code)
            return redirect(url_for('admin.two_factor'))
        else:
            flash('Invalid username or password', 'error')
    return render_template('admin_login.html')

@admin_bp.route('/2fa', methods=['GET', 'POST'])
def two_factor():
    if '2fa_pending' not in session: return redirect(url_for('admin.login'))
    if request.method == 'POST':
        if session['2fa_pending']['code'] == request.form.get('code'):
            session['user_id'] = session['2fa_pending']['id']
            session['username'] = session['2fa_pending']['username']
            session['user_role'] = session['2fa_pending']['role']
            session['full_name'] = session['2fa_pending']['full_name']
            session['user_type'] = session['2fa_pending']['type']
            user = Admin.query.get(session['user_id'])
            if user:
                user.last_login = datetime.utcnow()
                db.session.commit()
            session.pop('2fa_pending', None)
            flash(f'Welcome {user.full_name}!', 'success')
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Invalid code', 'error')
    return render_template('admin_2fa.html')

@admin_bp.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully', 'info')
    return redirect(url_for('admin.login'))


# ==================== DASHBOARD ====================

@admin_bp.route('/dashboard')
def dashboard():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    if not admin:
        session.clear()
        return redirect(url_for('admin.login'))
    
    # Basic counts
    total_admins = Admin.query.count()
    total_lecturers = Lecturer.query.count()
    total_faculties = Faculty.query.count()
    total_departments = Department.query.count()
    total_courses = Course.query.count()
    total_students = CourseStudent.query.distinct(CourseStudent.student_id).count()
    
    # Pending at Exam Office - SEPARATED by type
    pending_courses_at_exam = ApprovalRequest.query.filter(
        ApprovalRequest.submission_type == 'course',
        ApprovalRequest.current_level == 'exam',
        ApprovalRequest.status == 'pending_exam'
    ).count()
    
    pending_ca_at_exam = ApprovalRequest.query.filter(
        ApprovalRequest.submission_type == 'ca',
        ApprovalRequest.current_level == 'exam',
        ApprovalRequest.status == 'pending_exam'
    ).count()
    
    pending_exam_at_exam = ApprovalRequest.query.filter(
        ApprovalRequest.submission_type == 'exam',
        ApprovalRequest.current_level == 'exam',
        ApprovalRequest.status == 'pending_exam'
    ).count()
    
    pending_references_at_exam = ApprovalRequest.query.filter(
        ApprovalRequest.submission_type == 'reference',
        ApprovalRequest.current_level == 'exam',
        ApprovalRequest.status == 'pending_exam'
    ).count()
    
    # Combined pending at exam (all types)
    pending_grades_at_exam = pending_ca_at_exam + pending_exam_at_exam + pending_references_at_exam
    pending_at_exam = pending_courses_at_exam + pending_grades_at_exam
    
    # Finalized and rejected counts
    finalized_count = ApprovalRequest.query.filter_by(status='finalized').count()
    rejected_count = ApprovalRequest.query.filter_by(status='rejected').count()
    
    # Today's activity
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    finalized_today = ApprovalRequest.query.filter(
        ApprovalRequest.status == 'finalized',
        ApprovalRequest.finalized_at >= today
    ).count()
    
    submitted_today = ApprovalRequest.query.filter(
        ApprovalRequest.submitted_at >= today
    ).count()
    
    # Reference stats
    pending_references = ReferenceGrade.query.filter_by(reference_status='pending').count()
    cleared_references = ReferenceGrade.query.filter_by(reference_status='cleared').count()
    double_failures = ReferenceGrade.query.filter_by(reference_status='double_fail').count()
    
    # Unread notifications for this admin
    unread_notifications = Notification.query.filter_by(
        user_id=admin.id,
        user_type='admin',
        is_read=False,
        is_dismissed=False
    ).count()
    
    # Compile all stats
    stats = {
        # Basic counts
        'total_admins': total_admins,
        'total_lecturers': total_lecturers,
        'total_faculties': total_faculties,
        'total_departments': total_departments,
        'total_courses': total_courses,
        'total_students': total_students or 850,
        
        # Pending at Exam Office (by type)
        'pending_courses_at_exam': pending_courses_at_exam,
        'pending_ca_at_exam': pending_ca_at_exam,
        'pending_exam_at_exam': pending_exam_at_exam,
        'pending_references_at_exam': pending_references_at_exam,
        'pending_grades_at_exam': pending_grades_at_exam,
        'pending_at_exam': pending_at_exam,
        'pending_approvals': pending_at_exam,
        
        # Finalized/Rejected
        'finalized_count': finalized_count,
        'rejected_count': rejected_count,
        'finalized_today': finalized_today,
        'submitted_today': submitted_today,
        
        # Reference stats
        'pending_ref_status': pending_references,
        'cleared_references': cleared_references,
        'double_failures': double_failures,
        
        # Notifications
        'unread_notifications': unread_notifications,
    }
    
    return render_template(
        'admin_dashboard.html',
        full_name=admin.full_name,
        role=admin.role,
        stats=stats,
        now=datetime.now
    )


# ==================== EXAM OFFICE SUBMISSIONS (ADMIN AS EXAM OFFICER) ====================

@admin_bp.route('/exam-office-submissions')
def exam_office_submissions():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    active_tab = request.args.get('tab', 'pending')
    
    pending = ApprovalEngine.get_pending_for_admin()
    finalized = ApprovalRequest.query.filter_by(status='finalized').order_by(
        ApprovalRequest.finalized_at.desc()).limit(100).all()
    rejected = ApprovalRequest.query.filter_by(status='rejected').order_by(
        ApprovalRequest.rejected_at.desc()).limit(100).all()
    
    stats = {
        'pending': len(pending),
        'finalized': len(finalized),
        'rejected': len(rejected)
    }
    
    return render_template('admin_exam_office_submissions.html',
        full_name=admin.full_name, role=admin.role,
        pending=pending, finalized=finalized, rejected=rejected,
        stats=stats, active_tab=active_tab)

@admin_bp.route('/exam-approve/<int:request_id>', methods=['POST'])
def exam_approve_submission(request_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    try:
        request_obj = ApprovalRequest.query.get_or_404(request_id)
        if request_obj.current_level != 'exam':
            flash('This submission is not at Exam Office level', 'error')
            return redirect(url_for('admin.exam_office_submissions'))
        
        ApprovalEngine._finalize_request(request_obj)
        flash(f'🎉 {request_obj.submission_type.upper()} finalized!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error: {str(e)}', 'error')
    
    return redirect(url_for('admin.exam_office_submissions'))

@admin_bp.route('/exam-reject/<int:request_id>', methods=['POST'])
def exam_reject_submission(request_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    reason = request.form.get('reason', 'No reason provided')
    
    try:
        ApprovalEngine.reject(request_id, admin, reason)
        flash('❌ Submission rejected.', 'warning')
    except ValueError as e:
        flash(str(e), 'error')
    
    return redirect(url_for('admin.exam_office_submissions'))

@admin_bp.route('/submission/<int:request_id>/view')
def view_submission(request_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    approval_request = ApprovalRequest.query.get_or_404(request_id)
    
    course = None
    students = []
    if approval_request.submission_type in ['course', 'ca', 'exam']:
        course = Course.query.get(approval_request.submission_id)
        if course:
            students = CourseStudent.query.filter_by(course_id=course.id).all()
    elif approval_request.submission_type == 'reference':
        ref = ReferenceGrade.query.get(approval_request.submission_id)
        if ref:
            course = ref.course
            students = [ref.student]
    
    return render_template('admin_view_submission.html',
        full_name=admin.full_name, role=admin.role,
        approval_request=approval_request, course=course, students=students)


# ==================== NOTIFICATION ROUTES ====================

@admin_bp.route('/notifications')
def notifications():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    notifs = Notification.query.filter_by(
        user_id=admin.id, user_type='admin', is_dismissed=False
    ).order_by(Notification.created_at.desc()).limit(100).all()
    
    for n in notifs:
        if not n.is_read: n.is_read = True
    db.session.commit()
    
    return render_template('admin_notifications.html',
        full_name=admin.full_name, role=admin.role, notifications=notifs)

@admin_bp.route('/notifications/count')
def admin_notification_count():
    if 'user_id' not in session: return jsonify({'count': 0})
    count = Notification.query.filter_by(
        user_id=session['user_id'], user_type='admin',
        is_read=False, is_dismissed=False
    ).count()
    return jsonify({'count': count})


# ==================== USER MANAGEMENT ====================

@admin_bp.route('/manage-users')
def manage_users():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admins = Admin.query.all()
    lecturers = Lecturer.query.all()
    
    return render_template('manage_users.html',
        admins=admins, lecturers=lecturers,
        full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/add-admin', methods=['GET', 'POST'])
def add_admin():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        full_name = request.form.get('full_name')
        email = request.form.get('email')
        password = request.form.get('password')
        role = request.form.get('role')
        
        existing = Admin.query.filter((Admin.username == username) | (Admin.email == email)).first()
        if existing:
            flash('Username or Email already exists', 'error')
            return redirect(url_for('admin.add_admin'))
        
        new_admin = Admin(username=username, full_name=full_name, email=email, password=password, role=role)
        db.session.add(new_admin)
        db.session.commit()
        flash(f'Admin {full_name} added!', 'success')
        return redirect(url_for('admin.manage_users'))
    
    return render_template('add_admin.html', full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/add-lecturer', methods=['GET', 'POST'])
def add_lecturer():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    if request.method == 'POST':
        lecturer_id = request.form.get('lecturer_id')
        full_name = request.form.get('full_name')
        email = request.form.get('email')
        password = request.form.get('password')
        role = request.form.get('role')
        phone = request.form.get('phone')
        qualification = request.form.get('qualification')
        
        existing = Lecturer.query.filter(
            (Lecturer.lecturer_id == lecturer_id) | (Lecturer.email == email)
        ).first()
        if existing:
            flash('Lecturer ID or Email already exists', 'error')
            return redirect(url_for('admin.add_lecturer'))
        
        new_lecturer = Lecturer(
            lecturer_id=lecturer_id, full_name=full_name, email=email,
            password=password, role=role, phone=phone, qualification=qualification
        )
        
        if role == 'dean':
            faculty_id = request.form.get('faculty_id')
            if not faculty_id:
                flash('Please select a faculty for the Dean', 'error')
                return redirect(url_for('admin.add_lecturer'))
            new_lecturer.faculty_id = faculty_id
        elif role == 'head_of_department':
            department_id = request.form.get('department_id')
            if not department_id:
                flash('Please select a department for the HOD', 'error')
                return redirect(url_for('admin.add_lecturer'))
            new_lecturer.department_id = department_id
            dept = Department.query.get(department_id)
            if dept: new_lecturer.faculty_id = dept.faculty_id
        elif role == 'lecturer':
            department_id = request.form.get('department_id')
            if department_id:
                new_lecturer.department_id = department_id
                dept = Department.query.get(department_id)
                if dept: new_lecturer.faculty_id = dept.faculty_id
        
        db.session.add(new_lecturer)
        db.session.commit()
        flash(f'Lecturer {full_name} added as {role.replace("_"," ").title()}!', 'success')
        return redirect(url_for('admin.manage_users'))
    
    faculties = Faculty.query.all()
    return render_template('add_lecturer.html',
        faculties=faculties, full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/edit-lecturer/<int:lecturer_id>', methods=['GET', 'POST'])
def edit_lecturer(lecturer_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    lecturer = Lecturer.query.get_or_404(lecturer_id)
    
    if request.method == 'POST':
        lecturer.full_name = request.form.get('full_name')
        lecturer.email = request.form.get('email')
        lecturer.role = request.form.get('role')
        lecturer.phone = request.form.get('phone')
        lecturer.qualification = request.form.get('qualification')
        
        new_role = request.form.get('role')
        if new_role == 'dean':
            lecturer.faculty_id = request.form.get('faculty_id')
            lecturer.department_id = None
        elif new_role == 'head_of_department':
            lecturer.department_id = request.form.get('department_id')
        else:
            lecturer.department_id = request.form.get('department_id')
        
        if request.form.get('password'):
            lecturer.password = request.form.get('password')
        
        db.session.commit()
        flash('Lecturer updated!', 'success')
        return redirect(url_for('admin.manage_users'))
    
    faculties = Faculty.query.all()
    return render_template('edit_lecturer.html',
        lecturer=lecturer, faculties=faculties,
        full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/delete-lecturer/<int:lecturer_id>', methods=['POST'])
def delete_lecturer(lecturer_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    lecturer = Lecturer.query.get_or_404(lecturer_id)
    if Course.query.filter_by(created_by_id=lecturer_id).first():
        flash('Cannot delete lecturer with existing courses', 'error')
        return redirect(url_for('admin.manage_users'))
    
    db.session.delete(lecturer)
    db.session.commit()
    flash('Lecturer deleted!', 'success')
    return redirect(url_for('admin.manage_users'))


# ==================== FACULTY MANAGEMENT ====================

@admin_bp.route('/faculty-management')
def faculty_management():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    faculties = Faculty.query.all()
    return render_template('faculty_management.html',
        faculties=faculties, full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/add-faculty', methods=['GET', 'POST'])
def add_faculty():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    if request.method == 'POST':
        name = request.form.get('name')
        code = request.form.get('code')
        description = request.form.get('description')
        
        existing = Faculty.query.filter((Faculty.name == name) | (Faculty.code == code)).first()
        if existing:
            flash('Faculty name or code already exists', 'error')
            return redirect(url_for('admin.add_faculty'))
        
        faculty = Faculty(name=name, code=code, description=description)
        db.session.add(faculty)
        db.session.commit()
        flash(f'Faculty {name} added!', 'success')
        return redirect(url_for('admin.faculty_management'))
    
    return render_template('add_faculty.html', full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/edit-faculty/<int:faculty_id>', methods=['GET', 'POST'])
def edit_faculty(faculty_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    faculty = Faculty.query.get_or_404(faculty_id)
    if request.method == 'POST':
        faculty.name = request.form.get('name')
        faculty.code = request.form.get('code')
        faculty.description = request.form.get('description')
        faculty.updated_at = datetime.utcnow()
        db.session.commit()
        flash('Faculty updated!', 'success')
        return redirect(url_for('admin.faculty_management'))
    
    return render_template('edit_faculty.html', faculty=faculty,
        full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/delete-faculty/<int:faculty_id>', methods=['POST'])
def delete_faculty(faculty_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    faculty = Faculty.query.get_or_404(faculty_id)
    dept_ids = [d.id for d in faculty.departments]
    
    if Lecturer.query.filter(Lecturer.department_id.in_(dept_ids)).count() > 0 or \
       Lecturer.query.filter_by(faculty_id=faculty_id, role='dean').count() > 0 or \
       Course.query.filter_by(faculty_id=faculty_id).count() > 0:
        flash('Cannot delete faculty with assigned lecturers, deans, or courses', 'error')
        return redirect(url_for('admin.faculty_management'))
    
    db.session.delete(faculty)
    db.session.commit()
    flash('Faculty deleted!', 'success')
    return redirect(url_for('admin.faculty_management'))


# ==================== DEPARTMENT MANAGEMENT ====================

@admin_bp.route('/add-department/<int:faculty_id>', methods=['GET', 'POST'])
def add_department(faculty_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    faculty = Faculty.query.get_or_404(faculty_id)
    if request.method == 'POST':
        name = request.form.get('name')
        code = request.form.get('code')
        
        existing = Department.query.filter_by(faculty_id=faculty_id, name=name).first()
        if existing:
            flash('Department already exists in this faculty', 'error')
            return redirect(url_for('admin.add_department', faculty_id=faculty_id))
        
        department = Department(name=name, code=code, faculty_id=faculty_id)
        db.session.add(department)
        db.session.commit()
        flash(f'Department {name} added!', 'success')
        return redirect(url_for('admin.faculty_management'))
    
    return render_template('add_department.html', faculty=faculty,
        full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/edit-department/<int:dept_id>', methods=['GET', 'POST'])
def edit_department(dept_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    department = Department.query.get_or_404(dept_id)
    if request.method == 'POST':
        department.name = request.form.get('name')
        department.code = request.form.get('code')
        department.updated_at = datetime.utcnow()
        db.session.commit()
        flash('Department updated!', 'success')
        return redirect(url_for('admin.faculty_management'))
    
    return render_template('edit_department.html', department=department,
        full_name=session.get('full_name'), role=session.get('user_role'))

@admin_bp.route('/delete-department/<int:dept_id>', methods=['POST'])
def delete_department(dept_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    department = Department.query.get_or_404(dept_id)
    if Lecturer.query.filter_by(department_id=dept_id).count() > 0 or \
       Course.query.filter_by(department_id=dept_id).count() > 0:
        flash('Cannot delete department with assigned lecturers or courses', 'error')
        return redirect(url_for('admin.faculty_management'))
    
    db.session.delete(department)
    db.session.commit()
    flash('Department deleted!', 'success')
    return redirect(url_for('admin.faculty_management'))


# ==================== COURSE APPROVALS (VIEW ONLY) ====================

@admin_bp.route('/course-approvals')
def course_approvals():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    courses = Course.query.order_by(Course.created_at.desc()).all()
    
    course_ids = [c.id for c in courses]
    approval_requests = ApprovalRequest.query.filter(
        ApprovalRequest.submission_type == 'course',
        ApprovalRequest.submission_id.in_(course_ids)
    ).all()
    approval_map = {r.submission_id: r for r in approval_requests}
    
    stats = {
        'total_courses': len(courses),
        'pending_hod': ApprovalRequest.query.filter_by(submission_type='course', status='pending_hod').count(),
        'pending_dean': ApprovalRequest.query.filter_by(submission_type='course', status='pending_dean').count(),
        'pending_exam': ApprovalRequest.query.filter_by(submission_type='course', status='pending_exam').count(),
        'finalized': ApprovalRequest.query.filter_by(submission_type='course', status='finalized').count(),
        'rejected': ApprovalRequest.query.filter_by(submission_type='course', status='rejected').count(),
    }
    
    return render_template('admin_course_approvals.html',
        courses=courses, approval_map=approval_map, stats=stats,
        full_name=admin.full_name, role=admin.role)

@admin_bp.route('/course/<int:course_id>/view')
def admin_view_course(course_id):
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    course = Course.query.get_or_404(course_id)
    students = CourseStudent.query.filter_by(course_id=course_id).all()
    assessments = ContinuousAssessment.query.filter_by(course_id=course_id).count()
    
    return render_template('admin_view_course.html',
        course=course, students=students, assessments=assessments,
        full_name=admin.full_name, role=admin.role)


# ==================== GRADE APPROVALS (VIEW ONLY) ====================

@admin_bp.route('/grade-approvals')
def admin_grade_approvals():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    
    ca_approvals = ApprovalRequest.query.filter_by(submission_type='ca').order_by(
        ApprovalRequest.submitted_at.desc()).all()
    exam_approvals = ApprovalRequest.query.filter_by(submission_type='exam').order_by(
        ApprovalRequest.submitted_at.desc()).all()
    reference_approvals = ApprovalRequest.query.filter_by(submission_type='reference').order_by(
        ApprovalRequest.submitted_at.desc()).all()
    rejected_approvals = ApprovalRequest.query.filter_by(status='rejected').order_by(
        ApprovalRequest.rejected_at.desc()).all()
    
    stats = {
        'pending_ca': ApprovalRequest.query.filter_by(submission_type='ca', status='pending_exam').count(),
        'pending_exam': ApprovalRequest.query.filter_by(submission_type='exam', status='pending_exam').count(),
        'pending_references': ApprovalRequest.query.filter_by(submission_type='reference', status='pending_exam').count(),
        'approved_ca': ApprovalRequest.query.filter_by(submission_type='ca', status='finalized').count(),
        'approved_exam': ApprovalRequest.query.filter_by(submission_type='exam', status='finalized').count(),
        'approved_references': ApprovalRequest.query.filter_by(submission_type='reference', status='finalized').count(),
        'rejected': len(rejected_approvals)
    }
    
    return render_template('admin_grade_approvals.html',
        ca_approvals=ca_approvals, exam_approvals=exam_approvals,
        reference_approvals=reference_approvals, rejected_approvals=rejected_approvals,
        stats=stats, full_name=admin.full_name, role=admin.role)


# ==================== REFERENCE MANAGEMENT ====================

@admin_bp.route('/reference-management')
def reference_management():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    student_id_search = request.args.get('student_id')
    student_info = None
    references = []
    
    if student_id_search:
        enrollments = CourseStudent.query.filter_by(student_id=student_id_search).all()
        if enrollments:
            first = enrollments[0]
            student_info = {
                'id': student_id_search,
                'name': first.student_name,
                'program': first.program_type
            }
            for e in enrollments:
                ref = ReferenceGrade.query.filter_by(student_id=e.id).first()
                if ref:
                    references.append({
                        'course_code': e.course.course_code,
                        'course_name': e.course.course_name,
                        'original_grade': ref.original_grade,
                        'reference_grade': ref.reference_grade,
                        'display_grade': ref.display_grade,
                        'reference_status': ref.reference_status,
                        'id': ref.id
                    })
    
    return render_template('admin_reference_management.html',
        full_name=admin.full_name, role=admin.role,
        student_info=student_info, references=references,
        student_id_search=student_id_search)


# ==================== API ROUTES ====================

@admin_bp.route('/api/departments/<int:faculty_id>')
def get_departments(faculty_id):
    departments = Department.query.filter_by(faculty_id=faculty_id).all()
    return jsonify({'departments': [{'id': d.id, 'name': d.name} for d in departments]})


# ==================== GPA CALCULATOR ====================

@admin_bp.route('/gpa-calculator', methods=['GET', 'POST'])
def gpa_calculator():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    
    ref_id = request.args.get('ref_id')
    prefill_data = None
    
    if ref_id:
        reference = ReferenceGrade.query.get(ref_id)
        if reference:
            prefill_data = {
                'student_id': reference.student.student_id,
                'ref_id': ref_id
            }
    
    return render_template('gpa_calculator.html',
        full_name=admin.full_name, role=admin.role, prefill=prefill_data)

@admin_bp.route('/api/student-grades', methods=['POST'])
def api_student_grades():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    student_id = data.get('student_id')
    academic_year = data.get('academic_year')
    level = data.get('level')
    semester = data.get('semester')
    
    if not all([student_id, academic_year, level, semester]):
        return jsonify({'error': 'Missing fields'}), 400
    
    level_to_year = {"Level 100": "Year 1", "Level 200": "Year 2", "Level 300": "Year 3", "Level 400": "Year 4"}
    year_format = level_to_year.get(level, level)
    full_semester = f"{year_format} - {semester}"
    
    student = CourseStudent.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    enrollments = CourseStudent.query.filter_by(student_id=student_id).join(Course).filter(
        Course.academic_year == academic_year,
        Course.semester == full_semester
    ).all()
    
    current_grades = []
    has_pending_ref = False
    pending_ref_courses = []
    has_double_fail = False
    double_fail_courses = []
    
    for e in enrollments:
        # Check for reference records
        pending_ref = ReferenceGrade.query.filter_by(
            student_id=e.id,
            reference_status='pending'
        ).first()
        
        double_ref = ReferenceGrade.query.filter_by(
            student_id=e.id,
            reference_status='double_fail'
        ).first()
        
        cleared_ref = ReferenceGrade.query.filter_by(
            student_id=e.id,
            reference_status='cleared'
        ).first()
        
        if pending_ref:
            has_pending_ref = True
            pending_ref_courses.append(e.course.course_code)
        
        if double_ref:
            has_double_fail = True
            double_fail_courses.append(e.course.course_code)
        
        # Determine display grade and effective grade points
        display_grade = None
        final_grade = e.grade
        grade_points = e.grade_points or 0
        effective_credits = e.course.credit_hours
        
        if double_ref:
            # Double fail - show the display grade like "E/E"
            final_grade = 'DOUBLE_FAIL'
            grade_points = 0
            display_grade = double_ref.display_grade  # e.g., "E/E"
            
        elif cleared_ref:
            # Reference cleared - show new/old like "A/E"
            final_grade = cleared_ref.reference_grade  # The new grade (A, B, C, D)
            display_grade = cleared_ref.display_grade  # e.g., "A/E"
            # Use the NEW reference grade points for calculation
            grade_map = {'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0}
            grade_points = grade_map.get(cleared_ref.reference_grade, 0.0)
            # Double credit hours penalty
            effective_credits = e.course.credit_hours * 2
            
        elif pending_ref:
            # Pending reference - cannot calculate
            final_grade = 'PENDING_REF'
            grade_points = 0
            display_grade = None
        
        current_grades.append({
            'course_code': e.course.course_code,
            'course_name': e.course.course_name,
            'credit_hours': e.course.credit_hours,
            'effective_credit_hours': effective_credits,
            'score': e.total_score,
            'grade': final_grade,
            'grade_points': grade_points,
            'has_pending_reference': bool(pending_ref),
            'has_double_fail': bool(double_ref),
            'has_cleared_reference': bool(cleared_ref),
            'display_grade': display_grade
        })
    
    # Get previous semester GPAs
    previous_gpas = StudentGPA.query.filter_by(
        student_id=student_id,
        level=level,
        academic_year=academic_year
    ).filter(StudentGPA.semester != semester).all()
    
    previous_semesters = [{
        'level': g.level,
        'semester': g.semester,
        'academic_year': g.academic_year,
        'gpa': g.gpa
    } for g in previous_gpas]
    
    return jsonify({
        'student_name': student.student_name,
        'current_grades': current_grades,
        'has_pending_references': has_pending_ref,
        'pending_reference_courses': pending_ref_courses,
        'has_double_fail': has_double_fail,
        'double_fail_courses': double_fail_courses,
        'previous_semesters': previous_semesters
    })

@admin_bp.route('/api/calculate-student-gpa', methods=['POST'])
def api_calculate_student_gpa():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    student_id = data.get('student_id')
    student_name = data.get('student_name')
    level = data.get('level')
    semester = data.get('semester')
    academic_year = data.get('academic_year')
    grades = data.get('grades', [])
    
    if not all([student_id, student_name, level, semester, academic_year]):
        return jsonify({'error': 'Missing fields'}), 400
    
    total_credits = 0
    total_points = 0
    
    for g in grades:
        credits = g.get('effective_credit_hours', g.get('credit_hours', 0))
        points = g.get('grade_points', 0)
        total_credits += credits
        total_points += credits * points
    
    current_gpa = total_points / total_credits if total_credits else 0
    
    if current_gpa >= 3.0:
        semester_status = 'PASS'
    elif current_gpa >= 2.7:
        semester_status = 'FAIL'
    else:
        semester_status = 'WITHDREW'
    
    existing_gpa = StudentGPA.query.filter_by(
        student_id=student_id, academic_year=academic_year, level=level, semester=semester
    ).first()
    
    if not existing_gpa:
        new_gpa = StudentGPA(
            student_id=student_id, student_name=student_name,
            level=level, semester=semester, academic_year=academic_year,
            total_credit_hours=total_credits, total_grade_points=total_points,
            gpa=current_gpa, student_status=semester_status,
            calculated_by_id=session['user_id']
        )
        db.session.add(new_gpa)
    else:
        existing_gpa.gpa = current_gpa
        existing_gpa.total_credit_hours = total_credits
        existing_gpa.total_grade_points = total_points
        existing_gpa.student_status = semester_status
        existing_gpa.calculated_by_id = session['user_id']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'gpa': current_gpa,
        'status': semester_status,
        'message': 'GPA saved successfully'
    })


# ==================== TRANSCRIPT ====================

@admin_bp.route('/transcript')
def transcript():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    student_id = request.args.get('student_id')
    student_data = None
    student_name = None
    
    if student_id:
        student_data = get_student_gpa_history(student_id)
        student_name = get_student_name(student_id)
    
    departments = Department.query.all()
    return render_template('transcript.html',
        full_name=admin.full_name, role=admin.role,
        student_data=student_data, student_name=student_name,
        departments=departments, selected_student_id=student_id)


def get_student_gpa_history(student_id):
    records = StudentGPA.query.filter_by(student_id=student_id).order_by(
        StudentGPA.academic_year, StudentGPA.semester).all()
    if not records: return None
    
    level_to_year = {"Level 100": "Year 1", "Level 200": "Year 2", "Level 300": "Year 3", "Level 400": "Year 4"}
    
    history = []
    for rec in records:
        year_format = level_to_year.get(rec.level, rec.level)
        full_semester = f"{year_format} - {rec.semester}"
        
        enrollments = CourseStudent.query.filter_by(student_id=student_id).join(Course).filter(
            Course.academic_year == rec.academic_year, Course.semester == full_semester
        ).all()
        
        courses = []
        for e in enrollments:
            ref = ReferenceGrade.query.filter_by(student_id=e.id).first()
            courses.append({
                'course_code': e.course.course_code,
                'course_name': e.course.course_name,
                'credit_hours': e.course.credit_hours,
                'grade': e.grade,
                'grade_points': e.grade_points,
                'score': e.total_score,
                'has_reference': ref is not None,
                'reference_display': ref.display_grade if ref and ref.display_grade else None
            })
        
        history.append({
            'academic_year': rec.academic_year,
            'level': rec.level,
            'semester': rec.semester,
            'gpa': rec.gpa,
            'status': rec.student_status,
            'courses': courses
        })
    return history


def get_student_name(student_id):
    cs = CourseStudent.query.filter_by(student_id=student_id).first()
    return cs.student_name if cs else None


# ==================== DEPARTMENT STUDENTS ====================
@admin_bp.route('/department-students')
def department_students():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    dept_id = request.args.get('dept_id', type=int)
    if not dept_id:
        return jsonify({'error': 'Department ID required'}), 400
    
    department = Department.query.get(dept_id)
    if not department:
        return jsonify({'error': 'Department not found'}), 404
    
    # Get filter parameters
    program = request.args.get('program', '').strip()
    level = request.args.get('level', '').strip()
    academic_year = request.args.get('academic_year', '').strip()
    
    # If no academic year specified, use the latest
    if not academic_year:
        academic_year = db.session.query(db.func.max(Course.academic_year)).scalar()
    
    # Get faculty info
    faculty = department.faculty
    
    # Get HOD
    hod = Lecturer.query.filter_by(department_id=dept_id, role='head_of_department').first()
    
    # Get Dean
    dean = None
    if faculty:
        dean = Lecturer.query.filter_by(faculty_id=faculty.id, role='dean').first()
    
    # ===== BUILD STUDENT LIST =====
    students_data = []
    seen_students = set()
    
    # First try: Get students from CourseStudent (course enrollments in this department)
    enrollments = CourseStudent.query.join(Course).filter(
        Course.department_id == dept_id
    )
    
    if academic_year:
        enrollments = enrollments.filter(Course.academic_year == academic_year)
    
    if program:
        enrollments = enrollments.filter(CourseStudent.program_type == program)
    
    if level:
        # Map "Year 1" to "Year 1 - Semester 1", "Year 1 - Semester 2"
        year_num = level.replace('Year ', '')
        enrollments = enrollments.filter(Course.semester.like(f'Year {year_num}%'))
    
    # Get all matching enrollments
    all_enrollments = enrollments.all()
    
    # Group by student_id
    for cs in all_enrollments:
        if cs.student_id in seen_students:
            continue
        seen_students.add(cs.student_id)
        
        # Try to get academic status for this student
        status = None
        if academic_year:
            status = StudentAcademicStatus.query.filter_by(
                student_id=cs.student_id,
                academic_year=academic_year
            ).first()
        
        # Try to get GPA records
        gpa_sem1 = None
        gpa_sem2 = None
        
        if academic_year:
            year_num = level.replace('Year ', '') if level else None
            
            gpa_records = StudentGPA.query.filter_by(
                student_id=cs.student_id,
                academic_year=academic_year
            ).all()
            
            for gpa in gpa_records:
                if 'Semester 1' in gpa.semester:
                    gpa_sem1 = gpa
                elif 'Semester 2' in gpa.semester:
                    gpa_sem2 = gpa
        
        students_data.append({
            'student_id': cs.student_id,
            'student_name': cs.student_name,
            'program': cs.program_type or (status.program_type if status else 'N/A'),
            'semester1_gpa': round(gpa_sem1.gpa, 2) if gpa_sem1 and gpa_sem1.gpa else None,
            'semester1_status': gpa_sem1.student_status if gpa_sem1 else None,
            'semester2_gpa': round(gpa_sem2.gpa, 2) if gpa_sem2 and gpa_sem2.gpa else None,
            'semester2_status': gpa_sem2.student_status if gpa_sem2 else None,
            'final_gpa': round(status.final_gpa, 2) if status and status.final_gpa else None,
            'final_status': status.final_status if status else None,
            'promoted': status.promoted if status else False,
            'repeated': status.repeated if status else False
        })
    
    # Second try: If no students from enrollments, try StudentAcademicStatus directly
    if not students_data:
        status_query = StudentAcademicStatus.query.filter_by(department_id=dept_id)
        
        if academic_year:
            status_query = status_query.filter_by(academic_year=academic_year)
        if program:
            status_query = status_query.filter_by(program_type=program)
        if level:
            level_map = {
                'Year 1': 'Level 100',
                'Year 2': 'Level 200', 
                'Year 3': 'Level 300',
                'Year 4': 'Level 400'
            }
            mapped_level = level_map.get(level, level)
            status_query = status_query.filter_by(level=mapped_level)
        
        status_records = status_query.all()
        
        for s in status_records:
            if s.student_id in seen_students:
                continue
            seen_students.add(s.student_id)
            
            students_data.append({
                'student_id': s.student_id,
                'student_name': s.student_name,
                'program': s.program_type or 'N/A',
                'semester1_gpa': round(s.semester1_gpa, 2) if s.semester1_gpa else None,
                'semester1_status': s.semester1_status,
                'semester2_gpa': round(s.semester2_gpa, 2) if s.semester2_gpa else None,
                'semester2_status': s.semester2_status,
                'final_gpa': round(s.final_gpa, 2) if s.final_gpa else None,
                'final_status': s.final_status,
                'promoted': s.promoted,
                'repeated': s.repeated
            })
    
    # Sort by student name
    students_data.sort(key=lambda x: x['student_name'])
    
    return jsonify({
        'department': {
            'id': department.id,
            'name': department.name,
            'faculty': faculty.name if faculty else 'N/A'
        },
        'hod': hod.full_name if hod else 'Not assigned',
        'dean': dean.full_name if dean else 'Not assigned',
        'academic_year': academic_year or 'N/A',
        'total': len(students_data),
        'students': students_data
    })


# ==================== FAILURE HISTORY API ====================

@admin_bp.route('/api/failure-history/<string:student_id>', methods=['GET'])
def api_failure_history(student_id):
    """Get failure and withdrawal history for a student - API endpoint"""
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Get all GPA records with FAIL or WITHDREW status
    records = StudentGPA.query.filter(
        StudentGPA.student_id == student_id,
        StudentGPA.student_status.in_(['FAIL', 'WITHDREW', 'DOUBLE_FAIL'])
    ).order_by(StudentGPA.academic_year.desc(), StudentGPA.semester.desc()).all()
    
    # Also check academic status for withdrawn students
    academic_statuses = StudentAcademicStatus.query.filter_by(
        student_id=student_id, 
        withdrawn=True
    ).order_by(StudentAcademicStatus.academic_year.desc()).all()
    
    # Get student name from any available source
    student_name = None
    program_type = None
    
    # Try CourseStudent first
    enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
    if enrollment:
        student_name = enrollment.student_name
        program_type = enrollment.program_type
    
    # Try StudentGPA
    if not student_name:
        gpa_record = StudentGPA.query.filter_by(student_id=student_id).first()
        if gpa_record:
            student_name = gpa_record.student_name
    
    # Try StudentAcademicStatus
    if not student_name:
        status = StudentAcademicStatus.query.filter_by(student_id=student_id).first()
        if status:
            student_name = status.student_name
            if not program_type:
                program_type = status.program_type
    
    # Try Student account
    if not student_name:
        student_account = Student.query.filter_by(student_id=student_id).first()
        if student_account:
            student_name = f"Student {student_id}"
    
    # Compile records from GPA table
    records_data = []
    seen_combinations = set()  # To avoid duplicates
    
    for rec in records:
        key = f"{rec.academic_year}_{rec.level}_{rec.semester}"
        if key not in seen_combinations:
            seen_combinations.add(key)
            records_data.append({
                'id': rec.id,
                'source': 'gpa',
                'academic_year': rec.academic_year,
                'level': rec.level,
                'semester': rec.semester,
                'gpa': round(rec.gpa, 2) if rec.gpa else None,
                'cumulative_gpa': round(rec.cumulative_gpa, 2) if rec.cumulative_gpa else None,
                'status': rec.student_status,
                'total_credit_hours': rec.total_credit_hours,
                'total_grade_points': round(rec.total_grade_points, 2) if rec.total_grade_points else None,
                'has_pending_references': rec.has_pending_references,
                'pending_references_count': rec.pending_references_count,
                'reference_details': rec.reference_details,
                'created_at': rec.created_at.strftime('%Y-%m-%d %H:%M') if rec.created_at else None
            })
    
    # Also include withdrawn records from academic status that might not be in GPA
    for status in academic_statuses:
        key = f"{status.academic_year}_{status.level}_WITHDREW"
        if key not in seen_combinations:
            seen_combinations.add(key)
            records_data.append({
                'id': status.id,
                'source': 'academic_status',
                'academic_year': status.academic_year,
                'level': status.level,
                'semester': 'Full Year',
                'gpa': round(status.final_gpa, 2) if status.final_gpa else None,
                'cumulative_gpa': None,
                'status': 'WITHDREW',
                'total_credit_hours': None,
                'total_grade_points': None,
                'has_pending_references': False,
                'pending_references_count': 0,
                'reference_details': None,
                'created_at': status.created_at.strftime('%Y-%m-%d %H:%M') if status.created_at else None
            })
    
    # Sort by academic year (descending)
    records_data.sort(key=lambda x: x['academic_year'], reverse=True)
    
    # Summary statistics
    total_failures = sum(1 for r in records_data if r['status'] == 'FAIL')
    total_withdrew = sum(1 for r in records_data if r['status'] == 'WITHDREW')
    total_double_fail = sum(1 for r in records_data if r['status'] == 'DOUBLE_FAIL')
    
    return jsonify({
        'student_id': student_id,
        'student_name': student_name or 'Unknown',
        'program_type': program_type,
        'records': records_data,
        'total_records': len(records_data),
        'summary': {
            'total_failures': total_failures,
            'total_withdrew': total_withdrew,
            'total_double_fail': total_double_fail,
            'has_warnings': total_failures > 0 or total_withdrew > 0 or total_double_fail > 0
        }
    })


# ==================== DELETE STUDENT DATA API ====================

@admin_bp.route('/api/delete-student/<string:student_id>', methods=['DELETE', 'POST'])
def api_delete_student_data(student_id):
    """Delete ALL data for a student - API endpoint"""
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        deleted_counts = {}
        
        # Delete ReferenceGrades for this student's enrollments
        enrollments = CourseStudent.query.filter_by(student_id=student_id).all()
        ref_count = 0
        for enrollment in enrollments:
            refs = ReferenceGrade.query.filter_by(student_id=enrollment.id).count()
            ref_count += refs
            ReferenceGrade.query.filter_by(student_id=enrollment.id).delete()
        deleted_counts['reference_grades'] = ref_count
        
        # Delete AssessmentGrades for this student's enrollments
        assessment_count = 0
        for enrollment in enrollments:
            assessments = AssessmentGrade.query.filter_by(student_id=enrollment.id).count()
            assessment_count += assessments
            AssessmentGrade.query.filter_by(student_id=enrollment.id).delete()
        deleted_counts['assessment_grades'] = assessment_count
        
        # Delete CourseStudent enrollments
        enrollment_count = CourseStudent.query.filter_by(student_id=student_id).count()
        CourseStudent.query.filter_by(student_id=student_id).delete()
        deleted_counts['course_enrollments'] = enrollment_count
        
        # Delete GPA records
        gpa_count = StudentGPA.query.filter_by(student_id=student_id).count()
        StudentGPA.query.filter_by(student_id=student_id).delete()
        deleted_counts['gpa_records'] = gpa_count
        
        # Delete grade records
        grade_count = StudentGradeRecord.query.filter_by(student_id=student_id).count()
        StudentGradeRecord.query.filter_by(student_id=student_id).delete()
        deleted_counts['grade_records'] = grade_count
        
        # Delete academic status
        status_count = StudentAcademicStatus.query.filter_by(student_id=student_id).count()
        StudentAcademicStatus.query.filter_by(student_id=student_id).delete()
        deleted_counts['academic_status'] = status_count
        
        # Delete student account
        student_account = Student.query.filter_by(student_id=student_id).first()
        if student_account:
            db.session.delete(student_account)
            deleted_counts['student_account'] = 1
        else:
            deleted_counts['student_account'] = 0
        
        db.session.commit()
        
        total_deleted = sum(deleted_counts.values())
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted ALL data for student {student_id}. Total records removed: {total_deleted}',
            'deleted_counts': deleted_counts,
            'total_deleted': total_deleted
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': f'Failed to delete student data: {str(e)}'
        }), 500

@admin_bp.route('/failure-history')
def failure_history():
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return redirect(url_for('admin.login'))
    
    admin = Admin.query.get(session['user_id'])
    student_id = request.args.get('student_id')
    records = []
    student_name = None
    
    if student_id:
        # Get records directly for initial page load / server-side rendering fallback
        records = StudentGPA.query.filter(
            StudentGPA.student_id == student_id,
            StudentGPA.student_status.in_(['FAIL', 'WITHDREW', 'DOUBLE_FAIL'])
        ).order_by(StudentGPA.academic_year.desc(), StudentGPA.semester.desc()).all()
        
        # Get student name
        enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
        if enrollment:
            student_name = enrollment.student_name
        elif records:
            student_name = records[0].student_name
    
    return render_template('failure_history.html',
        full_name=admin.full_name,
        role=admin.role,
        records=records,
        student_name=student_name,
        selected_student_id=student_id)

        
# ==================== BULK DELETE GPA RECORDS ====================

@admin_bp.route('/api/delete-all-gpa', methods=['DELETE', 'POST'])
def api_delete_all_gpa():
    """Delete ALL GPA and grade records - API endpoint"""
    if 'user_id' not in session or session.get('user_type') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        gpa_count = StudentGPA.query.count()
        grade_count = StudentGradeRecord.query.count()
        
        StudentGPA.query.delete()
        StudentGradeRecord.query.delete()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Deleted {gpa_count} GPA records and {grade_count} grade records',
            'gpa_records_deleted': gpa_count,
            'grade_records_deleted': grade_count
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': f'Failed to delete records: {str(e)}'
        }), 500


# ==================== CONTEXT PROCESSOR ====================

@admin_bp.context_processor
def utility_processor():
    return {'now': datetime.now}
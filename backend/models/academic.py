from extensions import db
from datetime import datetime

class Faculty(db.Model):
    __tablename__ = 'faculties'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    departments = db.relationship('Department', backref='faculty', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'departments': [d.to_dict() for d in self.departments] if self.departments else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('faculty_id', 'name', name='unique_department_per_faculty'),)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'faculty_id': self.faculty_id,
        }


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
    # NEW: Assigned lecturer (the one who teaches this course)
    assigned_lecturer_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    assigned_lecturer = db.relationship('Lecturer', foreign_keys=[assigned_lecturer_id])
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.id'), nullable=False)
    faculty = db.relationship('Faculty', foreign_keys=[faculty_id])
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    department = db.relationship('Department', foreign_keys=[department_id])
    course_type = db.Column(db.String(50), nullable=False, default='departmental')
    is_active = db.Column(db.Boolean, default=True)
    program_type = db.Column(db.String(20), nullable=False, default='BSc')  # 'BSc' or 'Diploma'
    # NEW: Course level for filtering
    course_level = db.Column(db.String(20), nullable=True)  # 'Year 1', 'Year 2', 'Year 3', 'Year 4'
    course_semester_num = db.Column(db.Integer, nullable=True)  # 1 or 2
    # NEW: CA and Exam max scores based on program type
    ca_max_score = db.Column(db.Integer, default=40)  # 40 for Degree, 30 for Diploma
    exam_max_score = db.Column(db.Integer, default=60)  # 60 for Degree, 70 for Diploma
    approval_status = db.Column(db.String(30), default='draft')
    is_editable = db.Column(db.Boolean, default=True)
    current_approval_request_id = db.Column(db.Integer, db.ForeignKey('approval_requests.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    students = db.relationship('CourseStudent', backref='course', lazy=True, cascade='all, delete-orphan')
    assessments = db.relationship('ContinuousAssessment', backref='course', lazy=True, cascade='all, delete-orphan')
    reference_grades = db.relationship('ReferenceGrade', backref='course_ref', lazy=True, cascade='all, delete-orphan', foreign_keys='ReferenceGrade.course_id')

    def set_program_weights(self):
        """Set CA/Exam weights based on program type"""
        if self.program_type == 'Diploma':
            self.ca_max_score = 30
            self.exam_max_score = 70
        else:  # BSc or default
            self.ca_max_score = 40
            self.exam_max_score = 60

    def get_grade_boundaries(self):
        """Return grade boundaries based on program type"""
        return [
            {'grade': 'A', 'min': 75, 'max': 100, 'points': 5.0},
            {'grade': 'B', 'min': 65, 'max': 74, 'points': 4.0},
            {'grade': 'C', 'min': 50, 'max': 64, 'points': 3.0},
            {'grade': 'D', 'min': 40, 'max': 49, 'points': 2.0},
            {'grade': 'E', 'min': 30, 'max': 39, 'points': 1.0},
            {'grade': 'F', 'min': 0, 'max': 29, 'points': 0.0},
        ]

    def to_dict(self, include_relations=False):
        data = {
            'id': self.id,
            'course_code': self.course_code,
            'course_name': self.course_name,
            'credit_hours': self.credit_hours,
            'semester': self.semester,
            'academic_year': self.academic_year,
            'created_by_id': self.created_by_id,
            'assigned_lecturer_id': self.assigned_lecturer_id,  # NEW
            'faculty_id': self.faculty_id,
            'department_id': self.department_id,
            'program_type': self.program_type,
            'course_level': self.course_level,  # NEW
            'course_semester_num': self.course_semester_num,  # NEW
            'ca_max_score': self.ca_max_score,  # NEW
            'exam_max_score': self.exam_max_score,  # NEW
            'approval_status': self.approval_status,
            'is_active': self.is_active,
            'is_editable': self.is_editable,
            'course_type': self.course_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_relations:
            data['created_by'] = {
                'id': self.created_by.id,
                'full_name': self.created_by.full_name,
                'lecturer_id': self.created_by.lecturer_id,
                'email': self.created_by.email,
            } if self.created_by else None
            data['assigned_lecturer'] = {  # NEW
                'id': self.assigned_lecturer.id,
                'full_name': self.assigned_lecturer.full_name,
                'lecturer_id': self.assigned_lecturer.lecturer_id,
            } if self.assigned_lecturer else None
            data['faculty'] = {
                'id': self.faculty.id,
                'name': self.faculty.name,
                'code': self.faculty.code,
            } if self.faculty else None
            data['department'] = {
                'id': self.department.id,
                'name': self.department.name,
            } if self.department else None
            data['students'] = []
            if self.students:
                for s in self.students:
                    data['students'].append({
                        'id': s.id,
                        'student_id': s.student_id,
                        'student_name': s.student_name,
                        'test_score': s.test_score,
                        'assignment_score': s.assignment_score,
                        'attendance_score': s.attendance_score,
                        'continuous_assessment': s.continuous_assessment,
                        'exam_score': s.exam_score,
                        'total_score': s.total_score,
                        'grade': s.grade,
                        'grade_points': s.grade_points,
                        'ca_status': s.ca_status,
                        'exam_status': s.exam_status,
                        'has_pending_reference': s.has_pending_reference,
                        'has_cleared_reference': s.has_cleared_reference,
                        'has_double_reference': s.has_double_reference,
                        'program_type': s.program_type,
                        'submission_signature': s.submission_signature,  # NEW
                    })
            data['assessments'] = [{
                'id': a.id,
                'assessment_name': a.assessment_name,
                'assessment_type': a.assessment_type,
                'max_score': a.max_score,
                'weight': a.weight,
            } for a in self.assessments] if self.assessments else []
            data['reference_grades'] = [{
                'id': r.id,
                'student_id': r.student_id,
                'original_grade': r.original_grade,
                'reference_grade': r.reference_grade,
                'display_grade': r.display_grade,
                'reference_status': r.reference_status,
                'approval_status': r.approval_status,
            } for r in self.reference_grades] if self.reference_grades else []
        return data


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
    # Enrollment method tracking
    enrollment_method = db.Column(db.String(20), default='manual')  # 'manual', 'csv', 'api', 'auto'
    test_score = db.Column(db.Float, nullable=True)
    assignment_score = db.Column(db.Float, nullable=True)
    attendance_score = db.Column(db.Float, nullable=True)
    continuous_assessment = db.Column(db.Float, nullable=True)
    exam_score = db.Column(db.Float, nullable=True)
    total_score = db.Column(db.Float, nullable=True)
    grade = db.Column(db.String(2), nullable=True)
    grade_points = db.Column(db.Float, nullable=True)
    ca_approved = db.Column(db.Boolean, default=False)
    ca_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    ca_approved_at = db.Column(db.DateTime, nullable=True)
    ca_approval_signature = db.Column(db.String(100), nullable=True)
    exam_approved = db.Column(db.Boolean, default=False)
    exam_approved_by_id = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=True)
    exam_approved_at = db.Column(db.DateTime, nullable=True)
    exam_approval_signature = db.Column(db.String(100), nullable=True)
    has_pending_reference = db.Column(db.Boolean, default=False)
    has_cleared_reference = db.Column(db.Boolean, default=False)
    has_double_reference = db.Column(db.Boolean, default=False)
    final_status = db.Column(db.String(20), nullable=True)
    program_type = db.Column(db.String(20), nullable=False, default='BSc')
    ca_status = db.Column(db.String(30), default='pending')
    exam_status = db.Column(db.String(30), default='pending')
    # NEW: Submission signature fields
    submission_signature = db.Column(db.String(200), nullable=True)
    submission_signed_at = db.Column(db.DateTime, nullable=True)
    reference_grades = db.relationship('ReferenceGrade', backref='student_ref', lazy=True, cascade='all, delete-orphan', foreign_keys='ReferenceGrade.student_id')
    __table_args__ = (db.UniqueConstraint('course_id', 'student_id', name='unique_course_student'),)

    def to_dict(self):
        return {
            'id': self.id,
            'course_id': self.course_id,
            'student_id': self.student_id,
            'student_name': self.student_name,
            'test_score': self.test_score,
            'assignment_score': self.assignment_score,
            'attendance_score': self.attendance_score,
            'continuous_assessment': self.continuous_assessment,
            'exam_score': self.exam_score,
            'total_score': self.total_score,
            'grade': self.grade,
            'grade_points': self.grade_points,
            'ca_status': self.ca_status,
            'exam_status': self.exam_status,
            'has_pending_reference': self.has_pending_reference,
            'has_cleared_reference': self.has_cleared_reference,
            'has_double_reference': self.has_double_reference,
            'program_type': self.program_type,
            'final_status': self.final_status,
            'enrollment_method': self.enrollment_method,  # NEW
            'submission_signature': self.submission_signature,  # NEW
        }
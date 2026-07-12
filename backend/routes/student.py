from flask import Blueprint, request, jsonify
from extensions import db
from middleware.jwt_required import token_required
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
from flask import current_app
import logging
from services.ai_service import ask_ai, generate_gpa_prediction, generate_dashboard_summary

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

student_bp = Blueprint('student', __name__)

# ==================== JWT HELPERS ====================

def generate_student_token(student_id):
    try:
        payload = {
            'student_id': student_id,
            'user_id': student_id,
            'role': 'student',
            'user_type': 'student',    # ← MUST HAVE THIS
            'username': student_id,
            'full_name': None,
            'email': None,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow()
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        logger.debug(f"Token generated for student: {student_id}")
        return token
    except Exception as e:
        logger.error(f"Token generation error: {str(e)}")
        raise

# ==================== AUTH ====================

@student_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new student
    Expected JSON: {student_id, email, password}
    Returns: {token, student_id, student_name, message}
    """
    try:
        from models.user import Student
        from models.academic import CourseStudent
        
        data = request.get_json() or {}
        
        logger.info(f"Registration attempt - Raw data: {data}")
        
        student_id = data.get('student_id', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        logger.debug(f"Processing registration - ID: '{student_id}', Email: '{email}'")

        # Validation
        if not student_id or not email or not password:
            logger.warning(f"Missing fields - ID: '{student_id}', Email: '{email}', Password present: {bool(password)}")
            return jsonify({
                'message': 'Student ID, email, and password are required.',
                'code': 'MISSING_FIELDS'
            }), 400
        
        if len(password) < 6:
            logger.warning(f"Weak password for student: {student_id}")
            return jsonify({
                'message': 'Password must be at least 6 characters.',
                'code': 'WEAK_PASSWORD'
            }), 400

        # Check existing student ID
        existing = Student.query.filter_by(student_id=student_id).first()
        if existing:
            logger.warning(f"Registration failed - Student ID already exists: {student_id}")
            return jsonify({
                'message': 'This student ID is already registered.',
                'code': 'ALREADY_REGISTERED'
            }), 409

        # Check existing email
        if Student.query.filter_by(email=email).first():
            logger.warning(f"Registration failed - Email already exists: {email}")
            return jsonify({
                'message': 'This email is already used.',
                'code': 'EMAIL_TAKEN'
            }), 409

        # Create new student
        new_student = Student(
            student_id=student_id,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(new_student)
        db.session.commit()
        
        logger.info(f"Student registered successfully: {student_id}")

        # Generate token
        token = generate_student_token(student_id)
        
        # Get student name if enrolled
        student_name = 'Student'
        enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
        if enrollment:
            student_name = enrollment.student_name
            logger.debug(f"Found enrollment for {student_id}: {student_name}")

        response_data = {
            'token': token,
            'student_id': student_id,
            'student_name': student_name,
            'message': 'Registration successful!'
        }
        
        logger.info(f"Registration response: {response_data}")
        return jsonify(response_data), 201

    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({
            'message': 'Registration failed. Please try again.',
            'error': str(e),
            'code': 'REGISTRATION_ERROR'
        }), 500

@student_bp.route('/login', methods=['POST'])
def login():
    """
    Student login
    Expected JSON: {student_id, password}
    Returns: {token, student_id, student_name, message}
    """
    try:
        from models.user import Student
        from models.academic import CourseStudent
        
        data = request.get_json() or {}
        
        logger.info(f"Login attempt - Raw data: {data}")
        
        student_id = data.get('student_id', '').strip()
        password = data.get('password', '')

        logger.debug(f"Processing login - ID: '{student_id}', Password present: {bool(password)}")

        # Validation
        if not student_id or not password:
            logger.warning(f"Missing fields - ID: '{student_id}', Password present: {bool(password)}")
            return jsonify({
                'message': 'Student ID and password are required.',
                'code': 'MISSING_FIELDS'
            }), 400

        # Find student
        student = Student.query.filter_by(student_id=student_id).first()
        
        if student:
            logger.debug(f"Student found: {student_id}")
            logger.debug(f"Password hash exists: {bool(student.password_hash)}")
            password_match = check_password_hash(student.password_hash, password)
            logger.debug(f"Password match: {password_match}")
        else:
            logger.warning(f"No student found with ID: {student_id}")
        
        if not student:
            logger.warning(f"Login failed - Invalid student ID: {student_id}")
            return jsonify({
                'message': 'Invalid credentials.',
                'code': 'INVALID_CREDENTIALS'
            }), 401

        if not check_password_hash(student.password_hash, password):
            logger.warning(f"Login failed - Invalid password for: {student_id}")
            return jsonify({
                'message': 'Invalid credentials.',
                'code': 'INVALID_CREDENTIALS'
            }), 401

        # Update last login
        student.last_login = datetime.utcnow()
        db.session.commit()
        
        logger.info(f"Student logged in successfully: {student_id}")

        # Generate token
        token = generate_student_token(student_id)
        
        # Get student name if enrolled
        student_name = 'Student'
        enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
        if enrollment:
            student_name = enrollment.student_name
            logger.debug(f"Found enrollment for {student_id}: {student_name}")

        response_data = {
            'token': token,
            'student_id': student_id,
            'student_name': student_name,
            'message': 'Login successful!'
        }
        
        logger.info(f"Login response: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({
            'message': 'Login failed. Please try again.',
            'error': str(e),
            'code': 'LOGIN_ERROR'
        }), 500

# ==================== PASSWORD MANAGEMENT ====================

@student_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset student password (for debugging/recovery)
    Expected JSON: {student_id, new_password}
    """
    try:
        from models.user import Student
        
        data = request.get_json() or {}
        student_id = data.get('student_id', '').strip()
        new_password = data.get('new_password', '')
        
        logger.info(f"Password reset attempt for student: {student_id}")
        
        if not student_id or not new_password:
            return jsonify({
                'message': 'Student ID and new password are required.',
                'code': 'MISSING_FIELDS'
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                'message': 'Password must be at least 6 characters.',
                'code': 'WEAK_PASSWORD'
            }), 400
        
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            logger.warning(f"Password reset failed - Student not found: {student_id}")
            return jsonify({
                'message': 'Student not found.',
                'code': 'STUDENT_NOT_FOUND'
            }), 404
        
        # Update password
        student.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        logger.info(f"Password reset successful for student: {student_id}")
        return jsonify({
            'message': 'Password reset successful!',
            'student_id': student_id
        })
        
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({
            'message': 'Password reset failed.',
            'error': str(e),
            'code': 'RESET_ERROR'
        }), 500

# ==================== DASHBOARD ====================

@student_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard():
    """
    Get student dashboard with comprehensive information
    Headers: Authorization: Bearer <token>
    """
    try:
        # Get student_id from request user (set by middleware)
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        if not student_id:
            logger.warning("Dashboard access without student_id")
            return jsonify({'error': 'Unauthorized', 'code': 'UNAUTHORIZED'}), 401
        
        logger.info(f"Dashboard requested for student: {student_id}")
        
        from models.academic import CourseStudent, Course
        from models.gpa import StudentGPA, StudentAcademicStatus
        from models.reference import ReferenceGrade
        
        # Helper to resolve effective grade considering reference status
        def resolve_grade(cs):
            """Resolve effective grade considering reference status"""
            grade_map = {'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0}
            ref = ReferenceGrade.query.filter_by(course_id=cs.course_id, student_id=cs.id).first()
            
            if not ref:
                return cs.grade, cs.grade_points, None, False
            
            if ref.reference_status == 'cleared' and ref.reference_grade:
                return ref.reference_grade, grade_map.get(ref.reference_grade, cs.grade_points), ref.display_grade, True
            elif ref.reference_status == 'double_fail':
                return 'F', 0.0, ref.display_grade, True
            elif ref.reference_status == 'pending':
                return cs.grade, cs.grade_points, ref.display_grade, True
            
            return cs.grade, cs.grade_points, None, True
        
        # Get enrollment info
        enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
        student_name = enrollment.student_name if enrollment else 'Student'
        
        # Get academic status
        academic_status = StudentAcademicStatus.query.filter_by(
            student_id=student_id
        ).order_by(StudentAcademicStatus.academic_year.desc()).first()
        
        # Get GPA info
        latest_gpa = StudentGPA.query.filter_by(
            student_id=student_id
        ).order_by(StudentGPA.academic_year.desc(), StudentGPA.semester.desc()).first()
        
        all_gpas = StudentGPA.query.filter_by(
            student_id=student_id
        ).order_by(StudentGPA.academic_year.asc(), StudentGPA.semester.asc()).all()
        
        # Get references
        pending_refs = ReferenceGrade.query.join(CourseStudent).filter(
            CourseStudent.student_id == student_id,
            ReferenceGrade.reference_status == 'pending'
        ).all()
        
        # Get recent grades
        recent_grades = CourseStudent.query.filter_by(
            student_id=student_id
        ).join(Course).order_by(
            Course.academic_year.desc(), Course.semester.desc()
        ).limit(10).all()
        
        # Get cleared references
        cleared_refs = ReferenceGrade.query.join(CourseStudent).filter(
            CourseStudent.student_id == student_id,
            ReferenceGrade.reference_status == 'cleared'
        ).all()
        
        # Get double fail references
        double_fail_refs = ReferenceGrade.query.join(CourseStudent).filter(
            CourseStudent.student_id == student_id,
            ReferenceGrade.reference_status == 'double_fail'
        ).all()
        
        # Determine overall status
        overall_status = 'active'
        if academic_status:
            if academic_status.withdrawn:
                overall_status = 'withdrawn'
            elif academic_status.final_status == 'FAIL':
                overall_status = 'failed'
        elif not enrollment:
            overall_status = 'inactive'
        
        response_data = {
            'student_name': student_name,
            'student_id': student_id,
            'overall_status': overall_status,
            'is_currently_enrolled': enrollment is not None,
            'latest_gpa': round(latest_gpa.gpa, 2) if latest_gpa and latest_gpa.gpa else None,
            'latest_semester': latest_gpa.semester if latest_gpa else None,
            'latest_level': latest_gpa.level if latest_gpa else None,
            'latest_academic_year': latest_gpa.academic_year if latest_gpa else None,
            'latest_status': latest_gpa.student_status if latest_gpa else None,
            'gpa_history': [{
                'level': g.level,
                'semester': g.semester,
                'academic_year': g.academic_year,
                'gpa': round(g.gpa, 2) if g.gpa else None,
                'credit_hours': g.total_credit_hours,
                'status': g.student_status
            } for g in all_gpas],
            'academic_history': {
                'final_status': academic_status.final_status if academic_status else None,
                'promoted': academic_status.promoted if academic_status else False,
                'withdrawn': academic_status.withdrawn if academic_status else False,
                'final_gpa': round(academic_status.final_gpa, 2) if academic_status and academic_status.final_gpa else None,
                'level': academic_status.level if academic_status else None,
                'academic_year': academic_status.academic_year if academic_status else None
            } if academic_status else None,
            'pending_references': [{
                'id': r.id,
                'course_code': r.course.course_code if r.course else None,
                'course_name': r.course.course_name if r.course else None,
                'original_grade': r.original_grade,
                'reference_grade': r.reference_grade,
                'display_grade': r.display_grade,
                'status': r.reference_status
            } for r in pending_refs],
            'cleared_references': [{
                'id': r.id,
                'course_code': r.course.course_code if r.course else None,
                'display_grade': r.display_grade
            } for r in cleared_refs],
            'double_fail_references': [{
                'id': r.id,
                'course_code': r.course.course_code if r.course else None,
                'display_grade': r.display_grade,
                'message': 'You must repeat this course.'
            } for r in double_fail_refs],
            'recent_grades': [{
                'course_code': g.course.course_code if g.course else None,
                'course_name': g.course.course_name if g.course else None,
                'credit_hours': g.course.credit_hours if g.course else None,
                'grade': resolve_grade(g)[0],
                'original_grade': g.grade,
                'grade_points': round(resolve_grade(g)[1], 1) if resolve_grade(g)[1] is not None else None,
                'score': round(g.total_score, 1) if g.total_score else None,
                'continuous_assessment': round(g.continuous_assessment, 1) if g.continuous_assessment else None,
                'exam_score': round(g.exam_score, 1) if g.exam_score else None,
                'semester': g.course.semester if g.course else None,
                'academic_year': g.course.academic_year if g.course else None,
                'has_reference': resolve_grade(g)[3],
                'display_grade': resolve_grade(g)[2]
            } for g in recent_grades]
        }
        
        logger.info(f"Dashboard response prepared for student: {student_id}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to load dashboard',
            'message': str(e),
            'code': 'DASHBOARD_ERROR'
        }), 500

# ==================== GRADES ====================

@student_bp.route('/grades', methods=['GET'])
@token_required
def get_grades():
    """
    Get student grades with optional filters
    Query params: academic_year, semester, level
    Headers: Authorization: Bearer <token>
    """
    try:
        # Get student_id from request user
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        if not student_id:
            logger.warning("Grades access without student_id")
            return jsonify({'error': 'Unauthorized', 'code': 'UNAUTHORIZED'}), 401
        
        logger.info(f"Grades requested for student: {student_id}")
        
        from models.academic import CourseStudent, Course
        from models.reference import ReferenceGrade
        
        academic_year = request.args.get('academic_year', '').strip()
        semester = request.args.get('semester', '').strip()
        level = request.args.get('level', '').strip()
        
        logger.debug(f"Filters - Year: '{academic_year}', Semester: '{semester}', Level: '{level}'")
        
        query = CourseStudent.query.filter_by(student_id=student_id).join(Course)
        if academic_year:
            query = query.filter(Course.academic_year == academic_year)
        if semester:
            query = query.filter(Course.semester.like(f'%{semester}%'))
        if level:
            query = query.filter(Course.semester.like(f'{level}%'))
        
        results = query.order_by(Course.academic_year.desc(), Course.semester.desc()).all()
        
        grade_points_map = {'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0}
        
        grades = []
        total_credits = 0
        total_weighted_points = 0
        
        for cs in results:
            ref = ReferenceGrade.query.filter_by(course_id=cs.course_id, student_id=cs.id).first()
            
            effective_grade = cs.grade
            effective_points = cs.grade_points
            effective_score = cs.total_score
            effective_credits = cs.course.credit_hours if cs.course else 0
            reference_info = None
            is_pending = False
            is_double = False
            is_cleared = False
            
            if ref:
                if ref.reference_status == 'cleared' and ref.reference_grade:
                    effective_grade = ref.reference_grade
                    effective_points = grade_points_map.get(ref.reference_grade, 0.0)
                    effective_credits = (cs.course.credit_hours if cs.course else 0) * 2
                    is_cleared = True
                elif ref.reference_status == 'double_fail':
                    effective_grade = 'F'
                    effective_points = 0.0
                    is_double = True
                elif ref.reference_status == 'pending':
                    is_pending = True
                
                reference_info = {
                    'id': ref.id,
                    'original_grade': ref.original_grade,
                    'reference_grade': ref.reference_grade,
                    'display_grade': ref.display_grade,
                    'status': ref.reference_status,
                    'is_pending': is_pending,
                    'is_cleared': is_cleared,
                    'is_double_fail': is_double
                }
            
            grades.append({
                'id': cs.id,
                'course_code': cs.course.course_code if cs.course else None,
                'course_name': cs.course.course_name if cs.course else None,
                'credit_hours': cs.course.credit_hours if cs.course else 0,
                'effective_credit_hours': effective_credits,
                'grade': effective_grade,
                'original_grade': cs.grade,
                'grade_points': effective_points,
                'score': effective_score,
                'continuous_assessment': cs.continuous_assessment,
                'exam_score': cs.exam_score,
                'semester': cs.course.semester if cs.course else None,
                'academic_year': cs.course.academic_year if cs.course else None,
                'has_reference': ref is not None,
                'is_reference_pending': is_pending,
                'is_double_fail': is_double,
                'is_cleared': is_cleared,
                'reference': reference_info
            })
            
            if effective_points is not None and not is_pending:
                total_credits += effective_credits
                total_weighted_points += effective_credits * effective_points
        
        cgpa = total_weighted_points / total_credits if total_credits > 0 else None
        
        response_data = {
            'grades': grades,
            'summary': {
                'total_courses': len(grades),
                'total_credits': total_credits,
                'total_grade_points': round(total_weighted_points, 2),
                'cgpa': round(cgpa, 2) if cgpa else None
            }
        }
        
        logger.info(f"Grades response prepared for student: {student_id} - {len(grades)} courses found")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Grades error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to load grades',
            'message': str(e),
            'code': 'GRADES_ERROR'
        }), 500

# ==================== REFERENCES ====================

@student_bp.route('/references', methods=['GET'])
@token_required
def get_references():
    """
    Get all references for a student
    Headers: Authorization: Bearer <token>
    """
    try:
        # Get student_id from request user
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        if not student_id:
            logger.warning("References access without student_id")
            return jsonify({'error': 'Unauthorized', 'code': 'UNAUTHORIZED'}), 401
        
        logger.info(f"References requested for student: {student_id}")
        
        from models.reference import ReferenceGrade
        from models.academic import CourseStudent
        
        refs = ReferenceGrade.query.join(CourseStudent).filter(
            CourseStudent.student_id == student_id
        ).order_by(ReferenceGrade.created_at.desc()).all()
        
        pending, cleared, double_fail = [], [], []
        for ref in refs:
            data = {
                'id': ref.id,
                'course_code': ref.course.course_code if ref.course else None,
                'course_name': ref.course.course_name if ref.course else None,
                'original_grade': ref.original_grade,
                'reference_grade': ref.reference_grade,
                'display_grade': ref.display_grade,
                'status': ref.reference_status,
                'semester': ref.course.semester if ref.course else None,
                'academic_year': ref.course.academic_year if ref.course else None,
                'created_at': ref.created_at.isoformat() if ref.created_at else None,
            }
            if ref.reference_status == 'pending':
                pending.append(data)
            elif ref.reference_status == 'cleared':
                cleared.append(data)
            elif ref.reference_status == 'double_fail':
                double_fail.append(data)
        
        response_data = {
            'pending': pending,
            'cleared': cleared,
            'double_fail': double_fail,
            'total': len(pending) + len(cleared) + len(double_fail)
        }
        
        logger.info(f"References response prepared for student: {student_id} - Total: {response_data['total']}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"References error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to load references',
            'message': str(e),
            'code': 'REFERENCES_ERROR'
        }), 500

# ==================== PROFILE ====================

@student_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """
    Get student profile information
    Headers: Authorization: Bearer <token>
    """
    try:
        # Get student_id from request user
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        if not student_id:
            logger.warning("Profile access without student_id")
            return jsonify({'error': 'Unauthorized', 'code': 'UNAUTHORIZED'}), 401
        
        logger.info(f"Profile requested for student: {student_id}")
        
        from models.user import Student
        from models.academic import CourseStudent, Course
        from models.gpa import StudentAcademicStatus
        
        student = Student.query.filter_by(student_id=student_id).first()
        enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
        academic_status = StudentAcademicStatus.query.filter_by(
            student_id=student_id
        ).order_by(StudentAcademicStatus.academic_year.desc()).first()
        
        distinct_semesters = db.session.query(
            Course.academic_year, Course.semester
        ).join(CourseStudent).filter(
            CourseStudent.student_id == student_id
        ).distinct().order_by(
            Course.academic_year.desc(), Course.semester.desc()
        ).all()
        
        response_data = {
            'student_id': student_id,
            'email': student.email if student else None,
            'student_name': enrollment.student_name if enrollment else (
                academic_status.student_name if academic_status else 'N/A'
            ),
            'program': enrollment.program_type if enrollment else (
                academic_status.program_type if academic_status else 'N/A'
            ),
            'department': enrollment.student_department.name if enrollment and enrollment.student_department else 'N/A',
            'registered_since': student.created_at.isoformat() if student and student.created_at else None,
            'last_login': student.last_login.isoformat() if student and student.last_login else None,
            'enrollment_history': [{
                'academic_year': s.academic_year,
                'semester': s.semester
            } for s in distinct_semesters]
        }
        
        logger.info(f"Profile response prepared for student: {student_id}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Profile error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to load profile',
            'message': str(e),
            'code': 'PROFILE_ERROR'
        }), 500

# ==================== GPA HISTORY ====================

@student_bp.route('/gpa-history', methods=['GET'])
@token_required
def gpa_history():
    """
    Get student's GPA history
    Headers: Authorization: Bearer <token>
    """
    try:
        # Get student_id from request user
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        if not student_id:
            logger.warning("GPA history access without student_id")
            return jsonify({'error': 'Unauthorized', 'code': 'UNAUTHORIZED'}), 401
        
        logger.info(f"GPA history requested for student: {student_id}")
        
        from models.gpa import StudentGPA
        
        records = StudentGPA.query.filter_by(student_id=student_id).order_by(
            StudentGPA.academic_year.asc(), StudentGPA.semester.asc()
        ).all()
        
        history = [{
            'id': r.id,
            'level': r.level,
            'semester': r.semester,
            'academic_year': r.academic_year,
            'gpa': round(r.gpa, 2) if r.gpa else None,
            'cumulative_gpa': round(r.cumulative_gpa, 2) if r.cumulative_gpa else None,
            'total_credit_hours': r.total_credit_hours,
            'total_grade_points': round(r.total_grade_points, 2) if r.total_grade_points else None,
            'status': r.student_status,
            'has_pending_references': r.has_pending_references,
            'pending_references_count': r.pending_references_count,
            'calculated_at': r.created_at.isoformat() if r.created_at else None
        } for r in records]
        
        total_points = sum((r.total_credit_hours or 0) * (r.gpa or 0) for r in records)
        total_credits = sum(r.total_credit_hours or 0 for r in records)
        overall_cgpa = total_points / total_credits if total_credits > 0 else None
        
        response_data = {
            'gpa_records': history,
            'summary': {
                'total_semesters': len(history),
                'overall_cgpa': round(overall_cgpa, 2) if overall_cgpa else None,
                'total_credits_completed': total_credits
            }
        }
        
        logger.info(f"GPA history response prepared for student: {student_id} - {len(history)} records")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"GPA history error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to load GPA history',
            'message': str(e),
            'code': 'GPA_HISTORY_ERROR'
        }), 500

# ==================== MY INFO ====================

@student_bp.route('/my-info', methods=['GET'])
@token_required
def my_info():
    """
    Get comprehensive student information
    Headers: Authorization: Bearer <token>
    """
    try:
        # Get student_id from request user
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        if not student_id:
            logger.warning("My-info access without student_id")
            return jsonify({'error': 'Unauthorized', 'code': 'UNAUTHORIZED'}), 401
        
        logger.info(f"My-info requested for student: {student_id}")
        
        from models.academic import CourseStudent, Department
        from models.user import Lecturer
        from models.gpa import StudentGPA, StudentAcademicStatus
        from models.reference import ReferenceGrade
        
        result = {
            'student_id': student_id,
            'student_name': 'Student',
            'program': None,
            'department': None,
            'department_id': None,
            'faculty': None,
            'faculty_id': None,
            'hod': None,
            'hod_email': None,
            'hod_phone': None,
            'dean': None,
            'dean_email': None,
            'dean_phone': None,
            'level': None,
            'semester': None,
            'academic_year': None,
            'gpa': None,
            'gpa_status': None,
            'total_courses': 0,
            'pending_references': 0,
            'cleared_references': 0,
            'double_fails': 0,
            'promoted': None,
            'withdrawn': False,
        }
        
        # Get enrollments
        enrollments = CourseStudent.query.filter_by(student_id=student_id).all()
        result['total_courses'] = len(enrollments)
        
        if enrollments:
            first = enrollments[0]
            result['student_name'] = first.student_name or 'Student'
            result['program'] = first.program_type
            
            # Get department from courses
            for cs in enrollments:
                if cs.course and cs.course.department_id:
                    result['department_id'] = cs.course.department_id
                    break
            if not result['department_id']:
                for cs in enrollments:
                    if cs.student_department_id:
                        result['department_id'] = cs.student_department_id
                        break
        
        # Get academic status
        status = StudentAcademicStatus.query.filter_by(student_id=student_id).order_by(
            StudentAcademicStatus.academic_year.desc()
        ).first()
        if status:
            result['level'] = status.level
            result['academic_year'] = status.academic_year
            result['promoted'] = status.promoted
            result['withdrawn'] = status.withdrawn
            result['program'] = result['program'] or status.program_type
            if not result['department_id'] and status.department_id:
                result['department_id'] = status.department_id
        
        # Get GPA record
        gpa_record = StudentGPA.query.filter_by(student_id=student_id).order_by(
            StudentGPA.academic_year.desc(), StudentGPA.semester.desc()
        ).first()
        if gpa_record:
            result['gpa'] = round(gpa_record.gpa, 2) if gpa_record.gpa else None
            result['gpa_status'] = gpa_record.student_status
            result['level'] = result['level'] or gpa_record.level
            result['semester'] = gpa_record.semester
            result['academic_year'] = result['academic_year'] or gpa_record.academic_year
        
        # Get department and faculty info
        if result['department_id']:
            department = Department.query.get(result['department_id'])
            if department:
                result['department'] = department.name
                if department.faculty:
                    result['faculty'] = department.faculty.name
                    result['faculty_id'] = department.faculty.id
                
                # Get HOD
                hod = Lecturer.query.filter_by(
                    department_id=result['department_id'],
                    role='head_of_department'
                ).first()
                if hod:
                    result['hod'] = hod.full_name
                    result['hod_email'] = hod.email
                    result['hod_phone'] = hod.phone
                
                # Get Dean
                if result['faculty_id']:
                    dean = Lecturer.query.filter_by(
                        faculty_id=result['faculty_id'],
                        role='dean'
                    ).first()
                    if dean:
                        result['dean'] = dean.full_name
                        result['dean_email'] = dean.email
                        result['dean_phone'] = dean.phone
        
        # Count references
        for cs in enrollments:
            ref = ReferenceGrade.query.filter_by(
                course_id=cs.course_id,
                student_id=cs.id
            ).first()
            if ref:
                if ref.reference_status == 'pending':
                    result['pending_references'] += 1
                elif ref.reference_status == 'cleared':
                    result['cleared_references'] += 1
                elif ref.reference_status == 'double_fail':
                    result['double_fails'] += 1
        
        logger.info(f"My-info response prepared for student: {student_id}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"My-info error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Failed to load student information',
            'message': str(e),
            'code': 'MY_INFO_ERROR'
        }), 500

# ==================== DEBUG ENDPOINTS ====================

@student_bp.route('/debug/students', methods=['GET'])
def debug_students():
    """
    Debug endpoint to list all registered students
    """
    try:
        from models.user import Student
        students = Student.query.all()
        
        student_list = [{
            'id': s.id,
            'student_id': s.student_id,
            'email': s.email,
            'created_at': s.created_at.isoformat() if s.created_at else None,
            'last_login': s.last_login.isoformat() if s.last_login else None
        } for s in students]
        
        return jsonify({
            'total_students': len(student_list),
            'students': student_list
        })
        
    except Exception as e:
        logger.error(f"Debug students error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@student_bp.route('/debug/test-login', methods=['POST'])
def debug_test_login():
    """
    Debug endpoint to test login with detailed response
    """
    try:
        from models.user import Student
        
        data = request.get_json() or {}
        student_id = data.get('student_id', '').strip()
        password = data.get('password', '')
        
        debug_info = {
            'student_id_provided': student_id,
            'password_length': len(password) if password else 0,
            'student_exists': False,
            'password_match': False,
            'student_data': None
        }
        
        student = Student.query.filter_by(student_id=student_id).first()
        
        if student:
            debug_info['student_exists'] = True
            debug_info['student_data'] = {
                'id': student.id,
                'student_id': student.student_id,
                'email': student.email,
                'has_password_hash': bool(student.password_hash),
                'created_at': student.created_at.isoformat() if student.created_at else None
            }
            
            if password and student.password_hash:
                debug_info['password_match'] = check_password_hash(
                    student.password_hash, password
                )
        
        return jsonify({
            'debug_info': debug_info,
            'message': 'Debug information retrieved'
        })
        
    except Exception as e:
        logger.error(f"Debug test-login error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@student_bp.route('/debug/check-password', methods=['POST'])
def debug_check_password():
    """
    Debug endpoint to test password hashing
    Expected JSON: {password}
    Returns the hash so you can verify
    """
    try:
        data = request.get_json() or {}
        password = data.get('password', '')
        
        if not password:
            return jsonify({'error': 'Password is required'}), 400
        
        # Generate hash
        password_hash = generate_password_hash(password)
        
        # Verify it works
        verification = check_password_hash(password_hash, password)
        
        return jsonify({
            'password': password,
            'hash': password_hash,
            'verification': verification,
            'hash_method': 'werkzeug.security.generate_password_hash'
        })
        
    except Exception as e:
        logger.error(f"Debug password error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@student_bp.route('/debug/student-hash/<student_id>', methods=['GET'])
def debug_student_hash(student_id):
    """
    Debug endpoint to see stored password hash
    WARNING: Remove this in production!
    """
    try:
        from models.user import Student
        
        student = Student.query.filter_by(student_id=student_id).first()
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({
            'student_id': student.student_id,
            'email': student.email,
            'password_hash': student.password_hash,
            'hash_length': len(student.password_hash) if student.password_hash else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# ==================== TRANSCRIPT VERIFICATION ====================

@student_bp.route('/verify-transcript/<string:transcript_id>', methods=['GET'])
def verify_transcript_public(transcript_id):
    """
    Public transcript verification - no auth required
    Any student can verify a transcript by its ID
    """
    try:
        from models.session import TranscriptRecord
        
        transcript = TranscriptRecord.query.filter_by(transcript_id=transcript_id).first()
        
        if not transcript:
            return jsonify({
                'valid': False,
                'message': 'No transcript found with this ID. This transcript is not authentic.',
                'code': 'TRANSCRIPT_NOT_FOUND'
            }), 404
        
        if not transcript.is_valid:
            return jsonify({
                'valid': False,
                'message': 'This transcript has been invalidated and is no longer valid.',
                'code': 'TRANSCRIPT_INVALIDATED'
            }), 200
        
        return jsonify({
            'valid': True,
            'message': 'Transcript verified successfully. This is an authentic MMTU transcript.',
            'transcript': transcript.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Verify transcript error: {str(e)}")
        return jsonify({
            'valid': False,
            'message': 'Verification failed. Please try again.',
            'code': 'VERIFY_ERROR'
        }), 500   


@student_bp.route('/debug/decode-token', methods=['POST'])
def debug_decode_token():
    """
    Debug endpoint to decode a JWT token
    Expected JSON: {token}
    """
    try:
        data = request.get_json() or {}
        token = data.get('token', '')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        
        # Remove 'Bearer ' if present
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
        
        try:
            decoded = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'], 
                algorithms=['HS256']
            )
            return jsonify({
                'valid': True,
                'payload': decoded,
                'expires': datetime.fromtimestamp(decoded['exp']).isoformat() if 'exp' in decoded else None
            })
        except jwt.ExpiredSignatureError:
            return jsonify({'valid': False, 'error': 'Token has expired'})
        except jwt.InvalidTokenError as e:
            return jsonify({'valid': False, 'error': str(e)})
        
    except Exception as e:
        logger.error(f"Debug decode-token error: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500
    

@student_bp.route('/ai-assistant', methods=['POST'])
@token_required
def ai_assistant():
    """AI Academic Assistant for students"""
    try:
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        data = request.get_json() or {}
        question = data.get('question', '')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Get student data for context
        student_data = None
        if student_id:
            try:
                response = student_bp.view_functions['dashboard']()
                student_data = response[0].json if isinstance(response, tuple) else response.json
            except:
                pass
        
        answer = ask_ai(question, student_data)
        return jsonify({'answer': answer})
        
    except Exception as e:
        logger.error(f"AI Assistant error: {str(e)}")
        return jsonify({'error': 'Failed to process question'}), 500


@student_bp.route('/gpa-prediction', methods=['GET'])
@token_required
def gpa_prediction():
    """Get AI-powered GPA prediction"""
    try:
        student_id = None
        if hasattr(request, 'user') and request.user:
            student_id = request.user.get('student_id') or request.user.get('user_id')
        
        student_data = {}
        if student_id:
            try:
                # Get dashboard data
                from models.academic import CourseStudent
                from models.gpa import StudentGPA
                from models.reference import ReferenceGrade
                
                enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
                gpa = StudentGPA.query.filter_by(student_id=student_id).order_by(
                    StudentGPA.academic_year.desc(), StudentGPA.semester.desc()
                ).first()
                
                pending_refs = ReferenceGrade.query.join(CourseStudent).filter(
                    CourseStudent.student_id == student_id,
                    ReferenceGrade.reference_status == 'pending'
                ).count()
                
                double_fails = ReferenceGrade.query.join(CourseStudent).filter(
                    CourseStudent.student_id == student_id,
                    ReferenceGrade.reference_status == 'double_fail'
                ).count()
                
                student_data = {
                    'student_name': enrollment.student_name if enrollment else 'Student',
                    'student_id': student_id,
                    'latest_gpa': round(gpa.gpa, 2) if gpa and gpa.gpa else None,
                    'overall_status': 'active' if enrollment else 'inactive',
                    'latest_level': gpa.level if gpa else None,
                    'pending_references_count': pending_refs,
                    'double_fail_count': double_fails,
                }
            except Exception as e:
                pass
        
        prediction = generate_gpa_prediction(student_data)
        return jsonify(prediction)
        
    except Exception as e:
        logger.error(f"GPA Prediction error: {str(e)}")
        return jsonify({'error': 'Failed to generate prediction'}), 500
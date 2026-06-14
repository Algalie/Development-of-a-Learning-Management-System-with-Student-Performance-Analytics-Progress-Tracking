from flask import Blueprint, request, jsonify
from admin import db, Student, CourseStudent, Course, StudentGPA, ReferenceGrade
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from flask import current_app
from functools import wraps

student_bp = Blueprint('student', __name__)


# ==================== JWT TOKEN HELPERS ====================

def generate_token(student_id):
    """Generate JWT token for student authentication"""
    payload = {
        'student_id': student_id,
        'exp': datetime.utcnow() + timedelta(days=30),  # Token valid for 30 days
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def token_required(f):
    """Decorator to require valid JWT token for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({
                'message': 'Token is missing! Please login.',
                'code': 'TOKEN_MISSING'
            }), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_student = Student.query.filter_by(student_id=data['student_id']).first()
            
            if not current_student:
                return jsonify({
                    'message': 'Student account not found. Please register again.',
                    'code': 'ACCOUNT_NOT_FOUND'
                }), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({
                'message': 'Token has expired. Please login again.',
                'code': 'TOKEN_EXPIRED'
            }), 401
            
        except jwt.InvalidTokenError:
            return jsonify({
                'message': 'Token is invalid! Please login again.',
                'code': 'TOKEN_INVALID'
            }), 401
        
        return f(current_student, *args, **kwargs)
    
    return decorated


@student_bp.route('/register', methods=['POST'])
def register():
    """Register a new student account"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided.', 'code': 'NO_DATA'}), 400
    
    student_id = data.get('student_id', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    # ===== VALIDATION =====
    if not student_id or not email or not password:
        return jsonify({
            'message': 'Student ID, email, and password are required.',
            'code': 'MISSING_FIELDS'
        }), 400
    
    if len(password) < 6:
        return jsonify({
            'message': 'Password must be at least 6 characters.',
            'code': 'WEAK_PASSWORD'
        }), 400

    # ===== CHECK IF ALREADY REGISTERED =====
    existing_account = Student.query.filter_by(student_id=student_id).first()
    if existing_account:
        return jsonify({
            'message': 'This student ID is already registered. Please login instead.',
            'code': 'ALREADY_REGISTERED',
            'already_registered': True
        }), 409

    # Check email uniqueness
    if Student.query.filter_by(email=email).first():
        return jsonify({
            'message': 'This email address is already used by another account.',
            'code': 'EMAIL_TAKEN'
        }), 409

    # ===== CHECK IF STUDENT EXISTS IN SYSTEM =====
    enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
    gpa_record = StudentGPA.query.filter_by(student_id=student_id).first()
    
    from admin import StudentAcademicStatus, StudentGradeRecord
    academic_status = StudentAcademicStatus.query.filter_by(student_id=student_id).first()
    grade_record = StudentGradeRecord.query.filter_by(student_id=student_id).first()
    
    # ===== ALLOW REGISTRATION =====
    # Create the account even if student doesn't exist in other tables
    # This allows new students to register via the app
    new_student = Student(
        student_id=student_id,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(new_student)
    db.session.commit()

    token = generate_token(student_id)
    
    # Determine student name and status
    student_name = 'Student'
    student_status = 'active'
    status_message = 'Registration successful! Welcome to the MMTU Academic Portal.'
    
    if enrollment:
        student_name = enrollment.student_name
    elif academic_status:
        student_name = academic_status.student_name
    
    if academic_status and academic_status.withdrawn:
        student_status = 'withdrawn'
        status_message = 'Registration successful. Note: Your academic status shows as WITHDRAWN. Contact administration.'
    elif not enrollment and not gpa_record:
        student_status = 'new'
        status_message = 'Registration successful! You are not yet enrolled in any courses. Contact administration for enrollment.'

    return jsonify({
        'token': token,
        'student_id': student_id,
        'student_name': student_name,
        'student_status': student_status,
        'message': status_message
    }), 201

@student_bp.route('/login', methods=['POST'])
def login():
    """Login with student ID and password"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided.', 'code': 'NO_DATA'}), 400
    
    student_id = data.get('student_id', '').strip()
    password = data.get('password', '')

    if not student_id or not password:
        return jsonify({
            'message': 'Student ID and password are required.',
            'code': 'MISSING_FIELDS'
        }), 400

    # Find student
    student = Student.query.filter_by(student_id=student_id).first()
    
    if not student:
        return jsonify({
            'message': 'Invalid student ID or password. If you have not registered, please register first.',
            'code': 'INVALID_CREDENTIALS'
        }), 401

    if not check_password_hash(student.password_hash, password):
        return jsonify({
            'message': 'Invalid student ID or password.',
            'code': 'INVALID_CREDENTIALS'
        }), 401

    # Update last login
    student.last_login = datetime.utcnow()
    db.session.commit()

    # Generate token
    token = generate_token(student_id)
    
    # Get student name
    enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
    student_name = enrollment.student_name if enrollment else 'Student'

    return jsonify({
        'token': token,
        'student_id': student_id,
        'student_name': student_name,
        'message': 'Login successful! Welcome back.'
    })


# ==================== DASHBOARD ====================

@student_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard(current_student):
    """
    Get complete student dashboard data.
    Includes: status, GPA, references, academic history, alerts
    """
    student_id = current_student.student_id
    
    # Get student info
    enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
    student_name = enrollment.student_name if enrollment else 'Student'
    
    from admin import StudentAcademicStatus
    
    # Check enrollment status
    is_currently_enrolled = enrollment is not None
    
    # Get latest academic status
    academic_status = StudentAcademicStatus.query.filter_by(
        student_id=student_id
    ).order_by(StudentAcademicStatus.academic_year.desc()).first()
    
    # Determine overall status
    overall_status = 'active'
    if academic_status:
        if academic_status.withdrawn:
            overall_status = 'withdrawn'
        elif academic_status.final_status == 'FAIL':
            overall_status = 'failed'
        elif not is_currently_enrolled:
            overall_status = 'inactive'
    elif not is_currently_enrolled:
        overall_status = 'inactive'
    
    # Status message mapping
    status_messages = {
        'active': 'You are currently enrolled and active.',
        'withdrawn': 'Your academic status shows as WITHDRAWN. Contact administration for guidance.',
        'failed': 'You did not meet academic requirements. You may need to repeat courses.',
        'inactive': 'You are not currently enrolled in any courses. Contact administration for enrollment.'
    }
    
    # Get latest GPA
    latest_gpa = StudentGPA.query.filter_by(student_id=student_id).order_by(
        StudentGPA.academic_year.desc(), StudentGPA.semester.desc()
    ).first()
    
    # Get all GPA records for history
    all_gpas = StudentGPA.query.filter_by(student_id=student_id).order_by(
        StudentGPA.academic_year.asc(), StudentGPA.semester.asc()
    ).all()
    
    # Get pending references
    pending_refs = ReferenceGrade.query.join(Course).join(CourseStudent).filter(
        CourseStudent.student_id == student_id,
        ReferenceGrade.reference_status == 'pending'
    ).all()
    
    # Get recent grades (last 10 courses)
    recent_grades = CourseStudent.query.filter_by(student_id=student_id).join(Course).order_by(
        Course.academic_year.desc(), Course.semester.desc()
    ).limit(10).all()
    
    # Get cleared references
    cleared_refs = ReferenceGrade.query.join(Course).join(CourseStudent).filter(
        CourseStudent.student_id == student_id,
        ReferenceGrade.reference_status == 'cleared'
    ).all()
    
    # Get double fail references
    double_fail_refs = ReferenceGrade.query.join(Course).join(CourseStudent).filter(
        CourseStudent.student_id == student_id,
        ReferenceGrade.reference_status == 'double_fail'
    ).all()
    
    # Build dashboard data
    dashboard_data = {
        # Basic info
        'student_name': student_name,
        'student_id': student_id,
        'email': current_student.email,
        'registered_since': current_student.created_at.isoformat() if current_student.created_at else None,
        'last_login': current_student.last_login.isoformat() if current_student.last_login else None,
        
        # Status
        'overall_status': overall_status,
        'status_message': status_messages.get(overall_status, ''),
        'is_currently_enrolled': is_currently_enrolled,
        
        # Latest GPA
        'latest_gpa': round(latest_gpa.gpa, 2) if latest_gpa and latest_gpa.gpa else None,
        'latest_semester': latest_gpa.semester if latest_gpa else None,
        'latest_level': latest_gpa.level if latest_gpa else None,
        'latest_academic_year': latest_gpa.academic_year if latest_gpa else None,
        'latest_status': latest_gpa.student_status if latest_gpa else None,
        
        # GPA History
        'gpa_history': [
            {
                'level': g.level,
                'semester': g.semester,
                'academic_year': g.academic_year,
                'gpa': round(g.gpa, 2) if g.gpa else None,
                'cumulative_gpa': round(g.cumulative_gpa, 2) if g.cumulative_gpa else None,
                'credit_hours': g.total_credit_hours,
                'grade_points': round(g.total_grade_points, 2) if g.total_grade_points else None,
                'status': g.student_status
            } for g in all_gpas
        ],
        
        # Academic Status
        'academic_history': {
            'final_status': academic_status.final_status if academic_status else None,
            'promoted': academic_status.promoted if academic_status else False,
            'withdrawn': academic_status.withdrawn if academic_status else False,
            'repeated': academic_status.repeated if academic_status else False,
            'final_gpa': round(academic_status.final_gpa, 2) if academic_status and academic_status.final_gpa else None,
            'semester1_gpa': round(academic_status.semester1_gpa, 2) if academic_status and academic_status.semester1_gpa else None,
            'semester2_gpa': round(academic_status.semester2_gpa, 2) if academic_status and academic_status.semester2_gpa else None,
            'level': academic_status.level if academic_status else None,
            'academic_year': academic_status.academic_year if academic_status else None
        } if academic_status else None,
        
        # References
        'pending_references': [
            {
                'id': r.id,
                'course_code': r.course.course_code,
                'course_name': r.course.course_name,
                'original_grade': r.original_grade,
                'reference_grade': r.reference_grade,
                'display_grade': r.display_grade,
                'status': r.reference_status,
                'semester': r.course.semester,
                'academic_year': r.course.academic_year
            } for r in pending_refs
        ],
        
        'cleared_references': [
            {
                'id': r.id,
                'course_code': r.course.course_code,
                'course_name': r.course.course_name,
                'display_grade': r.display_grade,
                'semester': r.course.semester
            } for r in cleared_refs
        ],
        
        'double_fail_references': [
            {
                'id': r.id,
                'course_code': r.course.course_code,
                'course_name': r.course.course_name,
                'display_grade': r.display_grade,
                'semester': r.course.semester,
                'message': 'You must repeat this course.'
            } for r in double_fail_refs
        ],
        
        # Recent Grades
        'recent_grades': [
            {
                'course_code': g.course.course_code,
                'course_name': g.course.course_name,
                'credit_hours': g.course.credit_hours,
                'grade': g.grade,
                'grade_points': round(g.grade_points, 1) if g.grade_points else None,
                'score': round(g.total_score, 1) if g.total_score else None,
                'continuous_assessment': round(g.continuous_assessment, 1) if g.continuous_assessment else None,
                'exam_score': round(g.exam_score, 1) if g.exam_score else None,
                'semester': g.course.semester,
                'academic_year': g.course.academic_year
            } for g in recent_grades
        ]
    }
    
    return jsonify(dashboard_data)


# ==================== GRADES ====================

@student_bp.route('/grades', methods=['GET'])
@token_required
def get_grades(current_student):
    """
    Get filtered grades with reference-aware grade display.
    If a reference is CLEARED, show the NEW grade and points.
    If a reference is DOUBLE_FAIL, show 0 points.
    If a reference is PENDING, show the original grade but mark as pending.
    """
    student_id = current_student.student_id
    
    # Get filter parameters
    academic_year = request.args.get('academic_year', '').strip()
    semester = request.args.get('semester', '').strip()
    level = request.args.get('level', '').strip()
    
    print(f"\n=== GRADES API CALLED ===")
    print(f"Student ID: {student_id}")
    print(f"Filters - Year: '{academic_year}', Level: '{level}', Semester: '{semester}'")
    
    # Build query
    query = CourseStudent.query.filter_by(student_id=student_id).join(Course)
    
    if academic_year:
        query = query.filter(Course.academic_year == academic_year)
    
    if semester:
        query = query.filter(Course.semester.like(f'%{semester}%'))
    
    if level:
        query = query.filter(Course.semester.like(f'{level}%'))
    
    results = query.order_by(Course.academic_year.desc(), Course.semester.desc()).all()
    
    print(f"Found {len(results)} grade records")
    
    # ===== BUILD RESPONSE WITH REFERENCE-AWARE GRADES =====
    grades = []
    total_credits = 0
    total_weighted_points = 0
    
    # Grade points map
    grade_points_map = {'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0}
    
    for cs in results:
        # Check for reference record
        ref = ReferenceGrade.query.filter_by(
            course_id=cs.course_id,
            student_id=cs.id
        ).first()
        
        # ===== DETERMINE EFFECTIVE GRADE =====
        effective_grade = cs.grade           # Default: original grade
        effective_grade_points = cs.grade_points  # Default: original points
        effective_score = cs.total_score     # Default: original score
        effective_credits = cs.course.credit_hours  # Default: original credits
        reference_info = None
        is_reference_pending = False
        is_double_fail = False
        is_cleared = False
        
        if ref:
            if ref.reference_status == 'cleared' and ref.reference_grade:
                # ✅ REFERENCE CLEARED - Use NEW grade
                effective_grade = ref.reference_grade
                effective_grade_points = grade_points_map.get(ref.reference_grade, 0.0)
                effective_score = ref.reference_score if ref.reference_score else cs.total_score
                effective_credits = cs.course.credit_hours * 2  # Double credit penalty
                is_cleared = True
                
                print(f"  ✓ {cs.course.course_code}: Reference CLEARED - {cs.grade}→{ref.reference_grade}, "
                      f"Points: {cs.grade_points}→{effective_grade_points}, "
                      f"Credits: {cs.course.credit_hours}→{effective_credits}")
                
            elif ref.reference_status == 'double_fail' and ref.reference_grade:
                # ❌ DOUBLE FAIL - 0 grade points
                effective_grade = 'F'  # Display as F for GPA purposes
                effective_grade_points = 0.0
                effective_score = ref.reference_score if ref.reference_score else 0
                effective_credits = cs.course.credit_hours
                is_double_fail = True
                
                print(f"  ✗ {cs.course.course_code}: DOUBLE FAIL - {cs.grade}→{ref.reference_grade}, "
                      f"Points: 0.0 (must repeat)")
                
            elif ref.reference_status == 'pending':
                # ⏳ PENDING - Show original but mark as pending
                effective_grade = cs.grade
                effective_grade_points = cs.grade_points
                effective_score = cs.total_score
                effective_credits = cs.course.credit_hours
                is_reference_pending = True
                
                print(f"  ⏳ {cs.course.course_code}: Reference PENDING - {cs.grade}")
            
            # Build reference info
            reference_info = {
                'id': ref.id,
                'original_grade': ref.original_grade,
                'original_score': ref.original_score,
                'reference_grade': ref.reference_grade,
                'reference_score': ref.reference_score,
                'display_grade': ref.display_grade,
                'status': ref.reference_status,
                'approval_status': ref.approval_status,
                'is_pending': is_reference_pending,
                'is_cleared': is_cleared,
                'is_double_fail': is_double_fail
            }
        
        # Build grade data
        grade_data = {
            'id': cs.id,
            'course_code': cs.course.course_code,
            'course_name': cs.course.course_name,
            'credit_hours': cs.course.credit_hours,
            'effective_credit_hours': effective_credits,
            'grade': effective_grade,
            'original_grade': cs.grade,
            'grade_points': effective_grade_points,
            'original_grade_points': cs.grade_points,
            'score': effective_score,
            'original_score': cs.total_score,
            'continuous_assessment': cs.continuous_assessment,
            'exam_score': cs.exam_score,
            'semester': cs.course.semester,
            'academic_year': cs.course.academic_year,
            'ca_status': cs.ca_status,
            'exam_status': cs.exam_status,
            'has_reference': ref is not None,
            'is_reference_pending': is_reference_pending,
            'is_double_fail': is_double_fail,
            'is_cleared': is_cleared,
            'reference': reference_info
        }
        
        grades.append(grade_data)
        
        # Add to CGPA calculation using EFFECTIVE values
        if effective_grade_points is not None and not is_reference_pending:
            total_credits += effective_credits
            total_weighted_points += effective_credits * effective_grade_points
    
    # Calculate CGPA
    cgpa = None
    if total_credits > 0:
        cgpa = total_weighted_points / total_credits
    
    total_courses = len(grades)
    
    print(f"Summary: {total_courses} courses, {total_credits} credits, "
          f"Points: {total_weighted_points}, CGPA: {cgpa}")
    print(f"=== END GRADES API ===\n")
    
    return jsonify({
        'grades': grades,
        'summary': {
            'total_courses': total_courses,
            'total_credits': total_credits,
            'total_grade_points': round(total_weighted_points, 2),
            'cgpa': round(cgpa, 2) if cgpa else None
        }
    })


# ==================== REFERENCES ====================

@student_bp.route('/references', methods=['GET'])
@token_required
def get_references(current_student):
    """Get all reference records for the student"""
    student_id = current_student.student_id
    
    refs = ReferenceGrade.query.join(Course).join(CourseStudent).filter(
        CourseStudent.student_id == student_id
    ).order_by(ReferenceGrade.created_at.desc()).all()
    
    pending = []
    cleared = []
    double_fail = []
    
    for ref in refs:
        ref_data = {
            'id': ref.id,
            'course_code': ref.course.course_code,
            'course_name': ref.course.course_name,
            'original_grade': ref.original_grade,
            'original_score': round(ref.original_score, 1) if ref.original_score else None,
            'reference_grade': ref.reference_grade,
            'reference_score': round(ref.reference_score, 1) if ref.reference_score else None,
            'display_grade': ref.display_grade,
            'status': ref.reference_status,
            'approval_status': ref.approval_status,
            'semester': ref.course.semester,
            'academic_year': ref.course.academic_year,
            'created_at': ref.created_at.isoformat() if ref.created_at else None,
            'updated_at': ref.updated_at.isoformat() if ref.updated_at else None
        }
        
        if ref.reference_status == 'pending':
            pending.append(ref_data)
        elif ref.reference_status == 'cleared':
            cleared.append(ref_data)
        elif ref.reference_status == 'double_fail':
            double_fail.append(ref_data)
    
    return jsonify({
        'pending': pending,
        'cleared': cleared,
        'double_fail': double_fail,
        'total': len(pending) + len(cleared) + len(double_fail)
    })


# ==================== ALERTS ====================

@student_bp.route('/alerts', methods=['GET'])
@token_required
def get_alerts(current_student):
    """Get all active alerts for the student"""
    student_id = current_student.student_id
    alerts = []
    
    # ===== PENDING REFERENCES =====
    pending_refs = ReferenceGrade.query.join(Course).join(CourseStudent).filter(
        CourseStudent.student_id == student_id,
        ReferenceGrade.reference_status == 'pending'
    ).all()
    
    for p in pending_refs:
        alerts.append({
            'id': f'ref_{p.id}',
            'type': 'pending_reference',
            'priority': 'high',
            'title': 'Pending Reference',
            'message': f'You have a pending reference for {p.course.course_code} - {p.course.course_name}. Please contact your lecturer to complete the resit.',
            'course_code': p.course.course_code,
            'course_name': p.course.course_name,
            'semester': p.course.semester,
            'academic_year': p.course.academic_year,
            'original_grade': p.original_grade,
            'created_at': p.created_at.isoformat() if p.created_at else None
        })
    
    # ===== DOUBLE FAILS =====
    double_fails = ReferenceGrade.query.join(Course).join(CourseStudent).filter(
        CourseStudent.student_id == student_id,
        ReferenceGrade.reference_status == 'double_fail'
    ).all()
    
    for d in double_fails:
        alerts.append({
            'id': f'fail_{d.id}',
            'type': 'double_fail',
            'priority': 'critical',
            'title': 'Double Fail - Must Repeat',
            'message': f'You have failed the resit for {d.course.course_code} - {d.course.course_name}. You must repeat this entire course.',
            'course_code': d.course.course_code,
            'course_name': d.course.course_name,
            'semester': d.course.semester,
            'academic_year': d.course.academic_year,
            'display_grade': d.display_grade,
            'created_at': d.created_at.isoformat() if d.created_at else None
        })
    
    # ===== ACADEMIC STATUS ALERTS =====
    from admin import StudentAcademicStatus
    latest_status = StudentAcademicStatus.query.filter_by(
        student_id=student_id
    ).order_by(StudentAcademicStatus.academic_year.desc()).first()
    
    if latest_status:
        if latest_status.withdrawn:
            alerts.append({
                'id': 'status_withdrawn',
                'type': 'withdrawn',
                'priority': 'critical',
                'title': 'Academic Withdrawal',
                'message': f'You have been withdrawn from {latest_status.level} for {latest_status.academic_year}. Please contact administration immediately for guidance on your academic future.',
                'academic_year': latest_status.academic_year,
                'level': latest_status.level,
                'final_gpa': round(latest_status.final_gpa, 2) if latest_status.final_gpa else None
            })
        
        elif latest_status.final_status == 'FAIL' and not latest_status.promoted:
            alerts.append({
                'id': 'status_fail',
                'type': 'academic_failure',
                'priority': 'high',
                'title': 'Academic Failure',
                'message': f'You did not meet the requirements for {latest_status.level} in {latest_status.academic_year}. Your final GPA was {round(latest_status.final_gpa, 2) if latest_status.final_gpa else "N/A"}. You may need to repeat the year.',
                'academic_year': latest_status.academic_year,
                'level': latest_status.level,
                'final_gpa': round(latest_status.final_gpa, 2) if latest_status.final_gpa else None
            })
        
        elif latest_status.promoted:
            alerts.append({
                'id': 'status_promoted',
                'type': 'promoted',
                'priority': 'low',
                'title': 'Promoted!',
                'message': f'Congratulations! You have been promoted from {latest_status.level} with a final GPA of {round(latest_status.final_gpa, 2) if latest_status.final_gpa else "N/A"}.',
                'academic_year': latest_status.academic_year,
                'level': latest_status.level,
                'final_gpa': round(latest_status.final_gpa, 2) if latest_status.final_gpa else None
            })
    
    # ===== NO ALERTS =====
    if not alerts:
        alerts.append({
            'id': 'no_alerts',
            'type': 'info',
            'priority': 'low',
            'title': 'All Clear',
            'message': 'You have no pending issues. Keep up the good work!'
        })
    
    # Sort by priority (critical > high > low)
    priority_order = {'critical': 0, 'high': 1, 'low': 2}
    alerts.sort(key=lambda x: priority_order.get(x['priority'], 3))
    
    return jsonify(alerts)


# ==================== PROFILE ====================

@student_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_student):
    """Get student profile information"""
    student_id = current_student.student_id
    
    # Get enrollment info
    enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
    
    # Get latest academic status
    from admin import StudentAcademicStatus
    academic_status = StudentAcademicStatus.query.filter_by(
        student_id=student_id
    ).order_by(StudentAcademicStatus.academic_year.desc()).first()
    
    # Get all distinct semesters student has been enrolled
    distinct_semesters = db.session.query(
        Course.academic_year, Course.semester
    ).join(CourseStudent).filter(
        CourseStudent.student_id == student_id
    ).distinct().order_by(Course.academic_year.desc(), Course.semester.desc()).all()
    
    profile = {
        'student_id': student_id,
        'email': current_student.email,
        'student_name': enrollment.student_name if enrollment else (academic_status.student_name if academic_status else 'N/A'),
        'program': enrollment.program_type if enrollment else (academic_status.program_type if academic_status else 'N/A'),
        'department': enrollment.student_department.name if enrollment and enrollment.student_department else 'N/A',
        'registered_since': current_student.created_at.isoformat() if current_student.created_at else None,
        'last_login': current_student.last_login.isoformat() if current_student.last_login else None,
        'enrollment_history': [
            {
                'academic_year': s.academic_year,
                'semester': s.semester
            } for s in distinct_semesters
        ]
    }
    
    return jsonify(profile)


# ==================== GPA HISTORY ====================

@student_bp.route('/gpa-history', methods=['GET'])
@token_required
def get_gpa_history(current_student):
    """Get complete GPA history"""
    student_id = current_student.student_id
    
    records = StudentGPA.query.filter_by(student_id=student_id).order_by(
        StudentGPA.academic_year.asc(), StudentGPA.semester.asc()
    ).all()
    
    history = []
    for r in records:
        history.append({
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
        })
    
    # Calculate overall CGPA
    total_points = sum(
        (r.total_credit_hours or 0) * (r.gpa or 0) for r in records
    )
    total_credits = sum(r.total_credit_hours or 0 for r in records)
    overall_cgpa = total_points / total_credits if total_credits > 0 else None
    
    return jsonify({
        'gpa_records': history,
        'summary': {
            'total_semesters': len(history),
            'overall_cgpa': round(overall_cgpa, 2) if overall_cgpa else None,
            'total_credits_completed': total_credits
        }
    })


# ==================== ACADEMIC STATUS ====================

@student_bp.route('/academic-status', methods=['GET'])
@token_required
def get_academic_status(current_student):
    """Get academic status history"""
    student_id = current_student.student_id
    
    from admin import StudentAcademicStatus
    
    records = StudentAcademicStatus.query.filter_by(
        student_id=student_id
    ).order_by(StudentAcademicStatus.academic_year.asc()).all()
    
    status_list = []
    for r in records:
        status_list.append({
            'id': r.id,
            'level': r.level,
            'academic_year': r.academic_year,
            'semester1_gpa': round(r.semester1_gpa, 2) if r.semester1_gpa else None,
            'semester1_status': r.semester1_status,
            'semester2_gpa': round(r.semester2_gpa, 2) if r.semester2_gpa else None,
            'semester2_status': r.semester2_status,
            'final_gpa': round(r.final_gpa, 2) if r.final_gpa else None,
            'final_status': r.final_status,
            'promoted': r.promoted,
            'repeated': r.repeated,
            'withdrawn': r.withdrawn,
            'program_type': r.program_type
        })

        
    
    return jsonify({
        'academic_status': status_list,
        'current_status': status_list[-1] if status_list else None
    })

@student_bp.route('/my-info', methods=['GET'])
@token_required
def get_my_info(current_student):
    """Get complete student info including department, faculty, HOD, Dean"""
    student_id = current_student.student_id
    
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
    
    try:
        # ===== STEP 1: Get student enrollments =====
        enrollments = CourseStudent.query.filter_by(student_id=student_id).all()
        result['total_courses'] = len(enrollments)
        
        if enrollments:
            first = enrollments[0]
            result['student_name'] = first.student_name or 'Student'
            result['program'] = first.program_type
            
            # Try to find department through enrolled courses
            for cs in enrollments:
                course = cs.course
                if course and course.department_id:
                    result['department_id'] = course.department_id
                    break
            
            # Also check student's direct department assignment
            if not result['department_id']:
                for cs in enrollments:
                    if cs.student_department_id:
                        result['department_id'] = cs.student_department_id
                        break
        
        # ===== STEP 2: Get academic status =====
        status = StudentAcademicStatus.query.filter_by(student_id=student_id).order_by(
            StudentAcademicStatus.academic_year.desc()
        ).first()
        
        if status:
            result['level'] = status.level
            result['academic_year'] = status.academic_year
            result['promoted'] = status.promoted
            result['withdrawn'] = status.withdrawn
            if status.program_type:
                result['program'] = result['program'] or status.program_type
            if not result['department_id'] and status.department_id:
                result['department_id'] = status.department_id
        
        # ===== STEP 3: Get GPA =====
        gpa_record = StudentGPA.query.filter_by(student_id=student_id).order_by(
            StudentGPA.academic_year.desc(), StudentGPA.semester.desc()
        ).first()
        
        if gpa_record:
            result['gpa'] = round(gpa_record.gpa, 2) if gpa_record.gpa else None
            result['gpa_status'] = gpa_record.student_status
            result['level'] = result['level'] or gpa_record.level
            result['semester'] = gpa_record.semester
            result['academic_year'] = result['academic_year'] or gpa_record.academic_year
        
        # ===== STEP 4: Get Department → Faculty → HOD → Dean =====
        if result['department_id']:
            department = Department.query.get(result['department_id'])
            if department:
                result['department'] = department.name
                
                # Get Faculty
                if department.faculty:
                    result['faculty'] = department.faculty.name
                    result['faculty_id'] = department.faculty.id
                
                # Get HOD (from same department)
                hod = Lecturer.query.filter_by(
                    department_id=result['department_id'],
                    role='head_of_department'
                ).first()
                if hod:
                    result['hod'] = hod.full_name
                    result['hod_email'] = hod.email
                    result['hod_phone'] = hod.phone
                
                # Get Dean (from the faculty)
                if result['faculty_id']:
                    dean = Lecturer.query.filter_by(
                        faculty_id=result['faculty_id'],
                        role='dean'
                    ).first()
                    if dean:
                        result['dean'] = dean.full_name
                        result['dean_email'] = dean.email
                        result['dean_phone'] = dean.phone
        
        # ===== STEP 5: Get Reference Counts =====
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
        
        # ===== DEBUG PRINT =====
        print(f"\n=== STUDENT INFO for {student_id} ===")
        print(f"Name: {result['student_name']}")
        print(f"Program: {result['program']}")
        print(f"Department: {result['department']} (ID: {result['department_id']})")
        print(f"Faculty: {result['faculty']} (ID: {result['faculty_id']})")
        print(f"HOD: {result['hod']} ({result['hod_email']})")
        print(f"Dean: {result['dean']} ({result['dean_email']})")
        print(f"Level: {result['level']}, Year: {result['academic_year']}")
        print(f"GPA: {result['gpa']} ({result['gpa_status']})")
        print(f"Courses: {result['total_courses']}")
        print(f"Refs - Pending: {result['pending_references']}, Cleared: {result['cleared_references']}, Fails: {result['double_fails']}")
        print(f"===============================\n")
        
        return jsonify(result)
        
    except Exception as e:
        import traceback
        print(f"ERROR in /my-info: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    
@student_bp.route('/chat', methods=['POST'])
@token_required
def ai_chat(current_student):
    """Simple chatbot using student data from database"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        student_id = current_student.student_id
        
        if not user_message:
            return jsonify({'reply': 'Please ask me something! 😊'})
        
        # Get student info (calling our own function)
        info = get_student_info_dict(student_id)
        
        lower_msg = user_message.lower()
        reply = ""
        
        # ===== HOD =====
        if any(word in lower_msg for word in ['hod', 'head of department', 'department head']):
            if info['hod']:
                reply = f"👨‍🏫 Your **Head of Department** is:\n\n**{info['hod']}**\n📧 Email: {info['hod_email'] or 'N/A'}"
                if info['hod_phone']:
                    reply += f"\n📞 Phone: {info['hod_phone']}"
                reply += f"\n\nDepartment: **{info['department']}**\nFaculty: **{info['faculty']}**"
            else:
                reply = f"⚠️ No HOD found for your department.\n\nYour Department: **{info['department'] or 'Not assigned'}**\nFaculty: **{info['faculty'] or 'Not assigned'}**\n\nPlease visit your department office."
        
        # ===== DEAN =====
        elif any(word in lower_msg for word in ['dean', 'faculty dean']):
            if info['dean']:
                reply = f"🎓 Your **Dean** is:\n\n**{info['dean']}**\n📧 Email: {info['dean_email'] or 'N/A'}"
                if info['dean_phone']:
                    reply += f"\n📞 Phone: {info['dean_phone']}"
                reply += f"\n\nFaculty: **{info['faculty']}**"
            else:
                reply = f"⚠️ No Dean found for your faculty.\n\nYour Faculty: **{info['faculty'] or 'Not assigned'}**\n\nPlease visit the faculty office."
        
        # ===== GPA =====
        elif any(word in lower_msg for word in ['gpa', 'grade point', 'my performance', 'how am i doing']):
            if info['gpa'] is not None:
                gpa = info['gpa']
                status = info['gpa_status'] or 'N/A'
                if gpa >= 3.5: advice = "🌟 Outstanding performance! Keep it up!"
                elif gpa >= 3.0: advice = "✅ Good standing. You're doing well."
                elif gpa >= 2.7: advice = "⚠️ At risk. You need to improve."
                else: advice = "❌ Critical. Seek help from your HOD immediately."
                reply = f"📊 **Your GPA:** {gpa}\n**Status:** {status}\n\n{advice}\n\nLevel: {info['level']}\nSemester: {info['semester']}\nYear: {info['academic_year']}"
            else:
                reply = "📊 No GPA records found yet. Your GPA will be calculated once your grades are finalized."
        
        # ===== LEVEL / YEAR =====
        elif any(word in lower_msg for word in ['level', 'year', 'what level', 'which year', 'current level']):
            reply = f"📚 **Your Academic Info:**\n\nLevel: **{info['level'] or 'Unknown'}**\nYear: **{info['academic_year'] or 'N/A'}**\nSemester: **{info['semester'] or 'N/A'}**\nProgram: **{info['program'] or 'N/A'}**\nDepartment: **{info['department'] or 'N/A'}**\nFaculty: **{info['faculty'] or 'N/A'}**"
        
        # ===== DEPARTMENT =====
        elif any(word in lower_msg for word in ['department', 'my department', 'which department']):
            reply = f"🏛️ **Your Department:** {info['department'] or 'Not assigned'}\n**Faculty:** {info['faculty'] or 'Not assigned'}\n**Program:** {info['program'] or 'N/A'}"
            if info['hod']:
                reply += f"\n**HOD:** {info['hod']}"
            if info['dean']:
                reply += f"\n**Dean:** {info['dean']}"
        
        # ===== FACULTY =====
        elif any(word in lower_msg for word in ['faculty', 'my faculty', 'which faculty']):
            reply = f"🏫 **Your Faculty:** {info['faculty'] or 'Not assigned'}\n**Department:** {info['department'] or 'Not assigned'}"
            if info['dean']:
                reply += f"\n**Dean:** {info['dean']} ({info['dean_email'] or 'N/A'})"
        
        # ===== REFERENCES =====
        elif any(word in lower_msg for word in ['reference', 'resit', 'repeat']):
            p = info['pending_references']
            c = info['cleared_references']
            d = info['double_fails']
            reply = f"📝 **Your References:**\n\n⏳ Pending: **{p}**\n✅ Cleared: **{c}**\n❌ Double Fail: **{d}**"
            if p > 0:
                reply += f"\n\n⚠️ You have {p} pending reference(s)! Contact your HOD ({info['hod'] or 'department office'}) to schedule resits."
            if d > 0:
                reply += f"\n\n❌ You have {d} double fail(s). These courses must be repeated."
            if p == 0 and d == 0:
                reply += "\n\n✅ Great! No pending issues."
        
        # ===== COURSES =====
        elif any(word in lower_msg for word in ['course', 'subject', 'module', 'how many course', 'enrolled']):
            reply = f"📚 You are enrolled in **{info['total_courses']}** course(s).\n\nTo see all your grades, go to **Results** → select {info['academic_year'] or 'year'}, {info['level'] or 'level'}, {info['semester'] or 'semester'} → Get Results."
        
        # ===== PROMOTION =====
        elif any(word in lower_msg for word in ['promot', 'next level', 'move up']):
            if info['promoted'] is True:
                reply = "🎉 Congratulations! You have been **promoted** to the next level!"
            elif info['promoted'] is False:
                reply = f"⚠️ You have **not been promoted**. Contact your HOD ({info['hod'] or 'department office'}) for guidance."
            else:
                reply = "Your promotion status will be determined at the end of the academic year."
        
        # ===== WITHDRAWAL =====
        elif any(word in lower_msg for word in ['withdr', 'kicked out', 'discontinue']):
            if info['withdrawn']:
                reply = f"⚠️ You have been **withdrawn** from {info['level']} ({info['academic_year']}). Contact your HOD ({info['hod'] or 'department office'}) and the Exam Office immediately."
            else:
                reply = "✅ You are **not withdrawn**. Your academic standing is active."
        
        # ===== LECTURERS =====
        elif any(word in lower_msg for word in ['lecturer', 'teacher', 'professor', 'who teaches']):
            reply = f"👨‍🏫 For information about your lecturers, please contact your HOD:\n\n**{info['hod'] or 'Department Office'}**\n📧 {info['hod_email'] or 'N/A'}\n\nYour HOD can tell you which lecturers are assigned to your courses."
        
        # ===== RESULTS =====
        elif any(word in lower_msg for word in ['result', 'exam', 'check grade', 'view grade']):
            reply = f"📋 To check your results:\n1. Go to **My Results**\n2. Select Year: **{info['academic_year'] or '2025/2026'}**\n3. Select Level: **{info['level'] or 'Year 1'}**\n4. Select Semester: **{info['semester'] or 'Semester 1'}**\n5. Tap **Get Results**"
        
        # ===== STATUS =====
        elif any(word in lower_msg for word in ['status', 'academic status', 'standing', 'how am i']):
            reply = f"📊 **Academic Status:** {info['gpa_status'] or 'Pending'}\n**GPA:** {info['gpa'] or 'N/A'}\n**Level:** {info['level'] or 'Unknown'}\n**Year:** {info['academic_year'] or 'N/A'}\n**Department:** {info['department'] or 'N/A'}"
        
        # ===== HELLO =====
        elif any(word in lower_msg for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
            reply = f"Hello **{info['student_name']}**! 👋\n\nI'm your MMTU Academic Assistant. Here's what I can tell you:\n\n📊 Your GPA & academic status\n👨‍🏫 Your HOD ({info['hod'] or 'check department'})\n🎓 Your Dean ({info['dean'] or 'check faculty'})\n📚 Your level & courses\n📝 Your references\n\nWhat would you like to know?"
        
        # ===== HELP =====
        elif any(word in lower_msg for word in ['help', 'what can you do']):
            reply = f"🤖 **I can help with:**\n\n📊 **GPA** - 'What's my GPA?'\n👨‍🏫 **HOD** - 'Who is my HOD?'\n🎓 **Dean** - 'Who is my Dean?'\n📚 **Level** - 'What level am I?'\n🏛️ **Department** - 'My department'\n📝 **References** - 'My references'\n📋 **Results** - 'How to check results?'\n🎓 **Promotion** - 'Am I promoted?'\n\nJust ask me any of these!"
        
        # ===== THANK YOU =====
        elif any(word in lower_msg for word in ['thank', 'thanks']):
            reply = f"You're welcome, {info['student_name']}! 😊 Let me know if you need anything else."
        
        # ===== FALLBACK =====
        else:
            reply = f"I understand you're asking: \"{user_message[:60]}{'...' if len(user_message) > 60 else ''}\"\n\nI'm your **MMTU Academic Assistant** focused on your university records.\n\nTry asking:\n• 'Who is my HOD?'\n• 'What's my GPA?'\n• 'What level am I?'\n• 'My references'\n• 'My department'\n\nFor general knowledge questions, please search online or ask your lecturers."
        
        return jsonify({'reply': reply})
        
    except Exception as e:
        import traceback
        print(f"CHAT ERROR: {traceback.format_exc()}")
        return jsonify({'reply': 'Sorry, I encountered an error. Please try again.'})


def get_student_info_dict(student_id):
    """Helper function to get all student info as a dictionary"""
    info = {
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
    
    try:
        # Get enrollments
        enrollments = CourseStudent.query.filter_by(student_id=student_id).all()
        info['total_courses'] = len(enrollments)
        
        if enrollments:
            first = enrollments[0]
            info['student_name'] = first.student_name or 'Student'
            info['program'] = first.program_type
            
            # Find department through courses
            for cs in enrollments:
                course = cs.course
                if course and course.department_id:
                    info['department_id'] = course.department_id
                    break
            
            if not info['department_id']:
                for cs in enrollments:
                    if cs.student_department_id:
                        info['department_id'] = cs.student_department_id
                        break
        
        # Academic status
        status = StudentAcademicStatus.query.filter_by(student_id=student_id).order_by(
            StudentAcademicStatus.academic_year.desc()
        ).first()
        
        if status:
            info['level'] = status.level
            info['academic_year'] = status.academic_year
            info['promoted'] = status.promoted
            info['withdrawn'] = status.withdrawn
            info['program'] = info['program'] or status.program_type
            if not info['department_id'] and status.department_id:
                info['department_id'] = status.department_id
        
        # GPA
        gpa_record = StudentGPA.query.filter_by(student_id=student_id).order_by(
            StudentGPA.academic_year.desc(), StudentGPA.semester.desc()
        ).first()
        
        if gpa_record:
            info['gpa'] = round(gpa_record.gpa, 2) if gpa_record.gpa else None
            info['gpa_status'] = gpa_record.student_status
            info['level'] = info['level'] or gpa_record.level
            info['semester'] = gpa_record.semester
            info['academic_year'] = info['academic_year'] or gpa_record.academic_year
        
        # Department → Faculty → HOD → Dean
        if info['department_id']:
            department = Department.query.get(info['department_id'])
            if department:
                info['department'] = department.name
                
                if department.faculty:
                    info['faculty'] = department.faculty.name
                    info['faculty_id'] = department.faculty.id
                
                # HOD
                hod = Lecturer.query.filter_by(
                    department_id=info['department_id'],
                    role='head_of_department'
                ).first()
                if hod:
                    info['hod'] = hod.full_name
                    info['hod_email'] = hod.email
                    info['hod_phone'] = hod.phone
                
                # Dean
                if info['faculty_id']:
                    dean = Lecturer.query.filter_by(
                        faculty_id=info['faculty_id'],
                        role='dean'
                    ).first()
                    if dean:
                        info['dean'] = dean.full_name
                        info['dean_email'] = dean.email
                        info['dean_phone'] = dean.phone
        
        # Reference counts
        for cs in enrollments:
            ref = ReferenceGrade.query.filter_by(course_id=cs.course_id, student_id=cs.id).first()
            if ref:
                if ref.reference_status == 'pending':
                    info['pending_references'] += 1
                elif ref.reference_status == 'cleared':
                    info['cleared_references'] += 1
                elif ref.reference_status == 'double_fail':
                    info['double_fails'] += 1
                    
    except Exception as e:
        print(f"Error in get_student_info_dict: {e}")
    
    return info

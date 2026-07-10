from flask import Blueprint, request, jsonify
from extensions import db
from middleware.jwt_required import token_required
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

# ==================== DASHBOARD ====================

@admin_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    from models.user import Admin, Lecturer
    from models.academic import Faculty, Department, Course, CourseStudent
    from models.approval import ApprovalRequest
    from models.reference import ReferenceGrade
    from models.notification import Notification
    
    total_admins = Admin.query.count()
    total_lecturers = Lecturer.query.count()
    total_faculties = Faculty.query.count()
    total_departments = Department.query.count()
    total_courses = Course.query.count()
    total_students = db.session.query(CourseStudent.student_id).distinct().count()
    
    pending_courses = ApprovalRequest.query.filter_by(submission_type='course').filter(
        ApprovalRequest.status.in_(['pending_hod', 'pending_dean', 'pending_exam'])
    ).count()
    
    pending_ca = ApprovalRequest.query.filter_by(submission_type='ca').filter(
        ApprovalRequest.status.in_(['pending_hod', 'pending_dean', 'pending_exam'])
    ).count()
    
    pending_exam = ApprovalRequest.query.filter_by(submission_type='exam').filter(
        ApprovalRequest.status.in_(['pending_hod', 'pending_dean', 'pending_exam'])
    ).count()
    
    pending_ref = ApprovalRequest.query.filter_by(submission_type='reference').filter(
        ApprovalRequest.status.in_(['pending_hod', 'pending_dean', 'pending_exam'])
    ).count()
    
    pending_grades = pending_ca + pending_exam + pending_ref
    pending_at_exam = pending_courses + pending_grades
    
    finalized_count = ApprovalRequest.query.filter_by(status='finalized').count()
    rejected_count = ApprovalRequest.query.filter_by(status='rejected').count()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    finalized_today = ApprovalRequest.query.filter(
        ApprovalRequest.status == 'finalized',
        ApprovalRequest.finalized_at >= today
    ).count()
    
    pending_ref_status = ReferenceGrade.query.filter_by(reference_status='pending').count()
    cleared_ref = ReferenceGrade.query.filter_by(reference_status='cleared').count()
    double_fail = ReferenceGrade.query.filter_by(reference_status='double_fail').count()
    
    admin = Admin.query.get(request.user['user_id'])
    unread = 0
    if admin:
        unread = Notification.query.filter_by(
            user_id=admin.id, user_type='admin', is_read=False, is_dismissed=False
        ).count()
    
    return jsonify({
        'stats': {
            'total_admins': total_admins,
            'total_lecturers': total_lecturers,
            'total_students': total_students,
            'total_faculties': total_faculties,
            'total_departments': total_departments,
            'total_courses': total_courses,
            'pending_courses_at_exam': pending_courses,
            'pending_ca_at_exam': pending_ca,
            'pending_exam_at_exam': pending_exam,
            'pending_references_at_exam': pending_ref,
            'pending_grades_at_exam': pending_grades,
            'pending_at_exam': pending_at_exam,
            'pending_approvals': pending_at_exam,
            'finalized_count': finalized_count,
            'rejected_count': rejected_count,
            'finalized_today': finalized_today,
            'submitted_today': 0,
            'pending_ref_status': pending_ref_status,
            'cleared_references': cleared_ref,
            'double_failures': double_fail,
            'unread_notifications': unread,
        }
    })

# ==================== USER MANAGEMENT ====================

@admin_bp.route('/admins', methods=['GET'])
@token_required
def get_admins():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Admin
    admins = Admin.query.all()
    return jsonify({'admins': [a.to_dict() for a in admins]})

@admin_bp.route('/lecturers', methods=['GET'])
@token_required
def get_lecturers():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Lecturer
    lecturers = Lecturer.query.all()
    return jsonify({'lecturers': [l.to_dict() for l in lecturers]})

@admin_bp.route('/add-admin', methods=['POST'])
@token_required
def add_admin():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Admin
    data = request.get_json() or {}
    
    if Admin.query.filter((Admin.username == data.get('username')) | (Admin.email == data.get('email'))).first():
        return jsonify({'message': 'Username or Email already exists', 'code': 'DUPLICATE'}), 400
    
    admin = Admin(
        username=data.get('username'),
        full_name=data.get('full_name'),
        email=data.get('email'),
        password=data.get('password'),
        role=data.get('role', 'admin')
    )
    db.session.add(admin)
    db.session.commit()
    return jsonify({'message': f'Admin {admin.full_name} added!', 'admin': admin.to_dict()})

@admin_bp.route('/add-lecturer', methods=['POST'])
@token_required
def add_lecturer():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Lecturer
    data = request.get_json() or {}
    
    if Lecturer.query.filter((Lecturer.lecturer_id == data.get('lecturer_id')) | (Lecturer.email == data.get('email'))).first():
        return jsonify({'message': 'Lecturer ID or Email already exists', 'code': 'DUPLICATE'}), 400
    
    lecturer = Lecturer(
        lecturer_id=data.get('lecturer_id'),
        full_name=data.get('full_name'),
        email=data.get('email'),
        password=data.get('password'),
        role=data.get('role', 'lecturer'),
        phone=data.get('phone'),
        qualification=data.get('qualification'),
        department_id=data.get('department_id') if data.get('department_id') else None,
        faculty_id=data.get('faculty_id') if data.get('faculty_id') else None
    )
    db.session.add(lecturer)
    db.session.commit()
    return jsonify({'message': f'Lecturer {lecturer.full_name} added!', 'lecturer': lecturer.to_dict()})

@admin_bp.route('/edit-lecturer/<int:id>', methods=['PUT'])
@token_required
def edit_lecturer(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Lecturer
    lecturer = Lecturer.query.get_or_404(id)
    data = request.get_json() or {}
    
    lecturer.full_name = data.get('full_name', lecturer.full_name)
    lecturer.email = data.get('email', lecturer.email)
    lecturer.role = data.get('role', lecturer.role)
    lecturer.phone = data.get('phone', lecturer.phone)
    lecturer.qualification = data.get('qualification', lecturer.qualification)
    lecturer.department_id = data.get('department_id') or None
    lecturer.faculty_id = data.get('faculty_id') or None
    
    if data.get('password'):
        lecturer.password = data.get('password')
    
    db.session.commit()
    return jsonify({'message': 'Lecturer updated!', 'lecturer': lecturer.to_dict()})

@admin_bp.route('/delete-lecturer/<int:id>', methods=['DELETE'])
@token_required
def delete_lecturer(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Lecturer
    from models.academic import Course
    
    lecturer = Lecturer.query.get_or_404(id)
    if Course.query.filter_by(created_by_id=id).first():
        return jsonify({'message': 'Cannot delete lecturer with existing courses'}), 400
    
    db.session.delete(lecturer)
    db.session.commit()
    return jsonify({'message': 'Lecturer deleted!'})

# ==================== FACULTY & DEPARTMENT ====================

@admin_bp.route('/faculties', methods=['GET'])
@token_required
def get_faculties():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Faculty
    faculties = Faculty.query.all()
    return jsonify({'faculties': [f.to_dict() for f in faculties]})

@admin_bp.route('/add-faculty', methods=['POST'])
@token_required
def add_faculty():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Faculty
    data = request.get_json() or {}
    
    if Faculty.query.filter((Faculty.name == data.get('name')) | (Faculty.code == data.get('code'))).first():
        return jsonify({'message': 'Faculty name or code already exists'}), 400
    
    faculty = Faculty(name=data.get('name'), code=data.get('code'), description=data.get('description', ''))
    db.session.add(faculty)
    db.session.commit()
    return jsonify({'message': f'Faculty {faculty.name} added!', 'faculty': faculty.to_dict()})

@admin_bp.route('/edit-faculty/<int:id>', methods=['PUT'])
@token_required
def edit_faculty(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Faculty
    faculty = Faculty.query.get_or_404(id)
    data = request.get_json() or {}
    
    faculty.name = data.get('name', faculty.name)
    faculty.code = data.get('code', faculty.code)
    faculty.description = data.get('description', faculty.description)
    faculty.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Faculty updated!', 'faculty': faculty.to_dict()})

@admin_bp.route('/delete-faculty/<int:id>', methods=['DELETE'])
@token_required
def delete_faculty(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Faculty
    faculty = Faculty.query.get_or_404(id)
    try:
        db.session.delete(faculty)
        db.session.commit()
        return jsonify({'message': 'Faculty deleted!'})
    except:
        db.session.rollback()
        return jsonify({'message': 'Cannot delete faculty with existing departments'}), 400

@admin_bp.route('/add-department/<int:faculty_id>', methods=['POST'])
@token_required
def add_department(faculty_id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Department
    data = request.get_json() or {}
    
    if Department.query.filter_by(faculty_id=faculty_id, name=data.get('name')).first():
        return jsonify({'message': 'Department already exists in this faculty'}), 400
    
    dept = Department(name=data.get('name'), code=data.get('code'), faculty_id=faculty_id)
    db.session.add(dept)
    db.session.commit()
    return jsonify({'message': f'Department {dept.name} added!', 'department': dept.to_dict()})

@admin_bp.route('/edit-department/<int:id>', methods=['PUT'])
@token_required
def edit_department(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Department
    dept = Department.query.get_or_404(id)
    data = request.get_json() or {}
    
    dept.name = data.get('name', dept.name)
    dept.code = data.get('code', dept.code)
    dept.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Department updated!', 'department': dept.to_dict()})

@admin_bp.route('/delete-department/<int:id>', methods=['DELETE'])
@token_required
def delete_department(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Department
    dept = Department.query.get_or_404(id)
    try:
        db.session.delete(dept)
        db.session.commit()
        return jsonify({'message': 'Department deleted!'})
    except:
        db.session.rollback()
        return jsonify({'message': 'Cannot delete department'}), 400

@admin_bp.route('/api/departments/<int:faculty_id>', methods=['GET'])
@token_required
def get_departments(faculty_id):
    from models.academic import Department
    departments = Department.query.filter_by(faculty_id=faculty_id).all()
    return jsonify({'departments': [{'id': d.id, 'name': d.name} for d in departments]})

# ==================== COURSE APPROVALS ====================

@admin_bp.route('/course-approvals', methods=['GET'])
@token_required
def course_approvals():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    from models.approval import ApprovalRequest
    
    courses = Course.query.order_by(Course.created_at.desc()).all()
    
    course_ids = [c.id for c in courses]
    approval_map = {}
    for req in ApprovalRequest.query.filter(
        ApprovalRequest.submission_type == 'course',
        ApprovalRequest.submission_id.in_(course_ids)
    ).all():
        approval_map[req.submission_id] = req.to_dict()
    
    stats = {
        'total_courses': len(courses),
        'pending_hod': ApprovalRequest.query.filter_by(submission_type='course', status='pending_hod').count(),
        'pending_dean': ApprovalRequest.query.filter_by(submission_type='course', status='pending_dean').count(),
        'pending_exam': ApprovalRequest.query.filter_by(submission_type='course', status='pending_exam').count(),
        'finalized': ApprovalRequest.query.filter_by(submission_type='course', status='finalized').count(),
        'rejected': ApprovalRequest.query.filter_by(submission_type='course', status='rejected').count(),
    }
    
    return jsonify({
        'courses': [c.to_dict(include_relations=True) for c in courses],
        'approval_map': approval_map,
        'stats': stats
    })

@admin_bp.route('/course/<int:id>/view', methods=['GET'])
@token_required
def view_course(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    course = Course.query.get_or_404(id)
    return jsonify({'course': course.to_dict(include_relations=True)})

# ==================== GRADE APPROVALS ====================

@admin_bp.route('/grade-approvals', methods=['GET'])
@token_required
def grade_approvals():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest
    
    ca_approvals = ApprovalRequest.query.filter_by(submission_type='ca').order_by(ApprovalRequest.submitted_at.desc()).all()
    exam_approvals = ApprovalRequest.query.filter_by(submission_type='exam').order_by(ApprovalRequest.submitted_at.desc()).all()
    reference_approvals = ApprovalRequest.query.filter_by(submission_type='reference').order_by(ApprovalRequest.submitted_at.desc()).all()
    rejected_approvals = ApprovalRequest.query.filter_by(status='rejected').order_by(ApprovalRequest.rejected_at.desc()).all()
    
    stats = {
        'pending_ca': ApprovalRequest.query.filter_by(submission_type='ca').filter(ApprovalRequest.status.like('pending_%')).count(),
        'pending_exam': ApprovalRequest.query.filter_by(submission_type='exam').filter(ApprovalRequest.status.like('pending_%')).count(),
        'pending_references': ApprovalRequest.query.filter_by(submission_type='reference').filter(ApprovalRequest.status.like('pending_%')).count(),
        'approved_ca': ApprovalRequest.query.filter_by(submission_type='ca', status='finalized').count(),
        'approved_exam': ApprovalRequest.query.filter_by(submission_type='exam', status='finalized').count(),
        'rejected': len(rejected_approvals),
    }
    
    return jsonify({
        'ca_approvals': [a.to_dict() for a in ca_approvals],
        'exam_approvals': [a.to_dict() for a in exam_approvals],
        'reference_approvals': [a.to_dict() for a in reference_approvals],
        'rejected_approvals': [a.to_dict() for a in rejected_approvals],
        'stats': stats
    })

# ==================== EXAM OFFICE ====================

@admin_bp.route('/exam-office-submissions', methods=['GET'])
@token_required
def exam_office_submissions():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest
    
    tab = request.args.get('tab', 'pending')
    
    # Get ALL submissions
    all_pending = ApprovalRequest.query.filter(
        ApprovalRequest.status.in_(['pending_hod', 'pending_dean', 'pending_exam'])
    ).order_by(ApprovalRequest.submitted_at.desc()).all()
    
    all_finalized = ApprovalRequest.query.filter_by(status='finalized').order_by(ApprovalRequest.finalized_at.desc()).all()
    
    all_rejected = ApprovalRequest.query.filter_by(status='rejected').order_by(ApprovalRequest.rejected_at.desc()).all()
    
    stats = {
        'pending': len(all_pending),
        'finalized': len(all_finalized),
        'rejected': len(all_rejected),
    }
    
    return jsonify({
        'pending': [s.to_dict() for s in all_pending],
        'finalized': [s.to_dict() for s in all_finalized],
        'rejected': [s.to_dict() for s in all_rejected],
        'stats': stats
    })

@admin_bp.route('/submission/<int:id>/view', methods=['GET'])
@token_required
def view_submission(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest
    
    approval = ApprovalRequest.query.get_or_404(id)
    course = approval.course
    students = course.students if course else []
    
    return jsonify({
        'approval_request': approval.to_dict(),
        'course': course.to_dict(include_relations=True) if course else None,
        'students': [s.to_dict() for s in students]
    })

@admin_bp.route('/exam-approve/<int:id>', methods=['POST'])
@token_required
def exam_approve(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest, ApprovalStep
    from models.academic import CourseStudent
    from models.reference import ReferenceGrade
    from models.notification import Notification
    
    req = ApprovalRequest.query.get_or_404(id)
    req.status = 'finalized'
    req.finalized_at = datetime.utcnow()
    
    for step in req.steps:
        if step.status == 'pending':
            step.status = 'approved'
            step.approved_at = datetime.utcnow()
            step.signature = f"Admin - {request.user.get('full_name', 'Exam Office')}"
        if step.status == 'waiting':
            step.status = 'skipped'
    
    # UPDATE BASED ON SUBMISSION TYPE
    if req.submission_type == 'course' and req.course:
        req.course.approval_status = 'finalized'
        req.course.is_editable = False
        
    elif req.submission_type == 'ca':
        students = CourseStudent.query.filter_by(course_id=req.submission_id).all()
        for s in students:
            s.ca_status = 'finalized'
            
    elif req.submission_type == 'exam':
        students = CourseStudent.query.filter_by(course_id=req.submission_id).all()
        for s in students:
            s.exam_status = 'finalized'
            
    elif req.submission_type == 'reference':
        ref = ReferenceGrade.query.get(req.submission_id)
        if ref:
            ref.approval_status = 'finalized'
            if ref.reference_grade in ['E', 'F']:
                ref.reference_status = 'double_fail'
                ref.double_reference = True
            else:
                ref.reference_status = 'cleared'
                ref.cleared_at = datetime.utcnow()
    
    notif = Notification(
        user_id=req.creator_id,
        user_type='lecturer',
        title=f'{req.submission_type.upper()} Finalized',
        message='Your submission has been finalized by Exam Office.',
        notification_type='finalized',
        request_id=req.id
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify({'message': f'{req.submission_type.upper()} finalized!'})

@admin_bp.route('/exam-reject/<int:id>', methods=['POST'])
@token_required
def exam_reject(id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification
    
    data = request.get_json() or {}
    reason = data.get('reason', 'No reason provided')
    
    req = ApprovalRequest.query.get_or_404(id)
    req.status = 'rejected'
    req.rejected_at = datetime.utcnow()
    
    for step in req.steps:
        if step.status == 'pending':
            step.status = 'rejected'
            step.rejection_reason = reason
            break
    
    notif = Notification(
        user_id=req.creator_id,
        user_type='lecturer',
        title=f'{req.submission_type.upper()} Rejected',
        message=f'Reason: {reason}',
        notification_type='rejection',
        request_id=req.id
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'message': 'Submission rejected!'})

# ==================== REFERENCE MANAGEMENT ====================

@admin_bp.route('/reference-management', methods=['GET'])
@token_required
def reference_management():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.reference import ReferenceGrade
    from models.academic import CourseStudent, Course
    
    student_id = request.args.get('student_id', '').strip()
    
    if not student_id:
        return jsonify({'student_info': None, 'references': [], 'has_pending': False})
    
    enrollments = CourseStudent.query.filter_by(student_id=student_id).all()
    if not enrollments:
        return jsonify({'student_info': None, 'references': [], 'has_pending': False})
    
    first = enrollments[0]
    student_info = {
        'id': student_id,
        'name': first.student_name,
        'program': first.program_type,
        'department': first.student_department.name if first.student_department else None,
        'level': None,
        'semester': None,
        'academic_year': None
    }
    
    # Get academic status for more info
    from models.gpa import StudentGPA
    gpa = StudentGPA.query.filter_by(student_id=student_id).order_by(StudentGPA.academic_year.desc()).first()
    if gpa:
        student_info['level'] = gpa.level
        student_info['semester'] = gpa.semester
        student_info['academic_year'] = gpa.academic_year
    
    references = []
    has_pending = False
    for e in enrollments:
        ref = ReferenceGrade.query.filter_by(student_id=e.id).first()
        if ref:
            references.append({
                'id': ref.id,
                'course_code': e.course.course_code if e.course else None,
                'course_name': e.course.course_name if e.course else None,
                'academic_year': e.course.academic_year if e.course else None,
                'semester': e.course.semester if e.course else None,
                'original_grade': ref.original_grade,
                'original_score': ref.original_score,
                'reference_grade': ref.reference_grade,
                'reference_score': ref.reference_score,
                'display_grade': ref.display_grade,
                'reference_status': ref.reference_status,
            })
            if ref.reference_status == 'pending':
                has_pending = True
    
    return jsonify({'student_info': student_info, 'references': references, 'has_pending': has_pending})

@admin_bp.route('/reference-dashboard', methods=['GET'])
@token_required
def reference_dashboard():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.reference import ReferenceGrade
    
    pending = ReferenceGrade.query.filter_by(reference_status='pending').all()
    cleared = ReferenceGrade.query.filter_by(reference_status='cleared').all()
    double = ReferenceGrade.query.filter_by(reference_status='double_fail').all()
    
    return jsonify({
        'pending': [r.to_dict() for r in pending],
        'cleared': [r.to_dict() for r in cleared],
        'double': [r.to_dict() for r in double],
        'stats': {
            'pending': len(pending),
            'cleared': len(cleared),
            'double_fail': len(double),
            'total': len(pending) + len(cleared) + len(double)
        }
    })

@admin_bp.route('/api/delete-all-references', methods=['POST'])
@token_required
def delete_all_references():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.reference import ReferenceGrade
    count = ReferenceGrade.query.count()
    ReferenceGrade.query.delete()
    db.session.commit()
    return jsonify({'message': f'Deleted {count} references'})

@admin_bp.route('/api/reset-all-references', methods=['POST'])
@token_required
def reset_all_references():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.reference import ReferenceGrade
    refs = ReferenceGrade.query.all()
    for r in refs:
        r.approval_status = 'draft'
        r.hod_approved = False
        r.dean_approved = False
        r.exam_approved = False
    db.session.commit()
    return jsonify({'message': f'Reset {len(refs)} references'})

# ==================== GPA CALCULATOR ====================

@admin_bp.route('/api/student-grades', methods=['POST'])
@token_required
def student_grades():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import CourseStudent, Course
    from models.reference import ReferenceGrade
    from models.gpa import StudentGPA
    
    data = request.get_json() or {}
    student_id = data.get('student_id', '').strip()
    academic_year = data.get('academic_year', '').strip()
    level = data.get('level', '').strip()
    semester = data.get('semester', '').strip()
    
    print(f"\n=== GPA CALCULATOR API ===")
    print(f"Student: {student_id}, Year: {academic_year}, Level: {level}, Semester: {semester}")
    
    if not all([student_id, academic_year, level, semester]):
        return jsonify({'error': 'Missing fields'}), 400
    
    # Map level to year format
    level_to_year = {"Level 100": "Year 1", "Level 200": "Year 2", "Level 300": "Year 3", "Level 400": "Year 4"}
    year_format = level_to_year.get(level, level.replace('Level ', 'Year '))
    full_semester = f"{year_format} - {semester}"
    
    print(f"Looking for semester: '{full_semester}'")
    
    # Get student info
    student = CourseStudent.query.filter_by(student_id=student_id).first()
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    student_name = student.student_name
    
    # Find enrollments
    enrollments = CourseStudent.query.filter_by(student_id=student_id).join(Course).filter(
        Course.academic_year == academic_year,
        Course.semester == full_semester
    ).all()
    
    if not enrollments:
        enrollments = CourseStudent.query.filter_by(student_id=student_id).join(Course).filter(
            Course.academic_year == academic_year,
            Course.semester.like(f'%{semester}%')
        ).all()
    
    # Get previous GPAs
    previous_gpas = StudentGPA.query.filter_by(student_id=student_id).order_by(
        StudentGPA.academic_year, StudentGPA.semester
    ).all()
    
    grade_map = {'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0}
    
    current_grades = []
    has_pending_ref = False
    pending_ref_courses = []
    has_double_fail = False
    double_fail_courses = []
    
    for e in enrollments:
        ref = ReferenceGrade.query.filter_by(course_id=e.course_id, student_id=e.id).first()
        
        original_credits = e.course.credit_hours
        effective_credits = original_credits
        final_grade = e.grade
        grade_points = e.grade_points or 0
        display_grade = None
        
        if ref:
            if ref.reference_status == 'cleared' and ref.reference_grade:
                # ✅ REFERENCE CLEARED - Use new grade, DOUBLE credit hours
                final_grade = ref.reference_grade
                grade_points = grade_map.get(ref.reference_grade, 0.0)
                effective_credits = original_credits * 2  # PENALTY: Double credits
                display_grade = ref.display_grade
                print(f"  ✓ {e.course.course_code}: Ref CLEARED - {e.grade}→{ref.reference_grade}, "
                      f"Credits: {original_credits}→{effective_credits} (×2 penalty), Points: {grade_points}")
                
            elif ref.reference_status == 'double_fail':
                # ❌ DOUBLE FAIL - 0 grade points, credits stay same
                final_grade = 'DOUBLE_FAIL'
                grade_points = 0.0
                effective_credits = original_credits  # Credits stay same but 0 points
                display_grade = ref.display_grade
                has_double_fail = True
                double_fail_courses.append(e.course.course_code)
                print(f"  ✗ {e.course.course_code}: DOUBLE FAIL - Credits: {original_credits}, Points: 0.0")
                
            elif ref.reference_status == 'pending':
                # ⏳ PENDING - Cannot calculate
                final_grade = 'PENDING_REF'
                grade_points = 0.0
                effective_credits = original_credits
                has_pending_ref = True
                pending_ref_courses.append(e.course.course_code)
                print(f"  ⏳ {e.course.course_code}: PENDING reference")
        else:
            # Normal grade - no reference
            print(f"  • {e.course.course_code}: Normal - Grade: {e.grade}, "
                  f"Credits: {original_credits}, Points: {e.grade_points}")
        
        current_grades.append({
            'course_code': e.course.course_code,
            'course_name': e.course.course_name,
            'credit_hours': original_credits,
            'effective_credit_hours': effective_credits,
            'score': e.total_score,
            'grade': final_grade,
            'grade_points': grade_points,
            'has_pending_reference': bool(ref and ref.reference_status == 'pending'),
            'has_double_fail': bool(ref and ref.reference_status == 'double_fail'),
            'has_cleared_reference': bool(ref and ref.reference_status == 'cleared'),
            'display_grade': display_grade
        })
    
    previous_semesters = [{
        'level': g.level,
        'semester': g.semester,
        'academic_year': g.academic_year,
        'gpa': round(g.gpa, 2) if g.gpa else None
    } for g in previous_gpas]
    
    # Calculate totals for display
    total_original = sum(g['credit_hours'] for g in current_grades)
    total_effective = sum(g['effective_credit_hours'] for g in current_grades)
    
    print(f"Summary: {len(current_grades)} courses, "
          f"Original Credits: {total_original}, Effective Credits: {total_effective}, "
          f"Pending: {has_pending_ref}, DoubleFail: {has_double_fail}")
    print(f"=== END GPA CALCULATOR ===\n")
    
    return jsonify({
        'student_name': student_name,
        'current_grades': current_grades,
        'has_pending_references': has_pending_ref,
        'pending_reference_courses': pending_ref_courses,
        'has_double_fail': has_double_fail,
        'double_fail_courses': double_fail_courses,
        'previous_semesters': previous_semesters,
        'summary': {
            'total_original_credits': total_original,
            'total_effective_credits': total_effective,
            'has_penalty': total_original != total_effective,
        }
    })

@admin_bp.route('/api/calculate-student-gpa', methods=['POST'])
@token_required
def calculate_gpa():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.gpa import StudentGPA
    
    data = request.get_json() or {}
    grades = data.get('grades', [])
    
    if not grades:
        return jsonify({'error': 'No grades provided'}), 400
    
    # Use EFFECTIVE credit hours (doubled for cleared references)
    total_credits = 0
    total_points = 0
    formula_parts = []
    
    for g in grades:
        credits = g.get('effective_credit_hours', g.get('credit_hours', 0))
        points = g.get('grade_points', 0)
        total_credits += credits
        total_points += credits * points
        formula_parts.append(f"{credits}x{points:.1f}")
    
    gpa = total_points / total_credits if total_credits > 0 else 0
    
    if gpa >= 3.0:
        status = 'PASS'
    elif gpa >= 2.7:
        status = 'FAIL'
    else:
        status = 'WITHDREW'
    
    formula_str = ' + '.join(formula_parts)
    print(f"GPA Calculation: {formula_str} = {total_points:.2f} / {total_credits} = {gpa:.2f} ({status})")
    
    # Save to database
    existing = StudentGPA.query.filter_by(
        student_id=data.get('student_id'),
        academic_year=data.get('academic_year'),
        level=data.get('level'),
        semester=data.get('semester')
    ).first()
    
    if not existing:
        gpa_record = StudentGPA(
            student_id=data.get('student_id'),
            student_name=data.get('student_name'),
            level=data.get('level'),
            semester=data.get('semester'),
            academic_year=data.get('academic_year'),
            total_credit_hours=total_credits,
            total_grade_points=total_points,
            gpa=gpa,
            student_status=status,
            calculated_by_id=request.user['user_id']
        )
        db.session.add(gpa_record)
    else:
        existing.gpa = gpa
        existing.total_credit_hours = total_credits
        existing.total_grade_points = total_points
        existing.student_status = status
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'gpa': round(gpa, 2),
        'status': status,
        'total_credits': total_credits,
        'total_points': round(total_points, 2),
        'formula': f"({formula_str}) = {total_points:.2f} / {total_credits} = {gpa:.2f}"
    })
# ==================== TRANSCRIPT ====================

@admin_bp.route('/transcript', methods=['GET'])
@token_required
def transcript():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.gpa import StudentGPA
    from models.academic import CourseStudent, Course
    from models.reference import ReferenceGrade
    
    student_id = request.args.get('student_id', '').strip()
    
    if not student_id:
        return jsonify({'student_data': None, 'student_name': None})
    
    records = StudentGPA.query.filter_by(student_id=student_id).order_by(StudentGPA.academic_year, StudentGPA.semester).all()
    
    if not records:
        enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
        return jsonify({
            'student_data': None,
            'student_name': enrollment.student_name if enrollment else 'Unknown'
        })
    
    student_name = records[0].student_name
    level_to_year = {"Level 100": "Year 1", "Level 200": "Year 2", "Level 300": "Year 3", "Level 400": "Year 4"}
    
    history = []
    for rec in records:
        year_format = level_to_year.get(rec.level, rec.level)
        full_semester = f"{year_format} - {rec.semester}"
        
        enrollments = CourseStudent.query.filter_by(student_id=student_id).join(Course).filter(
            Course.academic_year == rec.academic_year,
            Course.semester == full_semester
        ).all()
        
        courses = []
        for e in enrollments:
            ref = ReferenceGrade.query.filter_by(course_id=e.course_id, student_id=e.id).first()
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
            'gpa': round(rec.gpa, 2) if rec.gpa else None,
            'status': rec.student_status,
            'courses': courses
        })
    
    return jsonify({'student_data': history, 'student_name': student_name})

# ==================== DEPARTMENT STUDENTS ====================

@admin_bp.route('/department-students', methods=['GET'])
@token_required
def department_students():
    from models.academic import Department, CourseStudent, Course
    from models.gpa import StudentGPA
    from models.user import Lecturer
    
    dept_id = request.args.get('dept_id', type=int)
    program = request.args.get('program', '').strip()
    level = request.args.get('level', '').strip()
    academic_year = request.args.get('academic_year', '').strip()
    
    if not dept_id:
        return jsonify({'error': 'Department ID required'}), 400
    
    department = Department.query.get(dept_id)
    if not department:
        return jsonify({'error': 'Department not found'}), 404
    
    # Get students from CourseStudent enrollments
    query = db.session.query(CourseStudent).join(Course).filter(Course.department_id == dept_id)
    if academic_year:
        query = query.filter(Course.academic_year == academic_year)
    if program:
        query = query.filter(CourseStudent.program_type == program)
    if level:
        query = query.filter(Course.semester.like(f'{level}%'))
    
    enrollments = query.all()
    
    students_dict = {}
    for cs in enrollments:
        if cs.student_id not in students_dict:
            students_dict[cs.student_id] = {
                'student_id': cs.student_id,
                'student_name': cs.student_name,
                'program': cs.program_type or 'N/A',
                'semester1_gpa': None, 'semester1_status': None,
                'semester2_gpa': None, 'semester2_status': None,
                'final_gpa': None, 'final_status': None,
            }
    
        for sid in students_dict.keys():
            gpa_records = StudentGPA.query.filter_by(student_id=sid)
            if academic_year:
                gpa_records = gpa_records.filter_by(academic_year=academic_year)
            gpa_records = gpa_records.order_by(StudentGPA.semester).all()
            
            sem1_gpa = None
            sem2_gpa = None
            
            for gpa in gpa_records:
                if 'Semester 1' in (gpa.semester or ''):
                    students_dict[sid]['semester1_gpa'] = round(gpa.gpa, 2) if gpa.gpa else None
                    students_dict[sid]['semester1_status'] = gpa.student_status
                    sem1_gpa = gpa.gpa
                elif 'Semester 2' in (gpa.semester or ''):
                    students_dict[sid]['semester2_gpa'] = round(gpa.gpa, 2) if gpa.gpa else None
                    students_dict[sid]['semester2_status'] = gpa.student_status
                    sem2_gpa = gpa.gpa
            
            if sem1_gpa is not None and sem2_gpa is not None:
                final = (sem1_gpa + sem2_gpa) / 2
                students_dict[sid]['final_gpa'] = round(final, 2)
                if final >= 3.0:
                    students_dict[sid]['final_status'] = 'PASS'
                elif final >= 2.7:
                    students_dict[sid]['final_status'] = 'FAIL'
                else:
                    students_dict[sid]['final_status'] = 'WITHDREW'
            
            # FALLBACK: Derive status from course grades if no GPA records
            if students_dict[sid]['semester1_status'] is None and students_dict[sid]['semester2_status'] is None and students_dict[sid]['final_status'] is None:
                from models.reference import ReferenceGrade
                student_courses = CourseStudent.query.filter_by(student_id=sid).all()
                for c in student_courses:
                    if c.grade == 'F':
                        students_dict[sid]['final_status'] = 'FAIL'
                        break
                    elif c.grade == 'E':
                        ref = ReferenceGrade.query.filter_by(course_id=c.course_id, student_id=c.id).first()
                        if ref and ref.reference_status == 'double_fail':
                            students_dict[sid]['final_status'] = 'FAIL'
                            break
                        elif ref and ref.reference_status == 'pending':
                            students_dict[sid]['final_status'] = 'PENDING REF'
                            break
    
    students = sorted(students_dict.values(), key=lambda x: x['student_name'])
    
    # Split into active and failed/withdrew
    active_students = []
    failed_students = []
    
    for s in students:
        is_failed = False
        if s['semester1_status'] in ['FAIL', 'WITHDREW']:
            is_failed = True
        if s['semester2_status'] in ['FAIL', 'WITHDREW']:
            is_failed = True
        if s['final_status'] in ['FAIL', 'WITHDREW']:
            is_failed = True
        # Also check if GPA is below 2.7
        if s['final_gpa'] is not None and s['final_gpa'] < 2.7:
            is_failed = True
        if s['semester1_gpa'] is not None and s['semester1_gpa'] < 2.7 and s['semester1_status'] in ['FAIL', 'WITHDREW', None]:
            is_failed = True
        if s['semester2_gpa'] is not None and s['semester2_gpa'] < 2.7 and s['semester2_status'] in ['FAIL', 'WITHDREW', None]:
            is_failed = True
        
        if is_failed:
            failed_students.append(s)
        else:
            active_students.append(s)
    
    hod = None
    dean = None
    hod_record = Lecturer.query.filter_by(department_id=dept_id, role='head_of_department').first()
    if hod_record:
        hod = hod_record.full_name
    if department.faculty:
        dean_record = Lecturer.query.filter_by(faculty_id=department.faculty_id, role='dean').first()
        if dean_record:
            dean = dean_record.full_name
    
    print(f"Department query: dept={department.name}, active={len(active_students)}, failed={len(failed_students)}")
    
    return jsonify({
        'department': {
            'id': department.id,
            'name': department.name,
            'faculty': department.faculty.name if department.faculty else 'N/A'
        },
        'hod': hod or 'Not assigned',
        'dean': dean or 'Not assigned',
        'academic_year': academic_year or 'N/A',
        'total': len(active_students),
        'students': active_students,
        'failed_students': failed_students,
        'failed_count': len(failed_students),
    })

# ==================== FAILURE HISTORY ====================

@admin_bp.route('/api/failure-history/<string:student_id>', methods=['GET'])
@token_required
def failure_history(student_id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.gpa import StudentGPA
    from models.academic import CourseStudent, Course
    from models.reference import ReferenceGrade
    
    records = StudentGPA.query.filter(
        StudentGPA.student_id == student_id,
        StudentGPA.student_status.in_(['FAIL', 'WITHDREW', 'DOUBLE_FAIL'])
    ).order_by(StudentGPA.academic_year.desc(), StudentGPA.semester.desc()).all()
    
    student_name = 'Unknown'
    program_type = None
    enrollment = CourseStudent.query.filter_by(student_id=student_id).first()
    if enrollment:
        student_name = enrollment.student_name
        program_type = enrollment.program_type
    
    records_data = []
    seen_combinations = set()
    
    # Add GPA records
    for rec in records:
        key = f"{rec.academic_year}_{rec.level}_{rec.semester}"
        if key not in seen_combinations:
            seen_combinations.add(key)
            records_data.append({
                'id': rec.id,
                'academic_year': rec.academic_year,
                'level': rec.level,
                'semester': rec.semester,
                'gpa': round(rec.gpa, 2) if rec.gpa else None,
                'status': rec.student_status,
                'total_credit_hours': rec.total_credit_hours,
                'pending_references_count': rec.pending_references_count or 0,
                'created_at': rec.created_at.isoformat() if rec.created_at else None,
                'source': 'gpa'
            })
    
    # Also check for double fail references that might not have GPA records
    enrollments = CourseStudent.query.filter_by(student_id=student_id).all()
    for cs in enrollments:
        ref = ReferenceGrade.query.filter_by(course_id=cs.course_id, student_id=cs.id).first()
        if ref and ref.reference_status == 'double_fail':
            course = Course.query.get(cs.course_id)
            key = f"{course.academic_year}_{course.semester}_DOUBLE_FAIL"
            if key not in seen_combinations and course:
                seen_combinations.add(key)
                records_data.append({
                    'id': ref.id,
                    'academic_year': course.academic_year,
                    'level': course.semester.split(' - ')[0] if ' - ' in (course.semester or '') else 'N/A',
                    'semester': course.semester.split(' - ')[1] if ' - ' in (course.semester or '') else course.semester,
                    'gpa': 0.0,
                    'status': 'DOUBLE_FAIL',
                    'total_credit_hours': course.credit_hours,
                    'pending_references_count': 0,
                    'created_at': ref.updated_at.isoformat() if ref.updated_at else ref.created_at.isoformat() if ref.created_at else None,
                    'source': 'reference'
                })
    
    # Also check for F grades (failures)
    for cs in enrollments:
        if cs.grade == 'F':
            course = Course.query.get(cs.course_id)
            if course:
                # Check if there's already a GPA record for this semester
                sem_key = f"{course.academic_year}_{course.semester}"
                already_exists = any(
                    f"{r['academic_year']}_{r.get('level', '')} {r.get('semester', '')}".strip() == f"{course.academic_year} {course.semester}".strip()
                    for r in records_data
                )
                if not already_exists and course:
                    records_data.append({
                        'id': cs.id,
                        'academic_year': course.academic_year,
                        'level': course.semester.split(' - ')[0] if ' - ' in (course.semester or '') else 'N/A',
                        'semester': course.semester.split(' - ')[1] if ' - ' in (course.semester or '') else course.semester,
                        'gpa': 0.0,
                        'status': 'FAIL',
                        'total_credit_hours': course.credit_hours,
                        'pending_references_count': 0,
                        'created_at': cs.added_at.isoformat() if cs.added_at else None,
                        'source': 'course_grade'
                    })
    
    summary = {
        'total_failures': sum(1 for r in records_data if r['status'] == 'FAIL'),
        'total_withdrew': sum(1 for r in records_data if r['status'] == 'WITHDREW'),
        'total_double_fail': sum(1 for r in records_data if r['status'] == 'DOUBLE_FAIL'),
    }
    
    print(f"Failure history for {student_id}: {len(records_data)} records found")
    
    return jsonify({
        'student_id': student_id,
        'student_name': student_name,
        'program_type': program_type,
        'records': records_data,
        'total_records': len(records_data),
        'summary': summary
    })

@admin_bp.route('/api/delete-student/<string:student_id>', methods=['DELETE'])
@token_required
def delete_student(student_id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.reference import ReferenceGrade
    from models.academic import CourseStudent
    from models.gpa import StudentGPA, StudentAcademicStatus, StudentGradeRecord
    from models.user import Student
    
    try:
        enrollments = CourseStudent.query.filter_by(student_id=student_id).all()
        for e in enrollments:
            ReferenceGrade.query.filter_by(student_id=e.id).delete()
        CourseStudent.query.filter_by(student_id=student_id).delete()
        StudentGPA.query.filter_by(student_id=student_id).delete()
        StudentGradeRecord.query.filter_by(student_id=student_id).delete()
        StudentAcademicStatus.query.filter_by(student_id=student_id).delete()
        
        student = Student.query.filter_by(student_id=student_id).first()
        if student:
            db.session.delete(student)
        
        db.session.commit()
        return jsonify({'message': f'All data for student {student_id} deleted', 'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== NOTIFICATIONS ====================

@admin_bp.route('/notifications', methods=['GET'])
@token_required
def notifications():
    # Debug: print user info
    print(f"NOTIFICATIONS: user={request.user}")
    
    from models.notification import Notification
    
    admin_id = request.user['user_id']
    
    notifs = Notification.query.filter_by(
        user_id=admin_id,
        user_type='admin',
        is_dismissed=False
    ).order_by(Notification.created_at.desc()).limit(50).all()
    
    for n in notifs:
        if not n.is_read:
            n.is_read = True
    if notifs:
        db.session.commit()
    
    result = [n.to_dict() for n in notifs]
    print(f"Found {len(result)} notifications for admin {admin_id}")
    
    return jsonify({'notifications': result})


@admin_bp.route('/save-transcript', methods=['POST'])
@token_required
def save_transcript():
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    from models.session import TranscriptRecord
    import json
    from datetime import datetime
    
    data = request.get_json() or {}
    student_id = data.get('student_id')
    existing_id = data.get('existing_transcript_id')
    generated_id = data.get('generated_transcript_id')
    
    # If there's an existing transcript, invalidate it
    if existing_id:
        existing = TranscriptRecord.query.filter_by(transcript_id=existing_id).first()
        if existing:
            existing.is_valid = False
    
    # Use the frontend-generated ID or create new one
    transcript_id = generated_id
    if not transcript_id:
        import random
        date_part = datetime.utcnow().strftime('%Y%m%d')
        random_part = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        transcript_id = f"MMTU-TRN-{date_part}-{random_part}"
    
    # Check if this ID already exists
    existing = TranscriptRecord.query.filter_by(transcript_id=transcript_id).first()
    if existing:
        existing.is_valid = False
    
    transcript = TranscriptRecord(
        transcript_id=transcript_id,
        student_id=student_id,
        student_name=data.get('student_name'),
        program_type=data.get('program_type'),
        department_name=data.get('department_name'),
        generated_by_id=request.user['user_id'],
        generated_by_name=request.user.get('full_name', 'Admin'),
        transcript_data=json.dumps(data.get('transcript_data', {})),
    )
    db.session.add(transcript)
    db.session.commit()
    
    return jsonify({
        'message': 'Transcript saved successfully',
        'transcript_id': transcript_id,
        'previous_id_invalidated': existing_id if existing_id else None,
        'transcript': transcript.to_dict()
    })

@admin_bp.route('/verify-transcript/<string:transcript_id>', methods=['GET'])
@token_required
def verify_transcript(transcript_id):
    if request.user['user_type'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    from models.session import TranscriptRecord
    
    transcript = TranscriptRecord.query.filter_by(transcript_id=transcript_id).first()
    
    if not transcript:
        return jsonify({
            'valid': False,
            'message': 'No transcript found with this ID. This transcript is not authentic.'
        }), 404
    
    return jsonify({
        'valid': transcript.is_valid,
        'message': 'Transcript verified successfully. This is an authentic MMTU transcript.',
        'transcript': transcript.to_dict()
    })


@admin_bp.route('/notifications/count', methods=['GET'])
@token_required
def notification_count():
    from models.notification import Notification
    count = Notification.query.filter_by(
        user_id=request.user['user_id'],
        user_type='admin',
        is_read=False,
        is_dismissed=False
    ).count()
    return jsonify({'count': count})
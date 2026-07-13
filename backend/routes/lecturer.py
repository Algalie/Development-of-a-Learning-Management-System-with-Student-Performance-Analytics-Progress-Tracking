from flask import Blueprint, request, jsonify
from extensions import db
from middleware.jwt_required import token_required
from datetime import datetime
from werkzeug.security import generate_password_hash

lecturer_bp = Blueprint('lecturer', __name__)

# ==================== HELPERS ====================

def get_lecturer():
    """Get current lecturer from token"""
    from models.user import Lecturer
    return Lecturer.query.get(request.user['user_id'])

def get_grade_boundaries():
    """Standard grade boundaries"""
    return [
        {'grade': 'A', 'min': 75, 'max': 100, 'points': 5.0},
        {'grade': 'B', 'min': 65, 'max': 74, 'points': 4.0},
        {'grade': 'C', 'min': 50, 'max': 64, 'points': 3.0},
        {'grade': 'D', 'min': 40, 'max': 49, 'points': 2.0},
        {'grade': 'E', 'min': 30, 'max': 39, 'points': 1.0},
        {'grade': 'F', 'min': 0, 'max': 29, 'points': 0.0},
    ]

def calculate_grade(total_score):
    """Calculate grade and points from total score"""
    for boundary in get_grade_boundaries():
        if total_score >= boundary['min'] and total_score <= boundary['max']:
            return boundary['grade'], boundary['points']
    return 'F', 0.0

def validate_student_id(student_id):
    """Student ID must be numbers only, no letters"""
    if not student_id:
        return False, "Student ID is required"
    if not student_id.isdigit():
        return False, "Student ID must contain numbers only (no letters allowed)"
    return True, None

def filter_qualified_students(student_ids, department_id, course_level):
    """
    Filter out students who FAILED or WITHDREW from the previous semester.
    For Semester 2 courses, check Semester 1 GPA status.
    Students with cleared references who now PASS are INCLUDED.
    Students with double fail references are EXCLUDED.
    """
    from models.gpa import StudentGPA
    from models.reference import ReferenceGrade
    from models.academic import CourseStudent as CS

    # Year 1 Semester 1: All new students qualify
    if course_level == 'Year 1' or not course_level:
        return student_ids, [], []

    # For Semester 2: Check Semester 1 status
    # For Year 2: Check Level 100 (Year 1) status
    level_map = {
        'Year 2': 'Level 100',
        'Year 3': 'Level 200',
        'Year 4': 'Level 300',
    }
    previous_level = level_map.get(course_level)

    if not previous_level:
        return student_ids, [], []

    # Get all PASS students from previous level
    passed_gpas = StudentGPA.query.filter_by(
        level=previous_level,
        semester='Semester 1',  # Check Semester 1 specifically
        student_status='PASS'
    ).all()
    passed_ids = set(g.student_id for g in passed_gpas)

    # Also check for students with FAIL status but cleared references
    # These students become PASS after reference is cleared
    fail_gpas = StudentGPA.query.filter_by(
        level=previous_level,
        semester='Semester 1',
        student_status='FAIL'
    ).all()
    
    fail_student_ids = set(g.student_id for g in fail_gpas)
    
    # Check which FAIL students have cleared references
    for sid in list(fail_student_ids):
        # Get all E/F grades for this student
        enrollments = CS.query.filter_by(student_id=sid).all()
        all_cleared = True
        has_double_fail = False
        
        for cs in enrollments:
            ref = ReferenceGrade.query.filter_by(
                course_id=cs.course_id, student_id=cs.id
            ).first()
            if ref:
                if ref.reference_status == 'double_fail':
                    has_double_fail = True
                    all_cleared = False
                elif ref.reference_status == 'pending':
                    all_cleared = False
        
        if all_cleared and not has_double_fail:
            passed_ids.add(sid)  # Treat as PASS
    
    qualified = []
    disqualified = []

    for sid in student_ids:
        if sid in passed_ids:
            qualified.append(sid)
        else:
            gpa_record = StudentGPA.query.filter_by(
                student_id=sid, level=previous_level, semester='Semester 1'
            ).first()
            if gpa_record:
                if gpa_record.student_status in ['FAIL', 'WITHDREW']:
                    # Check if FAIL but has double fail
                    if gpa_record.student_status == 'FAIL':
                        enrollments = CS.query.filter_by(student_id=sid).all()
                        has_double = False
                        for cs in enrollments:
                            ref = ReferenceGrade.query.filter_by(
                                course_id=cs.course_id, student_id=cs.id
                            ).first()
                            if ref and ref.reference_status == 'double_fail':
                                has_double = True
                        if has_double:
                            disqualified.append({
                                'student_id': sid,
                                'reason': 'DOUBLE_FAIL — Must repeat the course'
                            })
                        else:
                            disqualified.append({
                                'student_id': sid,
                                'reason': f'Semester 1 status: {gpa_record.student_status} (GPA: {gpa_record.gpa})'
                            })
                    else:
                        disqualified.append({
                            'student_id': sid,
                            'reason': f'Semester 1 status: {gpa_record.student_status} (GPA: {gpa_record.gpa})'
                        })
                else:
                    qualified.append(sid)
            else:
                qualified.append(sid)

    return qualified, disqualified, []


# ==================== DASHBOARD ====================

@lecturer_bp.route('/dashboard', methods=['GET'])
@token_required
def dashboard():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.user import Lecturer
    from models.academic import Course
    from models.approval import ApprovalRequest
    from models.notification import Notification

    lecturer = Lecturer.query.get(request.user['user_id'])
    if not lecturer:
        return jsonify({'error': 'Lecturer not found'}), 404

    # Get courses assigned to this lecturer
    assigned_courses = Course.query.filter_by(
        assigned_lecturer_id=lecturer.id, is_active=True
    ).all()

    # Also get courses created by this lecturer (HOD)
    created_courses = Course.query.filter_by(
        created_by_id=lecturer.id, is_active=True
    ).all()

    # Combine unique courses
    all_course_ids = set()
    active_courses = []
    for c in assigned_courses + created_courses:
        if c.id not in all_course_ids:
            all_course_ids.add(c.id)
            active_courses.append(c)

    draft_courses = [c for c in active_courses if c.approval_status == 'draft']
    total_students = sum(len(c.students) for c in active_courses)

    # Pending approvals based on role
    pending_course = 0
    pending_grades = 0
    pending_ref = 0

    if lecturer.role == 'head_of_department':
        pending_course = ApprovalRequest.query.filter_by(
            submission_type='course', status='pending_hod',
            target_department_id=lecturer.department_id
        ).count()
        pending_grades = ApprovalRequest.query.filter_by(
            submission_type='grades', status='pending_hod',
            target_department_id=lecturer.department_id
        ).count()
        pending_ref = ApprovalRequest.query.filter_by(
            submission_type='reference', status='pending_hod',
            target_department_id=lecturer.department_id
        ).count()

    elif lecturer.role == 'dean':
        pending_course = ApprovalRequest.query.filter_by(
            submission_type='course', status='pending_dean',
            target_faculty_id=lecturer.faculty_id
        ).count()
        pending_grades = ApprovalRequest.query.filter_by(
            submission_type='grades', status='pending_dean',
            target_faculty_id=lecturer.faculty_id
        ).count()
        pending_ref = ApprovalRequest.query.filter_by(
            submission_type='reference', status='pending_dean',
            target_faculty_id=lecturer.faculty_id
        ).count()

    elif lecturer.role == 'exam_officer':
        pending_course = ApprovalRequest.query.filter_by(
            submission_type='course', status='pending_exam'
        ).count()
        pending_grades = ApprovalRequest.query.filter_by(
            submission_type='grades', status='pending_exam'
        ).count()
        pending_ref = ApprovalRequest.query.filter_by(
            submission_type='reference', status='pending_exam'
        ).count()

    # My pending submissions (as a lecturer)
    my_pending = ApprovalRequest.query.filter_by(creator_id=lecturer.id).filter(
        ApprovalRequest.status.in_(['pending_hod', 'pending_dean', 'pending_exam'])
    ).count()

    unread = Notification.query.filter_by(
        user_id=lecturer.id, user_type='lecturer',
        is_read=False, is_dismissed=False
    ).count()

    return jsonify({
        'lecturer': lecturer.to_dict(),
        'stats': {
            'active_courses': len(active_courses),
            'draft_courses': len(draft_courses),
            'total_students': total_students,
            'pending_course_approvals': pending_course,
            'pending_grade_approvals': pending_grades,
            'pending_reference_approvals': pending_ref,
            'total_pending_approvals': pending_course + pending_grades + pending_ref,
            'unread_notifications': unread,
            'my_pending_submissions': my_pending,
        }
    })


# ==================== COURSES ====================

@lecturer_bp.route('/courses', methods=['GET'])
@token_required
def courses():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course
    lecturer = get_lecturer()

    # Courses assigned TO this lecturer (they teach these)
    assigned = Course.query.filter_by(
        assigned_lecturer_id=lecturer.id
    ).order_by(Course.created_at.desc()).all()

    # Courses created BY this lecturer (for HOD - they manage these)
    created = Course.query.filter_by(
        created_by_id=lecturer.id
    ).order_by(Course.created_at.desc()).all()

    # My courses = assigned to me OR created by me AND assigned to me
    my_courses = []
    created_only = []  # Courses I created but assigned to others
    
    seen = set()
    for c in assigned:
        if c.id not in seen:
            seen.add(c.id)
            my_courses.append(c)
    
    for c in created:
        if c.id not in seen:
            seen.add(c.id)
            if c.assigned_lecturer_id == lecturer.id:
                my_courses.append(c)
            else:
                created_only.append(c)

    active = [c for c in my_courses if c.is_active]
    archived = [c for c in my_courses if not c.is_active]

    def format_course(c):
        cd = c.to_dict(include_relations=True)
        cd['students_count'] = len(c.students)
        cd['is_mine'] = c.assigned_lecturer_id == lecturer.id
        return cd

    return jsonify({
        'active_courses': [format_course(c) for c in active],
        'archived_courses': [format_course(c) for c in archived],
        'created_courses': [format_course(c) for c in created_only],  # Courses HOD created for others
        'can_create_courses': lecturer.can_create_courses(),
        'is_approver': lecturer.is_approver(),
    })


@lecturer_bp.route('/course-history', methods=['GET'])
@token_required
def course_history():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    lecturer = get_lecturer()
    courses = Course.query.filter_by(
        created_by_id=lecturer.id, is_active=False
    ).order_by(Course.created_at.desc()).all()
    return jsonify({'courses': [c.to_dict(include_relations=True) for c in courses]})


@lecturer_bp.route('/create-course', methods=['POST'])
@token_required
def create_course():
    """ONLY HOD can create courses. Assigns lecturer to the course."""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.user import Lecturer
    from models.academic import Course, CourseStudent
    from models.gpa import StudentGPA

    lecturer = Lecturer.query.get(request.user['user_id'])

    # ✅ CHECK: Only HOD can create courses
    if not lecturer.can_create_courses():
        return jsonify({
            'message': 'Only Head of Department can create courses.',
            'code': 'PERMISSION_DENIED'
        }), 403

    data = request.get_json() or {}

    year = data.get('year', '')
    semester = data.get('semester', '')
    program_type = data.get('program_type', 'BSc')
    full_semester = f"{year} - {semester}"

    dept_choice = data.get('dept_choice', 'default')
    faculty_id = None
    department_id = None

    if dept_choice == 'other':
        faculty_id = data.get('final_faculty_id')
        department_id = data.get('final_department_id')
    else:
        if lecturer.department:
            department_id = lecturer.department_id
            faculty_id = lecturer.department.faculty_id
        elif lecturer.faculty:
            faculty_id = lecturer.faculty_id

    # Determine semester number
    semester_num = 1 if 'Semester 1' in semester else 2 if 'Semester 2' in semester else None

    course = Course(
        course_code=data.get('course_code'),
        course_name=data.get('course_name'),
        credit_hours=int(data.get('credit_hours', 3)),
        semester=full_semester,
        academic_year=data.get('academic_year'),
        created_by_id=lecturer.id,
        assigned_lecturer_id=data.get('assigned_lecturer_id') or lecturer.id,
        faculty_id=faculty_id,
        department_id=department_id,
        course_type='departmental',
        is_active=True,
        program_type=program_type,
        course_level=year,
        course_semester_num=semester_num,
        approval_status='draft',
        is_editable=True,
    )

    # Set CA/Exam weights based on program type
    course.set_program_weights()

    db.session.add(course)
    db.session.flush()

    # Auto-enroll for Year 2+ courses
    auto_enrolled = 0
    if year in ['Year 2', 'Year 3', 'Year 4'] and department_id:
        level_map = {
            'Year 2': 'Level 100',
            'Year 3': 'Level 200',
            'Year 4': 'Level 300',
        }
        previous_level = level_map.get(year)
        if previous_level:
            passed_gpas = StudentGPA.query.filter_by(
                level=previous_level, student_status='PASS'
            ).all()
            passed_ids = list(set(g.student_id for g in passed_gpas))
            for sid in passed_ids:
                already = CourseStudent.query.filter_by(
                    course_id=course.id, student_id=sid
                ).first()
                if already:
                    continue
                existing = CourseStudent.query.filter_by(student_id=sid).join(Course).filter(
                    Course.department_id == department_id
                ).first()
                if existing:
                    db.session.add(CourseStudent(
                        course_id=course.id,
                        student_id=sid,
                        student_name=existing.student_name,
                        added_by_id=lecturer.id,
                        program_type=program_type,
                        student_department_id=department_id,
                        enrollment_method='auto',
                    ))
                    auto_enrolled += 1

    db.session.commit()
    return jsonify({
        'message': f'Course created! {auto_enrolled} students auto-enrolled.',
        'course': course.to_dict(include_relations=True),
        'auto_enrolled': auto_enrolled,
    })


@lecturer_bp.route('/course/<int:id>', methods=['GET'])
@token_required
def view_course(id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course
    from models.approval import ApprovalRequest
    from models.reference import ReferenceGrade

    course = Course.query.get_or_404(id)

    # Check: Lecturer must be assigned to this course or be the creator
    lecturer = get_lecturer()
    if course.assigned_lecturer_id != lecturer.id and course.created_by_id != lecturer.id:
        return jsonify({'error': 'You are not assigned to this course'}), 403

    # Get grade approval (combined CA+Exam now)
    grade_approval = ApprovalRequest.query.filter_by(
        submission_type='grades', submission_id=id
    ).first()

    course_approval = ApprovalRequest.query.filter_by(
        submission_type='course', submission_id=id
    ).first()

    # Grade submission status
    grade_status = 'not_submitted'
    grade_status_text = 'Not Submitted'
    grade_status_class = 'badge-not-submitted'
    can_edit_grades = False
    show_submit_grades = False

    if grade_approval:
        if grade_approval.status == 'finalized':
            grade_status = 'finalized'
            grade_status_text = 'Finalized'
            grade_status_class = 'badge-approved'
        elif grade_approval.status == 'rejected':
            grade_status = 'rejected'
            grade_status_text = 'Rejected'
            grade_status_class = 'badge-rejected'
            can_edit_grades = True
            show_submit_grades = True
        else:
            grade_status = 'pending'
            grade_status_text = grade_approval.get_status_display()
            grade_status_class = 'badge-pending'
    elif course.approval_status == 'finalized':
        can_edit_grades = True
        all_graded = all(
            s.continuous_assessment is not None and s.exam_score is not None
            for s in course.students
        )
        show_submit_grades = all_graded and len(course.students) > 0

    grades_finalized = (grade_status == 'finalized')

    # Build course data
    course_data = {
        'id': course.id,
        'course_code': course.course_code,
        'course_name': course.course_name,
        'credit_hours': course.credit_hours,
        'semester': course.semester,
        'academic_year': course.academic_year,
        'program_type': course.program_type,
        'course_level': course.course_level,
        'course_semester_num': course.course_semester_num,
        'ca_max_score': course.ca_max_score,
        'exam_max_score': course.exam_max_score,
        'approval_status': course.approval_status,
        'is_active': course.is_active,
        'is_editable': course.is_editable,
        'created_by_id': course.created_by_id,
        'assigned_lecturer_id': course.assigned_lecturer_id,
        'created_by': {
            'id': course.created_by.id,
            'full_name': course.created_by.full_name,
            'lecturer_id': course.created_by.lecturer_id,
        } if course.created_by else None,
        'assigned_lecturer': {
            'id': course.assigned_lecturer.id,
            'full_name': course.assigned_lecturer.full_name,
            'lecturer_id': course.assigned_lecturer.lecturer_id,
        } if course.assigned_lecturer else None,
        'faculty': {
            'id': course.faculty.id,
            'name': course.faculty.name,
        } if course.faculty else None,
        'department': {
            'id': course.department.id,
            'name': course.department.name,
        } if course.department else None,
        'students': [{
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
            'submission_signature': s.submission_signature,
            'enrollment_method': s.enrollment_method,
        } for s in course.students] if course.students else [],
        'assessments': [{
            'id': a.id,
            'assessment_name': a.assessment_name,
            'assessment_type': a.assessment_type,
            'max_score': a.max_score,
            'weight': a.weight,
        } for a in course.assessments] if course.assessments else [],
        'reference_grades': [{
            'id': r.id,
            'student_id': r.student_id,
            'original_grade': r.original_grade,
            'reference_grade': r.reference_grade,
            'display_grade': r.display_grade,
            'reference_status': r.reference_status,
            'approval_status': r.approval_status,
        } for r in course.reference_grades] if course.reference_grades else [],
        'created_at': course.created_at.isoformat() if course.created_at else None,
    }

    return jsonify({
        'course': course_data,
        'grade_status': grade_status,
        'grade_status_text': grade_status_text,
        'grade_status_class': grade_status_class,
        'can_edit_grades': can_edit_grades,
        'show_submit_grades': show_submit_grades,
        'grades_finalized': grades_finalized,
        'grade_approval': grade_approval.to_dict() if grade_approval else None,
        'course_approval': course_approval.to_dict() if course_approval else None,
    })


# ==================== STUDENTS ====================

@lecturer_bp.route('/course/<int:id>/add-students', methods=['POST'])
@token_required
def add_students(id):
    """Add students via manual entry, CSV, or API. With filtering for Year 1 Sem 2+."""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course, CourseStudent
    from models.user import Student, Lecturer

    lecturer = get_lecturer()
    course = Course.query.get_or_404(id)

    # Check lecturer is assigned
    if course.assigned_lecturer_id != lecturer.id and course.created_by_id != lecturer.id:
        return jsonify({'error': 'You are not assigned to this course'}), 403

    if not course.is_editable:
        return jsonify({'message': 'Course is not editable'}), 400

    data = request.get_json() or {}
    method = data.get('method', 'manual')  # 'manual', 'csv', 'api', 'auto'
    student_ids = data.get('student_ids', [])
    student_names = data.get('student_names', [])
    apply_filter = data.get('apply_filter', False)  # Whether to filter out failed students

    if method == 'manual':
        # Manual entry validation
        if not student_ids or not student_names:
            return jsonify({'message': 'Student IDs and names required'}), 400

        if len(student_ids) != len(student_names):
            return jsonify({'message': 'Each student ID must have a corresponding name'}), 400

    elif method == 'csv':
        # CSV data validation
        csv_data = data.get('csv_data', [])
        if not csv_data:
            return jsonify({'message': 'CSV data required'}), 400
        student_ids = [row.get('student_id', '').strip() for row in csv_data]
        student_names = [row.get('student_name', '').strip() for row in csv_data]

    elif method == 'api':
        # API call - data comes from external source
        api_data = data.get('api_data', [])
        if not api_data:
            return jsonify({'message': 'API data required'}), 400
        student_ids = [row.get('student_id', '').strip() for row in api_data]
        student_names = [row.get('student_name', '').strip() for row in api_data]

    # Validate student IDs (numbers only)
    invalid_ids = []
    for sid in student_ids:
        valid, error = validate_student_id(sid)
        if not valid:
            invalid_ids.append({'student_id': sid, 'error': error})

    if invalid_ids:
        return jsonify({
            'message': 'Invalid student IDs found',
            'code': 'INVALID_STUDENT_IDS',
            'invalid_ids': invalid_ids,
        }), 400

    # Filter out failed/withdrew students for Year 1 Sem 2+
    disqualified = []
    if apply_filter or course.course_semester_num == 2 or course.course_level != 'Year 1':
        student_ids, disqualified, _ = filter_qualified_students(
            student_ids, course.department_id, course.course_level
        )

    # Add students
    added = 0
    skipped = 0
    for i in range(len(student_ids)):
        if not student_ids[i] or not student_names[i]:
            continue

        existing = CourseStudent.query.filter_by(
            course_id=id, student_id=student_ids[i]
        ).first()
        if existing:
            skipped += 1
            continue

        db.session.add(CourseStudent(
            course_id=id,
            student_id=student_ids[i],
            student_name=student_names[i],
            added_by_id=lecturer.id,
            program_type=course.program_type,
            student_department_id=course.department_id,
            enrollment_method=method,
        ))

        # Create Student account if not exists
        existing_account = Student.query.filter_by(student_id=student_ids[i]).first()
        if not existing_account:
            db.session.add(Student(
                student_id=student_ids[i],
                email=f"{student_ids[i]}@mmtu.edu.sl",
                password_hash=generate_password_hash(student_ids[i]),
            ))
        added += 1

    db.session.commit()

    return jsonify({
        'message': f'{added} students added! {skipped} skipped (already enrolled).',
        'added': added,
        'skipped': skipped,
        'disqualified': disqualified,
        'total_disqualified': len(disqualified),
    })


@lecturer_bp.route('/course/<int:id>/auto-enroll-students', methods=['POST'])
@token_required
def auto_enroll_students(id):
    """Auto-enroll qualified students from previous semester to this course"""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course, CourseStudent
    from models.gpa import StudentGPA
    from models.reference import ReferenceGrade

    lecturer = get_lecturer()
    course = Course.query.get_or_404(id)

    if course.assigned_lecturer_id != lecturer.id and course.created_by_id != lecturer.id:
        return jsonify({'error': 'You are not assigned to this course'}), 403

    # Only block Year 1 Semester 1
    if course.course_level == 'Year 1' and course.course_semester_num == 1:
        return jsonify({'message': 'Auto-enrollment not available for Year 1 Semester 1. Use manual entry for new students.'}), 400

    # Determine which semester and previous level to check
    level_map = {
    'Year 1': 'Year 1',
    'Year 2': 'Year 1',
    'Year 3': 'Year 2',
    'Year 4': 'Year 3',
}
    previous_level = level_map.get(course.course_level)

    if not previous_level:
        return jsonify({'message': 'Cannot determine previous level'}), 400

    # Get PASS students from previous level, Semester 1
    passed_gpas = StudentGPA.query.filter_by(
        level=previous_level,
        semester='Semester 1',
        student_status='PASS'
    ).all()
    passed_ids = set(g.student_id for g in passed_gpas)

    # Also include FAIL students who cleared all references
    fail_gpas = StudentGPA.query.filter_by(
        level=previous_level,
        semester='Semester 1',
        student_status='FAIL'
    ).all()
    
    for gpa in fail_gpas:
        sid = gpa.student_id
        enrollments = CourseStudent.query.filter_by(student_id=sid).all()
        all_cleared = True
        
        for cs in enrollments:
            ref = ReferenceGrade.query.filter_by(
                course_id=cs.course_id, student_id=cs.id
            ).first()
            if ref:
                if ref.reference_status in ['double_fail', 'pending']:
                    all_cleared = False
        
        if all_cleared:
            passed_ids.add(sid)

    print(f"Auto-enroll: {len(passed_ids)} qualified students for {course.course_code}")

    auto_enrolled = 0
    for sid in passed_ids:
        already = CourseStudent.query.filter_by(course_id=id, student_id=sid).first()
        if already:
            continue
        
        existing = CourseStudent.query.filter_by(student_id=sid).join(Course).filter(
            Course.department_id == course.department_id
        ).first()
        
        if existing:
            db.session.add(CourseStudent(
                course_id=id,
                student_id=sid,
                student_name=existing.student_name,
                added_by_id=lecturer.id,
                program_type=course.program_type,
                student_department_id=course.department_id,
                enrollment_method='auto',
            ))
            auto_enrolled += 1

    db.session.commit()
    return jsonify({
        'message': f'{auto_enrolled} students auto-enrolled!',
        'count': auto_enrolled,
    })


@lecturer_bp.route('/api/get-student/<string:student_id>', methods=['GET'])
@token_required
def get_student(student_id):
    """Look up a student by ID"""
    from models.academic import CourseStudent
    student = CourseStudent.query.filter_by(student_id=student_id).first()
    if student:
        return jsonify({
            'found': True,
            'student_id': student.student_id,
            'student_name': student.student_name,
        })
    return jsonify({'found': False}), 404


# ==================== GRADES (COMBINED CA + EXAM) ====================

@lecturer_bp.route('/course/<int:id>/enter-grades', methods=['POST'])
@token_required
def enter_grades(id):
    """
    Enter both CA and Exam grades together.
    CA max and Exam max depend on program type (Degree/Diploma).
    """
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course, CourseStudent
    from models.reference import ReferenceGrade

    lecturer = get_lecturer()
    course = Course.query.get_or_404(id)

    if course.assigned_lecturer_id != lecturer.id and course.created_by_id != lecturer.id:
        return jsonify({'error': 'You are not assigned to this course'}), 403

    data = request.get_json() or {}
    students = CourseStudent.query.filter_by(course_id=id).all()

    ca_max = course.ca_max_score  # 40 for Degree, 30 for Diploma
    exam_max = course.exam_max_score  # 60 for Degree, 70 for Diploma

    for student in students:
        # CA Scores
        test = data.get(f'test_{student.id}')
        assignment = data.get(f'assignment_{student.id}')
        attendance = data.get(f'attendance_{student.id}')

        if test is not None and test != '':
            test = float(test)
            if test > 20:
                return jsonify({'message': f'Test score for {student.student_name} cannot exceed 20'}), 400
            student.test_score = test

        if assignment is not None and assignment != '':
            assignment = float(assignment)
            if assignment > 10:
                return jsonify({'message': f'Assignment score for {student.student_name} cannot exceed 10'}), 400
            student.assignment_score = assignment

        if attendance is not None and attendance != '':
            attendance = float(attendance)
            if attendance > 10:
                return jsonify({'message': f'Attendance score for {student.student_name} cannot exceed 10'}), 400
            student.attendance_score = attendance

        # Calculate CA total
        ca = (student.test_score or 0) + (student.assignment_score or 0) + (student.attendance_score or 0)
        if ca > ca_max:
            return jsonify({'message': f'CA total for {student.student_name} exceeds {ca_max}'}), 400
        student.continuous_assessment = ca

        # Exam Score
        exam = data.get(f'exam_{student.id}')
        if exam is not None and exam != '':
            exam = float(exam)
            if exam > exam_max:
                return jsonify({'message': f'Exam score for {student.student_name} cannot exceed {exam_max}'}), 400
            student.exam_score = exam

            # Calculate total and grade
            total = ca + exam
            student.total_score = total
            grade, points = calculate_grade(total)
            student.grade = grade
            student.grade_points = points

            # Create reference for E/F grades
            if grade in ['E', 'F']:
                existing_ref = ReferenceGrade.query.filter_by(
                    course_id=id, student_id=student.id
                ).first()
                if not existing_ref:
                    db.session.add(ReferenceGrade(
                        course_id=id,
                        student_id=student.id,
                        original_grade=grade,
                        original_score=total,
                        original_credit_hours=course.credit_hours,
                        reference_status='pending',
                        approval_status='draft',
                    ))

    db.session.commit()
    return jsonify({
        'message': 'Grades saved successfully!',
        'ca_max': ca_max,
        'exam_max': exam_max,
        'program_type': course.program_type,
    })


# ==================== SUBMISSION (COMBINED) ====================

@lecturer_bp.route('/submit-grades/<int:submission_id>', methods=['POST'])
@token_required
def submit_grades(submission_id):
    """
    Submit CA + Exam grades together with signature.
    submission_type = 'grades' (combined)
    """
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.user import Lecturer
    from models.academic import Course
    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification

    lecturer = Lecturer.query.get(request.user['user_id'])
    course = Course.query.get(submission_id)

    if not course:
        return jsonify({'message': 'Course not found'}), 404

    if course.assigned_lecturer_id != lecturer.id and course.created_by_id != lecturer.id:
        return jsonify({'error': 'You are not assigned to this course'}), 403

    # Check all students have grades
    ungraded = [s for s in course.students if s.total_score is None]
    if ungraded:
        return jsonify({
            'message': f'{len(ungraded)} students still need grades',
            'code': 'INCOMPLETE_GRADES',
        }), 400

    data = request.get_json() or {}
    signature = data.get('signature', lecturer.full_name)

    # Save signature to course students
    for student in course.students:
        student.submission_signature = signature
        student.submission_signed_at = datetime.utcnow()

    department_id = course.department_id
    faculty_id = course.faculty_id

    # Check for existing submission
    existing = ApprovalRequest.query.filter_by(
        submission_type='grades', submission_id=submission_id
    ).first()

    if existing and existing.status not in ['rejected', 'draft']:
        return jsonify({'message': 'Grades already submitted'}), 400

    if existing and existing.status == 'rejected':
        req = existing
        req.status = 'pending_hod'
        req.submitted_at = datetime.utcnow()
        req.rejected_at = None
        req.signature = signature
        for step in req.steps:
            step.status = 'pending' if step.step_order == 1 else 'waiting'
            step.rejection_reason = None
    else:
        req = ApprovalRequest(
            submission_type='grades',
            submission_id=submission_id,
            course_id=course.id,
            creator_id=lecturer.id,
            creator_role=lecturer.role,
            current_level='hod',
            target_department_id=department_id,
            target_faculty_id=faculty_id,
            status='pending_hod',
            submitted_at=datetime.utcnow(),
            signature=signature,
        )
        db.session.add(req)
        db.session.flush()
        for i, level in enumerate(['hod', 'dean', 'exam']):
            db.session.add(ApprovalStep(
                request_id=req.id,
                step_order=i + 1,
                level=level,
                status='pending' if i == 0 else 'waiting',
            ))

    # Notify HOD
    hod = Lecturer.query.filter_by(
        department_id=department_id, role='head_of_department'
    ).first() if department_id else None

    if not hod and faculty_id:
        hod = Lecturer.query.filter_by(
            faculty_id=faculty_id, role='dean'
        ).first()

    if hod and hod.id != lecturer.id:
        db.session.add(Notification(
            user_id=hod.id,
            user_type='lecturer',
            title='New Grade Submission',
            message=f'{lecturer.full_name} submitted grades for {course.course_code}',
            notification_type='submission',
            request_id=req.id,
        ))

    db.session.commit()
    return jsonify({
        'message': 'Grades submitted for approval!',
        'signature': signature,
        'status': req.status,
    })


@lecturer_bp.route('/submit/<string:submission_type>/<int:submission_id>', methods=['POST'])
@token_required
def submit_for_approval(submission_type, submission_id):
    """
    Handle course submission and reference submission.
    Grade submission now uses /submit-grades endpoint.
    """
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.user import Lecturer
    from models.academic import Course
    from models.reference import ReferenceGrade
    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification

    lecturer = Lecturer.query.get(request.user['user_id'])
    course = None
    department_id = None
    faculty_id = None

    if submission_type == 'course':
        course = Course.query.get(submission_id)
        if not course or len(course.students) == 0:
            return jsonify({'message': 'Add students first'}), 400
        if course.approval_status == 'finalized':
            return jsonify({'message': 'Course already finalized'}), 400
        department_id = course.department_id
        faculty_id = course.faculty_id

    elif submission_type == 'reference':
        ref = ReferenceGrade.query.get(submission_id)
        if not ref:
            return jsonify({'message': 'Reference not found'}), 404
        if not ref.reference_grade:
            return jsonify({'message': 'Enter reference grade first'}), 400
        course = ref.course
        department_id = course.department_id if course else None
        faculty_id = course.faculty_id if course else None

    else:
        return jsonify({'message': f'Use /submit-grades for grade submission'}), 400

    existing = ApprovalRequest.query.filter_by(
        submission_type=submission_type, submission_id=submission_id
    ).first()

    if existing and existing.status not in ['rejected', 'draft']:
        return jsonify({'message': 'Already submitted'}), 400

    if existing and existing.status == 'rejected':
        req = existing
        req.status = 'pending_hod'
        req.submitted_at = datetime.utcnow()
        req.rejected_at = None
        for step in req.steps:
            step.status = 'pending' if step.step_order == 1 else 'waiting'
            step.rejection_reason = None
    else:
        req = ApprovalRequest(
            submission_type=submission_type,
            submission_id=submission_id,
            course_id=course.id if course else (
                submission_id if submission_type in ['course'] else None
            ),
            creator_id=lecturer.id,
            creator_role=lecturer.role,
            current_level='hod',
            target_department_id=department_id,
            target_faculty_id=faculty_id,
            status='pending_hod',
            submitted_at=datetime.utcnow(),
        )
        db.session.add(req)
        db.session.flush()
        for i, level in enumerate(['hod', 'dean', 'exam']):
            db.session.add(ApprovalStep(
                request_id=req.id,
                step_order=i + 1,
                level=level,
                status='pending' if i == 0 else 'waiting',
            ))

    if submission_type == 'course' and course:
        course.approval_status = 'pending_hod'
        course.is_editable = False

    elif submission_type == 'reference':
        ref = ReferenceGrade.query.get(submission_id)
        if ref:
            ref.submitted_for_approval = True
            ref.approval_status = 'pending_hod'

    # Notify HOD
    hod = Lecturer.query.filter_by(
        department_id=department_id, role='head_of_department'
    ).first() if department_id else None
    if not hod and faculty_id:
        hod = Lecturer.query.filter_by(faculty_id=faculty_id, role='dean').first()
    if hod and hod.id != lecturer.id:
        db.session.add(Notification(
            user_id=hod.id,
            user_type='lecturer',
            title=f'New {submission_type.upper()} Submission',
            message=f'{lecturer.full_name} submitted for your approval',
            notification_type='submission',
            request_id=req.id,
        ))

    db.session.commit()
    return jsonify({'message': f'{submission_type.upper()} submitted for approval!'})


# ==================== APPROVALS ====================

@lecturer_bp.route('/approve/<int:id>', methods=['POST'])
@token_required
def approve_submission(id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification
    from models.academic import CourseStudent
    from models.reference import ReferenceGrade
    from models.user import Admin, Lecturer

    lecturer = get_lecturer()
    req = ApprovalRequest.query.get_or_404(id)

    if req.creator_id == lecturer.id:
        return jsonify({'message': 'Cannot approve your own submission'}), 400

    data = request.get_json() or {}
    signature = data.get('signature', lecturer.full_name)

    # Approve current step
    current_step = ApprovalStep.query.filter_by(
        request_id=id, level=req.current_level, status='pending'
    ).first()

    if current_step:
        current_step.status = 'approved'
        current_step.approver_id = lecturer.id
        current_step.approved_at = datetime.utcnow()
        current_step.signature = signature

    chain = ['hod', 'dean', 'exam']
    current_idx = chain.index(req.current_level) if req.current_level in chain else -1

    if current_idx >= 0 and current_idx + 1 < len(chain):
        # Move to next level
        next_level = chain[current_idx + 1]
        req.current_level = next_level
        req.status = f'pending_{next_level}'
        next_step = ApprovalStep.query.filter_by(request_id=id, level=next_level).first()
        if next_step:
            next_step.status = 'pending'

        # Update course approval status
        if req.submission_type == 'course' and req.course:
            req.course.approval_status = req.status

        # Notify next approver
        if next_level == 'dean' and req.target_faculty_id:
            dean = Lecturer.query.filter_by(
                faculty_id=req.target_faculty_id, role='dean'
            ).first()
            if dean:
                db.session.add(Notification(
                    user_id=dean.id, user_type='lecturer',
                    title=f'{req.submission_type.upper()} Requires Approval',
                    message=f'From {lecturer.full_name}',
                    notification_type='approval_progress', request_id=req.id,
                ))

        elif next_level == 'exam':
            for admin in Admin.query.all():
                db.session.add(Notification(
                    user_id=admin.id, user_type='admin',
                    title=f'{req.submission_type.upper()} at Exam Office',
                    message=f'From {lecturer.full_name}',
                    notification_type='submission', request_id=req.id,
                ))
    else:
        # Final approval
        req.status = 'finalized'
        req.finalized_at = datetime.utcnow()
        req.signature = signature

        if req.submission_type == 'course' and req.course:
            req.course.approval_status = 'finalized'
            req.course.is_editable = False

        elif req.submission_type == 'grades' and req.course:
            for s in CourseStudent.query.filter_by(course_id=req.submission_id).all():
                s.ca_status = 'finalized'
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

        # Skip remaining steps
        for step in req.steps:
            if step.status == 'waiting':
                step.status = 'skipped'
                step.comments = 'Auto-skipped'

        # Notify creator
        db.session.add(Notification(
            user_id=req.creator_id, user_type='lecturer',
            title=f'{req.submission_type.upper()} Finalized!',
            message='Your submission has been fully approved.',
            notification_type='finalized', request_id=req.id,
        ))

        # Notify admins
        for admin in Admin.query.all():
            db.session.add(Notification(
                user_id=admin.id, user_type='admin',
                title=f'{req.submission_type.upper()} Finalized',
                message=f'By {req.creator.full_name if req.creator else "Unknown"}',
                notification_type='finalized', request_id=req.id,
            ))

    # Progress notification to creator
    db.session.add(Notification(
        user_id=req.creator_id, user_type='lecturer',
        title=f'{req.submission_type.upper()} Progress',
        message=f'Moved to {req.current_level.upper()} stage.',
        notification_type='approval_progress', request_id=req.id,
    ))

    db.session.commit()
    return jsonify({
        'message': 'Approved!',
        'status': req.status,
        'current_level': req.current_level,
        'signature': signature,
    })


@lecturer_bp.route('/reject/<int:id>', methods=['POST'])
@token_required
def reject_submission(id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification

    lecturer = get_lecturer()
    data = request.get_json() or {}
    reason = data.get('reason', 'No reason provided')

    req = ApprovalRequest.query.get_or_404(id)
    req.status = 'rejected'
    req.rejected_at = datetime.utcnow()

    # Mark current step as rejected
    current_step = ApprovalStep.query.filter_by(
        request_id=id, level=req.current_level, status='pending'
    ).first()
    if current_step:
        current_step.status = 'rejected'
        current_step.rejection_reason = reason
        current_step.approver_id = lecturer.id

    # Make course editable again if course submission
    if req.submission_type == 'course' and req.course:
        req.course.is_editable = True
        req.course.approval_status = 'rejected'

    if req.submission_type == 'grades' and req.course:
        req.course.approval_status = 'finalized'  # Course stays finalized, just grades rejected

    # Notify creator with reason
    db.session.add(Notification(
        user_id=req.creator_id, user_type='lecturer',
        title=f'{req.submission_type.upper()} Rejected by {lecturer.role}',
        message=f'Reason: {reason}',
        notification_type='rejection', request_id=req.id,
    ))

    db.session.commit()
    return jsonify({
        'message': 'Rejected!',
        'reason': reason,
    })


@lecturer_bp.route('/pending-approvals', methods=['GET'])
@token_required
def pending_approvals():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.user import Lecturer
    from models.approval import ApprovalRequest
    from models.grade_edit import GradeEditRequest
    from models.academic import Course
    from models.notification import Notification

    lecturer = Lecturer.query.get(request.user['user_id'])
    pc, pg, pr = [], [], []

    if lecturer.role == 'head_of_department':
        pc = ApprovalRequest.query.filter_by(
            submission_type='course', status='pending_hod',
            target_department_id=lecturer.department_id,
        ).all()
        pg = ApprovalRequest.query.filter_by(
            submission_type='grades', status='pending_hod',
            target_department_id=lecturer.department_id,
        ).all()
        pr = ApprovalRequest.query.filter_by(
            submission_type='reference', status='pending_hod',
            target_department_id=lecturer.department_id,
        ).all()

    elif lecturer.role == 'dean':
        pc = ApprovalRequest.query.filter_by(
            submission_type='course', status='pending_dean',
            target_faculty_id=lecturer.faculty_id,
        ).all()
        pg = ApprovalRequest.query.filter_by(
            submission_type='grades', status='pending_dean',
            target_faculty_id=lecturer.faculty_id,
        ).all()
        pr = ApprovalRequest.query.filter_by(
            submission_type='reference', status='pending_dean',
            target_faculty_id=lecturer.faculty_id,
        ).all()

    elif lecturer.role == 'exam_officer':
        pc = ApprovalRequest.query.filter_by(
            submission_type='course', status='pending_exam',
        ).all()
        pg = ApprovalRequest.query.filter_by(
            submission_type='grades', status='pending_exam',
        ).all()
        pr = ApprovalRequest.query.filter_by(
            submission_type='reference', status='pending_exam',
        ).all()

    # Grade Edit Requests (for HOD/Dean)
    pending_edits = []
    if lecturer.role == 'head_of_department':
        pending_edits = GradeEditRequest.query.join(
            Course, GradeEditRequest.course_id == Course.id
        ).filter(
            GradeEditRequest.status == 'pending_hod',
            Course.department_id == lecturer.department_id
        ).order_by(GradeEditRequest.created_at.desc()).all()
        
    elif lecturer.role == 'dean':
        pending_edits = GradeEditRequest.query.join(
            Course, GradeEditRequest.course_id == Course.id
        ).filter(
            GradeEditRequest.status == 'pending_dean',
            Course.faculty_id == lecturer.faculty_id
        ).order_by(GradeEditRequest.created_at.desc()).all()

    # Missing Student Notifications (for HOD)
    pending_missing = []
    if lecturer.is_hod():
        pending_missing = Notification.query.filter_by(
            user_id=lecturer.id,
            user_type='lecturer',
            title='Missing Student Detected',
            is_read=False,
            is_dismissed=False,
        ).order_by(Notification.created_at.desc()).all()

    return jsonify({
        'pending_courses': [r.to_dict() for r in pc],
        'pending_grades': [r.to_dict() for r in pg],
        'pending_references': [r.to_dict() for r in pr],
        'pending_grade_edits': [r.to_dict() for r in pending_edits],
        'pending_missing': [n.to_dict() for n in pending_missing],
    })

# ==================== REFERENCES ====================

@lecturer_bp.route('/course/<int:id>/reference-management', methods=['GET'])
@token_required
def reference_management(id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course
    from models.reference import ReferenceGrade

    lecturer = get_lecturer()
    course = Course.query.get_or_404(id)

    if course.assigned_lecturer_id != lecturer.id and course.created_by_id != lecturer.id:
        return jsonify({'error': 'Not assigned to this course'}), 403

    refs = ReferenceGrade.query.filter_by(course_id=id).all()
    needing = [
        s for s in course.students
        if s.grade in ['E', 'F']
        and not ReferenceGrade.query.filter_by(course_id=id, student_id=s.id).first()
    ]

    return jsonify({
        'course': course.to_dict(include_relations=True),
        'references': [r.to_dict() for r in refs],
        'students_needing_references': [s.to_dict() for s in needing],
    })


@lecturer_bp.route('/course/<int:id>/create-missing-references', methods=['POST'])
@token_required
def create_missing_references(id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course
    from models.reference import ReferenceGrade

    lecturer = get_lecturer()
    course = Course.query.get_or_404(id)

    if course.assigned_lecturer_id != lecturer.id and course.created_by_id != lecturer.id:
        return jsonify({'error': 'Not assigned to this course'}), 403

    created = 0
    for s in course.students:
        if s.grade in ['E', 'F'] and not ReferenceGrade.query.filter_by(
            course_id=id, student_id=s.id
        ).first():
            db.session.add(ReferenceGrade(
                course_id=id,
                student_id=s.id,
                original_grade=s.grade,
                original_score=s.total_score or 0,
                original_credit_hours=course.credit_hours,
                reference_status='pending',
                approval_status='draft',
            ))
            created += 1

    db.session.commit()
    return jsonify({'message': f'{created} references created!'})


@lecturer_bp.route('/update-reference-grade/<int:ref_id>', methods=['POST'])
@token_required
def update_reference_grade(ref_id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.reference import ReferenceGrade

    ref = ReferenceGrade.query.get_or_404(ref_id)
    score = float(request.get_json().get('new_score', 0))

    if score >= 75:
        grade = 'A'
    elif score >= 65:
        grade = 'B'
    elif score >= 50:
        grade = 'C'
    elif score >= 40:
        grade = 'D'
    elif score >= 30:
        grade = 'E'
    else:
        grade = 'F'

    ref.reference_score = score
    ref.reference_grade = grade
    ref.display_grade = f"{grade}/{ref.original_grade}"
    ref.approval_status = 'draft'

    db.session.commit()
    return jsonify({'message': f'Reference grade updated to {grade}'})


# ==================== GRADE EDIT REQUEST ====================

@lecturer_bp.route('/request-grade-edit', methods=['POST'])
@token_required
def request_grade_edit():
    """
    Lecturer requests to edit a grade after finalization.
    Flow: Lecturer → HOD → Dean → Exam Office activates re-edit.
    """
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.grade_edit import GradeEditRequest
    from models.academic import CourseStudent, Course
    from models.user import Lecturer
    from models.notification import Notification

    lecturer = get_lecturer()
    data = request.get_json() or {}

    course_student_id = data.get('course_student_id')
    requested_field = data.get('requested_field')
    new_value = data.get('new_value')
    reason = data.get('reason')

    if not all([course_student_id, requested_field, new_value is not None, reason]):
        return jsonify({'message': 'All fields required'}), 400

    cs = CourseStudent.query.get(course_student_id)
    if not cs:
        return jsonify({'message': 'Student record not found'}), 404

    course = Course.query.get(cs.course_id)

    # Get current value
    current_value = getattr(cs, requested_field, None)

    # Create edit request
    edit_req = GradeEditRequest(
        course_student_id=course_student_id,
        course_id=cs.course_id,
        requested_by_id=lecturer.id,
        requested_field=requested_field,
        current_value=current_value,
        new_value=new_value,
        reason=reason,
        status='pending_hod',
    )
    db.session.add(edit_req)
    db.session.flush()

    # Notify HOD — set request_id=None to avoid FK violation
    if course and course.department_id:
        hod = Lecturer.query.filter_by(
            department_id=course.department_id, role='head_of_department'
        ).first()
        if hod:
            db.session.add(Notification(
                user_id=hod.id, user_type='lecturer',
                title='Grade Edit Request',
                message=f'{lecturer.full_name} requests to edit {requested_field} for {cs.student_name} ({cs.student_id})',
                notification_type='submission', request_id=None,
            ))

    db.session.commit()
    return jsonify({
        'message': 'Grade edit request submitted to HOD',
        'edit_request': edit_req.to_dict(),
    })


@lecturer_bp.route('/grade-edit-requests', methods=['GET'])
@token_required
def get_grade_edit_requests():
    """Get all grade edit requests for current lecturer"""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.grade_edit import GradeEditRequest

    lecturer = get_lecturer()

    # Requests I made
    my_requests = GradeEditRequest.query.filter_by(requested_by_id=lecturer.id).order_by(
        GradeEditRequest.created_at.desc()
    ).all()

    # Requests pending my approval (if HOD/Dean)
    pending_my_approval = []
    if lecturer.is_hod():
        pending_my_approval = GradeEditRequest.query.filter_by(
            status='pending_hod'
        ).order_by(GradeEditRequest.created_at.desc()).all()
    elif lecturer.is_dean():
        pending_my_approval = GradeEditRequest.query.filter_by(
            status='pending_dean'
        ).order_by(GradeEditRequest.created_at.desc()).all()

    return jsonify({
        'my_requests': [r.to_dict() for r in my_requests],
        'pending_approval': [r.to_dict() for r in pending_my_approval],
    })


@lecturer_bp.route('/review-grade-edit/<int:edit_id>', methods=['POST'])
@token_required
def review_grade_edit(edit_id):
    """HOD or Dean reviews a grade edit request"""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.grade_edit import GradeEditRequest
    from models.notification import Notification
    from models.user import Lecturer, Admin

    lecturer = get_lecturer()
    edit_req = GradeEditRequest.query.get_or_404(edit_id)

    data = request.get_json() or {}
    decision = data.get('decision')  # 'approved' or 'rejected'
    comment = data.get('comment', '')
    signature = data.get('signature', lecturer.full_name)

    if lecturer.is_hod() and edit_req.status == 'pending_hod':
        edit_req.hod_reviewed = True
        edit_req.hod_reviewed_by_id = lecturer.id
        edit_req.hod_reviewed_at = datetime.utcnow()
        edit_req.hod_decision = decision
        edit_req.hod_comment = comment
        edit_req.hod_signature = signature

        if decision == 'approved':
            edit_req.status = 'pending_dean'
            # Notify Dean
            if edit_req.course and edit_req.course.faculty_id:
                dean = Lecturer.query.filter_by(
                    faculty_id=edit_req.course.faculty_id, role='dean'
                ).first()
                if dean:
                    db.session.add(Notification(
                        user_id=dean.id, user_type='lecturer',
                        title='Grade Edit Request',
                        message=f'HOD approved. Please review.',
                        notification_type='approval_progress',
                        request_id=None,  # ✅ FIXED
                    ))
        else:
            edit_req.status = 'rejected'
            db.session.add(Notification(
                user_id=edit_req.requested_by_id, user_type='lecturer',
                title='Grade Edit Rejected by HOD',
                message=f'Reason: {comment}',
                notification_type='rejection', request_id=None,  # ✅ FIXED
            ))

    elif lecturer.is_dean() and edit_req.status == 'pending_dean':
        edit_req.dean_reviewed = True
        edit_req.dean_reviewed_by_id = lecturer.id
        edit_req.dean_reviewed_at = datetime.utcnow()
        edit_req.dean_decision = decision
        edit_req.dean_comment = comment
        edit_req.dean_signature = signature

        if decision == 'approved':
            edit_req.status = 'pending_exam'
            # Notify Exam Office (Admin)
            for admin in Admin.query.all():
                db.session.add(Notification(
                    user_id=admin.id, user_type='admin',
                    title='Grade Edit Request at Exam Office',
                    message=f'Dean approved. Activate re-edit.',
                    notification_type='submission', request_id=None,  # ✅ FIXED
                ))
        else:
            edit_req.status = 'rejected'
            db.session.add(Notification(
                user_id=edit_req.requested_by_id, user_type='lecturer',
                title='Grade Edit Rejected by Dean',
                message=f'Reason: {comment}',
                notification_type='rejection', request_id=None,  # ✅ FIXED
            ))

    else:
        return jsonify({'message': 'Not authorized for this stage'}), 403

    db.session.commit()
    return jsonify({
        'message': f'Grade edit {decision}!',
        'edit_request': edit_req.to_dict(),
    })


# ==================== NOTIFICATIONS ====================

@lecturer_bp.route('/notifications', methods=['GET'])
@token_required
def notifications():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.notification import Notification

    lecturer = get_lecturer()
    notifs = Notification.query.filter_by(
        user_id=lecturer.id, user_type='lecturer', is_dismissed=False
    ).order_by(Notification.created_at.desc()).limit(50).all()

    for n in notifs:
        if not n.is_read:
            n.is_read = True
    if notifs:
        db.session.commit()

    return jsonify({'notifications': [n.to_dict() for n in notifs]})


@lecturer_bp.route('/notifications/count', methods=['GET'])
@token_required
def notification_count():
    from models.notification import Notification
    lecturer = get_lecturer()
    count = Notification.query.filter_by(
        user_id=lecturer.id, user_type='lecturer',
        is_read=False, is_dismissed=False,
    ).count()
    return jsonify({'count': count})


@lecturer_bp.route('/assessment-notifications', methods=['GET'])
@token_required
def assessment_notifications():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.approval import ApprovalRequest, ApprovalStep

    # Get rejected grade submissions
    rejected = ApprovalRequest.query.filter_by(status='rejected').filter(
        ApprovalRequest.submission_type.in_(['ca', 'exam', 'grades'])
    ).all()

    rca, rex, rgr = [], [], []
    for r in rejected:
        step = ApprovalStep.query.filter_by(request_id=r.id, status='rejected').first()
        d = r.to_dict()
        d['rejection_reason'] = step.rejection_reason if step else 'No reason'
        d['approved_at'] = step.approved_at.isoformat() if step and step.approved_at else None
        d['approved_by'] = {
            'full_name': step.approver.full_name
        } if step and step.approver else None

        if r.submission_type == 'ca':
            rca.append(d)
        elif r.submission_type == 'exam':
            rex.append(d)
        else:
            rgr.append(d)

    return jsonify({
        'rejected_ca': rca,
        'rejected_exam': rex,
        'rejected_grades': rgr,
    })


# ==================== ARCHIVE ====================

@lecturer_bp.route('/archive-course/<int:id>', methods=['POST'])
@token_required
def archive_course(id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.academic import Course

    lecturer = get_lecturer()
    course = Course.query.get_or_404(id)

    if course.created_by_id != lecturer.id:
        return jsonify({'error': 'Permission denied'}), 403

    course.is_active = False
    db.session.commit()
    return jsonify({'message': 'Course archived!'})


# ==================== LECTURER ACCESSIBLE ADMIN DATA ====================

@lecturer_bp.route('/api/faculties', methods=['GET'])
@token_required
def get_faculties_lecturer():
    """Get all faculties (accessible by lecturers and admins)"""
    from models.academic import Faculty
    faculties = Faculty.query.all()
    return jsonify({'faculties': [f.to_dict() for f in faculties]})


@lecturer_bp.route('/api/departments/<int:faculty_id>', methods=['GET'])
@token_required
def get_departments_lecturer(faculty_id):
    """Get departments by faculty (accessible by lecturers and admins)"""
    from models.academic import Department
    departments = Department.query.filter_by(faculty_id=faculty_id).all()
    return jsonify({'departments': [{'id': d.id, 'name': d.name} for d in departments]})


@lecturer_bp.route('/api/lecturers', methods=['GET'])
@token_required
def get_all_lecturers():
    """Get all lecturers (accessible by lecturers and admins)"""
    from models.user import Lecturer
    lecturers = Lecturer.query.all()
    return jsonify({'lecturers': [l.to_dict() for l in lecturers]})


# ==================== APPROVAL HISTORY ====================

@lecturer_bp.route('/approval-history', methods=['GET'])
@token_required
def my_approval_history():
    """Get approval history for the current lecturer's submissions"""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403
    
    from models.approval import ApprovalRequest
    from models.grade_edit import GradeEditRequest
    
    lecturer = get_lecturer()
    
    # Get all submissions made by this lecturer
    my_submissions = ApprovalRequest.query.filter_by(
        creator_id=lecturer.id
    ).order_by(ApprovalRequest.submitted_at.desc()).all()
    
    # Get all approvals/rejections this lecturer made (if HOD/Dean)
    my_approvals = []
    if lecturer.is_approver():
        from models.approval import ApprovalStep
        approved_steps = ApprovalStep.query.filter_by(
            approver_id=lecturer.id
        ).filter(
            ApprovalStep.status.in_(['approved', 'rejected'])
        ).order_by(ApprovalStep.approved_at.desc()).all()
        
        for step in approved_steps:
            my_approvals.append({
                'request': step.request.to_dict() if step.request else None,
                'step': step.to_dict(),
            })
    
    # Get grade edit requests (requested by me OR reviewed by me)
    my_edit_requests = GradeEditRequest.query.filter_by(
        requested_by_id=lecturer.id
    ).order_by(GradeEditRequest.created_at.desc()).all()
    
    my_edit_reviews = []
    if lecturer.is_approver():
        # Grade edits reviewed by me as HOD
        if lecturer.is_hod():
            my_edit_reviews = GradeEditRequest.query.filter_by(
                hod_reviewed_by_id=lecturer.id
            ).order_by(GradeEditRequest.hod_reviewed_at.desc()).all()
        # Grade edits reviewed by me as Dean
        elif lecturer.is_dean():
            my_edit_reviews = GradeEditRequest.query.filter_by(
                dean_reviewed_by_id=lecturer.id
            ).order_by(GradeEditRequest.dean_reviewed_at.desc()).all()
    
    return jsonify({
        'my_submissions': [s.to_dict() for s in my_submissions],
        'my_approvals': my_approvals,
        'my_edit_requests': [r.to_dict() for r in my_edit_requests],
        'my_edit_reviews': [r.to_dict() for r in my_edit_reviews],
    })


@lecturer_bp.route('/notify-lecturer-missing', methods=['POST'])
@token_required
def notify_lecturer_missing_student():
    """HOD sends notification to lecturer about missing student"""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.notification import Notification

    lecturer = get_lecturer()
    if not lecturer.is_hod():
        return jsonify({'error': 'Only HOD can send this notification'}), 403

    data = request.get_json() or {}
    lecturer_id = data.get('lecturer_id')
    student_name = data.get('student_name', 'Unknown')
    student_id = data.get('student_id', 'Unknown')
    course_code = data.get('course_code', 'Unknown')

    if not lecturer_id:
        return jsonify({'error': 'Lecturer ID required'}), 400

    db.session.add(Notification(
        user_id=lecturer_id,
        user_type='lecturer',
        title='Missing Student — Action Required',
        message=f'HOD {lecturer.full_name} requests: Please add {student_name} ({student_id}) to {course_code}.',
        notification_type='info',
        request_id=None,
    ))
    db.session.commit()

    return jsonify({'message': f'Notification sent to lecturer'})


@lecturer_bp.route('/forward-missing-student', methods=['POST'])
@token_required
def forward_missing_student():
    """HOD forwards missing student alert to the course's assigned lecturer"""
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403

    from models.notification import Notification
    from models.academic import Course
    from models.user import Lecturer

    hod = get_lecturer()
    if not hod.is_hod():
        return jsonify({'error': 'Only HOD can forward missing student alerts'}), 403

    data = request.get_json() or {}
    course_code = data.get('course_code', '').strip()
    student_name = data.get('student_name', '')
    student_id = data.get('student_id', '')

    if not course_code:
        return jsonify({'error': 'Course code required'}), 400

    # Find the course and its assigned lecturer
    course = Course.query.filter_by(course_code=course_code, is_active=True).first()
    if not course:
        return jsonify({'error': 'Course not found'}), 404

    if not course.assigned_lecturer_id:
        return jsonify({'error': 'No lecturer assigned to this course'}), 400

    # Send notification to the assigned lecturer
    db.session.add(Notification(
        user_id=course.assigned_lecturer_id,
        user_type='lecturer',
        title='Missing Student — Action Required',
        message=f'HOD {hod.full_name} requests: Please add {student_name} ({student_id}) to {course.course_code} ({course.course_name}). Course ID: {course.id}',
        notification_type='info',
        request_id=None,
    ))
    db.session.commit()

    return jsonify({
        'message': f'Notification sent to {course.assigned_lecturer.full_name}',
        'course_id': course.id,
    })
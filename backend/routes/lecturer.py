from flask import Blueprint, request, jsonify
from extensions import db
from middleware.jwt_required import token_required
from datetime import datetime
from werkzeug.security import generate_password_hash

lecturer_bp = Blueprint('lecturer', __name__)

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
    
    all_courses = Course.query.filter_by(created_by_id=lecturer.id).all()
    active_courses = [c for c in all_courses if c.is_active]
    draft_courses = [c for c in active_courses if c.approval_status == 'draft']
    total_students = sum(len(c.students) for c in all_courses)
    
    pending_course = 0; pending_ca = 0; pending_exam = 0; pending_ref = 0
    
    if lecturer.role == 'head_of_department':
        pending_course = ApprovalRequest.query.filter_by(submission_type='course', status='pending_hod', target_department_id=lecturer.department_id).count()
        pending_ca = ApprovalRequest.query.filter_by(submission_type='ca', status='pending_hod', target_department_id=lecturer.department_id).count()
        pending_exam = ApprovalRequest.query.filter_by(submission_type='exam', status='pending_hod', target_department_id=lecturer.department_id).count()
        pending_ref = ApprovalRequest.query.filter_by(submission_type='reference', status='pending_hod', target_department_id=lecturer.department_id).count()
    elif lecturer.role == 'dean':
        pending_course = ApprovalRequest.query.filter_by(submission_type='course', status='pending_dean', target_faculty_id=lecturer.faculty_id).count()
        pending_ca = ApprovalRequest.query.filter_by(submission_type='ca', status='pending_dean', target_faculty_id=lecturer.faculty_id).count()
        pending_exam = ApprovalRequest.query.filter_by(submission_type='exam', status='pending_dean', target_faculty_id=lecturer.faculty_id).count()
        pending_ref = ApprovalRequest.query.filter_by(submission_type='reference', status='pending_dean', target_faculty_id=lecturer.faculty_id).count()
    elif lecturer.role == 'exam_officer':
        pending_course = ApprovalRequest.query.filter_by(submission_type='course', status='pending_exam').count()
        pending_ca = ApprovalRequest.query.filter_by(submission_type='ca', status='pending_exam').count()
        pending_exam = ApprovalRequest.query.filter_by(submission_type='exam', status='pending_exam').count()
        pending_ref = ApprovalRequest.query.filter_by(submission_type='reference', status='pending_exam').count()
    
    # Count submissions made by this lecturer that are pending
    my_pending_submissions = ApprovalRequest.query.filter_by(creator_id=lecturer.id).filter(
        ApprovalRequest.status.in_(['pending_hod', 'pending_dean', 'pending_exam'])
    ).count()
    
    unread = Notification.query.filter_by(user_id=lecturer.id, user_type='lecturer', is_read=False, is_dismissed=False).count()
    
    return jsonify({
        'lecturer': lecturer.to_dict(),
        'stats': {
            'active_courses': len(active_courses),
            'draft_courses': len(draft_courses),
            'total_students': total_students,
            'pending_course_approvals': pending_course,
            'pending_ca_approvals': pending_ca,
            'pending_exam_approvals': pending_exam,
            'pending_reference_approvals': pending_ref,
            'total_pending_approvals': pending_course + pending_ca + pending_exam + pending_ref,
            'unread_notifications': unread,
            'my_pending_submissions': my_pending_submissions,
        }
    })

# ==================== COURSES ====================

@lecturer_bp.route('/courses', methods=['GET'])
@token_required
def courses():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    
    lecturer_id = request.user['user_id']
    active = Course.query.filter_by(created_by_id=lecturer_id, is_active=True).order_by(Course.created_at.desc()).all()
    archived = Course.query.filter_by(created_by_id=lecturer_id, is_active=False).order_by(Course.created_at.desc()).all()
    
    active_data = []
    for c in active:
        cd = c.to_dict(include_relations=True)
        cd['students_count'] = len(c.students)
        active_data.append(cd)
    
    archived_data = []
    for c in archived:
        cd = c.to_dict(include_relations=True)
        cd['students_count'] = len(c.students)
        archived_data.append(cd)
    
    return jsonify({'active_courses': active_data, 'archived_courses': archived_data})

@lecturer_bp.route('/course-history', methods=['GET'])
@token_required
def course_history():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    courses = Course.query.filter_by(created_by_id=request.user['user_id'], is_active=False).order_by(Course.created_at.desc()).all()
    return jsonify({'courses': [c.to_dict(include_relations=True) for c in courses]})

@lecturer_bp.route('/create-course', methods=['POST'])
@token_required
def create_course():
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Lecturer
    from models.academic import Course, CourseStudent
    from models.gpa import StudentGPA
    
    lecturer = Lecturer.query.get(request.user['user_id'])
    data = request.get_json() or {}
    
    full_semester = f"{data.get('year')} - {data.get('semester')}"
    year_level = data.get('year', '')
    
    dept_choice = data.get('dept_choice', 'default')
    faculty_id = None; department_id = None
    
    if dept_choice == 'other':
        faculty_id = data.get('final_faculty_id')
        department_id = data.get('final_department_id')
    else:
        if lecturer.department:
            department_id = lecturer.department_id
            faculty_id = lecturer.department.faculty_id
        elif lecturer.faculty:
            faculty_id = lecturer.faculty_id
    
    course = Course(
        course_code=data.get('course_code'), course_name=data.get('course_name'),
        credit_hours=int(data.get('credit_hours', 3)), semester=full_semester,
        academic_year=data.get('academic_year'), created_by_id=lecturer.id,
        faculty_id=faculty_id, department_id=department_id,
        course_type='departmental', is_active=True,
        program_type=data.get('program_type', 'BSc'),
        approval_status='draft', is_editable=True
    )
    db.session.add(course)
    db.session.flush()
    
    auto_enrolled = 0
    if year_level in ['Year 2', 'Year 3', 'Year 4'] and department_id:
        level_map = {'Year 2': 'Level 100', 'Year 3': 'Level 200', 'Year 4': 'Level 300'}
        previous_level = level_map.get(year_level)
        if previous_level:
            passed_gpas = StudentGPA.query.filter_by(level=previous_level, student_status='PASS').all()
            passed_ids = list(set(g.student_id for g in passed_gpas))
            for sid in passed_ids:
                already = CourseStudent.query.filter_by(course_id=course.id, student_id=sid).first()
                if already: continue
                existing = CourseStudent.query.filter_by(student_id=sid).join(Course).filter(Course.department_id == department_id).first()
                if existing:
                    db.session.add(CourseStudent(course_id=course.id, student_id=sid, student_name=existing.student_name, added_by_id=lecturer.id, program_type=course.program_type, student_department_id=department_id))
                    auto_enrolled += 1
    
    db.session.commit()
    return jsonify({'message': f'Course created! {auto_enrolled} students auto-enrolled.', 'course': course.to_dict(include_relations=True), 'auto_enrolled': auto_enrolled})

@lecturer_bp.route('/course/<int:id>', methods=['GET'])
@token_required
def view_course(id):
    if request.user['user_type'] != 'lecturer':
        return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    from models.approval import ApprovalRequest
    
    course = Course.query.get_or_404(id)
    ca_approval = ApprovalRequest.query.filter_by(submission_type='ca', submission_id=id).first()
    exam_approval = ApprovalRequest.query.filter_by(submission_type='exam', submission_id=id).first()
    course_approval = ApprovalRequest.query.filter_by(submission_type='course', submission_id=id).first()
    
    # CA Status
    ca_status = 'not_submitted'; ca_status_text = 'Not Submitted'; ca_status_class = 'badge-not-submitted'
    can_edit_ca = False; show_submit_ca = False
    
    if ca_approval:
        if ca_approval.status == 'finalized':
            ca_status = 'finalized'; ca_status_text = 'Finalized'; ca_status_class = 'badge-approved'
        elif ca_approval.status == 'rejected':
            ca_status = 'rejected'; ca_status_text = 'Rejected'; ca_status_class = 'badge-rejected'
            can_edit_ca = True; show_submit_ca = True
        else:
            ca_status = 'pending'; ca_status_text = ca_approval.get_status_display(); ca_status_class = 'badge-pending'
    elif course.approval_status == 'finalized':
        can_edit_ca = True
        all_scored = all(s.test_score is not None for s in course.students)
        show_submit_ca = all_scored and len(course.students) > 0
    
    if ('Not Submitted' in ca_status_text or 'Pending' in ca_status_text) and course.students:
        all_ca_finalized = all(s.ca_status == 'finalized' for s in course.students)
        has_ca = any(s.continuous_assessment is not None for s in course.students)
        if all_ca_finalized:
            ca_status = 'finalized'; ca_status_text = 'Finalized'; ca_status_class = 'badge-approved'
        elif has_ca:
            ca_status_text = 'Submitted'; ca_status_class = 'badge-pending'
    
    ca_finalized = (ca_status == 'finalized')
    
    # Exam Status
    exam_status_text = 'Not Submitted'; exam_status_class = 'badge-not-submitted'
    has_exam_scores = any(s.exam_score is not None for s in course.students)
    
    if exam_approval:
        if exam_approval.status == 'finalized':
            exam_status_text = 'Finalized'; exam_status_class = 'badge-approved'
        elif exam_approval.status == 'rejected':
            exam_status_text = 'Rejected'; exam_status_class = 'badge-rejected'
        else:
            exam_status_text = exam_approval.get_status_display(); exam_status_class = 'badge-pending'
    
    if ('Not Submitted' in exam_status_text or 'Pending' in exam_status_text) and course.students:
        all_exam_finalized = all(s.exam_status == 'finalized' for s in course.students)
        has_exam = any(s.exam_score is not None for s in course.students)
        if all_exam_finalized:
            exam_status_text = 'Finalized'; exam_status_class = 'badge-approved'
        elif has_exam:
            exam_status_text = 'Submitted'; exam_status_class = 'badge-pending'
    
    course_data = {
        'id': course.id, 'course_code': course.course_code, 'course_name': course.course_name,
        'credit_hours': course.credit_hours, 'semester': course.semester, 'academic_year': course.academic_year,
        'program_type': course.program_type, 'approval_status': course.approval_status,
        'is_active': course.is_active, 'is_editable': course.is_editable, 'created_by_id': course.created_by_id,
        'created_by': {'id': course.created_by.id, 'full_name': course.created_by.full_name, 'lecturer_id': course.created_by.lecturer_id} if course.created_by else None,
        'faculty': {'id': course.faculty.id, 'name': course.faculty.name} if course.faculty else None,
        'department': {'id': course.department.id, 'name': course.department.name} if course.department else None,
        'students': [{'id': s.id, 'student_id': s.student_id, 'student_name': s.student_name, 'test_score': s.test_score, 'assignment_score': s.assignment_score, 'attendance_score': s.attendance_score, 'continuous_assessment': s.continuous_assessment, 'exam_score': s.exam_score, 'total_score': s.total_score, 'grade': s.grade, 'grade_points': s.grade_points, 'ca_status': s.ca_status, 'exam_status': s.exam_status} for s in course.students] if course.students else [],
        'assessments': [{'id': a.id, 'assessment_name': a.assessment_name, 'assessment_type': a.assessment_type, 'max_score': a.max_score, 'weight': a.weight} for a in course.assessments] if course.assessments else [],
        'reference_grades': [{'id': r.id, 'student_id': r.student_id, 'original_grade': r.original_grade, 'reference_grade': r.reference_grade, 'display_grade': r.display_grade, 'reference_status': r.reference_status, 'approval_status': r.approval_status} for r in course.reference_grades] if course.reference_grades else [],
        'created_at': course.created_at.isoformat() if course.created_at else None,
    }
    
    return jsonify({
        'course': course_data,
        'ca_status': ca_status, 'ca_status_text': ca_status_text, 'ca_status_class': ca_status_class,
        'can_edit_ca': can_edit_ca, 'show_submit_ca': show_submit_ca,
        'exam_status_text': exam_status_text, 'exam_status_class': exam_status_class,
        'ca_finalized': ca_finalized, 'has_exam_scores': has_exam_scores,
        'exam_approval': exam_approval.to_dict() if exam_approval else None,
        'course_approval': course_approval.to_dict() if course_approval else None,
    })

@lecturer_bp.route('/archive-course/<int:id>', methods=['POST'])
@token_required
def archive_course(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    course = Course.query.get_or_404(id)
    if course.created_by_id != request.user['user_id']: return jsonify({'error': 'Permission denied'}), 403
    course.is_active = False; db.session.commit()
    return jsonify({'message': 'Course archived!'})

# ==================== STUDENTS ====================

@lecturer_bp.route('/course/<int:id>/add-students', methods=['POST'])
@token_required
def add_students(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course, CourseStudent
    from models.user import Student
    
    course = Course.query.get_or_404(id)
    data = request.get_json() or {}
    student_ids = data.get('student_ids', []); student_names = data.get('student_names', [])
    added = 0
    
    for i in range(len(student_ids)):
        if student_ids[i] and student_names[i]:
            existing = CourseStudent.query.filter_by(course_id=id, student_id=student_ids[i]).first()
            if existing: continue
            db.session.add(CourseStudent(course_id=id, student_id=student_ids[i], student_name=student_names[i], added_by_id=request.user['user_id'], program_type=course.program_type))
            existing_account = Student.query.filter_by(student_id=student_ids[i]).first()
            if not existing_account:
                db.session.add(Student(student_id=student_ids[i], email=f"{student_ids[i]}@mmtu.edu.sl", password_hash=generate_password_hash(student_ids[i])))
            added += 1
    
    db.session.commit()
    return jsonify({'message': f'{added} students added!'})

@lecturer_bp.route('/course/<int:id>/auto-enroll-students', methods=['POST'])
@token_required
def auto_enroll_students(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course, CourseStudent
    from models.gpa import StudentGPA
    
    course = Course.query.get_or_404(id)
    semester_parts = (course.semester or '').split(' - '); year_part = semester_parts[0] if semester_parts else ''
    level_map = {'Year 2': 'Level 100', 'Year 3': 'Level 200', 'Year 4': 'Level 300'}
    previous_level = level_map.get(year_part)
    
    if not previous_level: return jsonify({'message': 'Auto-enrollment only for Year 2+'}), 400
    
    passed_gpas = StudentGPA.query.filter_by(level=previous_level, student_status='PASS').all()
    passed_ids = list(set(g.student_id for g in passed_gpas))
    auto_enrolled = 0
    
    for sid in passed_ids:
        already = CourseStudent.query.filter_by(course_id=id, student_id=sid).first()
        if already: continue
        existing = CourseStudent.query.filter_by(student_id=sid).join(Course).filter(Course.department_id == course.department_id).first()
        if existing:
            db.session.add(CourseStudent(course_id=id, student_id=sid, student_name=existing.student_name, added_by_id=request.user['user_id'], program_type=course.program_type, student_department_id=course.department_id))
            auto_enrolled += 1
    
    db.session.commit()
    return jsonify({'message': f'{auto_enrolled} students auto-enrolled!', 'count': auto_enrolled})

@lecturer_bp.route('/api/get-student/<string:student_id>', methods=['GET'])
@token_required
def get_student(student_id):
    from models.academic import CourseStudent
    student = CourseStudent.query.filter_by(student_id=student_id).first()
    if student: return jsonify({'found': True, 'student_id': student.student_id, 'student_name': student.student_name})
    return jsonify({'found': False}), 404

# ==================== GRADES ====================

@lecturer_bp.route('/course/<int:id>/enter-ca', methods=['POST'])
@token_required
def enter_ca(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import CourseStudent
    students = CourseStudent.query.filter_by(course_id=id).all()
    data = request.get_json() or {}
    
    for student in students:
        for key, attr in [('test', 'test_score'), ('assignment', 'assignment_score'), ('attendance', 'attendance_score')]:
            val = data.get(f'{key}_{student.id}')
            if val is not None and val != '':
                setattr(student, attr, float(val))
        ca = (student.test_score or 0) + (student.assignment_score or 0) + (student.attendance_score or 0)
        student.continuous_assessment = ca
    
    db.session.commit()
    return jsonify({'message': 'CA scores saved!'})

@lecturer_bp.route('/course/<int:id>/enter-exam-grades', methods=['POST'])
@token_required
def enter_exam(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import CourseStudent, Course
    from models.reference import ReferenceGrade
    
    course = Course.query.get_or_404(id)
    students = CourseStudent.query.filter_by(course_id=id).all()
    data = request.get_json() or {}
    
    for student in students:
        val = data.get(f'exam_{student.id}')
        if val is not None and val != '':
            student.exam_score = float(val)
            ca = student.continuous_assessment or 0; total = ca + student.exam_score
            student.total_score = total
            
            if total >= 75: student.grade = 'A'; student.grade_points = 5.0
            elif total >= 65: student.grade = 'B'; student.grade_points = 4.0
            elif total >= 50: student.grade = 'C'; student.grade_points = 3.0
            elif total >= 40: student.grade = 'D'; student.grade_points = 2.0
            elif total >= 30: student.grade = 'E'; student.grade_points = 1.0
            else: student.grade = 'F'; student.grade_points = 0.0
            
            if student.grade in ['E', 'F']:
                existing_ref = ReferenceGrade.query.filter_by(course_id=id, student_id=student.id).first()
                if not existing_ref:
                    db.session.add(ReferenceGrade(course_id=id, student_id=student.id, original_grade=student.grade, original_score=student.total_score or 0, original_credit_hours=course.credit_hours, reference_status='pending', approval_status='draft'))
    
    db.session.commit()
    return jsonify({'message': 'Exam grades saved!'})

# ==================== SUBMISSIONS ====================

@lecturer_bp.route('/submit/<string:submission_type>/<int:submission_id>', methods=['POST'])
@token_required
def submit_for_approval(submission_type, submission_id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Lecturer
    from models.academic import Course
    from models.reference import ReferenceGrade
    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification
    
    lecturer = Lecturer.query.get(request.user['user_id'])
    course = None; department_id = None; faculty_id = None
    
    if submission_type == 'course':
        course = Course.query.get(submission_id)
        if not course or len(course.students) == 0: return jsonify({'message': 'Add students first'}), 400
        if course.approval_status == 'finalized': return jsonify({'message': 'Course already finalized'}), 400
        department_id = course.department_id; faculty_id = course.faculty_id
    elif submission_type == 'ca':
        course = Course.query.get(submission_id)
        if not course or course.approval_status != 'finalized': return jsonify({'message': 'Course must be finalized first'}), 400
        department_id = course.department_id; faculty_id = course.faculty_id
    elif submission_type == 'exam':
        course = Course.query.get(submission_id)
        if not ApprovalRequest.query.filter_by(submission_type='ca', submission_id=submission_id, status='finalized').first(): return jsonify({'message': 'CA must be finalized first'}), 400
        department_id = course.department_id if course else None; faculty_id = course.faculty_id if course else None
    elif submission_type == 'reference':
        ref = ReferenceGrade.query.get(submission_id)
        if not ref: return jsonify({'message': 'Reference not found'}), 404
        if not ref.reference_grade: return jsonify({'message': 'Enter reference grade first'}), 400
        course = ref.course
        department_id = course.department_id if course else None; faculty_id = course.faculty_id if course else None
    
    existing = ApprovalRequest.query.filter_by(submission_type=submission_type, submission_id=submission_id).first()
    if existing and existing.status not in ['rejected', 'draft']: return jsonify({'message': 'Already submitted'}), 400
    
    if existing and existing.status == 'rejected':
        req = existing; req.status = 'pending_hod'; req.submitted_at = datetime.utcnow(); req.rejected_at = None
        for step in req.steps: step.status = 'pending' if step.step_order == 1 else 'waiting'; step.rejection_reason = None
    else:
        req = ApprovalRequest(submission_type=submission_type, submission_id=submission_id, course_id=course.id if course else (submission_id if submission_type in ['course','ca','exam'] else None), creator_id=lecturer.id, creator_role=lecturer.role, current_level='hod', target_department_id=department_id, target_faculty_id=faculty_id, status='pending_hod', submitted_at=datetime.utcnow())
        db.session.add(req); db.session.flush()
        for i, level in enumerate(['hod', 'dean', 'exam']):
            db.session.add(ApprovalStep(request_id=req.id, step_order=i+1, level=level, status='pending' if i==0 else 'waiting'))
    
    if submission_type == 'course' and course: course.approval_status = 'pending_hod'; course.is_editable = False
    elif submission_type == 'ca' and course:
        for s in course.students: s.ca_status = 'submitted'
    elif submission_type == 'exam' and course:
        for s in course.students: s.exam_status = 'submitted'
    elif submission_type == 'reference':
        ref = ReferenceGrade.query.get(submission_id)
        if ref: ref.submitted_for_approval = True; ref.approval_status = 'pending_hod'
    
    hod = Lecturer.query.filter_by(department_id=department_id, role='head_of_department').first() if department_id else None
    if not hod and faculty_id: hod = Lecturer.query.filter_by(faculty_id=faculty_id, role='dean').first()
    if hod and hod.id != lecturer.id:
        db.session.add(Notification(user_id=hod.id, user_type='lecturer', title=f'New {submission_type.upper()} Submission', message=f'{lecturer.full_name} submitted for your approval', notification_type='submission', request_id=req.id))
    
    db.session.commit()
    return jsonify({'message': f'{submission_type.upper()} submitted for approval!'})

# ==================== APPROVALS ====================

@lecturer_bp.route('/approve/<int:id>', methods=['POST'])
@token_required
def approve_submission(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification
    from models.academic import CourseStudent
    from models.reference import ReferenceGrade
    from models.user import Admin, Lecturer
    
    req = ApprovalRequest.query.get_or_404(id)
    if req.creator_id == request.user['user_id']: return jsonify({'message': 'Cannot approve own submission'}), 400
    
    current_step = ApprovalStep.query.filter_by(request_id=id, level=req.current_level, status='pending').first()
    if current_step: current_step.status = 'approved'; current_step.approver_id = request.user['user_id']; current_step.approved_at = datetime.utcnow(); current_step.signature = request.user.get('full_name', 'Approved')
    
    chain = ['hod', 'dean', 'exam']; current_idx = chain.index(req.current_level) if req.current_level in chain else -1
    
    if current_idx >= 0 and current_idx + 1 < len(chain):
        next_level = chain[current_idx + 1]; req.current_level = next_level; req.status = f'pending_{next_level}'
        next_step = ApprovalStep.query.filter_by(request_id=id, level=next_level).first()
        if next_step: next_step.status = 'pending'
        if req.submission_type == 'course' and req.course: req.course.approval_status = req.status
        
        if next_level == 'dean' and req.target_faculty_id:
            dean = Lecturer.query.filter_by(faculty_id=req.target_faculty_id, role='dean').first()
            if dean: db.session.add(Notification(user_id=dean.id, user_type='lecturer', title=f'{req.submission_type.upper()} Requires Approval', message=f'From {request.user.get("full_name")}', notification_type='approval_progress', request_id=req.id))
        elif next_level == 'exam':
            for admin in Admin.query.all(): db.session.add(Notification(user_id=admin.id, user_type='admin', title=f'{req.submission_type.upper()} at Exam Office', message=f'From {request.user.get("full_name")}', notification_type='submission', request_id=req.id))
    else:
        req.status = 'finalized'; req.finalized_at = datetime.utcnow()
        if req.submission_type == 'course' and req.course: req.course.approval_status = 'finalized'; req.course.is_editable = False
        elif req.submission_type == 'ca':
            for s in CourseStudent.query.filter_by(course_id=req.submission_id).all(): s.ca_status = 'finalized'
        elif req.submission_type == 'exam':
            for s in CourseStudent.query.filter_by(course_id=req.submission_id).all(): s.exam_status = 'finalized'
        elif req.submission_type == 'reference':
            ref = ReferenceGrade.query.get(req.submission_id)
            if ref:
                ref.approval_status = 'finalized'
                if ref.reference_grade in ['E', 'F']: ref.reference_status = 'double_fail'; ref.double_reference = True
                else: ref.reference_status = 'cleared'; ref.cleared_at = datetime.utcnow()
        for step in req.steps:
            if step.status == 'waiting': step.status = 'skipped'; step.comments = 'Auto-skipped'
        db.session.add(Notification(user_id=req.creator_id, user_type='lecturer', title=f'{req.submission_type.upper()} Finalized!', message='Fully approved.', notification_type='finalized', request_id=req.id))
        for admin in Admin.query.all(): db.session.add(Notification(user_id=admin.id, user_type='admin', title=f'{req.submission_type.upper()} Finalized', message=f'By {req.creator.full_name if req.creator else "Unknown"}', notification_type='finalized', request_id=req.id))
    
    db.session.add(Notification(user_id=req.creator_id, user_type='lecturer', title=f'{req.submission_type.upper()} Progress', message='Moved to next stage.', notification_type='approval_progress', request_id=req.id))
    db.session.commit()
    return jsonify({'message': 'Approved!', 'status': req.status, 'current_level': req.current_level})

@lecturer_bp.route('/reject/<int:id>', methods=['POST'])
@token_required
def reject_submission(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest, ApprovalStep
    from models.notification import Notification
    
    data = request.get_json() or {}; reason = data.get('reason', 'No reason')
    req = ApprovalRequest.query.get_or_404(id); req.status = 'rejected'; req.rejected_at = datetime.utcnow()
    current_step = ApprovalStep.query.filter_by(request_id=id, level=req.current_level, status='pending').first()
    if current_step: current_step.status = 'rejected'; current_step.rejection_reason = reason; current_step.approver_id = request.user['user_id']
    if req.submission_type == 'course' and req.course: req.course.is_editable = True
    db.session.add(Notification(user_id=req.creator_id, user_type='lecturer', title=f'{req.submission_type.upper()} Rejected', message=f'Reason: {reason}', notification_type='rejection', request_id=req.id))
    db.session.commit()
    return jsonify({'message': 'Rejected!'})

@lecturer_bp.route('/pending-approvals', methods=['GET'])
@token_required
def pending_approvals():
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.user import Lecturer
    from models.approval import ApprovalRequest
    
    lecturer = Lecturer.query.get(request.user['user_id'])
    pc = []; pca = []; pe = []; pr = []
    
    if lecturer.role == 'head_of_department':
        pc = ApprovalRequest.query.filter_by(submission_type='course', status='pending_hod', target_department_id=lecturer.department_id).all()
        pca = ApprovalRequest.query.filter_by(submission_type='ca', status='pending_hod', target_department_id=lecturer.department_id).all()
        pe = ApprovalRequest.query.filter_by(submission_type='exam', status='pending_hod', target_department_id=lecturer.department_id).all()
        pr = ApprovalRequest.query.filter_by(submission_type='reference', status='pending_hod', target_department_id=lecturer.department_id).all()
    elif lecturer.role == 'dean':
        pc = ApprovalRequest.query.filter_by(submission_type='course', status='pending_dean', target_faculty_id=lecturer.faculty_id).all()
        pca = ApprovalRequest.query.filter_by(submission_type='ca', status='pending_dean', target_faculty_id=lecturer.faculty_id).all()
        pe = ApprovalRequest.query.filter_by(submission_type='exam', status='pending_dean', target_faculty_id=lecturer.faculty_id).all()
        pr = ApprovalRequest.query.filter_by(submission_type='reference', status='pending_dean', target_faculty_id=lecturer.faculty_id).all()
    
    return jsonify({'pending_courses': [r.to_dict() for r in pc], 'pending_ca': [r.to_dict() for r in pca], 'pending_exam': [r.to_dict() for r in pe], 'pending_references': [r.to_dict() for r in pr]})

# ==================== REFERENCES ====================

@lecturer_bp.route('/course/<int:id>/reference-management', methods=['GET'])
@token_required
def reference_management(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    from models.reference import ReferenceGrade
    course = Course.query.get_or_404(id)
    refs = ReferenceGrade.query.filter_by(course_id=id).all()
    needing = [s for s in course.students if s.grade in ['E','F'] and not ReferenceGrade.query.filter_by(course_id=id, student_id=s.id).first()]
    return jsonify({'course': course.to_dict(include_relations=True), 'references': [r.to_dict() for r in refs], 'students_needing_references': [s.to_dict() for s in needing]})

@lecturer_bp.route('/course/<int:id>/create-missing-references', methods=['POST'])
@token_required
def create_missing_references(id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.academic import Course
    from models.reference import ReferenceGrade
    course = Course.query.get_or_404(id); created = 0
    for s in course.students:
        if s.grade in ['E','F'] and not ReferenceGrade.query.filter_by(course_id=id, student_id=s.id).first():
            db.session.add(ReferenceGrade(course_id=id, student_id=s.id, original_grade=s.grade, original_score=s.total_score or 0, original_credit_hours=course.credit_hours, reference_status='pending', approval_status='draft'))
            created += 1
    db.session.commit()
    return jsonify({'message': f'{created} references created!'})

@lecturer_bp.route('/update-reference-grade/<int:ref_id>', methods=['POST'])
@token_required
def update_reference_grade(ref_id):
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.reference import ReferenceGrade
    ref = ReferenceGrade.query.get_or_404(ref_id)
    score = float(request.get_json().get('new_score', 0))
    if score >= 75: grade = 'A'
    elif score >= 65: grade = 'B'
    elif score >= 50: grade = 'C'
    elif score >= 40: grade = 'D'
    elif score >= 30: grade = 'E'
    else: grade = 'F'
    ref.reference_score = score; ref.reference_grade = grade; ref.display_grade = f"{grade}/{ref.original_grade}"; ref.approval_status = 'draft'
    db.session.commit()
    return jsonify({'message': f'Reference grade updated to {grade}'})

# ==================== NOTIFICATIONS ====================

@lecturer_bp.route('/notifications', methods=['GET'])
@token_required
def notifications():
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.notification import Notification
    notifs = Notification.query.filter_by(user_id=request.user['user_id'], user_type='lecturer', is_dismissed=False).order_by(Notification.created_at.desc()).limit(50).all()
    for n in notifs:
        if not n.is_read: n.is_read = True
    if notifs: db.session.commit()
    return jsonify({'notifications': [n.to_dict() for n in notifs]})

@lecturer_bp.route('/notifications/count', methods=['GET'])
@token_required
def notification_count():
    from models.notification import Notification
    count = Notification.query.filter_by(user_id=request.user['user_id'], user_type='lecturer', is_read=False, is_dismissed=False).count()
    return jsonify({'count': count})

@lecturer_bp.route('/assessment-notifications', methods=['GET'])
@token_required
def assessment_notifications():
    if request.user['user_type'] != 'lecturer': return jsonify({'error': 'Unauthorized'}), 403
    from models.approval import ApprovalRequest, ApprovalStep
    rejected = ApprovalRequest.query.filter_by(status='rejected').filter(ApprovalRequest.submission_type.in_(['ca','exam'])).all()
    rca = []; rex = []
    for r in rejected:
        step = ApprovalStep.query.filter_by(request_id=r.id, status='rejected').first()
        d = r.to_dict(); d['rejection_reason'] = step.rejection_reason if step else 'No reason'
        d['approved_at'] = step.approved_at.isoformat() if step and step.approved_at else None
        d['approved_by'] = {'full_name': step.approver.full_name} if step and step.approver else None
        if r.submission_type == 'ca': rca.append(d)
        else: rex.append(d)
    return jsonify({'rejected_ca': rca, 'rejected_exam': rex})
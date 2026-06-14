from flask import Blueprint, render_template, request, session, redirect, url_for, flash, jsonify
from datetime import datetime
import random
from werkzeug.security import generate_password_hash
from admin import (
    db, Lecturer, Faculty, Department, Course, CourseStudent,
    ContinuousAssessment, AssessmentGrade, ReferenceGrade,
    StudentGPA, StudentAcademicStatus,
    ApprovalRequest, ApprovalStep, Notification,
    Admin, Student, ApprovalEngine, NotificationService
)

lecturer_bp = Blueprint('lecturer', __name__)

lecturer_bp = Blueprint('lecturer', __name__)

# ==================== 2FA HELPER ====================

def generate_2fa_code(): return str(random.randint(1000, 9999))

def show_code_in_terminal(email, code):
    print("\n" + "="*70)
    print("🔐  2FA VERIFICATION CODE".center(70))
    print(f"📧 Email: {email}")
    print(f"🔑 Code: \033[92m{code}\033[0m")
    print("="*70 + "\n")


# ==================== LECTURER AUTH ROUTES ====================

@lecturer_bp.route('/login', methods=['GET', 'POST'])
def login():
    session.clear()
    if request.method == 'POST':
        lecturer = Lecturer.query.filter_by(
            lecturer_id=request.form.get('lecturer_id'),
            password=request.form.get('password')
        ).first()
        if lecturer:
            code = generate_2fa_code()
            session['2fa_pending'] = {'id':lecturer.id, 'username':lecturer.lecturer_id, 'email':lecturer.email,
                                      'full_name':lecturer.full_name, 'role':lecturer.role, 'code':code, 'type':'lecturer'}
            show_code_in_terminal(lecturer.email, code)
            return redirect(url_for('lecturer.two_factor'))
        flash('Invalid Lecturer ID or password', 'error')
    return render_template('lecturer_login.html')

@lecturer_bp.route('/2fa', methods=['GET', 'POST'])
def two_factor():
    if '2fa_pending' not in session:
        return redirect(url_for('lecturer.login'))
    
    if request.method == 'POST':
        entered_code = request.form.get('code')
        
        if session['2fa_pending']['code'] == entered_code:
            # Set user session correctly
            session['user_id'] = session['2fa_pending']['id']
            session['username'] = session['2fa_pending']['username']
            session['user_role'] = session['2fa_pending']['role']
            session['full_name'] = session['2fa_pending']['full_name']
            session['user_type'] = session['2fa_pending']['type']
            
            # Update last login
            lecturer = Lecturer.query.get(session['user_id'])
            if lecturer:
                lecturer.last_login = datetime.utcnow()
                db.session.commit()
            
            # Clear pending 2fa
            session.pop('2fa_pending', None)
            
            flash(f'Welcome {lecturer.full_name}!', 'success')
            return redirect(url_for('lecturer.dashboard'))
        else:
            flash('Invalid code', 'error')
    
    return render_template('lecturer_2fa.html')

@lecturer_bp.route('/logout')
def logout():
    session.clear()
    flash('Logged out', 'info')
    return redirect(url_for('lecturer.login'))


# ==================== DASHBOARD ====================

@lecturer_bp.route('/dashboard')
def dashboard():
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    lecturer = Lecturer.query.get(session['user_id'])
    if not lecturer: session.clear(); return redirect(url_for('lecturer.login'))
    
    all_courses = Course.query.filter_by(created_by_id=lecturer.id).all()
    active_courses = [c for c in all_courses if c.is_active]
    draft_courses = [c for c in active_courses if c.approval_status == 'draft']
    total_students = sum(len(c.students) for c in all_courses)
    
    pending_approvals = ApprovalEngine.get_pending_for_user(lecturer)
    
    stats = {
        'active_courses': len(active_courses),
        'draft_courses': len(draft_courses),
        'total_students': total_students,
        'unread_notifications': Notification.query.filter_by(user_id=lecturer.id, user_type='lecturer', is_read=False).count(),
        'pending_course_approvals': len([r for r in pending_approvals if r.submission_type=='course']),
        'pending_ca_approvals': len([r for r in pending_approvals if r.submission_type=='ca']),
        'pending_exam_approvals': len([r for r in pending_approvals if r.submission_type=='exam']),
        'pending_reference_approvals': len([r for r in pending_approvals if r.submission_type=='reference']),
        'total_pending_approvals': len(pending_approvals),
    }
    
    return render_template('lecturer_dashboard.html', lecturer=lecturer, full_name=lecturer.full_name, role=lecturer.role, stats=stats)


# ==================== COURSE MANAGEMENT ====================

@lecturer_bp.route('/courses')
def courses():
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    lecturer = Lecturer.query.get(session['user_id'])
    active = Course.query.filter_by(created_by_id=lecturer.id, is_active=True).order_by(Course.created_at.desc()).all()
    archived = Course.query.filter_by(created_by_id=lecturer.id, is_active=False).order_by(Course.created_at.desc()).all()
    return render_template('lecturer_courses.html', lecturer=lecturer, active_courses=active, archived_courses=archived, full_name=lecturer.full_name, role=lecturer.role)

@lecturer_bp.route('/create-course', methods=['GET', 'POST'])
def create_course():
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    lecturer = Lecturer.query.get(session['user_id'])
    
    if request.method == 'POST':
        full_semester = f"{request.form.get('year')} - {request.form.get('semester')}"
        dept_choice = request.form.get('dept_choice')
        faculty_id = None; department_id = None
        
        if dept_choice == 'other':
            faculty_id = request.form.get('final_faculty_id')
            department_id = request.form.get('final_department_id')
        else:
            if lecturer.department:
                department_id = lecturer.department_id
                faculty_id = lecturer.department.faculty_id
            elif lecturer.faculty:
                faculty_id = lecturer.faculty_id
        
        course = Course(
            course_code=request.form.get('course_code'),
            course_name=request.form.get('course_name'),
            credit_hours=int(request.form.get('credit_hours')),
            semester=full_semester,
            academic_year=request.form.get('academic_year'),
            created_by_id=lecturer.id,
            faculty_id=faculty_id, department_id=department_id,
            course_type='departmental', is_active=True,
            program_type=request.form.get('program_type','BSc'),
            approval_status='draft', is_editable=True
        )
        db.session.add(course); db.session.commit()
        flash('Course created!', 'success')
        return redirect(url_for('lecturer.view_course', course_id=course.id))
    
    return render_template('create_course.html', lecturer=lecturer, faculties=Faculty.query.all(), full_name=lecturer.full_name, role=lecturer.role)

@lecturer_bp.route('/course/<int:course_id>')
def view_course(course_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    course = Course.query.get_or_404(course_id)
    lecturer = Lecturer.query.get(session['user_id'])
    
    has_permission = (course.created_by_id==lecturer.id or
        (lecturer.role=='head_of_department' and course.department_id==lecturer.department_id) or
        (lecturer.role=='dean' and course.faculty_id==lecturer.faculty_id) or
        lecturer.role=='exam_officer')
    
    if not has_permission:
        flash('Permission denied', 'error')
        return redirect(url_for('lecturer.dashboard'))
    
    course_approval = ApprovalRequest.query.filter_by(submission_type='course', submission_id=course_id).first()
    ca_approval = ApprovalRequest.query.filter_by(submission_type='ca', submission_id=course_id).first()
    exam_approval = ApprovalRequest.query.filter_by(submission_type='exam', submission_id=course_id).first()
    
    ca_status = 'not_submitted'; ca_status_text = 'Not Submitted'; ca_status_class = 'badge-not-submitted'
    can_edit_ca = False; show_submit_ca = False
    
    if ca_approval:
        if ca_approval.status == 'finalized': ca_status = 'finalized'; ca_status_text = 'Finalized'; ca_status_class = 'badge-approved'
        elif ca_approval.status == 'rejected': ca_status = 'rejected'; ca_status_text = 'Rejected'; ca_status_class = 'badge-rejected'; can_edit_ca = True; show_submit_ca = True
        else: ca_status = 'pending'; ca_status_text = ca_approval.get_status_display(); ca_status_class = 'badge-pending'
    elif course.approval_status == 'finalized':
        can_edit_ca = True
        all_scored = all(s.test_score is not None for s in course.students)
        show_submit_ca = all_scored and len(course.students)>0
    
    exam_status_text = 'Not Submitted'; exam_status_class = 'badge-not-submitted'
    ca_finalized = ca_approval and ca_approval.status == 'finalized'
    has_exam_scores = any(s.exam_score is not None for s in course.students)
    
    if exam_approval:
        if exam_approval.status == 'finalized': exam_status_text = 'Finalized'; exam_status_class = 'badge-approved'
        elif exam_approval.status == 'rejected': exam_status_text = 'Rejected'; exam_status_class = 'badge-rejected'
        else: exam_status_text = exam_approval.get_status_display(); exam_status_class = 'badge-pending'
    
    return render_template('view_course_new.html', course=course, lecturer=lecturer,
        full_name=lecturer.full_name, role=lecturer.role,
        ca_approval=ca_approval, ca_status=ca_status, ca_status_text=ca_status_text,
        ca_status_class=ca_status_class, can_edit_ca=can_edit_ca, show_submit_ca=show_submit_ca,
        exam_approval=exam_approval, exam_status_text=exam_status_text, exam_status_class=exam_status_class,
        ca_finalized=ca_finalized, has_exam_scores=has_exam_scores, course_approval=course_approval)


@lecturer_bp.route('/course/<int:course_id>/add-students', methods=['GET', 'POST'])
def add_course_students(course_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    course = Course.query.get_or_404(course_id)
    lecturer = Lecturer.query.get(session['user_id'])
    
    if course.created_by_id != lecturer.id:
        flash('Only the course creator can add students', 'error')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    if not course.is_editable:
        flash('Cannot add students while course is under review', 'error')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    if request.method == 'POST':
        student_ids = request.form.getlist('student_ids[]')
        student_names = request.form.getlist('student_names[]')
        added_count = 0
        
        for i in range(len(student_ids)):
            if student_ids[i] and student_names[i]:
                # Check if already in course
                existing = CourseStudent.query.filter_by(
                    course_id=course_id, student_id=student_ids[i]
                ).first()
                if existing:
                    continue
                
                # Add to course
                student = CourseStudent(
                    course_id=course_id,
                    student_id=student_ids[i],
                    student_name=student_names[i],
                    added_by_id=lecturer.id,
                    program_type=course.program_type
                )
                db.session.add(student)
                
                # 🆕 AUTO-CREATE STUDENT ACCOUNT for app registration
                existing_account = Student.query.filter_by(student_id=student_ids[i]).first()
                if not existing_account:
                    # Create a default student account
                    # Default password = student ID (they can change it)
                    new_student_account = Student(
                        student_id=student_ids[i],
                        email=f"{student_ids[i]}@mmtu.edu.sl",  # Default email
                        password_hash=generate_password_hash(student_ids[i])  # Default password = student ID
                    )
                    db.session.add(new_student_account)
                    print(f"✅ Auto-created student account: {student_ids[i]}")
                
                added_count += 1
        
        if added_count > 0:
            db.session.commit()
            flash(f'{added_count} students added successfully! Student accounts created automatically.', 'success')
        
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    return render_template('add_course_students.html', course=course, lecturer=lecturer, full_name=lecturer.full_name, role=lecturer.role)


# ==================== UNIFIED SUBMIT ROUTE ====================

@lecturer_bp.route('/submit/<string:submission_type>/<int:submission_id>', methods=['POST'])
def submit_for_approval(submission_type, submission_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    lecturer = Lecturer.query.get(session['user_id'])
    
    try:
        if submission_type == 'course':
            course = Course.query.get_or_404(submission_id)
            if len(course.students) == 0:
                flash('Add students first', 'error')
                return redirect(url_for('lecturer.view_course', course_id=submission_id))
            ApprovalEngine.submit('course', submission_id, lecturer, course.department_id, course.faculty_id)
            
        elif submission_type == 'ca':
            course = Course.query.get_or_404(submission_id)
            if course.approval_status != 'finalized':
                flash('Course must be finalized first', 'error')
                return redirect(url_for('lecturer.view_course', course_id=submission_id))
            ApprovalEngine.submit('ca', submission_id, lecturer, course.department_id, course.faculty_id)
            
        elif submission_type == 'exam':
            course = Course.query.get_or_404(submission_id)
            if not ApprovalRequest.query.filter_by(submission_type='ca', submission_id=submission_id, status='finalized').first():
                flash('CA must be finalized first', 'error')
                return redirect(url_for('lecturer.view_course', course_id=submission_id))
            ApprovalEngine.submit('exam', submission_id, lecturer, course.department_id, course.faculty_id)
            
        elif submission_type == 'reference':
            ref = ReferenceGrade.query.get_or_404(submission_id)
            if not ref.reference_grade:
                flash('Enter reference grade first', 'error')
                return redirect(url_for('lecturer.reference_management', course_id=ref.course_id))
            ApprovalEngine.submit('reference', submission_id, lecturer, ref.course.department_id, ref.course.faculty_id, ref.course_id)
        
        flash(f'{submission_type.upper()} submitted!', 'success')
    except ValueError as e:
        flash(str(e), 'error')
    
    if submission_type in ['course','ca','exam']:
        return redirect(url_for('lecturer.view_course', course_id=submission_id))
    return redirect(url_for('lecturer.reference_management', course_id=submission_id))


# ==================== UNIFIED APPROVE/REJECT ====================

@lecturer_bp.route('/approve/<int:request_id>', methods=['POST'])
def approve_submission(request_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    try:
        ApprovalEngine.approve(request_id, Lecturer.query.get(session['user_id']))
    except ValueError as e:
        flash(str(e), 'error')
    return redirect(url_for('lecturer.pending_approvals'))

@lecturer_bp.route('/reject/<int:request_id>', methods=['POST'])
def reject_submission(request_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    try:
        ApprovalEngine.reject(request_id, Lecturer.query.get(session['user_id']), request.form.get('reason','No reason'))
    except ValueError as e:
        flash(str(e), 'error')
    return redirect(url_for('lecturer.pending_approvals'))


# ==================== PENDING APPROVALS ====================

@lecturer_bp.route('/pending-approvals')
def pending_approvals():
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    lecturer = Lecturer.query.get(session['user_id'])
    pending = ApprovalEngine.get_pending_for_user(lecturer)
    
    return render_template('pending_approvals.html', lecturer=lecturer, role=lecturer.role, full_name=lecturer.full_name,
        pending_courses=[r for r in pending if r.submission_type=='course'],
        pending_ca=[r for r in pending if r.submission_type=='ca'],
        pending_exam=[r for r in pending if r.submission_type=='exam'],
        pending_references=[r for r in pending if r.submission_type=='reference'],
        active_tab=request.args.get('tab','courses'))


# ==================== CA & EXAM ENTRY ====================

@lecturer_bp.route('/course/<int:course_id>/enter-ca', methods=['GET', 'POST'])
def enter_continuous_assessment(course_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    course = Course.query.get_or_404(course_id)
    lecturer = Lecturer.query.get(session['user_id'])
    
    if course.created_by_id != lecturer.id:
        flash('Permission denied', 'error')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    if course.approval_status != 'finalized':
        flash('Course must be finalized first', 'error')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    existing = ApprovalRequest.query.filter_by(submission_type='ca', submission_id=course_id).first()
    if existing and existing.status not in ['rejected','draft']:
        flash('CA already submitted', 'warning')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    students = CourseStudent.query.filter_by(course_id=course_id).all()
    
    if request.method == 'POST':
        for student in students:
            for key, attr in [('test', 'test_score'), ('assignment', 'assignment_score'), ('attendance', 'attendance_score')]:
                val = request.form.get(f'{key}_{student.id}')
                if val: setattr(student, attr, float(val))
            student.calculate_ca()
        db.session.commit()
        flash('CA scores saved!', 'success')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    return render_template('enter_ca.html', course=course, students=students, lecturer=lecturer, full_name=lecturer.full_name, role=lecturer.role)

@lecturer_bp.route('/course/<int:course_id>/enter-exam-grades', methods=['GET', 'POST'])
def enter_exam_grades(course_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    course = Course.query.get_or_404(course_id)
    lecturer = Lecturer.query.get(session['user_id'])
    
    if course.created_by_id != lecturer.id:
        flash('Permission denied', 'error')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    if not ApprovalRequest.query.filter_by(submission_type='ca', submission_id=course_id, status='finalized').first():
        flash('CA must be finalized first', 'error')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    students = CourseStudent.query.filter_by(course_id=course_id).all()
    
    if request.method == 'POST':
        for student in students:
            val = request.form.get(f'exam_{student.id}')
            if val:
                student.exam_score = float(val)
                student.calculate_total()
                if student.grade in ['E','F']:
                    if not ReferenceGrade.query.filter_by(course_id=course_id, student_id=student.id).first():
                        db.session.add(ReferenceGrade(course_id=course_id, student_id=student.id,
                            original_grade=student.grade, original_score=student.total_score or 0,
                            original_credit_hours=course.credit_hours, reference_status='pending', approval_status='draft'))
        db.session.commit()
        flash('Exam grades saved!', 'success')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    return render_template('enter_exam_grades.html', course=course, students=students, lecturer=lecturer, full_name=lecturer.full_name, role=lecturer.role)


# ==================== REFERENCE MANAGEMENT ====================

@lecturer_bp.route('/course/<int:course_id>/reference-management')
def reference_management(course_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    course = Course.query.get_or_404(course_id)
    lecturer = Lecturer.query.get(session['user_id'])
    
    if course.created_by_id != lecturer.id:
        flash('Permission denied', 'error')
        return redirect(url_for('lecturer.view_course', course_id=course_id))
    
    references = ReferenceGrade.query.filter_by(course_id=course_id).all()
    needing = [s for s in course.students if s.grade in ['E','F'] and not ReferenceGrade.query.filter_by(course_id=course_id, student_id=s.id).first()]
    
    return render_template('reference_management.html', course=course, references=references,
        students_needing_references=needing, lecturer=lecturer, full_name=lecturer.full_name, role=lecturer.role)

@lecturer_bp.route('/course/<int:course_id>/create-missing-references', methods=['POST'])
def create_missing_references(course_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    course = Course.query.get_or_404(course_id)
    created = 0
    for s in course.students:
        if s.grade in ['E','F'] and not ReferenceGrade.query.filter_by(course_id=course_id, student_id=s.id).first():
            db.session.add(ReferenceGrade(course_id=course_id, student_id=s.id, original_grade=s.grade,
                original_score=s.total_score or 0, original_credit_hours=course.credit_hours, reference_status='pending', approval_status='draft'))
            created += 1
    db.session.commit()
    flash(f'{created} references created', 'success')
    return redirect(url_for('lecturer.reference_management', course_id=course_id))

@lecturer_bp.route('/update-reference-grade/<int:ref_id>', methods=['POST'])
def update_reference_grade(ref_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    ref = ReferenceGrade.query.get_or_404(ref_id)
    score = float(request.form.get('new_score', 0))
    
    if score >= 75: grade = 'A'
    elif score >= 65: grade = 'B'
    elif score >= 50: grade = 'C'
    elif score >= 40: grade = 'D'
    elif score >= 30: grade = 'E'
    else: grade = 'F'
    
    ref.reference_score = score
    ref.reference_grade = grade
    ref.display_grade = f"{grade}/{ref.original_grade}"
    ref.approval_status = 'draft'
    db.session.commit()
    flash(f'Reference grade updated to {grade}', 'success')
    return redirect(url_for('lecturer.reference_management', course_id=ref.course_id))


# ==================== NOTIFICATIONS ====================

@lecturer_bp.route('/notifications')
def notifications():
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    
    lecturer = Lecturer.query.get(session['user_id'])
    notifs = Notification.query.filter_by(user_id=lecturer.id, user_type='lecturer', is_dismissed=False).order_by(Notification.created_at.desc()).limit(50).all()
    for n in notifs:
        if not n.is_read: n.is_read = True
    db.session.commit()
    
    return render_template('lecturer_notifications.html', lecturer=lecturer, notifications=notifs, full_name=lecturer.full_name)

@lecturer_bp.route('/notifications/count')
def notification_count():
    if 'user_id' not in session: return jsonify({'count': 0})
    return jsonify({'count': Notification.query.filter_by(user_id=session['user_id'], is_read=False, is_dismissed=False).count()})


# ==================== COURSE HISTORY & ARCHIVE ====================

@lecturer_bp.route('/archive-course/<int:course_id>', methods=['POST'])
def archive_course(course_id):
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    course = Course.query.get_or_404(course_id)
    if course.created_by_id != Lecturer.query.get(session['user_id']).id:
        flash('Permission denied', 'error')
        return redirect(url_for('lecturer.courses'))
    course.is_active = False
    db.session.commit()
    flash('Course archived', 'success')
    return redirect(url_for('lecturer.courses'))

@lecturer_bp.route('/course-history')
def course_history():
    if 'user_id' not in session or session.get('user_type') != 'lecturer':
        return redirect(url_for('lecturer.login'))
    lecturer = Lecturer.query.get(session['user_id'])
    courses = Course.query.filter_by(created_by_id=lecturer.id, is_active=False).order_by(Course.created_at.desc()).all()
    return render_template('course_history.html', lecturer=lecturer, courses=courses, full_name=lecturer.full_name, role=lecturer.role)


# ==================== API ====================

@lecturer_bp.route('/api/get-student/<string:student_id>')
def api_get_student(student_id):
    if 'user_id' not in session: return jsonify({'error':'Unauthorized'}), 401
    student = CourseStudent.query.filter_by(student_id=student_id).first()
    if student: return jsonify({'found':True, 'student_id':student.student_id, 'student_name':student.student_name})
    return jsonify({'found':False}), 404


# ==================== CONTEXT PROCESSOR ====================

@lecturer_bp.context_processor
def utility_processor():
    return {'now': datetime.now}
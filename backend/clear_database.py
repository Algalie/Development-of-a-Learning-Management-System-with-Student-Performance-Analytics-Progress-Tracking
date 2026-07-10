"""
Database Cleanup Script
Clears all data EXCEPT: Faculties, Departments, Lecturers, Admins, and specific test data
Run: python clear_database.py
"""

from app import create_app
from extensions import db
from models.session import UserSession, TranscriptRecord
from models.academic import Course, CourseStudent
from models.assessment import ContinuousAssessment, AssessmentGrade
from models.reference import ReferenceGrade
from models.approval import ApprovalRequest, ApprovalStep, ApprovalHistory, CourseApproval, CourseAssessmentApproval
from models.gpa import StudentGPA, StudentAcademicStatus, StudentGradeRecord
from models.notification import Notification
from models.user import Student

app = create_app()

with app.app_context():
    print("\n" + "="*60)
    print(" DATABASE CLEANUP SCRIPT")
    print("="*60)
    
    # ==================== DATA TO KEEP ====================
    # These students and their related data will be preserved
    KEEP_STUDENT_IDS = [
        '7377',   # Osman - test student
        '7626',   # Test student with failure history
        '2222',   # Test student
        '7654',   # Test student
        '7665',   # Test student
        '4744',   # Test student
        '8945',   # Test student
    ]
    
    # These courses will be preserved
    KEEP_COURSE_IDS = []
    
    print(f"\nPreserving {len(KEEP_STUDENT_IDS)} student(s): {', '.join(KEEP_STUDENT_IDS)}")
    print("Keeping: Faculties, Departments, Lecturers, Admins")
    print("Deleting: All other data\n")
    
    # ==================== GET IDs TO KEEP ====================
    # Get course IDs associated with kept students
    kept_student_records = CourseStudent.query.filter(
        CourseStudent.student_id.in_(KEEP_STUDENT_IDS)
    ).all()
    
    KEEP_COURSE_IDS = list(set([cs.course_id for cs in kept_student_records]))
    keep_course_student_ids = [cs.id for cs in kept_student_records]
    
    print(f"Preserving {len(KEEP_COURSE_IDS)} linked course(s)")
    print(f"Preserving {len(keep_course_student_ids)} course-student enrollment(s)\n")
    
    # ==================== DELETE IN ORDER ====================
    deletions = []
    
    # Notifications - delete all except maybe keep none for clean slate
    try:
        count = Notification.query.count()
        Notification.query.delete()
        print(f"✓ Deleted {count} Notifications")
    except Exception as e:
        print(f"✗ Failed to delete Notifications: {str(e)}")
    
    # Transcript Records - delete all
    try:
        count = TranscriptRecord.query.count()
        TranscriptRecord.query.delete()
        print(f"✓ Deleted {count} Transcript Records")
    except Exception as e:
        print(f"✗ Failed to delete Transcript Records: {str(e)}")
    
    # User Sessions - delete all
    try:
        count = UserSession.query.count()
        UserSession.query.delete()
        print(f"✓ Deleted {count} User Sessions")
    except Exception as e:
        print(f"✗ Failed to delete User Sessions: {str(e)}")
    
    # Assessment Grades - delete those not linked to kept students
    try:
        if keep_course_student_ids:
            count = AssessmentGrade.query.filter(
                ~AssessmentGrade.student_id.in_(keep_course_student_ids)
            ).delete(synchronize_session='fetch')
        else:
            count = AssessmentGrade.query.count()
            AssessmentGrade.query.delete()
        print(f"✓ Deleted {count} Assessment Grades (preserved those for kept students)")
    except Exception as e:
        print(f"✗ Failed to delete Assessment Grades: {str(e)}")
    
    # Continuous Assessments - delete those not linked to kept courses
    try:
        if KEEP_COURSE_IDS:
            count = ContinuousAssessment.query.filter(
                ~ContinuousAssessment.course_id.in_(KEEP_COURSE_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = ContinuousAssessment.query.count()
            ContinuousAssessment.query.delete()
        print(f"✓ Deleted {count} Continuous Assessments (preserved those for kept courses)")
    except Exception as e:
        print(f"✗ Failed to delete Continuous Assessments: {str(e)}")
    
    # Reference Grades - delete those not linked to kept courses
    try:
        if KEEP_COURSE_IDS:
            count = ReferenceGrade.query.filter(
                ~ReferenceGrade.course_id.in_(KEEP_COURSE_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = ReferenceGrade.query.count()
            ReferenceGrade.query.delete()
        print(f"✓ Deleted {count} Reference Grades (preserved those for kept courses)")
    except Exception as e:
        print(f"✗ Failed to delete Reference Grades: {str(e)}")
    
    # Approval Steps - delete those not linked to kept courses
    try:
        if KEEP_COURSE_IDS:
            # Get approval request IDs linked to kept courses
            keep_approval_ids = [ar.id for ar in ApprovalRequest.query.filter(
                ApprovalRequest.course_id.in_(KEEP_COURSE_IDS)
            ).all()]
            if keep_approval_ids:
                count = ApprovalStep.query.filter(
                    ~ApprovalStep.request_id.in_(keep_approval_ids)
                ).delete(synchronize_session='fetch')
            else:
                count = ApprovalStep.query.count()
                ApprovalStep.query.delete()
        else:
            count = ApprovalStep.query.count()
            ApprovalStep.query.delete()
        print(f"✓ Deleted {count} Approval Steps (preserved those for kept courses)")
    except Exception as e:
        print(f"✗ Failed to delete Approval Steps: {str(e)}")
    
    # Approval History - delete all
    try:
        count = ApprovalHistory.query.count()
        ApprovalHistory.query.delete()
        print(f"✓ Deleted {count} Approval History records")
    except Exception as e:
        print(f"✗ Failed to delete Approval History: {str(e)}")
    
    # Course Assessment Approvals - delete those not linked to kept courses
    try:
        if KEEP_COURSE_IDS:
            count = CourseAssessmentApproval.query.filter(
                ~CourseAssessmentApproval.course_id.in_(KEEP_COURSE_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = CourseAssessmentApproval.query.count()
            CourseAssessmentApproval.query.delete()
        print(f"✓ Deleted {count} Course Assessment Approvals (preserved those for kept courses)")
    except Exception as e:
        print(f"✗ Failed to delete Course Assessment Approvals: {str(e)}")
    
    # Course Approvals - delete those not linked to kept courses
    try:
        if KEEP_COURSE_IDS:
            count = CourseApproval.query.filter(
                ~CourseApproval.course_id.in_(KEEP_COURSE_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = CourseApproval.query.count()
            CourseApproval.query.delete()
        print(f"✓ Deleted {count} Course Approvals (preserved those for kept courses)")
    except Exception as e:
        print(f"✗ Failed to delete Course Approvals: {str(e)}")
    
    # Approval Requests - delete those not linked to kept courses
    try:
        if KEEP_COURSE_IDS:
            count = ApprovalRequest.query.filter(
                ~ApprovalRequest.course_id.in_(KEEP_COURSE_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = ApprovalRequest.query.count()
            ApprovalRequest.query.delete()
        print(f"✓ Deleted {count} Approval Requests (preserved those for kept courses)")
    except Exception as e:
        print(f"✗ Failed to delete Approval Requests: {str(e)}")
    
    # Course Students - delete those NOT linked to kept students
    try:
        if KEEP_STUDENT_IDS:
            count = CourseStudent.query.filter(
                ~CourseStudent.student_id.in_(KEEP_STUDENT_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = CourseStudent.query.count()
            CourseStudent.query.delete()
        print(f"✓ Deleted {count} Course Students (preserved {len(KEEP_STUDENT_IDS)} student enrollments)")
    except Exception as e:
        print(f"✗ Failed to delete Course Students: {str(e)}")
    
    # Courses - delete those NOT in kept list
    try:
        if KEEP_COURSE_IDS:
            count = Course.query.filter(
                ~Course.id.in_(KEEP_COURSE_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = Course.query.count()
            Course.query.delete()
        print(f"✓ Deleted {count} Courses (preserved {len(KEEP_COURSE_IDS)} courses)")
    except Exception as e:
        print(f"✗ Failed to delete Courses: {str(e)}")
    
    # Student GPA Records - delete those not for kept students
    try:
        if KEEP_STUDENT_IDS:
            count = StudentGPA.query.filter(
                ~StudentGPA.student_id.in_(KEEP_STUDENT_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = StudentGPA.query.count()
            StudentGPA.query.delete()
        print(f"✓ Deleted {count} Student GPA Records (preserved those for kept students)")
    except Exception as e:
        print(f"✗ Failed to delete Student GPA Records: {str(e)}")
    
    # Student Academic Status - delete those not for kept students
    try:
        if KEEP_STUDENT_IDS:
            count = StudentAcademicStatus.query.filter(
                ~StudentAcademicStatus.student_id.in_(KEEP_STUDENT_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = StudentAcademicStatus.query.count()
            StudentAcademicStatus.query.delete()
        print(f"✓ Deleted {count} Student Academic Status records (preserved those for kept students)")
    except Exception as e:
        print(f"✗ Failed to delete Student Academic Status: {str(e)}")
    
    # Student Grade Records - delete those not for kept students
    try:
        if KEEP_STUDENT_IDS:
            count = StudentGradeRecord.query.filter(
                ~StudentGradeRecord.student_id.in_(KEEP_STUDENT_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = StudentGradeRecord.query.count()
            StudentGradeRecord.query.delete()
        print(f"✓ Deleted {count} Student Grade Records (preserved those for kept students)")
    except Exception as e:
        print(f"✗ Failed to delete Student Grade Records: {str(e)}")
    
    # Students - delete those NOT in kept list
    try:
        if KEEP_STUDENT_IDS:
            count = Student.query.filter(
                ~Student.student_id.in_(KEEP_STUDENT_IDS)
            ).delete(synchronize_session='fetch')
        else:
            count = Student.query.count()
            Student.query.delete()
        print(f"✓ Deleted {count} Students (preserved {len(KEEP_STUDENT_IDS)} test students)")
    except Exception as e:
        print(f"✗ Failed to delete Students: {str(e)}")
    
    db.session.commit()
    
    print("\n" + "="*60)
    print(" CLEANUP COMPLETE")
    print("="*60)
    print("\nRemaining data:")
    
    from models.user import Admin, Lecturer
    from models.academic import Faculty, Department
    
    faculties = Faculty.query.count()
    departments = Department.query.count()
    lecturers = Lecturer.query.count()
    admins = Admin.query.count()
    students = Student.query.count()
    courses = Course.query.count()
    course_students = CourseStudent.query.count()
    references = ReferenceGrade.query.count()
    gpa_records = StudentGPA.query.count()
    
    print(f"  Faculties:        {faculties}")
    print(f"  Departments:      {departments}")
    print(f"  Lecturers:        {lecturers}")
    print(f"  Admins:           {admins}")
    print(f"  Students:         {students}")
    print(f"  Courses:          {courses}")
    print(f"  Course Enrollments: {course_students}")
    print(f"  Reference Grades: {references}")
    print(f"  GPA Records:      {gpa_records}")
    print(f"\n  Preserved Student IDs: {', '.join(KEEP_STUDENT_IDS)}")
    print()
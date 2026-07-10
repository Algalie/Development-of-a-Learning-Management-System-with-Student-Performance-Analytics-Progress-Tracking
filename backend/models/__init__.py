from extensions import db

from .user import Admin, Student, Lecturer
from .academic import Faculty, Department, Course, CourseStudent
from .assessment import ContinuousAssessment, AssessmentGrade
from .reference import ReferenceGrade
from .approval import ApprovalRequest, ApprovalStep, ApprovalHistory, CourseApproval, CourseAssessmentApproval
from .gpa import StudentGPA, StudentAcademicStatus, StudentGradeRecord
from .notification import Notification
from .session import UserSession, TranscriptRecord

__all__ = [
    'Admin', 'Student', 'Lecturer',
    'Faculty', 'Department', 'Course', 'CourseStudent',
    'ContinuousAssessment', 'AssessmentGrade',
    'ReferenceGrade',
    'ApprovalRequest', 'ApprovalStep', 'ApprovalHistory', 'CourseApproval', 'CourseAssessmentApproval',
    'StudentGPA', 'StudentAcademicStatus', 'StudentGradeRecord',
    'Notification',
    'UserSession', 'TranscriptRecord' '',
]
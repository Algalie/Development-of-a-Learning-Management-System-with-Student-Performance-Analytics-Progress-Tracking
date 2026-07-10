import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import LecturerLayout from './components/layout/LecturerLayout';

// Auth Pages
import LandingPage from './pages/auth/LandingPage';
import AdminLogin from './pages/auth/AdminLogin';
import LecturerLogin from './pages/auth/LecturerLogin';
import Admin2FA from './pages/auth/Admin2FA';
import Lecturer2FA from './pages/auth/Lecturer2FA';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Analytics from './pages/admin/Analytics';
import ManageUsers from './pages/admin/ManageUsers';
import FacultyManagement from './pages/admin/FacultyManagement';
import AddFaculty from './pages/admin/AddFaculty';
import EditFaculty from './pages/admin/EditFaculty';
import AddDepartment from './pages/admin/AddDepartment';
import EditDepartment from './pages/admin/EditDepartment';
import AddAdmin from './pages/admin/AddAdmin';
import AddLecturer from './pages/admin/AddLecturer';
import EditLecturer from './pages/admin/EditLecturer';
import CourseApprovals from './pages/admin/CourseApprovals';
import GradeApprovals from './pages/admin/GradeApprovals';
import ExamOfficeSubmissions from './pages/admin/ExamOfficeSubmissions';
import ReferenceManagement from './pages/admin/ReferenceManagement';
import ReferenceDashboard from './pages/admin/ReferenceDashboard';
import ReferenceApprovals from './pages/admin/ReferenceApprovals';
import GPACalculator from './pages/admin/GPACalculator';
import Transcript from './pages/admin/Transcript';
import FailureHistory from './pages/admin/FailureHistory';
import ApprovalHistory from './pages/admin/ApprovalHistory';
import Notifications from './pages/admin/Notifications';
import ViewCourse from './pages/admin/ViewCourse';
import ViewSubmission from './pages/admin/ViewSubmission';
import ViewCASubmission from './pages/admin/ViewCASubmission';
import ViewExamSubmission from './pages/admin/ViewExamSubmission';
import ViewReferenceGrade from './pages/admin/ViewReferenceGrade';

// Lecturer Pages
import LecturerDashboard from './pages/lecturer/Dashboard';
import MyCourses from './pages/lecturer/MyCourses';
import CreateCourse from './pages/lecturer/CreateCourse';
import ViewCourseLecturer from './pages/lecturer/ViewCourse';
import CourseHistory from './pages/lecturer/CourseHistory';
import AddCourseStudents from './pages/lecturer/AddCourseStudents';
import AddAssessment from './pages/lecturer/AddAssessment';
import EnterCA from './pages/lecturer/EnterCA';
import EnterExam from './pages/lecturer/EnterExam';
import ReferenceManagementLecturer from './pages/lecturer/ReferenceManagement';
import PendingApprovals from './pages/lecturer/PendingApprovals';
import AssessmentNotifications from './pages/lecturer/AssessmentNotifications';
import LecturerNotifications from './pages/lecturer/Notifications';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        gap: '1rem',
      }}>
        <div className="loading-spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--border-primary)',
          borderTop: '4px solid #FFC107',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          fontWeight: 500,
        }}>
          Loading application...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/2fa" element={<Admin2FA />} />
          <Route path="/lecturer/login" element={<LecturerLogin />} />
          <Route path="/lecturer/2fa" element={<Lecturer2FA />} />

          {/* ==================== ADMIN ROUTES ==================== */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* Analytics */}
            <Route path="analytics" element={<Analytics />} />

            {/* User Management */}
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="add-admin" element={<AddAdmin />} />
            <Route path="add-lecturer" element={<AddLecturer />} />
            <Route path="edit-lecturer/:id" element={<EditLecturer />} />

            {/* Faculty & Department */}
            <Route path="faculty-management" element={<FacultyManagement />} />
            <Route path="add-faculty" element={<AddFaculty />} />
            <Route path="edit-faculty/:id" element={<EditFaculty />} />
            <Route path="add-department/:facultyId" element={<AddDepartment />} />
            <Route path="edit-department/:id" element={<EditDepartment />} />

            {/* Approvals */}
            <Route path="course-approvals" element={<CourseApprovals />} />
            <Route path="grade-approvals" element={<GradeApprovals />} />
            <Route path="exam-office-submissions" element={<ExamOfficeSubmissions />} />
            <Route path="approval-history" element={<ApprovalHistory />} />

            {/* View Details */}
            <Route path="course/:id/view" element={<ViewCourse />} />
            <Route path="submission/:id/view" element={<ViewSubmission />} />
            <Route path="ca-submission/:id" element={<ViewCASubmission />} />
            <Route path="exam-submission/:id" element={<ViewExamSubmission />} />
            <Route path="reference-grade/:id" element={<ViewReferenceGrade />} />

            {/* References */}
            <Route path="reference-management" element={<ReferenceManagement />} />
            <Route path="reference-dashboard" element={<ReferenceDashboard />} />
            <Route path="reference-approvals" element={<ReferenceApprovals />} />

            {/* Tools */}
            <Route path="gpa-calculator" element={<GPACalculator />} />
            <Route path="transcript" element={<Transcript />} />
            <Route path="failure-history" element={<FailureHistory />} />

            {/* Notifications */}
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* ==================== LECTURER ROUTES ==================== */}
          <Route path="/lecturer" element={<LecturerLayout />}>
            <Route index element={<LecturerDashboard />} />
            <Route path="dashboard" element={<LecturerDashboard />} />

            {/* Courses */}
            <Route path="courses" element={<MyCourses />} />
            <Route path="create-course" element={<CreateCourse />} />
            <Route path="course/:id" element={<ViewCourseLecturer />} />
            <Route path="course-history" element={<CourseHistory />} />

            {/* Students */}
            <Route path="course/:id/add-students" element={<AddCourseStudents />} />

            {/* Assessments */}
            <Route path="course/:id/add-assessment" element={<AddAssessment />} />

            {/* Grades */}
            <Route path="course/:id/enter-ca" element={<EnterCA />} />
            <Route path="course/:id/enter-exam" element={<EnterExam />} />

            {/* References */}
            <Route path="course/:id/reference-management" element={<ReferenceManagementLecturer />} />

            {/* Approvals */}
            <Route path="pending-approvals" element={<PendingApprovals />} />
            <Route path="assessment-notifications" element={<AssessmentNotifications />} />

            {/* Notifications */}
            <Route path="notifications" element={<LecturerNotifications />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </ThemeProvider>
  );
}

export default App;
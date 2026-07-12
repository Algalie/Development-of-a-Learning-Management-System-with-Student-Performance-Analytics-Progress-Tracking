import axios from 'axios';

// ✅ RENDER PRODUCTION URL
const API_URL = 'https://gpa-backend-p2xu.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminApi = {
  // DASHBOARD
  getDashboardStats: () =>
    axios.get(`${API_URL}/admin/dashboard`, { headers: getAuthHeaders() }),

  // USER MANAGEMENT
  getAdmins: () =>
    axios.get(`${API_URL}/admin/admins`, { headers: getAuthHeaders() }),

  getLecturers: () =>
    axios.get(`${API_URL}/admin/lecturers`, { headers: getAuthHeaders() }),

  addAdmin: (data) =>
    axios.post(`${API_URL}/admin/add-admin`, data, { headers: getAuthHeaders() }),

  addLecturer: (data) =>
    axios.post(`${API_URL}/admin/add-lecturer`, data, { headers: getAuthHeaders() }),

  editLecturer: (id, data) =>
    axios.put(`${API_URL}/admin/edit-lecturer/${id}`, data, { headers: getAuthHeaders() }),

  deleteLecturer: (id) =>
    axios.delete(`${API_URL}/admin/delete-lecturer/${id}`, { headers: getAuthHeaders() }),

  // FACULTY & DEPARTMENT
  getFaculties: () =>
    axios.get(`${API_URL}/admin/faculties`, { headers: getAuthHeaders() }),

  addFaculty: (data) =>
    axios.post(`${API_URL}/admin/add-faculty`, data, { headers: getAuthHeaders() }),

  editFaculty: (id, data) =>
    axios.put(`${API_URL}/admin/edit-faculty/${id}`, data, { headers: getAuthHeaders() }),

  deleteFaculty: (id) =>
    axios.delete(`${API_URL}/admin/delete-faculty/${id}`, { headers: getAuthHeaders() }),

  addDepartment: (facultyId, data) =>
    axios.post(`${API_URL}/admin/add-department/${facultyId}`, data, { headers: getAuthHeaders() }),

  editDepartment: (id, data) =>
    axios.put(`${API_URL}/admin/edit-department/${id}`, data, { headers: getAuthHeaders() }),

  deleteDepartment: (id) =>
    axios.delete(`${API_URL}/admin/delete-department/${id}`, { headers: getAuthHeaders() }),

  getDepartments: (facultyId) =>
    axios.get(`${API_URL}/admin/api/departments/${facultyId}`, { headers: getAuthHeaders() }),

  // APPROVALS
  getCourseApprovals: () =>
    axios.get(`${API_URL}/admin/course-approvals`, { headers: getAuthHeaders() }),

  viewCourse: (id) =>
    axios.get(`${API_URL}/admin/course/${id}/view`, { headers: getAuthHeaders() }),

  getGradeApprovals: () =>
    axios.get(`${API_URL}/admin/grade-approvals`, { headers: getAuthHeaders() }),

  getExamOfficeSubmissions: () =>
    axios.get(`${API_URL}/admin/exam-office-submissions`, { headers: getAuthHeaders() }),

  viewSubmission: (id) =>
    axios.get(`${API_URL}/admin/submission/${id}/view`, { headers: getAuthHeaders() }),

  examApprove: (id) =>
    axios.post(`${API_URL}/admin/exam-approve/${id}`, {}, { headers: getAuthHeaders() }),

  examReject: (id, reason) =>
    axios.post(`${API_URL}/admin/exam-reject/${id}`, { reason }, { headers: getAuthHeaders() }),

  getApprovalHistory: () =>
    axios.get(`${API_URL}/admin/approval-history`, { headers: getAuthHeaders() }),

  // REFERENCES
  getReferenceManagement: (studentId) =>
    axios.get(`${API_URL}/admin/reference-management`, { headers: getAuthHeaders(), params: { student_id: studentId } }),

  getReferenceDashboard: () =>
    axios.get(`${API_URL}/admin/reference-dashboard`, { headers: getAuthHeaders() }),

  deleteAllReferences: () =>
    axios.post(`${API_URL}/admin/api/delete-all-references`, {}, { headers: getAuthHeaders() }),

  resetAllReferences: () =>
    axios.post(`${API_URL}/admin/api/reset-all-references`, {}, { headers: getAuthHeaders() }),

  // GPA & TRANSCRIPT
  getStudentGrades: (data) =>
    axios.post(`${API_URL}/admin/api/student-grades`, data, { headers: getAuthHeaders() }),

  calculateGPA: (data) =>
    axios.post(`${API_URL}/admin/api/calculate-student-gpa`, data, { headers: getAuthHeaders() }),

  getTranscript: (studentId) =>
    axios.get(`${API_URL}/admin/transcript`, { headers: getAuthHeaders(), params: { student_id: studentId } }),

  saveTranscript: (data) =>
    axios.post(`${API_URL}/admin/save-transcript`, data, { headers: getAuthHeaders() }),

  verifyTranscript: (transcriptId) =>
    axios.get(`${API_URL}/admin/verify-transcript/${transcriptId}`, { headers: getAuthHeaders() }),

  // DEPARTMENT STUDENTS
  getDepartmentStudents: (params) =>
    axios.get(`${API_URL}/admin/department-students`, { headers: getAuthHeaders(), params }),

  getFailureHistory: (studentId) =>
    axios.get(`${API_URL}/admin/api/failure-history/${studentId}`, { headers: getAuthHeaders() }),

  deleteStudent: (studentId) =>
    axios.delete(`${API_URL}/admin/api/delete-student/${studentId}`, { headers: getAuthHeaders() }),

  // NOTIFICATIONS
  getNotifications: () =>
    axios.get(`${API_URL}/admin/notifications`, { headers: getAuthHeaders() }),

  getNotificationCount: () =>
    axios.get(`${API_URL}/admin/notifications/count`, { headers: getAuthHeaders() }),

  // GRADE EDIT REQUESTS
  getGradeEditRequests: () =>
    axios.get(`${API_URL}/admin/grade-edit-requests`, { headers: getAuthHeaders() }),

  activateGradeEdit: (id, data) =>
    axios.post(`${API_URL}/admin/activate-grade-edit/${id}`, data, { headers: getAuthHeaders() }),

  // BLOCK GPA
  checkDepartmentCourses: (data) =>
    axios.post(`${API_URL}/admin/api/block-gpa/check-department`, data, { headers: getAuthHeaders() }),

  calculateBlockGPA: (data) =>
    axios.post(`${API_URL}/admin/api/block-gpa/calculate`, data, { headers: getAuthHeaders() }),

  notifyMissingStudents: (data) =>
    axios.post(`${API_URL}/admin/api/block-gpa/notify-missing`, data, { headers: getAuthHeaders() }),

  notifyLecturerMissing: (data) =>
    axios.post(`${API_URL}/admin/api/block-gpa/notify-lecturer`, data, { headers: getAuthHeaders() }),
};
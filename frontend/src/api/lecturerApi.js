import axios from 'axios';

// ✅ RENDER PRODUCTION URL
const API_URL = 'https://gpa-backend-p2xu.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const lecturerApi = {
  // DASHBOARD
  getDashboardStats: () =>
    axios.get(`${API_URL}/lecturer/dashboard`, { headers: getAuthHeaders() }),

  // COURSES
  getCourses: () =>
    axios.get(`${API_URL}/lecturer/courses`, { headers: getAuthHeaders() }),

  getCourseHistory: () =>
    axios.get(`${API_URL}/lecturer/course-history`, { headers: getAuthHeaders() }),

  createCourse: (data) =>
    axios.post(`${API_URL}/lecturer/create-course`, data, { headers: getAuthHeaders() }),

  viewCourse: (id) =>
    axios.get(`${API_URL}/lecturer/course/${id}`, { headers: getAuthHeaders() }),

  archiveCourse: (id) =>
    axios.post(`${API_URL}/lecturer/archive-course/${id}`, {}, { headers: getAuthHeaders() }),

  // STUDENTS
  addCourseStudents: (id, data) =>
    axios.post(`${API_URL}/lecturer/course/${id}/add-students`, data, { headers: getAuthHeaders() }),

  autoEnrollStudents: (id) =>
    axios.post(`${API_URL}/lecturer/course/${id}/auto-enroll-students`, {}, { headers: getAuthHeaders() }),

  getStudentInfo: (studentId) =>
    axios.get(`${API_URL}/lecturer/api/get-student/${studentId}`, { headers: getAuthHeaders() }),

  // GRADES
  enterGrades: (id, data) =>
    axios.post(`${API_URL}/lecturer/course/${id}/enter-grades`, data, { headers: getAuthHeaders() }),

  submitGrades: (id, data) =>
    axios.post(`${API_URL}/lecturer/submit-grades/${id}`, data, { headers: getAuthHeaders() }),

  enterCA: (id, data) =>
    axios.post(`${API_URL}/lecturer/course/${id}/enter-ca`, data, { headers: getAuthHeaders() }),

  enterExamGrades: (id, data) =>
    axios.post(`${API_URL}/lecturer/course/${id}/enter-exam-grades`, data, { headers: getAuthHeaders() }),

  // SUBMISSIONS
  submitForApproval: (type, id) =>
    axios.post(`${API_URL}/lecturer/submit/${type}/${id}`, {}, { headers: getAuthHeaders() }),

  // APPROVALS
  getPendingApprovals: () =>
    axios.get(`${API_URL}/lecturer/pending-approvals`, { headers: getAuthHeaders() }),

  approveSubmission: (id, data = {}) =>
    axios.post(`${API_URL}/lecturer/approve/${id}`, data, { headers: getAuthHeaders() }),

  rejectSubmission: (id, reason) =>
    axios.post(`${API_URL}/lecturer/reject/${id}`, { reason }, { headers: getAuthHeaders() }),

  // REFERENCES
  getReferenceManagement: (id) =>
    axios.get(`${API_URL}/lecturer/course/${id}/reference-management`, { headers: getAuthHeaders() }),

  createMissingReferences: (id) =>
    axios.post(`${API_URL}/lecturer/course/${id}/create-missing-references`, {}, { headers: getAuthHeaders() }),

  updateReferenceGrade: (refId, data) =>
    axios.post(`${API_URL}/lecturer/update-reference-grade/${refId}`, data, { headers: getAuthHeaders() }),

  // GRADE EDIT REQUESTS
  requestGradeEdit: (data) =>
    axios.post(`${API_URL}/lecturer/request-grade-edit`, data, { headers: getAuthHeaders() }),

  getGradeEditRequests: () =>
    axios.get(`${API_URL}/lecturer/grade-edit-requests`, { headers: getAuthHeaders() }),

  reviewGradeEdit: (id, data) =>
    axios.post(`${API_URL}/lecturer/review-grade-edit/${id}`, data, { headers: getAuthHeaders() }),

  // NOTIFICATIONS
  getNotifications: () =>
    axios.get(`${API_URL}/lecturer/notifications`, { headers: getAuthHeaders() }),

  getNotificationCount: () =>
    axios.get(`${API_URL}/lecturer/notifications/count`, { headers: getAuthHeaders() }),

  getAssessmentNotifications: () =>
    axios.get(`${API_URL}/lecturer/assessment-notifications`, { headers: getAuthHeaders() }),

  // APPROVAL HISTORY
  getMyApprovalHistory: () =>
    axios.get(`${API_URL}/lecturer/approval-history`, { headers: getAuthHeaders() }),

  forwardMissingStudent: (data) =>
    axios.post(`${API_URL}/lecturer/forward-missing-student`, data, { headers: getAuthHeaders() }),

  // ASSESSMENTS
  addAssessment: (id, data) =>
    axios.post(`${API_URL}/lecturer/course/${id}/assessments`, data, { headers: getAuthHeaders() }),

  // FACULTY & DEPARTMENT DATA
  getFaculties: () =>
    axios.get(`${API_URL}/lecturer/api/faculties`, { headers: getAuthHeaders() }),

  getDepartments: (facultyId) =>
    axios.get(`${API_URL}/lecturer/api/departments/${facultyId}`, { headers: getAuthHeaders() }),

  getAllLecturers: () =>
    axios.get(`${API_URL}/lecturer/api/lecturers`, { headers: getAuthHeaders() }),
};
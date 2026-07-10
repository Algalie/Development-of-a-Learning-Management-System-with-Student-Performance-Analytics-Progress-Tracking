import api from './axios';

export const lecturerApi = {
  // Dashboard
  getDashboardStats: () => api.get('/lecturer/dashboard'),

  // Courses
  getCourses: () => api.get('/lecturer/courses'),
  getCourseHistory: () => api.get('/lecturer/course-history'),
  createCourse: (data) => api.post('/lecturer/create-course', data),
  viewCourse: (id) => api.get(`/lecturer/course/${id}`),
  archiveCourse: (id) => api.post(`/lecturer/archive-course/${id}`),

  // Students
  addCourseStudents: (courseId, data) => api.post(`/lecturer/course/${courseId}/add-students`, data),
  getStudentInfo: (studentId) => api.get(`/lecturer/api/get-student/${studentId}`),
  autoEnrollStudents: (courseId) => api.post(`/lecturer/course/${courseId}/auto-enroll-students`),

  // Assessments
  addAssessment: (courseId, data) => api.post(`/lecturer/course/${courseId}/add-assessment`, data),

  // Grades
  enterCA: (courseId, data) => api.post(`/lecturer/course/${courseId}/enter-ca`, data),
  enterExamGrades: (courseId, data) => api.post(`/lecturer/course/${courseId}/enter-exam-grades`, data),

  // Submissions
  submitForApproval: (type, id) => api.post(`/lecturer/submit/${type}/${id}`),
  approveSubmission: (id) => api.post(`/lecturer/approve/${id}`),
  rejectSubmission: (id, reason) => api.post(`/lecturer/reject/${id}`, { reason }),

  // References
  getReferenceManagement: (courseId) => api.get(`/lecturer/course/${courseId}/reference-management`),
  createMissingReferences: (courseId) => api.post(`/lecturer/course/${courseId}/create-missing-references`),
  updateReferenceGrade: (refId, data) => api.post(`/lecturer/update-reference-grade/${refId}`, data),

  // Pending Approvals
  getPendingApprovals: (tab) => api.get(`/lecturer/pending-approvals?tab=${tab || 'courses'}`),

  // Notifications
  getNotifications: () => api.get('/lecturer/notifications'),
  getNotificationCount: () => api.get('/lecturer/notifications/count'),
  getAssessmentNotifications: () => api.get('/lecturer/assessment-notifications'),
};
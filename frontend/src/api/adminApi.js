import api from './axios';

export const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),

  // Users
  getAdmins: () => api.get('/admin/admins'),
  getLecturers: () => api.get('/admin/lecturers'),
  addAdmin: (data) => api.post('/admin/add-admin', data),
  addLecturer: (data) => api.post('/admin/add-lecturer', data),
  editLecturer: (id, data) => api.put(`/admin/edit-lecturer/${id}`, data),
  deleteLecturer: (id) => api.delete(`/admin/delete-lecturer/${id}`),

  // Faculty & Department
  getFaculties: () => api.get('/admin/faculties'),
  addFaculty: (data) => api.post('/admin/add-faculty', data),
  editFaculty: (id, data) => api.put(`/admin/edit-faculty/${id}`, data),
  deleteFaculty: (id) => api.delete(`/admin/delete-faculty/${id}`),
  addDepartment: (facultyId, data) => api.post(`/admin/add-department/${facultyId}`, data),
  editDepartment: (id, data) => api.put(`/admin/edit-department/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/delete-department/${id}`),
  getDepartments: (facultyId) => api.get(`/admin/api/departments/${facultyId}`),

  // Course Approvals
  getCourseApprovals: () => api.get('/admin/course-approvals'),
  viewCourse: (id) => api.get(`/admin/course/${id}/view`),

  // Grade Approvals
  getGradeApprovals: () => api.get('/admin/grade-approvals'),
  viewCASubmission: (id) => api.get(`/admin/ca-submission/${id}`),
  viewExamSubmission: (id) => api.get(`/admin/exam-submission/${id}`),
  viewReferenceGrade: (id) => api.get(`/admin/reference-grade/${id}`),

  // Exam Office
  getExamOfficeSubmissions: (tab = 'pending') => api.get(`/admin/exam-office-submissions?tab=${tab}`),
  viewSubmission: (id) => api.get(`/admin/submission/${id}/view`),
  approveSubmission: (id) => api.post(`/admin/exam-approve/${id}`),
  rejectSubmission: (id, reason) => api.post(`/admin/exam-reject/${id}`, { reason }),

  // Reference Management
  getReferences: (studentId) => api.get(`/admin/reference-management?student_id=${studentId || ''}`),
  getReferenceDashboard: (filters) => api.get('/admin/reference-dashboard', { params: filters }),
  deleteAllReferences: () => api.post('/admin/api/delete-all-references'),
  resetAllReferences: () => api.post('/admin/api/reset-all-references'),

  // GPA Calculator
  getStudentGrades: (data) => api.post('/admin/api/student-grades', data),
  calculateGPA: (data) => api.post('/admin/api/calculate-student-gpa', data),

  // Transcript
  getTranscript: (studentId) => api.get(`/admin/transcript?student_id=${studentId}`),
  getDepartmentStudents: (params) => api.get('/admin/department-students', { params }),
  saveTranscript: (data) => api.post('/admin/save-transcript', data),
  verifyTranscript: (transcriptId) => api.get(`/admin/verify-transcript/${transcriptId}`),

  // Failure History
  getFailureHistory: (studentId) => api.get(`/admin/api/failure-history/${studentId}`),
  deleteStudentData: (studentId) => api.delete(`/admin/api/delete-student/${studentId}`),
  deleteAllGPA: () => api.delete('/admin/api/delete-all-gpa'),

  // Approval History
  getApprovalHistory: (filters) => api.get('/admin/approval-history', { params }),

  // Notifications
  getNotifications: () => api.get('/admin/notifications'),
  getNotificationCount: () => api.get('/admin/notifications/count'),
};
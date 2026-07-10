import api from './axios';

export const analyticsApi = {
  getDashboardAnalytics: () => api.get('/admin/dashboard'),
  getCourseApprovals: () => api.get('/admin/course-approvals'),
  getGradeApprovals: () => api.get('/admin/grade-approvals'),
  getReferenceDashboard: () => api.get('/admin/reference-dashboard'),
  getExamOfficeSubmissions: () => api.get('/admin/exam-office-submissions'),
  getFaculties: () => api.get('/admin/faculties'),
  getLecturers: () => api.get('/admin/lecturers'),
  getLiveStats: () => api.get('/analytics/live-stats'),
};
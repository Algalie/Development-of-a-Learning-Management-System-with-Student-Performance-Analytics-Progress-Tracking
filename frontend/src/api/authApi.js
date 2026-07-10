import api from './axios';

export const authApi = {
  // Admin
  adminLogin: (data) => api.post('/auth/admin/login', data),
  adminVerify2FA: (data) => api.post('/auth/admin/verify-2fa', data),

  // Lecturer
  lecturerLogin: (data) => api.post('/auth/lecturer/login', data),
  lecturerVerify2FA: (data) => api.post('/auth/lecturer/verify-2fa', data),

  // Student
  studentLogin: (data) => api.post('/student/login', data),
  studentRegister: (data) => api.post('/student/register', data),

  // Common
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};
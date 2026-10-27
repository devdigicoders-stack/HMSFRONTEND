import axios from 'axios';
import config from '../config/appConfig';

const API = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach bearer token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors gracefully
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on a protected endpoint, clear session
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICES ==================== //
export const authService = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (patientData) => API.post('/auth/register', patientData),
  getMe: () => API.get('/auth/me'),
  getNotifications: () => API.get('/auth/notifications'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => API.post(`/auth/reset-password/${token}`, { newPassword }),
  updatePassword: (passwords) => API.put('/auth/update-password', passwords)
};

// ==================== USER MANAGEMENT ==================== //
export const userService = {
  getUsers: (params) => API.get('/users', { params }),
  getUserById: (id) => API.get(`/users/${id}`),
  createUser: (userData) => API.post('/users', userData),
  updateUser: (id, userData) => API.put(`/users/${id}`, userData),
  deleteUser: (id) => API.delete(`/users/${id}`),
  toggleStatus: (id) => API.patch(`/users/${id}/toggle-status`),
  adminResetPassword: (id, newPassword) => API.patch(`/users/${id}/reset-password`, { newPassword }),
  uploadAvatar: (formData) =>
    API.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  removeAvatar: () => API.delete('/users/avatar'),
  updateMyProfile: (profileData) => API.put('/users/profile', profileData)
};

// ==================== DOCTOR SERVICES ==================== //
export const doctorService = {
  getDoctors: (params) => API.get('/doctors', { params }),
  getDoctorById: (id) => API.get(`/doctors/${id}`),
  getAvailableSlots: (id, date) => API.get(`/doctors/${id}/available-slots`, { params: { date } }),
  updateProfile: (id, profileData) => API.put(`/doctors/${id}`, profileData),
  deleteDoctor: (id) => API.delete(`/doctors/${id}`),
  getDashboard: (params) => API.get('/doctors/dashboard', { params }),
  getPatients: (params) => API.get('/doctors/patients', { params }),
  getPatientDetails: (patientId) => API.get(`/doctors/patients/${patientId}`)
};

// ==================== DEPARTMENT SERVICES ==================== //
export const departmentService = {
  getDepartments: (params) => API.get('/departments', { params }),
  getDepartmentById: (id) => API.get(`/departments/${id}`),
  createDepartment: (departmentData) => API.post('/departments', departmentData),
  updateDepartment: (id, departmentData) => API.put(`/departments/${id}`, departmentData),
  deleteDepartment: (id) => API.delete(`/departments/${id}`)
};

// ==================== PATIENT SERVICES ==================== //
export const patientService = {
  getPatients: (params) => API.get('/patients', { params }),
  getPatientById: (id) => API.get(`/patients/${id}`),
  getDashboard: (id) => API.get(`/patients/${id}/dashboard`),
  updateProfile: (id, profileData) => API.put(`/patients/${id}`, profileData),
  deletePatient: (id) => API.delete(`/patients/${id}`),
  getHistory: (id) => API.get(`/patients/${id}/history`)
};

// ==================== APPOINTMENT SERVICES ==================== //
export const appointmentService = {
  getAppointments: (params) => API.get('/appointments', { params }),
  getAppointmentById: (id) => API.get(`/appointments/${id}`),
  getAvailableSlots: (doctorId, date) => API.get('/appointments/available-slots', { params: { doctorId, date } }),
  bookAppointment: (data) => API.post('/appointments', data),
  updateStatus: (id, statusData) => API.patch(`/appointments/${id}/status`, statusData),
  reschedule: (id, data) => API.put(`/appointments/${id}/reschedule`, data),
  deleteAppointment: (id) => API.delete(`/appointments/${id}`)
};


// ==================== LAB SERVICES ==================== //
export const labService = {
  getDashboardStats: () => API.get('/lab/dashboard-stats'),
  getTests: (params) => API.get('/lab/tests', { params }),
  getTestById: (id) => API.get(`/lab/tests/${id}`),
  createTest: (testData) => API.post('/lab/tests', testData),
  updateTest: (id, testData) => API.put(`/lab/tests/${id}`, testData),
  toggleTestStatus: (id) => API.patch(`/lab/tests/${id}/toggle-status`),
  deleteTest: (id) => API.delete(`/lab/tests/${id}`),
  getRequests: (params) => API.get('/lab/requests', { params }),
  getRequestById: (id) => API.get(`/lab/requests/${id}`),
  createRequest: (requestData) => API.post('/lab/requests', requestData),
  updateRequestStatus: (id, statusData) => API.patch(`/lab/requests/${id}/status`, statusData),
  deleteRequest: (id) => API.delete(`/lab/requests/${id}`),
  recordResult: (formData) => {
    return API.post('/lab/results', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  reviewAndReleaseResult: (requestId, data) => API.patch(`/lab/results/${requestId}/review`, data),
  getResult: (requestId) => API.get(`/lab/results/${requestId}`),
  downloadReportFile: (requestId) =>
    API.get(`/lab/reports/${requestId}/download`, {
      responseType: 'blob'
    })
};

// ==================== PRESCRIPTION SERVICES ==================== //
export const prescriptionService = {
  getPrescriptions: (params) => API.get('/prescriptions', { params }),
  getPrescriptionById: (id) => API.get(`/prescriptions/${id}`),
  createPrescription: (data) => API.post('/prescriptions', data)
};

// ==================== MEDICAL RECORD SERVICES ==================== //
export const medicalRecordService = {
  getRecords: (params) => API.get('/medical-records', { params }),
  getRecordById: (id) => API.get(`/medical-records/${id}`),
  createRecord: (data) => API.post('/medical-records', data)
};

// ==================== REPORTS & DASHBOARD ==================== //
export const reportService = {
  getAdminDashboard: () => API.get('/reports/admin-dashboard'),
  getSummary: (params) => API.get('/reports/summary', { params }),
  getAuditLogs: (params) => API.get('/reports/audit-logs', { params })
};

// ==================== HOSPITAL SETTINGS ==================== //
export const settingService = {
  getSettings: () => API.get('/settings'),
  updateSettings: (settingsData) => API.put('/settings', settingsData)
};

export default API;

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3003';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    config.headers = config.headers || {};
    config.headers['x-user-role'] = user.role;
    config.headers['x-user-name'] = user.name;
  }
  return config;
});

export const jobAPI = {
  getAll: (status) => api.get('/jobs', { params: { status } }),
  create: (data) => api.post('/jobs', data),
  getById: (id) => api.get(`/jobs/${id}`),
  updateStatus: (id, status) => api.patch(`/jobs/${id}/status`, { status }),
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/jobs/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getFiles: (id) => api.get(`/jobs/${id}/files`),
  addComment: (id, message) => api.post(`/jobs/${id}/comments`, { message }),
  getComments: (id) => api.get(`/jobs/${id}/comments`),
  getActivity: (id) => api.get(`/jobs/${id}/activity`),
  saveAnnotations: (fileId, annotations, comment) => api.post(`/files/${fileId}/annotations`, { annotations, comment }),
  getFileAnnotations: (fileId) => api.get(`/files/${fileId}/annotations`),
  updateAnnotationStatus: (annotationId, status) => api.patch(`/annotations/${annotationId}/status`, { status }),
  updateMarkerStatus: (annotationId, markerId, resolved) => api.patch(`/annotations/${annotationId}/markers/${markerId}/status`, { resolved }),
  getJobAnnotations: (jobId) => api.get(`/jobs/${jobId}/annotations`),
};

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
};

export const leadAPI = {
  getAll: () => api.get('/leads'),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
};

export const drfAPI = {
  getAll: (status) => api.get('/drfs', { params: { status } }),
  getById: (id) => api.get(`/drfs/${id}`),
  create: (data) => api.post('/drfs', data),
  updateStatus: (id, status) => api.patch(`/drfs/${id}/status`, { status }),
};

export const mrfAPI = {
  getAll: (assignedTo) => api.get('/mrf', { params: { assignedTo } }),
  create: (data) => api.post('/mrf', data),
  updateStatus: (id, status) => api.patch(`/mrf/${id}/status`, { status }),
};

export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  return new URL(filePath, API_BASE_URL).toString();
};

export default api;

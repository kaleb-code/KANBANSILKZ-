import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;
const HTTP_UNAUTHORIZED = 401;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Handle 401 (token expired) - skip for auth endpoints
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    if (error.response?.status === HTTP_UNAUTHORIZED && !isAuthEndpoint) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (password) => api.post('/auth/login', { password }),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
};

export const pedidosApi = {
  getAll: (busca) => api.get('/pedidos', { params: busca ? { busca } : {} }),
  getOne: (id) => api.get(`/pedidos/${id}`),
  create: (data) => api.post('/pedidos', data),
  update: (id, data) => api.put(`/pedidos/${id}`, data),
  delete: (id) => api.delete(`/pedidos/${id}`),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/pedidos/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteImage: (id) => api.delete(`/pedidos/${id}/image`),
  getImageUrl: (id) => `${API_URL}/pedidos/${id}/image`,
  getPdfUrl: (id) => `${API_URL}/pedidos/${id}/pdf`,
  backup: () => api.post('/pedidos/backup'),
  restore: (data) => api.post('/pedidos/restore', data),
};

export default api;

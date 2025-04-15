import axios from 'axios';

// Create an instance of axios with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper functions for common API requests

// Commissions
export const getCommissions = () => api.get('/commissions');
export const getCommissionById = (id) => api.get(`/commissions/${id}`);
export const getKanbanData = () => api.get('/commissions/kanban');
export const addCommissionUpdate = (id, data) => {
  const formData = new FormData();
  
  if (data.title) formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.image) formData.append('image', data.image);
  
  return api.post(`/commissions/${id}/updates`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Requests
export const submitRequest = (data) => {
  const formData = new FormData();
  
  formData.append('serviceId', data.serviceId);
  formData.append('description', data.description);
  if (data.characterCount) formData.append('characterCount', data.characterCount);
  if (data.alternativeCount) formData.append('alternativeCount', data.alternativeCount);
  if (data.poseCount) formData.append('poseCount', data.poseCount);
  formData.append('isNSFW', data.isNSFW);
  if (data.totalPrice) formData.append('totalPrice', data.totalPrice);
  
  // For new users
  if (data.username) formData.append('username', data.username);
  if (data.password) formData.append('password', data.password);
  if (data.email) formData.append('email', data.email);
  
  // Add reference images
  if (data.references && data.references.length > 0) {
    data.references.forEach((file) => {
      formData.append('references', file);
    });
  }
  
  return api.post('/requests', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const getUserRequests = () => api.get('/requests/my-requests');
export const getRequestById = (id) => api.get(`/requests/${id}`);

// Services
export const getServices = () => api.get('/services');
export const getServiceById = (id) => api.get(`/services/${id}`);
export const calculatePrice = (data) => api.post('/services/calculate-price', data);
export const getTermsOfService = () => api.get('/services/terms-of-service');

// User profile
export const getUserProfile = () => api.get('/users/profile');
export const updateUserProfile = (data) => api.put('/users/profile', data);
export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  
  return api.post('/users/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const uploadBanner = (file) => {
  const formData = new FormData();
  formData.append('banner', file);
  
  return api.post('/users/banner', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}; 
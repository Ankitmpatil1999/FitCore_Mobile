// Centralized API Configuration & Endpoints for FitCore Web
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000';
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;

export const API_ENDPOINTS = {
  // Admin Endpoints
  ADMIN_METRICS: `${API_URL}/admin/metrics`,
  ADMIN_CONFIG: `${API_URL}/admin/config`,
  ADMIN_HUB_TELEMETRY: `${API_URL}/admin/hub-telemetry`,
  ADMIN_GYMS: `${API_URL}/admin/gyms`,
  ADMIN_VENDORS: `${API_URL}/admin/vendors`,
  ADMIN_MEMBERS: `${API_URL}/admin/members`,
  ADMIN_TRANSACTIONS: `${API_URL}/admin/transactions`,
  ADMIN_PROFILE: `${API_URL}/admin/profile`,
  ADMIN_CHANGE_PASSWORD: `${API_URL}/admin/change-password`,
  
  // Auth & Notifications
  AUTH_LOGIN: `${API_URL}/auth/login`,
  AUTH_WEB_LOGIN: `${API_URL}/auth/web-login`,
  NOTIFICATIONS: `${API_URL}/notifications`,
  NOTIFICATIONS_CLEAR: `${API_URL}/notifications/clear`,
};

export default {
  API_BASE_URL,
  API_URL,
  API_ENDPOINTS
};

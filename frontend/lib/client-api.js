import { getApiBase, getBackendOrigin, resolveBackendFileUrl } from '@/lib/backend-url';

export { getApiBase, getBackendOrigin, resolveBackendFileUrl };

async function request(path, options = {}) {
  const response = await fetch(`${getApiBase()}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function loginUser(payload) {
  return request('/auth/login/', { method: 'POST', body: JSON.stringify(payload) });
}

export function signupUser(payload) {
  return request('/auth/signup/', { method: 'POST', body: JSON.stringify(payload) });
}

export function verifyUser(payload) {
  return request('/auth/verify/', { method: 'POST', body: JSON.stringify(payload) });
}

export function resendCode() {
  return request('/auth/resend-code/', { method: 'POST', body: JSON.stringify({}) });
}

export function getCurrentUser() {
  return request('/auth/me/', { method: 'GET' });
}

export function updateCurrentUserProfile(payload) {
  return request('/auth/profile/', { method: 'POST', body: JSON.stringify(payload) });
}

export function logoutUser() {
  return request('/auth/logout/', { method: 'POST', body: JSON.stringify({}) });
}

export function getTenantDashboard(lang = '') {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  return request(`/tenant/dashboard/${query}`, { method: 'GET' });
}

export function getNotifications() {
  return request('/notifications/', { method: 'GET' });
}

export function markNotificationRead(id) {
  return request(`/notifications/${id}/read/`, { method: 'POST', body: JSON.stringify({}) });
}

export function getStaffDashboard(lang = '') {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  return request(`/staff/dashboard/${query}`, { method: 'GET' });
}

export function createStaffNotification(payload) {
  return request('/staff/notifications/', { method: 'POST', body: JSON.stringify(payload) });
}

export function getDocuments() {
  return request('/documents/', { method: 'GET' });
}

export function createDocument(payload) {
  return request('/documents/create/', { method: 'POST', body: JSON.stringify(payload) });
}

export function getStaffClients() {
  return request('/staff/clients/', { method: 'GET' });
}

export function createRentalRequest(payload) {
  return request('/rental-requests/create/', { method: 'POST', body: JSON.stringify(payload) });
}

export function getStaffRequests(status = '', lang = '') {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }
  if (lang) {
    params.set('lang', lang);
  }
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/staff/requests/${q}`, { method: 'GET' });
}

export function processStaffRequest(id, payload) {
  return request(`/staff/requests/${id}/process/`, { method: 'POST', body: JSON.stringify(payload) });
}

export function getStaffItems(lang = '') {
  const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  return request(`/staff/items/${query}`, { method: 'GET' });
}

export function createStaffCategory(payload) {
  return request('/staff/categories/', { method: 'POST', body: JSON.stringify(payload) });
}

export function createStaffItem(payload) {
  return request('/staff/items/', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateStaffItem(id, payload) {
  return request(`/staff/items/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function uploadStaffItemImage(id, { imageFile, isMain = false, captionAr = '', captionFr = '' }) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('is_main', isMain ? 'true' : 'false');
  formData.append('caption_ar', captionAr);
  formData.append('caption_fr', captionFr);

  const response = await fetch(`${getApiBase()}/staff/items/${id}/images/`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || 'Image upload failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// API utility client for communicating with FastAPI backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function setAuthToken(token: string, userType: string, name: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user_type', userType);
    localStorage.setItem('name', name);
    window.dispatchEvent(new Event('auth-change'));
  }
}

export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('name');
    window.dispatchEvent(new Event('auth-change'));
  }
}

export function getUserType(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('user_type');
  }
  return null;
}

export function getUserName(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('name');
  }
  return null;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Set JSON content-type if not sending FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.method && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  // Handle file streams (like Excel download or images)
  const contentType = response.headers.get('Content-Type');
  if (contentType && (
    contentType.includes('application/vnd.openxmlformats-officedocument') ||
    contentType.includes('image/') ||
    contentType.includes('application/octet-stream')
  )) {
    return response.blob();
  }

  return response.json();
}

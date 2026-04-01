import { apiService, API_URL } from './api';

// Helper function to make authenticated API calls
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = apiService.getToken();
  
  // Check if body is FormData
  const isFormData = options.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  
  // Only add Content-Type for JSON, not for FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let error;
    try {
      error = JSON.parse(text);
    } catch {
      error = { error: text || 'Request failed' };
    }
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Products
export const productsApi = {
  getAll: (lang?: string) => fetchWithAuth(`/products${lang ? `?lang=${lang}` : ''}`),
  getOne: (id: number, lang?: string, raw?: boolean) => {
    const params = new URLSearchParams();
    if (lang) params.append('lang', lang);
    if (raw) params.append('raw', 'true');
    const qs = params.toString();
    return fetchWithAuth(`/products/${id}${qs ? `?${qs}` : ''}`);
  },
  create: (data: any) => {
    // If data is FormData, send as-is. Otherwise, stringify it
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return fetchWithAuth('/products', {
      method: 'POST',
      body,
    });
  },
  update: (id: number, data: any) => {
    // If data is FormData, send as-is. Otherwise, stringify it
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body,
    });
  },
  delete: (id: number) => fetchWithAuth(`/products/${id}`, {
    method: 'DELETE',
  }),
  getTranslations: (id: number) => fetchWithAuth(`/products/${id}/translations`),
  updateTranslations: (id: number, data: any) => fetchWithAuth(`/products/${id}/translations`, {
    method: 'PUT',
    body: JSON.stringify({ translations: data }),
  }),
};

// Categories
export const categoriesApi = {
  getAll: (lang?: string) => fetchWithAuth(`/categories${lang ? `?lang=${lang}&` : '?'}t=${Date.now()}`),
  getOne: (id: number, lang?: string) => fetchWithAuth(`/categories/${id}${lang ? `?lang=${lang}` : ''}`),
  create: (data: any) => fetchWithAuth('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchWithAuth(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchWithAuth(`/categories/${id}`, {
    method: 'DELETE',
  }),
};

// Orders
export const ordersApi = {
  getAll: () => fetchWithAuth('/orders'),
  getOne: (id: number) => fetchWithAuth(`/orders/${id}`),
  create: (data: any) => fetchWithAuth('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id: number, status: string) => fetchWithAuth(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  delete: (id: number) => fetchWithAuth(`/orders/${id}`, {
    method: 'DELETE',
  }),
};

// Users
export const usersApi = {
  getAll: () => fetchWithAuth('/users'),
  getOne: (id: number) => fetchWithAuth(`/users/${id}`),
  create: (data: any) => fetchWithAuth('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchWithAuth(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchWithAuth(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Stats
export const statsApi = {
  getDashboard: () => fetchWithAuth('/stats/dashboard'),
};

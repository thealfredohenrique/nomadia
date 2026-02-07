const API_BASE = process.env.API_URL || 'http://localhost:3001/v1';

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  auth: {
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: string;
    }) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (email: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    me: () => request('/auth/me'),
  },

  properties: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/properties${query}`);
    },

    get: (id: string) => request(`/properties/${id}`),
  },

  bookings: {
    create: (data: {
      propertyId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    }) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),

    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/bookings${query}`);
    },

    get: (id: string) => request(`/bookings/${id}`),

    cancel: (id: string) =>
      request(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  },

  users: {
    getPublic: (id: string) => request(`/users/${id}`),
  },
};

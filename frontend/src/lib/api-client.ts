import { API_BASE_URL } from './constants';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage = responseData?.detail || responseData?.message || `Request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected network error occurred',
      500
    );
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};

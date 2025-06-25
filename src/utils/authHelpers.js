// Authentication helper utilities
import { getToken } from './storage';

// Helper function to get authenticated headers for API calls
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Helper function to make authenticated API calls
export const authenticatedFetch = async (url, options = {}) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token');
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

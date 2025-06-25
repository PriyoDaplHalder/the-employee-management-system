// Storage utility functions for authentication

export const AUTH_STORAGE_KEYS = {
  TOKEN: 'token',
  USER_DATA: 'userData',
};

// Get token from storage (localStorage first, then sessionStorage)
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN) || 
         sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
};

// Get user data from storage
export const getUserData = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA) || 
                    sessionStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Store auth data based on remember me preference
export const storeAuthData = (token, userData, rememberMe = false) => {
  if (typeof window === 'undefined') return;

  console.log('Storing auth data:', { hasToken: !!token, userData, rememberMe });

  const tokenString = token;
  const userDataString = JSON.stringify(userData);

  if (rememberMe) {
    // Store in localStorage for 30 days
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, tokenString);
    localStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, userDataString);
    // Clear any existing session storage
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER_DATA);
    console.log('Stored in localStorage');
  } else {
    // Store in sessionStorage for session only
    sessionStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, tokenString);
    sessionStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, userDataString);
    // Clear any existing localStorage
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER_DATA);
    console.log('Stored in sessionStorage');
  }
};

// Clear all auth data from both storages
export const clearAuthData = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER_DATA);
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.USER_DATA);
};

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

// Check if user is remembered (token exists in localStorage)
export const isUserRemembered = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
};

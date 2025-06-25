"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  getToken, 
  getUserData, 
  storeAuthData, 
  clearAuthData, 
  isTokenExpired 
} from "../utils/storage";

const AuthContext = createContext({});

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (check localStorage/sessionStorage for token)
    // Only access storage after component has mounted
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const token = getToken();
    const userData = getUserData();

    if (token && userData) {
      // Validate token before setting user
      if (!isTokenExpired(token)) {
        setUser(userData);
      } else {
        // Token expired, clear storage
        clearAuthData();
      }
    }
    
    setLoading(false);
  }, []);

  // This function should be called after successful authentication
  // It saves the token and user data to appropriate storage and updates the user state
  const login = (token, userData, rememberMe = false) => {
    console.log('AuthContext login called with:', { 
      hasToken: !!token, 
      userData, 
      rememberMe 
    });
    storeAuthData(token, userData, rememberMe);
    setUser(userData);
    console.log('User state updated:', userData);
  };

  // This function clears the token and user data from both storages and updates the user state when logging out
  const logout = useCallback(() => {
    clearAuthData();
    setUser(null);
  }, []);

  // Function to validate and refresh authentication state
  const validateAuth = useCallback(() => {
    if (typeof window === "undefined") return;

    const token = getToken();
    
    if (token && isTokenExpired(token)) {
      // Token is expired, logout user
      logout();
    }
  }, [logout]);

  // Periodic token validation - check every 5 minutes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = setInterval(() => {
      validateAuth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [validateAuth]);

  const value = {
    user,
    login,
    logout,
    loading,
    validateAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; // Providing auth context to children
};

// Just a custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
export { AuthContext, AuthProvider };

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();


export function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in on mount
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const login = async (email, password, role) => {
    try {
      // Get stored user data
      const storedUserData = localStorage.getItem('user');
      if (!storedUserData) {
        throw new Error('User not found');
      }

      const userData = JSON.parse(storedUserData);

      // Verify credentials and role
      if (userData.email === email && userData.password === password) {
        if (userData.accountType !== role) {
          throw new Error(`Invalid role. Please login as ${userData.accountType}`);
        }

        // Create session user (excluding sensitive data)
        const sessionUser = {
          name: userData.name,
          email: userData.email,
          accountType: userData.accountType,
          createdAt: userData.createdAt,
        };

        // Store current user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(sessionUser));
        setUser(sessionUser);
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Create session user (excluding sensitive data)
      const sessionUser = {
        name: userData.name,
        email: userData.email,
        accountType: userData.accountType,
        createdAt: userData.createdAt
      };

      // Log user in after signup
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      setUser(sessionUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      loggedIn, setLoggedIn,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


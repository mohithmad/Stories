import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('stories_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const userObj: User = {
            id: 'u-1',
            name: email.split('@')[0],
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=6366f1&color=fff`
          };
          setUser(userObj);
          localStorage.setItem('stories_user', JSON.stringify(userObj));
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  };

  const signup = async (name: string, email: string, password: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (name && email && password) {
          const userObj: User = {
            id: 'u-' + Math.floor(Math.random() * 1000),
            name: name,
            email: email,
            avatar: `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`
          };
          setUser(userObj);
          localStorage.setItem('stories_user', JSON.stringify(userObj));
          resolve();
        } else {
          reject(new Error('Please fill all fields'));
        }
      }, 1000);
    });
  };

  const loginWithGoogle = async () => {
    // Simulate Google OAuth Popup flow
    return new Promise<void>((resolve) => {
      // In a real app, this would use the Google Identity Services SDK
      setTimeout(() => {
        const userObj: User = {
          id: 'u-google',
          name: 'Google User',
          email: 'user@gmail.com',
          avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c' // Generic Google Avatar
        };
        setUser(userObj);
        localStorage.setItem('stories_user', JSON.stringify(userObj));
        resolve();
      }, 1500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stories_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
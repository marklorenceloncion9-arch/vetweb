import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: number;
  name: string;
  email: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      let storedToken: string | null = null;
      let storedUser: string | null = null;

      if (Platform.OS === 'web') {
        storedToken = localStorage.getItem('token');
        storedUser = localStorage.getItem('user');
      } else {
        storedToken = await SecureStore.getItemAsync('token');
        storedUser = await SecureStore.getItemAsync('user');
      }

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    try {
      console.log('Login function called with token:', newToken ? 'exists' : 'missing');
      if (Platform.OS === 'web') {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
      } else {
        await SecureStore.setItemAsync('token', newToken);
        await SecureStore.setItemAsync('user', JSON.stringify(newUser));
      }
      setToken(newToken);
      setUser(newUser);
      console.log('Auth state updated - isAuthenticated will be true');
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      }
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

interface AuthState {
  token: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuth: boolean;
}

const AuthCtx = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token, refreshToken } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('username', username);
    setToken(token);
    setUsername(username);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthCtx.Provider value={{ token, username, login, logout, isAuth: !!token }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

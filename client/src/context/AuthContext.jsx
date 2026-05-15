import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function userFromToken(token) {
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;
  // Treat expired tokens as logged out.
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return {
    id: payload.userId,
    username: payload.username,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => userFromToken(localStorage.getItem('token')));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setUser(userFromToken(token));
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = useCallback((newToken) => setToken(newToken), []);
  const logout = useCallback(() => setToken(null), []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

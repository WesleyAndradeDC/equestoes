import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const userData = await authService.me();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);

      // Identifica se é erro de autenticação real (token inválido/expirado)
      // ou apenas falha de rede (API em cold start no Render, timeout, etc.)
      const isAuthError =
        error.message?.includes('Sessão expirada') ||
        error.message?.includes('Token') ||
        error.message?.includes('401') ||
        error.message?.includes('Unauthorized') ||
        error.message?.includes('inválido');

      if (isAuthError) {
        // Token definitivamente inválido: limpa tokens sem forçar window.location
        // O apiClient já removeu os tokens; o ProtectedRoute redireciona via React Router
        authService.clearAuth();
      } else {
        // Erro de rede ou API indisponível: não desloga o usuário
        // O token pode ainda ser válido — aguarda próxima tentativa
        console.warn('⚠️ Não foi possível verificar autenticação (erro de rede). Sessão local mantida.');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    // Limpa tokens e reseta o estado do usuário.
    // O ProtectedRoute detecta user === null e faz o redirect para /login
    // via <Navigate replace />, sem nenhuma requisição ao servidor.
    authService.clearAuth();
    setUser(null);
  };

  const updateUser = async (data) => {
    const updatedUser = await authService.updateMe(data);
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;





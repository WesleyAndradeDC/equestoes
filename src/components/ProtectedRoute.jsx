import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2f456d] via-blue-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#2f456d] animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}





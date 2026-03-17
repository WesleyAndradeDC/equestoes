import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-[#2f456d] dark:bg-[#2f456d]/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-16 h-16 text-[#2f456d] dark:text-[#2f456d]" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">404</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            Página não encontrada
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        {/* Action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto bg-[#2f456d] hover:bg-[#2f456d] text-white hover:text-white px-8 py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all">
              <Home className="w-5 h-5" />
              Voltar para Início
            </Button>
          </Link>
          
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full sm:w-auto px-8 py-3 rounded-lg font-medium"
          >
            Voltar
          </Button>
        </div>

        {/* Help Text */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}



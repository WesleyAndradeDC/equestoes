
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, BookOpen, FolderOpen, BarChart3,
  LogOut, Menu, X, Moon, Sun, Brain, Layers, Shield,
} from 'lucide-react';
import TutorChatPopup from '../components/tutor/TutorChatPopup';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Fechar menu mobile ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => logout();

  const isAdmin = user?.role === 'admin';
  const isProfessor = user?.subscription_type === 'Professor' || isAdmin;
  const allowedTutorProfiles = ['Professor', 'Aluno Eleva'];
  const hasTutorAccess = user?.role === 'admin' || allowedTutorProfiles.includes(user?.subscription_type);

  const navigation = [
    { name: 'Início',       page: 'Home',       icon: Home },
    { name: 'E-Questões',  page: 'Questions',   icon: BookOpen },
    { name: 'Cadernos',    page: 'Notebooks',   icon: FolderOpen },
    { name: 'Estatísticas',page: 'Stats',       icon: BarChart3 },
    { name: 'Flashcards',  page: 'Flashcards',  icon: Layers },
  ];

  if (hasTutorAccess) {
    navigation.push({ name: 'E-Tutory', page: 'ETutory', icon: Brain });
  }

  if (isProfessor) {
    navigation.push({ name: 'Criar',   page: 'CreateQuestion', icon: BookOpen });
    navigation.push({ name: 'Revisar', page: 'ReviewQuestion', icon: BookOpen });
  }

  if (isAdmin) {
    navigation.push({ name: 'Admin', page: 'Admin', icon: Shield });
  }

  const userInitial = user?.full_name?.charAt(0)?.toUpperCase() || '?';
  const displayName = user?.full_name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">

            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 group shrink-0">
              <img
                src="https://i.ibb.co/cXDpz7zg/eleva-png.png"
                alt="E-Questões"
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation — visível apenas em lg+ */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-[#2f456d] text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side controls */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="w-8 h-8 sm:w-9 sm:h-9 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              {/* User info — desktop */}
              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="text-right hidden md:block">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight max-w-[120px] truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate max-w-[120px]">
                      {user.subscription_type || user.role}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#2f456d] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {userInitial}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="w-8 h-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Sair"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200 dark:border-slate-700 py-3">
              {/* User info mobile */}
              {user && (
                <div className="flex items-center gap-3 px-2 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-[#2f456d] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.subscription_type || user.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-8 h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Nav links */}
              <nav className="grid grid-cols-2 gap-1.5">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                        isActive
                          ? 'bg-[#2f456d] text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-t border-slate-200/60 dark:border-slate-700/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-center text-xs sm:text-sm text-slate-400 dark:text-slate-500">
            © 2026 E-QUESTÕES — Plataforma de Estudos para Concursos
          </p>
        </div>
      </footer>

      {/* E-Tutory Chat Popup */}
      <TutorChatPopup />
    </div>
  );
}

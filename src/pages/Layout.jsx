
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Home, BookOpen, FolderOpen, BarChart3, Trophy, LogOut, Menu, X, Moon, Sun, Bot } from 'lucide-react';
import TutorChatPopup from './components/tutor/TutorChatPopup';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const isAdmin = user?.role === 'admin';
  const isProfessor = user?.subscription_type === 'Professor' || isAdmin;

  // Verificar acesso ao Tutor
  const allowedTutorProfiles = ['Professor', 'Aluno Clube dos Cascas'];
  const hasTutorAccess = user?.role === 'admin' || allowedTutorProfiles.includes(user?.subscription_type);

  const navigation = [
    { name: 'Início', page: 'Home', icon: Home },
    { name: 'Resolver Questões', page: 'Questions', icon: BookOpen },
    { name: 'Meus Cadernos', page: 'Notebooks', icon: FolderOpen },
    { name: 'Estatísticas', page: 'Stats', icon: BarChart3 },
    { name: 'Ranking', page: 'Ranking', icon: Trophy },
  ];

  if (hasTutorAccess) {
    navigation.push({ name: 'Tutor', page: 'TutorGramatique', icon: Bot });
  }

  if (isProfessor) {
    navigation.push({ name: 'Criar Questões', page: 'CreateQuestion', icon: BookOpen });
    navigation.push({ name: 'Revisar Questões', page: 'ReviewQuestion', icon: BookOpen });
  }

  if (isAdmin) {
    navigation.push({ name: 'Administração', page: 'Admin', icon: Home });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center space-x-2 group shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 dark:from-white dark:to-white rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                  <span className="text-white dark:text-black font-bold text-lg">G</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent hidden sm:block">
                  G CONCURSOS
                </span>
              </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {user && (
                <>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.subscription_type || user.role}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 space-y-1 border-t border-slate-200 dark:border-slate-700">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-t border-slate-200/60 dark:border-slate-700/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            © 2025 G CONCURSOS - Plataforma de questões do gramatique
          </p>
        </div>
      </footer>

      {/* Tutor Chat Popup */}
      <TutorChatPopup />
      </div>
      );
}

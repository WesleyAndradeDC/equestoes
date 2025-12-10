import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Target,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  BarChart3,
  Sparkles,
  Brain,
  Flame,
  Calendar,
  X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Home() {
  const [user, setUser] = useState(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Show streak popup when user loads and has a streak
  useEffect(() => {
    if (user && user.study_streak > 0) {
      const hasSeenToday = localStorage.getItem('streakShownToday');
      const today = new Date().toDateString();
      if (hasSeenToday !== today) {
        setShowStreakPopup(true);
      }
    }
  }, [user]);

  const closeStreakPopup = () => {
    setShowStreakPopup(false);
    localStorage.setItem('streakShownToday', new Date().toDateString());
  };

  // Update study streak
  useEffect(() => {
    const updateStreak = async () => {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const lastStudy = user.last_study_date;

      if (lastStudy !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1;
        if (lastStudy === yesterdayStr) {
          newStreak = (user.study_streak || 0) + 1;
        }

        await base44.auth.updateMe({
          study_streak: newStreak,
          last_study_date: today
        });
        
        setUser({ ...user, study_streak: newStreak, last_study_date: today });
      }
    };

    updateStreak();
  }, [user?.email]);

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => base44.entities.Attempt.list('-created_date', 1000),
    initialData: [],
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list(),
    initialData: [],
  });

  // Helper function to safely convert to number
  const safeNumber = (value) => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  // Calculate statistics
  const totalAttempts = safeNumber(attempts.length);
  const correctAttempts = safeNumber(attempts.filter(a => a.is_correct).length);
  const accuracyRate = totalAttempts > 0 ? safeNumber(((correctAttempts / totalAttempts) * 100).toFixed(2)) : 0;

  // Performance by discipline
  const disciplinePerformance = {};
  attempts.forEach(attempt => {
    const question = questions.find(q => q.id === attempt.question_id);
    if (question && question.discipline) {
      const discipline = question.discipline;
      if (!disciplinePerformance[discipline]) {
        disciplinePerformance[discipline] = { correct: 0, total: 0 };
      }
      disciplinePerformance[discipline].total++;
      if (attempt.is_correct) {
        disciplinePerformance[discipline].correct++;
      }
    }
  });

  // Get best and worst disciplines
  const disciplinesData = Object.entries(disciplinePerformance).map(([discipline, data]) => {
    const total = safeNumber(data.total);
    const correct = safeNumber(data.correct);
    const accuracy = total > 0 ? safeNumber(((correct / total) * 100).toFixed(1)) : 0;
    return {
      discipline,
      accuracy: accuracy,
      total,
    };
  }).sort((a, b) => safeNumber(b.accuracy) - safeNumber(a.accuracy));

  const bestDiscipline = disciplinesData[0];
  const worstDiscipline = disciplinesData[disciplinesData.length - 1];

  // Data for pie chart
  const pieData = [
    { name: 'Corretas', value: safeNumber(correctAttempts), color: '#10b981' },
    { name: 'Incorretas', value: safeNumber(totalAttempts - correctAttempts), color: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      {/* Study Streak Popup */}
      {showStreakPopup && user && user.study_streak > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-0 shadow-2xl max-w-xs mb-20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Flame className="w-8 h-8 text-white shrink-0" />
                <div className="flex-1">
                  <p className="text-xl font-bold text-white">{user.study_streak} dias</p>
                  <p className="text-sm text-orange-100">Sequência de estudos ativa! 🔥</p>
                </div>
                <button
                  onClick={closeStreakPopup}
                  className="text-white hover:text-orange-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Welcome Section */}
      <div className="text-center space-y-3 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/10 to-gray-900/10 dark:from-purple-600/20 dark:to-gray-900/20 rounded-full">
                  <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bem-vindo de volta!</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-gray-900 dark:from-white dark:via-white dark:to-gray-300 bg-clip-text text-transparent">
          {user?.full_name ? `Olá, ${user.full_name.split(' ')[0]}!` : 'Olá!'}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Continue seu progresso nos estudos para concursos públicos
        </p>
        
        {/* Study Streak - Moved to a dismissible toast/notification component below */}
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-purple-600/10 to-gray-900/10 rounded-full" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Questões Resolvidas</p>
                <CardTitle className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
                  {totalAttempts}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{questions.length} questões disponíveis</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 dark:from-white dark:to-white shadow-md">
                <Target className="w-6 h-6 text-white dark:text-black" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-purple-600/10 to-gray-900/10 rounded-full" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de Acerto</p>
                <CardTitle className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
                  {accuracyRate}%
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{correctAttempts} de {totalAttempts} corretas</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 dark:from-white dark:to-white shadow-md">
                <TrendingUp className="w-6 h-6 text-white dark:text-black" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-gradient-to-br from-purple-600/10 to-gray-900/10 rounded-full" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pontos Fortes</p>
                <CardTitle className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
                  {bestDiscipline?.discipline || '—'}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{bestDiscipline ? `${safeNumber(bestDiscipline.accuracy)}% de acerto` : 'Resolva mais questões'}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 dark:from-white dark:to-white shadow-md">
                <Award className="w-6 h-6 text-white dark:text-black" />
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-white" />
              Desempenho Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalAttempts > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      const safePercent = safeNumber((percent * 100).toFixed(2));
                      return `${name}: ${safePercent}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Brain className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Resolva suas primeiras questões para ver estatísticas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <Brain className="w-5 h-5 text-purple-600 dark:text-white" />
              Desempenho por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disciplinesData.length > 0 ? (
              <div className="space-y-4">
                {disciplinesData.slice(0, 5).map((item) => (
                  <div key={item.discipline} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.discipline}</span>
                      <span className="text-sm font-bold text-purple-700 dark:text-white">{safeNumber(item.accuracy)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, safeNumber(item.accuracy)))}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.total} questões resolvidas</p>
                  </div>
                ))}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Comece a resolver questões para acompanhar seu progresso</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-purple-600 to-gray-900 text-white shadow-xl border-0">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl font-bold">Pronto para começar?</h3>
              <p className="text-purple-100">
                {worstDiscipline
                  ? `Pratique mais ${worstDiscipline.discipline} e melhore sua performance!`
                  : 'Resolva questões e acompanhe seu progresso em tempo real'}
              </p>
            </div>
            <Link to={createPageUrl('Questions')}>
              <Button
                size="lg"
                className="bg-white hover:bg-gray-100 text-purple-700 font-bold shadow-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Resolver Questões
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
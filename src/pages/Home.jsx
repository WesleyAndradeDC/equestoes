import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
  Target, TrendingUp, Award, BookOpen, BarChart3, Sparkles, Brain,
  Layers, ArrowRight, CheckCircle2, XCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StreakBanner } from '@/components/StreakBanner';
import { SkeletonCard } from '@/components/SkeletonCard';

const PRIMARY = '#2f456d';
const SECONDARY = '#f26836';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allAttempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => base44.entities.Attempt.list('-created_date', 1000),
    staleTime: 5 * 60 * 1000,
  });

  const attempts = useMemo(() => {
    if (!user?.id) return [];
    return allAttempts.filter(a => a.user_id === user.id);
  }, [allAttempts, user?.id]);

  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const updateStreak = async () => {
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      if (user.last_study_date !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const newStreak = user.last_study_date === yesterdayStr ? (user.study_streak || 0) + 1 : 1;
        await base44.auth.updateMe({ study_streak: newStreak, last_study_date: today });
        setUser({ ...user, study_streak: newStreak, last_study_date: today });
      }
    };
    updateStreak();
  }, [user?.email]);

  const safeNumber = (v) => { const n = Number(v); return isNaN(n) || !isFinite(n) ? 0 : n; };

  const stats = useMemo(() => {
    const total = safeNumber(attempts.length);
    const correct = safeNumber(attempts.filter(a => a.is_correct).length);
    const accuracy = total > 0 ? safeNumber(((correct / total) * 100).toFixed(1)) : 0;

    const byDiscipline = {};
    attempts.forEach(a => {
      const q = allQuestions.find(q => q.id === a.question_id);
      if (q?.discipline) {
        if (!byDiscipline[q.discipline]) byDiscipline[q.discipline] = { correct: 0, total: 0 };
        byDiscipline[q.discipline].total++;
        if (a.is_correct) byDiscipline[q.discipline].correct++;
      }
    });

    const disciplines = Object.entries(byDiscipline).map(([d, v]) => ({
      discipline: d,
      accuracy: v.total > 0 ? safeNumber(((v.correct / v.total) * 100).toFixed(1)) : 0,
      total: v.total,
    })).sort((a, b) => b.accuracy - a.accuracy);

    const pieData = [
      { name: 'Corretas', value: safeNumber(correct), color: PRIMARY },
      { name: 'Incorretas', value: safeNumber(total - correct), color: '#ef4444' },
    ];

    const recentAttempts = allAttempts
      .filter(a => a.user_id === user?.id)
      .slice(0, 5);

    return { total, correct, accuracy, disciplines, pieData, best: disciplines[0], worst: disciplines[disciplines.length - 1], recentAttempts };
  }, [attempts, allQuestions, user?.id]);

  const isLoading = attemptsLoading || questionsLoading;

  const quickActions = [
    { label: 'E-Questões', desc: 'Resolver questões', icon: BookOpen, page: 'Questions', color: 'bg-[#2f456d]' },
    { label: 'Flashcards', desc: 'Revisão espaçada', icon: Layers, page: 'Flashcards', color: 'bg-[#f26836]' },
    { label: 'Estatísticas', desc: 'Ver progresso', icon: BarChart3, page: 'Stats', color: 'bg-emerald-600' },
    { label: 'Ranking', desc: 'Sua posição', icon: Trophy, page: 'Ranking', color: 'bg-amber-500' },
    { label: 'Cadernos', desc: 'Meus cadernos', icon: BookOpen, page: 'Notebooks', color: 'bg-sky-600' },
    { label: 'E-Tutory', desc: 'Tirar dúvidas IA', icon: Bot, page: 'ETutory', color: 'bg-violet-600' },
  ];

  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2f456d] via-[#243756] to-[#1a2d4a] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-32 h-32 rounded-full border-2 border-white/40" />
          <div className="absolute -bottom-4 -right-4 w-48 h-48 rounded-full border border-white/20" />
          <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-[#f26836]/30" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f26836]" />
              <span className="text-sm text-blue-200">Bem-vindo de volta</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {firstName ? `Olá, ${firstName}!` : 'Olá!'} 👋
            </h1>
            <p className="text-blue-200 text-sm sm:text-base max-w-md">
              {stats.total > 0
                ? `Você já resolveu ${stats.total} questões. Continue assim!`
                : 'Pronto para começar seus estudos hoje?'}
            </p>
            {user?.subscription_type && (
              <Badge className="bg-[#f26836]/20 text-[#f26836] border border-[#f26836]/40 text-xs">
                {user.subscription_type}
              </Badge>
            )}
          </div>

          <Link to={createPageUrl('Questions')} className="shrink-0">
            <Button
              size="lg"
              className="bg-[#f26836] hover:bg-[#d9561f] text-white font-bold shadow-lg gap-2 whitespace-nowrap"
            >
              <BookOpen className="w-5 h-5" />
              Resolver Questões
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Questões Resolvidas',
              value: stats.total,
              sub: `de ${allQuestions.length} disponíveis`,
              icon: Target,
              accent: PRIMARY,
            },
            {
              label: 'Taxa de Acerto',
              value: `${stats.accuracy}%`,
              sub: `${stats.correct} corretas`,
              icon: TrendingUp,
              accent: stats.accuracy >= 70 ? '#16a34a' : stats.accuracy >= 50 ? SECONDARY : '#ef4444',
            },
            {
              label: 'Ponto Forte',
              value: stats.best?.discipline?.split(' ').slice(0, 2).join(' ') || '—',
              sub: stats.best ? `${stats.best.accuracy}% de acerto` : 'Resolva questões',
              icon: Award,
              accent: SECONDARY,
            },
          ].map(({ label, value, sub, icon: Icon, accent }) => (
            <Card key={label} className="relative overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group">
              <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ background: accent }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>
                  </div>
                  <div className="p-2.5 rounded-xl" style={{ background: accent + '15' }}>
                    <Icon className="w-5 h-5" style={{ color: accent }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Streak Card */}
          <StreakBanner streak={user?.study_streak} />
        </div>
      )}

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#f26836]" />
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(({ label, desc, icon: Icon, page, color }) => (
            <Link key={page} to={createPageUrl(page)}>
              <div className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2f456d]/40 dark:hover:border-[#2f456d]/40 hover:shadow-md transition-all text-center cursor-pointer">
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">{label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 hidden sm:block">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts + Disciplines */}
      {!isLoading && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 dark:text-slate-100">
                <BarChart3 className="w-4 h-4 text-[#2f456d]" />
                Desempenho Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#2f456d]" />
                  <span className="text-slate-600 dark:text-slate-300">{stats.correct} corretas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-slate-600 dark:text-slate-300">{stats.total - stats.correct} incorretas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disciplines */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 dark:text-slate-100">
                <Brain className="w-4 h-4 text-[#2f456d]" />
                Top Disciplinas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.disciplines.slice(0, 5).map((item) => (
                <div key={item.discipline}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[65%]">
                      {item.discipline}
                    </span>
                    <span className="text-xs font-bold text-[#2f456d] dark:text-white">{item.accuracy}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, item.accuracy))}%`,
                        background: `linear-gradient(to right, ${PRIMARY}, ${SECONDARY})`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {stats.disciplines.length === 0 && (
                <div className="text-center py-6">
                  <Brain className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Resolva questões para ver seu progresso</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA se não tiver tentativas */}
      {!isLoading && stats.total === 0 && (
        <Card className="border-0 shadow-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a2d4a 100%)` }}>
          <CardContent className="p-8 text-center space-y-4">
            <Brain className="w-16 h-16 text-[#f26836] mx-auto" />
            <div>
              <h3 className="text-2xl font-bold text-white">Comece agora!</h3>
              <p className="text-blue-200 mt-1">Resolva sua primeira questão e acompanhe seu progresso em tempo real.</p>
            </div>
            <Link to={createPageUrl('Questions')}>
              <Button className="bg-[#f26836] hover:bg-[#d9561f] text-white font-bold px-8 gap-2">
                <BookOpen className="w-5 h-5" />
                Resolver Primeira Questão
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

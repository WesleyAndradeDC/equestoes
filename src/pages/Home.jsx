import React, { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
  Target, TrendingUp, Award, BookOpen, BarChart3, Sparkles, Brain,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import StreakBanner from '@/components/StreakBanner';
import { SkeletonCard, SkeletonChart } from '@/components/SkeletonCard';

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
    cacheTime: 10 * 60 * 1000,
  });

  const attempts = useMemo(() => {
    if (!user?.id) return [];
    return allAttempts.filter(attempt => attempt.user_id === user.id);
  }, [allAttempts, user?.id]);

  const { data: allQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list(),
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  const questions = useMemo(() => {
    if (!user?.subscription_type) return allQuestions;
    if (user.subscription_type === 'Aluno Clube do Pedrão') {
      return allQuestions.filter(q => q.discipline === 'Português');
    }
    return allQuestions;
  }, [allQuestions, user?.subscription_type]);

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
        await base44.auth.updateMe({ study_streak: newStreak, last_study_date: today });
        setUser({ ...user, study_streak: newStreak, last_study_date: today });
      }
    };
    updateStreak();
  }, [user?.email]);

  const safeNumber = (value) => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  const statistics = useMemo(() => {
    const totalAttempts = safeNumber(attempts.length);
    const correctAttempts = safeNumber(attempts.filter(a => a.is_correct).length);
    const accuracyRate = totalAttempts > 0
      ? safeNumber(((correctAttempts / totalAttempts) * 100).toFixed(2))
      : 0;

    const disciplinePerformance = {};
    attempts.forEach(attempt => {
      const question = questions.find(q => q.id === attempt.question_id);
      if (question?.discipline) {
        const d = question.discipline;
        if (!disciplinePerformance[d]) disciplinePerformance[d] = { correct: 0, total: 0 };
        disciplinePerformance[d].total++;
        if (attempt.is_correct) disciplinePerformance[d].correct++;
      }
    });

    const disciplinesData = Object.entries(disciplinePerformance).map(([discipline, data]) => {
      const total = safeNumber(data.total);
      const correct = safeNumber(data.correct);
      const accuracy = total > 0 ? safeNumber(((correct / total) * 100).toFixed(1)) : 0;
      return { discipline, accuracy, total };
    }).sort((a, b) => safeNumber(b.accuracy) - safeNumber(a.accuracy));

    const pieData = [
      { name: 'Corretas', value: safeNumber(correctAttempts), color: PRIMARY },
      { name: 'Incorretas', value: safeNumber(totalAttempts - correctAttempts), color: '#ef4444' },
    ];

    return {
      totalAttempts, correctAttempts, accuracyRate, disciplinesData, pieData,
      bestDiscipline: disciplinesData[0],
      worstDiscipline: disciplinesData[disciplinesData.length - 1],
    };
  }, [attempts, questions]);

  const isLoading = attemptsLoading || questionsLoading;

  return (
    <div className="space-y-0">
      <StreakBanner streak={user?.study_streak} className="sticky top-0 z-40 mb-8" />

      <div className="space-y-8 px-4 sm:px-0">
        {/* Welcome Section */}
        <div className="text-center space-y-3 py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2f456d]/10 rounded-full">
            <Sparkles className="w-5 h-5 text-[#2f456d]" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bem-vindo de volta!</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2f456d] dark:text-white">
            {user?.full_name ? `Olá, ${user.full_name.split(' ')[0]}!` : 'Olá!'}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Continue seu progresso nos estudos para concursos públicos
          </p>
        </div>

        {/* Performance Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: 'Questões Resolvidas',
                value: statistics.totalAttempts,
                sub: `${questions.length} questões disponíveis`,
                icon: Target,
              },
              {
                label: 'Taxa de Acerto',
                value: `${statistics.accuracyRate}%`,
                sub: `${statistics.correctAttempts} de ${statistics.totalAttempts} corretas`,
                icon: TrendingUp,
              },
              {
                label: 'Ponto Forte',
                value: statistics.bestDiscipline?.discipline || '—',
                sub: statistics.bestDiscipline
                  ? `${safeNumber(statistics.bestDiscipline.accuracy)}% de acerto`
                  : 'Resolva mais questões',
                icon: Award,
              },
            ].map(({ label, value, sub, icon: Icon }) => (
              <Card key={label} className="relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-[#2f456d]/5 rounded-full" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                      <CardTitle className="text-3xl font-bold mt-2 text-[#2f456d] dark:text-white">
                        {value}
                      </CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{sub}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#2f456d] shadow-md">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Charts Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart /><SkeletonChart />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <BarChart3 className="w-5 h-5 text-[#2f456d]" />
                  Desempenho Geral
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics.totalAttempts > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statistics.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${safeNumber((percent * 100).toFixed(1))}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {statistics.pieData.map((entry, index) => (
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

            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                  <Brain className="w-5 h-5 text-[#2f456d]" />
                  Desempenho por Disciplina
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statistics.disciplinesData.length > 0 ? (
                  <div className="space-y-4">
                    {statistics.disciplinesData.slice(0, 5).map((item) => (
                      <div key={item.discipline} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.discipline}</span>
                          <span className="text-sm font-bold text-[#2f456d] dark:text-white">{safeNumber(item.accuracy)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, safeNumber(item.accuracy)))}%`,
                              background: `linear-gradient(to right, ${PRIMARY}, ${SECONDARY})`,
                            }}
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
        )}

        {/* Quick Action CTA */}
        <Card className="border-0 shadow-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a2d4a 100%)` }}>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">Pronto para começar?</h3>
                <p className="text-blue-100">
                  {statistics.worstDiscipline
                    ? `Pratique mais ${statistics.worstDiscipline.discipline} e melhore sua performance!`
                    : 'Resolva questões e acompanhe seu progresso em tempo real'}
                </p>
              </div>
              <Link to={createPageUrl('Questions')}>
                <Button
                  size="lg"
                  className="font-bold shadow-lg text-[#2f456d] border-0"
                  style={{ background: '#f26836', color: 'white' }}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Resolver Questões
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

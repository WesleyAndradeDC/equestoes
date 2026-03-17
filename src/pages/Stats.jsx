import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area } from
'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Target,
  AlertTriangle,
  BarChart3,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowLeftRight } from
'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? 0 : num;
};

const MONTHS = [
{ value: '0', label: 'Janeiro' },
{ value: '1', label: 'Fevereiro' },
{ value: '2', label: 'Março' },
{ value: '3', label: 'Abril' },
{ value: '4', label: 'Maio' },
{ value: '5', label: 'Junho' },
{ value: '6', label: 'Julho' },
{ value: '7', label: 'Agosto' },
{ value: '8', label: 'Setembro' },
{ value: '9', label: 'Outubro' },
{ value: '10', label: 'Novembro' },
{ value: '11', label: 'Dezembro' }];


export default function Stats() {
  const [dateRange, setDateRange] = useState('30');
  const [user, setUser] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [period1Month, setPeriod1Month] = useState(new Date().getMonth().toString());
  const [period2Month, setPeriod2Month] = useState((new Date().getMonth() - 1 + 12) % 12 + '');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allAttempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['attempts'],
    queryFn: async () => {
      console.log('📊 Stats: Buscando tentativas...');
      const result = await base44.entities.Attempt.list('-created_date', 10000);
      console.log('✅ Stats: Tentativas recebidas:', result?.length);
      return result || [];
    },
    staleTime: 0,
  });

  // FILTRAR APENAS TENTATIVAS DO USUÁRIO LOGADO
  const attempts = React.useMemo(() => {
    if (!user?.id) return [];
    const filtered = allAttempts.filter(attempt => attempt.user_id === user.id);
    console.log('🔒 Stats: Tentativas filtradas para o usuário:', filtered.length, 'de', allAttempts.length);
    return filtered;
  }, [allAttempts, user?.id]);

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      console.log('📊 Stats: Buscando questões...');
      const result = await base44.entities.Question.list();
      console.log('✅ Stats: Questões recebidas:', result?.length);
      return result || [];
    },
    staleTime: 0,
  });

  // Filter attempts by date range AND current user
  const filteredAttempts = React.useMemo(() => {
    console.log('📊 Filtrando tentativas para usuário:', user?.email);
    
    // Filtrar apenas tentativas do usuário atual
    const userAttempts = attempts.filter(attempt => 
      attempt.created_by === user?.email || attempt.user_id === user?.id
    );
    
    console.log('📊 Total de tentativas do usuário:', userAttempts.length);
    console.log('📊 Total de tentativas gerais:', attempts.length);
    
    // Aplicar filtro de data
    if (dateRange === 'all') return userAttempts;
    const daysAgo = parseInt(dateRange);
    const startDate = subDays(new Date(), daysAgo);
    return userAttempts.filter((attempt) => new Date(attempt.created_date) >= startDate);
  }, [attempts, dateRange, user]);

  // Period comparison data - apenas do usuário atual
  const periodComparison = React.useMemo(() => {
    const period1Start = startOfMonth(new Date(currentYear, parseInt(period1Month)));
    const period1End = endOfMonth(period1Start);
    const period2Start = startOfMonth(new Date(currentYear, parseInt(period2Month)));
    const period2End = endOfMonth(period2Start);

    // Filtrar apenas tentativas do usuário atual
    const userAttempts = attempts.filter(a => 
      a.created_by === user?.email || a.user_id === user?.id
    );

    const period1Attempts = userAttempts.filter((a) => {
      const date = new Date(a.created_date);
      return date >= period1Start && date <= period1End;
    });

    const period2Attempts = userAttempts.filter((a) => {
      const date = new Date(a.created_date);
      return date >= period2Start && date <= period2End;
    });

    const p1Total = period1Attempts.length;
    const p1Correct = period1Attempts.filter((a) => a.is_correct).length;
    const p1Accuracy = p1Total > 0 ? safeNumber((p1Correct / p1Total * 100).toFixed(1)) : 0;

    const p2Total = period2Attempts.length;
    const p2Correct = period2Attempts.filter((a) => a.is_correct).length;
    const p2Accuracy = p2Total > 0 ? safeNumber((p2Correct / p2Total * 100).toFixed(1)) : 0;

    return {
      period1: { total: p1Total, correct: p1Correct, accuracy: p1Accuracy, name: MONTHS[parseInt(period1Month)].label },
      period2: { total: p2Total, correct: p2Correct, accuracy: p2Accuracy, name: MONTHS[parseInt(period2Month)].label }
    };
  }, [attempts, period1Month, period2Month, currentYear, user]);

  // Weekly evolution data - apenas do usuário atual
  const weeklyEvolution = React.useMemo(() => {
    const weeks = eachWeekOfInterval({
      start: subDays(new Date(), 56),
      end: new Date()
    }, { weekStartsOn: 0 });

    // Filtrar apenas tentativas do usuário atual
    const userAttempts = attempts.filter(a => 
      a.created_by === user?.email || a.user_id === user?.id
    );

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const weekAttempts = userAttempts.filter((a) => {
        const date = new Date(a.created_date);
        return date >= weekStart && date <= weekEnd;
      });

      const total = weekAttempts.length;
      const correct = weekAttempts.filter((a) => a.is_correct).length;

      return {
        week: format(weekStart, 'dd/MM', { locale: ptBR }),
        total,
        correct,
        incorrect: total - correct,
        accuracy: total > 0 ? safeNumber((correct / total * 100).toFixed(1)) : 0
      };
    });
  }, [attempts, user]);

  // Daily performance data
  const dailyData = React.useMemo(() => {
    const dayMap = {};
    const days = dateRange === 'all' ? 90 : parseInt(dateRange);

    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'dd/MM');
      dayMap[date] = { date, correct: 0, incorrect: 0, total: 0 };
    }

    filteredAttempts.forEach((attempt) => {
      const date = format(new Date(attempt.created_date), 'dd/MM');
      if (dayMap[date]) {
        dayMap[date].total++;
        if (attempt.is_correct) {
          dayMap[date].correct++;
        } else {
          dayMap[date].incorrect++;
        }
      }
    });

    return Object.values(dayMap);
  }, [filteredAttempts, dateRange]);

  // Performance by discipline
  const disciplinePerformance = React.useMemo(() => {
    const disciplineMap = {};

    filteredAttempts.forEach((attempt) => {
      const question = questions.find((q) => q.id === attempt.question_id);
      if (!question || !question.discipline) return;

      const disc = question.discipline;
      if (!disciplineMap[disc]) {
        disciplineMap[disc] = { discipline: disc, correct: 0, total: 0 };
      }

      disciplineMap[disc].total++;
      if (attempt.is_correct) {
        disciplineMap[disc].correct++;
      }
    });

    return Object.values(disciplineMap).
    map((d) => ({
      ...d,
      accuracy: d.total > 0 ? safeNumber((d.correct / d.total * 100).toFixed(1)) : 0
    })).
    sort((a, b) => b.accuracy - a.accuracy);
  }, [filteredAttempts, questions]);

  // Performance by subject
  const subjectPerformance = React.useMemo(() => {
    const subjectMap = {};

    filteredAttempts.forEach((attempt) => {
      const question = questions.find((q) => q.id === attempt.question_id);
      if (!question || !question.subjects) return;

      question.subjects.forEach((subject) => {
        if (!subjectMap[subject]) {
          subjectMap[subject] = { subject, correct: 0, total: 0 };
        }

        subjectMap[subject].total++;
        if (attempt.is_correct) {
          subjectMap[subject].correct++;
        }
      });
    });

    return Object.values(subjectMap).
    map((s) => ({
      ...s,
      accuracy: s.total > 0 ? safeNumber((s.correct / s.total * 100).toFixed(1)) : 0
    })).
    sort((a, b) => b.accuracy - a.accuracy);
  }, [filteredAttempts, questions]);

  // Performance by difficulty
  const difficultyPerformance = React.useMemo(() => {
    const diffMap = { 'Fácil': { correct: 0, total: 0 }, 'Médio': { correct: 0, total: 0 }, 'Difícil': { correct: 0, total: 0 } };

    filteredAttempts.forEach((attempt) => {
      const question = questions.find((q) => q.id === attempt.question_id);
      if (!question || !question.difficulty) return;

      diffMap[question.difficulty].total++;
      if (attempt.is_correct) {
        diffMap[question.difficulty].correct++;
      }
    });

    return Object.entries(diffMap).map(([difficulty, data]) => ({
      difficulty,
      accuracy: data.total > 0 ? safeNumber((data.correct / data.total * 100).toFixed(1)) : 0,
      correct: safeNumber(data.correct),
      total: safeNumber(data.total)
    }));
  }, [filteredAttempts, questions]);

  // Performance by exam board
  const examBoardPerformance = React.useMemo(() => {
    const boardMap = {};

    filteredAttempts.forEach((attempt) => {
      const question = questions.find((q) => q.id === attempt.question_id);
      if (!question || !question.exam_board) return;

      const board = question.exam_board;
      if (!boardMap[board]) {
        boardMap[board] = { board, correct: 0, total: 0 };
      }

      boardMap[board].total++;
      if (attempt.is_correct) {
        boardMap[board].correct++;
      }
    });

    return Object.values(boardMap).
    map((b) => ({
      ...b,
      accuracy: b.total > 0 ? safeNumber((b.correct / b.total * 100).toFixed(1)) : 0
    })).
    sort((a, b) => b.accuracy - a.accuracy);
  }, [filteredAttempts, questions]);

  const totalAttempts = safeNumber(filteredAttempts.length);
  const correctAttempts = safeNumber(filteredAttempts.filter((a) => a.is_correct).length);
  const accuracyRate = totalAttempts > 0 ? safeNumber((correctAttempts / totalAttempts * 100).toFixed(1)) : 0;

  const bestDisciplines = disciplinePerformance.slice(0, 3);
  const worstDisciplines = disciplinePerformance.slice(-3).reverse();
  const bestSubjects = subjectPerformance.slice(0, 5);
  const worstSubjects = subjectPerformance.slice(-5).reverse();

  const radarData = disciplinePerformance.slice(0, 6).map((d) => ({
    discipline: d.discipline.length > 15 ? d.discipline.substring(0, 15) + '...' : d.discipline,
    accuracy: safeNumber(d.accuracy)
  }));

  const COLORS = ['#2f456d', '#f26836', '#4d9bd4', '#e8a87c', '#1a2d4a'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2f456d] to-[#1a2d4a] flex items-center justify-center shadow-lg">
            <BarChart3 className="w-7 h-7 text-[#f26836]" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2f456d] dark:text-white">
              Estatísticas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Desempenho detalhado</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Acompanhe seu progresso detalhado e identifique pontos de melhoria
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-[#2f456d]" />
              <Label className="text-sm font-medium dark:text-slate-200">Período:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48 dark:bg-slate-700 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={compareMode ? 'default' : 'outline'}
              onClick={() => setCompareMode(!compareMode)}
              className={compareMode ? 'bg-[#2f456d] hover:bg-[#1a2d4a] text-white hover:text-white' : ''}>

              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Comparar Períodos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Period Comparison */}
      {compareMode &&
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-[#2f456d]/20 dark:border-[#2f456d]/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1a2d4a] dark:text-blue-300">
              <ArrowLeftRight className="w-5 h-5" />
              Comparação de Períodos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-200">Período 1</Label>
                <Select value={period1Month} onValueChange={setPeriod1Month}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) =>
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-200">Período 2</Label>
                <Select value={period2Month} onValueChange={setPeriod2Month}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) =>
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-[#2f456d]/5 dark:bg-[#2f456d]/20 border border-[#2f456d]/20 dark:border-[#2f456d]/40">
                <h4 className="font-semibold text-[#2f456d] dark:text-blue-200 mb-3">{periodComparison.period1.name}</h4>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">Questões: <span className="font-bold">{periodComparison.period1.total}</span></p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Acertos: <span className="font-bold text-green-600">{periodComparison.period1.correct}</span></p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Taxa de Acerto: <span className="font-bold text-[#2f456d]">{periodComparison.period1.accuracy}%</span></p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3">{periodComparison.period2.name}</h4>
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">Questões: <span className="font-bold">{periodComparison.period2.total}</span></p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Acertos: <span className="font-bold text-green-600">{periodComparison.period2.correct}</span></p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Taxa de Acerto: <span className="font-bold text-indigo-600">{periodComparison.period2.accuracy}%</span></p>
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
            { name: 'Questões', [periodComparison.period1.name]: periodComparison.period1.total, [periodComparison.period2.name]: periodComparison.period2.total },
            { name: 'Acertos', [periodComparison.period1.name]: periodComparison.period1.correct, [periodComparison.period2.name]: periodComparison.period2.correct }]
            }>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={periodComparison.period1.name} fill="#2f456d" />
                <Bar dataKey={periodComparison.period2.name} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      }

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#2f456d] to-[#1a2d4a] text-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm">Total</p>
                <p className="text-2xl md:text-4xl font-bold mt-1">{totalAttempts}</p>
              </div>
              <Target className="w-6 h-6 md:w-8 md:h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-xs md:text-sm">Acertos</p>
                <p className="text-2xl md:text-4xl font-bold mt-1">{correctAttempts}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-100 text-xs md:text-sm">Erros</p>
                <p className="text-2xl md:text-4xl font-bold mt-1">{totalAttempts - correctAttempts}</p>
              </div>
              <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-600 to-amber-700 text-white">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-amber-100 text-xs md:text-sm">Taxa</p>
                <p className="text-2xl md:text-4xl font-bold mt-1">{accuracyRate}%</p>
              </div>
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Evolution */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <TrendingUp className="w-5 h-5 text-[#2f456d]" />
            Evolução Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="correct" stackId="1" stroke="#10b981" fill="#10b981" name="Acertos" />
              <Area type="monotone" dataKey="incorrect" stackId="1" stroke="#ef4444" fill="#ef4444" name="Erros" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Performance Chart */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <Calendar className="w-5 h-5 text-[#2f456d]" />
            Desempenho Diário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="correct" stroke="#10b981" name="Acertos" strokeWidth={2} />
              <Line type="monotone" dataKey="incorrect" stroke="#ef4444" name="Erros" strokeWidth={2} />
              <Line type="monotone" dataKey="total" stroke="#2f456d" name="Total" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Disciplines Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <Award className="w-5 h-5 text-green-600" />
              Melhores Disciplinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bestDisciplines.length > 0 ?
              bestDisciplines.map((disc, idx) =>
              <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{disc.discipline}</span>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">{disc.accuracy}%</Badge>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, disc.accuracy)}%` }} />

                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{disc.correct} de {disc.total} questões corretas</p>
                  </div>
              ) :

              <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhum dado disponível</p>
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Pontos de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {worstDisciplines.length > 0 ?
              worstDisciplines.map((disc, idx) =>
              <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{disc.discipline}</span>
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">{disc.accuracy}%</Badge>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, disc.accuracy)}%` }} />

                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{disc.correct} de {disc.total} questões corretas</p>
                  </div>
              ) :

              <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhum dado disponível</p>
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Difficulty and Radar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <Target className="w-5 h-5 text-[#2f456d]" />
              Por Dificuldade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={difficultyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="difficulty" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#2f456d" name="Taxa de Acerto (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {disciplinePerformance.length > 0 &&
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                <Brain className="w-5 h-5 text-[#2f456d]" />
                Visão Geral por Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                data={disciplinePerformance.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis
                  type="category"
                  dataKey="discipline"
                  tick={{ fontSize: 11 }}
                  width={90} />

                  <Tooltip
                  formatter={(value) => [`${value}%`, 'Taxa de Acerto']}
                  labelFormatter={(label) => label} />

                  <Bar
                  dataKey="accuracy"
                  fill="#2f456d"
                  name="Taxa de Acerto"
                  radius={[0, 4, 4, 0]}>

                    {disciplinePerformance.slice(0, 8).map((entry, index) =>
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.accuracy >= 70 ? '#10b981' : entry.accuracy >= 50 ? '#f59e0b' : '#ef4444'} />

                  )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">≥70% Ótimo</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">50-69% Regular</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">&lt;50% Revisar</span>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      </div>

      {/* Best and Worst Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <Sparkles className="w-5 h-5 text-green-600" />
              Melhores Assuntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSubjects.length > 0 ?
              bestSubjects.map((subj, idx) =>
              <div key={idx} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{subj.subject}</span>
                    <Badge className="bg-green-600 text-white">{subj.accuracy}%</Badge>
                  </div>
              ) :

              <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhum dado disponível</p>
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Assuntos para Revisar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {worstSubjects.length > 0 ?
              worstSubjects.map((subj, idx) =>
              <div key={idx} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{subj.subject}</span>
                    <Badge className="bg-red-600 text-white">{subj.accuracy}%</Badge>
                  </div>
              ) :

              <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhum dado disponível</p>
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Board Performance */}
      {examBoardPerformance.length > 0 &&
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-slate-100">
              <BarChart3 className="w-5 h-5 text-[#2f456d]" />
              Por Banca Examinadora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={examBoardPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="board" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#f26836" name="Taxa de Acerto (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      }

      {/* Insights */}
      <Card className="bg-gradient-to-br from-[#2f456d]/5 to-[#f26836]/5 dark:from-[#2f456d]/20 dark:to-[#1a2d4a]/30 border-[#2f456d]/20 dark:border-[#2f456d]/40">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-[#2f456d] mt-1" />
            <div>
              <h4 className="font-semibold text-[#2f456d] dark:text-blue-200 text-lg mb-3">Insights e Recomendações</h4>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {accuracyRate >= 80 &&
                <li className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Excelente desempenho! Você está dominando o conteúdo.</span>
                  </li>
                }
                {accuracyRate < 60 &&
                <li className="flex items-start gap-2">
                    <span className="text-amber-600">!</span>
                    <span>Foque em revisar os conceitos básicos e resolver mais questões.</span>
                  </li>
                }
                {worstDisciplines.length > 0 &&
                <li className="flex items-start gap-2">
                    <span className="text-[#2f456d]">→</span>
                    <span>Priorize estudar: {worstDisciplines.map((d) => d.discipline).join(', ')}</span>
                  </li>
                }
                {bestDisciplines.length > 0 &&
                <li className="flex items-start gap-2">
                    <span className="text-green-600">★</span>
                    <span>Seus pontos fortes: {bestDisciplines.map((d) => d.discipline).join(', ')}</span>
                  </li>
                }
                <li className="flex items-start gap-2">
                  <span className="text-[#2f456d]">💡</span>
                  <span>Mantenha uma rotina constante de estudos para melhores resultados.</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>);

}

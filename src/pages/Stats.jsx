import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, Award, Target, AlertTriangle,
  BarChart3, Brain, Sparkles, CheckCircle2, XCircle, ArrowLeftRight,
  BookOpen, Flame, Zap, Star, Activity, GraduationCap, ChevronRight,
} from 'lucide-react';
import {
  format, subDays, subMonths, startOfMonth, endOfMonth,
  eachWeekOfInterval, endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const safeNumber = (v) => { const n = Number(v); return isNaN(n) || !isFinite(n) ? 0 : n; };

const PRIMARY = '#2f456d';
const SECONDARY = '#f26836';
const COLORS = [PRIMARY, SECONDARY, '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const MONTHS = [
  { value: '0', label: 'Janeiro' }, { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' }, { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' }, { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' }, { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' }, { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' }, { value: '11', label: 'Dezembro' },
];

function StatCard({ label, value, sub, icon: Icon, accent, trend }) {
  return (
    <Card className="relative overflow-hidden bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ background: accent }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2.5 rounded-xl" style={{ background: accent + '18' }}>
              <Icon className="w-5 h-5" style={{ color: accent }} />
            </div>
            {trend !== undefined && (
              <div className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
      {label && <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-600 dark:text-slate-300">{p.name}: <b>{p.value}{p.unit || ''}</b></span>
        </div>
      ))}
    </div>
  );
};

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
    queryFn: () => base44.entities.Attempt.list('-created_date', 10000),
    staleTime: 0,
  });

  const attempts = React.useMemo(() => {
    if (!user?.id) return [];
    return allAttempts.filter(a => a.user_id === user.id);
  }, [allAttempts, user?.id]);

  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list(),
    staleTime: 0,
  });

  const filteredAttempts = React.useMemo(() => {
    const userAttempts = attempts.filter(a => a.created_by === user?.email || a.user_id === user?.id);
    if (dateRange === 'all') return userAttempts;
    const startDate = subDays(new Date(), parseInt(dateRange));
    return userAttempts.filter(a => new Date(a.created_date) >= startDate);
  }, [attempts, dateRange, user]);

  const periodComparison = React.useMemo(() => {
    const p1Start = startOfMonth(new Date(currentYear, parseInt(period1Month)));
    const p1End = endOfMonth(p1Start);
    const p2Start = startOfMonth(new Date(currentYear, parseInt(period2Month)));
    const p2End = endOfMonth(p2Start);
    const ua = attempts.filter(a => a.created_by === user?.email || a.user_id === user?.id);

    const calc = (start, end) => {
      const arr = ua.filter(a => { const d = new Date(a.created_date); return d >= start && d <= end; });
      const total = arr.length;
      const correct = arr.filter(a => a.is_correct).length;
      return { total, correct, accuracy: total > 0 ? safeNumber((correct / total * 100).toFixed(1)) : 0 };
    };
    return {
      period1: { ...calc(p1Start, p1End), name: MONTHS[parseInt(period1Month)].label },
      period2: { ...calc(p2Start, p2End), name: MONTHS[parseInt(period2Month)].label },
    };
  }, [attempts, period1Month, period2Month, currentYear, user]);

  const weeklyEvolution = React.useMemo(() => {
    const weeks = eachWeekOfInterval({ start: subDays(new Date(), 56), end: new Date() }, { weekStartsOn: 0 });
    const ua = attempts.filter(a => a.created_by === user?.email || a.user_id === user?.id);
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const wa = ua.filter(a => { const d = new Date(a.created_date); return d >= weekStart && d <= weekEnd; });
      const total = wa.length;
      const correct = wa.filter(a => a.is_correct).length;
      return { week: format(weekStart, 'dd/MM', { locale: ptBR }), total, correct, incorrect: total - correct, accuracy: total > 0 ? safeNumber((correct / total * 100).toFixed(1)) : 0 };
    });
  }, [attempts, user]);

  const dailyData = React.useMemo(() => {
    const days = dateRange === 'all' ? 90 : parseInt(dateRange);
    const dayMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'dd/MM');
      dayMap[date] = { date, correct: 0, incorrect: 0, total: 0 };
    }
    filteredAttempts.forEach(a => {
      const date = format(new Date(a.created_date), 'dd/MM');
      if (dayMap[date]) {
        dayMap[date].total++;
        if (a.is_correct) dayMap[date].correct++;
        else dayMap[date].incorrect++;
      }
    });
    return Object.values(dayMap);
  }, [filteredAttempts, dateRange]);

  const disciplinePerformance = React.useMemo(() => {
    const map = {};
    filteredAttempts.forEach(a => {
      const q = questions.find(q => q.id === a.question_id);
      if (!q?.discipline) return;
      if (!map[q.discipline]) map[q.discipline] = { discipline: q.discipline, correct: 0, total: 0 };
      map[q.discipline].total++;
      if (a.is_correct) map[q.discipline].correct++;
    });
    return Object.values(map).map(d => ({ ...d, accuracy: d.total > 0 ? safeNumber((d.correct / d.total * 100).toFixed(1)) : 0 })).sort((a, b) => b.accuracy - a.accuracy);
  }, [filteredAttempts, questions]);

  const subjectPerformance = React.useMemo(() => {
    const map = {};
    filteredAttempts.forEach(a => {
      const q = questions.find(q => q.id === a.question_id);
      if (!q?.subjects) return;
      q.subjects.forEach(s => {
        if (!map[s]) map[s] = { subject: s, correct: 0, total: 0 };
        map[s].total++;
        if (a.is_correct) map[s].correct++;
      });
    });
    return Object.values(map).map(s => ({ ...s, accuracy: s.total > 0 ? safeNumber((s.correct / s.total * 100).toFixed(1)) : 0 })).sort((a, b) => b.accuracy - a.accuracy);
  }, [filteredAttempts, questions]);

  const difficultyPerformance = React.useMemo(() => {
    const dm = { Fácil: { correct: 0, total: 0 }, Médio: { correct: 0, total: 0 }, Difícil: { correct: 0, total: 0 } };
    filteredAttempts.forEach(a => {
      const q = questions.find(q => q.id === a.question_id);
      if (!q?.difficulty) return;
      dm[q.difficulty].total++;
      if (a.is_correct) dm[q.difficulty].correct++;
    });
    return Object.entries(dm).map(([d, v]) => ({ difficulty: d, accuracy: v.total > 0 ? safeNumber((v.correct / v.total * 100).toFixed(1)) : 0, correct: v.correct, total: v.total }));
  }, [filteredAttempts, questions]);

  const examBoardPerformance = React.useMemo(() => {
    const map = {};
    filteredAttempts.forEach(a => {
      const q = questions.find(q => q.id === a.question_id);
      if (!q?.exam_board) return;
      if (!map[q.exam_board]) map[q.exam_board] = { board: q.exam_board, correct: 0, total: 0 };
      map[q.exam_board].total++;
      if (a.is_correct) map[q.exam_board].correct++;
    });
    return Object.values(map).map(b => ({ ...b, accuracy: b.total > 0 ? safeNumber((b.correct / b.total * 100).toFixed(1)) : 0 })).sort((a, b) => b.accuracy - a.accuracy);
  }, [filteredAttempts, questions]);

  const totalAttempts = safeNumber(filteredAttempts.length);
  const correctAttempts = safeNumber(filteredAttempts.filter(a => a.is_correct).length);
  const accuracyRate = totalAttempts > 0 ? safeNumber((correctAttempts / totalAttempts * 100).toFixed(1)) : 0;

  const bestDisciplines = disciplinePerformance.slice(0, 3);
  const worstDisciplines = disciplinePerformance.slice(-3).reverse();
  const bestSubjects = subjectPerformance.slice(0, 5);
  const worstSubjects = subjectPerformance.slice(-5).reverse();

  const pieData = [
    { name: 'Acertos', value: correctAttempts, color: '#10b981' },
    { name: 'Erros', value: totalAttempts - correctAttempts, color: '#ef4444' },
  ];

  const radarData = disciplinePerformance.slice(0, 6).map(d => ({
    discipline: d.discipline.length > 12 ? d.discipline.substring(0, 12) + '…' : d.discipline,
    accuracy: safeNumber(d.accuracy),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2f456d] via-[#243756] to-[#1a2d4a] p-6 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 w-40 h-40 rounded-full border-2 border-white/30" />
          <div className="absolute -bottom-6 -right-6 w-56 h-56 rounded-full border border-white/20" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Activity className="w-7 h-7 text-[#f26836]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Estatísticas</h1>
              <p className="text-blue-200 text-sm mt-0.5">Acompanhe seu desempenho em detalhes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white backdrop-blur-sm hover:bg-white/20 focus:ring-white/30">
                <Calendar className="w-4 h-4 mr-2 text-blue-200" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
              className={compareMode
                ? 'bg-[#f26836] hover:bg-[#d9561f] border-[#f26836] text-white'
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Comparar
            </Button>
          </div>
        </div>
      </div>

      {/* Period Comparison */}
      {compareMode && (
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[#2f456d] dark:text-blue-200 text-base">
              <ArrowLeftRight className="w-4 h-4" />
              Comparação de Períodos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Período 1</p>
                <Select value={period1Month} onValueChange={setPeriod1Month}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Período 2</p>
                <Select value={period2Month} onValueChange={setPeriod2Month}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[periodComparison.period1, periodComparison.period2].map((p, i) => (
                <div key={i} className={`p-4 rounded-xl border ${i === 0 ? 'bg-[#2f456d]/5 dark:bg-[#2f456d]/20 border-[#2f456d]/20' : 'bg-[#f26836]/5 dark:bg-[#f26836]/20 border-[#f26836]/20'}`}>
                  <h4 className={`font-semibold mb-3 text-sm ${i === 0 ? 'text-[#2f456d] dark:text-blue-200' : 'text-[#f26836] dark:text-orange-300'}`}>{p.name}</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Questões</span><span className="font-bold text-slate-800 dark:text-white">{p.total}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Acertos</span><span className="font-bold text-emerald-600">{p.correct}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Taxa</span><span className={`font-bold ${i === 0 ? 'text-[#2f456d] dark:text-blue-300' : 'text-[#f26836]'}`}>{p.accuracy}%</span></div>
                  </div>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { name: 'Questões', [periodComparison.period1.name]: periodComparison.period1.total, [periodComparison.period2.name]: periodComparison.period2.total },
                { name: 'Acertos', [periodComparison.period1.name]: periodComparison.period1.correct, [periodComparison.period2.name]: periodComparison.period2.correct },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey={periodComparison.period1.name} fill={PRIMARY} radius={[4, 4, 0, 0]} />
                <Bar dataKey={periodComparison.period2.name} fill={SECONDARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Resolvidas" value={totalAttempts} sub="questões" icon={BookOpen} accent={PRIMARY} />
        <StatCard label="Acertos" value={correctAttempts} sub={`de ${totalAttempts}`} icon={CheckCircle2} accent="#10b981" />
        <StatCard label="Erros" value={totalAttempts - correctAttempts} sub="para revisar" icon={XCircle} accent="#ef4444" />
        <StatCard
          label="Taxa de Acerto"
          value={`${accuracyRate}%`}
          sub={accuracyRate >= 70 ? 'Excelente!' : accuracyRate >= 50 ? 'Regular' : 'Precisa melhorar'}
          icon={TrendingUp}
          accent={accuracyRate >= 70 ? '#10b981' : accuracyRate >= 50 ? '#f59e0b' : '#ef4444'}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#2f456d]" />
              Distribuição Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {totalAttempts > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-6 mt-1">
                  {pieData.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full" style={{ background: e.color }} />
                      <span className="text-slate-600 dark:text-slate-300">{e.name}: <b>{e.value}</b></span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <p className="text-3xl font-bold" style={{ color: accuracyRate >= 70 ? '#10b981' : accuracyRate >= 50 ? '#f59e0b' : '#ef4444' }}>{accuracyRate}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">taxa de acerto</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[180px] text-slate-400 dark:text-slate-500">
                <Target className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">Nenhum dado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="lg:col-span-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#2f456d]" />
              Radar por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <PolarAngleAxis dataKey="discipline" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Acerto %" dataKey="accuracy" stroke={PRIMARY} fill={PRIMARY} fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] text-slate-400 dark:text-slate-500">
                <Brain className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">Resolva mais questões para ver o radar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Evolution Chart */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2f456d]" />
            Evolução Semanal (8 semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyEvolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCorrect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradIncorrect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="correct" stroke="#10b981" fill="url(#gradCorrect)" strokeWidth={2.5} name="Acertos" dot={{ r: 3 }} />
              <Area type="monotone" dataKey="incorrect" stroke="#ef4444" fill="url(#gradIncorrect)" strokeWidth={2.5} name="Erros" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Disciplines + Difficulty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discipline performance bars */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#2f456d]" />
              Taxa por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disciplinePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={disciplinePerformance.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 30, left: 90, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="discipline" tick={{ fontSize: 10 }} width={85} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" name="Acerto" radius={[0, 5, 5, 0]}>
                    {disciplinePerformance.slice(0, 8).map((e, i) => (
                      <Cell key={i} fill={e.accuracy >= 70 ? '#10b981' : e.accuracy >= 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px] text-slate-400 dark:text-slate-500">
                <GraduationCap className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            )}
            {disciplinePerformance.length > 0 && (
              <div className="flex justify-center gap-5 mt-3 text-xs">
                {[['#10b981', '≥70%', 'Ótimo'], ['#f59e0b', '50–69%', 'Regular'], ['#ef4444', '<50%', 'Revisar']].map(([color, range, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-slate-500 dark:text-slate-400">{range} {label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Difficulty */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#f26836]" />
              Desempenho por Dificuldade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={difficultyPerformance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Acerto %" radius={[6, 6, 0, 0]}>
                  {difficultyPerformance.map((e, i) => (
                    <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i] || PRIMARY} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {difficultyPerformance.map((d, i) => (
                d.total > 0 && (
                  <div key={d.difficulty} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{d.difficulty}</span>
                    <span className="text-slate-400 dark:text-slate-500">{d.correct}/{d.total} corretas</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Disciplines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              Melhores Disciplinas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bestDisciplines.length > 0 ? bestDisciplines.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[70%]">{d.discipline}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">{d.accuracy}%</Badge>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${Math.min(100, d.accuracy)}%` }} />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{d.correct}/{d.total} corretas</p>
              </div>
            )) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum dado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Pontos de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {worstDisciplines.length > 0 ? worstDisciplines.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[70%]">{d.discipline}</span>
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0">{d.accuracy}%</Badge>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-red-400 to-red-500" style={{ width: `${Math.min(100, d.accuracy)}%` }} />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{d.correct}/{d.total} corretas</p>
              </div>
            )) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum dado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Melhores Assuntos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bestSubjects.length > 0 ? bestSubjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">#{i + 1}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.subject}</span>
                </div>
                <Badge className="bg-emerald-600 text-white border-0 shrink-0 ml-2">{s.accuracy}%</Badge>
              </div>
            )) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum dado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              Assuntos para Revisar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {worstSubjects.length > 0 ? worstSubjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{s.subject}</span>
                </div>
                <Badge className="bg-red-600 text-white border-0 shrink-0 ml-2">{s.accuracy}%</Badge>
              </div>
            )) : (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <Flame className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum dado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam Boards */}
      {examBoardPerformance.length > 0 && (
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2f456d]" />
              Por Banca Examinadora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={examBoardPerformance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="board" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="Acerto %" fill={SECONDARY} radius={[6, 6, 0, 0]}>
                  {examBoardPerformance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-gradient-to-br from-[#2f456d]/5 to-[#f26836]/5 dark:from-[#2f456d]/20 dark:to-slate-800 border-[#2f456d]/20 dark:border-[#2f456d]/30 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#2f456d]/10 dark:bg-[#2f456d]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#2f456d] dark:text-blue-300" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[#2f456d] dark:text-blue-200 text-base mb-3">Insights e Recomendações</h4>
              <ul className="space-y-2">
                {accuracyRate >= 80 && (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Excelente desempenho! Você está dominando o conteúdo.</span>
                  </li>
                )}
                {accuracyRate < 60 && accuracyRate > 0 && (
                  <li className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Foque em revisar os conceitos básicos e resolver mais questões.</span>
                  </li>
                )}
                {worstDisciplines.length > 0 && (
                  <li className="flex items-start gap-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-[#2f456d] dark:text-blue-400 mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Priorize estudar: <strong>{worstDisciplines.map(d => d.discipline).join(', ')}</strong></span>
                  </li>
                )}
                {bestDisciplines.length > 0 && (
                  <li className="flex items-start gap-2 text-sm">
                    <Star className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">Seus pontos fortes: <strong>{bestDisciplines.map(d => d.discipline).join(', ')}</strong></span>
                  </li>
                )}
                <li className="flex items-start gap-2 text-sm">
                  <Flame className="w-4 h-4 text-[#f26836] mt-0.5 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Mantenha uma rotina constante de estudos para melhores resultados.</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

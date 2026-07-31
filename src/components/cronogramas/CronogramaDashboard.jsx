import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, Circle, Clock, Calendar, BarChart2, BookOpen, RefreshCw,
  Flame, Target, Loader2, ChevronLeft, ChevronRight, Search, SkipForward,
  Play, FileText, AlertCircle, TrendingUp,
} from 'lucide-react';
import cronogramaService from '@/services/cronogramaService';
import { toast } from 'sonner';

const STATUS_ICON = {
  not_started: <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />,
  in_progress: <div className="w-4 h-4 rounded-full bg-amber-400 ring-2 ring-amber-200 dark:ring-amber-900" />,
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
};

const TASK_STATUS_CLASS = {
  pending: 'border-slate-200 dark:border-slate-700',
  completed: 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800/40',
  skipped: 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 opacity-60',
  rescheduled: 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/40',
};

function StatCard({ icon, value, label, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function TodayTasks({ ucId }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['uc-tasks', ucId, selectedDate],
    queryFn: () => cronogramaService.getDayTasks(ucId, selectedDate),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, status }) => cronogramaService.updateTaskStatus(taskId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['uc-tasks', ucId] });
      qc.invalidateQueries({ queryKey: ['uc-stats', ucId] });
    },
    onError: () => toast.error('Erro ao atualizar tarefa'),
  });

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === today;
  const dateLabel = isToday ? 'Hoje' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[#2f456d]" /></div>;

  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-slate-800 dark:text-white capitalize">{dateLabel}</p>
          {isToday && tasks.length > 0 && (
            <p className="text-xs text-slate-500">{completed}/{tasks.length} concluídas</p>
          )}
        </div>
        <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {tasks.length > 0 && (
        <Progress value={(completed / tasks.length) * 100} className="h-1.5" />
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma tarefa neste dia</p>
          <p className="text-sm mt-1">Dia de descanso ou fora do cronograma</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-xl border-2 p-4 transition-all ${TASK_STATUS_CLASS[task.status] || TASK_STATUS_CLASS.pending}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : task.status === 'skipped' ? (
                    <SkipForward className="w-5 h-5 text-slate-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.discipline && (
                      <Badge className="text-xs bg-[#2f456d]/10 text-[#2f456d] dark:bg-[#2f456d]/30 dark:text-blue-300 border-0">
                        {task.discipline.name}
                      </Badge>
                    )}
                  </div>
                  <p className={`font-medium mt-1 text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                    {task.subject?.name || 'Assunto'}
                  </p>
                  {task.subject?.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.subject.description}</p>
                  )}
                </div>
              </div>
              {task.status === 'pending' && (
                <div className="flex gap-2 mt-3 pl-8">
                  <Button
                    size="sm"
                    onClick={() => updateMutation.mutate({ taskId: task.id, status: 'completed' })}
                    disabled={updateMutation.isPending}
                    className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Concluir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ taskId: task.id, status: 'skipped' })}
                    disabled={updateMutation.isPending}
                    className="h-7 text-xs text-slate-500 px-3"
                  >
                    <SkipForward className="w-3 h-3 mr-1" />
                    Pular
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditalVerticalizado({ ucId, disciplines }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | completed
  const qc = useQueryClient();

  const allSubjects = useMemo(() => {
    return disciplines.flatMap((d) =>
      d.subjects.map((s) => ({
        ...s,
        discipline: d.name,
        discipline_color: d.color,
        status: s.progress?.[0]?.status || 'not_started',
      }))
    );
  }, [disciplines]);

  const filtered = useMemo(() => {
    let list = allSubjects;
    if (filter === 'pending') list = list.filter((s) => s.status !== 'completed');
    if (filter === 'completed') list = list.filter((s) => s.status === 'completed');
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.discipline.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [allSubjects, search, filter]);

  const updateMutation = useMutation({
    mutationFn: ({ subjectId, status }) => cronogramaService.updateSubjectProgress(ucId, subjectId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['uc', ucId] });
      qc.invalidateQueries({ queryKey: ['uc-stats', ucId] });
    },
    onError: () => toast.error('Erro ao atualizar progresso'),
  });

  const completedCount = allSubjects.filter((s) => s.status === 'completed').length;
  const pct = allSubjects.length > 0 ? Math.round((completedCount / allSubjects.length) * 100) : 0;

  const cycleStatus = (s) => {
    const next = s.status === 'not_started' ? 'in_progress' : s.status === 'in_progress' ? 'completed' : 'not_started';
    updateMutation.mutate({ subjectId: s.id, status: next });
  };

  // Group by discipline
  const byDiscipline = useMemo(() => {
    const map = {};
    for (const s of filtered) {
      if (!map[s.discipline]) map[s.discipline] = { name: s.discipline, color: s.discipline_color, subjects: [] };
      map[s.discipline].subjects.push(s);
    }
    return Object.values(map);
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Progresso geral</p>
          <span className="text-sm font-bold text-[#2f456d] dark:text-blue-400">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-slate-400">{completedCount} de {allSubjects.length} assuntos concluídos</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? 'bg-[#2f456d] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Concluídos'}
          </button>
        ))}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar assunto..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-4">
        {byDiscipline.map((disc) => {
          const done = disc.subjects.filter((s) => s.status === 'completed').length;
          const pct2 = disc.subjects.length > 0 ? Math.round((done / disc.subjects.length) * 100) : 0;
          return (
            <div key={disc.name} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">{disc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={pct2} className="h-1 flex-1" />
                    <span className="text-xs text-slate-500 shrink-0">{done}/{disc.subjects.length}</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {disc.subjects.map((s) => (
                  <div key={s.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <button
                      onClick={() => cycleStatus(s)}
                      className="shrink-0 hover:scale-110 transition-transform"
                      title="Clique para alternar status"
                    >
                      {STATUS_ICON[s.status]}
                    </button>
                    <span className={`text-sm flex-1 ${s.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {s.name}
                    </span>
                    {s.status === 'in_progress' && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-300">
                        Em andamento
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CronogramaCalendar({ ucId }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const { data: calData = [], isLoading } = useQuery({
    queryKey: ['uc-calendar', ucId, month, year],
    queryFn: () => cronogramaService.getCalendar(ucId, month, year),
    staleTime: 60_000,
  });

  const byDate = useMemo(() => {
    const m = {};
    calData.forEach((d) => { m[d.date] = d; });
    return m;
  }, [calData]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const todayStr = today.toISOString().slice(0, 10);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="font-semibold text-slate-800 dark:text-white capitalize">{monthName}</p>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
          <p key={i} className="text-xs font-medium text-slate-400 py-1">{d}</p>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const data = byDate[dateStr];
          const isToday2 = dateStr === todayStr;
          const allDone = data && data.total > 0 && data.completed === data.total;
          const partial = data && data.completed > 0 && data.completed < data.total;
          const hasTasks = data && data.total > 0;

          return (
            <div
              key={dayNum}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all relative ${
                isToday2 ? 'ring-2 ring-[#f26836] ring-offset-1 dark:ring-offset-slate-900' : ''
              } ${
                allDone ? 'bg-emerald-500 text-white' :
                partial ? 'bg-amber-400 text-white' :
                hasTasks ? 'bg-[#2f456d]/10 text-[#2f456d] dark:bg-[#2f456d]/30 dark:text-blue-300' :
                'text-slate-400 dark:text-slate-600'
              }`}
            >
              {dayNum}
              {hasTasks && (
                <div className={`w-1 h-1 rounded-full mt-0.5 ${allDone ? 'bg-white/60' : partial ? 'bg-white/60' : 'bg-[#2f456d]/40 dark:bg-blue-400/40'}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-center text-xs text-slate-500 flex-wrap pt-2">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" />Concluído</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" />Parcial</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#2f456d]/20" />Agendado</span>
      </div>
    </div>
  );
}

export default function CronogramaDashboard({ uc, onBack }) {
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['uc-stats', uc.id],
    queryFn: () => cronogramaService.getStats(uc.id),
    staleTime: 60_000,
  });

  const { data: ucFull } = useQuery({
    queryKey: ['uc', uc.id],
    queryFn: () => cronogramaService.getMy(uc.id),
    staleTime: 60_000,
    initialData: uc,
  });

  const recalcMutation = useMutation({
    mutationFn: () => cronogramaService.recalculate(uc.id),
    onSuccess: () => {
      toast.success('Cronograma recalculado!');
      qc.invalidateQueries({ queryKey: ['uc-tasks', uc.id] });
      qc.invalidateQueries({ queryKey: ['uc-stats', uc.id] });
    },
    onError: () => toast.error('Erro ao recalcular'),
  });

  const disciplines = ucFull?.disciplines || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2f456d] dark:text-white">
              {ucFull?.title || 'Meu Cronograma'}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {ucFull?.contest && <Badge className="text-xs bg-[#f26836]/10 text-[#f26836] border-[#f26836]/20">{ucFull.contest}</Badge>}
              {ucFull?.streak > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                  {ucFull.streak} dias seguidos
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => recalcMutation.mutate()}
          disabled={recalcMutation.isPending}
          className="gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
          Recalcular
        </Button>
      </div>

      {/* Progresso geral */}
      {stats && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Progresso geral
            </span>
            <span className="text-lg font-bold text-[#2f456d] dark:text-blue-400">{stats.overall_progress_pct}%</span>
          </div>
          <Progress value={stats.overall_progress_pct} className="h-2.5" />
        </div>
      )}

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<BookOpen className="w-5 h-5" />} value={stats.completed_subjects} label="Assuntos concluídos" color="emerald" />
          <StatCard icon={<AlertCircle className="w-5 h-5" />} value={stats.pending_subjects} label="Assuntos pendentes" color="orange" />
          <StatCard icon={<Calendar className="w-5 h-5" />} value={stats.days_studied} label="Dias estudados" color="blue" />
          <StatCard icon={<Flame className="w-5 h-5" />} value={stats.streak} label="Sequência atual" color="violet" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="today">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="today" className="flex-1 sm:flex-none gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Hoje
          </TabsTrigger>
          <TabsTrigger value="edital" className="flex-1 sm:flex-none gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Edital
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 sm:flex-none gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex-1 sm:flex-none gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-[#2f456d]" />
                Tarefas do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TodayTasks ucId={uc.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edital">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2f456d]" />
                Edital Verticalizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditalVerticalizado ucId={uc.id} disciplines={disciplines} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2f456d]" />
                Calendário de Estudos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CronogramaCalendar ucId={uc.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#2f456d]" />
                Progresso por Disciplina
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-3">
                  {stats.discipline_stats?.map((d) => (
                    <div key={d.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{d.name}</span>
                        <span className="text-slate-500 text-xs">{d.completed}/{d.total} — {d.progress_pct}%</span>
                      </div>
                      <Progress value={d.progress_pct} className="h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2f456d]" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

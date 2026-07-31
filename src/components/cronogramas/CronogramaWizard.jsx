import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, Circle, Star, BookOpen, Calendar, Clock, ChevronRight,
  ChevronLeft, Sparkles, Trophy, Users, ArrowRight, Search, Plus, ChevronDown,
} from 'lucide-react';
import cronogramaService from '@/services/cronogramaService';
import { toast } from 'sonner';

const COLORS = ['blue', 'emerald', 'violet', 'orange', 'rose', 'cyan', 'amber', 'teal'];
const COLOR_LABELS = {
  blue: 'Azul',
  emerald: 'Verde',
  violet: 'Roxo',
  orange: 'Laranja',
  rose: 'Rosa',
  cyan: 'Ciano',
  amber: 'Âmbar',
  teal: 'Verde-água',
};
const COLOR_MAP = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
  violet: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  rose: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300',
  amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
  teal: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300',
};

const DIFF_LABELS = ['', 'Muito Fácil', 'Fácil', 'Média', 'Difícil', 'Muito Difícil'];
const DIFF_COLORS = ['', 'text-emerald-500', 'text-green-500', 'text-amber-500', 'text-orange-500', 'text-red-500'];

const STUDY_DAYS_OPTIONS = [
  { id: 'weekdays', label: 'Segunda a Sexta', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { id: 'sat', label: 'Segunda a Sábado', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  { id: 'all', label: 'Todos os dias', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  { id: 'custom', label: 'Personalizado', days: null },
];

const DAY_LABELS = { Mon: 'Seg', Tue: 'Ter', Wed: 'Qua', Thu: 'Qui', Fri: 'Sex', Sat: 'Sáb', Sun: 'Dom' };
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MINUTES_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
  { value: 300, label: '5 horas ou mais' },
];

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            i + 1 < current ? 'bg-[#2f456d] text-white' :
            i + 1 === current ? 'bg-[#f26836] text-white ring-4 ring-[#f26836]/20' :
            'bg-slate-200 dark:bg-slate-700 text-slate-400'
          }`}>
            {i + 1 < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 flex-1 transition-all ${i + 1 < current ? 'bg-[#2f456d]' : 'bg-slate-200 dark:bg-slate-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function OfficialCronogramCard({ c, onAdopt, loading }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 hover:border-[#2f456d]/40 dark:hover:border-blue-500/40 cursor-pointer group">
      <div className="h-32 bg-gradient-to-br from-[#2f456d] to-[#1a2d4a] flex items-center justify-center">
        {c.thumbnail_url ? (
          <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-12 h-12 text-white/30" />
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">{c.title}</h3>
          {c.contest && <p className="text-xs text-[#f26836] font-medium mt-0.5">{c.contest}</p>}
          {c.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{c.description}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {c.total_days && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.total_days} dias</span>}
          {c.disciplines_count && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{c.disciplines_count} disciplinas</span>}
          {c.students_count > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.students_count} alunos</span>}
        </div>
        {c.exam_board && <Badge variant="outline" className="text-xs">{c.exam_board}</Badge>}
        <Button
          onClick={() => onAdopt(c.id)}
          disabled={loading}
          size="sm"
          className="w-full bg-[#2f456d] hover:bg-[#1a2d4a] text-white"
        >
          {loading ? 'Adotando...' : 'Utilizar Cronograma'}
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CronogramaWizard({ onComplete }) {
  const [mode, setMode] = useState(null); // 'custom' | 'official'
  const [step, setStep] = useState(1);
  const [adoptingId, setAdoptingId] = useState(null);
  const [search, setSearch] = useState('');

  // Custom wizard state
  // selectedDisciplines: [{ name, allSubjects[], subjects[], color, difficulty, expanded }]
  const [contest, setContest] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [disciplinesPerDay, setDisciplinesPerDay] = useState(2);
  const [studyDaysOption, setStudyDaysOption] = useState('weekdays');
  const [customDays, setCustomDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [dailyMinutes, setDailyMinutes] = useState(120);
  const [newSubjectInput, setNewSubjectInput] = useState({}); // { [disciplineName]: string }

  const { data: officialData } = useQuery({
    queryKey: ['cronograms-official'],
    queryFn: () => cronogramaService.listOfficial(),
    enabled: mode === 'official',
  });

  const { data: disciplinesData } = useQuery({
    queryKey: ['cronogramas-disciplines'],
    queryFn: () => cronogramaService.getAvailableDisciplines(),
    enabled: mode === 'custom' && step >= 2,
  });

  const createMutation = useMutation({
    mutationFn: (data) => cronogramaService.createMy(data),
    onSuccess: (data) => {
      toast.success('Cronograma criado com sucesso!');
      onComplete(data);
    },
    onError: (err) => toast.error(err?.message || 'Erro ao criar cronograma'),
  });

  const adoptMutation = useMutation({
    mutationFn: (id) => cronogramaService.adopt(id),
    onSuccess: (data) => {
      toast.success('Cronograma adotado com sucesso!');
      onComplete(data);
    },
    onError: (err) => {
      if (err?.response?.status === 409) {
        toast.error('Você já utiliza esse cronograma');
      } else {
        toast.error('Erro ao adotar cronograma');
      }
    },
  });

  const officialCronograms = officialData?.data || [];

  const studyDays = useMemo(() => {
    if (studyDaysOption === 'custom') return customDays;
    return STUDY_DAYS_OPTIONS.find((o) => o.id === studyDaysOption)?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  }, [studyDaysOption, customDays]);

  const maxStep = mode === 'custom' ? 8 : 2;

  const toggleDiscipline = (disc) => {
    const exists = selectedDisciplines.find((d) => d.name === disc.discipline);
    if (exists) {
      setSelectedDisciplines((prev) => prev.filter((d) => d.name !== disc.discipline));
    } else {
      const color = COLORS[selectedDisciplines.length % COLORS.length];
      const allSubjects = (disc.subjects || []).map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean);
      setSelectedDisciplines((prev) => [
        ...prev,
        {
          name: disc.discipline,
          allSubjects,
          subjects: [...allSubjects], // selecionados (todos por padrão)
          color,
          difficulty: 3,
          expanded: true,
        },
      ]);
    }
  };

  const toggleSubject = (discName, subjectName) => {
    setSelectedDisciplines((prev) =>
      prev.map((d) => {
        if (d.name !== discName) return d;
        const has = d.subjects.includes(subjectName);
        return {
          ...d,
          subjects: has ? d.subjects.filter((s) => s !== subjectName) : [...d.subjects, subjectName],
        };
      })
    );
  };

  const addCustomSubject = (discName) => {
    const value = (newSubjectInput[discName] || '').trim();
    if (!value) return;
    setSelectedDisciplines((prev) =>
      prev.map((d) => {
        if (d.name !== discName) return d;
        if (d.allSubjects.includes(value) || d.subjects.includes(value)) return d;
        return {
          ...d,
          allSubjects: [...d.allSubjects, value],
          subjects: [...d.subjects, value],
        };
      })
    );
    setNewSubjectInput((prev) => ({ ...prev, [discName]: '' }));
  };

  const setDisciplineDifficulty = (name, diff) => {
    setSelectedDisciplines((prev) =>
      prev.map((d) => (d.name === name ? { ...d, difficulty: diff } : d))
    );
  };

  const handleFinish = () => {
    const disciplines = selectedDisciplines
      .map((d, i) => ({
        name: d.name,
        color: d.color,
        difficulty: d.difficulty,
        display_order: i,
        subjects: d.subjects.map((name, j) => ({ name, display_order: j })),
      }))
      .filter((d) => d.subjects.length > 0);

    if (disciplines.length === 0) {
      toast.error('Selecione ao menos um assunto em cada disciplina');
      return;
    }

    createMutation.mutate({
      title: contest ? `Cronograma ${contest}` : 'Meu Cronograma de Estudos',
      contest: contest || undefined,
      type: 'custom',
      disciplines_per_day: disciplinesPerDay,
      study_days: studyDays,
      daily_minutes: dailyMinutes,
      disciplines,
    });
  };

  const canGoNextFromStep3 = selectedDisciplines.length > 0
    && selectedDisciplines.every((d) => d.subjects.length > 0);

  const filteredDisciplines = useMemo(() => {
    const list = disciplinesData || [];
    if (!search) return list;
    return list.filter((d) => d.discipline.toLowerCase().includes(search.toLowerCase()));
  }, [disciplinesData, search]);

  // ── STEP 1: escolha de modo ──────────────────────────────────────────────────
  if (!mode || step === 1) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2f456d] to-[#f26836] rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#2f456d] dark:text-white">Como deseja estudar?</h1>
          <p className="text-slate-500 dark:text-slate-400">Escolha como prefere organizar seu cronograma</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => { setMode('custom'); setStep(2); }}
            className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#2f456d] dark:hover:border-blue-500 hover:shadow-lg transition-all text-left space-y-3 group"
          >
            <div className="w-12 h-12 bg-[#2f456d]/10 rounded-xl flex items-center justify-center group-hover:bg-[#2f456d]/20 transition-colors">
              <Sparkles className="w-6 h-6 text-[#2f456d] dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Criar meu cronograma</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monte um cronograma personalizado com as disciplinas que você escolher</p>
            </div>
          </button>

          <button
            onClick={() => { setMode('official'); setStep(2); }}
            className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#f26836] dark:hover:border-orange-400 hover:shadow-lg transition-all text-left space-y-3 group"
          >
            <div className="w-12 h-12 bg-[#f26836]/10 rounded-xl flex items-center justify-center group-hover:bg-[#f26836]/20 transition-colors">
              <Trophy className="w-6 h-6 text-[#f26836]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Cronograma Oficial</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Use um cronograma criado pela nossa equipe para o seu concurso</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── OFICIAL: galeria ─────────────────────────────────────────────────────────
  if (mode === 'official') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode(null); setStep(1); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Cronogramas Oficiais</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Criados pela nossa equipe para os principais concursos</p>
          </div>
        </div>

        {officialCronograms.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum cronograma oficial disponível ainda</p>
            <p className="text-sm mt-1">Em breve novos cronogramas serão publicados</p>
            <Button onClick={() => { setMode('custom'); setStep(2); }} className="mt-6 bg-[#2f456d] hover:bg-[#1a2d4a] text-white">
              Criar meu cronograma
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {officialCronograms.map((c) => (
              <OfficialCronogramCard
                key={c.id}
                c={c}
                onAdopt={(id) => { setAdoptingId(id); adoptMutation.mutate(id); }}
                loading={adoptMutation.isPending && adoptingId === c.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── CUSTOM WIZARD ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Passo {step - 1} de {maxStep - 1}</span>
          <span>{Math.round(((step - 1) / (maxStep - 1)) * 100)}%</span>
        </div>
        <Progress value={((step - 1) / (maxStep - 1)) * 100} className="h-2" />
      </div>

      {/* STEP 2: Concurso */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Qual o seu concurso?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Opcional — ajuda a organizar seu cronograma</p>
          </div>
          <div className="space-y-2">
            <Label>Nome do concurso ou órgão</Label>
            <Input
              value={contest}
              onChange={(e) => setContest(e.target.value)}
              placeholder="Ex: PMSE, PF, PRF, TRF..."
              className="text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['PMSE', 'PMAL', 'PCAL', 'PF', 'PRF', 'TRF', 'TST', 'INSS', 'Receita Federal', 'CGU'].map((c) => (
              <button
                key={c}
                onClick={() => setContest(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  contest === c
                    ? 'bg-[#2f456d] text-white border-[#2f456d]'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2f456d]/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Disciplinas + assuntos */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Selecione as disciplinas</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Marque a disciplina e escolha os assuntos. Pode criar assuntos novos.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar disciplina..."
              className="pl-9"
            />
          </div>
          <div className="max-h-[28rem] overflow-y-auto space-y-2 pr-1">
            {filteredDisciplines.map((disc) => {
              const selected = selectedDisciplines.find((d) => d.name === disc.discipline);
              return (
                <div
                  key={disc.discipline}
                  className={`rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-[#2f456d] bg-[#2f456d]/5 dark:bg-[#2f456d]/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleDiscipline(disc)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    {selected ? (
                      <CheckCircle2 className="w-5 h-5 text-[#2f456d] dark:text-blue-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{disc.discipline}</p>
                      <p className="text-xs text-slate-400">
                        {selected
                          ? `${selected.subjects.length} de ${selected.allSubjects.length} assuntos`
                          : `${disc.subjects?.length || 0} assuntos`}
                      </p>
                    </div>
                    {selected && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${COLOR_MAP[selected.color] || COLOR_MAP.blue}`}>
                        {COLOR_LABELS[selected.color] || selected.color}
                      </span>
                    )}
                    {selected && <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {selected && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                      <div className="flex gap-2 mb-1">
                        <button
                          type="button"
                          className="text-xs text-[#2f456d] dark:text-blue-300 font-medium"
                          onClick={() => setSelectedDisciplines((prev) =>
                            prev.map((d) => d.name === disc.discipline ? { ...d, subjects: [...d.allSubjects] } : d)
                          )}
                        >
                          Marcar todos
                        </button>
                        <button
                          type="button"
                          className="text-xs text-slate-500 font-medium"
                          onClick={() => setSelectedDisciplines((prev) =>
                            prev.map((d) => d.name === disc.discipline ? { ...d, subjects: [] } : d)
                          )}
                        >
                          Limpar
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {selected.allSubjects.map((subj) => {
                          const checked = selected.subjects.includes(subj);
                          return (
                            <label
                              key={subj}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSubject(disc.discipline, subj)}
                                className="rounded border-slate-300"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-200">{subj}</span>
                            </label>
                          );
                        })}
                        {selected.allSubjects.length === 0 && (
                          <p className="text-xs text-slate-400 px-2 py-1">Nenhum assunto na base — crie abaixo</p>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Input
                          value={newSubjectInput[disc.discipline] || ''}
                          onChange={(e) => setNewSubjectInput((prev) => ({ ...prev, [disc.discipline]: e.target.value }))}
                          placeholder="Novo assunto..."
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomSubject(disc.discipline);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0"
                          onClick={() => addCustomSubject(disc.discipline)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Dificuldade */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Dificuldade por disciplina</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Disciplinas mais difíceis recebem mais atenção no cronograma</p>
          </div>
          <div className="space-y-3">
            {selectedDisciplines.map((disc) => (
              <div key={disc.name} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800 dark:text-white text-sm">{disc.name}</span>
                  <span className={`text-xs font-medium ${DIFF_COLORS[disc.difficulty]}`}>
                    {DIFF_LABELS[disc.difficulty]}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDisciplineDifficulty(disc.name, n)}
                      className="flex-1 py-1 transition-all"
                    >
                      <Star className={`w-5 h-5 mx-auto transition-colors ${
                        n <= disc.difficulty ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: Disciplinas por dia */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Quantas disciplinas por dia?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Quantidade de disciplinas diferentes que estudará cada dia</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setDisciplinesPerDay(n)}
                className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${
                  disciplinesPerDay === n
                    ? 'border-[#2f456d] bg-[#2f456d] text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2f456d]/40'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 6: Dias da semana */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Quantos dias por semana?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Dias em que você pretende estudar</p>
          </div>
          <div className="space-y-3">
            {STUDY_DAYS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setStudyDaysOption(opt.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  studyDaysOption === opt.id
                    ? 'border-[#2f456d] bg-[#2f456d]/5 dark:bg-[#2f456d]/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {studyDaysOption === opt.id ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2f456d] dark:text-blue-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{opt.label}</p>
                  {opt.days && (
                    <p className="text-xs text-slate-400 mt-0.5">{opt.days.map((d) => DAY_LABELS[d]).join(', ')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
          {studyDaysOption === 'custom' && (
            <div className="flex gap-2">
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    setCustomDays((prev) =>
                      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
                    )
                  }
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    customDays.includes(d)
                      ? 'bg-[#2f456d] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 7: Tempo por dia */}
      {step === 7 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Tempo disponível por dia</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Quanto tempo você pode dedicar aos estudos por dia</p>
          </div>
          <div className="space-y-2">
            {MINUTES_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDailyMinutes(opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  dailyMinutes === opt.value
                    ? 'border-[#2f456d] bg-[#2f456d]/5 dark:bg-[#2f456d]/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Clock className={`w-4 h-4 ${dailyMinutes === opt.value ? 'text-[#2f456d] dark:text-blue-400' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${dailyMinutes === opt.value ? 'text-[#2f456d] dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 8: Confirmação */}
      {step === 8 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Confirmar criação</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Revise as configurações antes de gerar seu cronograma</p>
          </div>
          <div className="space-y-3">
            {contest && (
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500">Concurso</span>
                <span className="text-sm font-medium text-slate-800 dark:text-white">{contest}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-500">Disciplinas</span>
              <span className="text-sm font-medium text-slate-800 dark:text-white">{selectedDisciplines.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-500">Assuntos selecionados</span>
              <span className="text-sm font-medium text-slate-800 dark:text-white">
                {selectedDisciplines.reduce((s, d) => s + d.subjects.length, 0)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-500">Disciplinas/dia</span>
              <span className="text-sm font-medium text-slate-800 dark:text-white">{disciplinesPerDay}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm text-slate-500">Dias de estudo</span>
              <span className="text-sm font-medium text-slate-800 dark:text-white">{studyDays.map((d) => DAY_LABELS[d]).join(', ')}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-500">Tempo/dia</span>
              <span className="text-sm font-medium text-slate-800 dark:text-white">
                {MINUTES_OPTIONS.find((o) => o.value === dailyMinutes)?.label}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDisciplines.map((d) => (
              <Badge key={d.name} className={`text-xs ${COLOR_MAP[d.color] || COLOR_MAP.blue}`}>
                {d.name} · {COLOR_LABELS[d.color] || d.color} · {DIFF_LABELS[d.difficulty]} · {d.subjects.length} assuntos
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 2) { setMode(null); setStep(1); }
            else setStep((s) => s - 1);
          }}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>

        {step < maxStep ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 3 && !canGoNextFromStep3}
            className="flex-1 bg-[#2f456d] hover:bg-[#1a2d4a] text-white"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={createMutation.isPending}
            className="flex-1 bg-[#f26836] hover:bg-[#d4582a] text-white"
          >
            {createMutation.isPending ? 'Gerando...' : 'Gerar Cronograma'}
            <Sparkles className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

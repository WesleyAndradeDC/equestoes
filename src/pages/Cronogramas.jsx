import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, CalendarDays, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CronogramaWizard from '@/components/cronogramas/CronogramaWizard';
import CronogramaDashboard from '@/components/cronogramas/CronogramaDashboard';
import cronogramaService from '@/services/cronogramaService';
import { toast } from 'sonner';

const STATUS_COLOR = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  archived: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const STATUS_LABEL = {
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  archived: 'Arquivado',
};

function subjectStatus(s) {
  if (Array.isArray(s.progress) && s.progress.length > 0) return s.progress[0].status;
  return 'not_started';
}

function CronogramaCard({ uc, onSelect, onDelete, deleting }) {
  const subjects = uc.disciplines?.flatMap((d) => d.subjects) || [];
  const completed = subjects.filter((s) => subjectStatus(s) === 'completed').length;
  const pct = subjects.length > 0 ? Math.round((completed / subjects.length) * 100) : 0;

  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-[#2f456d]/40 hover:shadow-md transition-all group space-y-3">
      <button
        type="button"
        onClick={() => onSelect(uc)}
        className="w-full text-left space-y-3"
      >
        <div className="flex items-start justify-between gap-2 pr-8">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-[#2f456d] dark:group-hover:text-blue-400 transition-colors">
              {uc.title}
            </h3>
            {uc.contest && <p className="text-xs text-[#f26836] font-medium mt-0.5">{uc.contest}</p>}
          </div>
          <Badge className={`text-xs shrink-0 ${STATUS_COLOR[uc.status] || STATUS_COLOR.active}`}>
            {STATUS_LABEL[uc.status] || uc.status}
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{pct}% concluído</span>
            <span>{completed}/{subjects.length} assuntos</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2f456d] to-[#f26836] rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{uc.disciplines?.length || 0} disciplinas</span>
          {uc.streak > 0 && <span>{uc.streak} dias seguidos</span>}
          {uc.type === 'official' && <Badge variant="outline" className="text-xs">Oficial</Badge>}
        </div>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={deleting}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(uc);
        }}
        className="absolute top-3 right-3 h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        title="Excluir cronograma"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function Cronogramas() {
  const [selectedUc, setSelectedUc] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const qc = useQueryClient();

  const { data: userCronogramas = [], isLoading } = useQuery({
    queryKey: ['user-cronogramas'],
    queryFn: () => cronogramaService.listMy(),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => cronogramaService.deleteMy(id),
    onSuccess: () => {
      toast.success('Cronograma excluído');
      qc.invalidateQueries({ queryKey: ['user-cronogramas'] });
      setSelectedUc(null);
    },
    onError: (err) => toast.error(err?.message || 'Erro ao excluir'),
  });

  const handleWizardComplete = (newUc) => {
    qc.invalidateQueries({ queryKey: ['user-cronogramas'] });
    setShowWizard(false);
    setSelectedUc(newUc);
  };

  const handleDelete = (uc) => {
    if (!window.confirm(`Excluir "${uc.title}"? Todo o progresso será perdido.`)) return;
    deleteMutation.mutate(uc.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#2f456d] animate-spin" />
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="max-w-4xl mx-auto">
        <CronogramaWizard onComplete={handleWizardComplete} />
      </div>
    );
  }

  if (selectedUc) {
    return (
      <CronogramaDashboard
        uc={selectedUc}
        onBack={() => setSelectedUc(null)}
        onDelete={() => handleDelete(selectedUc)}
      />
    );
  }

  if (userCronogramas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <CronogramaWizard onComplete={handleWizardComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2f456d] dark:text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7" />
            Cronogramas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {userCronogramas.length} cronograma{userCronogramas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setShowWizard(true)}
          className="bg-[#2f456d] hover:bg-[#1a2d4a] text-white gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Cronograma
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {userCronogramas.map((uc) => (
          <CronogramaCard
            key={uc.id}
            uc={uc}
            onSelect={setSelectedUc}
            onDelete={handleDelete}
            deleting={deleteMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

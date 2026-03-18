import React from 'react';
import { Flame, Zap, Star } from 'lucide-react';

export default function StreakCard({ streak }) {
  const getStreakLevel = (days) => {
    if (days >= 30) return { label: 'Lendário', color: 'text-amber-500', bg: 'bg-amber-500/10 dark:bg-amber-500/20' };
    if (days >= 14) return { label: 'Em chamas!', color: 'text-orange-500', bg: 'bg-orange-500/10 dark:bg-orange-500/20' };
    if (days >= 7) return { label: 'Consistente', color: 'text-[#f26836]', bg: 'bg-[#f26836]/10 dark:bg-[#f26836]/20' };
    if (days >= 3) return { label: 'Bom ritmo', color: 'text-blue-500', bg: 'bg-blue-500/10 dark:bg-blue-500/20' };
    return { label: 'Iniciando', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
  };

  const level = getStreakLevel(streak || 0);

  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all rounded-xl">
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-gradient-to-b from-[#f26836] to-amber-500" />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sequência</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {streak || 0} {(streak || 0) === 1 ? 'dia' : 'dias'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">consecutivos</p>
          </div>
          <div className={`p-2.5 rounded-xl ${level.bg}`}>
            <Flame className={`w-5 h-5 ${level.color} ${(streak || 0) >= 7 ? 'animate-pulse' : ''}`} />
          </div>
        </div>
        <div className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${level.bg} ${level.color}`}>
          {(streak || 0) >= 7 ? <Zap className="w-3 h-3" /> : <Star className="w-3 h-3" />}
          {level.label}
        </div>
      </div>
    </div>
  );
}

export function StreakBanner({ streak }) {
  return <StreakCard streak={streak} />;
}


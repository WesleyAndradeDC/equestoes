import React from 'react';
import { Flame, TrendingUp, Calendar } from 'lucide-react';

export default function StreakBanner({ streak, className = '' }) {
  if (!streak || streak === 0) return null;

  return (
    <div className={`bg-gradient-to-r from-[#8F39D8] to-[#5B2C8E] text-white py-3 px-4 shadow-md ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className="w-7 h-7 text-yellow-300 animate-pulse" />
            <div className="absolute inset-0 bg-yellow-300/20 blur-lg rounded-full" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">Sequência de Estudos</p>
            <p className="text-xl font-bold flex items-baseline gap-1">
              {streak} {streak === 1 ? 'dia' : 'dias'}
              <span className="text-xs font-normal text-white/70 ml-1">consecutivos</span>
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <span className="text-white/90">Continue assim!</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-300" />
            <span className="text-white/90">Estude hoje para manter</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
          <span className="text-2xl">🔥</span>
          <span className="text-sm font-semibold hidden sm:inline">Em chamas!</span>
        </div>
      </div>
    </div>
  );
}


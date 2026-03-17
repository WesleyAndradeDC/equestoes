import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Crown, TrendingUp, User, Loader2 } from 'lucide-react';

const DISCIPLINES = [
  'Todas as Disciplinas',
  'Língua Portuguesa',
  'Matemática e Raciocínio Lógico',
  'Informática',
  'Direito Constitucional',
  'Direito Administrativo',
  'Atualidades',
  'Ética no Serviço Público',
  'Direito Penal',
  'Direito Processual Penal',
  'Direitos Humanos',
  'Administração Pública',
  'Administração Financeira e Orçamentária',
  'Contabilidade',
  'Arquivologia',
  'Matemática Financeira',
  'Conhecimentos Bancários',
  'Legislação Especial',
];

const CATEGORY_LABELS = {
  'Aluno Eleva': 'Aluno Eleva',
  Professor:     'Global',
};

export default function Ranking() {
  const { user: currentUser } = useAuth();
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas as Disciplinas');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: ranking = [], isLoading, isError } = useQuery({
    queryKey: ['ranking', selectedDiscipline, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDiscipline !== 'Todas as Disciplinas') params.append('discipline', selectedDiscipline);
      if (dateFilter !== 'all') params.append('date_filter', dateFilter);
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`${API_ENDPOINTS.RANKING}${query}`);
    },
    staleTime: 60 * 1000,
  });

  const currentUserEntry = ranking.find((r) => r.isCurrentUser);
  const currentUserRank = currentUserEntry?.position ?? 0;
  const rankingTitle = CATEGORY_LABELS[currentUser?.subscription_type] ?? 'Global';

  const getRankIcon = (position) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankBadgeClass = (position) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (position === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2f456d] to-[#1a2d4a] flex items-center justify-center shadow-lg">
            <Trophy className="w-7 h-7 text-[#f26836]" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2f456d] dark:text-white">
              Ranking
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{rankingTitle}</p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          {currentUser?.subscription_type
            ? `Veja sua posição entre os alunos ${rankingTitle}`
            : 'Compete com outros candidatos e veja sua posição'}
        </p>
      </div>

      {/* Card de posição do usuário logado */}
      {currentUserRank > 0 && (
        <Card className="bg-gradient-to-br from-[#2f456d] to-[#1a2d4a] text-white shadow-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-200">Sua Posição</p>
                  <h3 className="text-3xl font-bold">#{currentUserRank}</h3>
                  <p className="text-sm text-blue-200 mt-1">
                    {currentUserEntry?.score ?? 0} pontos •{' '}
                    {currentUserEntry?.accuracy ?? 0}% de acerto
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                {getRankIcon(currentUserRank) ?? (
                  <div className="w-12 h-12 rounded-full bg-[#f26836]/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#f26836]" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
            <TrendingUp className="w-5 h-5 text-[#f26836]" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Período</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-700 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Disciplina</Label>
            <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
              <SelectTrigger className="bg-white dark:bg-slate-700 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISCIPLINES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista do Ranking */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <Trophy className="w-5 h-5 text-[#f26836]" />
            Top Candidatos
            <div className="flex flex-wrap gap-2 ml-2">
              {selectedDiscipline !== 'Todas as Disciplinas' && (
                <Badge variant="outline" className="border-[#2f456d]/30 text-[#2f456d]">
                  {selectedDiscipline}
                </Badge>
              )}
              {dateFilter !== 'all' && (
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  {dateFilter === 'today' && 'Hoje'}
                  {dateFilter === 'week' && 'Última semana'}
                  {dateFilter === 'month' && 'Último mês'}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#2f456d]" />
              <span>Carregando ranking…</span>
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Não foi possível carregar o ranking</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Verifique sua conexão e tente novamente.</p>
            </div>
          )}

          {!isLoading && !isError && ranking.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível ainda</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Seja o primeiro a resolver questões e entrar no ranking!
              </p>
            </div>
          )}

          {!isLoading && !isError && ranking.length > 0 && (
            <div className="space-y-3">
              {ranking.slice(0, 50).map((entry) => {
                const position = entry.position;
                const isMe = entry.isCurrentUser;
                const initial = (entry.name || 'U').charAt(0).toUpperCase();

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isMe
                        ? 'bg-[#2f456d]/5 dark:bg-[#2f456d]/20 border-[#2f456d]/40 dark:border-[#2f456d]/60 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-[#2f456d]/30 dark:hover:border-[#2f456d]/40'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Posição */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(position) || (
                          <span
                            className={`text-lg font-bold ${
                              isMe ? 'text-[#2f456d] dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            #{position}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeClass(position)}`}
                      >
                        {initial}
                      </div>

                      {/* Nome e stats */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-semibold truncate ${
                            isMe ? 'text-[#2f456d] dark:text-blue-200' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {entry.name}
                          {isMe && (
                            <Badge className="ml-2 bg-[#2f456d] text-white text-xs">Você</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {entry.correctAnswers} corretas • {entry.accuracy}% de acerto
                        </p>
                      </div>

                      {/* Pontuação */}
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-[#2f456d] dark:text-white">{entry.score}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">pontos</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Como funciona */}
      <Card className="bg-[#2f456d]/5 dark:bg-[#2f456d]/20 border-[#2f456d]/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-[#f26836] mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-[#2f456d] dark:text-blue-200 mb-2">Como funciona o ranking?</h4>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li>• Cada questão correta vale 1 ponto</li>
                <li>• O ranking exibe apenas alunos da sua categoria ({rankingTitle})</li>
                <li>• Você pode filtrar por disciplina e período</li>
                <li>• Questões incorretas não descontam pontos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

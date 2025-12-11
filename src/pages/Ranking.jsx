import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Crown, TrendingUp, User } from 'lucide-react';

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
  'Legislação Especial'
];

// Helper function to safely convert to number
const safeNumber = (value) => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? 0 : num;
};

export default function Ranking() {
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas as Disciplinas');
  const [selectedSubject, setSelectedSubject] = useState('Todos os Assuntos');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['all-attempts'],
    queryFn: async () => {
      console.log('🏆 Ranking: Buscando tentativas...');
      const result = await base44.entities.Attempt.list('-created_date', 10000);
      console.log('✅ Ranking: Tentativas recebidas:', result?.length);
      return result || [];
    },
    staleTime: 0,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      console.log('🏆 Ranking: Buscando questões...');
      const result = await base44.entities.Question.list();
      console.log('✅ Ranking: Questões recebidas:', result?.length);
      return result || [];
    },
    staleTime: 0,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      console.log('🏆 Ranking: Buscando usuários...');
      const result = await base44.entities.User.list();
      console.log('✅ Ranking: Usuários recebidos:', result?.length);
      return result || [];
    },
    staleTime: 0,
  });

  // Get all unique subjects
  const availableSubjects = React.useMemo(() => {
    const subjects = new Set(['Todos os Assuntos']);
    questions.forEach(q => {
      if (q.subjects && Array.isArray(q.subjects)) {
        q.subjects.forEach(s => subjects.add(s));
      }
    });
    return Array.from(subjects);
  }, [questions]);

  // Calculate date range for filter
  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      return startOfDay;
    } else if (dateFilter === 'week') {
      const startOfWeek = new Date(now.setDate(now.getDate() - 7));
      return startOfWeek;
    } else if (dateFilter === 'month') {
      const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));
      return startOfMonth;
    }
    return null;
  };

  // Calculate rankings
  const calculateRanking = () => {
    const userScores = {};
    const dateThreshold = getDateRange();

    attempts.forEach(attempt => {
      if (!attempt.is_correct) return;

      // Date filter
      if (dateThreshold && new Date(attempt.created_date) < dateThreshold) {
        return;
      }

      const question = questions.find(q => q.id === attempt.question_id);
      if (!question) return;

      // Filter by discipline if selected
      if (selectedDiscipline !== 'Todas as Disciplinas' && question.discipline !== selectedDiscipline) {
        return;
      }

      // Filter by subject if selected
      if (selectedSubject !== 'Todos os Assuntos') {
        if (!question.subjects || !question.subjects.includes(selectedSubject)) {
          return;
        }
      }

      const userEmail = attempt.created_by;
      if (!userScores[userEmail]) {
        userScores[userEmail] = {
          email: userEmail,
          score: 0,
          correctAnswers: 0,
          totalAttempts: 0,
        };
      }

      userScores[userEmail].score += 1;
      userScores[userEmail].correctAnswers += 1;
    });

    // Add total attempts
    attempts.forEach(attempt => {
      // Date filter
      if (dateThreshold && new Date(attempt.created_date) < dateThreshold) {
        return;
      }

      const question = questions.find(q => q.id === attempt.question_id);
      if (!question) return;

      if (selectedDiscipline !== 'Todas as Disciplinas' && question.discipline !== selectedDiscipline) {
        return;
      }

      if (selectedSubject !== 'Todos os Assuntos') {
        if (!question.subjects || !question.subjects.includes(selectedSubject)) {
          return;
        }
      }

      const userEmail = attempt.created_by;
      if (userScores[userEmail]) {
        userScores[userEmail].totalAttempts += 1;
      }
    });

    // Add user details and calculate accuracy
    const ranking = Object.values(userScores).map(userScore => {
      const user = users.find(u => u.email === userScore.email);
      const totalAttempts = safeNumber(userScore.totalAttempts);
      const correctAnswers = safeNumber(userScore.correctAnswers);
      const accuracy = totalAttempts > 0 
        ? safeNumber(((correctAnswers / totalAttempts) * 100).toFixed(1))
        : 0;
      
      return {
        ...userScore,
        name: user?.full_name || 'Usuário',
        accuracy: accuracy,
        score: safeNumber(userScore.score),
        correctAnswers: correctAnswers,
        totalAttempts: totalAttempts,
      };
    });

    // Sort by score (descending)
    ranking.sort((a, b) => {
      const scoreA = safeNumber(a.score);
      const scoreB = safeNumber(b.score);
      return scoreB - scoreA;
    });

    return ranking;
  };

  const ranking = calculateRanking();
  const currentUserRank = ranking.findIndex(r => r.email === currentUser?.email) + 1;
  const currentUserData = ranking.find(r => r.email === currentUser?.email);

  const getRankIcon = (position) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankBadge = (position) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (position === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-10 h-10 text-purple-600 dark:text-white" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
            Ranking Global
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Compete com outros candidatos e veja sua posição
        </p>
      </div>

      {/* Current User Stats */}
      {currentUserRank > 0 && (
        <Card className="bg-gradient-to-br from-purple-600 to-gray-900 text-white shadow-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-purple-200">Sua Posição</p>
                  <h3 className="text-3xl font-bold">#{currentUserRank}</h3>
                  <p className="text-sm text-purple-200 mt-1">
                   {safeNumber(currentUserData?.score)} pontos • {safeNumber(currentUserData?.accuracy)}% de acerto
                  </p>
                </div>
              </div>
              {getRankIcon(currentUserRank) && (
                <div className="hidden sm:block">
                  {getRankIcon(currentUserRank)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-white" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                {DISCIPLINES.map((discipline) => (
                  <SelectItem key={discipline} value={discipline}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Assunto</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="bg-white dark:bg-slate-700 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ranking List */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <Trophy className="w-5 h-5 text-purple-600 dark:text-white" />
            Top Candidatos
            <div className="flex flex-wrap gap-2 ml-2">
              {selectedDiscipline !== 'Todas as Disciplinas' && (
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  {selectedDiscipline}
                </Badge>
              )}
              {selectedSubject !== 'Todos os Assuntos' && (
                <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                  {selectedSubject}
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
          {ranking.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível ainda</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Seja o primeiro a resolver questões e entrar no ranking!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.slice(0, 50).map((user, index) => {
                const position = index + 1;
                const isCurrentUser = user.email === currentUser?.email;

                return (
                  <div
                    key={user.email}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      isCurrentUser
                        ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-600'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Position */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(position) || (
                          <span className={`text-lg font-bold ${
                            isCurrentUser ? 'text-purple-700 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            #{position}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        getRankBadge(position)
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          isCurrentUser ? 'text-purple-900 dark:text-purple-200' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {user.name}
                          {isCurrentUser && (
                            <Badge className="ml-2 bg-purple-600 text-white">Você</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {safeNumber(user.correctAnswers)} questões corretas • {safeNumber(user.accuracy)}% de acerto
                        </p>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-700 dark:text-white">
                          {safeNumber(user.score)}
                        </p>
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

      {/* Info Card */}
      <Card className="bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-purple-600 dark:text-white mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">Como funciona o ranking?</h4>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li>• Cada questão correta vale 1 ponto</li>
                <li>• O ranking é atualizado em tempo real</li>
                <li>• Você pode filtrar por disciplina para ver os melhores de cada área</li>
                <li>• Questões incorretas não descontam pontos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
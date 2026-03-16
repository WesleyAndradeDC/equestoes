import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QuestionCard from '../components/questions/QuestionCard';
import FilterPanel from '../components/questions/FilterPanel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, BookmarkPlus, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Questions() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    difficulty: null,
    status: null,
    discipline: null,
    subject: null,
    question_type: null,
  });
  const [user, setUser] = useState(null);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [selectedNotebook, setSelectedNotebook] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const questionsPerPage = 10;

  const queryClient = useQueryClient();

  // Get notebook ID from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const notebookId = urlParams.get('notebook');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Check user subscription type
  const isRestrictedUser = user?.subscription_type === 'Aluno Clube do Pedrão';

  const { data: questions = [], isLoading: questionsLoading, error: questionsError } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      console.log('🔍 Buscando questões...');
      try {
        const result = await base44.entities.Question.list();
        console.log('✅ Questões recebidas:', result?.length);
        console.log('📊 Primeira questão:', result?.[0]);
        return result || [];
      } catch (error) {
        console.error('❌ Erro ao buscar questões:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 0,
  });

  const { data: questionFilters = { disciplines: [], subjects: [], subjectsByDiscipline: {} } } = useQuery({
    queryKey: ['questionFilters'],
    queryFn: () => base44.entities.Question.getFilters(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allAttempts = [] } = useQuery({
    queryKey: ['attempts'],
    queryFn: () => base44.entities.Attempt.list('-created_date', 1000),
    initialData: [],
  });

  // FILTRAR APENAS TENTATIVAS DO USUÁRIO LOGADO
  const attempts = React.useMemo(() => {
    if (!user?.id) return [];
    const filtered = allAttempts.filter(attempt => attempt.user_id === user.id);
    console.log('🔒 Questions: Tentativas filtradas para o usuário:', filtered.length);
    return filtered;
  }, [allAttempts, user?.id]);

  const { data: notebooks = [] } = useQuery({
    queryKey: ['notebooks'],
    queryFn: () => base44.entities.Notebook.filter({ created_by: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  // Get the current notebook if filtering by notebook
  const currentNotebook = notebookId ? notebooks.find(n => n.id === notebookId) : null;

  const createNotebookMutation = useMutation({
    mutationFn: (data) => base44.entities.Notebook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Caderno criado com sucesso!');
      setNewNotebookName('');
    },
  });

  const updateNotebookMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notebook.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Questão salva no caderno!');
      setShowSaveDialog(false);
    },
  });

  // Disciplinas, assuntos e agrupamento vindos diretamente do banco de dados
  const availableDisciplines = questionFilters.disciplines;
  const availableSubjects = questionFilters.subjects;
  const subjectsByDiscipline = questionFilters.subjectsByDiscipline;

  // Get user's attempts for status filter
  const userAttempts = React.useMemo(() => {
    if (!user) return [];
    return attempts.filter(a => a.created_by === user.email);
  }, [attempts, user]);

  // Filter questions
  const filteredQuestions = questions.filter(question => {
    // Notebook filter - if viewing a specific notebook, only show its questions
    if (currentNotebook) {
      if (!currentNotebook.question_ids?.includes(question.id)) {
        return false;
      }
    }

    // Restriction by subscription type
    if (isRestrictedUser && question.discipline !== 'Português') {
      return false;
    }

    // Difficulty filter
    if (filters.difficulty && question.difficulty !== filters.difficulty) {
      return false;
    }

    // Discipline filter
    if (filters.discipline && question.discipline !== filters.discipline) {
      return false;
    }

    // Subject filter
    if (filters.subject) {
      if (!question.subjects || !question.subjects.includes(filters.subject)) {
        return false;
      }
    }

    // Question type filter
    if (filters.question_type && question.question_type !== filters.question_type) {
      return false;
    }

    // Status filter - uses only current user's attempts
    if (filters.status) {
      const questionAttempts = userAttempts.filter(a => a.question_id === question.id);
      
      if (filters.status === 'not_answered') {
        if (questionAttempts.length > 0) {
          return false;
        }
      }
      if (filters.status === 'correct') {
        if (!questionAttempts.some(a => a.is_correct)) {
          return false;
        }
      }
      if (filters.status === 'incorrect') {
        if (questionAttempts.length === 0) {
          return false;
        }
        const hasCorrect = questionAttempts.some(a => a.is_correct);
        if (hasCorrect) {
          return false;
        }
      }
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      difficulty: null,
      status: null,
      discipline: null,
      subject: null,
      question_type: null,
    });
    setCurrentPage(1);
  };

  const [savingQuestionId, setSavingQuestionId] = useState(null);

  const handleSaveToNotebook = async (questionId) => {
    setSavingQuestionId(questionId);

    if (newNotebookName) {
      // Create new notebook
      const notebook = await createNotebookMutation.mutateAsync({
        name: newNotebookName,
        question_ids: [questionId],
        color: 'blue',
      });
      setSelectedNotebook(notebook.id);
    } else if (selectedNotebook) {
      // Add to existing notebook
      const notebook = notebooks.find(n => n.id === selectedNotebook);
      if (notebook) {
        const updatedIds = [...(notebook.question_ids || []), questionId];
        await updateNotebookMutation.mutateAsync({
          id: notebook.id,
          data: { question_ids: updatedIds },
        });
      }
    }
    
    setSavingQuestionId(null);
  };

  const isQuestionSaved = (questionId) => {
    return notebooks.some(n => n.question_ids?.includes(questionId));
  };

  // Debug: mostrar erros no console
  React.useEffect(() => {
    if (questionsError) {
      console.error('🔴 Erro nas questões:', questionsError);
      toast.error(`Erro ao carregar questões: ${questionsError.message}`);
    }
  }, [questionsError]);

  React.useEffect(() => {
    console.log('📊 Estado atual das questões:', {
      total: questions?.length,
      loading: questionsLoading,
      hasError: !!questionsError,
      firstQuestion: questions?.[0]?.id
    });
  }, [questions, questionsLoading, questionsError]);

  if (questionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="ml-3 text-slate-600">Carregando questões...</p>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Erro ao carregar questões
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {questionsError.message}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
          {currentNotebook ? `Caderno: ${currentNotebook.name}` : 'Resolver Questões'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {filteredQuestions.length} questões disponíveis
        </p>
        {isRestrictedUser && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/30 px-4 py-2 rounded-lg inline-block">
            🔒 Plano Clube do Pedrão: Acesso apenas a questões de Português
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={handleClearFilters}
            availableDisciplines={availableDisciplines}
            availableSubjects={availableSubjects}
            subjectsByDiscipline={subjectsByDiscipline}
          />
        </div>

        {/* Question Display */}
        <div className="lg:col-span-3 space-y-6">
          {filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Nenhuma questão encontrada</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Tente ajustar os filtros ou limpe-os para ver mais questões
                </p>
              </div>
              <Button onClick={handleClearFilters} variant="outline">
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <>
              {/* Questions List */}
              <div className="space-y-6">
                {currentQuestions.map((question, index) => (
                  <div key={question.id}>
                    <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Questão {startIndex + index + 1} de {filteredQuestions.length}
                    </div>
                    <QuestionCard
                      question={question}
                      savedInNotebook={isQuestionSaved(question.id)}
                      previouslyAnswered={userAttempts.find(a => a.question_id === question.id)}
                      onSaveToggle={() => {
                        setSavingQuestionId(question.id);
                        setShowSaveDialog(true);
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            className={`w-10 h-10 ${
                              currentPage === pageNum
                                ? 'bg-purple-600 hover:bg-purple-700 text-white hover:text-white'
                                : ''
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return <span key={pageNum} className="text-slate-400 dark:text-slate-500">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="gap-2"
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Save to Notebook Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="w-5 h-5 text-purple-600 dark:text-white" />
              Salvar Questão em Caderno
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Caderno Existente</Label>
              <Select value={selectedNotebook} onValueChange={setSelectedNotebook}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um caderno" />
                </SelectTrigger>
                <SelectContent>
                  {notebooks.map(notebook => (
                    <SelectItem key={notebook.id} value={notebook.id}>
                      {notebook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">Ou</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Criar Novo Caderno</Label>
              <Input
                placeholder="Nome do novo caderno"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
              />
            </div>

            <Button
              onClick={() => handleSaveToNotebook(savingQuestionId)}
              disabled={!selectedNotebook && !newNotebookName}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
            >
              Salvar Questão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
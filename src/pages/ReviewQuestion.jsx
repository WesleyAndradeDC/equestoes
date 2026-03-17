import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Save, Loader2, AlertCircle, CheckCircle2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

const DISCIPLINES = [
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
'Legislação Especial'];


export default function ReviewQuestion() {
  const [user, setUser] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      window.location.href = '/';
    });
  }, []);

  const { data: questions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: () => base44.entities.Question.list(),
    initialData: []
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Question.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Questão atualizada com sucesso!');
      setSelectedQuestion(null);
      setEditedQuestion(null);
      setSearchCode('');
    },
    onError: () => {
      toast.error('Erro ao atualizar questão');
    }
  });

  // Check if user has permission
  const hasPermission = user?.role === 'admin' || user?.subscription_type === 'Professor';

  const handleSearch = () => {
    if (!searchCode.trim()) {
      toast.error('Digite o código da questão');
      return;
    }

    setIsSearching(true);
    const found = questions.find((q) =>
    q.code?.toLowerCase() === searchCode.trim().toLowerCase()
    );

    if (found) {
      setSelectedQuestion(found);
      setEditedQuestion({ ...found });
    } else {
      toast.error('Questão não encontrada');
      setSelectedQuestion(null);
      setEditedQuestion(null);
    }
    setIsSearching(false);
  };

  const handleSave = () => {
    if (!editedQuestion) return;

    updateQuestionMutation.mutate({
      id: selectedQuestion.id,
      data: {
        text: editedQuestion.text,
        option_a: editedQuestion.option_a,
        option_b: editedQuestion.option_b,
        option_c: editedQuestion.option_c,
        option_d: editedQuestion.option_d,
        option_e: editedQuestion.option_e,
        correct_answer: editedQuestion.correct_answer,
        explanation: editedQuestion.explanation,
        discipline: editedQuestion.discipline,
        difficulty: editedQuestion.difficulty
      }
    });
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Acesso Restrito</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Apenas administradores e professores podem acessar este módulo.
        </p>
      </div>);

  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Edit3 className="text-slate-50 lucide lucide-pen-line w-10 h-10" />
          <h1 className="bg-clip-text text-slate-50 text-3xl font-bold md:text-4xl from-[#2f456d] to-[#1a2d4a]">Revisão de Questões

          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Pesquise pelo código da questão para editar
        </p>
      </div>

      {/* Search Card */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-slate-100">
            <Search className="w-5 h-5 text-[#2f456d]" />
            Buscar Questão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Digite o código da questão (ex: LP001)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 dark:bg-slate-700 dark:border-slate-600" />

            <Button
              onClick={handleSearch}
              disabled={isSearching} className="bg-slate-950 text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow h-9 hover:bg-[#2f456d]">


              {isSearching ?
              <Loader2 className="w-4 h-4 animate-spin" /> :

              <Search className="w-4 h-4" />
              }
              <span className="ml-2">Buscar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {editedQuestion &&
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 dark:text-slate-100">
                <Edit3 className="w-5 h-5 text-[#2f456d]" />
                Editar Questão
              </CardTitle>
              <Badge className="bg-[#2f456d] text-[#2f456d] dark:bg-[#2f456d]/50 dark:text-[#2f456d]">
                #{editedQuestion.code}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Discipline & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Disciplina</Label>
                <Select
                value={editedQuestion.discipline}
                onValueChange={(value) => setEditedQuestion({ ...editedQuestion, discipline: value })}>

                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((d) =>
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                  )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Dificuldade</Label>
                <Select
                value={editedQuestion.difficulty}
                onValueChange={(value) => setEditedQuestion({ ...editedQuestion, difficulty: value })}>

                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fácil">Fácil</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Enunciado da Questão</Label>
              <Textarea
              value={editedQuestion.text}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
              className="min-h-[120px] dark:bg-slate-700 dark:border-slate-600" />

            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label className="dark:text-slate-300">Alternativas</Label>
              {['A', 'B', 'C', 'D', 'E'].map((letter) =>
            <div key={letter} className="flex items-start gap-3">
                  <span className={`font-bold text-lg mt-2 w-6 ${
              editedQuestion.correct_answer === letter ?
              'text-green-600' :
              'text-slate-500 dark:text-slate-400'}`
              }>
                    {letter})
                  </span>
                  <Textarea
                value={editedQuestion[`option_${letter.toLowerCase()}`]}
                onChange={(e) => setEditedQuestion({
                  ...editedQuestion,
                  [`option_${letter.toLowerCase()}`]: e.target.value
                })}
                className="flex-1 min-h-[60px] dark:bg-slate-700 dark:border-slate-600" />

                </div>
            )}
            </div>

            {/* Correct Answer */}
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Gabarito (Resposta Correta)</Label>
              <Select
              value={editedQuestion.correct_answer}
              onValueChange={(value) => setEditedQuestion({ ...editedQuestion, correct_answer: value })}>

                <SelectTrigger className="w-32 dark:bg-slate-700 dark:border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D', 'E'].map((letter) =>
                <SelectItem key={letter} value={letter}>
                      Alternativa {letter}
                    </SelectItem>
                )}
                </SelectContent>
              </Select>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Explicação do Gabarito</Label>
              <Textarea
              value={editedQuestion.explanation}
              onChange={(e) => setEditedQuestion({ ...editedQuestion, explanation: e.target.value })}
              className="min-h-[100px] dark:bg-slate-700 dark:border-slate-600" />

            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
              onClick={handleSave}
              disabled={updateQuestionMutation.isPending}
              className="bg-green-600 hover:bg-green-700">

                {updateQuestionMutation.isPending ?
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> :

              <Save className="w-4 h-4 mr-2" />
              }
                Salvar Alterações
              </Button>
              <Button
              variant="outline"
              onClick={() => {
                setSelectedQuestion(null);
                setEditedQuestion(null);
                setSearchCode('');
              }}>

                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

}
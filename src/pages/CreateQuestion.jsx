import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, AlertCircle } from 'lucide-react';
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


export default function CreateQuestion() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    discipline: '',
    difficulty: 'Médio',
    exam_board: '',
    year: '',
    position: '',
    question_type: 'Múltipla Escolha',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_answer: 'A',
    explanation: ''
  });

  const isCertoErrado = formData.question_type === 'Certo ou Errado';

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then((user) => {
      const isProfessor = user.subscription_type === 'Professor' || user.role === 'admin';
      if (!isProfessor) {
        window.location.href = '/';
      }
      setUser(user);
    }).catch(() => {
      window.location.href = '/';
    });
  }, []);

  const createQuestionMutation = useMutation({
    mutationFn: (data) => base44.entities.Question.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Questão criada com sucesso!');
      setFormData({
        text: '',
        discipline: '',
        difficulty: 'Médio',
        exam_board: '',
        year: '',
        position: '',
        question_type: 'Múltipla Escolha',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        option_e: '',
        correct_answer: 'A',
        explanation: ''
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar questão');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const certoErrado = formData.question_type === 'Certo ou Errado';
    const baseOk = formData.text && formData.discipline && formData.option_a && formData.option_b && formData.explanation;
    const multipleOk = certoErrado || (formData.option_c && formData.option_d && formData.option_e);

    if (!baseOk || !multipleOk) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createQuestionMutation.mutate({
      ...formData,
      // Para Certo/Errado, garantir que as opções extras ficam vazias
      option_c: certoErrado ? undefined : formData.option_c,
      option_d: certoErrado ? undefined : formData.option_d,
      option_e: certoErrado ? undefined : formData.option_e,
      year: formData.year ? Number(formData.year) : undefined
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Ao trocar o tipo de questão, adaptar campos automaticamente
  const handleTypeChange = (value) => {
    if (value === 'Certo ou Errado') {
      setFormData(prev => ({
        ...prev,
        question_type: 'Certo ou Errado',
        option_a: 'Certo',
        option_b: 'Errado',
        option_c: '',
        option_d: '',
        option_e: '',
        correct_answer: 'A', // A = Certo
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        question_type: value,
        option_a: prev.option_a === 'Certo' ? '' : prev.option_a,
        option_b: prev.option_b === 'Errado' ? '' : prev.option_b,
      }));
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#2f456d] to-[#1a2d4a] dark:from-white dark:to-white bg-clip-text text-transparent">
          Criar Nova Questão
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Adicione questões para os alunos praticarem
        </p>
      </div>

      <Card className="bg-white/90 text-card-foreground rounded-none border dark:bg-[#2f456d]/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-[#2f456d]/30">
        <CardHeader className="bg-slate-50 p-6 flex flex-col space-y-1.5">
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Plus className="w-5 h-5 text-[#2f456d] dark:text-white" />
            Informações da Questão
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-slate-50 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <Label>Texto da Questão *</Label>
              <Textarea
                value={formData.text}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Digite o enunciado completo da questão..."
                rows={6}
                className="resize-none" />

            </div>

            {/* Discipline and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Disciplina *</Label>
                <Select value={formData.discipline} onValueChange={(value) => handleChange('discipline', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map((disc) =>
                    <SelectItem key={disc} value={disc}>{disc}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dificuldade *</Label>
                <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
                  <SelectTrigger>
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

            {/* Exam Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Banca</Label>
                <Input
                  value={formData.exam_board}
                  onChange={(e) => handleChange('exam_board', e.target.value)}
                  placeholder="Ex: CESPE, FCC, FGV" />

              </div>

              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  placeholder="2024" />

              </div>

              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="Ex: Analista" />

              </div>
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <Label>Tipo de Questão *</Label>
              <Select value={formData.question_type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Múltipla Escolha">Múltipla Escolha</SelectItem>
                  <SelectItem value="Certo ou Errado">Certo ou Errado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label>Alternativas *</Label>

              {isCertoErrado ? (
                /* Certo ou Errado: apenas A e B, fixados, somente leitura */
                <div className="flex gap-4">
                  <div className="flex-1 flex items-center gap-2 p-3 rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <span className="font-bold text-green-700 dark:text-green-400 w-8">A)</span>
                    <span className="text-green-700 dark:text-green-300 font-medium">Certo</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2 p-3 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <span className="font-bold text-red-700 dark:text-red-400 w-8">B)</span>
                    <span className="text-red-700 dark:text-red-300 font-medium">Errado</span>
                  </div>
                </div>
              ) : (
                /* Múltipla Escolha: A até E */
                ['a', 'b', 'c', 'd', 'e'].map((letter) => (
                  <div key={letter} className="flex gap-2 items-center">
                    <span className="font-bold text-[#2f456d] dark:text-white w-8">{letter.toUpperCase()})</span>
                    <Input
                      value={formData[`option_${letter}`]}
                      onChange={(e) => handleChange(`option_${letter}`, e.target.value)}
                      placeholder={`Digite a alternativa ${letter.toUpperCase()}`}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Correct Answer */}
            <div className="space-y-2">
              <Label>Gabarito *</Label>
              {isCertoErrado ? (
                <Select value={formData.correct_answer} onValueChange={(value) => handleChange('correct_answer', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A — Certo</SelectItem>
                    <SelectItem value="B">B — Errado</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={formData.correct_answer} onValueChange={(value) => handleChange('correct_answer', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label>Explicação *</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => handleChange('explanation', e.target.value)}
                placeholder="Explique por que a alternativa está correta..."
                rows={4}
                className="resize-none" />

            </div>

            <Button
              type="submit" className="bg-[#2f456d] hover:bg-[#243756] text-white shadow h-9 w-full"

              disabled={createQuestionMutation.isPending}>

              <Save className="w-5 h-5 mr-2" />
              {createQuestionMutation.isPending ? 'Salvando...' : 'Criar Questão'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>);

}
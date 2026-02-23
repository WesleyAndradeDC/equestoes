import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck, CheckCircle2, XCircle, Lightbulb, MessageCircle, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CommentSection from './CommentSection';
import ReportModal from './ReportModal';

export default function QuestionCard({ question, onAnswer, savedInNotebook = false, onSaveToggle, previouslyAnswered = null }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Reset state when question changes
  React.useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setShowComments(false);
    setIsSubmitting(false);
    setShowReportModal(false);
  }, [question.id]);

  const options = [
    { letter: 'A', text: question.option_a },
    { letter: 'B', text: question.option_b },
    { letter: 'C', text: question.option_c },
    { letter: 'D', text: question.option_d },
    { letter: 'E', text: question.option_e },
  ];

  const difficultyColors = {
    'Fácil': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    'Médio': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    'Difícil': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || isAnswered) return;

    setIsSubmitting(true);
    const isCorrect = selectedAnswer === question.correct_answer;

    try {
      await base44.entities.Attempt.create({
        question_id: question.id,
        chosen_answer: selectedAnswer,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
      });

      setIsAnswered(true);
      setShowExplanation(true);

      if (onAnswer) {
        onAnswer(isCorrect);
      }

      if (isCorrect) {
        toast.success('Resposta correta! 🎉');
      } else {
        toast.error('Resposta incorreta. Veja a explicação.');
      }
    } catch (error) {
      toast.error('Erro ao registrar resposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOptionStyle = (letter) => {
    if (!isAnswered) {
      return selectedAnswer === letter
        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 shadow-md'
        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-slate-50 dark:hover:bg-slate-800';
    }

    if (letter === question.correct_answer) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/30';
    }

    if (letter === selectedAnswer && letter !== question.correct_answer) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/30';
    }

    return 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60';
  };

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {question.code && (
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                  #{question.code}
                </span>
              )}
              {question.question_type && (
                <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-700 dark:border-indigo-600 dark:text-indigo-300">
                  {question.question_type}
                </Badge>
              )}
              {previouslyAnswered && (
                <Badge className={`text-xs ${previouslyAnswered.is_correct ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>
                  {previouslyAnswered.is_correct ? '✓ Acertou' : '✗ Errou'}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${difficultyColors[question.difficulty]} border font-medium`}>
                {question.difficulty}
              </Badge>
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 font-medium">
                {question.discipline}
              </Badge>
              {question.exam_board && (
                <Badge variant="outline" className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                  {question.exam_board}
                </Badge>
              )}
              {question.year && (
                <Badge variant="outline" className="bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                  {question.year}
                </Badge>
              )}
            </div>
            {question.subjects && question.subjects.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {question.subjects.map((subject, idx) => (
                  <span key={idx} className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {subject}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onSaveToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSaveToggle}
                title={savedInNotebook ? 'Remover do caderno' : 'Salvar no caderno'}
              >
                {savedInNotebook ? (
                  <BookmarkCheck className="w-5 h-5 text-purple-600 fill-purple-600" />
                ) : (
                  <Bookmark className="w-5 h-5 text-slate-400 hover:text-purple-600" />
                )}
              </Button>
            )}

            {/* Botão de reportar questão */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowReportModal(true)}
              title="Reportar problema nesta questão"
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
            {question.text}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {options.map((option) => (
          <button
            key={option.letter}
            onClick={() => !isAnswered && setSelectedAnswer(option.letter)}
            disabled={isAnswered}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getOptionStyle(option.letter)} ${
              !isAnswered ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="font-bold text-purple-700 dark:text-purple-400 shrink-0">{option.letter})</span>
              <span className="text-slate-700 dark:text-slate-200 flex-1">{option.text}</span>
              {isAnswered && option.letter === question.correct_answer && (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              )}
              {isAnswered && option.letter === selectedAnswer && option.letter !== question.correct_answer && (
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
            </div>
          </button>
        ))}
      </CardContent>

      {!isAnswered && (
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white hover:text-white shadow-md"
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar Resposta'}
          </Button>
        </CardFooter>
      )}

      {showExplanation && (
        <CardFooter className="flex-col items-start space-y-3 bg-purple-50/50 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
            <Lightbulb className="w-5 h-5" />
            <h4 className="font-semibold">Comentário do Professor</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {question.explanation}
          </p>
        </CardFooter>
      )}

      {/* Comments Toggle */}
      <CardFooter className="border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="ghost"
          className="w-full text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {showComments ? 'Ocultar Comentários' : 'Ver Comentários'}
          {showComments ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </Button>
      </CardFooter>

      {showComments && (
        <CardFooter className="flex-col items-start border-t border-slate-200 dark:border-slate-700">
          <CommentSection questionId={question.id} canComment={isAnswered} />
        </CardFooter>
      )}

      {/* Modal de report */}
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        question={question}
      />
    </Card>
  );
}
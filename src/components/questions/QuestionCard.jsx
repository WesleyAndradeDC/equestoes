import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck, CheckCircle2, XCircle, Lightbulb, MessageCircle, ChevronDown, ChevronUp, Flag, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CommentSection from './CommentSection';
import ReportModal from './ReportModal';

/* ── Dropdown para assuntos extras ─────────────────────────────────── */
function SubjectsDropdown({ subjects }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!subjects || subjects.length === 0) return null;

  const [first, ...rest] = subjects;

  return (
    <div className="flex items-center gap-1 flex-wrap" ref={ref}>
      {/* Primeiro assunto — sempre visível */}
      <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
        {first}
      </span>

      {/* Botão "+N" só aparece se houver mais assuntos */}
      {rest.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-0.5 text-xs text-white bg-[#2f456d] border border-[#2f456d]/50 px-2 py-1 rounded hover:bg-[#243756] dark:hover:bg-[#3a5480] transition-colors font-medium"
          >
            +{rest.length}
            {open
              ? <ChevronUp className="w-3 h-3" />
              : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Dropdown com os demais assuntos */}
          {open && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
              {rest.map((subject, idx) => (
                <span
                  key={idx}
                  className="block px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  {subject}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  const isCertoErrado = question.question_type === 'Certo ou Errado';

  // Para múltipla escolha, filtra opções que têm texto (null-safe para Certo ou Errado)
  const options = isCertoErrado
    ? [] // tratado separadamente no layout
    : [
        { letter: 'A', text: question.option_a },
        { letter: 'B', text: question.option_b },
        { letter: 'C', text: question.option_c },
        { letter: 'D', text: question.option_d },
        { letter: 'E', text: question.option_e },
      ].filter(opt => opt.text);

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
        ? 'border-[#2f456d] bg-[#2f456d] dark:bg-[#2f456d]/40 shadow-md text-white dark:text-white [&_span]:text-white [&_span]:dark:text-white'
        : 'border-slate-200 dark:border-slate-700 hover:border-[#2f456d]/30 hover:bg-slate-50 dark:hover:bg-slate-800';
    }

    if (letter === question.correct_answer) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/30';
    }

    if (letter === selectedAnswer && letter !== question.correct_answer) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/30';
    }

    return 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60';
  };

  // ── Estilos para os botões Certo/Errado ─────────────────────────────────
  const getCertoErradoStyle = (letter) => {
    const base = 'flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 font-semibold text-base transition-all';

    if (!isAnswered) {
      if (selectedAnswer === letter) {
        return letter === 'A'
          ? `${base} border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-md scale-[1.02]`
          : `${base} border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-md scale-[1.02]`;
      }
      return letter === 'A'
        ? `${base} border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-[1.01] cursor-pointer`
        : `${base} border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-[1.01] cursor-pointer`;
    }

    // Após responder
    if (letter === question.correct_answer) {
      return letter === 'A'
        ? `${base} border-green-500 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300`
        : `${base} border-red-500 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300`;
    }
    if (letter === selectedAnswer) {
      return letter === 'A'
        ? `${base} border-green-300 bg-green-50/60 dark:bg-green-900/20 text-green-600/60 dark:text-green-400/60 opacity-60`
        : `${base} border-red-300 bg-red-50/60 dark:bg-red-900/20 text-red-600/60 dark:text-red-400/60 opacity-60`;
    }
    return letter === 'A'
      ? `${base} border-green-200 dark:border-green-800 text-green-500/50 dark:text-green-400/50 opacity-50`
      : `${base} border-red-200 dark:border-red-800 text-red-500/50 dark:text-red-400/50 opacity-50`;
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
              <Badge variant="outline" className="bg-[#2f456d]/10 dark:bg-[#2f456d]/30 border-[#2f456d]/30 dark:border-[#2f456d]/50 text-[#2f456d] dark:text-blue-300 font-medium">
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
              <SubjectsDropdown subjects={question.subjects} />
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
                  <BookmarkCheck className="w-5 h-5 text-[#2f456d] fill-[#2f456d]" />
                ) : (
                  <Bookmark className="w-5 h-5 text-slate-400 hover:text-[#2f456d]" />
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
          <p
            className="text-base leading-relaxed text-slate-700 dark:text-slate-200"
            dangerouslySetInnerHTML={{ __html: question.text }}
          />
        </div>
      </CardHeader>

      {/* ── Layout: Certo ou Errado ──────────────────────────────────── */}
      {isCertoErrado ? (
        <CardContent>
          <div className="flex gap-4">
            {/* Botão CERTO (A) */}
            <button
              onClick={() => !isAnswered && setSelectedAnswer('A')}
              disabled={isAnswered}
              className={getCertoErradoStyle('A')}
            >
              <Check className="w-7 h-7" strokeWidth={2.5} />
              <span className="text-lg tracking-wide">CERTO</span>
              {isAnswered && 'A' === question.correct_answer && (
                <span className="text-xs font-normal opacity-80">✓ Resposta correta</span>
              )}
              {isAnswered && selectedAnswer === 'A' && 'A' !== question.correct_answer && (
                <span className="text-xs font-normal opacity-80">✗ Sua resposta</span>
              )}
            </button>

            {/* Botão ERRADO (B) */}
            <button
              onClick={() => !isAnswered && setSelectedAnswer('B')}
              disabled={isAnswered}
              className={getCertoErradoStyle('B')}
            >
              <X className="w-7 h-7" strokeWidth={2.5} />
              <span className="text-lg tracking-wide">ERRADO</span>
              {isAnswered && 'B' === question.correct_answer && (
                <span className="text-xs font-normal opacity-80">✓ Resposta correta</span>
              )}
              {isAnswered && selectedAnswer === 'B' && 'B' !== question.correct_answer && (
                <span className="text-xs font-normal opacity-80">✗ Sua resposta</span>
              )}
            </button>
          </div>

          {/* Resultado visual após responder */}
          {isAnswered && (
            <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
              selectedAnswer === question.correct_answer
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {selectedAnswer === question.correct_answer
                ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Você acertou! A afirmativa está {question.correct_answer === 'A' ? 'CERTA' : 'ERRADA'}.</>
                : <><XCircle className="w-4 h-4 shrink-0" /> Você errou. A afirmativa está {question.correct_answer === 'A' ? 'CERTA' : 'ERRADA'}.</>
              }
            </div>
          )}
        </CardContent>
      ) : (
        /* ── Layout: Múltipla Escolha ──────────────────────────────── */
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
                <span className="font-bold text-[#2f456d] dark:text-blue-300 shrink-0">{option.letter})</span>
                <span
                  className="text-slate-700 dark:text-slate-200 flex-1"
                  dangerouslySetInnerHTML={{ __html: option.text }}
                />
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
      )}

      {!isAnswered && (
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full bg-gradient-to-r from-[#2f456d] to-[#1a2d4a] hover:from-[#2f456d] hover:to-[#1a2d4a] text-white hover:text-white shadow-md"
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar Resposta'}
          </Button>
        </CardFooter>
      )}

      {showExplanation && (
        <CardFooter className="flex-col items-start space-y-3 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Lightbulb className="w-5 h-5" />
            <h4 className="font-semibold">Comentário do Professor</h4>
          </div>
          <p
            className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: question.explanation }}
          />
        </CardFooter>
      )}

      {/* Comments Toggle */}
      <CardFooter className="border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="ghost"
          className="w-full text-slate-600 dark:text-slate-300 hover:text-[#2f456d] dark:hover:text-[#2f456d]"
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
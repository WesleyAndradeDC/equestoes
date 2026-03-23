import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bookmark, BookmarkCheck, CheckCircle2, XCircle, Lightbulb,
  MessageCircle, ChevronDown, ChevronUp, Flag, Check, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CommentSection from './CommentSection';
import ReportModal from './ReportModal';

/* ── Dropdown assuntos extras ─────────────────────────────────────────── */
function SubjectsDropdown({ subjects }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!subjects?.length) return null;
  const [first, ...rest] = subjects;

  return (
    <div className="flex items-center gap-1.5 flex-wrap" ref={ref}>
      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
        {first}
      </span>
      {rest.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-0.5 text-xs text-white bg-[#2f456d] px-2 py-0.5 rounded-full hover:bg-[#243756] transition-colors font-medium"
          >
            +{rest.length} {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-[180px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1">
              {rest.map((s, i) => (
                <span key={i} className="block px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Chip de dificuldade ──────────────────────────────────────────────── */
const DIFFICULTY_STYLE = {
  'Fácil':   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Médio':   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Difícil': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

/* ── Componente principal ─────────────────────────────────────────────── */
export default function QuestionCard({
  question,
  onAnswer,
  savedInNotebook = false,
  onSaveToggle,
  previouslyAnswered = null,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setShowComments(false);
    setIsSubmitting(false);
    setShowReportModal(false);
  }, [question.id]);

  const isCertoErrado = question.question_type === 'Certo ou Errado';

  const options = isCertoErrado ? [] : [
    { letter: 'A', text: question.option_a },
    { letter: 'B', text: question.option_b },
    { letter: 'C', text: question.option_c },
    { letter: 'D', text: question.option_d },
    { letter: 'E', text: question.option_e },
  ].filter(o => o.text);

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
      onAnswer?.(isCorrect);
      if (isCorrect) toast.success('Resposta correta!');
      else toast.error('Resposta incorreta. Veja a explicação abaixo.');
    } catch {
      toast.error('Erro ao registrar resposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── estilos de opção (múltipla escolha) ────────────────────────────── */
  const optionStyle = (letter) => {
    const base = 'w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all text-sm';
    if (!isAnswered) {
      return selectedAnswer === letter
        ? `${base} border-[#2f456d] bg-[#2f456d]/8 dark:bg-[#2f456d]/20 cursor-pointer`
        : `${base} border-slate-200 dark:border-slate-700 hover:border-[#2f456d]/40 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer`;
    }
    if (letter === question.correct_answer)
      return `${base} border-emerald-500 bg-emerald-50 dark:bg-emerald-900/25 cursor-default`;
    if (letter === selectedAnswer)
      return `${base} border-red-400 bg-red-50 dark:bg-red-900/25 cursor-default`;
    return `${base} border-slate-200 dark:border-slate-700 opacity-50 cursor-default`;
  };

  const letterBubble = (letter) => {
    const base = 'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5';
    if (!isAnswered) {
      return selectedAnswer === letter
        ? `${base} bg-[#2f456d] text-white`
        : `${base} bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`;
    }
    if (letter === question.correct_answer) return `${base} bg-emerald-500 text-white`;
    if (letter === selectedAnswer) return `${base} bg-red-500 text-white`;
    return `${base} bg-slate-100 dark:bg-slate-700 text-slate-400`;
  };

  /* ── estilos Certo/Errado compacto ──────────────────────────────────── */
  const ceStyle = (letter) => {
    const isCorrectLetter = letter === 'A';
    const base = 'flex items-center gap-2 px-5 h-10 rounded-lg border-2 font-medium text-sm transition-all';
    if (!isAnswered) {
      if (selectedAnswer === letter) {
        return isCorrectLetter
          ? `${base} border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 cursor-pointer`
          : `${base} border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 cursor-pointer`;
      }
      return isCorrectLetter
        ? `${base} border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer`
        : `${base} border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 cursor-pointer`;
    }
    // após responder
    if (letter === question.correct_answer) {
      return isCorrectLetter
        ? `${base} border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 cursor-default`
        : `${base} border-red-500 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 cursor-default`;
    }
    return `${base} border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-50 cursor-default`;
  };

  const isCorrect = isAnswered && selectedAnswer === question.correct_answer;

  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">

      {/* ── Header: metadados ──────────────────────────────────────────── */}
      <CardHeader className="pb-0 pt-4 px-5">
        <div className="flex items-start justify-between gap-3">
          {/* Chips de metadados */}
          <div className="flex flex-wrap gap-1.5 flex-1">
            {question.code && (
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                #{question.code}
              </span>
            )}
            {question.difficulty && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[question.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                {question.difficulty}
              </span>
            )}
            {question.question_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                {question.question_type}
              </span>
            )}
            {question.discipline && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#2f456d]/10 text-[#2f456d] dark:bg-[#2f456d]/30 dark:text-blue-300 font-medium">
                {question.discipline}
              </span>
            )}
            {question.exam_board && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {question.exam_board}
              </span>
            )}
            {question.year && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {question.year}
              </span>
            )}
            {previouslyAnswered && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                previouslyAnswered.is_correct
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }`}>
                {previouslyAnswered.is_correct ? '✓ Acertou antes' : '✗ Errou antes'}
              </span>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-0.5 shrink-0">
            {onSaveToggle && (
              <button
                onClick={onSaveToggle}
                title={savedInNotebook ? 'Remover do caderno' : 'Salvar no caderno'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#2f456d] dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {savedInNotebook
                  ? <BookmarkCheck className="w-4.5 h-4.5 text-[#2f456d] dark:text-blue-400 w-[18px] h-[18px]" />
                  : <Bookmark className="w-[18px] h-[18px]" />}
              </button>
            )}
            <button
              onClick={() => setShowReportModal(true)}
              title="Reportar problema"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Flag className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>

        {/* Assuntos */}
        {question.subjects?.length > 0 && (
          <div className="mt-2">
            <SubjectsDropdown subjects={question.subjects} />
          </div>
        )}
      </CardHeader>

      {/* ── Enunciado ──────────────────────────────────────────────────── */}
      <CardContent className="px-5 pt-4 pb-0">
        <div
          className="text-slate-800 dark:text-slate-100 leading-relaxed text-base"
          dangerouslySetInnerHTML={{ __html: question.text }}
        />
      </CardContent>

      {/* ── Alternativas ───────────────────────────────────────────────── */}
      <CardContent className="px-5 pt-4 pb-0">
        {isCertoErrado ? (
          /* Botões compactos Certo/Errado */
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => !isAnswered && setSelectedAnswer('A')}
                disabled={isAnswered}
                className={ceStyle('A')}
              >
                <Check className="w-4 h-4 shrink-0" />
                Certo
              </button>
              <button
                onClick={() => !isAnswered && setSelectedAnswer('B')}
                disabled={isAnswered}
                className={ceStyle('B')}
              >
                <X className="w-4 h-4 shrink-0" />
                Errado
              </button>
            </div>

            {/* Resultado inline */}
            {isAnswered && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}>
                {isCorrect
                  ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Correto! A afirmativa está {question.correct_answer === 'A' ? 'CERTA' : 'ERRADA'}.</>
                  : <><XCircle className="w-4 h-4 shrink-0" /> Incorreto. A afirmativa está {question.correct_answer === 'A' ? 'CERTA' : 'ERRADA'}.</>
                }
              </div>
            )}
          </div>
        ) : (
          /* Múltipla escolha */
          <div className="space-y-2">
            {options.map((opt) => (
              <button
                key={opt.letter}
                onClick={() => !isAnswered && setSelectedAnswer(opt.letter)}
                disabled={isAnswered}
                className={optionStyle(opt.letter)}
              >
                <span className={letterBubble(opt.letter)}>{opt.letter}</span>
                <span
                  className="flex-1 text-slate-700 dark:text-slate-200 leading-relaxed text-left"
                  dangerouslySetInnerHTML={{ __html: opt.text }}
                />
                {isAnswered && opt.letter === question.correct_answer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isAnswered && opt.letter === selectedAnswer && opt.letter !== question.correct_answer && (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>

      {/* ── Botão confirmar ─────────────────────────────────────────────── */}
      {!isAnswered && !isCertoErrado && (
        <CardContent className="px-5 pt-4 pb-5">
          <Button
            onClick={handleSubmit}
            disabled={!selectedAnswer || isSubmitting}
            className="w-full bg-[#2f456d] hover:bg-[#243756] text-white shadow-sm"
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar Resposta'}
          </Button>
        </CardContent>
      )}

      {!isAnswered && isCertoErrado && selectedAnswer && (
        <CardContent className="px-5 pt-3 pb-5">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#2f456d] hover:bg-[#243756] text-white shadow-sm"
          >
            {isSubmitting ? 'Registrando...' : 'Confirmar Resposta'}
          </Button>
        </CardContent>
      )}

      {/* ── Explicação ──────────────────────────────────────────────────── */}
      {showExplanation && question.explanation && (
        <CardContent className="px-5 pt-0 pb-0">
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Comentário do Professor
              </span>
            </div>
            <div
              className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: question.explanation }}
            />
          </div>
        </CardContent>
      )}

      {/* ── Toggle comentários ──────────────────────────────────────────── */}
      <CardContent className="px-5 py-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#2f456d] dark:hover:text-blue-300 transition-colors w-full py-1"
        >
          <MessageCircle className="w-4 h-4" />
          {showComments ? 'Ocultar comentários' : 'Ver comentários'}
          {showComments ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
        </button>
      </CardContent>

      {showComments && (
        <CardContent className="px-5 pt-0 pb-5 border-t border-slate-100 dark:border-slate-700 mt-0">
          <div className="pt-4">
            <CommentSection questionId={question.id} canComment={isAnswered} />
          </div>
        </CardContent>
      )}

      <ReportModal open={showReportModal} onOpenChange={setShowReportModal} question={question} />
    </Card>
  );
}

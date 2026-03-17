import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, RotateCcw, CheckCircle2, XCircle, Minus, ThumbsUp } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';

/**
 * Algoritmo SM-2 para revisão espaçada.
 * quality: 0 = Errei, 3 = Difícil, 4 = Bom, 5 = Fácil
 */
function calculateSM2(quality, repetitions, easeFactor, interval) {
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  let newRepetitions = repetitions;
  let newInterval = interval;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions += 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    ease_factor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    due_date: dueDate.toISOString(),
  };
}

const QUALITY_LABELS = [
  { value: 0, label: 'Errei', color: 'bg-red-500 hover:bg-red-600', icon: XCircle, desc: 'Não lembrei' },
  { value: 3, label: 'Difícil', color: 'bg-orange-500 hover:bg-orange-600', icon: Minus, desc: 'Com dificuldade' },
  { value: 4, label: 'Bom', color: 'bg-blue-500 hover:bg-blue-600', icon: CheckCircle2, desc: 'Lembrei bem' },
  { value: 5, label: 'Fácil', color: 'bg-green-500 hover:bg-green-600', icon: ThumbsUp, desc: 'Muito fácil' },
];

export default function FlashcardStudyMode({ cards, reviewData, onFinish, onUpdateReview }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [results, setResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex) / cards.length) * 100;

  const handleShowBack = () => setShowBack(true);

  const handleQuality = async (quality) => {
    if (submitting) return;
    setSubmitting(true);

    const existingReview = reviewData[currentCard.id];
    const sm2Input = {
      quality,
      repetitions: existingReview?.repetitions ?? 0,
      easeFactor: existingReview?.ease_factor ?? 2.5,
      interval: existingReview?.interval ?? 1,
    };

    const sm2Result = calculateSM2(
      sm2Input.quality,
      sm2Input.repetitions,
      sm2Input.easeFactor,
      sm2Input.interval,
    );

    try {
      await apiClient.post(`${API_ENDPOINTS.FLASHCARDS}/${currentCard.id}/review`, {
        quality,
        ...sm2Result,
      });
      onUpdateReview(currentCard.id, sm2Result);
    } catch (err) {
      console.error('Erro ao salvar revisão:', err);
    }

    const newResults = [...results, { card: currentCard, quality }];
    setResults(newResults);
    setSubmitting(false);

    if (currentIndex + 1 >= cards.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
    }
  };

  if (isFinished) {
    const correct = results.filter(r => r.quality >= 3).length;
    const total = results.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2f456d] dark:text-white">Sessão Concluída!</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Você revisou {total} flashcard{total !== 1 ? 's' : ''}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{correct}</p>
                <p className="text-xs text-slate-500">Acertos</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-500">{total - correct}</p>
                <p className="text-xs text-slate-500">Erros</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
                <p className="text-xs text-slate-500">Acerto</p>
              </div>
            </div>
            <Button
              onClick={onFinish}
              className="w-full bg-[#2f456d] hover:bg-[#243756] text-white"
            >
              Voltar aos Flashcards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="font-medium">{currentIndex + 1} / {cards.length}</span>
            <Badge className="bg-white/20 text-white border-0">
              {currentCard.discipline}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFinish}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2 bg-white/20 [&>div]:bg-[#f26836]" />

        {/* Card */}
        <Card
          className="min-h-[300px] cursor-pointer select-none bg-white dark:bg-slate-800 shadow-2xl border-0"
          onClick={!showBack ? handleShowBack : undefined}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
            {!showBack ? (
              <div className="space-y-4">
                <Badge className="bg-[#2f456d]/10 text-[#2f456d] border-0">
                  Frente — clique para revelar
                </Badge>
                <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                  {currentCard.front}
                </p>
                <Button
                  onClick={handleShowBack}
                  variant="outline"
                  className="mt-4 border-[#2f456d] text-[#2f456d]"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Ver Resposta
                </Button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500">Pergunta:</p>
                  <p className="text-base font-medium text-slate-700 dark:text-slate-300">{currentCard.front}</p>
                </div>
                <div>
                  <Badge className="bg-green-100 text-green-700 border-0 mb-2">Resposta</Badge>
                  <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quality Buttons */}
        {showBack && (
          <div className="grid grid-cols-4 gap-3">
            {QUALITY_LABELS.map(({ value, label, color, icon: Icon, desc }) => (
              <button
                key={value}
                onClick={() => handleQuality(value)}
                disabled={submitting}
                className={`${color} text-white rounded-xl p-3 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 disabled:opacity-50`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs opacity-80">{desc}</span>
              </button>
            ))}
          </div>
        )}

        {!showBack && (
          <p className="text-center text-white/60 text-sm">
            Clique no card ou em "Ver Resposta" para revelar
          </p>
        )}
      </div>
    </div>
  );
}

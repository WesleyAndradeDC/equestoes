import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, Loader2, AlertTriangle } from 'lucide-react';

// Sugestões para facilitar o preenchimento
const QUICK_REASONS = [
  'Gabarito incorreto',
  'Enunciado com erro de português',
  'Alternativas ambíguas ou incorretas',
  'Imagem ou fórmula faltando',
  'Questão desatualizada',
];

export default function ReportModal({ open, onOpenChange, question }) {
  const [reason, setReason] = useState('');

  const { mutate: submitReport, isPending } = useMutation({
    mutationFn: () => reportService.create(question.id, reason),
    onSuccess: () => {
      toast.success('Report enviado! Nossa equipe irá analisar em breve.');
      setReason('');
      onOpenChange(false);
    },
    onError: (err) => {
      const msg = err?.message || 'Erro ao enviar report';
      // Mensagem amigável para report duplicado
      if (msg.includes('já reportou') || msg.includes('409')) {
        toast.warning('Você já reportou esta questão e o report está em análise.');
      } else {
        toast.error(msg);
      }
    },
  });

  const handleQuickReason = (text) => {
    setReason((prev) => (prev ? `${prev}\n${text}` : text));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      toast.error('Descreva o problema com pelo menos 10 caracteres');
      return;
    }
    submitReport();
  };

  const handleClose = () => {
    if (!isPending) {
      setReason('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Flag className="w-5 h-5 text-red-500" />
            Reportar Questão
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Descreva o problema encontrado nesta questão para que nossa equipe possa revisá-la.
          </DialogDescription>
        </DialogHeader>

        {/* Info da questão */}
        {question && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {question.code && (
                <span className="font-mono text-xs mr-2 text-slate-400">#{question.code}</span>
              )}
              <span className="font-medium">{question.discipline}</span>
              {question.difficulty && (
                <span className="ml-2 text-xs text-slate-400">• {question.difficulty}</span>
              )}
              <p className="mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                {question.text?.substring(0, 120)}
                {question.text?.length > 120 ? '…' : ''}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sugestões rápidas */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-600 dark:text-slate-400">
              Sugestões rápidas
            </Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleQuickReason(r)}
                  className="text-xs px-3 py-1.5 rounded-full border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <Label
              htmlFor="report-reason"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Descrição do problema <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique com detalhes o que está errado nesta questão…"
              rows={4}
              disabled={isPending}
              className="resize-none bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:border-red-400 focus:ring-red-400"
            />
            <p className="text-xs text-slate-400">
              {reason.trim().length} / mínimo 10 caracteres
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || reason.trim().length < 10}
              className="bg-red-600 hover:bg-red-700 text-white hover:text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-2" />
                  Enviar Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, GraduationCap, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CommentSection({ questionId, canComment = false }) {
  const [user, setUser] = useState(null);
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', questionId],
    queryFn: () => base44.entities.Comment.filter({ question_id: questionId }, '-created_date'),
    initialData: [],
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', questionId] });
      setNewComment('');
      toast.success('Comentário publicado!');
    },
    onError: () => {
      toast.error('Erro ao publicar comentário');
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      question_id: questionId,
      text: newComment.trim(),
      author_name: user?.full_name || 'Usuário',
      author_role: user?.subscription_type || user?.role || 'Aluno',
    });
  };

  const isProfessor = (role) => role === 'Professor' || role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <MessageCircle className="w-5 h-5 text-[#2f456d]" />
        <h4 className="font-semibold">Comentários ({comments.length})</h4>
      </div>

      {/* Comment Input */}
      {canComment ? (
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <Textarea
            placeholder="Escreva seu comentário sobre esta questão..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="bg-[#2f456d] hover:bg-[#2f456d] text-white hover:text-white"
            >
              {createCommentMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Publicar
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
          💡 Responda à questão para poder comentar.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-[#2f456d] animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-6">
            Nenhum comentário ainda. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                isProfessor(comment.author_role)
                  ? 'bg-gradient-to-r from-[#2f456d] to-indigo-50 dark:from-[#2f456d]/30 dark:to-indigo-900/30 border-[#2f456d]/30 dark:border-[#2f456d]/30'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isProfessor(comment.author_role)
                      ? 'bg-[#2f456d] text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isProfessor(comment.author_role) ? (
                      <GraduationCap className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${
                        isProfessor(comment.author_role)
                          ? 'text-[#2f456d] dark:text-[#2f456d]'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {comment.author_name}
                      </span>
                      {isProfessor(comment.author_role) && (
                        <Badge className="bg-[#2f456d] text-white text-xs">
                          Professor ✓
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {format(new Date(comment.created_date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              </div>
              <p className={`text-sm leading-relaxed ${
                isProfessor(comment.author_role)
                  ? 'text-[#2f456d] dark:text-[#2f456d]'
                  : 'text-slate-600 dark:text-slate-300'
              }`}>
                {comment.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
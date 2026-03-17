import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Layers, Plus, Play, Pencil, Trash2, Globe, User,
  BookOpen, Calendar, Loader2, Filter,
} from 'lucide-react';
import FlashcardStudyMode from '@/components/flashcards/FlashcardStudyMode';
import { useToast } from '@/components/ui/use-toast';

export default function Flashcards() {
  const [activeTab, setActiveTab] = useState('mine');
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [studyMode, setStudyMode] = useState(null); // null | 'mine' | 'global'
  const [reviewData, setReviewData] = useState({});
  const [newCard, setNewCard] = useState({ front: '', back: '', discipline: '', subjects: '' });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authUser } = useQuery({
    queryKey: ['auth-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = authUser?.role === 'admin';

  const { data: flashcards = [], isLoading } = useQuery({
    queryKey: ['flashcards'],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.FLASHCARDS);
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: dueCards = [] } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: async () => {
      const res = await apiClient.get(API_ENDPOINTS.FLASHCARDS_DUE);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ENDPOINTS.FLASHCARDS, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      setShowCreateDialog(false);
      setNewCard({ front: '', back: '', discipline: '', subjects: '' });
      toast({ title: 'Flashcard criado!' });
    },
    onError: () => toast({ title: 'Erro ao criar flashcard', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => apiClient.put(`${API_ENDPOINTS.FLASHCARDS}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      setEditingCard(null);
      toast({ title: 'Flashcard atualizado!' });
    },
    onError: () => toast({ title: 'Erro ao atualizar flashcard', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.delete(`${API_ENDPOINTS.FLASHCARDS}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      toast({ title: 'Flashcard removido!' });
    },
    onError: () => toast({ title: 'Erro ao remover flashcard', variant: 'destructive' }),
  });

  const myCards = useMemo(
    () => flashcards.filter(c => !c.is_global),
    [flashcards],
  );

  const globalCards = useMemo(
    () => flashcards.filter(c => c.is_global),
    [flashcards],
  );

  const allDisciplines = useMemo(
    () => [...new Set(flashcards.map(c => c.discipline).filter(Boolean))],
    [flashcards],
  );

  const allSubjects = useMemo(() => {
    const subjects = new Set();
    flashcards.forEach(c => {
      if (c.discipline === filterDiscipline || filterDiscipline === 'all') {
        (c.subjects || []).forEach(s => subjects.add(s));
      }
    });
    return [...subjects];
  }, [flashcards, filterDiscipline]);

  const filterCards = (cards) => {
    return cards.filter(c => {
      const matchDiscipline = filterDiscipline === 'all' || c.discipline === filterDiscipline;
      const matchSubject = filterSubject === 'all' || (c.subjects || []).includes(filterSubject);
      return matchDiscipline && matchSubject;
    });
  };

  const filteredMyCards = filterCards(myCards);
  const filteredGlobalCards = filterCards(globalCards);

  const dueMyCards = useMemo(
    () => dueCards.filter(c => !c.is_global),
    [dueCards],
  );

  const dueGlobalCards = useMemo(
    () => dueCards.filter(c => c.is_global),
    [dueCards],
  );

  const handleUpdateReview = (cardId, reviewResult) => {
    setReviewData(prev => ({ ...prev, [cardId]: reviewResult }));
    queryClient.invalidateQueries({ queryKey: ['flashcards-due'] });
  };

  const handleSaveCard = () => {
    const payload = {
      ...newCard,
      subjects: newCard.subjects ? newCard.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
      is_global: isAdmin ? false : false,
    };
    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleCreateGlobal = () => {
    const payload = {
      ...newCard,
      subjects: newCard.subjects ? newCard.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
      is_global: true,
    };
    createMutation.mutate(payload);
  };

  const openEdit = (card) => {
    setEditingCard(card);
    setNewCard({
      front: card.front,
      back: card.back,
      discipline: card.discipline,
      subjects: (card.subjects || []).join(', '),
    });
    setShowCreateDialog(true);
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setEditingCard(null);
    setNewCard({ front: '', back: '', discipline: '', subjects: '' });
  };

  if (studyMode) {
    const cardsToStudy = studyMode === 'mine' ? filteredMyCards : filteredGlobalCards;
    const dueToStudy = studyMode === 'mine' ? dueMyCards : dueGlobalCards;
    const studyCards = dueToStudy.length > 0 ? dueToStudy : cardsToStudy;

    return (
      <FlashcardStudyMode
        cards={studyCards}
        reviewData={reviewData}
        onFinish={() => setStudyMode(null)}
        onUpdateReview={handleUpdateReview}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2f456d] dark:text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-[#f26836]" />
            Flashcards
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Revisão espaçada com algoritmo Anki (SM-2)
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#f26836] hover:bg-[#d9561f] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Flashcard
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Meus Cards', value: myCards.length, color: 'text-[#2f456d]', icon: User },
          { label: 'Globais', value: globalCards.length, color: 'text-[#f26836]', icon: Globe },
          { label: 'Para Revisar Hoje', value: dueCards.length, color: 'text-amber-600', icon: Calendar },
          { label: 'Total', value: flashcards.length, color: 'text-green-600', icon: BookOpen },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-8 h-8 ${color}`} />
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <Select value={filterDiscipline} onValueChange={(v) => { setFilterDiscipline(v); setFilterSubject('all'); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todas as disciplinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {allDisciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos os assuntos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os assuntos</SelectItem>
                {allSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="mine" className="data-[state=active]:bg-[#2f456d] data-[state=active]:text-white">
            Meus Flashcards
            {dueMyCards.length > 0 && (
              <Badge className="ml-2 bg-[#f26836] text-white text-xs px-1.5">{dueMyCards.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="global" className="data-[state=active]:bg-[#2f456d] data-[state=active]:text-white">
            Flashcards Globais
            {dueGlobalCards.length > 0 && (
              <Badge className="ml-2 bg-[#f26836] text-white text-xs px-1.5">{dueGlobalCards.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* My Cards Tab */}
        <TabsContent value="mine" className="mt-6">
          <FlashcardList
            cards={filteredMyCards}
            dueCount={dueMyCards.length}
            isLoading={isLoading}
            canEdit
            onStudy={() => setStudyMode('mine')}
            onEdit={openEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
            emptyMessage="Você ainda não tem flashcards. Crie um novo!"
          />
        </TabsContent>

        {/* Global Cards Tab */}
        <TabsContent value="global" className="mt-6">
          <FlashcardList
            cards={filteredGlobalCards}
            dueCount={dueGlobalCards.length}
            isLoading={isLoading}
            canEdit={isAdmin}
            onStudy={() => setStudyMode('global')}
            onEdit={isAdmin ? openEdit : undefined}
            onDelete={isAdmin ? (id) => deleteMutation.mutate(id) : undefined}
            emptyMessage="Nenhum flashcard global disponível ainda."
            isAdmin={isAdmin}
            onCreateGlobal={isAdmin ? () => { setNewCard({ front: '', back: '', discipline: '', subjects: '' }); setShowCreateDialog(true); } : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#2f456d] dark:text-white">
              {editingCard ? 'Editar Flashcard' : 'Novo Flashcard'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Frente (Pergunta)</Label>
              <Textarea
                placeholder="Digite a pergunta ou conceito..."
                value={newCard.front}
                onChange={(e) => setNewCard(p => ({ ...p, front: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Verso (Resposta)</Label>
              <Textarea
                placeholder="Digite a resposta ou explicação..."
                value={newCard.back}
                onChange={(e) => setNewCard(p => ({ ...p, back: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Input
                  placeholder="Ex: Português"
                  value={newCard.discipline}
                  onChange={(e) => setNewCard(p => ({ ...p, discipline: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Assuntos (vírgula)</Label>
                <Input
                  placeholder="Ex: Crase, Regência"
                  value={newCard.subjects}
                  onChange={(e) => setNewCard(p => ({ ...p, subjects: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            {isAdmin && !editingCard && (
              <Button
                variant="outline"
                onClick={handleCreateGlobal}
                disabled={!newCard.front || !newCard.back || createMutation.isPending}
                className="border-[#f26836] text-[#f26836]"
              >
                <Globe className="w-4 h-4 mr-1" />
                Criar Global
              </Button>
            )}
            <Button
              onClick={handleSaveCard}
              disabled={!newCard.front || !newCard.back || createMutation.isPending || updateMutation.isPending}
              className="bg-[#2f456d] hover:bg-[#243756] text-white"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCard ? 'Salvar' : 'Criar Flashcard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlashcardList({ cards, dueCount, isLoading, canEdit, onStudy, onEdit, onDelete, emptyMessage, isAdmin, onCreateGlobal }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#2f456d] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Study Button */}
      {cards.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{cards.length} flashcard{cards.length !== 1 ? 's' : ''}</p>
          <Button
            onClick={onStudy}
            className="bg-[#2f456d] hover:bg-[#243756] text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            {dueCount > 0 ? `Estudar (${dueCount} pendentes)` : 'Estudar Todos'}
          </Button>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Layers className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          {isAdmin && onCreateGlobal && (
            <Button onClick={onCreateGlobal} variant="outline" className="border-[#f26836] text-[#f26836]">
              <Globe className="w-4 h-4 mr-2" />
              Criar Flashcard Global
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card
              key={card.id}
              className="bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    <Badge className="bg-[#2f456d]/10 text-[#2f456d] border-0 text-xs">
                      {card.discipline || 'Geral'}
                    </Badge>
                    {card.is_global && (
                      <Badge className="bg-[#f26836]/10 text-[#f26836] border-0 text-xs">
                        <Globe className="w-3 h-3 mr-1" />Global
                      </Badge>
                    )}
                  </div>
                  {(canEdit || onEdit) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onEdit(card)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => {
                            if (window.confirm('Remover este flashcard?')) onDelete(card.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Frente</p>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-2">{card.front}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Verso</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{card.back}</p>
                </div>
                {(card.subjects || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {card.subjects.slice(0, 3).map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                        {s}
                      </span>
                    ))}
                    {card.subjects.length > 3 && (
                      <span className="text-xs text-slate-400">+{card.subjects.length - 3}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

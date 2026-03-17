import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const COLORS = {
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
  red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900' },
  purple: { bg: 'bg-[#2f456d]', border: 'border-[#2f456d]/30', text: 'text-[#2f456d]' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' }
};

export default function Notebooks() {
  const [user, setUser] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNotebook, setNewNotebook] = useState({ name: '', description: '', color: 'blue' });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notebooks = [], isLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: () => base44.entities.Notebook.filter({ created_by: user?.email }),
    enabled: !!user,
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notebook.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Caderno criado com sucesso!');
      setShowCreateDialog(false);
      setNewNotebook({ name: '', description: '', color: 'blue' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notebook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      toast.success('Caderno excluído com sucesso!');
    }
  });

  const handleCreate = () => {
    if (!newNotebook.name.trim()) {
      toast.error('Digite um nome para o caderno');
      return;
    }
    createMutation.mutate(newNotebook);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este caderno?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#2f456d] to-[#1a2d4a] dark:from-white dark:to-white bg-clip-text text-transparent">
            Meus Cadernos
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Organize suas questões em coleções personalizadas
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-slate-950 text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-9 from-[#2f456d] to-[#1a2d4a] hover:from-[#2f456d] hover:to-[#1a2d4a] text-white hover:text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Novo Caderno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Caderno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Caderno *</Label>
                <Input
                  placeholder="Ex: Questões de Sintaxe"
                  value={newNotebook.name}
                  onChange={(e) => setNewNotebook({ ...newNotebook, name: e.target.value })} />

              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  placeholder="Descrição breve do caderno"
                  value={newNotebook.description}
                  onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })} />

              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <Select value={newNotebook.color} onValueChange={(value) => setNewNotebook({ ...newNotebook, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(COLORS).map((color) =>
                    <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${COLORS[color].bg} ${COLORS[color].border} border-2`} />
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreate} className="w-full bg-[#2f456d] hover:bg-[#2f456d] text-white hover:text-white">
                Criar Caderno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notebooks Grid */}
      {notebooks.length === 0 ?
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <FolderOpen className="w-20 h-20 text-slate-300 dark:text-slate-600" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Nenhum caderno criado ainda</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Crie seu primeiro caderno para organizar e salvar questões importantes para seus estudos
              </p>
            </div>
            <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-[#2f456d] to-[#1a2d4a] hover:from-[#2f456d] hover:to-[#1a2d4a] text-white hover:text-white">

              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Caderno
            </Button>
          </CardContent>
        </Card> :

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((notebook) => {
          const colorScheme = COLORS[notebook.color || 'blue'];
          const questionCount = notebook.question_ids?.length || 0;

          return (
            <Card
              key={notebook.id}
              className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md hover:shadow-xl transition-all border-2 ${colorScheme.border} dark:border-slate-600`}>

                <CardHeader className={`${colorScheme.bg} dark:bg-slate-700 border-b-2 ${colorScheme.border} dark:border-slate-600`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${colorScheme.text} dark:text-white`}>
                        {notebook.name}
                      </CardTitle>
                      {notebook.description &&
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          {notebook.description}
                        </p>
                    }
                    </div>
                    <FolderOpen className={`w-6 h-6 ${colorScheme.text} dark:text-white shrink-0 ml-2`} />
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                      <span className="text-2xl font-bold text-[#2f456d] dark:text-white">
                        {questionCount}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {questionCount === 1 ? 'questão' : 'questões'}
                    </span>
                  </div>

                  {questionCount === 0 &&
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Salve questões neste caderno durante a resolução
                      </p>
                    </div>
                }
                </CardContent>

                <CardFooter className="flex gap-2 pt-0">
                  <Link to={`${createPageUrl('Questions')}?notebook=${notebook.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" disabled={questionCount === 0}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Resolver
                    </Button>
                  </Link>
                  <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(notebook.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50">

                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>);

        })}
        </div>
      }
    </div>);

}
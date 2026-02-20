import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Shield,
  UserX,
  UserPlus,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import userService from '@/services/userService';

const SUBSCRIPTION_OPTIONS = [
  { value: 'Aluno Clube do Pedrão', label: '🟡 Aluno Clube do Pedrão' },
  { value: 'Aluno Clube dos Cascas', label: '🟢 Aluno Clube dos Cascas' },
  { value: 'Professor', label: '🔵 Professor' },
];

const ROLE_OPTIONS = [
  { value: 'user', label: 'Usuário' },
  { value: 'admin', label: 'Administrador' },
];

const SUBSCRIPTION_BADGE = {
  'Aluno Clube dos Cascas': 'bg-green-100 text-green-700 border-green-300',
  'Aluno Clube do Pedrão': 'bg-amber-100 text-amber-700 border-amber-300',
  'Professor': 'bg-blue-100 text-blue-700 border-blue-300',
};

// Formulário de criação/edição de usuário
function UserFormDialog({ open, onOpenChange, onSubmit, loading, editUser = null }) {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    full_name: editUser?.full_name || '',
    email: editUser?.email || '',
    subscription_type: editUser?.subscription_type || 'Aluno Clube do Pedrão',
    role: editUser?.role || 'user',
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        full_name: editUser?.full_name || '',
        email: editUser?.email || '',
        subscription_type: editUser?.subscription_type || 'Aluno Clube do Pedrão',
        role: editUser?.role || 'user',
      });
    }
  }, [open, editUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            {isEdit ? <Pencil className="w-5 h-5 text-purple-600" /> : <UserPlus className="w-5 h-5 text-purple-600" />}
            {isEdit ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {isEdit
              ? 'Altere o tipo de assinatura ou permissão do usuário.'
              : 'O usuário receberá acesso à plataforma e definirá sua senha no primeiro login.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-slate-700 dark:text-slate-200">
              Nome Completo
            </Label>
            <Input
              id="full_name"
              placeholder="Ex: João da Silva"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              disabled={loading}
              className="h-10"
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="aluno@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={loading}
                className="h-10"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-200">Tipo de Assinatura</Label>
            <Select
              value={form.subscription_type}
              onValueChange={(val) => setForm({ ...form, subscription_type: val })}
              disabled={loading}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 dark:text-slate-200">Permissão</Label>
            <Select
              value={form.role}
              onValueChange={(val) => setForm({ ...form, role: val })}
              disabled={loading}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? 'Salvando...' : 'Adicionando...'}
                </>
              ) : (
                <>
                  {isEdit ? <Pencil className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  {isEdit ? 'Salvar Alterações' : 'Adicionar Usuário'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Redirecionar se não for admin
  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  // Buscar todos os usuários
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.list(),
    staleTime: 30_000,
    retry: 1,
  });

  // Criar usuário
  const createMutation = useMutation({
    mutationFn: (data) => userService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateDialog(false);
      setSuccessMessage(`Usuário "${res.user?.full_name}" adicionado! Ele definirá a senha no primeiro acesso.`);
      toast.success('Usuário adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 6000);
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao criar usuário');
    }
  });

  // Editar usuário
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao atualizar usuário');
    }
  });

  // Excluir usuário
  const deleteMutation = useMutation({
    mutationFn: (userId) => userService.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir usuário');
    }
  });

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      deleteMutation.mutate(userId);
    }
  };

  const handleCreateSubmit = (form) => {
    createMutation.mutate(form);
  };

  const handleEditSubmit = (form) => {
    updateMutation.mutate({
      id: editingUser.id,
      data: {
        full_name: form.full_name,
        subscription_type: form.subscription_type,
        role: form.role
      }
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Erro ao carregar usuários
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {usersError.message || 'Erro desconhecido'}
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const statsAdmins = users.filter(u => u.role === 'admin').length;
  const statsProfessors = users.filter(u => u.subscription_type === 'Professor').length;
  const statsCascas = users.filter(u => u.subscription_type === 'Aluno Clube dos Cascas').length;
  const statsPedrao = users.filter(u => u.subscription_type === 'Aluno Clube do Pedrão').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
              Administração
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie usuários e configurações do sistema
          </p>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          Adicionar Usuário
        </Button>
      </div>

      {/* Mensagem de sucesso */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: users.length, color: 'purple', icon: Users },
          { label: 'Admins', value: statsAdmins, color: 'red', icon: Shield },
          { label: 'Professores', value: statsProfessors, color: 'blue', icon: Users },
          { label: 'Clube dos Cascas', value: statsCascas, color: 'green', icon: Users },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
                  <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
                </div>
                <div>
                  <p className={`text-xl font-bold text-${color}-700 dark:text-${color}-300`}>{value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users List */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="w-5 h-5 text-purple-600" />
            Usuários do Sistema
            <Badge variant="secondary" className="ml-1">{users.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const isCurrentUser = u.id === currentUser?.id;
                const badgeClass = SUBSCRIPTION_BADGE[u.subscription_type] || 'bg-slate-100 text-slate-600';

                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600 transition-all gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {u.full_name}
                        </span>
                        {isCurrentUser && (
                          <Badge className="bg-purple-600 text-white text-xs">Você</Badge>
                        )}
                        {u.role === 'admin' && (
                          <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs">
                            Admin
                          </Badge>
                        )}
                        {u.subscription_type && (
                          <Badge className={`${badgeClass} border text-xs`}>
                            {u.subscription_type}
                          </Badge>
                        )}
                        {u.first_login && (
                          <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-xs">
                            Aguardando 1º acesso
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(u)}
                        className="border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      {!isCurrentUser && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          disabled={deleteMutation.isPending}
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                Informações Importantes
              </h4>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li>• Usuários adicionados aqui precisam fazer o primeiro login para definir a senha</li>
                <li>• Professores podem criar e gerenciar questões na plataforma</li>
                <li>• Alunos do Clube dos Cascas têm acesso ao Tutor IA (Gramatique)</li>
                <li>• Alunos do Clube do Pedrão têm acesso às questões padrão</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Criar usuário */}
      <UserFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateSubmit}
        loading={createMutation.isPending}
      />

      {/* Dialog: Editar usuário */}
      <UserFormDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={handleEditSubmit}
        loading={updateMutation.isPending}
        editUser={editingUser}
      />
    </div>
  );
}

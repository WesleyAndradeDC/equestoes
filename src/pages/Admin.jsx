import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, UserX, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== 'admin') {
        window.location.href = '/';
      }
      setCurrentUser(user);
    }).catch(() => {
      window.location.href = '/';
    });
  }, []);

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      console.log('👤 Admin: Buscando usuários...');
      try {
        const result = await base44.entities.User.list();
        console.log('✅ Admin: Usuários recebidos:', result?.length);
        console.log('📋 Lista de usuários:', result);
        return result || [];
      } catch (error) {
        console.error('❌ Admin: Erro ao buscar usuários:', error);
        throw error;
      }
    },
    staleTime: 0,
    retry: 1,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Usuário excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir usuário');
    }
  });

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Debug logs
  React.useEffect(() => {
    console.log('👤 Admin: Estado atual:', {
      currentUser: currentUser?.email,
      usersCount: users?.length,
      loading: usersLoading,
      hasError: !!usersError,
      users: users
    });
  }, [currentUser, users, usersLoading, usersError]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Users className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
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
            onClick={() => window.location.reload()} 
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-10 h-10 text-purple-600 dark:text-white" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
            Administração
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Gerencie usuários e configurações do sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/90 dark:bg-purple-900/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-white">
                <Users className="w-6 h-6 text-purple-600 dark:text-black" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-white">{users.length}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Total de Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-purple-900/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-white">
                <Shield className="w-6 h-6 text-blue-600 dark:text-black" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-white">
                  {users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 dark:bg-purple-900/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-purple-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-white">
                <Users className="w-6 h-6 text-green-600 dark:text-black" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-white">
                  {users.filter(u => u.subscription_type === 'Professor').length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">Professores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="bg-white/90 dark:bg-purple-900/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Users className="w-5 h-5 text-purple-600 dark:text-white" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Nenhum usuário encontrado</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Verifique os logs do console para mais informações
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
              const isCurrentUser = user.id === currentUser.id;
              
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-purple-200 dark:hover:border-purple-500 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {user.full_name}
                        {isCurrentUser && (
                          <Badge className="ml-2 bg-purple-600 text-white">Você</Badge>
                        )}
                      </h4>
                      {user.role === 'admin' && (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          Admin
                        </Badge>
                      )}
                      {user.subscription_type === 'Professor' && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                          Professor
                        </Badge>
                      )}
                      {user.subscription_type === 'Aluno Clube dos Cascas' && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          Clube dos Cascas
                        </Badge>
                      )}
                      {user.subscription_type === 'Aluno Clube do Pedrão' && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                          Clube do Pedrão
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>

                  {!isCurrentUser && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                      disabled={deleteUserMutation.isPending}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-amber-50/50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Informações Importantes</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                <li>• Apenas administradores podem acessar esta página</li>
                <li>• Professores podem criar e gerenciar questões</li>
                <li>• Alunos do Clube do Pedrão têm acesso restrito a Língua Portuguesa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
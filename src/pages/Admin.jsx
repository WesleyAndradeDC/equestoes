import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Pencil,
  Flag,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import userService from '@/services/userService';
import reportService from '@/services/reportService';

// ─── Constantes ──────────────────────────────────────────────────────────────
const SUBSCRIPTION_OPTIONS = [
  { value: 'Aluno Eleva',  label: '🟢 Aluno Eleva' },
  { value: 'Professor',    label: '🔵 Professor' },
];

const ROLE_OPTIONS = [
  { value: 'user',  label: 'Usuário' },
  { value: 'admin', label: 'Administrador' },
];

const SUBSCRIPTION_BADGE = {
  'Aluno Eleva': 'bg-blue-100 text-blue-700 border-blue-300',
  'Professor':   'bg-[#2f456d]/10 text-[#2f456d] border-[#2f456d]/30',
};

const REPORT_STATUS_CONFIG = {
  pending:    { label: 'Pendente',      bg: 'bg-amber-100 text-amber-700 border-amber-300',   icon: Clock },
  reviewing:  { label: 'Em Revisão',   bg: 'bg-blue-100 text-blue-700 border-blue-300',     icon: Eye },
  resolved:   { label: 'Resolvida',    bg: 'bg-green-100 text-green-700 border-green-300',   icon: CheckCircle2 },
  dismissed:  { label: 'Descartada',   bg: 'bg-slate-100 text-slate-600 border-slate-300',   icon: XCircle },
};

const REPORT_STATUS_FILTER_OPTIONS = [
  { value: 'pending',   label: 'Pendentes' },
  { value: 'reviewing', label: 'Em Revisão' },
  { value: 'resolved',  label: 'Resolvidas' },
  { value: 'dismissed', label: 'Descartadas' },
  { value: 'all',       label: 'Todos' },
];

// ─── Sub-componente: Formulário Usuário ──────────────────────────────────────
function UserFormDialog({ open, onOpenChange, onSubmit, loading, editUser = null }) {
  const isEdit = !!editUser;
  const [form, setForm] = useState({
    full_name:         editUser?.full_name         || '',
    email:             editUser?.email             || '',
    subscription_type: editUser?.subscription_type || 'Aluno Eleva',
    role:              editUser?.role              || 'user',
  });

  React.useEffect(() => {
    if (open) {
      setForm({
        full_name:         editUser?.full_name         || '',
        email:             editUser?.email             || '',
        subscription_type: editUser?.subscription_type || 'Aluno Eleva',
        role:              editUser?.role              || 'user',
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
            {isEdit ? <Pencil className="w-5 h-5 text-[#2f456d]" /> : <UserPlus className="w-5 h-5 text-[#2f456d]" />}
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
            <Label htmlFor="full_name" className="text-slate-700 dark:text-slate-200">Nome Completo</Label>
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
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email</Label>
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
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#2f456d] hover:bg-[#1a2d4a] text-white hover:text-white">
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isEdit ? 'Salvando...' : 'Adicionando...'}</>
              ) : (
                <>{isEdit ? <Pencil className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}{isEdit ? 'Salvar Alterações' : 'Adicionar Usuário'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-componente: Card de Report ──────────────────────────────────────────
function ReportCard({ report, onUpdate, onDelete, isAdmin, updatingId }) {
  const [expanded, setExpanded] = useState(false);
  const [adminNote, setAdminNote] = useState(report.admin_note || '');
  const cfg = REPORT_STATUS_CONFIG[report.status] || REPORT_STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const isBusy = updatingId === report.id;

  const handleStatusChange = (newStatus) => {
    onUpdate(report.id, { status: newStatus, admin_note: adminNote || undefined });
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
      {/* Header do card */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon className={`w-4 h-4 mt-1 shrink-0 ${
          report.status === 'pending'   ? 'text-amber-500' :
          report.status === 'reviewing' ? 'text-blue-500'  :
          report.status === 'resolved'  ? 'text-green-500' : 'text-slate-400'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={`${cfg.bg} border text-xs`}>{cfg.label}</Badge>
            {report.question?.discipline && (
              <Badge variant="outline" className="text-xs border-[#2f456d]/30 text-[#2f456d] dark:border-blue-400 dark:text-blue-300">
                {report.question.discipline}
              </Badge>
            )}
            {report.question?.code && (
              <span className="font-mono text-xs text-slate-400">#{report.question.code}</span>
            )}
          </div>

          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
            {report.reason}
          </p>

          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
            <span>
              Reportado por: <span className="font-medium text-slate-500 dark:text-slate-300">
                {report.reporter?.full_name || report.reporter?.email || 'Usuário'}
              </span>
            </span>
            <span>{new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
            {report.resolver && (
              <span>Resolvido por: <span className="font-medium">{report.resolver.full_name}</span></span>
            )}
          </div>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-800/50">
          {/* Texto da questão */}
          {report.question?.text && (
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Questão
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-4">
                {report.question.text}
              </p>
            </div>
          )}

          {/* Motivo completo */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
              Motivo do Report
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {report.reason}
            </p>
          </div>

          {/* Nota do admin */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Nota interna (opcional)
            </Label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Adicione uma nota sobre a correção feita..."
              rows={2}
              className="resize-none text-sm bg-white dark:bg-slate-800"
              disabled={isBusy}
            />
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            {report.status !== 'reviewing' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('reviewing')}
                disabled={isBusy}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {isBusy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Eye className="w-3 h-3 mr-1" />}
                Em Revisão
              </Button>
            )}
            {report.status !== 'resolved' && (
              <Button
                size="sm"
                onClick={() => handleStatusChange('resolved')}
                disabled={isBusy}
                className="bg-green-600 hover:bg-green-700 text-white hover:text-white"
              >
                {isBusy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                Marcar como Corrigida
              </Button>
            )}
            {report.status !== 'dismissed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('dismissed')}
                disabled={isBusy}
                className="border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                {isBusy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                Descartar
              </Button>
            )}
            {report.status !== 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('pending')}
                disabled={isBusy}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Clock className="w-3 h-3 mr-1" />
                Reabrir
              </Button>
            )}
            {isAdmin && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(report.id)}
                disabled={isBusy}
                className="ml-auto"
              >
                Excluir
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Admin() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('users');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');
  const [updatingReportId, setUpdatingReportId] = useState(null);

  const isProfessor = currentUser?.subscription_type === 'Professor';
  const isAdmin     = currentUser?.role === 'admin';

  // Redirecionar se não for admin nem professor
  React.useEffect(() => {
    if (currentUser && !isAdmin && !isProfessor) {
      navigate('/', { replace: true });
    }
  }, [currentUser, isAdmin, isProfessor, navigate]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.list(),
    staleTime: 30_000,
    retry: 1,
    enabled: isAdmin, // Somente admin vê usuários
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports', reportStatusFilter],
    queryFn: () => reportService.list(reportStatusFilter),
    staleTime: 15_000,
    retry: 1,
    enabled: activeTab === 'reports',
  });

  const { data: reportCounts = {} } = useQuery({
    queryKey: ['report-counts'],
    queryFn: () => reportService.counts(),
    staleTime: 30_000,
    retry: 1,
  });

  // ── Mutations: Usuários ────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => userService.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreateDialog(false);
      setSuccessMessage(`Usuário "${res.user?.full_name}" adicionado! Ele definirá a senha no primeiro acesso.`);
      toast.success('Usuário adicionado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 6000);
    },
    onError: (err) => toast.error(err.message || 'Erro ao criar usuário'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (err) => toast.error(err.message || 'Erro ao atualizar usuário'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => userService.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuário excluído com sucesso');
    },
    onError: () => toast.error('Erro ao excluir usuário'),
  });

  // ── Mutations: Reports ─────────────────────────────────────────────────────
  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }) => reportService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-counts'] });
      setUpdatingReportId(null);
      toast.success('Report atualizado!');
    },
    onError: (err) => {
      setUpdatingReportId(null);
      toast.error(err.message || 'Erro ao atualizar report');
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id) => reportService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-counts'] });
      toast.success('Report excluído');
    },
    onError: () => toast.error('Erro ao excluir report'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Tem certeza que deseja excluir "${userName}"?`)) {
      deleteMutation.mutate(userId);
    }
  };

  const handleUpdateReport = (id, data) => {
    setUpdatingReportId(id);
    updateReportMutation.mutate({ id, data });
  };

  const handleDeleteReport = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este report?')) {
      deleteReportMutation.mutate(id);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#2f456d] mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // ── Stats Usuários ─────────────────────────────────────────────────────────
  const statsAdmins     = users.filter(u => u.role === 'admin').length;
  const statsProfessors = users.filter(u => u.subscription_type === 'Professor').length;
  const statsAlunos     = users.filter(u => u.subscription_type === 'Aluno Eleva').length;

  const pendingReports  = reportCounts.pending  || 0;
  const reviewingReports = reportCounts.reviewing || 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-[#2f456d]" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2f456d] to-[#1a2d4a] dark:from-white dark:to-white bg-clip-text text-transparent">
              {isAdmin ? 'Administração' : 'Painel do Professor'}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            {isAdmin
              ? 'Gerencie usuários e questões reportadas'
              : 'Revise e corrija questões reportadas pelos alunos'}
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#2f456d] hover:bg-[#2f456d] text-white hover:text-white gap-2 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Usuário
          </Button>
        )}
      </div>

      {/* ── Mensagem de sucesso ── */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-fit">
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-700 text-[#2f456d] dark:text-blue-300 shadow'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários
            <Badge variant="secondary" className="text-xs">{users.length}</Badge>
          </button>
        )}

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-700 text-[#2f456d] dark:text-blue-300 shadow'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Flag className="w-4 h-4" />
          Questões Reportadas
          {(pendingReports + reviewingReports) > 0 && (
            <Badge className="text-xs bg-red-500 text-white border-0">
              {pendingReports + reviewingReports}
            </Badge>
          )}
        </button>
      </div>

      {/* ══════════════════════ TAB: USUÁRIOS ══════════════════════ */}
      {activeTab === 'users' && isAdmin && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total',        value: users.length,    color: 'blue',  icon: Users  },
              { label: 'Admins',       value: statsAdmins,     color: 'red',   icon: Shield },
              { label: 'Professores',  value: statsProfessors, color: 'sky',   icon: Users  },
              { label: 'Aluno Eleva',  value: statsAlunos,     color: 'green', icon: Users  },
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

          {/* Lista de usuários */}
          <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-[#2f456d]" />
                Usuários do Sistema
                <Badge variant="secondary" className="ml-1">{users.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#2f456d] animate-spin" />
                </div>
              ) : usersError ? (
                <div className="text-center py-8 text-red-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>{usersError.message}</p>
                </div>
              ) : users.length === 0 ? (
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
                        className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#2f456d]/30 dark:hover:border-[#2f456d]/30 transition-all gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">{u.full_name}</span>
                            {isCurrentUser && <Badge className="bg-[#2f456d] text-white text-xs">Você</Badge>}
                            {u.role === 'admin' && <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs">Admin</Badge>}
                            {u.subscription_type && <Badge className={`${badgeClass} border text-xs`}>{u.subscription_type}</Badge>}
                            {u.first_login && <Badge className="bg-amber-100 text-amber-700 border border-amber-300 text-xs">Aguardando 1º acesso</Badge>}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUser(u)}
                            className="border-[#2f456d]/40 text-[#2f456d] dark:text-blue-300 hover:bg-[#2f456d] hover:text-white dark:border-[#2f456d]/50 dark:hover:bg-[#2f456d]/50"
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
                  <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Informações Importantes</h4>
                  <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    <li>• Usuários adicionados aqui precisam fazer o primeiro login para definir a senha</li>
                    <li>• Professores podem criar e gerenciar questões na plataforma</li>
                    <li>• Alunos Eleva têm acesso completo à plataforma e ao E-Tutory IA</li>
                    <li>• Professores podem criar e revisar questões</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════════════════ TAB: REPORTS ══════════════════════ */}
      {activeTab === 'reports' && (
        <>
          {/* Stats reports */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pendentes',    value: reportCounts.pending   || 0, color: 'amber' },
              { label: 'Em Revisão',  value: reportCounts.reviewing  || 0, color: 'blue'  },
              { label: 'Resolvidas',  value: reportCounts.resolved   || 0, color: 'green' },
              { label: 'Descartadas', value: reportCounts.dismissed  || 0, color: 'slate' },
            ].map(({ label, value, color }) => (
              <Card key={label} className="bg-white/90 dark:bg-slate-800/90 shadow border-slate-200 dark:border-slate-700">
                <CardContent className="p-4">
                  <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtro de status */}
          <Card className="bg-white/90 dark:bg-slate-800/90 shadow border-slate-200 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {REPORT_STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setReportStatusFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      reportStatusFilter === opt.value
                        ? 'bg-[#2f456d] text-white border-[#2f456d]/30'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-[#2f456d]/30 hover:text-[#2f456d]'
                    }`}
                  >
                    {opt.label}
                    {opt.value === 'pending'   && reportCounts.pending   > 0 && (
                      <span className="ml-1.5 bg-white/30 text-inherit rounded-full px-1.5 text-xs">{reportCounts.pending}</span>
                    )}
                    {opt.value === 'reviewing' && reportCounts.reviewing > 0 && (
                      <span className="ml-1.5 bg-white/30 text-inherit rounded-full px-1.5 text-xs">{reportCounts.reviewing}</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lista de reports */}
          <Card className="bg-white/90 dark:bg-slate-800/90 shadow-lg border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Flag className="w-5 h-5 text-red-500" />
                Questões Reportadas
                <Badge variant="secondary">{reports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#2f456d] animate-spin" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-300 dark:text-green-700 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {reportStatusFilter === 'pending'
                      ? 'Nenhum report pendente!'
                      : 'Nenhum report encontrado para este filtro'}
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    {reportStatusFilter === 'pending' && 'Ótimo! Todas as questões estão sem pendências.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onUpdate={handleUpdateReport}
                      onDelete={handleDeleteReport}
                      isAdmin={isAdmin}
                      updatingId={updatingReportId}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Dialogs Usuário ── */}
      <UserFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={(form) => createMutation.mutate(form)}
        loading={createMutation.isPending}
      />
      <UserFormDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={(form) => updateMutation.mutate({ id: editingUser.id, data: { full_name: form.full_name, subscription_type: form.subscription_type, role: form.role } })}
        loading={updateMutation.isPending}
        editUser={editingUser}
      />
    </div>
  );
}

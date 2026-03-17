import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ExternalLink, CheckCircle, GraduationCap } from 'lucide-react';

export default function Login() {
  const [step, setStep] = useState(1); // 1 = Email, 2 = Senha/Criar Senha, 3 = Convite
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.checkEmail(email);
      if (!result.exists) {
        setStep(3);
        setInviteMessage(result.message);
        setJoinUrl(result.joinUrl);
        setLoading(false);
        return;
      }
      setUserData(result);
      setIsFirstLogin(result.first_login);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Erro ao verificar email');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== passwordConfirm) {
      setError('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      await authService.setPassword(email, password, passwordConfirm);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao definir senha');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setPassword('');
    setPasswordConfirm('');
    setError('');
    setUserData(null);
    setIsFirstLogin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2f456d]/5 via-blue-50 to-orange-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-4">
          <div className="flex justify-center">
            <img
              src="/logo.svg"
              alt="E-Questões"
              className="h-16 w-auto object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-[#2f456d] dark:text-white">
              Bem-vindo ao E-Questões
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {step === 1 && 'Plataforma de estudos para concursos públicos'}
              {step === 2 && !isFirstLogin && 'Digite sua senha para continuar'}
              {step === 2 && isFirstLogin && 'Primeiro acesso — Defina sua senha'}
              {step === 3 && 'Acesso Restrito'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* ETAPA 1: Verificar Email */}
          {step === 1 && (
            <form onSubmit={handleCheckEmail} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-[#2f456d] hover:bg-[#243756] text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : 'Continuar'}
              </Button>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
                Acesso exclusivo para alunos cadastrados
              </p>
            </form>
          )}

          {/* ETAPA 2A: Definir Senha (Primeiro Acesso) */}
          {step === 2 && isFirstLogin && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Olá, <strong>{userData?.full_name}</strong>!<br />
                  Este é seu primeiro acesso. Por favor, defina uma senha para sua conta.
                </AlertDescription>
              </Alert>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} disabled className="h-11 bg-slate-100 dark:bg-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-confirm">Confirmar Senha</Label>
                <Input
                  id="password-confirm"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="h-11">
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-[#2f456d] hover:bg-[#243756] text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando senha...</>
                  ) : 'Criar Senha e Entrar'}
                </Button>
              </div>
            </form>
          )}

          {/* ETAPA 2B: Login (Não é Primeiro Acesso) */}
          {step === 2 && !isFirstLogin && (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} disabled className="h-11 bg-slate-100 dark:bg-slate-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-11"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="h-11">
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-[#2f456d] hover:bg-[#243756] text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</>
                  ) : 'Entrar'}
                </Button>
              </div>
            </form>
          )}

          {/* ETAPA 3: Convite (Email não cadastrado) */}
          {step === 3 && (
            <div className="space-y-4">
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {inviteMessage}
                </AlertDescription>
              </Alert>

              <div className="p-6 bg-gradient-to-br from-[#2f456d]/5 to-[#f26836]/5 dark:from-[#2f456d]/20 dark:to-[#f26836]/10 rounded-lg border-2 border-dashed border-[#2f456d]/30 dark:border-[#2f456d]/50 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2f456d] to-[#f26836] rounded-full flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Faça parte do E-Questões!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Tenha acesso à plataforma completa de estudos:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-left max-w-xs mx-auto">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Milhares de questões comentadas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>E-Tutory — IA para tirar dúvidas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Flashcards com revisão espaçada</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Estatísticas e ranking de desempenho</span>
                    </li>
                  </ul>
                </div>
                {joinUrl && (
                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#f26836] hover:bg-[#d9561f] text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Quero me inscrever
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <Button type="button" variant="outline" onClick={handleBack} className="w-full h-11">
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

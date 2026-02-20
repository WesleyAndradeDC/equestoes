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
  // Estados do formulário
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

  // ETAPA 1: Verificar Email
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.checkEmail(email);
      
      // Email não existe - mostrar convite
      if (!result.exists) {
        setStep(3);
        setInviteMessage(result.message);
        setJoinUrl(result.joinUrl);
        setLoading(false);
        return;
      }

      // Email existe
      setUserData(result);
      setIsFirstLogin(result.first_login);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Erro ao verificar email');
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 2A: Definir Senha (Primeiro Acesso)
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
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

  // ETAPA 2B: Login (Não é Primeiro Acesso)
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

  // Voltar para o passo 1
  const handleBack = () => {
    setStep(1);
    setPassword('');
    setPasswordConfirm('');
    setError('');
    setUserData(null);
    setIsFirstLogin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img 
              src="https://gramatiquecursos.com/wp-content/uploads/2024/02/gramatique-lilas.svg" 
              alt="Gramatique" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#8F39D8] to-[#5B2C8E] dark:from-white dark:to-white bg-clip-text text-transparent font-montserrat">
              G CONCURSOS
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {step === 1 && 'Plataforma de questões do Gramatique'}
              {step === 2 && !isFirstLogin && 'Digite sua senha para continuar'}
              {step === 2 && isFirstLogin && 'Primeiro acesso - Defina sua senha'}
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
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
                  Acesso exclusivo para alunos Gramatique
                </p>
              </div>
            </form>
          )}

          {/* ETAPA 2A: Definir Senha (Primeiro Acesso) */}
          {step === 2 && isFirstLogin && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Olá, <strong>{userData?.full_name}</strong>! <br />
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
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="h-11 bg-slate-100 dark:bg-slate-700"
                />
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="h-11"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando senha...
                    </>
                  ) : (
                    'Criar Senha e Entrar'
                  )}
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
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="h-11 bg-slate-100 dark:bg-slate-700"
                />
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="h-11"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
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

              <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-700 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Faça parte do Gramatique!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Junte-se ao <strong>Clube do Pedrão</strong> ou <strong>Clube dos Cascas</strong> e tenha acesso a:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 text-left max-w-xs mx-auto">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Milhares de questões comentadas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Tutor IA para tirar dúvidas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Estatísticas de desempenho</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Ranking entre alunos</span>
                    </li>
                  </ul>
                </div>

                <a 
                  href={joinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Conhecer o Gramatique
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="w-full h-11"
              >
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

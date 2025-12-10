import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2, User, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TutorGramatique() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      // Verificar acesso: admin, Professor ou Aluno Clube dos Cascas
      const allowedProfiles = ['Professor', 'Aluno Clube dos Cascas'];
      const isAllowed = u.role === 'admin' || allowedProfiles.includes(u.subscription_type);
      setHasAccess(isAllowed);
    }).catch(() => {
      setHasAccess(false);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildPrompt = (history, newMessage) => {
    const systemPrompt = `Você é o Tutor Gramatique, um assistente especializado em TODAS as matérias de concursos públicos brasileiros. Seu papel é:

1. Responder dúvidas sobre Língua Portuguesa (gramática, ortografia, interpretação de texto, redação)
2. Ajudar com Matemática e Raciocínio Lógico
3. Explicar conceitos de Direito Constitucional, Administrativo, Penal e Processual Penal
4. Esclarecer dúvidas sobre Informática, Atualidades e Ética no Serviço Público
5. Auxiliar em Administração Pública, AFO, Contabilidade, Arquivologia
6. Ajudar com Direitos Humanos, Legislação Especial e Conhecimentos Bancários

Seja didático, use exemplos práticos e responda de forma clara e objetiva. Responda sempre em português brasileiro.`;

    let conversationHistory = history.map(msg => 
      `${msg.role === 'user' ? 'Aluno' : 'Tutor'}: ${msg.content}`
    ).join('\n\n');

    return `${systemPrompt}\n\n${conversationHistory ? conversationHistory + '\n\n' : ''}Aluno: ${newMessage}\n\nTutor:`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const prompt = buildPrompt(messages, userMessage);
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Quando usar crase?",
    "Explique os princípios da Administração Pública",
    "Como calcular porcentagem?",
    "O que são Direitos Fundamentais?"
  ];

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Acesso Restrito
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          O Tutor Gramatique está disponível apenas para alunos do <strong>Clube dos Cascas</strong> e <strong>Professores</strong>.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Entre em contato para fazer upgrade do seu plano.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-white dark:to-white bg-clip-text text-transparent">
            Tutor Gramatique
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Seu assistente especializado em todas as matérias de concursos públicos
        </p>
      </div>

      {/* Chat Container */}
      <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl border-slate-200 dark:border-slate-700 min-h-[500px] flex flex-col">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Chat com o Tutor
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[400px]">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    Olá, {user?.full_name?.split(' ')[0]}! Sou o Tutor Gramatique.
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Estou aqui para ajudar com suas dúvidas em todas as matérias de concursos!
                  </p>
                </div>

                {/* Sugestões de perguntas */}
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Sugestões para começar
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputMessage(question)}
                        className="text-sm px-3 py-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-700"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p>{msg.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-slate-500 dark:text-slate-400">Digitando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite sua dúvida de português..."
                className="flex-1 dark:bg-slate-700 dark:border-slate-600"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
              Pressione Enter para enviar ou clique no botão
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                O que o Tutor Gramatique pode fazer?
              </h4>
              <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <li>• Tirar dúvidas de Português, Matemática e Raciocínio Lógico</li>
                <li>• Explicar conceitos de Direito (Constitucional, Administrativo, Penal)</li>
                <li>• Ajudar com Informática, AFO e Contabilidade</li>
                <li>• Esclarecer temas de Atualidades e Ética no Serviço Público</li>
                <li>• Auxiliar em todas as disciplinas de concursos públicos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
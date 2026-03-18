import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Brain, Send, Loader2, User, BookOpen, AlertCircle, Sparkles,
  MessageSquare, Lightbulb, ChevronRight, RotateCcw, Copy, Check,
  GraduationCap, Calculator, Scale, Monitor, Globe, Shield,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_TOPICS = [
  { icon: BookOpen, label: 'Português', question: 'Quando usar crase?', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { icon: Calculator, label: 'Matemática', question: 'Como calcular porcentagem?', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { icon: Scale, label: 'Direito', question: 'Princípios da Administração Pública', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  { icon: Shield, label: 'Constitucional', question: 'O que são Direitos Fundamentais?', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { icon: Monitor, label: 'Informática', question: 'O que é cloud computing?', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
  { icon: Globe, label: 'Atualidades', question: 'Como estudar atualidades para concursos?', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
];

const CAPABILITIES = [
  { icon: BookOpen, text: 'Português, Redação e Interpretação de Texto' },
  { icon: Calculator, text: 'Matemática, Raciocínio Lógico e Financeiro' },
  { icon: Scale, text: 'Direito Constitucional, Administrativo e Penal' },
  { icon: Monitor, text: 'Informática e Conhecimentos Bancários' },
  { icon: GraduationCap, text: 'AFO, Contabilidade e Arquivologia' },
  { icon: Globe, text: 'Atualidades, Ética e Legislação Especial' },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      title="Copiar"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function ETutory() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      const allowed = ['Professor', 'Aluno Eleva'];
      setHasAccess(u.role === 'admin' || allowed.includes(u.subscription_type));
    }).catch(() => setHasAccess(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildPrompt = (history, newMessage) => {
    const sys = `Você é o E-Tutory, assistente de IA da plataforma E-Questões, especializado em TODAS as matérias de concursos públicos brasileiros. Seu papel é:
1. Responder dúvidas sobre Língua Portuguesa (gramática, ortografia, interpretação, redação)
2. Ajudar com Matemática e Raciocínio Lógico
3. Explicar conceitos de Direito Constitucional, Administrativo, Penal e Processual
4. Esclarecer dúvidas sobre Informática, Atualidades e Ética no Serviço Público
5. Auxiliar em AFO, Contabilidade, Arquivologia e Conhecimentos Bancários
6. Ajudar com Direitos Humanos e Legislação Especial
Seja didático, use exemplos práticos e responda sempre em português brasileiro.`;
    const conv = history.map(m => `${m.role === 'user' ? 'Aluno' : 'E-Tutory'}: ${m.content}`).join('\n\n');
    return `${sys}\n\n${conv ? conv + '\n\n' : ''}Aluno: ${newMessage}\n\nE-Tutory:`;
  };

  const handleSend = async (msg) => {
    const text = (msg || inputMessage).trim();
    if (!text || isLoading) return;
    setInputMessage('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const prompt = buildPrompt(messages, text);
      const response = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.' }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = () => setMessages([]);

  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#2f456d] animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-[#2f456d] to-[#1a2d4a] flex items-center justify-center shadow-xl">
          <Brain className="w-12 h-12 text-[#f26836]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">E-Tutory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Assistente de IA para concursos</p>
        </div>
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-5 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
            <p className="font-semibold text-amber-800 dark:text-amber-200">Acesso Restrito</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              O E-Tutory está disponível para os planos <strong>Aluno Eleva</strong> e <strong>Professor</strong>.
            </p>
          </CardContent>
        </Card>
        <p className="text-sm text-slate-500">Entre em contato para fazer upgrade do seu plano.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-[#2f456d] via-[#243756] to-[#1a2d4a] px-6 pt-6 pb-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-3 right-10 w-32 h-32 rounded-full border-2 border-white/40" />
          <div className="absolute -bottom-4 right-4 w-48 h-48 rounded-full border border-white/20" />
        </div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-[#f26836]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">E-Tutory</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-blue-200 text-sm">IA online • Especialista em concursos</p>
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20 gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Nova conversa</span>
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-white dark:bg-slate-800 border-x border-slate-200 dark:border-slate-700">
        <div className="h-[420px] overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-6">
              {/* Welcome */}
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2f456d]/10 dark:bg-[#2f456d]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="w-4.5 h-4.5 text-[#2f456d] dark:text-blue-300 w-[18px] h-[18px]" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    Olá{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! Sou o E-Tutory 🧠
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Estou aqui para tirar suas dúvidas sobre qualquer matéria de concursos públicos. Como posso te ajudar hoje?
                  </p>
                </div>
              </div>

              {/* Suggested topics */}
              <div>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Perguntas populares
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUGGESTED_TOPICS.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(t.question)}
                      className={`text-left p-3 rounded-xl border text-xs font-medium transition-all hover:shadow-sm hover:scale-[1.01] ${t.color}`}
                    >
                      <t.icon className="w-4 h-4 mb-1.5" />
                      <p className="font-semibold">{t.label}</p>
                      <p className="opacity-80 mt-0.5 line-clamp-1">{t.question}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-[#2f456d]/10 dark:bg-[#2f456d]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Brain className="w-[18px] h-[18px] text-[#2f456d] dark:text-blue-300" />
                </div>
              )}
              <div className={`relative max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#2f456d] text-white rounded-tr-sm'
                  : 'bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-slate-100 rounded-tl-sm'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sm">
                    {msg.content}
                  </ReactMarkdown>
                )}
                {msg.role === 'assistant' && (
                  <div className="absolute -bottom-1 -right-1">
                    <CopyButton text={msg.content} />
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-[#f26836]/10 dark:bg-[#f26836]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-[#f26836]" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2f456d]/10 dark:bg-[#2f456d]/30 flex items-center justify-center shrink-0">
                <Brain className="w-[18px] h-[18px] text-[#2f456d] dark:text-blue-300" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2f456d]/50 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-[#2f456d]/50 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-[#2f456d]/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex gap-2.5">
            <div className="flex-1 relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Qual sua dúvida sobre concursos?"
                className="pl-9 pr-3 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus-visible:ring-[#2f456d]/30 rounded-xl"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-[#f26836] hover:bg-[#d9561f] text-white rounded-xl px-4 shadow-sm shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Pressione <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-[10px] font-mono">Enter</kbd> para enviar
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-2xl p-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#f26836]" />
          O que o E-Tutory pode fazer
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CAPABILITIES.map((c, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-[#2f456d]/8 dark:bg-[#2f456d]/20 flex items-center justify-center shrink-0">
                <c.icon className="w-3.5 h-3.5 text-[#2f456d] dark:text-blue-400" />
              </div>
              {c.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

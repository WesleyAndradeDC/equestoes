import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TutorChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      // Verificar acesso: admin, Professor ou Aluno Clube dos Cascas
      const allowedProfiles = ['Professor', 'Aluno Clube dos Cascas'];
      const isAllowed = u.role === 'admin' || allowedProfiles.includes(u.subscription_type);
      setHasAccess(isAllowed);
    }).catch(() => {});
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

  if (!user || !hasAccess) {
    return null;
  }

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-10 right-0 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Tutor Gramatique
          </span>
        </button>
      )}

      {/* Popup do Chat */}
      {isOpen && (
        <Card className={`fixed z-50 bg-white dark:bg-slate-900 shadow-2xl border-purple-200 dark:border-purple-700 transition-all ${
          isMinimized 
            ? 'bottom-24 right-6 w-72 h-14' 
            : 'bottom-24 right-6 w-96 h-[500px] max-h-[70vh]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">Tutor Gramatique</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Área de mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-120px)]">
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                    <p className="font-medium">Olá! Sou o Tutor Gramatique.</p>
                    <p className="text-sm mt-1">Como posso ajudar com seus estudos para concursos?</p>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Digite sua dúvida..."
                    className="flex-1 dark:bg-slate-800 dark:border-slate-600"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
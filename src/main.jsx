import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@/index.css'

// ── PWA: Filtrar prompt de instalação apenas para mobile e tablet ─────────────
// O evento `beforeinstallprompt` é disparado pelo Chrome/Android quando o app
// atende aos critérios de PWA. Aqui interceptamos e suprimimos no desktop,
// deixando passar apenas para dispositivos móveis/tablets.
//
// iOS Safari não dispara este evento — o usuário acessa via:
//   Share (quadrado com seta) → "Adicionar à Tela de Início"
// Esse comportamento é nativo do iOS e não pode ser alterado por código.
window.addEventListener('beforeinstallprompt', (e) => {
  const ua = navigator.userAgent;

  // Detecta mobile/tablet pelos padrões comuns de User-Agent
  const isMobileOrTablet =
    /Android|iPhone|iPad|iPod/i.test(ua) ||
    // iPad com iOS 13+ reporta-se como "Macintosh" mas tem touchpoints
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));

  if (!isMobileOrTablet) {
    // Desktop: cancela o prompt nativo (nenhum ícone de instalação no Chrome)
    e.preventDefault();
  }
  // Mobile/tablet: não faz nada → o browser exibe o banner/prompt nativo
});

// Create a client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
)

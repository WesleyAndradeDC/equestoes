# FRONTEND_SETUP.md — E-Questões Frontend

Documentação técnica do frontend da plataforma E-Questões.

---

## Stack

- **Framework:** React 18 + Vite 6
- **Estilos:** Tailwind CSS + shadcn/ui (Radix UI)
- **Roteamento:** React Router v7
- **Estado/Cache:** React Query v5
- **Gráficos:** Recharts
- **Animações:** Framer Motion
- **Ícones:** Lucide React
- **Tipografia:** Poppins (Google Fonts)
- **PWA:** vite-plugin-pwa

---

## Estrutura de Diretórios

```
src/
├── api/
│   ├── apiAdapter.js     — Adapter de compatibilidade base44 → services
│   ├── base44Client.js   — Re-exporta base44 do adapter
│   └── entities.js       — Entidades do base44 (legado)
├── components/
│   ├── flashcards/
│   │   └── FlashcardStudyMode.jsx   — Modo de revisão Anki SM-2
│   ├── questions/
│   │   ├── QuestionCard.jsx
│   │   ├── FilterPanel.jsx
│   │   ├── CommentSection.jsx
│   │   └── ReportModal.jsx
│   ├── tutor/
│   │   └── TutorChatPopup.jsx
│   ├── ui/               — Componentes shadcn/ui
│   ├── ProtectedRoute.jsx
│   ├── SkeletonCard.jsx
│   └── StreakBanner.jsx
├── config/
│   └── api.js            — URLs e endpoints da API
├── contexts/
│   └── AuthContext.jsx   — Contexto global de autenticação
├── hooks/
│   └── use-mobile.jsx
├── lib/
│   ├── apiClient.js      — Axios com interceptors de auth
│   └── utils.js          — Utilitários (cn, etc.)
├── pages/
│   ├── Layout.jsx        — Layout principal com navbar
│   ├── Home.jsx          — Painel inicial
│   ├── Login.jsx         — Autenticação
│   ├── Questions.jsx     — E-Questões (resolver questões)
│   ├── Notebooks.jsx     — Meus Cadernos
│   ├── Stats.jsx         — Estatísticas
│   ├── Flashcards.jsx    — Módulo de Flashcards
│   ├── ETutory.jsx       — E-Tutory (IA)
│   ├── Ranking.jsx       — Ranking
│   ├── Admin.jsx         — Painel Admin
│   ├── CreateQuestion.jsx
│   ├── ReviewQuestion.jsx
│   └── index.jsx         — Roteamento central
├── services/             — Camada de comunicação com a API
│   ├── authService.js
│   ├── questionService.js
│   ├── notebookService.js
│   ├── attemptService.js
│   ├── tutorService.js
│   └── userService.js
├── styles/
└── index.css             — Design system (variáveis CSS Eleva)
```

---

## Rotas

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/login` | Login | Público |
| `/` ou `/home` | Home | Auth |
| `/questions` | Questions | Auth |
| `/notebooks` | Notebooks | Auth |
| `/stats` | Stats | Auth |
| `/flashcards` | Flashcards | Auth |
| `/ranking` | Ranking | Auth |
| `/etutory` | ETutory | Auth + Plano Cascas/Professor |
| `/createquestion` | CreateQuestion | Professor/Admin |
| `/reviewquestion` | ReviewQuestion | Professor/Admin |
| `/admin` | Admin | Admin |

---

## Design System

### Cores Eleva
```css
--eleva-primary: #2f456d   /* Azul principal */
--eleva-orange:  #f26836   /* Laranja CTA */
--eleva-black:   #4d4d4e   /* Preto */
--eleva-white:   #e6e6e6   /* Background */
```

### Tipografia
```css
font-family: 'Poppins', system-ui, sans-serif;
/* Pesos: 300, 400, 500, 600, 700, 800 */
```

---

## Variável de Ambiente

Crie `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Scripts npm

```bash
npm run dev       # Desenvolvimento (porta 5173)
npm run build     # Build de produção (gera /dist)
npm run preview   # Pré-visualizar build local
npm run lint      # Verificar erros de código
```

---

## Deploy no Render

1. Conecte o repositório no Render
2. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Adicione a variável:
   - `VITE_API_BASE_URL` = `https://e-questoes-api.onrender.com/api`
4. O `render.yaml` na raiz configura isso automaticamente

---

## PWA

O app é instalável como PWA (Progressive Web App):
- Nome: E-Questões
- Tema: `#2f456d` (Azul Eleva)
- Modo: Standalone (sem barra de endereço)
- Cache: Fonts e assets estáticos com CacheFirst
- API: NetworkOnly (sem cache)

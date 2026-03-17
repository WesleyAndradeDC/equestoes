# BACKEND_SETUP.md — E-Questões API

Documentação técnica do backend da plataforma E-Questões.

---

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **ORM:** Prisma 5 + PostgreSQL
- **Auth:** JWT stateless (access 7d + refresh 30d)
- **IA:** OpenAI GPT-4o-mini
- **Segurança:** Helmet, CORS, express-rate-limit

---

## Estrutura de Diretórios

```
backend/
├── prisma/
│   ├── schema.prisma     — Modelos do banco de dados
│   └── seed.js           — Dados iniciais (opcional)
├── src/
│   ├── config/
│   │   └── database.js   — Instância singleton do PrismaClient
│   ├── controllers/      — Lógica de negócio
│   │   ├── authController.js
│   │   ├── questionController.js
│   │   ├── notebookController.js
│   │   ├── attemptController.js
│   │   ├── tutorController.js
│   │   ├── flashcardController.js
│   │   ├── rankingController.js
│   │   ├── reportController.js
│   │   ├── userController.js
│   │   └── webhookController.js
│   ├── middlewares/
│   │   └── auth.js       — authenticate, requireAdmin, requireActiveSubscription
│   ├── routes/           — Definição de endpoints
│   │   ├── auth.js
│   │   ├── questions.js
│   │   ├── notebooks.js
│   │   ├── attempts.js
│   │   ├── comments.js
│   │   ├── tutor.js
│   │   ├── flashcards.js
│   │   ├── ranking.js
│   │   ├── reports.js
│   │   ├── users.js
│   │   └── webhook.js
│   └── index.js          — Ponto de entrada
├── .env.example
├── package.json
└── render.yaml
```

---

## Endpoints da API

### Autenticação — `/api/auth`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/login` | Público | Login com email + senha |
| POST | `/check-email` | Público | Verifica se email existe |
| POST | `/set-password` | Público | Define senha (primeiro acesso) |
| POST | `/refresh` | Público | Renova tokens |
| GET | `/me` | Auth | Dados do usuário logado |
| PUT | `/me` | Auth | Atualiza perfil |
| POST | `/logout` | Auth | Logout |

### Questões — `/api/questions`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/filters` | Auth+Sub | Filtros disponíveis |
| GET | `/` | Auth+Sub | Listar questões |
| GET | `/:id` | Auth+Sub | Buscar questão |
| POST | `/` | Professor/Admin | Criar questão |
| PUT | `/:id` | Professor/Admin | Atualizar questão |
| DELETE | `/:id` | Professor/Admin | Deletar questão |

### Flashcards — `/api/flashcards`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/due` | Auth+Sub | Cards pendentes para hoje (SM-2) |
| GET | `/` | Auth+Sub | Listar flashcards (próprios + globais) |
| POST | `/` | Auth+Sub | Criar flashcard |
| PUT | `/:id` | Auth+Sub | Atualizar flashcard (dono/admin) |
| DELETE | `/:id` | Auth+Sub | Deletar flashcard (dono/admin) |
| POST | `/:id/review` | Auth+Sub | Registrar revisão SM-2 |

### Notebooks — `/api/notebooks`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/` | Auth+Sub | Listar cadernos |
| GET | `/:id` | Auth+Sub | Buscar caderno |
| POST | `/` | Auth+Sub | Criar caderno |
| PUT | `/:id` | Auth+Sub | Atualizar caderno |
| DELETE | `/:id` | Auth+Sub | Deletar caderno |

---

## Algoritmo Anki SM-2

O módulo de Flashcards implementa o algoritmo SuperMemo 2 (SM-2):

```
quality: 0 = Errei | 3 = Difícil | 4 = Bom | 5 = Fácil

novo_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
ease_factor_mínimo = 1.3

se quality < 3:
  repetitions = 0
  interval = 1
senão:
  repetitions += 1
  se repetitions == 1: interval = 1
  se repetitions == 2: interval = 6
  senão: interval = round(interval_atual * ease_factor)

due_date = hoje + interval (dias)
```

---

## Variáveis de Ambiente

Crie `backend/.env` com base em `backend/.env.example`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:senha@localhost:5432/equestoes
JWT_SECRET=chave_secreta_minimo_32_chars
JWT_REFRESH_SECRET=chave_refresh_minimo_32_chars
OPENAI_API_KEY=sk-proj-...
FRONTEND_URL=http://localhost:5173
WC_WEBHOOK_SECRET=opcional_para_woocommerce
```

---

## Scripts npm

```bash
npm run dev          # Desenvolvimento com nodemon
npm start            # Produção
npm run prisma:generate   # Gera o Prisma Client
npm run prisma:migrate    # Cria nova migration
npm run prisma:deploy     # Aplica migrations em produção
npm run prisma:studio     # Interface visual do banco
npm run prisma:seed       # Popula dados iniciais
npm run setup             # Tudo: install + generate + migrate + seed
```

---

## Controle de Acesso

| Middleware | Regra |
|------------|-------|
| `authenticate` | Valida JWT Bearer token |
| `requireAdmin` | role === 'admin' |
| `requireProfessor` | role === 'admin' OU subscription_type === 'Professor' |
| `requireActiveSubscription` | Admin OU subscription_status ativo |

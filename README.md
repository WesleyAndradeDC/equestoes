# E-Questões

Plataforma SaaS completa para estudos e preparação para concursos públicos.

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Painel Inicial** | Dashboard com métricas, streak de estudos e gráficos de desempenho |
| **E-Questões** | Resolução de questões com filtros por disciplina, assunto, dificuldade e tipo |
| **Meus Cadernos** | Criação e gerenciamento de cadernos personalizados de questões |
| **Estatísticas** | Dashboard analítico completo com gráficos e comparativos de período |
| **Flashcards** | Sistema de revisão espaçada com algoritmo Anki (SM-2) — próprios + globais |
| **E-Tutory** | Chat com IA (GPT-4o-mini) especializado em concursos públicos |
| **Ranking** | Ranking de alunos por pontuação, segmentado por categoria |
| **Admin** | Painel administrativo para gestão de usuários e reports de questões |

## Stack Tecnológica

### Frontend
- React 18 + Vite 6
- Tailwind CSS + shadcn/ui (Radix UI)
- React Router v7
- React Query v5 (cache e estados assíncronos)
- Recharts (gráficos)
- Framer Motion (animações)
- Lucide React (ícones)
- Poppins (tipografia)
- PWA (instalável)

### Backend
- Node.js + Express 4
- Prisma ORM + PostgreSQL
- JWT (access 7d + refresh 30d)
- OpenAI GPT-4o-mini (E-Tutory)
- Helmet + CORS + Rate Limiting
- WooCommerce Webhooks (integração de pagamentos)

### Banco de Dados
- PostgreSQL (Render)
- Prisma Migrations

## Identidade Visual

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul Eleva | `#2f456d` | Cor principal, botões, navbar |
| Laranja Eleva | `#f26836` | Call-to-action, destaques |
| Preto Eleva | `#4d4d4e` | Textos secundários |
| Branco Eleva | `#e6e6e6` | Backgrounds |

**Fonte:** Poppins (Google Fonts)

## Início Rápido

### Pré-requisitos
- Node.js 18+
- PostgreSQL (local ou Render)

### Frontend

```bash
# Instalar dependências
npm install

# Configurar variável de ambiente
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# Iniciar em desenvolvimento
npm run dev
```

### Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente (copie o .env.example)
cp .env.example .env
# Edite o .env com suas credenciais

# Gerar o Prisma Client
npm run prisma:generate

# Rodar as migrações
npm run prisma:migrate

# Iniciar em desenvolvimento
npm run dev
```

## Variáveis de Ambiente

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (`.env`)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/equestoes
JWT_SECRET=sua_chave_secreta_aqui
JWT_REFRESH_SECRET=sua_chave_refresh_aqui
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:5173
```

## Deploy no Render

Veja [MIGRATION.md](MIGRATION.md) para o passo a passo completo de deploy.

## Documentação

- [MIGRATION.md](MIGRATION.md) — Passo a passo de migração e deploy
- [BACKEND_SETUP.md](BACKEND_SETUP.md) — Configuração detalhada do backend
- [FRONTEND_SETUP.md](FRONTEND_SETUP.md) — Configuração detalhada do frontend
- [DATABASE.sql](DATABASE.sql) — SQL completo do banco de dados

## Licença

Propriedade privada — Todos os direitos reservados © 2025 E-Questões

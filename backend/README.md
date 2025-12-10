# G-Concursos Backend API

Backend API para o sistema G-Concursos Gramatique, construído com Express.js, Prisma e PostgreSQL.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **OpenAI API** - Integração com LLM para o Tutor

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e rodando
- Conta OpenAI (para o Tutor Gramatique)

## 🔧 Instalação

1. **Instale as dependências:**
```bash
cd backend
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gconcursos"
JWT_SECRET="sua-chave-secreta-jwt"
JWT_REFRESH_SECRET="sua-chave-secreta-refresh"
PORT=5000
OPENAI_API_KEY="sua-chave-openai"
FRONTEND_URL="http://localhost:5173"
```

3. **Execute as migrações do Prisma:**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. **Inicie o servidor:**
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

## 📚 Endpoints da API

### Autenticação (`/api/auth`)

- `POST /register` - Registrar novo usuário
- `POST /login` - Login
- `GET /me` - Obter usuário atual (autenticado)
- `PUT /me` - Atualizar usuário atual
- `POST /logout` - Logout
- `POST /refresh` - Renovar token

### Questões (`/api/questions`)

- `GET /` - Listar questões (suporta filtros)
- `GET /:id` - Obter questão específica
- `POST /` - Criar questão (Professor/Admin)
- `PUT /:id` - Atualizar questão (Professor/Admin)
- `DELETE /:id` - Deletar questão (Professor/Admin)

### Tentativas (`/api/attempts`)

- `GET /` - Listar tentativas
- `POST /` - Criar tentativa
- `GET /me` - Obter tentativas do usuário logado

### Cadernos (`/api/notebooks`)

- `GET /` - Listar cadernos (suporta filtro por created_by)
- `GET /:id` - Obter caderno específico
- `POST /` - Criar caderno
- `PUT /:id` - Atualizar caderno
- `DELETE /:id` - Deletar caderno

### Comentários (`/api/comments`)

- `GET /` - Listar comentários (suporta filtro por question_id)
- `POST /` - Criar comentário
- `DELETE /:id` - Deletar comentário

### Usuários (`/api/users`) - Admin apenas

- `GET /` - Listar usuários
- `GET /:id` - Obter usuário específico
- `PUT /:id` - Atualizar usuário
- `DELETE /:id` - Deletar usuário

### Tutor (`/api/tutor`)

- `POST /invoke` - Invocar LLM (Professor/Admin/Aluno Clube dos Cascas)

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

## 🗄️ Modelo de Dados

### User
- `id`, `email`, `password_hash`, `full_name`
- `role` (user/admin)
- `subscription_type` (Professor, Aluno Clube dos Cascas, Aluno Clube do Pedrão)
- `study_streak`, `last_study_date`

### Question
- `id`, `code`, `text`, `discipline`, `difficulty`
- `exam_board`, `year`, `position`
- `option_a` a `option_e`, `correct_answer`, `explanation`
- `question_type`, `subjects[]`

### Attempt
- `id`, `question_id`, `user_id`
- `chosen_answer`, `is_correct`, `answered_at`

### Notebook
- `id`, `name`, `description`, `color`
- `created_by` (email)
- `question_ids[]` (através de NotebookQuestion)

### Comment
- `id`, `question_id`, `user_id`
- `text`, `author_name`, `author_role`

## 🚢 Deploy no Render

1. **Crie um banco PostgreSQL no Render**

2. **Crie um Web Service no Render:**
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`

3. **Configure as variáveis de ambiente no Render:**
   - `DATABASE_URL` (do banco PostgreSQL)
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `OPENAI_API_KEY`
   - `FRONTEND_URL` (URL do frontend no Render)
   - `NODE_ENV=production`

## 📝 Scripts Úteis

```bash
# Desenvolvimento com hot reload
npm run dev

# Produção
npm start

# Gerar Prisma Client
npm run prisma:generate

# Criar migração
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio

# Deploy migrações (produção)
npm run prisma:deploy
```

## 🔒 Permissões

- **Admin**: Acesso total ao sistema
- **Professor**: Criar/editar questões, acessar tutor
- **Aluno Clube dos Cascas**: Acesso completo, incluindo tutor
- **Aluno Clube do Pedrão**: Acesso restrito a Língua Portuguesa

## 📄 Licença

ISC


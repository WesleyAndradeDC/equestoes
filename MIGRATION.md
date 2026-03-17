# MIGRATION.md — E-Questões

Guia completo de migração e deploy da plataforma E-Questões no Render.

---

## Pré-requisitos

- Conta no [Render](https://render.com)
- Conta no [GitHub](https://github.com)
- Node.js 18+ instalado localmente
- Repositório: `https://github.com/WesleyAndradeDC/equestoes`

---

## Etapa 1 — Banco de Dados PostgreSQL no Render

1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Clique em **New → PostgreSQL**
3. Configure:
   - **Name:** `e-questoes-db`
   - **Database:** `equestoes`
   - **Region:** Oregon (US West)
   - **Plan:** Free
4. Clique em **Create Database**
5. Copie a **Connection String** (External URL) — você vai usar na variável `DATABASE_URL`

---

## Etapa 2 — Executar o SQL do Banco

### Opção A: Via psql (linha de comando)
```bash
psql "sua_connection_string_aqui" -f DATABASE.sql
```

### Opção B: Via Prisma (recomendado)
```bash
cd backend
npm install
npm run prisma:deploy   # Aplica as migrations
npm run prisma:seed     # Opcional: dados iniciais
```

---

## Etapa 3 — Deploy do Backend no Render

1. No Render Dashboard, clique em **New → Web Service**
2. Conecte ao repositório GitHub `WesleyAndradeDC/equestoes`
3. Configure o serviço:
   - **Name:** `e-questoes-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push`
   - **Start Command:** `npm start`
   - **Region:** Oregon

4. Adicione as variáveis de ambiente:

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Cole a Connection String do banco |
| `JWT_SECRET` | Clique em "Generate" |
| `JWT_REFRESH_SECRET` | Clique em "Generate" |
| `OPENAI_API_KEY` | Sua chave da OpenAI |
| `FRONTEND_URL` | `https://e-questoes-frontend.onrender.com` |

5. Clique em **Create Web Service**
6. Aguarde o deploy e verifique o health check em `/health`

---

## Etapa 4 — Deploy do Frontend no Render

1. No Render Dashboard, clique em **New → Static Site**
2. Conecte ao repositório GitHub `WesleyAndradeDC/equestoes`
3. Configure:
   - **Name:** `e-questoes-frontend`
   - **Root Directory:** `.` (raiz do repositório)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. Adicione a variável de ambiente:

| Variável | Valor |
|----------|-------|
| `VITE_API_BASE_URL` | `https://e-questoes-api.onrender.com/api` |

5. Clique em **Create Static Site**

---

## Etapa 5 — Verificação Final

Após todos os deploys:

1. Acesse `https://e-questoes-frontend.onrender.com`
2. Tente fazer login
3. Verifique o backend em `https://e-questoes-api.onrender.com/health`
4. Verifique logs no Render Dashboard se houver erros

---

## Possíveis Problemas

### "cold start" no Render Free
O plano free hiberna o serviço após 15 minutos de inatividade. A primeira requisição demora ~30s para acordar o servidor. O frontend já trata isso com tolerância de erro de rede no `AuthContext`.

### Erro de CORS
Verifique se `FRONTEND_URL` no backend está configurado com o URL exato do seu frontend (sem barra no final).

### Prisma "engine not found"
Execute `npx prisma generate` manualmente no Render Console ou adicione ao Build Command.

---

## Deploy com render.yaml (automático)

Se usar o `render.yaml`, o Render configura tudo automaticamente:

```bash
# Certifique-se que os arquivos render.yaml estão no repositório
# O Render detecta e configura automaticamente ao conectar o repositório
```

- `render.yaml` (raiz) → Frontend
- `backend/render.yaml` → Backend + Banco de Dados

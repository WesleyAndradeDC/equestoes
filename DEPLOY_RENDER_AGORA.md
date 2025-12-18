# 🚀 Deploy no Render - Guia Rápido

## ✅ Push para GitHub: CONCLUÍDO!

Seu código foi enviado para: https://github.com/WesleyAndradeDC/gconcursos

---

## 🎯 Próximos Passos no Render

### 1️⃣ Configurar Backend (Web Service)

#### 1.1 Criar Web Service

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Web Service"**
3. Conecte ao repositório: `WesleyAndradeDC/gconcursos`
4. Configure:

**Nome:** `gconcursos-api` (ou o que preferir)

**Root Directory:** `backend`

**Environment:** `Node`

**Build Command:**
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

**Start Command:**
```bash
npm start
```

#### 1.2 Variáveis de Ambiente

Na seção **"Environment Variables"**, adicione:

```env
# Banco de Dados (use a Internal Database URL do Render)
DATABASE_URL=postgresql://usuario:senha@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos

# JWT Secrets (use os mesmos valores do seu .env local)
JWT_SECRET=seu-jwt-secret-aqui
JWT_REFRESH_SECRET=seu-refresh-secret-aqui

# Servidor
PORT=10000
NODE_ENV=production

# OpenAI (opcional - se quiser Tutor funcionando)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# CORS (URL do frontend depois que deployar)
FRONTEND_URL=https://gconcursos.onrender.com
```

**⚠️ IMPORTANTE:**
- Use a **Internal Database URL** (não a External) para o backend no Render
- A Internal URL é mais rápida e segura dentro da rede do Render

#### 1.3 Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (pode levar 2-5 minutos)
3. Verifique os logs para garantir que não há erros

**URL do Backend:** `https://gconcursos-api.onrender.com`

---

### 2️⃣ Configurar Banco de Dados

#### 2.1 Executar SQL no Banco

Você já tem o PostgreSQL criado no Render. Agora precisa executar o script SQL:

1. **Opção A: Via DBeaver** (Recomendado)
   - Siga: `backend/DBEAVER_SETUP.md`
   - Conecte ao PostgreSQL do Render
   - Execute: `backend/database-setup.sql`

2. **Opção B: Via Prisma Migrations**
   - O Prisma vai criar as tabelas automaticamente no primeiro deploy
   - Mas você ainda precisa popular com dados iniciais (seed)

#### 2.2 Popular Dados Iniciais

Após criar as tabelas, execute o seed:

**Via DBeaver:**
- Execute as queries de INSERT do `database-setup.sql`

**Ou via terminal (se tiver acesso SSH):**
```bash
cd backend
npm run prisma:seed
```

---

### 3️⃣ Configurar Frontend (Static Site)

#### 3.1 Criar Static Site

1. No Render, clique em **"New +"** → **"Static Site"**
2. Conecte ao repositório: `WesleyAndradeDC/gconcursos`
3. Configure:

**Nome:** `gconcursos-frontend`

**Root Directory:** (deixe vazio - raiz do projeto)

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:** `dist`

#### 3.2 Variáveis de Ambiente

Adicione:

```env
VITE_API_BASE_URL=https://gconcursos-api.onrender.com/api
```

**⚠️ IMPORTANTE:** Substitua `gconcursos-api` pelo nome real do seu Web Service!

#### 3.3 Deploy

1. Clique em **"Create Static Site"**
2. Aguarde o build
3. O Render vai gerar uma URL: `https://gconcursos-frontend.onrender.com`

---

### 4️⃣ Atualizar CORS no Backend

Após deployar o frontend, atualize a variável `FRONTEND_URL` no backend:

1. Vá em **"Environment"** do Web Service
2. Atualize:
```env
FRONTEND_URL=https://gconcursos-frontend.onrender.com
```
3. Clique em **"Save Changes"**
4. O Render vai fazer redeploy automaticamente

---

## ✅ Checklist de Deploy

### Backend
- [ ] Web Service criado no Render
- [ ] Conectado ao repositório GitHub
- [ ] Root Directory: `backend`
- [ ] Build Command configurado
- [ ] Start Command: `npm start`
- [ ] Variáveis de ambiente configuradas
- [ ] DATABASE_URL (Internal) configurado
- [ ] JWT_SECRET configurado
- [ ] JWT_REFRESH_SECRET configurado
- [ ] Deploy bem-sucedido
- [ ] Health check: `https://seu-backend.onrender.com/health` retorna OK

### Banco de Dados
- [ ] PostgreSQL criado no Render
- [ ] Script SQL executado (database-setup.sql)
- [ ] 6 tabelas criadas
- [ ] 4 usuários inseridos
- [ ] Teste de conexão OK

### Frontend
- [ ] Static Site criado no Render
- [ ] Conectado ao repositório GitHub
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist`
- [ ] VITE_API_BASE_URL configurado
- [ ] Deploy bem-sucedido
- [ ] Acessa URL e aparece tela de login

### Configuração Final
- [ ] FRONTEND_URL atualizado no backend
- [ ] CORS funcionando
- [ ] Login funciona
- [ ] Todas as funcionalidades testadas

---

## 🧪 Testar em Produção

### 1. Testar Backend

```bash
# Health check
curl https://gconcursos-api.onrender.com/health

# Login
curl -X POST https://gconcursos-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gconcursos.com","password":"admin123"}'
```

### 2. Testar Frontend

1. Acesse: `https://gconcursos-frontend.onrender.com`
2. Deve aparecer tela de **Login**
3. Login com: `admin@gconcursos.com` / `admin123`
4. Navegue pelas páginas
5. Teste todas as funcionalidades

---

## 🆘 Problemas Comuns

### Backend não inicia

**Erro:** "Can't reach database server"
**Solução:**
- Verifique se DATABASE_URL está correto
- Use a **Internal Database URL** (não External)
- Confirme que o banco está ativo no Render

### Frontend não conecta ao backend

**Erro:** "Network Error" ou CORS
**Solução:**
- Verifique `VITE_API_BASE_URL` no frontend
- Verifique `FRONTEND_URL` no backend
- Confirme URLs estão corretas (sem barra no final)

### Build falha

**Erro:** "Command failed"
**Solução:**
- Verifique logs do build no Render
- Confirme que `package.json` está correto
- Verifique se todas as dependências estão instaladas

### Banco não tem dados

**Solução:**
- Execute `database-setup.sql` via DBeaver
- Ou execute seed: `npm run prisma:seed` (se tiver acesso)

---

## 📊 URLs Finais

Após deploy completo:

- **Backend:** `https://gconcursos-api.onrender.com`
- **Frontend:** `https://gconcursos-frontend.onrender.com`
- **API Base:** `https://gconcursos-api.onrender.com/api`

---

## 🎉 Pronto!

Após completar todos os passos:

1. ✅ Backend rodando no Render
2. ✅ Banco PostgreSQL configurado
3. ✅ Frontend deployado
4. ✅ Aplicação completa no ar!

**Acesse o frontend e teste tudo!** 🚀

---

## 📞 Documentação de Referência

- **Backend Deploy:** `backend/RENDER_DEPLOYMENT.md`
- **Banco de Dados:** `backend/DBEAVER_SETUP.md`
- **Setup Local:** `backend/SETUP.md`
- **API Docs:** `backend/API_DOCUMENTATION.md`





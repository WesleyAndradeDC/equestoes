# 🚀 Deploy Completo - Backend + Frontend no Render

## ✅ Status Atual

- [x] Código no GitHub
- [x] Backend Web Service criado no Render
- [x] API respondendo (rota raiz funciona)
- [ ] Banco de dados populado
- [ ] Frontend deployado
- [ ] Tudo testado e funcionando

---

## 📋 PARTE 1: Finalizar Backend

### 1.1 Verificar Variáveis de Ambiente

No Render Dashboard → Seu Web Service → **Environment**

**Variáveis obrigatórias:**

```env
# Banco de Dados (INTERNAL URL do Render - mais rápida)
DATABASE_URL=postgresql://usuario:senha@dpg-xxxxx:5432/gconcursos

# JWT Secrets (gere valores únicos)
JWT_SECRET=seu-jwt-secret-32-caracteres-aqui
JWT_REFRESH_SECRET=seu-refresh-secret-32-caracteres-aqui

# Servidor
PORT=10000
NODE_ENV=production

# CORS (atualizar depois que deployar frontend)
FRONTEND_URL=https://gconcursos-frontend.onrender.com

# OpenAI (opcional - para Tutor funcionar)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:**
- Use a **Internal Database URL** (não a External)
- Gere JWT secrets únicos: https://www.random.org/strings/

### 1.2 Salvar Variáveis

Após adicionar/editar, clique em **"Save Changes"**. O Render fará redeploy automático.

---

## 📋 PARTE 2: Configurar Banco de Dados

### 2.1 Conectar via DBeaver

Seguir guia: `backend/DBEAVER_SETUP.md`

**Resumo rápido:**

1. Abrir **DBeaver**
2. Nova Conexão → PostgreSQL
3. Usar credenciais do Render (**External URL**)
4. Testar Conexão

### 2.2 Executar Script SQL

No DBeaver:

1. Clicar com botão direito no banco `gconcursos`
2. **SQL Editor** → **New SQL Script**
3. Abrir arquivo: `backend/database-setup.sql`
4. **ANTES DE EXECUTAR:** Gerar hashes de senha

#### Gerar Hashes de Senha

**Opção A: PowerShell**
```powershell
cd backend
npm install
node -e "const bcrypt = require('bcryptjs'); console.log('admin123:', bcrypt.hashSync('admin123', 10)); console.log('professor123:', bcrypt.hashSync('professor123', 10)); console.log('aluno123:', bcrypt.hashSync('aluno123', 10));"
```

**Opção B: Node.js Script**
```bash
cd backend
npm install
node
> const bcrypt = require('bcryptjs');
> bcrypt.hashSync('admin123', 10)
> bcrypt.hashSync('professor123', 10)
> bcrypt.hashSync('aluno123', 10)
```

Copie os hashes gerados.

#### Substituir Hashes no SQL

No arquivo `database-setup.sql`, encontre as linhas:

```sql
'$2a$10$YourHashedPasswordHere', -- SUBSTITUA
```

Substitua pelos hashes reais gerados acima.

#### Executar Script

1. Selecione **TODO** o script (Ctrl+A)
2. Execute (Ctrl+X ou botão ▶️)
3. Aguarde finalizar

**Resultado esperado:**
- ✅ 6 tabelas criadas
- ✅ 4 usuários inseridos
- ✅ Índices criados
- ✅ Triggers criados

### 2.3 Verificar Tabelas

Execute no DBeaver:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Deve retornar:**
- attempts
- comments
- notebook_questions
- notebooks
- questions
- users

### 2.4 Verificar Usuários

```sql
SELECT email, full_name, role, subscription_type 
FROM users;
```

**Deve retornar 4 usuários:**
- admin@gconcursos.com
- professor@gconcursos.com
- aluno.cascas@gconcursos.com
- aluno.pedrao@gconcursos.com

---

## 📋 PARTE 3: Deploy do Frontend

### 3.1 Criar Static Site no Render

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Static Site"**
3. Conecte ao repositório: `WesleyAndradeDC/gconcursos`
4. Configure:

**Name:** `gconcursos-frontend` (ou o nome que preferir)

**Root Directory:** (deixe vazio - raiz do projeto)

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
dist
```

**Auto-Deploy:** ✅ Yes

### 3.2 Adicionar Variável de Ambiente

Na seção **"Environment Variables"**, adicione:

```env
VITE_API_BASE_URL=https://gconcursos-api.onrender.com/api
```

**⚠️ IMPORTANTE:** 
- Substitua `gconcursos-api` pelo nome real do seu Web Service!
- NÃO coloque barra no final da URL

### 3.3 Criar Static Site

Clique em **"Create Static Site"**

O Render vai:
1. Clonar o repositório
2. Executar `npm install`
3. Executar `npm run build`
4. Publicar pasta `dist/`

**Tempo estimado:** 3-5 minutos

### 3.4 Obter URL do Frontend

Após deploy, o Render fornecerá uma URL:

```
https://gconcursos-frontend.onrender.com
```

Ou similar (pode ter sufixo aleatório).

---

## 📋 PARTE 4: Atualizar CORS no Backend

### 4.1 Atualizar Variável FRONTEND_URL

1. Vá no **Web Service** do backend
2. Aba **"Environment"**
3. Encontre `FRONTEND_URL`
4. Atualize com a URL real do frontend:
   ```env
   FRONTEND_URL=https://gconcursos-frontend.onrender.com
   ```
5. Clique em **"Save Changes"**

O Render fará redeploy automático do backend.

---

## 📋 PARTE 5: Testar Aplicação Completa

### 5.1 Testar Backend

#### Health Check
```bash
curl https://gconcursos-api.onrender.com/health
```

**Esperado:** `{ "status": "ok", ... }`

#### Login
```bash
curl -X POST https://gconcursos-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gconcursos.com","password":"admin123"}'
```

**Esperado:** Retornar `accessToken` e `refreshToken`

#### Listar Questões (sem token)
```bash
curl https://gconcursos-api.onrender.com/api/questions
```

**Esperado:** Erro 401 (correto - requer autenticação)

### 5.2 Testar Frontend

1. Acesse a URL do frontend: `https://gconcursos-frontend.onrender.com`
2. **Deve aparecer:** Tela de **Login**
3. **Login com:**
   - Email: `admin@gconcursos.com`
   - Senha: `admin123`
4. **Deve redirecionar:** Para a Home (Dashboard)

### 5.3 Testar Funcionalidades

Após login, teste:

#### Dashboard (Home)
- [ ] Estatísticas aparecem
- [ ] Cards de desempenho
- [ ] Sem erros no console

#### Resolver Questões
- [ ] Lista aparece (vazia ou com questões)
- [ ] Filtros funcionam
- [ ] Pode responder questões
- [ ] Mostra gabarito após responder

#### Criar Questão (Professor/Admin)
- [ ] Formulário aparece
- [ ] Pode preencher campos
- [ ] Cria questão com sucesso
- [ ] Questão aparece na lista

#### Cadernos
- [ ] Pode criar caderno
- [ ] Pode adicionar questões
- [ ] Lista cadernos criados

#### Comentários
- [ ] Pode comentar em questões
- [ ] Comentários aparecem
- [ ] Pode deletar próprios comentários

#### Ranking
- [ ] Lista usuários
- [ ] Mostra pontuação
- [ ] Ordenação funciona

#### Estatísticas
- [ ] Gráficos aparecem
- [ ] Dados corretos
- [ ] Sem erros

#### Admin (Admin apenas)
- [ ] Lista usuários
- [ ] Pode deletar usuários
- [ ] Confirmação antes de deletar

#### Tutor (se OpenAI configurado)
- [ ] Chat abre
- [ ] Pode enviar mensagens
- [ ] Recebe respostas do GPT
- [ ] Histórico mantém

#### Logout
- [ ] Logout funciona
- [ ] Redireciona para login
- [ ] Não pode acessar rotas sem login

---

## 🔍 Verificar Console (F12)

No navegador, pressione **F12** e verifique:

### Console
**NÃO deve ter:**
- ❌ Network errors
- ❌ CORS errors
- ❌ 401 errors (exceto se não logado)
- ❌ Undefined errors

**Pode ter (normal):**
- ⚠️ React warnings (keys, etc)
- ⚠️ DevTools extensions warnings

### Network
**Verificar:**
- ✅ Requisições para `gconcursos-api.onrender.com/api/*`
- ✅ Status 200 (sucesso)
- ✅ Headers com `Authorization: Bearer xxx`
- ✅ Respostas JSON corretas

---

## 🚨 Problemas Comuns

### Frontend não conecta ao backend

**Erro:** "Network Error" ou CORS

**Solução:**
1. Verifique `VITE_API_BASE_URL` no frontend Render
2. Verifique `FRONTEND_URL` no backend Render
3. Confirme que URLs estão corretas
4. Verifique que backend está rodando
5. Teste health check do backend

### Login não funciona

**Erro:** "Usuário não encontrado" ou "401"

**Solução:**
1. Verifique que o SQL foi executado no banco
2. Confirme que 4 usuários existem (query no DBeaver)
3. Verifique que hashes de senha foram gerados corretamente
4. Teste login via cURL diretamente na API

### Página branca após login

**Erro:** Console mostra erros de requisição

**Solução:**
1. Verifique console (F12) por erros
2. Confirme que token está sendo salvo (localStorage)
3. Verifique Network tab - requisições falhando?
4. Confirme backend está respondendo

### Questões não aparecem

**Solução:**
1. Criar questões via interface (se for Professor/Admin)
2. Ou executar queries de INSERT no DBeaver (ver `database-setup.sql`)
3. Verificar endpoint `/api/questions` retorna dados

### Build do frontend falha

**Erro:** "Command failed" no Render

**Solução:**
1. Verifique logs de build no Render
2. Confirme que `package.json` está correto
3. Verifique que todas as dependências estão listadas
4. Teste build local: `npm run build`

---

## ✅ Checklist Final

### Backend
- [ ] Web Service deployado
- [ ] Variáveis de ambiente configuradas
- [ ] DATABASE_URL (Internal) correto
- [ ] JWT secrets configurados
- [ ] FRONTEND_URL atualizado
- [ ] Health check funciona
- [ ] Login funciona via cURL

### Banco de Dados
- [ ] PostgreSQL ativo no Render
- [ ] DBeaver conectado
- [ ] Script SQL executado
- [ ] 6 tabelas criadas
- [ ] 4 usuários inseridos
- [ ] Hashes de senha corretos

### Frontend
- [ ] Static Site deployado
- [ ] Build bem-sucedido
- [ ] VITE_API_BASE_URL configurado
- [ ] Acessa URL e aparece login
- [ ] Login funciona
- [ ] Redireciona para home após login

### Funcionalidades
- [ ] Dashboard carrega
- [ ] Questões listam
- [ ] Pode responder questões
- [ ] Pode criar questões (Professor)
- [ ] Cadernos funcionam
- [ ] Comentários funcionam
- [ ] Ranking funciona
- [ ] Estatísticas funcionam
- [ ] Admin funciona (Admin)
- [ ] Tutor funciona (se OpenAI key)
- [ ] Logout funciona
- [ ] Dark mode funciona

---

## 📊 Arquitetura Final

```
┌─────────────────────────────────────┐
│  USUÁRIO (Navegador)                │
│  https://gconcursos-frontend...     │
└────────────┬────────────────────────┘
             │
             │ HTTP Requests + JWT
             ↓
┌─────────────────────────────────────┐
│  FRONTEND (Render Static Site)      │
│  - React + Vite                     │
│  - dist/ servido como estático      │
└────────────┬────────────────────────┘
             │
             │ fetch API calls
             ↓
┌─────────────────────────────────────┐
│  BACKEND (Render Web Service)       │
│  - Express.js + Prisma              │
│  - JWT Authentication               │
│  - https://gconcursos-api...        │
└────────────┬────────────────────────┘
             │
             │ SQL Queries
             ↓
┌─────────────────────────────────────┐
│  POSTGRESQL (Render Database)       │
│  - 6 tabelas                        │
│  - Dados persistentes               │
└─────────────────────────────────────┘
```

---

## 🎯 URLs Finais

Após deploy completo:

- **Frontend:** https://gconcursos-frontend.onrender.com
- **Backend:** https://gconcursos-api.onrender.com
- **API Base:** https://gconcursos-api.onrender.com/api
- **Health:** https://gconcursos-api.onrender.com/health
- **GitHub:** https://github.com/WesleyAndradeDC/gconcursos

---

## 🎉 Deploy Completo!

Se todos os checkboxes estão marcados, você tem:

✅ Backend rodando no Render
✅ Banco PostgreSQL configurado e populado
✅ Frontend deployado e funcionando
✅ Autenticação JWT funcionando
✅ Todas as funcionalidades testadas
✅ Aplicação 100% funcional em produção

**Parabéns! Seu projeto está no ar! 🚀**

---

## 📞 Suporte

Se algo não funcionar:

1. **Backend:** `backend/RENDER_DEPLOYMENT.md`
2. **Banco:** `backend/DBEAVER_SETUP.md`
3. **API:** `COMO_ACESSAR_API.md`
4. **Testes:** `TESTAR_APLICACAO.md`
5. **Geral:** `GUIA_COMPLETO_MIGRACAO.md`

---

## 🔄 Atualizações Futuras

Para atualizar o código:

1. Faça mudanças localmente
2. Commit: `git commit -m "sua mensagem"`
3. Push: `git push origin main`
4. Render fará redeploy automático!

---

## 📝 Credenciais de Teste

**Admin:**
- Email: `admin@gconcursos.com`
- Senha: `admin123`

**Professor:**
- Email: `professor@gconcursos.com`
- Senha: `professor123`

**Aluno Clube dos Cascas:**
- Email: `aluno.cascas@gconcursos.com`
- Senha: `aluno123`

**Aluno Clube do Pedrão:**
- Email: `aluno.pedrao@gconcursos.com`
- Senha: `aluno123`

---

**Boa sorte com o deploy! 🚀**


# ✅ Checklist de Deploy - G-Concursos

Use este checklist para garantir que tudo está configurado corretamente.

---

## 📋 1. BACKEND (Web Service)

### Criar Web Service
- [ ] Acessar: https://dashboard.render.com/
- [ ] Clicar em "New +" → "Web Service"
- [ ] Conectar repositório: `WesleyAndradeDC/gconcursos`
- [ ] Configurar:
  - Name: `gconcursos-api`
  - Root Directory: `backend`
  - Environment: `Node`
  - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
  - Start Command: `npm start`

### Variáveis de Ambiente
- [ ] `DATABASE_URL` = Internal URL do PostgreSQL
- [ ] `JWT_SECRET` = Valor aleatório (32 chars)
- [ ] `JWT_REFRESH_SECRET` = Valor aleatório (32 chars)
- [ ] `PORT` = 10000
- [ ] `NODE_ENV` = production
- [ ] `FRONTEND_URL` = URL do frontend (atualizar depois)
- [ ] `OPENAI_API_KEY` = Chave OpenAI (opcional)
- [ ] Clicar em "Save Changes"

### Testar Backend
- [ ] Aguardar deploy finalizar (2-5 min)
- [ ] Status: "Live" 🟢
- [ ] Acessar: `https://gconcursos-api.onrender.com/`
- [ ] Ver informações da API (não erro 404)
- [ ] Acessar: `/health` - Status OK

---

## 📋 2. BANCO DE DADOS (PostgreSQL)

### Conectar DBeaver
- [ ] Abrir DBeaver
- [ ] Nova Conexão → PostgreSQL
- [ ] Copiar credenciais do Render (External URL)
- [ ] Host: `dpg-xxxxx-a.oregon-postgres.render.com`
- [ ] Port: `5432`
- [ ] Database: `gconcursos`
- [ ] Username: (do Render)
- [ ] Password: (do Render)
- [ ] Testar Conexão → "Connected" ✅

### Gerar Hashes de Senha
- [ ] Abrir terminal na pasta `backend`
- [ ] `npm install`
- [ ] Executar:
  ```bash
  node -e "const bcrypt = require('bcryptjs'); console.log('admin123:', bcrypt.hashSync('admin123', 10)); console.log('professor123:', bcrypt.hashSync('professor123', 10)); console.log('aluno123:', bcrypt.hashSync('aluno123', 10));"
  ```
- [ ] Copiar os 3 hashes gerados

### Executar SQL
- [ ] No DBeaver, abrir `backend/database-setup.sql`
- [ ] Substituir `$2a$10$YourHashedPasswordHere` pelos hashes reais
- [ ] Selecionar TODO o script (Ctrl+A)
- [ ] Executar (Ctrl+X)
- [ ] Aguardar finalizar sem erros

### Verificar Tabelas
- [ ] Executar:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' ORDER BY table_name;
  ```
- [ ] Deve retornar 6 tabelas:
  - [ ] attempts
  - [ ] comments
  - [ ] notebook_questions
  - [ ] notebooks
  - [ ] questions
  - [ ] users

### Verificar Usuários
- [ ] Executar:
  ```sql
  SELECT email, full_name, role FROM users;
  ```
- [ ] Deve retornar 4 usuários:
  - [ ] admin@gconcursos.com
  - [ ] professor@gconcursos.com
  - [ ] aluno.cascas@gconcursos.com
  - [ ] aluno.pedrao@gconcursos.com

---

## 📋 3. FRONTEND (Static Site)

### Criar Static Site
- [ ] No Render, "New +" → "Static Site"
- [ ] Conectar repositório: `WesleyAndradeDC/gconcursos`
- [ ] Configurar:
  - Name: `gconcursos-frontend`
  - Root Directory: (vazio - raiz)
  - Build Command: `npm install && npm run build`
  - Publish Directory: `dist`
  - Auto-Deploy: ✅ Yes

### Variável de Ambiente
- [ ] Adicionar:
  ```env
  VITE_API_BASE_URL=https://gconcursos-api.onrender.com/api
  ```
- [ ] Substituir `gconcursos-api` pelo nome real do seu Web Service!

### Criar e Aguardar
- [ ] Clicar em "Create Static Site"
- [ ] Aguardar build (3-5 min)
- [ ] Status: "Live" 🟢
- [ ] Copiar URL gerada: `https://gconcursos-frontend.onrender.com`

---

## 📋 4. ATUALIZAR CORS

### Atualizar Backend
- [ ] Ir no Web Service (backend)
- [ ] Aba "Environment"
- [ ] Atualizar `FRONTEND_URL`:
  ```env
  FRONTEND_URL=https://gconcursos-frontend.onrender.com
  ```
- [ ] Colar URL real do frontend (sem barra no final)
- [ ] Clicar em "Save Changes"
- [ ] Aguardar redeploy

---

## 📋 5. TESTES

### Testar Backend via cURL

#### Health Check
- [ ] Executar:
  ```bash
  curl https://gconcursos-api.onrender.com/health
  ```
- [ ] Resposta: `{"status":"ok",...}`

#### Login
- [ ] Executar:
  ```bash
  curl -X POST https://gconcursos-api.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@gconcursos.com","password":"admin123"}'
  ```
- [ ] Resposta: JSON com `accessToken` e `refreshToken`

### Testar Frontend no Navegador

#### Acessar e Login
- [ ] Acessar: `https://gconcursos-frontend.onrender.com`
- [ ] Aparece tela de **Login**
- [ ] Email: `admin@gconcursos.com`
- [ ] Senha: `admin123`
- [ ] Clicar em "Entrar"
- [ ] Redireciona para Dashboard (Home)
- [ ] Nome do usuário aparece no header

#### Funcionalidades Básicas
- [ ] **Dashboard** - Cards aparecem
- [ ] **Resolver Questões** - Lista carrega
- [ ] **Cadernos** - Pode criar caderno
- [ ] **Ranking** - Lista carrega
- [ ] **Estatísticas** - Gráficos aparecem
- [ ] **Dark Mode** - Alterna tema
- [ ] **Logout** - Volta para login

#### Criar Questão (Admin/Professor)
- [ ] Ir em "Criar Questões"
- [ ] Preencher formulário
- [ ] Clicar em "Criar"
- [ ] Questão aparece em "Resolver Questões"

#### Resolver Questão
- [ ] Ir em "Resolver Questões"
- [ ] Selecionar uma questão
- [ ] Escolher resposta
- [ ] Confirmar
- [ ] Ver gabarito e explicação

#### Comentar
- [ ] Em uma questão, clicar em "Comentários"
- [ ] Escrever comentário
- [ ] Publicar
- [ ] Comentário aparece na lista

### Console do Navegador (F12)
- [ ] Abrir DevTools (F12)
- [ ] Aba "Console" - Sem erros críticos
- [ ] Aba "Network" - Requisições com status 200
- [ ] Headers incluem `Authorization: Bearer xxx`

---

## 📋 6. VERIFICAÇÕES FINAIS

### URLs Funcionando
- [ ] Frontend: `https://gconcursos-frontend.onrender.com`
- [ ] Backend: `https://gconcursos-api.onrender.com`
- [ ] API Base: `https://gconcursos-api.onrender.com/api`
- [ ] Health: `https://gconcursos-api.onrender.com/health`

### Autenticação
- [ ] Login funciona
- [ ] Token JWT salvo no localStorage
- [ ] Rotas protegidas funcionam
- [ ] Logout funciona
- [ ] Redirect para login se não autenticado

### Banco de Dados
- [ ] Conexão via DBeaver OK
- [ ] 6 tabelas existem
- [ ] 4 usuários existem
- [ ] Queries funcionam

### Permissões
- [ ] Admin vê tudo
- [ ] Professor cria questões
- [ ] Aluno Cascas vê tudo + tutor
- [ ] Aluno Pedrão vê só LP (sem tutor)

---

## 🎉 Deploy Completo!

Se todos os itens estão marcados:

✅ **Backend deployado e funcionando**
✅ **Banco de dados configurado**
✅ **Frontend deployado e funcionando**
✅ **Autenticação JWT funcionando**
✅ **Todas as funcionalidades testadas**

**Seu projeto está 100% no ar! 🚀**

---

## 📊 Resumo

| Componente | Status | URL |
|------------|--------|-----|
| Backend | 🟢 Live | https://gconcursos-api.onrender.com |
| Frontend | 🟢 Live | https://gconcursos-frontend.onrender.com |
| Banco | 🟢 Active | Render PostgreSQL |
| GitHub | ✅ Updated | https://github.com/WesleyAndradeDC/gconcursos |

---

## 🆘 Se Algo Falhar

Consulte:
- `DEPLOY_COMPLETO_RENDER.md` - Guia detalhado
- `backend/RENDER_DEPLOYMENT.md` - Backend específico
- `backend/DBEAVER_SETUP.md` - Banco de dados
- `COMO_ACESSAR_API.md` - Endpoints da API
- `TESTAR_APLICACAO.md` - Testes locais

---

## 🔄 Próximas Atualizações

Para atualizar o código:

1. Fazer mudanças localmente
2. `git add .`
3. `git commit -m "mensagem"`
4. `git push origin main`
5. Render faz redeploy automático!

---

**Boa sorte! 🚀**



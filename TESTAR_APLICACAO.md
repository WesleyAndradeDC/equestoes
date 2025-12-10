# 🧪 Guia de Teste - G-Concursos

## 🎯 Objetivo
Testar a aplicação completa localmente antes do deploy.

---

## 🚀 PASSO 1: Iniciar Backend

### 1.1 Instalar Dependências

```bash
cd backend
npm install
```

### 1.2 Configurar Banco de Dados

**Opção A: PostgreSQL Local**

```bash
# Edite backend/.env
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/gconcursos"
```

**Opção B: PostgreSQL do Render**

```bash
# Use a External Database URL do Render
DATABASE_URL="postgresql://usuario:senha@dpg-xxxx.oregon-postgres.render.com:5432/gconcursos"
```

### 1.3 Executar Setup

```bash
cd backend

# Gerar Prisma Client + Migrations + Seed
npm run setup

# Ou manualmente:
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

**Você deve ver:**
```
✅ Migrations executadas
✅ 4 usuários criados
✅ 3 questões de exemplo criadas
```

### 1.4 Iniciar Servidor

```bash
npm run dev
```

**Deve mostrar:**
```
🚀 Server running on port 5000
📍 Health check: http://localhost:5000/health
🌍 Environment: development
```

### 1.5 Testar Backend

Abra novo terminal:

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gconcursos.com","password":"admin123"}'
```

**Deve retornar:**
```json
{
  "user": {
    "id": "uuid...",
    "email": "admin@gconcursos.com",
    "full_name": "Administrador"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **Backend OK!**

---

## 🎨 PASSO 2: Iniciar Frontend

### 2.1 Instalar Dependências

```bash
# Na raiz do projeto
npm install
```

### 2.2 Verificar .env

Confirme que existe `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 2.3 Iniciar Frontend

```bash
npm run dev
```

**Deve mostrar:**
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2.4 Acessar Aplicação

Abra no navegador: `http://localhost:5173`

**Deve aparecer:**
✅ Tela de **Login** (primeira tela)

---

## 🧪 PASSO 3: Testar Funcionalidades

### 3.1 Testar Login

1. **Email:** `admin@gconcursos.com`
2. **Senha:** `admin123`
3. Clicar em **"Entrar"**

**Resultado esperado:**
- ✅ Redireciona para `/` (Home)
- ✅ Aparece nome do usuário no header
- ✅ Mostra estatísticas (pode estar zerado)

### 3.2 Testar Navegação

Clique em cada menu:
- ✅ **Início** - Deve mostrar dashboard
- ✅ **Resolver Questões** - Lista questões (3 de exemplo)
- ✅ **Meus Cadernos** - Lista vazia ou criar novo
- ✅ **Estatísticas** - Gráficos (podem estar vazios)
- ✅ **Ranking** - Lista vazia ou com dados
- ✅ **Criar Questões** - Formulário (Professor/Admin)
- ✅ **Revisar Questões** - Buscar questões (Professor/Admin)
- ✅ **Administração** - Gerenciar usuários (Admin)
- ✅ **Tutor** - Chat LLM (se OpenAI key configurada)

### 3.3 Testar Questões

1. Ir em **"Resolver Questões"**
2. Deve aparecer **3 questões** (do seed):
   - LP0001 - Crase
   - LP0002 - Concordância
   - MAT0001 - Porcentagem
3. Selecionar uma resposta
4. Clicar em **"Confirmar Resposta"**

**Resultado esperado:**
- ✅ Toast de sucesso/erro
- ✅ Mostra gabarito
- ✅ Mostra explicação
- ✅ Permite comentar

### 3.4 Testar Criar Questão (Professor/Admin)

1. Ir em **"Criar Questões"**
2. Preencher formulário
3. Clicar em **"Criar Questão"**

**Resultado esperado:**
- ✅ Questão criada
- ✅ Toast de sucesso
- ✅ Formulário limpo
- ✅ Aparece em "Resolver Questões"

### 3.5 Testar Cadernos

1. Ir em **"Meus Cadernos"**
2. Clicar em **"Novo Caderno"**
3. Nome: "Teste de Sintaxe"
4. Criar

**Resultado esperado:**
- ✅ Caderno criado
- ✅ Aparece na lista
- ✅ Pode adicionar questões

### 3.6 Testar Comentários

1. Resolver uma questão
2. Clicar em **"Ver Comentários"**
3. Escrever comentário
4. Clicar em **"Publicar"**

**Resultado esperado:**
- ✅ Comentário aparece na lista
- ✅ Mostra avatar e nome
- ✅ Mostra badge de Professor (se for)

### 3.7 Testar Ranking

1. Ir em **"Ranking"**
2. Deve mostrar usuários com pontuação

**Resultado esperado:**
- ✅ Lista ordenada por pontos
- ✅ Mostra sua posição
- ✅ Filtros funcionam

### 3.8 Testar Estatísticas

1. Ir em **"Estatísticas"**

**Resultado esperado:**
- ✅ Gráficos aparecem
- ✅ Cards com números
- ✅ Evolução semanal
- ✅ Por disciplina

### 3.9 Testar Admin (Admin apenas)

1. Login como Admin
2. Ir em **"Administração"**
3. Deve listar todos os usuários
4. Tentar excluir um usuário

**Resultado esperado:**
- ✅ Lista 4 usuários (do seed)
- ✅ Pode excluir (exceto você mesmo)
- ✅ Confirmação de exclusão

### 3.10 Testar Tutor (Se OpenAI configurado)

1. Clicar no botão flutuante do Tutor
2. Digitar: "Quando usar crase?"
3. Enviar

**Resultado esperado:**
- ✅ Resposta do GPT-4o-mini
- ✅ Formatação Markdown
- ✅ Conversação mantém contexto

**⚠️ Se não tiver OpenAI API Key:**
- Retornará erro 500
- Configure `OPENAI_API_KEY` no backend/.env

### 3.11 Testar Dark Mode

1. Clicar no ícone de lua/sol
2. Tema deve alternar

**Resultado esperado:**
- ✅ Muda para dark/light
- ✅ Salva preferência
- ✅ Mantém após reload

### 3.12 Testar Logout

1. Clicar no ícone de logout
2. Deve voltar para `/login`

**Resultado esperado:**
- ✅ Redireciona para login
- ✅ Tokens removidos
- ✅ Não consegue acessar rotas protegidas
- ✅ Pode fazer login novamente

---

## 🔍 Verificações Técnicas

### Console do Navegador (F12)

**Não deve ter erros!**

Pode ter warnings de:
- React keys (normal)
- DevTools extensions (ignorar)

**Erros que NÃO podem aparecer:**
- ❌ Network errors
- ❌ CORS errors
- ❌ Authentication errors
- ❌ Undefined errors

### Network Tab (F12 → Network)

**Verificar:**
- ✅ Requisições para `localhost:5000/api/*`
- ✅ Status 200 (sucesso)
- ✅ Headers com `Authorization: Bearer xxx`
- ✅ Respostas JSON corretas

**Requisições esperadas:**
```
GET  /api/auth/me           → 200
GET  /api/questions         → 200
GET  /api/attempts          → 200
POST /api/attempts          → 201
GET  /api/notebooks         → 200
POST /api/notebooks         → 201
GET  /api/comments          → 200
POST /api/comments          → 201
```

### localStorage (F12 → Application → Local Storage)

**Deve conter:**
```
accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
darkMode: "true" ou "false"
```

---

## 📊 Dados de Teste

### Usuários Criados (Seed)

| Email | Senha | Role | Acesso |
|-------|-------|------|--------|
| admin@gconcursos.com | admin123 | admin | Tudo |
| professor@gconcursos.com | professor123 | user/Professor | Questões + Tutor |
| aluno.cascas@gconcursos.com | aluno123 | user/Cascas | Completo + Tutor |
| aluno.pedrao@gconcursos.com | aluno123 | user/Pedrão | Só LP |

### Questões Criadas (Seed)

1. **LP0001** - Língua Portuguesa (Crase) - Médio
2. **LP0002** - Língua Portuguesa (Concordância) - Fácil
3. **MAT0001** - Matemática (Porcentagem) - Médio

---

## ⚠️ Problemas Comuns

### Backend não inicia

**Erro:** "Can't reach database server"
**Solução:**
- Verifique PostgreSQL está rodando
- Confirme `DATABASE_URL` no `.env`
- Teste conexão: `psql -U postgres -d gconcursos`

### Frontend não conecta

**Erro:** "Network Error" ou CORS
**Solução:**
- Confirme backend está rodando (`localhost:5000`)
- Verifique `.env` tem `VITE_API_BASE_URL`
- Verifique CORS no backend permite `localhost:5173`

### Login não funciona

**Erro:** "Usuário não encontrado"
**Solução:**
- Execute seed: `npm run prisma:seed` no backend
- Verifique usuários no banco (DBeaver)
- Confirme endpoint `/api/auth/login` funciona

### Página branca após login

**Erro:** Console mostra erros de requisição
**Solução:**
- Verifique Network tab (F12)
- Confirme token está sendo enviado
- Verifique backend logs por erros

### Questões não aparecem

**Erro:** Lista vazia
**Solução:**
- Execute seed com questões (ver `database-setup.sql`)
- Ou crie questões manualmente
- Verifique endpoint `/api/questions` retorna dados

### Tutor não funciona

**Erro:** "Erro ao processar solicitação"
**Solução:**
- Configure `OPENAI_API_KEY` no backend/.env
- Verifique tem créditos na conta OpenAI
- Teste endpoint: `POST /api/tutor/invoke`

---

## ✅ Checklist de Teste

### Backend
- [ ] Backend iniciado sem erros
- [ ] Health check responde (200 OK)
- [ ] Login retorna token
- [ ] Endpoints protegidos funcionam
- [ ] Banco tem 4 usuários
- [ ] Banco tem 3 questões

### Frontend
- [ ] Frontend iniciado sem erros
- [ ] Abre em `/login` (primeira tela)
- [ ] Login funciona
- [ ] Redireciona para `/` após login
- [ ] Header mostra nome do usuário
- [ ] Menu de navegação aparece

### Funcionalidades
- [ ] Listar questões funciona
- [ ] Resolver questão funciona
- [ ] Criar questão funciona (Professor/Admin)
- [ ] Cadernos funciona
- [ ] Comentários funciona
- [ ] Ranking funciona
- [ ] Estatísticas funciona
- [ ] Admin funciona (Admin)
- [ ] Tutor funciona (se OpenAI key)
- [ ] Dark mode funciona
- [ ] Logout funciona

### Segurança
- [ ] Não logado → redireciona para `/login`
- [ ] Token no header de requisições
- [ ] Token expirado → refresh automático
- [ ] Refresh falha → logout
- [ ] Rotas protegidas funcionam
- [ ] Permissões por role funcionam

---

## 🎬 Fluxo de Teste Completo

### Cenário 1: Admin

```
1. Login: admin@gconcursos.com / admin123
2. Ver Home → Estatísticas aparecem
3. Resolver Questões → 3 questões disponíveis
4. Responder questão LP0001 → Escolher A
5. Ver explicação → OK
6. Comentar → Publicar comentário
7. Criar Questão → Preencher formulário → Criar
8. Revisar Questão → Buscar LP0001 → Editar → Salvar
9. Admin → Ver 4 usuários → Excluir aluno (confirmar)
10. Ranking → Ver lista vazia (ou com dados)
11. Stats → Ver gráficos
12. Tutor → Perguntar algo → Resposta
13. Logout → Volta para login
```

### Cenário 2: Professor

```
1. Login: professor@gconcursos.com / professor123
2. Home → OK
3. Criar Questão → Formulário disponível
4. Revisar Questão → Disponível
5. Admin → NÃO aparece no menu (correto)
6. Tutor → Disponível (Professor tem acesso)
7. Logout
```

### Cenário 3: Aluno Clube dos Cascas

```
1. Login: aluno.cascas@gconcursos.com / aluno123
2. Home → OK
3. Resolver Questões → TODAS disponíveis
4. Criar Questão → NÃO aparece (correto)
5. Admin → NÃO aparece (correto)
6. Tutor → Disponível (Cascas tem acesso)
7. Cadernos → Criar caderno → Salvar questão
8. Logout
```

### Cenário 4: Aluno Clube do Pedrão

```
1. Login: aluno.pedrao@gconcursos.com / aluno123
2. Home → OK
3. Resolver Questões → Apenas LÍNGUA PORTUGUESA
4. Ver warning: "Acesso apenas a Língua Portuguesa"
5. Matemática → NÃO aparece (correto)
6. Tutor → NÃO aparece (correto)
7. Logout
```

---

## 📸 Screenshots Esperados

### Tela de Login
```
┌──────────────────────────────┐
│                              │
│      [Logo G CONCURSOS]      │
│                              │
│   G CONCURSOS                │
│   Plataforma de questões     │
│                              │
│   Email: [____________]      │
│   Senha: [____________]      │
│                              │
│      [Entrar]                │
│                              │
│   Credenciais de teste...    │
│                              │
└──────────────────────────────┘
```

### Home (Após Login)
```
┌──────────────────────────────────────────┐
│ [G] G CONCURSOS     [Menu]    [User] [⇲] │
├──────────────────────────────────────────┤
│                                          │
│       Olá, Administrador!                │
│                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Total   │ │ Acertos │ │ Pontos  │   │
│  │   0     │ │   0     │ │  Fortes │   │
│  └─────────┘ └─────────┘ └─────────┘   │
│                                          │
│  [Gráficos de desempenho]                │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🐛 Debug

### Ver logs do Backend

No terminal onde rodou `npm run dev`:
```
[Prisma] query: SELECT * FROM users WHERE email = ...
POST /api/auth/login 200 54.123 ms
GET /api/questions 200 12.456 ms
```

### Ver logs do Frontend

Console do navegador (F12):
```
[AuthContext] User loaded: { email: "admin@...", ... }
[apiClient] GET /questions → 200
```

### Adicionar logs personalizados

```javascript
// Em qualquer serviço
console.log('Questions loaded:', questions);
console.log('User data:', user);
console.log('Token:', localStorage.getItem('accessToken'));
```

---

## ✅ Teste Bem-Sucedido

Se tudo funcionar:
- ✅ Backend respondendo
- ✅ Frontend conectando
- ✅ Login funcionando
- ✅ Dados carregando
- ✅ CRUD funcionando
- ✅ Permissões corretas

**Você está pronto para deploy! 🚀**

---

## 📋 Checklist Final

- [ ] Backend instalado e iniciado
- [ ] Banco configurado (local ou Render)
- [ ] Seed executado (4 usuários + 3 questões)
- [ ] Frontend instalado e iniciado
- [ ] Login funciona
- [ ] Todas as páginas carregam
- [ ] Questões listam
- [ ] Resolver questão funciona
- [ ] Criar questão funciona (Professor)
- [ ] Cadernos funciona
- [ ] Comentários funciona
- [ ] Ranking funciona
- [ ] Stats funciona
- [ ] Admin funciona (Admin)
- [ ] Tutor funciona (ou erro esperado sem OpenAI)
- [ ] Logout funciona
- [ ] Sem erros no console
- [ ] Network requests OK

---

## 🚀 Próximo: Deploy

Após testes locais bem-sucedidos:

1. ✅ Deploy backend no Render (ver `backend/RENDER_DEPLOYMENT.md`)
2. ✅ Configurar variáveis de ambiente
3. ✅ Build frontend: `npm run build`
4. ✅ Deploy frontend no Render
5. ✅ Testar em produção
6. 🎉 **Projeto no ar!**

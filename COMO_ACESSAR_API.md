# 🌐 Como Acessar a API do G-Concursos

## ✅ API Está Funcionando!

A mensagem `{"error":"Endpoint não encontrado"}` aparecia porque você estava acessando a rota raiz sem especificar um endpoint.

**Agora está corrigido!** ✨

---

## 📍 URLs Principais

### 1. Rota Raiz (Informações da API)
```
https://gconcursos-api.onrender.com/
```
**Retorna:** Informações sobre a API e endpoints disponíveis

### 2. Health Check
```
https://gconcursos-api.onrender.com/health
```
**Retorna:** Status da API e uptime

---

## 🔌 Endpoints da API

Todos os endpoints funcionais estão sob `/api`:

### Autenticação
```
POST   /api/auth/login      - Login
POST   /api/auth/register   - Registrar (se habilitado)
GET    /api/auth/me         - Dados do usuário atual
PUT    /api/auth/me         - Atualizar perfil
POST   /api/auth/logout     - Logout
POST   /api/auth/refresh    - Renovar token
```

### Questões
```
GET    /api/questions       - Listar questões
POST   /api/questions       - Criar questão (Professor/Admin)
GET    /api/questions/:id   - Obter questão específica
PUT    /api/questions/:id   - Atualizar questão (Professor/Admin)
DELETE /api/questions/:id   - Deletar questão (Professor/Admin)
```

### Tentativas
```
GET    /api/attempts        - Listar tentativas
POST   /api/attempts        - Registrar tentativa
GET    /api/attempts/me     - Minhas tentativas
```

### Cadernos
```
GET    /api/notebooks       - Listar cadernos
POST   /api/notebooks       - Criar caderno
GET    /api/notebooks/:id   - Obter caderno
PUT    /api/notebooks/:id   - Atualizar caderno
DELETE /api/notebooks/:id   - Deletar caderno
```

### Comentários
```
GET    /api/comments        - Listar comentários
POST   /api/comments        - Criar comentário
DELETE /api/comments/:id    - Deletar comentário
```

### Usuários (Admin)
```
GET    /api/users           - Listar usuários
GET    /api/users/:id       - Obter usuário
PUT    /api/users/:id       - Atualizar usuário
DELETE /api/users/:id       - Deletar usuário
```

### Tutor
```
POST   /api/tutor/invoke    - Invocar LLM
```

---

## 🧪 Testando a API

### 1. Teste Básico (Navegador)

Acesse no navegador:
```
https://gconcursos-api.onrender.com/
```

Deve retornar:
```json
{
  "name": "G-Concursos API",
  "version": "1.0.0",
  "status": "online",
  "message": "API REST para plataforma G-Concursos - Gramatique",
  "endpoints": {
    "health": "/health",
    "auth": "/api/auth/*",
    "questions": "/api/questions",
    ...
  }
}
```

### 2. Health Check

```bash
curl https://gconcursos-api.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "G-Concursos API is running",
  "timestamp": "2024-01-10T12:00:00.000Z",
  "uptime": 12345
}
```

### 3. Login (PowerShell)

```powershell
$body = @{
    email = "admin@gconcursos.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://gconcursos-api.onrender.com/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### 4. Login (cURL)

```bash
curl -X POST https://gconcursos-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gconcursos.com","password":"admin123"}'
```

Deve retornar:
```json
{
  "user": {
    "id": "...",
    "email": "admin@gconcursos.com",
    "full_name": "Administrador",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Listar Questões (com token)

```bash
# Substitua TOKEN_AQUI pelo token recebido no login
curl https://gconcursos-api.onrender.com/api/questions \
  -H "Authorization: Bearer TOKEN_AQUI"
```

---

## 🔍 Verificando Logs no Render

Para ver logs em tempo real:

1. Acesse: https://dashboard.render.com/
2. Clique no seu Web Service (`gconcursos-api`)
3. Vá na aba **"Logs"**
4. Você verá todas as requisições e erros

---

## ✅ Checklist de Verificação

- [x] API está online (`status: "online"`)
- [x] Rota raiz `/` retorna informações
- [x] Health check `/health` funciona
- [ ] Banco de dados conectado
- [ ] Login funciona (`/api/auth/login`)
- [ ] Endpoints protegidos funcionam
- [ ] Frontend consegue conectar

---

## 🚨 Se Algo Não Funcionar

### "Cannot connect to database"

**Problema:** DATABASE_URL incorreto ou banco não está ativo

**Solução:**
1. Verifique variável `DATABASE_URL` no Render
2. Use a **Internal Database URL** (mais rápida)
3. Confirme que o banco PostgreSQL está ativo

### "401 Unauthorized"

**Problema:** Token inválido ou expirado

**Solução:**
1. Faça login novamente
2. Use o token retornado no header `Authorization: Bearer {token}`

### "500 Internal Server Error"

**Problema:** Erro no código ou banco

**Solução:**
1. Verifique logs no Render
2. Confirme que migrations foram executadas
3. Verifique se há dados no banco

---

## 📊 Fluxo de Uso da API

```
1. Cliente acessa a rota raiz
   GET /
   → Retorna informações da API

2. Cliente faz login
   POST /api/auth/login
   → Retorna user + tokens

3. Cliente usa token em requisições
   GET /api/questions
   Header: Authorization: Bearer {token}
   → Retorna lista de questões

4. Cliente faz ações protegidas
   POST /api/attempts
   Header: Authorization: Bearer {token}
   Body: { question_id, chosen_answer, ... }
   → Registra tentativa
```

---

## 🎯 Próximo Passo

Agora que a API está funcionando:

1. ✅ Verifique que o banco de dados está populado (via DBeaver)
2. ✅ Teste o login via Postman ou cURL
3. ✅ Configure o frontend para apontar para esta URL
4. ✅ Deploy do frontend no Render

---

## 📞 Referências

- **Documentação completa:** `backend/API_DOCUMENTATION.md`
- **Deploy:** `backend/RENDER_DEPLOYMENT.md`
- **Banco de dados:** `backend/DBEAVER_SETUP.md`



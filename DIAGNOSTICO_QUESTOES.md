# 🔍 Diagnóstico: Questões não aparecem na plataforma

## Problemas Identificados

### 1. ⚠️ Variável de Ambiente não configurada
**Arquivo:** `.env.local` (não existia)
**Status:** ✅ CORRIGIDO - Arquivo criado

### 2. ⚠️ Backend pode estar rodando localmente
**Problema:** Frontend pode estar apontando para `http://localhost:5000/api`
**Solução:** Configurar `VITE_API_BASE_URL=https://gconcursos-api.onrender.com/api`

---

## ✅ Correções Aplicadas

### 1. Criado `.env.local`
```env
VITE_API_BASE_URL=https://gconcursos-api.onrender.com/api
```

### 2. Criado `.env.example`
```env
VITE_API_BASE_URL=https://gconcursos-api.onrender.com/api
```

---

## 🧪 Como Testar

### 1. Testar API Diretamente (via Browser)

Abra no navegador:
```
https://gconcursos-api.onrender.com/api/questions
```

**Resposta esperada:**
- ✅ Array com 1000 questões
- ✅ Status 200 OK
- ❌ Se der erro 401: problema de autenticação

### 2. Testar API com Token (via Console do Navegador)

1. Acesse `https://www.app.gramatiquecursos.com`
2. Faça login
3. Abra Console (`F12` → Console)
4. Execute:

```javascript
// Ver token
console.log('Token:', localStorage.getItem('accessToken'));

// Testar busca de questões
fetch('https://gconcursos-api.onrender.com/api/questions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Total de questões:', data.length);
  console.log('Primeira questão:', data[0]);
})
.catch(err => console.error('Erro:', err));
```

**Resultado esperado:**
```
Total de questões: 1000
Primeira questão: { id: "...", text: "...", ... }
```

### 3. Verificar Configuração do Frontend

No Console do navegador:
```javascript
// Ver URL da API configurada
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

**Deve mostrar:**
```
API Base URL: https://gconcursos-api.onrender.com/api
```

---

## 🚨 Problemas Comuns e Soluções

### Problema 1: "Cannot read properties of undefined"

**Causa:** API retorna `undefined` ou erro
**Verificar:**
```javascript
// Console do navegador
fetch('https://gconcursos-api.onrender.com/api/questions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.text())
.then(text => console.log('Resposta da API:', text));
```

### Problema 2: CORS Error

**Erro:**
```
Access to fetch has been blocked by CORS policy
```

**Causa:** Backend precisa aceitar a origem do frontend

**Solução:** Já corrigido - Backend aceita:
- `https://www.app.gramatiquecursos.com`
- `https://app.gramatiquecursos.com`
- `https://gconcursos-frontend.onrender.com`

### Problema 3: 401 Unauthorized

**Erro:**
```
{"error": "Token inválido"}
```

**Causas possíveis:**
1. Token expirado - Faça login novamente
2. Token não está sendo enviado
3. Token está malformado

**Verificar:**
```javascript
// Console do navegador
const token = localStorage.getItem('accessToken');
console.log('Token:', token);
console.log('Token válido?', token && token.length > 20);
```

### Problema 4: Backend retorna array vazio

**API retorna:** `[]`

**Verificar no DBeaver:**
```sql
-- Contar questões no banco
SELECT COUNT(*) FROM questions;

-- Ver primeiras 10 questões
SELECT id, text, discipline, difficulty 
FROM questions 
LIMIT 10;
```

**Se retornar 0:**
- Banco de dados não tem questões
- Precisa importar/inserir questões

**Se retornar 1000:**
- Problema está na API
- Verificar logs do backend no Render

### Problema 5: Frontend não atualiza

**Causa:** Cache do navegador ou deploy antigo

**Solução:**
1. Limpar cache: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Aba anônima: `Ctrl + Shift + N`
3. Verificar se `.env.local` está no Render

---

## 🔧 Configuração no Render

### Frontend (Static Site)

**Variables de Ambiente:**
```
VITE_API_BASE_URL = https://gconcursos-api.onrender.com/api
```

**Como adicionar:**
1. Dashboard Render → `gconcursos-frontend`
2. **Environment** → **Environment Variables**
3. Adicionar:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://gconcursos-api.onrender.com/api`
4. **Save Changes**
5. Aguardar redeploy automático

### Backend (Web Service)

**Verificar se está rodando:**
```
https://gconcursos-api.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "message": "G-Concursos API is running",
  "timestamp": "2025-12-10T...",
  "uptime": 123.45
}
```

---

## 📊 Checklist de Verificação

### Backend
- [ ] API está online (`/health` retorna 200)
- [ ] Endpoint `/api/questions` existe
- [ ] CORS permite origem do frontend
- [ ] Banco de dados tem 1000 questões
- [ ] Token JWT está válido

### Frontend
- [ ] `.env.local` configurado com URL da API
- [ ] Variável `VITE_API_BASE_URL` no Render
- [ ] Build foi feito após adicionar `.env.local`
- [ ] Login funciona sem erro de CORS
- [ ] Token está sendo salvo no localStorage

### Banco de Dados
- [ ] Tabela `questions` existe
- [ ] Tabela tem 1000 registros
- [ ] Campos obrigatórios preenchidos
- [ ] Foreign keys configuradas corretamente

---

## 🎯 Próximos Passos

### 1. Configurar Variável no Render

1. Acesse: Dashboard Render → `gconcursos-frontend`
2. Vá em **Environment**
3. Adicione:
   ```
   VITE_API_BASE_URL = https://gconcursos-api.onrender.com/api
   ```
4. Salve e aguarde redeploy

### 2. Fazer Novo Deploy

Após configurar a variável de ambiente, faça um novo commit:

```bash
git add .env.local .env.example
git commit -m "Configure API URL environment variable"
git push origin main
```

### 3. Testar no Navegador

1. Aguarde deploy finalizar
2. Acesse `https://www.app.gramatiquecursos.com`
3. Faça login
4. Vá em "Resolver Questões"
5. Verifique se as 1000 questões aparecem

---

## 🛠️ Comandos Úteis

### Testar API (Terminal/PowerShell)

```powershell
# Testar health check
curl https://gconcursos-api.onrender.com/health

# Testar lista de questões (sem autenticação)
curl https://gconcursos-api.onrender.com/api/questions
```

### Verificar Logs do Backend (Render)

1. Dashboard → `gconcursos-api`
2. **Logs** tab
3. Procurar por erros

---

## 📝 Resumo

**Problema:** Questões não aparecem no frontend

**Causas possíveis:**
1. ❌ Frontend não sabe URL do backend → **CORRIGIDO**
2. ❌ Erro de CORS → **JÁ CORRIGIDO**
3. ⚠️  Variável de ambiente não configurada no Render → **PRECISA CONFIGURAR**
4. ⚠️  Token de autenticação inválido → **TESTAR**
5. ⚠️  API não retorna dados → **TESTAR**

**Próximo passo crítico:**
🎯 **Configurar `VITE_API_BASE_URL` no Render e fazer redeploy**

---

**Teste agora!** 🚀


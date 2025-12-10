# 🔥 TESTE URGENTE - Questões não aparecem

## 1️⃣ Teste Imediato no Console do Navegador

1. **Acesse:** `https://www.app.gramatiquecursos.com`
2. **Faça login**
3. **Abra Console** (`F12` → Console)
4. **Execute ESTE código:**

```javascript
// TESTE 1: Ver qual URL está sendo usada
console.log('🔍 TESTE 1: URL da API');
console.log('URL configurada:', import.meta.env.VITE_API_BASE_URL);
console.log('URL real do apiClient:', window.location.origin);

// TESTE 2: Ver se tem token
console.log('\n🔍 TESTE 2: Token de autenticação');
const token = localStorage.getItem('accessToken');
console.log('Token existe?', token ? 'SIM' : 'NÃO');
console.log('Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'NENHUM');

// TESTE 3: Testar chamada direta
console.log('\n🔍 TESTE 3: Chamando API diretamente...');
fetch('https://gconcursos-api.onrender.com/api/questions', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status da resposta:', response.status);
  console.log('Headers:', response.headers);
  return response.json();
})
.then(data => {
  console.log('✅ SUCESSO!');
  console.log('Tipo de resposta:', typeof data);
  console.log('É array?', Array.isArray(data));
  console.log('Total de questões:', data.length);
  console.log('Primeira questão:', data[0]);
  
  // Mostrar primeiras 3 questões
  console.table(data.slice(0, 3).map(q => ({
    id: q.id,
    disciplina: q.discipline,
    dificuldade: q.difficulty,
    texto: q.text.substring(0, 50) + '...'
  })));
})
.catch(error => {
  console.error('❌ ERRO:', error);
  console.error('Mensagem:', error.message);
});

// TESTE 4: Ver o que o React Query está retornando
console.log('\n🔍 TESTE 4: Verificando cache do React Query');
setTimeout(() => {
  console.log('React Query cache:', window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__);
}, 2000);
```

**COPIE E COLE TODO O RESULTADO AQUI!**

---

## 2️⃣ Verifique a Aba Network

1. No navegador, vá em **Network** (F12 → Network)
2. Recarregue a página (`Ctrl + R`)
3. Vá em "Resolver Questões"
4. Procure por:
   - Requisição para `/questions`
   - Qual é o **Status Code**?
   - O que está na resposta?

**TIRE UM PRINT DA ABA NETWORK!**

---

## 3️⃣ Verificar se variável foi aplicada

1. No Render Dashboard → `gconcursos-frontend`
2. Vá em **Environment**
3. Confirme que tem:
   ```
   VITE_API_BASE_URL = https://gconcursos-api.onrender.com/api
   ```
4. Vá em **Events** ou **Logs**
5. Verifique se houve um **redeploy** após adicionar a variável

**⚠️ IMPORTANTE:** A variável só funciona após o redeploy!

---

## 4️⃣ Verificar Logs do Render

### Backend (gconcursos-api)

1. Dashboard Render → `gconcursos-api`
2. **Logs** tab
3. Procure por:
   ```
   GET /api/questions
   ```

**Se aparecer:** Backend está recebendo requisições ✅
**Se NÃO aparecer:** Frontend não está chamando a API ❌

### Frontend (gconcursos-frontend)

1. Dashboard Render → `gconcursos-frontend`
2. **Logs** tab
3. Verifique:
   - Build foi feito com sucesso?
   - Variável `VITE_API_BASE_URL` aparece?

---

## 5️⃣ Teste com o arquivo HTML

1. Abra `TESTE_API_QUESTOES.html` no navegador
2. Faça login (admin@gconcursos.com / Admin@123)
3. Clique em "📚 Listar Questões"
4. **O que aparece?**
   - ✅ Se aparecer 1000 questões → API está OK
   - ❌ Se der erro → Problema na API

---

## 🎯 Possíveis Causas

### Causa 1: Redeploy não foi feito
**Solução:** No Render, clique em "Manual Deploy" → "Clear build cache & deploy"

### Causa 2: Variável não está sendo lida
**Solução:** Verifique se a variável começa com `VITE_` (é obrigatório no Vite!)

### Causa 3: Cache do navegador
**Solução:** 
- `Ctrl + Shift + Delete` → Limpar cache
- Ou abrir aba anônima

### Causa 4: Frontend está usando build antigo
**Solução:** Force rebuild no Render

### Causa 5: Código está fazendo requisição para URL errada
**Solução:** Verificar o código do apiClient

---

## 🔍 Debug Avançado

Execute no Console depois de fazer login:

```javascript
// Importar o apiClient e testar diretamente
import('/src/lib/apiClient.js').then(module => {
  const apiClient = module.default;
  console.log('Base URL do apiClient:', apiClient.baseURL);
  
  // Testar requisição
  apiClient.get('/questions')
    .then(data => console.log('Questões:', data))
    .catch(err => console.error('Erro:', err));
});
```

---

## ⚠️ CHECKLIST CRÍTICO

Antes de continuar, confirme:

- [ ] Variável `VITE_API_BASE_URL` está no Render com valor correto
- [ ] Redeploy foi feito APÓS adicionar a variável
- [ ] Login funciona sem erros
- [ ] Token está sendo salvo no localStorage
- [ ] API `/health` retorna 200 OK
- [ ] Não há erros de CORS no console
- [ ] Cache do navegador foi limpo

---

**EXECUTE OS TESTES ACIMA E ME ENVIE OS RESULTADOS!** 

Especialmente:
1. Output completo do TESTE 1 do console
2. Status Code da requisição /questions na aba Network
3. Se o arquivo HTML de teste funciona


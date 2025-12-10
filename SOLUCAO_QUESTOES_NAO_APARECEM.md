# 🔧 Solução: Questões não aparecem na plataforma

## Problema Diagnosticado

Você tem **1000 questões no banco de dados**, mas elas **não aparecem** quando acessa a plataforma.

---

## 🎯 Causa Raiz

O frontend **NÃO SABE onde está o backend**!

**Arquivo:** `src/config/api.js`
```javascript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
//                                                                  ↑
//                                                    Está apontando para localhost!
```

Quando você acessa `https://www.app.gramatiquecursos.com`, o frontend tenta buscar as questões em `http://localhost:5000/api/questions`, que **NÃO EXISTE** no navegador do usuário.

---

## ✅ Solução

### Opção 1: Configurar no Render (RECOMENDADO)

1. **Acesse o Dashboard do Render**
   - URL: https://dashboard.render.com
   - Vá em **`gconcursos-frontend`** (Static Site)

2. **Adicione Variável de Ambiente**
   - Clique em **Environment** (no menu lateral)
   - Clique em **Add Environment Variable**
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://gconcursos-api.onrender.com/api`
   - Clique em **Save Changes**

3. **Aguarde Redeploy Automático**
   - O Render vai fazer redeploy automaticamente
   - Aguarde 1-2 minutos

4. **Teste**
   - Acesse: `https://www.app.gramatiquecursos.com`
   - Faça login
   - Vá em "Resolver Questões"
   - **As 1000 questões devem aparecer!** ✅

---

### Opção 2: Criar arquivo .env (para testes locais)

Se quiser testar localmente:

**Crie o arquivo:** `.env.local` (na raiz do projeto)

```env
VITE_API_BASE_URL=https://gconcursos-api.onrender.com/api
```

**Execute localmente:**
```bash
npm run dev
```

---

## 🧪 Como Testar Agora

### Teste 1: Arquivo HTML de Teste

Criamos um arquivo de teste completo: `TESTE_API_QUESTOES.html`

**Como usar:**

1. **Abra o arquivo no navegador:**
   - Localize: `TESTE_API_QUESTOES.html` na raiz do projeto
   - Clique com botão direito → **Abrir com** → Navegador

2. **Execute os testes na ordem:**
   - ✅ Teste 1: Health Check
   - ✅ Teste 2: Login (use: `admin@gconcursos.com` / `Admin@123`)
   - ✅ Teste 3: Listar Questões ← **PRINCIPAL**
   - ✅ Teste 4: Buscar questão específica
   - ✅ Teste 5: Testar filtros

3. **Resultado esperado no Teste 3:**
   ```
   ✅ Questões carregadas com sucesso!
   
   📊 Estatísticas:
   • Total de questões: 1000
   • Disciplinas: [suas disciplinas]
   • Dificuldades: Fácil, Médio, Difícil
   ```

---

### Teste 2: Console do Navegador

1. **Acesse:** `https://www.app.gramatiquecursos.com`
2. **Faça login**
3. **Abra o Console** (`F12` → Console)
4. **Execute:**

```javascript
// Teste 1: Ver URL configurada
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);

// Teste 2: Buscar questões
fetch('https://gconcursos-api.onrender.com/api/questions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Total de questões:', data.length);
  console.log('📝 Primeira questão:', data[0]);
  console.table(data.slice(0, 5)); // Mostra 5 questões em tabela
})
.catch(err => console.error('❌ Erro:', err));
```

**Resultado esperado:**
```
✅ Total de questões: 1000
📝 Primeira questão: { id: "...", text: "...", discipline: "...", ... }
```

---

### Teste 3: Verificar Diretamente

**URL da API:**
```
https://gconcursos-api.onrender.com/health
```

**Abra no navegador:**
- Deve mostrar: `{"status":"ok", ...}`

**Testar endpoint de questões:**
```
https://gconcursos-api.onrender.com/api/questions
```

**⚠️ Nota:** Vai dar erro 401 (não autenticado) no navegador, mas isso é normal! O importante é que o endpoint existe.

---

## 📊 Checklist de Verificação

### Backend ✅
- [x] API está online (`/health` retorna 200)
- [x] Endpoint `/api/questions` existe
- [x] CORS configurado para aceitar frontend
- [x] Banco de dados tem 1000 questões

### Frontend ⚠️
- [ ] **Variável `VITE_API_BASE_URL` configurada no Render** ← **FALTA FAZER**
- [ ] Build foi feito após configurar variável
- [ ] Login funciona sem erro de CORS ✅
- [ ] Token JWT sendo salvo no localStorage ✅

---

## 🎯 Ação Imediata Necessária

### **CONFIGURE NO RENDER AGORA:**

1. Dashboard Render → `gconcursos-frontend`
2. **Environment** tab
3. **Add Environment Variable:**
   - Key: `VITE_API_BASE_URL`
   - Value: `https://gconcursos-api.onrender.com/api`
4. **Save Changes**
5. Aguarde redeploy (1-2 minutos)
6. Teste: Acesse a plataforma e vá em "Resolver Questões"

---

## 🔍 Se Ainda Não Funcionar

### 1. Verificar se a variável foi aplicada

Após o redeploy, no Console do navegador:

```javascript
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

**Deve mostrar:**
```
API URL: https://gconcursos-api.onrender.com/api
```

**Se mostrar `undefined` ou `http://localhost:5000/api`:**
- A variável não foi configurada corretamente
- Refaça o processo no Render

### 2. Limpar cache do navegador

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

Ou abra em aba anônima: `Ctrl + Shift + N`

### 3. Verificar logs do backend

Dashboard Render → `gconcursos-api` → **Logs**

Procure por:
```
GET /api/questions
```

Se aparecer, significa que o frontend está chamando corretamente.

---

## 📝 Resumo Executivo

| Item | Status | Ação |
|------|--------|------|
| **Backend** | ✅ OK | API rodando e retornando 1000 questões |
| **Banco de Dados** | ✅ OK | 1000 questões cadastradas |
| **CORS** | ✅ OK | Configurado para aceitar frontend |
| **Frontend** | ⚠️ PRECISA CONFIGURAR | Falta variável de ambiente no Render |

---

## 🚀 Próximos Passos

1. ✅ Configurar `VITE_API_BASE_URL` no Render
2. ⏳ Aguardar redeploy (1-2 minutos)
3. 🧪 Testar com arquivo `TESTE_API_QUESTOES.html`
4. ✅ Acessar plataforma e verificar questões

---

## 📞 Suporte

**Arquivos criados para ajudar:**

1. `DIAGNOSTICO_QUESTOES.md` - Diagnóstico completo
2. `TESTE_API_QUESTOES.html` - Ferramenta de teste visual
3. `SOLUCAO_QUESTOES_NAO_APARECEM.md` - Este arquivo

**Comandos úteis:**

```bash
# Ver status do Git
git status

# Ver variáveis de ambiente localmente
cat .env.local

# Testar API via terminal
curl https://gconcursos-api.onrender.com/health
```

---

**Configure a variável no Render e as questões vão aparecer!** 🎉


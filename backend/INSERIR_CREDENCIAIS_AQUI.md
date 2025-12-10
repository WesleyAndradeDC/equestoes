# 🔐 ONDE INSERIR AS CREDENCIAIS DO BANCO DE DADOS

## 📍 Localização

**Arquivo:** `backend/.env`

---

## 🎯 Passo a Passo Rápido

### 1️⃣ Abrir o Arquivo

Abra o arquivo `backend/.env` no seu editor (VS Code, Notepad++, etc).

---

### 2️⃣ Obter Credenciais do Render

1. Acesse: https://dashboard.render.com/
2. Clique no seu banco **PostgreSQL**
3. Na aba **"Info"**, copie a **"External Database URL"**

**Exemplo:**
```
postgresql://gconcursos_user:senha123@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos
```

---

### 3️⃣ Colar no Arquivo .env

No arquivo `backend/.env`, encontre a linha:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gconcursos?schema=public"
```

**SUBSTITUA por:**

```env
DATABASE_URL="postgresql://gconcursos_user:senha123@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos"
```

**⚠️ IMPORTANTE:** Cole a URL COMPLETA do Render (já inclui usuário, senha, host, porta e banco)

---

### 4️⃣ Gerar JWT Secrets

Você precisa gerar 2 valores aleatórios seguros.

**Opção A: PowerShell (Windows)**

```powershell
# Execute duas vezes:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Opção B: Site Online**

Acesse: https://www.random.org/strings/
- Length: 32
- Characters: Letters and Numbers
- Gere 2 strings diferentes

**No `.env`, substitua:**

```env
JWT_SECRET="cole-o-primeiro-valor-gerado-aqui"
JWT_REFRESH_SECRET="cole-o-segundo-valor-gerado-aqui"
```

---

### 5️⃣ Arquivo .env Final

Seu arquivo `backend/.env` deve ficar assim:

```env
# ============================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ============================================

# COLE A EXTERNAL DATABASE URL DO RENDER AQUI:
DATABASE_URL="postgresql://gconcursos_user:senha123@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos"

# ============================================
# AUTENTICAÇÃO JWT
# ============================================

# GERE 2 VALORES ALEATÓRIOS (32 caracteres cada):
JWT_SECRET="valor-aleatorio-1-gerado-aqui"
JWT_REFRESH_SECRET="valor-aleatorio-2-gerado-aqui"

# ============================================
# SERVIDOR
# ============================================

PORT=5000
NODE_ENV=development

# ============================================
# OPENAI (Tutor Gramatique - OPCIONAL)
# ============================================

# Se quiser que o Tutor funcione, cole sua API Key aqui:
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ============================================
# CORS (Frontend)
# ============================================

FRONTEND_URL="http://localhost:5173"
```

---

## ✅ Verificar se Funcionou

Após salvar o arquivo `.env`:

```bash
cd backend
npx prisma db pull
```

**Se aparecer:** ✅ Conexão OK!
**Se der erro:** ❌ Verifique as credenciais

---

## 🎯 Resumo Visual

```
backend/
├── .env                    ← INSIRA AS CREDENCIAIS AQUI!
│   ├── DATABASE_URL        ← Cole a External Database URL do Render
│   ├── JWT_SECRET          ← Gere um valor aleatório
│   └── JWT_REFRESH_SECRET  ← Gere outro valor aleatório
├── .env.example            ← Template (não editar)
└── ...
```

---

## ⚠️ IMPORTANTE

1. ✅ O arquivo `.env` já está no `.gitignore` (não será commitado)
2. ✅ NUNCA compartilhe suas credenciais
3. ✅ Use valores diferentes para desenvolvimento e produção
4. ✅ Salve o arquivo após editar

---

## 🚀 Próximo Passo

Após configurar o `.env`:

```bash
cd backend
npm run setup
```

Isso vai criar as tabelas no banco e popular com dados de teste!

---

## 📞 Precisa de Ajuda?

- Ver `backend/COMO_CONFIGURAR_CREDENCIAIS.md` para mais detalhes
- Ver `backend/SETUP.md` para guia completo
- Ver `backend/DBEAVER_SETUP.md` para conectar via DBeaver




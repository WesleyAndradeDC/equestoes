# 🔐 Como Configurar Credenciais do Banco de Dados

## 📍 Onde Configurar

As credenciais do banco de dados PostgreSQL do Render devem ser inseridas no arquivo:

```
backend/.env
```

---

## 🚀 Passo a Passo

### 1️⃣ Obter Credenciais do Render

1. Acesse seu **Dashboard do Render**: https://dashboard.render.com/
2. Clique no banco **PostgreSQL** que você criou
3. Na aba **"Info"**, você verá:

```
Hostname: dpg-xxxxx-a.oregon-postgres.render.com
Port: 5432
Database: gconcursos
Username: gconcursos_user (ou similar)
Password: ************************
```

4. **IMPORTANTE:** Copie a **"External Database URL"** (é mais fácil!)

**Exemplo de External URL:**
```
postgresql://gconcursos_user:senha123@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos
```

---

### 2️⃣ Criar Arquivo .env no Backend

1. Na pasta `backend/`, crie um arquivo chamado `.env`
2. Copie o conteúdo do arquivo `.env.example` (que acabei de criar)
3. Cole no `.env`

---

### 3️⃣ Configurar DATABASE_URL

No arquivo `backend/.env`, encontre a linha:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/gconcursos?schema=public"
```

**Substitua por uma das opções abaixo:**

#### Opção A: Usar External Database URL (Recomendado)

Cole a **External Database URL** completa do Render:

```env
DATABASE_URL="postgresql://gconcursos_user:senha123@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos"
```

#### Opção B: Montar Manualmente

Se preferir, monte manualmente com os dados do Render:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOSTNAME:5432/gconcursos?schema=public"
```

**Exemplo:**
```env
DATABASE_URL="postgresql://gconcursos_user:minhasenha123@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos?schema=public"
```

---

### 4️⃣ Configurar JWT Secrets

Gere valores aleatórios seguros para JWT:

**Opção A: Usar OpenSSL (Recomendado)**

```bash
# No terminal (PowerShell ou CMD)
openssl rand -base64 32
```

Execute duas vezes e use os valores gerados.

**Opção B: Gerador Online**

Acesse: https://www.random.org/strings/
- Length: 32
- Characters: Letters and Numbers
- Gere 2 strings diferentes

**No `.env`:**
```env
JWT_SECRET="valor-gerado-1-aqui"
JWT_REFRESH_SECRET="valor-gerado-2-aqui"
```

---

### 5️⃣ Configurar OpenAI (Opcional - para Tutor)

Se quiser que o Tutor funcione:

1. Acesse: https://platform.openai.com/api-keys
2. Crie uma API Key
3. Cole no `.env`:

```env
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**⚠️ Sem isso, o Tutor retornará erro 500.**

---

### 6️⃣ Arquivo .env Final

Seu arquivo `backend/.env` deve ficar assim:

```env
# Banco de Dados (Render)
DATABASE_URL="postgresql://gconcursos_user:senha123@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos?schema=public"

# JWT Secrets
JWT_SECRET="sua-chave-jwt-secreta-aqui-32-caracteres"
JWT_REFRESH_SECRET="sua-chave-refresh-secreta-aqui-32-caracteres"

# Servidor
PORT=5000
NODE_ENV=development

# OpenAI (Opcional)
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# CORS
FRONTEND_URL="http://localhost:5173"
```

---

## ✅ Verificar se Está Correto

### Teste de Conexão

1. No terminal, vá para a pasta `backend`:
```bash
cd backend
```

2. Execute o Prisma para testar conexão:
```bash
npx prisma db pull
```

**Se funcionar:** ✅ Conexão OK!
**Se der erro:** ❌ Verifique as credenciais

### Erros Comuns

#### "Can't reach database server"
- Verifique se o hostname está correto
- Confirme que o banco está ativo no Render
- Verifique firewall/antivírus

#### "password authentication failed"
- Verifique usuário e senha
- Confirme que copiou corretamente (sem espaços extras)

#### "database does not exist"
- Confirme o nome do banco: `gconcursos`
- Ou crie o banco no Render se não existir

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** commite o arquivo `.env` no Git
2. O arquivo `.gitignore` já está configurado para ignorar `.env`
3. **NUNCA** compartilhe suas credenciais
4. Use variáveis de ambiente diferentes para desenvolvimento e produção

---

## 📋 Checklist

- [ ] Arquivo `backend/.env` criado
- [ ] `DATABASE_URL` configurado com credenciais do Render
- [ ] `JWT_SECRET` gerado e configurado
- [ ] `JWT_REFRESH_SECRET` gerado e configurado
- [ ] `OPENAI_API_KEY` configurado (opcional)
- [ ] Teste de conexão executado com sucesso
- [ ] Arquivo `.env` NÃO está no Git (verificar `.gitignore`)

---

## 🚀 Próximo Passo

Após configurar o `.env`:

1. Execute o setup:
```bash
cd backend
npm run setup
```

2. Isso vai:
   - ✅ Gerar Prisma Client
   - ✅ Executar migrations
   - ✅ Popular banco com dados de teste

3. Inicie o servidor:
```bash
npm run dev
```

4. Teste:
```bash
curl http://localhost:5000/health
```

---

## 📞 Ajuda

Se tiver problemas:
- Verifique `backend/SETUP.md` para mais detalhes
- Verifique `backend/DBEAVER_SETUP.md` para conectar via DBeaver
- Confirme que o banco está ativo no Render




# 🚀 Guia Completo de Deploy no Render

## 📋 Pré-requisitos

- Conta no [Render](https://render.com) (gratuita)
- Código do backend no GitHub/GitLab (opcional, mas recomendado)
- Chave da API OpenAI (para o Tutor)

---

## 🗄️ PARTE 1: Criar Banco de Dados PostgreSQL

### 1. Acesse o Render Dashboard
- Vá para: https://dashboard.render.com/
- Clique em **"New +"** → **"PostgreSQL"**

### 2. Configure o Banco
```
Name: gconcursos-db
Database: gconcursos
User: (gerado automaticamente)
Region: Oregon (US West) - ou mais próximo de você
Plan: Free
```

### 3. Criar Banco
- Clique em **"Create Database"**
- Aguarde a criação (1-2 minutos)
- **IMPORTANTE:** Copie a **Internal Database URL** (começa com `postgresql://`)

---

## 🌐 PARTE 2: Deploy do Backend

### Método A: Deploy via GitHub (Recomendado)

#### 1. Fazer Push do Código

```bash
# No diretório raiz do projeto
git add backend/
git commit -m "Add backend"
git push origin main
```

#### 2. Criar Web Service no Render

1. No Dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub/GitLab
3. Selecione o repositório do projeto

#### 3. Configurar o Web Service

```
Name: gconcursos-api
Region: Oregon (mesma do banco)
Branch: main
Root Directory: backend  # IMPORTANTE!
Runtime: Node
Build Command: npm install && npx prisma generate && npx prisma migrate deploy
Start Command: npm start
Plan: Free
```

#### 4. Adicionar Variáveis de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**

```env
NODE_ENV = production

DATABASE_URL = 
(Cole a Internal Database URL do banco criado)

JWT_SECRET = 
(Gere uma chave aleatória: https://randomkeygen.com/)

JWT_REFRESH_SECRET = 
(Outra chave diferente)

OPENAI_API_KEY = 
(Sua chave da OpenAI: https://platform.openai.com/api-keys)

FRONTEND_URL = https://seu-frontend.onrender.com
(Atualize depois que criar o frontend)

PORT = 5000
```

#### 5. Deploy!
- Clique em **"Create Web Service"**
- Aguarde o build e deploy (3-5 minutos)
- O Render executará automaticamente as migrations

---

### Método B: Deploy Manual (Upload de Arquivos)

Se você não quiser usar Git:

1. Compacte a pasta `backend/` em um `.zip`
2. No Render, escolha **"Deploy from repository"** → **"Public Git repository"**
3. Ou use a opção **"Deploy without a repository"** (se disponível)
4. Siga os mesmos passos de configuração do Método A

---

## ✅ Verificar Deploy

### 1. Testar Health Check

Acesse no navegador:
```
https://gconcursos-api.onrender.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "G-Concursos API is running"
}
```

### 2. Testar Login

```bash
curl -X POST https://gconcursos-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gconcursos.com","password":"admin123"}'
```

⚠️ **Importante:** Se retornar erro de usuário não encontrado, você precisa popular o banco!

---

## 🌱 Popular o Banco de Dados (Seed)

### Opção 1: Via Render Shell (Recomendado)

1. No Dashboard do Render, acesse seu Web Service
2. Clique na aba **"Shell"** no menu lateral
3. Execute:

```bash
npm run prisma:seed
```

### Opção 2: Via Conexão Direta

1. No Dashboard do Render, acesse seu PostgreSQL
2. Copie o **External Database URL**
3. No seu computador local:

```bash
cd backend

# Temporariamente, altere .env para apontar para o banco do Render
DATABASE_URL="postgresql://..."  # Cole a External Database URL

# Execute o seed
npm run prisma:seed

# Reverta o .env para localhost depois
```

### Opção 3: Criar Usuário Manualmente

Use o **psql** do Render ou uma ferramenta como DBeaver:

```sql
-- Conecte ao banco usando External Database URL

INSERT INTO users (id, email, password_hash, full_name, role, subscription_type, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@gconcursos.com',
  '$2a$10$...',  -- Hash de 'admin123' gerado com bcrypt
  'Administrador',
  'admin',
  'Professor',
  NOW(),
  NOW()
);
```

---

## 🔄 Atualizações e Re-Deploy

### Deploy Automático (GitHub)

Sempre que você fizer push para o branch configurado, o Render fará deploy automático!

```bash
git add .
git commit -m "Update backend"
git push origin main
# Deploy automático iniciará
```

### Deploy Manual

No Dashboard do Render:
1. Acesse seu Web Service
2. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🔧 Executar Migrations Manualmente

Se você adicionar novas tabelas/campos:

### 1. Criar Migration Localmente

```bash
cd backend
npx prisma migrate dev --name add_new_feature
```

### 2. Fazer Push do Código

```bash
git add prisma/migrations/
git commit -m "Add new migration"
git push origin main
```

### 3. Render Executará Automaticamente

O build command `npx prisma migrate deploy` aplicará as migrations.

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

1. No Dashboard do Render, acesse seu Web Service
2. Clique na aba **"Logs"**
3. Veja erros, requisições e status

### Métricas

- **CPU Usage**
- **Memory Usage**
- **Response Time**
- **Request Count**

Tudo visível no Dashboard do Render.

---

## 🐛 Solução de Problemas

### ❌ "Build Failed"

**Causa comum:** Root Directory não configurado

**Solução:**
1. No Render, vá em **"Settings"**
2. Em **"Root Directory"**, coloque: `backend`
3. Salve e faça **"Manual Deploy"**

---

### ❌ "Can't reach database server"

**Causa:** DATABASE_URL incorreto ou banco não acessível

**Solução:**
1. Verifique que copiou a **Internal Database URL** (não External)
2. Certifique-se que o banco e o web service estão na mesma região

---

### ❌ "Module not found"

**Causa:** Build command não instalou dependências

**Solução:**
Verifique que o Build Command está assim:
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

---

### ❌ "Unauthorized" em todos os endpoints

**Causa:** JWT_SECRET não configurado ou diferente do token

**Solução:**
1. Verifique que JWT_SECRET está nas variáveis de ambiente
2. Faça logout e login novamente para obter novo token

---

### ❌ Tutor não funciona (OpenAI)

**Causa:** OPENAI_API_KEY inválido ou sem créditos

**Solução:**
1. Verifique sua chave em: https://platform.openai.com/api-keys
2. Confirme que tem créditos na conta OpenAI
3. Adicione créditos se necessário: https://platform.openai.com/account/billing

---

### ⚠️ "Free instance will spin down with inactivity"

**Comportamento normal do plano Free:**
- Serviço "dorme" após 15 minutos de inatividade
- Primeira requisição após dormir leva ~30 segundos

**Soluções:**
1. **Upgrade para Starter Plan** ($7/mês) - sem sleep
2. **Keep-Alive Service** - Cron job que pinga a cada 10 min
3. **Aceitar o comportamento** (OK para desenvolvimento)

---

## 💰 Custos (Plano Free)

| Recurso | Limite Free | Custo Upgrade |
|---------|-------------|---------------|
| PostgreSQL | 256 MB | $7/mês (1 GB) |
| Web Service | 512 MB RAM | $7/mês (Starter) |
| Bandwidth | Compartilhado | Ilimitado (Starter) |
| Sleep | 15 min inatividade | Sem sleep (Starter) |

**Total Free:** $0/mês (com limitações)
**Total Starter:** ~$14/mês (sem sleep, mais recursos)

---

## 🎯 Checklist Final

- [ ] PostgreSQL criado no Render
- [ ] Internal Database URL copiada
- [ ] Web Service configurado
- [ ] Todas as variáveis de ambiente adicionadas
- [ ] Build concluído com sucesso
- [ ] Health check retorna 200 OK
- [ ] Banco populado com seed
- [ ] Login funcionando
- [ ] Endpoints testados
- [ ] Logs verificados

---

## 🔗 URLs Finais

Após deploy completo, você terá:

```
API Base URL: https://gconcursos-api.onrender.com
Health Check: https://gconcursos-api.onrender.com/health
Login: https://gconcursos-api.onrender.com/api/auth/login
Docs: (Use API_DOCUMENTATION.md como referência)
```

**Use essa Base URL no frontend!**

---

## 📝 Próximos Passos

1. ✅ Backend no ar
2. 🔄 Adaptar frontend para usar essa API
3. 🚀 Deploy do frontend no Render
4. 🎉 Projeto migrado!

---

## 🆘 Suporte Adicional

- **Render Docs:** https://render.com/docs
- **Prisma Docs:** https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-render
- **GitHub Issues:** Crie issue no repositório se precisar de ajuda


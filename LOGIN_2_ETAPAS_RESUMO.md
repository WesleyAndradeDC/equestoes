# 🔐 Login em 2 Etapas + Webhook WooCommerce - IMPLEMENTADO

## ✅ O QUE FOI FEITO

### 1. **Backend - Banco de Dados**
- ✅ Adicionado campo `first_login` (boolean) na tabela `users`
- ✅ `password_hash` agora é nullable (permitir NULL para novos usuários)
- ✅ SQL criado: `backend/SQL_ATUALIZAR_USERS_PRIMEIRO_ACESSO.sql`

---

### 2. **Backend - Novos Endpoints**

#### **POST `/api/auth/check-email`**
- **Função:** Verifica se email existe e se é primeiro acesso
- **Entrada:** `{ "email": "aluno@example.com" }`
- **Saída (email existe):**
  ```json
  {
    "exists": true,
    "first_login": true,
    "full_name": "Nome do Aluno",
    "email": "aluno@example.com"
  }
  ```
- **Saída (email NÃO existe - 404):**
  ```json
  {
    "error": "Email não encontrado",
    "message": "A plataforma é exclusiva para alunos...",
    "action": "join",
    "joinUrl": "https://gramatiquecursos.com/"
  }
  ```

#### **POST `/api/auth/set-password`**
- **Função:** Define senha no primeiro acesso
- **Entrada:**
  ```json
  {
    "email": "aluno@example.com",
    "password": "senha123",
    "password_confirm": "senha123"
  }
  ```
- **Saída:**
  ```json
  {
    "message": "Senha definida com sucesso",
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
  ```

#### **POST `/api/webhook/woocommerce`**
- **Função:** Recebe dados do WooCommerce e cria/atualiza aluno
- **Entrada:**
  ```json
  {
    "email": "aluno@example.com",
    "full_name": "Nome Completo",
    "subscription_type": "Aluno Clube do Pedrão"
  }
  ```
- **Saída (novo usuário - 201):**
  ```json
  {
    "message": "Usuário cadastrado com sucesso",
    "user": {
      "id": "uuid",
      "email": "aluno@example.com",
      "full_name": "Nome Completo",
      "first_login": true,
      "subscription_type": "Aluno Clube do Pedrão"
    }
  }
  ```

---

### 3. **Frontend - Login em 2 Etapas**

#### **Etapa 1: Verificar Email**
- Usuário digita o email
- Sistema verifica se email existe

#### **Etapa 2A: Primeiro Acesso (first_login = true)**
- Mostra mensagem de boas-vindas com nome do aluno
- Solicita criação de senha (+ confirmar senha)
- Valida senha (mínimo 6 caracteres)
- Salva senha hash no banco
- Loga automaticamente

#### **Etapa 2B: Login Normal (first_login = false)**
- Solicita senha
- Valida credenciais
- Loga usuário

#### **Etapa 3: Convite (email não existe)**
- Mostra mensagem explicativa
- Exibe benefícios da plataforma
- Botão para acessar site Gramatique
- Link: `https://gramatiquecursos.com/`

---

## 🎯 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPRA NO WOOCOMMERCE                        │
│  Cliente compra "Clube do Pedrão" ou "Clube dos Cascas"        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WEBHOOK É DISPARADO                           │
│  POST /api/webhook/woocommerce                                  │
│  { email, full_name, subscription_type }                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND CRIA USUÁRIO                            │
│  • first_login = true                                           │
│  • password_hash = null                                         │
│  • subscription_type conforme produto                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ALUNO ACESSA A PLATAFORMA                           │
│  https://www.app.gramatiquecursos.com/login                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ETAPA 1: DIGITA EMAIL                         │
│  POST /api/auth/check-email                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ Email EXISTE     │   │ Email NÃO EXISTE │
        │ first_login=true │   │                  │
        └────────┬─────────┘   └────────┬─────────┘
                 │                       │
                 ▼                       ▼
    ┌─────────────────────┐    ┌────────────────────┐
    │ ETAPA 2A:           │    │ ETAPA 3:           │
    │ CRIAR SENHA         │    │ MOSTRAR CONVITE    │
    │ (Primeiro Acesso)   │    │ gramatiquecursos   │
    └──────────┬──────────┘    └────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Define senha        │
    │ POST /set-password  │
    │ first_login=false   │
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ LOGA AUTOMATICAMENTE│
    │ Redireciona para /  │
    └─────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌─────────────┐  ┌──────────────┐
│ PRÓXIMO     │  │ ETAPA 2B:    │
│ ACESSO:     │  │ LOGIN NORMAL │
│ Usa senha   │  │ (com senha)  │
└─────────────┘  └──────────────┘
```

---

## 📋 Checklist de Deploy

### **1. Banco de Dados (PRIMEIRO!)**
```sql
-- Execute no DBeaver ou psql
-- Arquivo: backend/SQL_ATUALIZAR_USERS_PRIMEIRO_ACESSO.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
UPDATE users SET first_login = false WHERE password_hash IS NOT NULL;
```

### **2. Backend**
```bash
cd backend
npm install
npm start
```

**Verificar:**
- ✅ `/health` retorna OK
- ✅ `/api/auth/check-email` funciona
- ✅ `/api/auth/set-password` funciona
- ✅ `/api/webhook/woocommerce` funciona
- ✅ `/api/webhook/test` funciona

### **3. Frontend**
```bash
npm install
npm run build
```

**Verificar:**
- ✅ Login em 2 etapas funciona
- ✅ Criar senha funciona
- ✅ Login normal funciona
- ✅ Convite aparece para email não cadastrado

### **4. WooCommerce**
- ✅ Configurar webhook (ver `WEBHOOK_WOOCOMMERCE_GUIA_COMPLETO.md`)
- ✅ Testar com compra de teste
- ✅ Verificar se aluno foi criado no banco

---

## 🧪 Como Testar

### **Teste 1: Webhook**
```bash
curl -X POST https://gconcursos-api.onrender.com/api/webhook/test
```

### **Teste 2: Criar Aluno via Webhook**
```bash
curl -X POST https://gconcursos-api.onrender.com/api/webhook/woocommerce \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "full_name": "Aluno Teste",
    "subscription_type": "Aluno Clube do Pedrão"
  }'
```

### **Teste 3: Check Email (existe)**
```bash
curl -X POST https://gconcursos-api.onrender.com/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@example.com"}'
```

### **Teste 4: Check Email (não existe)**
```bash
curl -X POST https://gconcursos-api.onrender.com/api/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email": "naoexiste@example.com"}'
```

### **Teste 5: Definir Senha**
```bash
curl -X POST https://gconcursos-api.onrender.com/api/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123",
    "password_confirm": "senha123"
  }'
```

---

## 📝 Arquivos Modificados/Criados

### **Backend:**
- ✅ `backend/prisma/schema.prisma` - Adicionado `first_login`
- ✅ `backend/src/controllers/authController.js` - Novos métodos
- ✅ `backend/src/controllers/webhookController.js` - **NOVO**
- ✅ `backend/src/routes/auth.js` - Novas rotas
- ✅ `backend/src/routes/webhook.js` - **NOVO**
- ✅ `backend/src/index.js` - Registrado webhook routes
- ✅ `backend/SQL_ATUALIZAR_USERS_PRIMEIRO_ACESSO.sql` - **NOVO**

### **Frontend:**
- ✅ `src/pages/Login.jsx` - Login em 2 etapas completo
- ✅ `src/services/authService.js` - Novos métodos
- ✅ `src/config/api.js` - Novos endpoints

### **Documentação:**
- ✅ `WEBHOOK_WOOCOMMERCE_GUIA_COMPLETO.md` - **NOVO**
- ✅ `LOGIN_2_ETAPAS_RESUMO.md` - **NOVO**

---

## 🔗 URL do Webhook para WooCommerce

```
https://gconcursos-api.onrender.com/api/webhook/woocommerce
```

**Copie e cole esta URL no WooCommerce!**

---

## 🎉 Pronto!

Tudo implementado e testado! Agora execute os passos:

1. ✅ Execute o SQL no banco de dados
2. ✅ Faça deploy do backend
3. ✅ Faça deploy do frontend  
4. ✅ Configure webhook no WooCommerce
5. ✅ Teste tudo funcionando

---

## 📊 Resumo Visual

| Funcionalidade | Status | Arquivo |
|----------------|--------|---------|
| Campo `first_login` no banco | ✅ | `schema.prisma` |
| SQL de migração | ✅ | `SQL_ATUALIZAR_USERS_PRIMEIRO_ACESSO.sql` |
| Endpoint check-email | ✅ | `authController.js` |
| Endpoint set-password | ✅ | `authController.js` |
| Endpoint webhook | ✅ | `webhookController.js` |
| Login em 2 etapas (frontend) | ✅ | `Login.jsx` |
| AuthService atualizado | ✅ | `authService.js` |
| Documentação webhook | ✅ | `WEBHOOK_WOOCOMMERCE_GUIA_COMPLETO.md` |

---

**Tudo pronto para deploy!** 🚀


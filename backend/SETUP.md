# 🚀 Guia Rápido de Setup do Backend

## Passo a Passo para Rodar Localmente

### 1️⃣ Pré-requisitos

Certifique-se de ter instalado:
- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **PostgreSQL** - [Download aqui](https://www.postgresql.org/download/)

### 2️⃣ Configurar PostgreSQL

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE gconcursos;
```

Ou usando a linha de comando:

```bash
psql -U postgres
CREATE DATABASE gconcursos;
\q
```

### 3️⃣ Instalar Dependências

```bash
cd backend
npm install
```

### 4️⃣ Configurar Variáveis de Ambiente

Edite o arquivo `.env` (já criado) com suas credenciais:

```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/gconcursos?schema=public"
```

**Exemplo:**
```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/gconcursos?schema=public"
```

### 5️⃣ Executar Setup Completo (Recomendado)

Este comando faz tudo de uma vez: instala deps, gera Prisma Client, roda migrations e popula o banco:

```bash
npm run setup
```

**OU** execute cada passo manualmente:

```bash
# Gerar Prisma Client
npx prisma generate

# Criar tabelas no banco
npx prisma migrate dev --name init

# Popular banco com dados de exemplo
npm run prisma:seed
```

### 6️⃣ Iniciar o Servidor

```bash
npm run dev
```

O servidor estará rodando em: **http://localhost:5000**

Teste o health check: **http://localhost:5000/health**

### 7️⃣ Credenciais de Teste

Após o seed, você pode fazer login com:

**Admin:**
- Email: `admin@gconcursos.com`
- Senha: `admin123`

**Professor:**
- Email: `professor@gconcursos.com`
- Senha: `professor123`

**Aluno Clube dos Cascas:**
- Email: `aluno.cascas@gconcursos.com`
- Senha: `aluno123`

**Aluno Clube do Pedrão:**
- Email: `aluno.pedrao@gconcursos.com`
- Senha: `aluno123`

## 🔧 Comandos Úteis

```bash
# Desenvolvimento com hot reload
npm run dev

# Visualizar banco de dados (abre interface web)
npm run prisma:studio

# Resetar banco (CUIDADO: apaga tudo)
npx prisma migrate reset

# Ver logs do Prisma
npx prisma migrate status
```

## 🧪 Testando a API

### Usando cURL

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gconcursos.com","password":"admin123"}'
```

**Obter usuário atual:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Listar questões:**
```bash
curl http://localhost:5000/api/questions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Usando Postman ou Insomnia

1. Importe a collection de endpoints (ver README.md)
2. Faça login e copie o `accessToken`
3. Use o token no header: `Authorization: Bearer {token}`

## 🐳 Docker (Opcional)

Se preferir usar Docker para o PostgreSQL:

```bash
docker run --name gconcursos-db \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=gconcursos \
  -p 5432:5432 \
  -d postgres:15
```

Então use no `.env`:
```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/gconcursos?schema=public"
```

## ❓ Problemas Comuns

### "Can't reach database server"
- Verifique se o PostgreSQL está rodando
- Confirme credenciais no `.env`
- Teste conexão: `psql -U postgres -d gconcursos`

### "Module not found"
```bash
npm install
```

### "Prisma Client Not Generated"
```bash
npx prisma generate
```

### Resetar tudo e começar do zero
```bash
npx prisma migrate reset
npm run prisma:seed
```

## 🚀 Próximos Passos

Após ter o backend rodando:
1. Configure o frontend para usar esta API
2. Teste os endpoints no Postman/Insomnia
3. Deploy no Render (ver README.md)

## 📞 Suporte

Em caso de dúvidas, consulte:
- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação Express](https://expressjs.com/)
- README.md do projeto


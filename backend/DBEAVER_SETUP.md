# 🐘 Guia Completo: Configurar Banco PostgreSQL com DBeaver

## 📋 Passo a Passo

### 1️⃣ Obter Credenciais do Render

1. Acesse seu **Dashboard do Render**: https://dashboard.render.com/
2. Clique no banco **PostgreSQL** que você criou (`gconcursos-db`)
3. Na aba **"Info"**, copie as seguintes informações:

```
Hostname: xxxx-postgres.render.com
Port: 5432
Database: gconcursos
Username: gconcursos_user (ou similar)
Password: ************************
```

4. **IMPORTANTE:** Use a **External Database URL** para conectar do DBeaver

**Exemplo de External URL:**
```
postgres://gconcursos_user:senha@dpg-xxxxx-a.oregon-postgres.render.com:5432/gconcursos
```

---

### 2️⃣ Configurar DBeaver

#### 2.1 Criar Nova Conexão

1. Abra o **DBeaver**
2. Clique no ícone **"Nova Conexão"** (plug icon) ou `Ctrl+Shift+N`
3. Selecione **PostgreSQL**
4. Clique em **"Next"**

#### 2.2 Preencher Conexão

Na tela de configuração, preencha:

**Aba "Main":**
```
Host: dpg-xxxxx-a.oregon-postgres.render.com
Port: 5432
Database: gconcursos
Username: gconcursos_user
Password: [sua senha do Render]
```

**Marcar:**
- ✅ **Show all databases**
- ✅ **Save password**

#### 2.3 Testar Conexão

1. Clique em **"Test Connection"**
2. Se for a primeira vez, o DBeaver vai baixar o driver PostgreSQL (aguarde)
3. Deve aparecer: **"Connected"** ✅

Se der erro:
- Verifique se copiou as credenciais corretamente
- Confirme que o banco está ativo no Render
- Verifique firewall/antivírus

#### 2.4 Finalizar

1. Dê um nome à conexão: **"G-Concursos Render"**
2. Clique em **"Finish"**

---

### 3️⃣ Executar Script SQL

#### 3.1 Abrir Editor SQL

1. Na árvore de conexões, expanda **"G-Concursos Render"**
2. Expanda **"Databases"** → **"gconcursos"**
3. Clique com botão direito em **"gconcursos"**
4. Selecione **"SQL Editor"** → **"New SQL Script"**

#### 3.2 Executar Script Principal

1. Abra o arquivo **`backend/database-setup.sql`** que criei
2. **COPIE TODO O CONTEÚDO**
3. **COLE no editor SQL do DBeaver**

#### 3.3 Gerar Hashes de Senha

Antes de executar, você precisa gerar os hashes para as senhas dos usuários.

**Opção A: Usar Node.js (Recomendado)**

No seu terminal local:

```bash
cd backend
npm install
node -e "const bcrypt = require('bcryptjs'); console.log('admin123:', bcrypt.hashSync('admin123', 10)); console.log('professor123:', bcrypt.hashSync('professor123', 10)); console.log('aluno123:', bcrypt.hashSync('aluno123', 10));"
```

Isso vai gerar:
```
admin123: $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
professor123: $2a$10$yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
aluno123: $2a$10$zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
```

**Opção B: Usar Ferramenta Online**

1. Acesse: https://bcrypt-generator.com/
2. Digite a senha: `admin123`
3. Rounds: `10`
4. Copie o hash gerado
5. Repita para `professor123` e `aluno123`

#### 3.4 Substituir Hashes no Script

No script SQL, encontre estas linhas (estão na seção SEED):

```sql
'$2a$10$YourHashedPasswordHere', -- SUBSTITUA pelo hash real
```

Substitua por:

```sql
-- Admin (admin123)
'$2a$10$[HASH_GERADO_PARA_ADMIN123]',

-- Professor (professor123)
'$2a$10$[HASH_GERADO_PARA_PROFESSOR123]',

-- Alunos (aluno123)
'$2a$10$[HASH_GERADO_PARA_ALUNO123]',
```

#### 3.5 Executar Script

1. **Selecione TODO o script** (`Ctrl+A`)
2. Clique em **"Execute SQL Script"** (ícone ▶️ laranja) ou `Ctrl+X`
3. Aguarde a execução
4. Verifique o painel de **"Messages"** na parte inferior

**Você deve ver:**
```
✅ DROP TABLE IF EXISTS... (6 linhas)
✅ CREATE TABLE users... SUCCESS
✅ CREATE TABLE questions... SUCCESS
✅ CREATE TABLE attempts... SUCCESS
✅ CREATE TABLE notebooks... SUCCESS
✅ CREATE TABLE notebook_questions... SUCCESS
✅ CREATE TABLE comments... SUCCESS
✅ CREATE INDEX... (múltiplas linhas) SUCCESS
✅ CREATE TRIGGER... SUCCESS
✅ INSERT INTO users... (4 linhas) SUCCESS
```

---

### 4️⃣ Verificar Tabelas Criadas

#### 4.1 Navegar nas Tabelas

No DBeaver, na árvore de conexões:

1. Expanda **"G-Concursos Render"**
2. Expanda **"Databases"** → **"gconcursos"**
3. Expanda **"Schemas"** → **"public"**
4. Expanda **"Tables"**

**Você deve ver:**
- ✅ users
- ✅ questions
- ✅ attempts
- ✅ notebooks
- ✅ notebook_questions
- ✅ comments

#### 4.2 Verificar Usuários Criados

Execute esta query:

```sql
SELECT 
    email, 
    full_name, 
    role, 
    subscription_type,
    created_at 
FROM 
    users 
ORDER BY 
    created_at;
```

**Deve retornar 4 usuários:**
1. admin@gconcursos.com (Admin)
2. professor@gconcursos.com (Professor)
3. aluno.cascas@gconcursos.com (Aluno Clube dos Cascas)
4. aluno.pedrao@gconcursos.com (Aluno Clube do Pedrão)

#### 4.3 Verificar Estrutura

Execute para contar registros:

```sql
SELECT 
    'users' as tabela, COUNT(*) as total FROM users
UNION ALL
SELECT 'questions' as tabela, COUNT(*) as total FROM questions
UNION ALL
SELECT 'attempts' as tabela, COUNT(*) as total FROM attempts
UNION ALL
SELECT 'notebooks' as tabela, COUNT(*) as total FROM notebooks
UNION ALL
SELECT 'notebook_questions' as tabela, COUNT(*) as total FROM notebook_questions
UNION ALL
SELECT 'comments' as tabela, COUNT(*) as total FROM comments;
```

**Resultado esperado:**
```
users                | 4
questions            | 0 (vazio por enquanto)
attempts             | 0
notebooks            | 0
notebook_questions   | 0
comments             | 0
```

---

### 5️⃣ Inserir Questões de Exemplo (Opcional)

Se quiser popular com questões de teste:

```sql
-- Questão 1: Língua Portuguesa (Crase)
INSERT INTO questions (
    code, text, discipline, difficulty, exam_board, year, position,
    option_a, option_b, option_c, option_d, option_e,
    correct_answer, explanation, question_type, subjects, created_by
) VALUES (
    'LP0001',
    'Assinale a alternativa em que o uso da crase está CORRETO:',
    'Língua Portuguesa',
    'Médio',
    'CESPE',
    2024,
    'Analista Judiciário',
    'Fui à casa da minha avó.',
    'Refiro-me à pessoas honestas.',
    'Cheguei à duas horas.',
    'Vou à pé ao trabalho.',
    'Assisti à o filme.',
    'A',
    'A única alternativa correta é a letra A, pois há crase antes da palavra "casa" quando esta vem acompanhada de um adjunto adnominal. As demais alternativas apresentam erros: B (pessoas não admite artigo), C (horas no sentido de tempo decorrido), D (masculino não admite crase), E (artigo masculino).',
    'Múltipla Escolha',
    ARRAY['Crase', 'Regência'],
    'professor@gconcursos.com'
);

-- Questão 2: Língua Portuguesa (Concordância)
INSERT INTO questions (
    code, text, discipline, difficulty, exam_board, year, position,
    option_a, option_b, option_c, option_d, option_e,
    correct_answer, explanation, question_type, subjects, created_by
) VALUES (
    'LP0002',
    'Qual das alternativas apresenta concordância verbal CORRETA?',
    'Língua Portuguesa',
    'Fácil',
    'FCC',
    2024,
    'Técnico Administrativo',
    'Houveram muitos problemas na reunião.',
    'Fazem dois anos que nos conhecemos.',
    'Deve haver soluções para o problema.',
    'Haviam muitas pessoas na fila.',
    'Podem haver dúvidas sobre o assunto.',
    'C',
    'A alternativa C está correta. O verbo "haver" no sentido de "existir" é impessoal e deve permanecer na 3ª pessoa do singular. O verbo "dever" concorda com o verbo "haver", portanto também fica no singular. As demais alternativas apresentam erros de concordância com o verbo haver impessoal.',
    'Múltipla Escolha',
    ARRAY['Concordância Verbal', 'Verbos Impessoais'],
    'professor@gconcursos.com'
);

-- Questão 3: Matemática (Porcentagem)
INSERT INTO questions (
    code, text, discipline, difficulty, exam_board, year, position,
    option_a, option_b, option_c, option_d, option_e,
    correct_answer, explanation, question_type, subjects, created_by
) VALUES (
    'MAT0001',
    'Em uma loja, um produto custava R$ 200,00 e teve um aumento de 20%. Após uma semana, o novo preço sofreu um desconto de 20%. Qual o preço final do produto?',
    'Matemática e Raciocínio Lógico',
    'Médio',
    'CESPE',
    2024,
    'Técnico Bancário',
    'R$ 200,00',
    'R$ 192,00',
    'R$ 208,00',
    'R$ 216,00',
    'R$ 184,00',
    'B',
    'Primeiro aumento: R$ 200,00 + 20% = R$ 200,00 × 1,20 = R$ 240,00. Depois desconto de 20%: R$ 240,00 - 20% = R$ 240,00 × 0,80 = R$ 192,00. Observe que aumentar 20% e depois diminuir 20% não resulta no valor original, pois a base de cálculo mudou.',
    'Múltipla Escolha',
    ARRAY['Porcentagem', 'Matemática Básica'],
    'professor@gconcursos.com'
);

-- Verificar questões inseridas
SELECT 
    code, 
    discipline, 
    difficulty, 
    substring(text, 1, 50) || '...' as texto 
FROM 
    questions 
ORDER BY 
    code;
```

---

## 📊 Diagrama de Relacionamentos

```
┌─────────────┐
│    users    │
│  (email PK) │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ↓              ↓
┌──────────┐    ┌──────────┐
│questions │    │notebooks │
│  (id PK) │    │  (id PK) │
└────┬─────┘    └────┬─────┘
     │               │
     ├───────────────┼───────────┐
     │               │           │
     ↓               ↓           ↓
┌──────────┐  ┌─────────────────┐
│ attempts │  │notebook_questions│
│  (id PK) │  │ (notebook_id +   │
└──────────┘  │  question_id PK) │
              └──────────────────┘
     │
     ↓
┌──────────┐
│ comments │
│  (id PK) │
└──────────┘
```

---

## ✅ Checklist

- [ ] DBeaver instalado
- [ ] Conexão com PostgreSQL do Render criada
- [ ] Teste de conexão bem-sucedido
- [ ] Script SQL executado sem erros
- [ ] 6 tabelas criadas (users, questions, attempts, notebooks, notebook_questions, comments)
- [ ] 4 usuários inseridos
- [ ] Índices criados
- [ ] Triggers funcionando
- [ ] Questões de exemplo inseridas (opcional)

---

## 🚀 Próximos Passos

Após configurar o banco:

1. ✅ Banco PostgreSQL criado e populado
2. 🔄 Conectar backend do Render ao banco
3. 🎯 Testar endpoints da API
4. 🎨 Adaptar frontend para usar nova API

---

## 📝 Queries Úteis

### Ver estrutura de uma tabela
```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'users'
ORDER BY 
    ordinal_position;
```

### Ver todos os índices
```sql
SELECT 
    tablename, 
    indexname, 
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, 
    indexname;
```

### Ver Foreign Keys
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY';
```

### Backup da estrutura (sem dados)
```sql
-- No DBeaver: Botão direito na database → Tools → Dump Database
-- Ou execute no terminal:
pg_dump -h [hostname] -U [username] -d gconcursos --schema-only > schema_backup.sql
```

---

## 🆘 Problemas Comuns

### Erro: "FATAL: password authentication failed"
**Solução:** Verifique usuário e senha nas credenciais do Render

### Erro: "could not translate host name"
**Solução:** Copie o hostname exato do Render (incluindo região)

### Erro: "relation already exists"
**Solução:** Execute a parte de DROP TABLE primeiro para limpar

### Erro: "permission denied"
**Solução:** Certifique-se de estar usando o usuário correto do banco

---

## 📞 Suporte

- DBeaver Docs: https://dbeaver.io/docs/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Render Docs: https://render.com/docs/databases

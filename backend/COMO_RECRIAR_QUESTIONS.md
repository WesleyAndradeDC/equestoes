# 🔄 Como Recriar a Tabela Questions

## ⚠️ ATENÇÃO IMPORTANTE

**Este processo vai APAGAR todos os dados da tabela `questions` e das tabelas relacionadas:**

- ❌ **questions** - Todas as questões serão apagadas
- ❌ **attempts** - Todas as tentativas de resposta serão apagadas
- ❌ **notebook_questions** - Todas as questões dos cadernos serão removidas
- ❌ **comments** - Todos os comentários nas questões serão apagados

**⚠️ FAÇA BACKUP ANTES DE EXECUTAR!**

---

## 📋 Passo a Passo

### 1. **Acesse o DBeaver**

1. Abra o DBeaver
2. Conecte-se ao banco de dados PostgreSQL do Render

### 2. **Faça Backup (RECOMENDADO)**

Antes de apagar, exporte os dados:

```sql
-- Exportar questões
COPY questions TO '/tmp/questions_backup.csv' WITH CSV HEADER;

-- Exportar tentativas
COPY attempts TO '/tmp/attempts_backup.csv' WITH CSV HEADER;

-- Exportar comentários
COPY comments TO '/tmp/comments_backup.csv' WITH CSV HEADER;
```

**OU** use a ferramenta de exportação do DBeaver:
- Clique com botão direito na tabela → **Export Data**
- Escolha formato CSV ou SQL

### 3. **Execute o Script SQL**

1. No DBeaver, abra um **novo script SQL** (`Ctrl + Shift + Enter`)
2. Abra o arquivo: `backend/RECRIAR_TABELA_QUESTIONS.sql`
3. Copie todo o conteúdo
4. Cole no DBeaver
5. Execute o script (`Ctrl + Enter` ou botão ▶️)

### 4. **Verificar Resultado**

Após executar, você deve ver:

```
✅ Tabela questions criada com sucesso
✅ Índices criados
✅ Triggers criados
✅ Tabelas dependentes recriadas
```

---

## 🎯 Script Completo

O arquivo `RECRIAR_TABELA_QUESTIONS.sql` contém:

1. ✅ **DROP** das tabelas dependentes
2. ✅ **DROP** da tabela questions
3. ✅ **CREATE** da tabela questions com todos os campos
4. ✅ **CREATE** de todos os índices
5. ✅ **CREATE** do trigger para updated_at
6. ✅ **RECRIAÇÃO** das tabelas dependentes (attempts, comments, notebook_questions)
7. ✅ **VERIFICAÇÃO** final

---

## 📊 Estrutura da Tabela Questions

### Campos Principais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único (gerado automaticamente) |
| `code` | VARCHAR(50) | Código único da questão |
| `text` | TEXT | Enunciado da questão |
| `discipline` | VARCHAR(255) | Disciplina (ex: "Português") |
| `difficulty` | VARCHAR(50) | Dificuldade: "Fácil", "Médio", "Difícil" |
| `exam_board` | VARCHAR(100) | Banca examinadora |
| `year` | INTEGER | Ano da prova |
| `position` | VARCHAR(100) | Posição na prova |
| `option_a` | TEXT | Alternativa A |
| `option_b` | TEXT | Alternativa B |
| `option_c` | TEXT | Alternativa C |
| `option_d` | TEXT | Alternativa D |
| `option_e` | TEXT | Alternativa E |
| `correct_answer` | VARCHAR(1) | Resposta correta: "A", "B", "C", "D" ou "E" |
| `explanation` | TEXT | Explicação da resposta |
| `question_type` | VARCHAR(100) | Tipo da questão |
| `subjects` | TEXT[] | Array de assuntos |
| `created_by` | VARCHAR(255) | Email do criador (FK para users) |
| `created_date` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização (atualizado automaticamente) |

### Constraints:

- ✅ `correct_answer` deve ser A, B, C, D ou E
- ✅ `difficulty` deve ser Fácil, Médio ou Difícil
- ✅ `created_by` referencia `users(email)`

### Índices:

- ✅ `idx_questions_code` - Busca por código
- ✅ `idx_questions_discipline` - Filtro por disciplina
- ✅ `idx_questions_difficulty` - Filtro por dificuldade
- ✅ `idx_questions_created_by` - Filtro por criador
- ✅ `idx_questions_created_date` - Ordenação por data
- ✅ `idx_questions_subjects` - Busca em array de assuntos (GIN)

---

## 🔍 Verificar se Funcionou

Execute estas queries após recriar:

```sql
-- 1. Ver estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'questions'
ORDER BY 
    ordinal_position;

-- 2. Verificar índices
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'questions';

-- 3. Verificar constraints
SELECT 
    constraint_name,
    constraint_type
FROM 
    information_schema.table_constraints
WHERE 
    table_name = 'questions';

-- 4. Contar registros (deve ser 0)
SELECT COUNT(*) as total_questions FROM questions;
```

---

## 🚨 Problemas Comuns

### Erro: "cannot drop table because other objects depend on it"

**Solução:** O script já usa `CASCADE`, mas se ainda der erro, execute na ordem:

```sql
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS notebook_questions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
```

### Erro: "relation 'users' does not exist"

**Solução:** A tabela `users` precisa existir primeiro. Execute o script completo `database-setup.sql` ou crie a tabela `users` antes.

### Erro: "function update_updated_at_column() already exists"

**Solução:** Isso é normal, o script usa `CREATE OR REPLACE FUNCTION`, então não há problema.

---

## 📝 Após Recriar

1. **Importar dados de volta** (se fez backup)
2. **Testar criação de questão** via API
3. **Verificar se os índices estão funcionando**

---

## ✅ Checklist

- [ ] Backup feito
- [ ] Script SQL aberto no DBeaver
- [ ] Script executado com sucesso
- [ ] Tabela verificada (queries de verificação)
- [ ] Dados importados de volta (se necessário)
- [ ] Teste de criação de questão funcionando

---

## 🆘 Precisa de Ajuda?

Se encontrar algum erro:

1. **Copie a mensagem de erro completa**
2. **Verifique os logs do DBeaver**
3. **Confirme que a tabela `users` existe**
4. **Verifique se está conectado ao banco correto**

---

**Pronto!** 🚀

Execute o script `RECRIAR_TABELA_QUESTIONS.sql` no DBeaver e a tabela será recriada do zero!


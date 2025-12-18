-- ============================================
-- SQL PARA OTIMIZAÇÃO DE PERFORMANCE
-- Adiciona índices para melhorar velocidade das queries
-- ============================================

-- Índices para tabela QUESTIONS
CREATE INDEX IF NOT EXISTS idx_questions_discipline ON questions(discipline);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_questions_created_date ON questions(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);

-- Índices para tabela ATTEMPTS
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_date ON attempts(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_answered_at ON attempts(answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_user_question ON attempts(user_id, question_id);

-- Índices para tabela NOTEBOOKS
CREATE INDEX IF NOT EXISTS idx_notebooks_created_by ON notebooks(created_by);
CREATE INDEX IF NOT EXISTS idx_notebooks_created_date ON notebooks(created_date DESC);

-- Índices para tabela COMMENTS
CREATE INDEX IF NOT EXISTS idx_comments_question_id ON comments(question_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_date ON comments(created_date DESC);

-- Índices para tabela USERS
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON users(subscription_type);

-- ============================================
-- ANALYZE TABLES (atualiza estatísticas)
-- ============================================
ANALYZE questions;
ANALYZE attempts;
ANALYZE users;
ANALYZE notebooks;
ANALYZE comments;

-- ============================================
-- VERIFICAR ÍNDICES CRIADOS
-- ============================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- QUERY DE TESTE - PERFORMANCE MELHORADA
-- ============================================

-- Antes: Full table scan
-- Depois: Index scan

-- Teste 1: Buscar attempts de um usuário (comum)
EXPLAIN ANALYZE
SELECT * FROM attempts 
WHERE user_id = (SELECT id FROM users LIMIT 1)
ORDER BY created_date DESC
LIMIT 100;

-- Teste 2: Buscar questões por disciplina (comum)
EXPLAIN ANALYZE
SELECT * FROM questions 
WHERE discipline = 'Português'
ORDER BY created_date DESC
LIMIT 50;

-- Teste 3: Join attempts + questions (muito comum)
EXPLAIN ANALYZE
SELECT 
    a.*,
    q.text,
    q.discipline,
    q.difficulty
FROM attempts a
INNER JOIN questions q ON a.question_id = q.id
WHERE a.user_id = (SELECT id FROM users LIMIT 1)
ORDER BY a.created_date DESC
LIMIT 100;

-- ============================================
-- ESTATÍSTICAS DE PERFORMANCE
-- ============================================
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- COMENTÁRIOS
-- ============================================
-- 
-- Estes índices melhoram significativamente:
-- 1. Busca de questões por filtros (discipline, difficulty)
-- 2. Busca de attempts de usuários específicos
-- 3. Ordenação por data (DESC)
-- 4. Joins entre tabelas
-- 5. Contagem de registros (COUNT)
--
-- Benefícios esperados:
-- - Redução de 50-90% no tempo de resposta
-- - Menos carga no servidor
-- - Melhor experiência do usuário
-- ============================================


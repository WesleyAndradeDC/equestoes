-- ============================================
-- QUERIES ÚTEIS - G-CONCURSOS
-- Para usar no DBeaver ou qualquer cliente PostgreSQL
-- ============================================

-- ============================================
-- 1. VERIFICAÇÕES GERAIS
-- ============================================

-- Listar todas as tabelas do banco
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;

-- Contar registros em todas as tabelas
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

-- Ver tamanho das tabelas
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
ORDER BY 
    pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- 2. USUÁRIOS
-- ============================================

-- Listar todos os usuários
SELECT 
    email, 
    full_name, 
    role, 
    subscription_type,
    study_streak,
    last_study_date,
    created_at 
FROM 
    users 
ORDER BY 
    created_at DESC;

-- Contar usuários por tipo de assinatura
SELECT 
    subscription_type,
    COUNT(*) as total
FROM 
    users
GROUP BY 
    subscription_type
ORDER BY 
    total DESC;

-- Usuários mais ativos (por study_streak)
SELECT 
    full_name,
    email,
    study_streak,
    last_study_date
FROM 
    users
WHERE 
    study_streak > 0
ORDER BY 
    study_streak DESC
LIMIT 10;

-- ============================================
-- 3. QUESTÕES
-- ============================================

-- Listar todas as questões
SELECT 
    code,
    discipline,
    difficulty,
    exam_board,
    year,
    substring(text, 1, 50) || '...' as texto,
    created_by,
    created_date
FROM 
    questions
ORDER BY 
    created_date DESC;

-- Contar questões por disciplina
SELECT 
    discipline,
    COUNT(*) as total
FROM 
    questions
GROUP BY 
    discipline
ORDER BY 
    total DESC;

-- Contar questões por dificuldade
SELECT 
    difficulty,
    COUNT(*) as total
FROM 
    questions
GROUP BY 
    difficulty
ORDER BY 
    CASE difficulty
        WHEN 'Fácil' THEN 1
        WHEN 'Médio' THEN 2
        WHEN 'Difícil' THEN 3
    END;

-- Questões por banca examinadora
SELECT 
    exam_board,
    COUNT(*) as total
FROM 
    questions
WHERE 
    exam_board IS NOT NULL
GROUP BY 
    exam_board
ORDER BY 
    total DESC;

-- Questões mais recentes
SELECT 
    code,
    discipline,
    difficulty,
    substring(text, 1, 60) || '...' as texto
FROM 
    questions
ORDER BY 
    created_date DESC
LIMIT 10;

-- ============================================
-- 4. TENTATIVAS (ATTEMPTS)
-- ============================================

-- Estatísticas gerais de tentativas
SELECT 
    COUNT(*) as total_tentativas,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as acertos,
    SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END) as erros,
    ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 2) as taxa_acerto_percent
FROM 
    attempts;

-- Desempenho por usuário
SELECT 
    u.full_name,
    u.email,
    COUNT(a.id) as total_tentativas,
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as acertos,
    ROUND(AVG(CASE WHEN a.is_correct THEN 100 ELSE 0 END), 2) as taxa_acerto
FROM 
    users u
    LEFT JOIN attempts a ON u.id = a.user_id
GROUP BY 
    u.id, u.full_name, u.email
HAVING 
    COUNT(a.id) > 0
ORDER BY 
    taxa_acerto DESC;

-- Desempenho por disciplina (todos os usuários)
SELECT 
    q.discipline,
    COUNT(a.id) as total_tentativas,
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as acertos,
    ROUND(AVG(CASE WHEN a.is_correct THEN 100 ELSE 0 END), 2) as taxa_acerto
FROM 
    questions q
    JOIN attempts a ON q.id = a.question_id
GROUP BY 
    q.discipline
ORDER BY 
    taxa_acerto DESC;

-- Questões mais respondidas
SELECT 
    q.code,
    q.discipline,
    substring(q.text, 1, 50) || '...' as texto,
    COUNT(a.id) as total_tentativas,
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as acertos
FROM 
    questions q
    JOIN attempts a ON q.id = a.question_id
GROUP BY 
    q.id, q.code, q.discipline, q.text
ORDER BY 
    total_tentativas DESC
LIMIT 10;

-- Tentativas recentes (últimas 20)
SELECT 
    u.full_name,
    q.code,
    q.discipline,
    a.chosen_answer,
    q.correct_answer,
    a.is_correct,
    a.answered_at
FROM 
    attempts a
    JOIN users u ON a.user_id = u.id
    JOIN questions q ON a.question_id = q.id
ORDER BY 
    a.answered_at DESC
LIMIT 20;

-- ============================================
-- 5. CADERNOS (NOTEBOOKS)
-- ============================================

-- Listar todos os cadernos com contagem de questões
SELECT 
    n.name,
    n.description,
    n.color,
    u.full_name as criado_por,
    COUNT(nq.question_id) as total_questoes,
    n.created_date
FROM 
    notebooks n
    JOIN users u ON n.created_by = u.email
    LEFT JOIN notebook_questions nq ON n.id = nq.notebook_id
GROUP BY 
    n.id, n.name, n.description, n.color, u.full_name, n.created_date
ORDER BY 
    n.created_date DESC;

-- Questões em um caderno específico
SELECT 
    q.code,
    q.discipline,
    q.difficulty,
    substring(q.text, 1, 50) || '...' as texto,
    nq.added_at
FROM 
    notebooks n
    JOIN notebook_questions nq ON n.id = nq.notebook_id
    JOIN questions q ON nq.question_id = q.id
WHERE 
    n.name = 'Nome do Caderno Aqui' -- SUBSTITUIR
ORDER BY 
    nq.added_at DESC;

-- ============================================
-- 6. COMENTÁRIOS
-- ============================================

-- Listar comentários recentes
SELECT 
    c.author_name,
    c.author_role,
    q.code as questao,
    q.discipline,
    substring(c.text, 1, 60) || '...' as comentario,
    c.created_date
FROM 
    comments c
    JOIN questions q ON c.question_id = q.id
ORDER BY 
    c.created_date DESC
LIMIT 20;

-- Comentários por questão
SELECT 
    q.code,
    q.discipline,
    substring(q.text, 1, 50) || '...' as questao,
    COUNT(c.id) as total_comentarios
FROM 
    questions q
    LEFT JOIN comments c ON q.id = c.question_id
GROUP BY 
    q.id, q.code, q.discipline, q.text
HAVING 
    COUNT(c.id) > 0
ORDER BY 
    total_comentarios DESC;

-- ============================================
-- 7. ANÁLISES AVANÇADAS
-- ============================================

-- Ranking de usuários por pontuação
SELECT 
    ROW_NUMBER() OVER (ORDER BY SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) DESC) as posicao,
    u.full_name,
    u.email,
    COUNT(a.id) as total_tentativas,
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as pontos,
    ROUND(AVG(CASE WHEN a.is_correct THEN 100 ELSE 0 END), 2) as taxa_acerto
FROM 
    users u
    JOIN attempts a ON u.id = a.user_id
GROUP BY 
    u.id, u.full_name, u.email
ORDER BY 
    pontos DESC
LIMIT 10;

-- Desempenho por assunto (usando array subjects)
SELECT 
    unnest(q.subjects) as assunto,
    COUNT(a.id) as total_tentativas,
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as acertos,
    ROUND(AVG(CASE WHEN a.is_correct THEN 100 ELSE 0 END), 2) as taxa_acerto
FROM 
    questions q
    JOIN attempts a ON q.id = a.question_id
WHERE 
    q.subjects IS NOT NULL 
    AND array_length(q.subjects, 1) > 0
GROUP BY 
    assunto
ORDER BY 
    total_tentativas DESC;

-- Evolução diária de tentativas (último mês)
SELECT 
    DATE(answered_at) as data,
    COUNT(*) as total_tentativas,
    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as acertos,
    ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 2) as taxa_acerto
FROM 
    attempts
WHERE 
    answered_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    DATE(answered_at)
ORDER BY 
    data DESC;

-- Questões nunca respondidas
SELECT 
    q.code,
    q.discipline,
    q.difficulty,
    substring(q.text, 1, 60) || '...' as texto,
    q.created_date
FROM 
    questions q
    LEFT JOIN attempts a ON q.id = a.question_id
WHERE 
    a.id IS NULL
ORDER BY 
    q.created_date DESC;

-- ============================================
-- 8. MANUTENÇÃO E LIMPEZA
-- ============================================

-- Limpar tentativas antigas (CUIDADO!)
-- DELETE FROM attempts WHERE created_date < CURRENT_DATE - INTERVAL '90 days';

-- Limpar comentários sem usuário
-- DELETE FROM comments WHERE user_id IS NULL AND created_date < CURRENT_DATE - INTERVAL '30 days';

-- Atualizar updated_at manualmente (se necessário)
-- UPDATE questions SET updated_at = CURRENT_TIMESTAMP WHERE id = 'uuid-aqui';

-- Recalcular study_streak de um usuário
-- UPDATE users SET study_streak = 0 WHERE email = 'usuario@email.com';

-- ============================================
-- 9. BACKUP E RESTORE
-- ============================================

-- Ver último backup (não aplicável direto no SQL, via DBeaver)
-- Tools → Dump Database → schema_backup.sql

-- Restore estrutura:
-- \i schema_backup.sql

-- ============================================
-- 10. ÍNDICES E PERFORMANCE
-- ============================================

-- Ver todos os índices
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

-- Ver queries lentas (se pg_stat_statements estiver habilitado)
-- SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- Analisar performance de uma tabela
ANALYZE users;
ANALYZE questions;
ANALYZE attempts;

-- Ver estatísticas de uma tabela
SELECT * FROM pg_stat_user_tables WHERE relname = 'questions';

-- ============================================
-- FIM DAS QUERIES
-- ============================================

-- Para executar qualquer query acima:
-- 1. Copie a query desejada
-- 2. Cole no editor SQL do DBeaver
-- 3. Selecione a query
-- 4. Pressione Ctrl+Enter ou clique em Execute





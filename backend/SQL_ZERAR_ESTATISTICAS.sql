-- ============================================
-- SQL: ZERAR ESTATÍSTICAS DE TODOS OS USUÁRIOS
-- ============================================
-- 
-- Este script zera:
--   1. study_streak (sequência de dias estudados)
--   2. last_study_date (última data de estudo)
--   3. Todas as tentativas (attempts) - histórico de questões respondidas
--
-- ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
-- ⚠️ Faça backup antes de executar!
--
-- ============================================

BEGIN;

-- 1. Zerar study_streak e last_study_date de todos os usuários
UPDATE users
SET 
    study_streak = 0,
    last_study_date = NULL
WHERE 
    study_streak > 0 
    OR last_study_date IS NOT NULL;

-- 2. Deletar TODAS as tentativas (attempts)
--    Isso remove todo o histórico de questões respondidas
DELETE FROM attempts;

-- Verificar resultado
SELECT 
    COUNT(*) as usuarios_com_streak,
    SUM(study_streak) as total_streak
FROM users
WHERE study_streak > 0;

SELECT 
    COUNT(*) as total_attempts_restantes
FROM attempts;

COMMIT;

-- ============================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- ============================================
-- Execute estas queries para confirmar que tudo foi zerado:

-- Verificar se study_streak foi zerado
SELECT 
    email,
    full_name,
    study_streak,
    last_study_date
FROM users
WHERE study_streak > 0 OR last_study_date IS NOT NULL;
-- Deve retornar 0 linhas

-- Verificar se attempts foi deletado
SELECT COUNT(*) as total_attempts FROM attempts;
-- Deve retornar 0

-- ============================================
-- ROLLBACK (caso precise desfazer)
-- ============================================
-- Se você executou o script e quer desfazer,
-- você precisará restaurar de um backup.
-- Não há como recuperar os dados deletados sem backup.

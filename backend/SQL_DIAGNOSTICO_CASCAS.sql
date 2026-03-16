-- ============================================================
-- SQL: DIAGNÓSTICO E CORREÇÃO — USUÁRIOS CASCAS MAL CLASSIFICADOS
-- ============================================================
--
-- CONTEXTO DO PROBLEMA:
--   Alguns usuários que compraram o "Clube dos Cascas" estão com
--   subscription_type = 'Aluno Clube do Pedrão' no banco, pois:
--   - O webhook padrão usa 'Aluno Clube do Pedrão' como fallback
--   - O frontend então restringe esses usuários somente a Português
--   - Resultado: usuário Cascas vê 0 questões ou apenas Português
--
-- ============================================================

-- ── PASSO 1: DIAGNÓSTICO ─────────────────────────────────────────────────────
-- Verificar distribuição de subscription_type x membership_plan

SELECT 
    subscription_type,
    membership_plan,
    subscription_status,
    membership_active,
    COUNT(*) as total_usuarios
FROM users
GROUP BY subscription_type, membership_plan, subscription_status, membership_active
ORDER BY subscription_type, total_usuarios DESC;


-- ── PASSO 2: IDENTIFICAR INCONSISTÊNCIAS ─────────────────────────────────────
-- Usuários cujo membership_plan indica "Cascas" mas subscription_type é "Pedrão"
-- ESTES são os usuários que não conseguem ver todas as questões

SELECT 
    id,
    email,
    full_name,
    subscription_type,
    subscription_status,
    membership_plan,
    membership_active
FROM users
WHERE 
    subscription_type = 'Aluno Clube do Pedrão'
    AND (
        LOWER(membership_plan) LIKE '%cascas%'
        OR LOWER(membership_plan) LIKE '%prf%'
        OR LOWER(membership_plan) LIKE '%banco do brasil%'
    )
ORDER BY email;


-- ── PASSO 3: CORREÇÃO ────────────────────────────────────────────────────────
-- ⚠️ ATENÇÃO: Revise o resultado do PASSO 2 antes de executar!
-- Este UPDATE corrige o subscription_type baseado no membership_plan

BEGIN;

-- Corrigir usuários com membership_plan "Cascas" ou "PRF" que estão como Pedrão
UPDATE users
SET subscription_type = 'Aluno Clube dos Cascas'
WHERE 
    subscription_type = 'Aluno Clube do Pedrão'
    AND (
        LOWER(membership_plan) LIKE '%cascas%'
        OR LOWER(membership_plan) LIKE '%prf%'
    );

-- Corrigir usuários com membership_plan "Banco do Brasil" que estão como Pedrão
UPDATE users
SET subscription_type = 'Aluno Banco do Brasil'
WHERE 
    subscription_type = 'Aluno Clube do Pedrão'
    AND LOWER(membership_plan) LIKE '%banco do brasil%';

-- Verificar o que foi alterado
SELECT 
    subscription_type,
    COUNT(*) as total
FROM users
GROUP BY subscription_type
ORDER BY subscription_type;

COMMIT;


-- ── PASSO 4: VERIFICAÇÃO FINAL ───────────────────────────────────────────────
-- Confirmar que não há mais inconsistências via membership_plan

SELECT 
    id,
    email,
    full_name,
    subscription_type,
    membership_plan
FROM users
WHERE 
    subscription_type = 'Aluno Clube do Pedrão'
    AND (
        LOWER(membership_plan) LIKE '%cascas%'
        OR LOWER(membership_plan) LIKE '%prf%'
    );
-- Deve retornar 0 linhas após a correção


-- ============================================================
-- PASSO 5: INVESTIGAR OS 32 SUSPEITOS SEM MEMBERSHIP_PLAN
-- ============================================================
-- Esses usuários têm subscription ativa mas membership_active = false
-- e membership_plan em branco — o webhook de membership nunca processou
-- ou processou com nome de plano não reconhecido.
-- Se algum for Cascas, estará sendo restringido a Português.

SELECT 
    id,
    email,
    full_name,
    subscription_type,
    subscription_status,
    membership_plan,
    membership_active,
    created_at
FROM users
WHERE 
    subscription_type   = 'Aluno Clube do Pedrão'
    AND membership_plan IS NULL
    AND subscription_status = 'active'
    AND membership_active   = false
ORDER BY created_at DESC;

-- Analisar os emails retornados e cruzar com o WooCommerce para confirmar
-- o plano real de cada um. Se algum for Cascas, use o UPDATE abaixo:


-- ── CORREÇÃO MANUAL (por e-mail) ─────────────────────────────────────────────
-- Se você identificar um ou mais e-mails que deveriam ser Cascas, execute:

/*
UPDATE users
SET 
    subscription_type = 'Aluno Clube dos Cascas',
    membership_plan   = 'Clube dos Cascas 12 Meses',  -- ajuste conforme o plano real
    membership_active = true
WHERE email IN (
    'email1@exemplo.com',
    'email2@exemplo.com'
    -- adicione os e-mails identificados
);
*/


-- ── FORÇAR RE-SYNC DO WEBHOOK ────────────────────────────────────────────────
-- Outra opção: no painel do WooCommerce, reenviar o webhook de membership
-- para cada um dos 32 usuários. Isso forçará o sistema a reclassificar
-- automaticamente com o plano correto.

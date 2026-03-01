-- ============================================================
-- SQL_MEMBERSHIP_MIGRATION.sql
-- G-CONCURSOS — Migração: Subscription Boolean + WC Memberships
-- PostgreSQL
-- ============================================================
--
-- Execute este script UMA VEZ no seu banco Render.
-- Todas as colunas usam IF NOT EXISTS — seguro para re-executar.
--
-- O que este script faz:
--   1. Adiciona subscription_active (Boolean) à tabela users
--   2. Adiciona colunas de Membership (membership_status, membership_active,
--      membership_expires_at, membership_plan) à tabela users
--   3. Sincroniza subscription_active com base no subscription_status atual
--   4. Cria índices de performance para queries de controle de acesso
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. SUBSCRIPTION — campo booleano de acesso rápido
-- ─────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- 2. MEMBERSHIP — campos de associação (WooCommerce Memberships)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS membership_status     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS membership_active     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_plan       VARCHAR(255);

-- ─────────────────────────────────────────────────────────────
-- 3. SINCRONIZAÇÃO INICIAL
-- Popula subscription_active com base no subscription_status
-- já existente para todos os usuários cadastrados.
-- ─────────────────────────────────────────────────────────────

UPDATE users
SET subscription_active = true
WHERE subscription_status IN ('active', 'pending-cancel');

UPDATE users
SET subscription_active = false
WHERE subscription_status NOT IN ('active', 'pending-cancel');

-- ─────────────────────────────────────────────────────────────
-- 4. ÍNDICES DE PERFORMANCE
-- Melhoram a velocidade de queries de controle de acesso no middleware.
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_subscription_active
  ON users (subscription_active);

CREATE INDEX IF NOT EXISTS idx_users_membership_active
  ON users (membership_active);

-- Índice composto para o middleware requireActiveAccess
-- (verifica ambas as flags de uma só vez)
CREATE INDEX IF NOT EXISTS idx_users_access_control
  ON users (subscription_active, membership_active);

COMMIT;

-- ============================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO (opcional — execute separadamente)
-- ============================================================
--
-- SELECT
--   COUNT(*)                                         AS total_usuarios,
--   COUNT(*) FILTER (WHERE subscription_active)      AS com_assinatura_ativa,
--   COUNT(*) FILTER (WHERE membership_active)        AS com_membership_ativa,
--   COUNT(*) FILTER (WHERE subscription_active
--                      AND membership_active)        AS acesso_completo
-- FROM users;
--
-- ============================================================
-- ROLLBACK (caso precise desfazer)
-- ============================================================
--
-- ALTER TABLE users
--   DROP COLUMN IF EXISTS subscription_active,
--   DROP COLUMN IF EXISTS membership_status,
--   DROP COLUMN IF EXISTS membership_active,
--   DROP COLUMN IF EXISTS membership_expires_at,
--   DROP COLUMN IF EXISTS membership_plan;
--
-- DROP INDEX IF EXISTS idx_users_subscription_active;
-- DROP INDEX IF EXISTS idx_users_membership_active;
-- DROP INDEX IF EXISTS idx_users_access_control;
-- ============================================================

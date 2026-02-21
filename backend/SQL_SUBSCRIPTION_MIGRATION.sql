-- ============================================================
-- G-CONCURSOS — SUBSCRIPTION MIGRATION
-- Execute este script no seu banco PostgreSQL (Render)
-- Data: 2026
-- ============================================================
-- ORDEM DE EXECUÇÃO:
--   1. Adiciona coluna subscription_status em users
--   2. Cria tabela subscriptions
--   3. Cria tabela subscription_history
--   4. Cria índices de performance
--   5. Migra usuários existentes (cria subscription ativa para quem já tem acesso)
--   6. Cria trigger para updated_at automático
--   7. Verificação final
-- ============================================================

-- ─── ETAPA 1: Adicionar coluna subscription_status nos usuários ──────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) NOT NULL DEFAULT 'inactive';

-- Usuários que já possuem subscription_type configurado = considerar ativos
UPDATE users
SET subscription_status = 'active'
WHERE subscription_type IS NOT NULL
  AND subscription_type <> '';

-- ─── ETAPA 2: Criar tabela subscriptions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL
                                     REFERENCES users(id) ON DELETE CASCADE,

    -- Status e tipo
    -- Valores: active | pending-cancel | on-hold | cancelled | expired | pending | inactive
    status              VARCHAR(50)  NOT NULL DEFAULT 'inactive',
    subscription_type   VARCHAR(100),

    -- Referências externas WooCommerce
    woo_subscription_id VARCHAR(255) UNIQUE,   -- ID da subscription no WooCommerce Subscriptions
    woo_order_id        VARCHAR(255),          -- ID do pedido (fallback order webhook)

    -- Datas de controle
    started_at          TIMESTAMPTZ,           -- Início da assinatura
    expires_at          TIMESTAMPTZ,           -- Término/expiração (NULL = sem prazo fixo)
    next_payment_at     TIMESTAMPTZ,           -- Próxima cobrança
    cancelled_at        TIMESTAMPTZ,           -- Data do cancelamento

    -- Timestamps
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── ETAPA 3: Criar tabela subscription_history ──────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_history (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID         NOT NULL
                                 REFERENCES subscriptions(id) ON DELETE CASCADE,

    previous_status VARCHAR(50),              -- NULL na criação inicial
    new_status      VARCHAR(50)  NOT NULL,
    reason          VARCHAR(100),             -- "webhook" | "created" | "order.completed" | "manual"
    woo_event       VARCHAR(100),             -- Header X-WC-Webhook-Topic
    payload_id      VARCHAR(255),             -- ID do objeto WooCommerce (rastreabilidade)

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── ETAPA 4: Índices de performance ─────────────────────────────────────────
-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
    ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
    ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_woo_sub_id
    ON subscriptions(woo_subscription_id)
    WHERE woo_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
    ON subscriptions(user_id, status);

-- Subscription History
CREATE INDEX IF NOT EXISTS idx_sub_history_subscription_id
    ON subscription_history(subscription_id);

CREATE INDEX IF NOT EXISTS idx_sub_history_created_at
    ON subscription_history(created_at DESC);

-- Users (novo campo)
CREATE INDEX IF NOT EXISTS idx_users_subscription_status
    ON users(subscription_status);

-- ─── ETAPA 5: Migrar usuários existentes ─────────────────────────────────────
-- Cria subscription "active" para usuários que já têm acesso à plataforma
-- (somente se ainda não possuem nenhuma subscription registrada)
INSERT INTO subscriptions (user_id, status, subscription_type, started_at)
SELECT
    u.id                AS user_id,
    'active'            AS status,
    u.subscription_type AS subscription_type,
    u.created_at        AS started_at
FROM users u
WHERE u.subscription_type IS NOT NULL
  AND u.subscription_type <> ''
  AND NOT EXISTS (
      SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
  );

-- Registrar no histórico as subscriptions migradas
INSERT INTO subscription_history (subscription_id, previous_status, new_status, reason)
SELECT
    s.id,
    NULL,
    'active',
    'migration'
FROM subscriptions s
WHERE s.reason IS NULL  -- Apenas as recém inseridas
  AND NOT EXISTS (
      SELECT 1 FROM subscription_history h WHERE h.subscription_id = s.id
  );

-- ─── ETAPA 6: Trigger para updated_at automático ─────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_updated_at();

-- ─── ETAPA 7: Verificação final ───────────────────────────────────────────────
SELECT
    'users'         AS tabela,
    COUNT(*)        AS total,
    SUM(CASE WHEN subscription_status = 'active'   THEN 1 ELSE 0 END) AS ativos,
    SUM(CASE WHEN subscription_status = 'inactive' THEN 1 ELSE 0 END) AS inativos,
    SUM(CASE WHEN subscription_status NOT IN ('active','inactive') THEN 1 ELSE 0 END) AS outros
FROM users
UNION ALL
SELECT
    'subscriptions',
    COUNT(*),
    SUM(CASE WHEN status = 'active'   THEN 1 ELSE 0 END),
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END),
    SUM(CASE WHEN status NOT IN ('active','inactive') THEN 1 ELSE 0 END)
FROM subscriptions
UNION ALL
SELECT
    'subscription_history',
    COUNT(*),
    0, 0, 0
FROM subscription_history;

-- ─── ROLLBACK (apenas em emergência) ─────────────────────────────────────────
-- Se precisar reverter ANTES de ir para produção:
--
-- DROP TABLE IF EXISTS subscription_history CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;
-- DROP INDEX IF EXISTS idx_users_subscription_status;
-- ─────────────────────────────────────────────────────────────────────────────

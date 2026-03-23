-- ============================================================
-- Migração: unificar subscription_type para "Aluno Eleva"
-- Data: 2026
-- Tabela real no banco: users  (Prisma model User → @@map("users"))
-- ============================================================

-- ── 1. Prévia: ver o que será afetado ────────────────────────
SELECT
  subscription_type,
  COUNT(*) AS total_usuarios
FROM users
WHERE subscription_type IS NOT NULL
GROUP BY subscription_type
ORDER BY total_usuarios DESC;

-- ── 2. Atualizar todos os tipos antigos de aluno ─────────────
UPDATE users
SET subscription_type = 'Aluno Eleva'
WHERE subscription_type IS NOT NULL
  AND subscription_type NOT IN ('Aluno Eleva', 'Professor');

-- ── 3. Confirmação: verificar resultado após a migração ──────
SELECT
  subscription_type,
  COUNT(*) AS total_usuarios
FROM users
WHERE subscription_type IS NOT NULL
GROUP BY subscription_type
ORDER BY total_usuarios DESC;

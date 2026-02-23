-- ============================================================
-- G-CONCURSOS — Migração: Sistema de Report de Questões
-- Execute no banco PostgreSQL do Render
-- ============================================================

BEGIN;

-- ── 1. Criar tabela question_reports ─────────────────────────
CREATE TABLE IF NOT EXISTS question_reports (
  id            UUID          NOT NULL DEFAULT gen_random_uuid(),
  question_id   UUID          NOT NULL,
  user_id       UUID          NOT NULL,
  reason        TEXT          NOT NULL,
  status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
  -- Valores: pending | reviewing | resolved | dismissed

  admin_note    TEXT,
  resolved_by   UUID,
  resolved_at   TIMESTAMPTZ,

  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT question_reports_pkey PRIMARY KEY (id),

  CONSTRAINT fk_report_question
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,

  CONSTRAINT fk_report_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_report_resolver
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT chk_report_status
    CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed'))
);

-- ── 2. Índices para performance ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id     ON question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status      ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at  ON question_reports(created_at DESC);

-- ── 3. Trigger para atualizar updated_at automaticamente ──────
-- Cria a função se ainda não existir
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON question_reports
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

COMMIT;

-- ── ROLLBACK (se precisar desfazer) ──────────────────────────
-- BEGIN;
-- DROP TABLE IF EXISTS question_reports CASCADE;
-- COMMIT;

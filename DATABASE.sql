-- ============================================================
-- DATABASE.sql — E-Questões
-- PostgreSQL — Estrutura completa do banco de dados
-- Gerado em: 2025
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- TABELA: users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash         TEXT,
  full_name             VARCHAR(255) NOT NULL,
  role                  VARCHAR(50)  NOT NULL DEFAULT 'user',  -- 'user' | 'admin'

  -- Assinatura WooCommerce Subscriptions
  subscription_type     VARCHAR(100),
  subscription_status   VARCHAR(50)  NOT NULL DEFAULT 'inactive',
  subscription_active   BOOLEAN      NOT NULL DEFAULT false,

  -- Membership WooCommerce Memberships
  membership_status     VARCHAR(50),
  membership_active     BOOLEAN      NOT NULL DEFAULT false,
  membership_expires_at TIMESTAMPTZ,
  membership_plan       VARCHAR(100),

  first_login           BOOLEAN      NOT NULL DEFAULT true,
  study_streak          INTEGER      NOT NULL DEFAULT 0,
  last_study_date       VARCHAR(20),

  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ─────────────────────────────────────────────────────────────
-- TABELA: subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status              VARCHAR(50) NOT NULL DEFAULT 'inactive',
  subscription_type   VARCHAR(100),
  woo_subscription_id VARCHAR(255) UNIQUE,
  woo_order_id        VARCHAR(255),
  started_at          TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  next_payment_at     TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ─────────────────────────────────────────────────────────────
-- TABELA: subscription_history
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID        NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status      VARCHAR(50) NOT NULL,
  reason          VARCHAR(100),
  woo_event       VARCHAR(100),
  payload_id      VARCHAR(255),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_sub_id ON subscription_history(subscription_id);

-- ─────────────────────────────────────────────────────────────
-- TABELA: questions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           VARCHAR(20)  UNIQUE,
  text           TEXT         NOT NULL,
  discipline     VARCHAR(100) NOT NULL,
  difficulty     VARCHAR(20)  NOT NULL,  -- 'Fácil' | 'Médio' | 'Difícil'
  exam_board     VARCHAR(100),
  year           INTEGER,
  position       VARCHAR(100),
  option_a       TEXT         NOT NULL,
  option_b       TEXT         NOT NULL,
  option_c       TEXT,
  option_d       TEXT,
  option_e       TEXT,
  correct_answer VARCHAR(1)   NOT NULL,  -- 'A' | 'B' | 'C' | 'D' | 'E'
  explanation    TEXT         NOT NULL,
  question_type  VARCHAR(50),
  subjects       TEXT[]       NOT NULL DEFAULT '{}',
  created_by     VARCHAR(255),
  created_date   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_discipline ON questions(discipline);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_code ON questions(code);

-- ─────────────────────────────────────────────────────────────
-- TABELA: attempts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attempts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id   UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chosen_answer VARCHAR(1)  NOT NULL,
  is_correct    BOOLEAN     NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL,
  created_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_answered_at ON attempts(answered_at);

-- ─────────────────────────────────────────────────────────────
-- TABELA: notebooks
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notebooks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  color        VARCHAR(50)  NOT NULL DEFAULT 'blue',
  created_by   VARCHAR(255) NOT NULL,
  created_date TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notebooks_created_by ON notebooks(created_by);

-- ─────────────────────────────────────────────────────────────
-- TABELA: notebook_questions (many-to-many)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notebook_questions (
  notebook_id UUID        NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notebook_id, question_id)
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: question_reports
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT        NOT NULL,
  status      VARCHAR(50) NOT NULL DEFAULT 'pending',
  admin_note  TEXT,
  resolved_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON question_reports(status);

-- ─────────────────────────────────────────────────────────────
-- TABELA: comments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
  text         TEXT        NOT NULL,
  author_name  VARCHAR(255) NOT NULL,
  author_role  VARCHAR(100) NOT NULL,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_question_id ON comments(question_id);

-- ─────────────────────────────────────────────────────────────
-- TABELA: flashcards
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  front      TEXT        NOT NULL,
  back       TEXT        NOT NULL,
  discipline VARCHAR(100) NOT NULL,
  subjects   TEXT[]      NOT NULL DEFAULT '{}',
  is_global  BOOLEAN     NOT NULL DEFAULT false,
  created_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_discipline ON flashcards(discipline);
CREATE INDEX IF NOT EXISTS idx_flashcards_is_global ON flashcards(is_global);
CREATE INDEX IF NOT EXISTS idx_flashcards_created_by ON flashcards(created_by);

-- ─────────────────────────────────────────────────────────────
-- TABELA: flashcard_reviews (SM-2 Anki)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id UUID    NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id      UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Campos SM-2
  quality      INTEGER NOT NULL,       -- 0-5
  ease_factor  FLOAT   NOT NULL DEFAULT 2.5,
  interval     INTEGER NOT NULL DEFAULT 1,
  repetitions  INTEGER NOT NULL DEFAULT 0,

  due_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (flashcard_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fc_reviews_user_due ON flashcard_reviews(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_fc_reviews_flashcard ON flashcard_reviews(flashcard_id);

-- ─────────────────────────────────────────────────────────────
-- FUNÇÃO: atualizar updated_at automaticamente
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_notebooks_updated_at
  BEFORE UPDATE ON notebooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON question_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

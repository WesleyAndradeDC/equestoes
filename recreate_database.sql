-- ============================================================
-- E-QUESTÕES — Recriação completa do banco de dados
-- Preserva: tabela de usuários (users) com todos os dados
-- Limpa:    todas as outras tabelas
-- Novo:     questões ganham código sequencial automático (Q0001…)
-- ============================================================

-- ── 0. Salva usuários em tabela temporária ───────────────────
CREATE TEMP TABLE users_backup AS
  SELECT * FROM users;

-- ── 1. Remove todas as tabelas (ordem inversa de FK) ─────────
DROP TABLE IF EXISTS flashcard_reviews   CASCADE;
DROP TABLE IF EXISTS flashcards          CASCADE;
DROP TABLE IF EXISTS comments            CASCADE;
DROP TABLE IF EXISTS question_reports    CASCADE;
DROP TABLE IF EXISTS notebook_questions  CASCADE;
DROP TABLE IF EXISTS notebooks           CASCADE;
DROP TABLE IF EXISTS attempts            CASCADE;
DROP TABLE IF EXISTS questions           CASCADE;
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS subscriptions       CASCADE;
DROP TABLE IF EXISTS users               CASCADE;

-- Remove sequência anterior se existir
DROP SEQUENCE IF EXISTS questions_code_seq;

-- ── 2. Recria as tabelas ─────────────────────────────────────

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id                  TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  email               TEXT        NOT NULL,
  password_hash       TEXT,
  full_name           TEXT        NOT NULL,
  role                TEXT        NOT NULL DEFAULT 'user',
  subscription_type   TEXT,
  subscription_status TEXT        NOT NULL DEFAULT 'inactive',
  subscription_active BOOLEAN     NOT NULL DEFAULT FALSE,
  membership_status   TEXT,
  membership_active   BOOLEAN     NOT NULL DEFAULT FALSE,
  membership_expires_at TIMESTAMPTZ,
  membership_plan     TEXT,
  first_login         BOOLEAN     NOT NULL DEFAULT TRUE,
  study_streak        INTEGER     NOT NULL DEFAULT 0,
  last_study_date     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

-- ── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                  TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  user_id             TEXT        NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'inactive',
  subscription_type   TEXT,
  woo_subscription_id TEXT,
  woo_order_id        TEXT,
  started_at          TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  next_payment_at     TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_pkey        PRIMARY KEY (id),
  CONSTRAINT subscriptions_woo_sub_key UNIQUE (woo_subscription_id),
  CONSTRAINT subscriptions_user_fk     FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx  ON subscriptions(status);

-- ── SUBSCRIPTION_HISTORY ─────────────────────────────────────
CREATE TABLE subscription_history (
  id              TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  subscription_id TEXT        NOT NULL,
  previous_status TEXT,
  new_status      TEXT        NOT NULL,
  reason          TEXT,
  woo_event       TEXT,
  payload_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscription_history_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_history_sub_fk FOREIGN KEY (subscription_id)
    REFERENCES subscriptions(id) ON DELETE CASCADE
);
CREATE INDEX subscription_history_sub_idx ON subscription_history(subscription_id);

-- ── SEQUENCE para código das questões ────────────────────────
CREATE SEQUENCE questions_code_seq START 1 INCREMENT 1;

-- ── QUESTIONS ────────────────────────────────────────────────
-- O campo "code" é gerado automaticamente como Q0001, Q0002…
-- ao inserir uma questão sem informar o código.
CREATE TABLE questions (
  id             TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  code           TEXT        UNIQUE   DEFAULT ('Q' || LPAD(NEXTVAL('questions_code_seq')::TEXT, 4, '0')),
  text           TEXT        NOT NULL,
  discipline     TEXT        NOT NULL,
  difficulty     TEXT        NOT NULL,
  exam_board     TEXT,
  year           INTEGER,
  position       TEXT,
  option_a       TEXT        NOT NULL,
  option_b       TEXT        NOT NULL,
  option_c       TEXT,
  option_d       TEXT,
  option_e       TEXT,
  correct_answer TEXT        NOT NULL,
  explanation    TEXT        NOT NULL,
  question_type  TEXT,
  subjects       TEXT[]      NOT NULL DEFAULT '{}',
  created_by     TEXT,
  created_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_created_by_fk FOREIGN KEY (created_by)
    REFERENCES users(email) ON DELETE SET NULL
);

-- ── ATTEMPTS ─────────────────────────────────────────────────
CREATE TABLE attempts (
  id            TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  question_id   TEXT        NOT NULL,
  user_id       TEXT        NOT NULL,
  chosen_answer TEXT        NOT NULL,
  is_correct    BOOLEAN     NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL,
  created_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    TEXT,
  CONSTRAINT attempts_pkey       PRIMARY KEY (id),
  CONSTRAINT attempts_question_fk FOREIGN KEY (question_id)
    REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT attempts_user_fk    FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- ── NOTEBOOKS ────────────────────────────────────────────────
CREATE TABLE notebooks (
  id           TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  name         TEXT        NOT NULL,
  description  TEXT,
  color        TEXT        NOT NULL DEFAULT 'blue',
  created_by   TEXT        NOT NULL,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notebooks_pkey      PRIMARY KEY (id),
  CONSTRAINT notebooks_creator_fk FOREIGN KEY (created_by)
    REFERENCES users(email) ON DELETE CASCADE
);

-- ── NOTEBOOK_QUESTIONS ───────────────────────────────────────
CREATE TABLE notebook_questions (
  notebook_id TEXT        NOT NULL,
  question_id TEXT        NOT NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notebook_questions_pkey    PRIMARY KEY (notebook_id, question_id),
  CONSTRAINT notebook_questions_nb_fk   FOREIGN KEY (notebook_id)
    REFERENCES notebooks(id)  ON DELETE CASCADE,
  CONSTRAINT notebook_questions_q_fk    FOREIGN KEY (question_id)
    REFERENCES questions(id)  ON DELETE CASCADE
);

-- ── QUESTION_REPORTS ─────────────────────────────────────────
CREATE TABLE question_reports (
  id          TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  question_id TEXT        NOT NULL,
  user_id     TEXT        NOT NULL,
  reason      TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending',
  admin_note  TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_reports_pkey     PRIMARY KEY (id),
  CONSTRAINT question_reports_q_fk     FOREIGN KEY (question_id)
    REFERENCES questions(id)  ON DELETE CASCADE,
  CONSTRAINT question_reports_user_fk  FOREIGN KEY (user_id)
    REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT question_reports_admin_fk FOREIGN KEY (resolved_by)
    REFERENCES users(id)      ON DELETE SET NULL
);
CREATE INDEX question_reports_q_idx      ON question_reports(question_id);
CREATE INDEX question_reports_status_idx ON question_reports(status);

-- ── COMMENTS ─────────────────────────────────────────────────
CREATE TABLE comments (
  id           TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  question_id  TEXT        NOT NULL,
  user_id      TEXT,
  text         TEXT        NOT NULL,
  author_name  TEXT        NOT NULL,
  author_role  TEXT        NOT NULL,
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT comments_pkey    PRIMARY KEY (id),
  CONSTRAINT comments_q_fk    FOREIGN KEY (question_id)
    REFERENCES questions(id) ON DELETE CASCADE,
  CONSTRAINT comments_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id)     ON DELETE SET NULL
);

-- ── FLASHCARDS ───────────────────────────────────────────────
CREATE TABLE flashcards (
  id         TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  front      TEXT        NOT NULL,
  back       TEXT        NOT NULL,
  discipline TEXT        NOT NULL,
  subjects   TEXT[]      NOT NULL DEFAULT '{}',
  is_global  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT flashcards_pkey      PRIMARY KEY (id),
  CONSTRAINT flashcards_creator_fk FOREIGN KEY (created_by)
    REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX flashcards_discipline_idx ON flashcards(discipline);
CREATE INDEX flashcards_global_idx     ON flashcards(is_global);

-- ── FLASHCARD_REVIEWS ────────────────────────────────────────
CREATE TABLE flashcard_reviews (
  id           TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  flashcard_id TEXT        NOT NULL,
  user_id      TEXT        NOT NULL,
  quality      INTEGER     NOT NULL,
  ease_factor  FLOAT       NOT NULL DEFAULT 2.5,
  interval     INTEGER     NOT NULL DEFAULT 1,
  repetitions  INTEGER     NOT NULL DEFAULT 0,
  due_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT flashcard_reviews_pkey     PRIMARY KEY (id),
  CONSTRAINT flashcard_reviews_unique   UNIQUE (flashcard_id, user_id),
  CONSTRAINT flashcard_reviews_card_fk  FOREIGN KEY (flashcard_id)
    REFERENCES flashcards(id) ON DELETE CASCADE,
  CONSTRAINT flashcard_reviews_user_fk  FOREIGN KEY (user_id)
    REFERENCES users(id)      ON DELETE CASCADE
);
CREATE INDEX flashcard_reviews_user_due_idx ON flashcard_reviews(user_id, due_date);

-- ── 3. Restaura os usuários ──────────────────────────────────
INSERT INTO users SELECT * FROM users_backup;

-- ── 4. Confirmação ───────────────────────────────────────────
SELECT 'users'               AS tabela, COUNT(*) AS registros FROM users
UNION ALL
SELECT 'questions',           COUNT(*) FROM questions
UNION ALL
SELECT 'attempts',            COUNT(*) FROM attempts
UNION ALL
SELECT 'notebooks',           COUNT(*) FROM notebooks
UNION ALL
SELECT 'comments',            COUNT(*) FROM comments
UNION ALL
SELECT 'flashcards',          COUNT(*) FROM flashcards
UNION ALL
SELECT 'question_reports',    COUNT(*) FROM question_reports
UNION ALL
SELECT 'subscriptions',       COUNT(*) FROM subscriptions
ORDER BY tabela;

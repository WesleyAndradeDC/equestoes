-- ============================================================
-- MÓDULO CRONOGRAMAS — E-Questões
-- Execute diretamente no banco PostgreSQL
-- ============================================================

-- ─── CRONOGRAMAS (templates oficiais e base) ────────────────
CREATE TABLE IF NOT EXISTS cronograms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  slug            VARCHAR(255),
  description     TEXT,
  thumbnail_url   TEXT,
  contest         VARCHAR(255),        -- ex: "PMSE", "PF", "PRF"
  exam_board      VARCHAR(255),        -- banca
  position        VARCHAR(255),        -- cargo
  category        VARCHAR(100),        -- ex: "Policia", "Fiscal", "Judiciario"
  status          VARCHAR(50)  NOT NULL DEFAULT 'draft',   -- draft | active | archived
  is_official     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_public       BOOLEAN      NOT NULL DEFAULT TRUE,
  total_days      INT,
  tags            TEXT[]       DEFAULT ARRAY[]::TEXT[],
  display_order   INT          DEFAULT 0,
  students_count  INT          DEFAULT 0,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS cronograms_slug_key ON cronograms(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cronograms_is_official ON cronograms(is_official);
CREATE INDEX IF NOT EXISTS idx_cronograms_status      ON cronograms(status);
CREATE INDEX IF NOT EXISTS idx_cronograms_contest     ON cronograms(contest);

-- ─── DISCIPLINAS DO CRONOGRAMA OFICIAL ──────────────────────
CREATE TABLE IF NOT EXISTS cronogram_disciplines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cronogram_id    UUID         NOT NULL REFERENCES cronograms(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  display_order   INT          NOT NULL DEFAULT 0,
  color           VARCHAR(50)  DEFAULT 'blue',
  icon            VARCHAR(100),
  weight          DECIMAL(5,2) DEFAULT 1.0,
  difficulty      SMALLINT     DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  required        BOOLEAN      DEFAULT TRUE,
  suggested_hours DECIMAL(6,2),
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cronogram_disciplines_cronogram ON cronogram_disciplines(cronogram_id);

-- ─── ASSUNTOS DO CRONOGRAMA OFICIAL ─────────────────────────
CREATE TABLE IF NOT EXISTS cronogram_subjects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id     UUID         NOT NULL REFERENCES cronogram_disciplines(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  display_order     INT          NOT NULL DEFAULT 0,
  weight            DECIMAL(5,2) DEFAULT 1.0,
  suggested_minutes INT          DEFAULT 60,
  review_count      INT          DEFAULT 1,
  required          BOOLEAN      DEFAULT TRUE,
  status            VARCHAR(50)  DEFAULT 'active',
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cronogram_subjects_discipline ON cronogram_subjects(discipline_id);

-- ─── DIAS DO CRONOGRAMA OFICIAL (plano diário pré-definido) ─
CREATE TABLE IF NOT EXISTS cronogram_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cronogram_id  UUID NOT NULL REFERENCES cronograms(id) ON DELETE CASCADE,
  day_number    INT  NOT NULL,
  title         VARCHAR(255),
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cronogram_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_cronogram_days_cronogram ON cronogram_days(cronogram_id);

-- ─── TAREFAS DE CADA DIA OFICIAL ────────────────────────────
CREATE TABLE IF NOT EXISTS cronogram_day_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id           UUID REFERENCES cronogram_days(id) ON DELETE CASCADE,
  subject_id       UUID REFERENCES cronogram_subjects(id)    ON DELETE SET NULL,
  discipline_id    UUID REFERENCES cronogram_disciplines(id) ON DELETE SET NULL,
  display_order    INT  DEFAULT 0,
  duration_minutes INT  DEFAULT 60,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cronogram_day_tasks_day ON cronogram_day_tasks(day_id);

-- ─── CRONOGRAMA DO USUÁRIO (instância própria) ───────────────
CREATE TABLE IF NOT EXISTS user_cronograms (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cronogram_id        UUID REFERENCES cronograms(id) ON DELETE SET NULL,  -- null = personalizado
  title               VARCHAR(255) NOT NULL,
  contest             VARCHAR(255),
  status              VARCHAR(50)  NOT NULL DEFAULT 'active',  -- active | paused | completed | archived
  type                VARCHAR(50)  NOT NULL DEFAULT 'custom',  -- custom | official

  -- Configurações do wizard
  disciplines_per_day INT          DEFAULT 2,
  study_days          TEXT[]       DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  daily_minutes       INT          DEFAULT 120,

  -- Progresso
  current_day         INT          DEFAULT 1,
  total_days          INT,
  days_studied        INT          DEFAULT 0,
  streak              INT          DEFAULT 0,
  last_study_date     DATE,

  started_at          TIMESTAMPTZ  DEFAULT NOW(),
  target_date         DATE,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_cronograms_user   ON user_cronograms(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cronograms_status ON user_cronograms(status);

-- ─── DISCIPLINAS DO CRONOGRAMA DO USUÁRIO ───────────────────
CREATE TABLE IF NOT EXISTS user_cronogram_disciplines (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cronogram_id    UUID         NOT NULL REFERENCES user_cronograms(id) ON DELETE CASCADE,
  source_discipline_id UUID REFERENCES cronogram_disciplines(id) ON DELETE SET NULL,
  name                 VARCHAR(255) NOT NULL,
  display_order        INT          NOT NULL DEFAULT 0,
  color                VARCHAR(50)  DEFAULT 'blue',
  icon                 VARCHAR(100),
  weight               DECIMAL(5,2) DEFAULT 1.0,
  difficulty           SMALLINT     DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  required             BOOLEAN      DEFAULT TRUE,
  suggested_hours      DECIMAL(6,2),
  created_at           TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_cronogram_disciplines_cronogram
  ON user_cronogram_disciplines(user_cronogram_id);

-- ─── ASSUNTOS DO CRONOGRAMA DO USUÁRIO ──────────────────────
CREATE TABLE IF NOT EXISTS user_cronogram_subjects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline_id     UUID         NOT NULL REFERENCES user_cronogram_disciplines(id) ON DELETE CASCADE,
  source_subject_id UUID REFERENCES cronogram_subjects(id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  display_order     INT          NOT NULL DEFAULT 0,
  weight            DECIMAL(5,2) DEFAULT 1.0,
  suggested_minutes INT          DEFAULT 60,
  required          BOOLEAN      DEFAULT TRUE,
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_cronogram_subjects_discipline
  ON user_cronogram_subjects(discipline_id);

-- ─── PROGRESSO POR ASSUNTO ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subject_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cronogram_id UUID        NOT NULL REFERENCES user_cronograms(id) ON DELETE CASCADE,
  subject_id        UUID        NOT NULL REFERENCES user_cronogram_subjects(id) ON DELETE CASCADE,
  status            VARCHAR(50) NOT NULL DEFAULT 'not_started',  -- not_started | in_progress | completed
  completed_at      TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_cronogram_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subject_progress_cronogram
  ON user_subject_progress(user_cronogram_id);
CREATE INDEX IF NOT EXISTS idx_user_subject_progress_status
  ON user_subject_progress(status);

-- ─── TAREFAS DIÁRIAS GERADAS (algoritmo) ────────────────────
CREATE TABLE IF NOT EXISTS user_daily_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_cronogram_id UUID        NOT NULL REFERENCES user_cronograms(id) ON DELETE CASCADE,
  subject_id        UUID REFERENCES user_cronogram_subjects(id)    ON DELETE SET NULL,
  discipline_id     UUID REFERENCES user_cronogram_disciplines(id) ON DELETE SET NULL,
  scheduled_date    DATE        NOT NULL,
  day_number        INT         NOT NULL,
  display_order     INT         DEFAULT 0,
  status            VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending | completed | skipped | rescheduled
  completed_at      TIMESTAMPTZ,
  rescheduled_to    DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_cronogram
  ON user_daily_tasks(user_cronogram_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_date
  ON user_daily_tasks(user_cronogram_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_status
  ON user_daily_tasks(status);

-- ─── TRIGGERS updated_at ────────────────────────────────────
-- (Cria a função somente se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cronograms_updated_at            ON cronograms;
DROP TRIGGER IF EXISTS trg_user_cronograms_updated_at       ON user_cronograms;
DROP TRIGGER IF EXISTS trg_user_subject_progress_updated_at ON user_subject_progress;
DROP TRIGGER IF EXISTS trg_user_daily_tasks_updated_at      ON user_daily_tasks;

CREATE TRIGGER trg_cronograms_updated_at
  BEFORE UPDATE ON cronograms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_cronograms_updated_at
  BEFORE UPDATE ON user_cronograms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_subject_progress_updated_at
  BEFORE UPDATE ON user_subject_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_daily_tasks_updated_at
  BEFORE UPDATE ON user_daily_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── COMENTÁRIOS ────────────────────────────────────────────
COMMENT ON TABLE cronograms                  IS 'Templates de cronogramas (oficiais ou base para personalizado)';
COMMENT ON TABLE cronogram_disciplines       IS 'Disciplinas de um cronograma oficial';
COMMENT ON TABLE cronogram_subjects          IS 'Assuntos de cada disciplina oficial';
COMMENT ON TABLE cronogram_days              IS 'Plano diário pré-definido de um cronograma oficial';
COMMENT ON TABLE cronogram_day_tasks         IS 'Tarefas de cada dia do plano oficial';
COMMENT ON TABLE user_cronograms             IS 'Instância do cronograma por usuário (cópia ou personalizado)';
COMMENT ON TABLE user_cronogram_disciplines  IS 'Disciplinas do cronograma do usuário';
COMMENT ON TABLE user_cronogram_subjects     IS 'Assuntos do cronograma do usuário';
COMMENT ON TABLE user_subject_progress       IS 'Progresso por assunto (not_started|in_progress|completed)';
COMMENT ON TABLE user_daily_tasks            IS 'Tarefas diárias geradas pelo algoritmo';

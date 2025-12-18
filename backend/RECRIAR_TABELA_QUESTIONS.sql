-- ============================================
-- RECRIAR TABELA: questions
-- Use este script para apagar e recriar a tabela questions
-- ============================================

-- ⚠️ ATENÇÃO: Este script vai APAGAR todos os dados da tabela questions
-- e também apagará dados relacionados em outras tabelas:
-- - attempts (tentativas de resposta)
-- - notebook_questions (questões em cadernos)
-- - comments (comentários nas questões)

-- ============================================
-- PASSO 1: Apagar tabelas dependentes primeiro
-- ============================================

-- Apagar tabela de comentários (depende de questions)
DROP TABLE IF EXISTS comments CASCADE;

-- Apagar tabela de tentativas (depende de questions)
DROP TABLE IF EXISTS attempts CASCADE;

-- Apagar tabela de questões em cadernos (depende de questions)
DROP TABLE IF EXISTS notebook_questions CASCADE;

-- ============================================
-- PASSO 2: Apagar a tabela questions
-- ============================================

DROP TABLE IF EXISTS questions CASCADE;

-- ============================================
-- PASSO 3: Recriar a tabela questions
-- ============================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    text TEXT NOT NULL,
    discipline VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    exam_board VARCHAR(100),
    year INTEGER,
    position VARCHAR(100),
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    option_e TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL,
    explanation TEXT NOT NULL,
    question_type VARCHAR(100),
    subjects TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_by VARCHAR(255),
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Foreign Key para users (criador da questão)
    CONSTRAINT fk_questions_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(email) 
        ON DELETE SET NULL,
    
    -- Constraint: resposta correta deve ser A, B, C, D ou E
    CONSTRAINT chk_correct_answer 
        CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
    
    -- Constraint: dificuldade deve ser Fácil, Médio ou Difícil
    CONSTRAINT chk_difficulty 
        CHECK (difficulty IN ('Fácil', 'Médio', 'Difícil'))
);

-- ============================================
-- PASSO 4: Criar índices para melhor performance
-- ============================================

-- Índice único para código da questão
CREATE INDEX idx_questions_code ON questions(code);

-- Índice para disciplina (filtros frequentes)
CREATE INDEX idx_questions_discipline ON questions(discipline);

-- Índice para dificuldade (filtros frequentes)
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Índice para criador (filtros por usuário)
CREATE INDEX idx_questions_created_by ON questions(created_by);

-- Índice para data de criação (ordenação)
CREATE INDEX idx_questions_created_date ON questions(created_date DESC);

-- Índice GIN para array de subjects (busca em arrays)
CREATE INDEX idx_questions_subjects ON questions USING GIN(subjects);

-- ============================================
-- PASSO 5: Recriar trigger para updated_at
-- ============================================

-- Verificar se a função já existe, se não, criar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PASSO 6: Recriar tabelas dependentes
-- ============================================

-- Recriar tabela attempts
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL,
    user_id UUID NOT NULL,
    chosen_answer VARCHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    
    CONSTRAINT fk_attempts_question 
        FOREIGN KEY (question_id) 
        REFERENCES questions(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_attempts_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Índices para attempts
CREATE INDEX idx_attempts_question_id ON attempts(question_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_created_date ON attempts(created_date DESC);
CREATE INDEX idx_attempts_is_correct ON attempts(is_correct);
CREATE INDEX idx_attempts_created_by ON attempts(created_by);

-- Recriar tabela notebook_questions
CREATE TABLE notebook_questions (
    notebook_id UUID NOT NULL,
    question_id UUID NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    PRIMARY KEY (notebook_id, question_id),
    
    CONSTRAINT fk_notebook_questions_notebook 
        FOREIGN KEY (notebook_id) 
        REFERENCES notebooks(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_notebook_questions_question 
        FOREIGN KEY (question_id) 
        REFERENCES questions(id) 
        ON DELETE CASCADE
);

-- Índices para notebook_questions
CREATE INDEX idx_notebook_questions_notebook ON notebook_questions(notebook_id);
CREATE INDEX idx_notebook_questions_question ON notebook_questions(question_id);

-- Recriar tabela comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL,
    user_id UUID,
    text TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_comments_question 
        FOREIGN KEY (question_id) 
        REFERENCES questions(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_comments_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL
);

-- Índices para comments
CREATE INDEX idx_comments_question_id ON comments(question_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_date ON comments(created_date DESC);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'questions'
ORDER BY 
    ordinal_position;

-- Contar registros (deve ser 0 após recriação)
SELECT 
    'questions' as tabela, 
    COUNT(*) as total_registros 
FROM questions;

-- Verificar índices criados
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'questions'
ORDER BY 
    indexname;

-- ============================================
-- FIM DO SCRIPT
-- ============================================



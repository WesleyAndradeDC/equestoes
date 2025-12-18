-- ============================================
-- G-CONCURSOS GRAMATIQUE - DATABASE SETUP
-- PostgreSQL Schema for Render
-- ============================================

-- Limpar tabelas existentes (se necessário)
DROP TABLE IF EXISTS notebook_questions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS notebooks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABELA: users
-- Armazena usuários, autenticação e perfis
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    subscription_type VARCHAR(100),
    study_streak INTEGER DEFAULT 0 NOT NULL,
    last_study_date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription ON users(subscription_type);

-- ============================================
-- TABELA: questions
-- Armazena questões de concursos
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
    
    CONSTRAINT fk_questions_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(email) 
        ON DELETE SET NULL,
    
    CONSTRAINT chk_correct_answer 
        CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
    
    CONSTRAINT chk_difficulty 
        CHECK (difficulty IN ('Fácil', 'Médio', 'Difícil'))
);

-- Índices para questions
CREATE INDEX idx_questions_code ON questions(code);
CREATE INDEX idx_questions_discipline ON questions(discipline);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_created_by ON questions(created_by);
CREATE INDEX idx_questions_created_date ON questions(created_date DESC);
CREATE INDEX idx_questions_subjects ON questions USING GIN(subjects);

-- ============================================
-- TABELA: attempts
-- Armazena tentativas de resposta dos usuários
-- ============================================
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

-- ============================================
-- TABELA: notebooks
-- Armazena cadernos de questões dos usuários
-- ============================================
CREATE TABLE notebooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT 'blue' NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT fk_notebooks_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES users(email) 
        ON DELETE CASCADE
);

-- Índices para notebooks
CREATE INDEX idx_notebooks_created_by ON notebooks(created_by);
CREATE INDEX idx_notebooks_created_date ON notebooks(created_date DESC);

-- ============================================
-- TABELA: notebook_questions
-- Relação N:N entre notebooks e questions
-- ============================================
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

-- ============================================
-- TABELA: comments
-- Armazena comentários nas questões
-- ============================================
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
-- TRIGGERS: Atualizar updated_at automaticamente
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para questions
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para notebooks
CREATE TRIGGER update_notebooks_updated_at 
    BEFORE UPDATE ON notebooks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS INICIAIS (SEED)
-- ============================================

-- Inserir usuário Admin
-- Senha: admin123 (já hasheada com bcrypt)
INSERT INTO users (email, password_hash, full_name, role, subscription_type) 
VALUES (
    'admin@gconcursos.com',
    '$2a$10$YourHashedPasswordHere', -- SUBSTITUA pelo hash real
    'Administrador',
    'admin',
    'Professor'
) ON CONFLICT (email) DO NOTHING;

-- Inserir Professor
-- Senha: professor123 (já hasheada com bcrypt)
INSERT INTO users (email, password_hash, full_name, role, subscription_type) 
VALUES (
    'professor@gconcursos.com',
    '$2a$10$YourHashedPasswordHere', -- SUBSTITUA pelo hash real
    'Professor Silva',
    'user',
    'Professor'
) ON CONFLICT (email) DO NOTHING;

-- Inserir Aluno Clube dos Cascas
-- Senha: aluno123 (já hasheada com bcrypt)
INSERT INTO users (email, password_hash, full_name, role, subscription_type) 
VALUES (
    'aluno.cascas@gconcursos.com',
    '$2a$10$YourHashedPasswordHere', -- SUBSTITUA pelo hash real
    'João Silva',
    'user',
    'Aluno Clube dos Cascas'
) ON CONFLICT (email) DO NOTHING;

-- Inserir Aluno Clube do Pedrão
-- Senha: aluno123 (já hasheada com bcrypt)
INSERT INTO users (email, password_hash, full_name, role, subscription_type) 
VALUES (
    'aluno.pedrao@gconcursos.com',
    '$2a$10$YourHashedPasswordHere', -- SUBSTITUA pelo hash real
    'Maria Santos',
    'user',
    'Aluno Clube do Pedrão'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICAÇÕES FINAIS
-- ============================================

-- Contar registros em cada tabela
SELECT 
    'users' as tabela, 
    COUNT(*) as total 
FROM users
UNION ALL
SELECT 
    'questions' as tabela, 
    COUNT(*) as total 
FROM questions
UNION ALL
SELECT 
    'attempts' as tabela, 
    COUNT(*) as total 
FROM attempts
UNION ALL
SELECT 
    'notebooks' as tabela, 
    COUNT(*) as total 
FROM notebooks
UNION ALL
SELECT 
    'notebook_questions' as tabela, 
    COUNT(*) as total 
FROM notebook_questions
UNION ALL
SELECT 
    'comments' as tabela, 
    COUNT(*) as total 
FROM comments;

-- Listar todas as tabelas criadas
SELECT 
    table_name,
    table_type
FROM 
    information_schema.tables
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;

-- ============================================
-- FIM DO SCRIPT
-- ============================================





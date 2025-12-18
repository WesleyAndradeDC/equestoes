-- ============================================
-- SQL PARA INSERIR USUÁRIOS DE TESTE
-- Todos os usuários serão marcados como primeiro acesso
-- ============================================

-- ============================================
-- USUÁRIOS PEDRO LIMA
-- ============================================

-- Usuário 1: Pedro Lima - Aluno Clube dos Cascas
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'pedrolimateste@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Pedro Lima',
    'user',
    'Aluno Clube dos Cascas',
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    subscription_type = EXCLUDED.subscription_type,
    first_login = true,
    updated_at = NOW();

-- Usuário 2: Pedro Lima - Aluno Clube do Pedrão
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'pedrolimateste2@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Pedro Lima',
    'user',
    'Aluno Clube do Pedrão',
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    subscription_type = EXCLUDED.subscription_type,
    first_login = true,
    updated_at = NOW();

-- Usuário 3: Pedro Lima - Professor
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'pedrolimaprof@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Pedro Lima',
    'user',
    'Professor',
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    subscription_type = EXCLUDED.subscription_type,
    first_login = true,
    updated_at = NOW();

-- Usuário 4: Pedro Lima - Administrador
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'pedrolimadm@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Pedro Lima',
    'admin', -- Role admin
    NULL, -- Admin não tem subscription_type
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'admin',
    first_login = true,
    updated_at = NOW();

-- ============================================
-- USUÁRIOS WESLEY ANDRADE
-- ============================================

-- Usuário 5: Wesley Andrade - Aluno Clube dos Cascas
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'wesleyandrade.cascas@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Wesley Andrade',
    'user',
    'Aluno Clube dos Cascas',
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    subscription_type = EXCLUDED.subscription_type,
    first_login = true,
    updated_at = NOW();

-- Usuário 6: Wesley Andrade - Aluno Clube do Pedrão
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'wesleyandrade.pedrao@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Wesley Andrade',
    'user',
    'Aluno Clube do Pedrão',
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    subscription_type = EXCLUDED.subscription_type,
    first_login = true,
    updated_at = NOW();

-- Usuário 7: Wesley Andrade - Professor
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'wesleyandrade.prof@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Wesley Andrade',
    'user',
    'Professor',
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    subscription_type = EXCLUDED.subscription_type,
    first_login = true,
    updated_at = NOW();

-- Usuário 8: Wesley Andrade - Administrador
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    subscription_type,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'wesleyandrade.adm@gmail.com',
    NULL, -- Primeiro acesso - sem senha ainda
    'Wesley Andrade',
    'admin', -- Role admin
    NULL, -- Admin não tem subscription_type
    true, -- Primeiro acesso
    0,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'admin',
    first_login = true,
    updated_at = NOW();

-- ============================================
-- VERIFICAR USUÁRIOS INSERIDOS
-- ============================================

SELECT 
    id,
    email,
    full_name,
    role,
    subscription_type,
    first_login,
    password_hash IS NULL as sem_senha,
    study_streak,
    created_at
FROM users
WHERE email IN (
    'pedrolimateste@gmail.com',
    'pedrolimateste2@gmail.com',
    'pedrolimaprof@gmail.com',
    'pedrolimadm@gmail.com',
    'wesleyandrade.cascas@gmail.com',
    'wesleyandrade.pedrao@gmail.com',
    'wesleyandrade.prof@gmail.com',
    'wesleyandrade.adm@gmail.com'
)
ORDER BY 
    full_name,
    CASE 
        WHEN role = 'admin' THEN 1
        WHEN subscription_type = 'Professor' THEN 2
        WHEN subscription_type = 'Aluno Clube do Pedrão' THEN 3
        WHEN subscription_type = 'Aluno Clube dos Cascas' THEN 4
        ELSE 5
    END;

-- ============================================
-- RESUMO DOS USUÁRIOS CRIADOS
-- ============================================
-- 
-- PEDRO LIMA:
-- 1. pedrolimateste@gmail.com - Aluno Clube dos Cascas
-- 2. pedrolimateste2@gmail.com - Aluno Clube do Pedrão
-- 3. pedrolimaprof@gmail.com - Professor
-- 4. pedrolimadm@gmail.com - Administrador
--
-- WESLEY ANDRADE:
-- 5. wesleyandrade.cascas@gmail.com - Aluno Clube dos Cascas
-- 6. wesleyandrade.pedrao@gmail.com - Aluno Clube do Pedrão
-- 7. wesleyandrade.prof@gmail.com - Professor
-- 8. wesleyandrade.adm@gmail.com - Administrador
--
-- TODOS:
-- ✅ first_login = true (primeiro acesso)
-- ✅ password_hash = NULL (sem senha ainda)
-- ✅ study_streak = 0
-- ✅ last_study_date = NULL
--
-- ============================================
-- COMO USAR:
-- ============================================
-- 1. Abra o DBeaver
-- 2. Conecte ao banco PostgreSQL do Render
-- 3. Execute este script completo
-- 4. Verifique os usuários criados com a query SELECT acima
-- 5. Teste login com qualquer email (será primeiro acesso)
--
-- ============================================


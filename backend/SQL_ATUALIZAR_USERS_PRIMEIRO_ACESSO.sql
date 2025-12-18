-- ============================================
-- SQL PARA ATUALIZAR TABELA USERS
-- Adicionar campo first_login
-- ============================================

-- 1. Adicionar coluna first_login (padrão true)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- 2. Tornar password_hash nullable (permitir NULL para novos usuários)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- 3. Para usuários existentes que já têm senha, marcar como não sendo primeiro acesso
UPDATE users 
SET first_login = false 
WHERE password_hash IS NOT NULL;

-- 4. Verificar alterações
SELECT 
    id,
    email,
    full_name,
    password_hash IS NOT NULL as tem_senha,
    first_login,
    subscription_type,
    created_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- COMENTÁRIOS:
-- ============================================
-- 
-- first_login = true  → Usuário precisa criar senha no primeiro acesso
-- first_login = false → Usuário já tem senha cadastrada
-- password_hash = NULL → Usuário ainda não definiu senha
-- password_hash != NULL → Usuário já tem senha
--
-- ============================================


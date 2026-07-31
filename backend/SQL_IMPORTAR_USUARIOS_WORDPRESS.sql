-- ============================================================
-- IMPORT USUÁRIOS — WordPress → E-Questões
-- Origem: export manual WP (nome + email)
-- Senha: NULL + first_login = true → aluno define no 1º acesso
-- Admins: luan@elevacursos.com.br + Wesley dos Santos Andrade
-- ============================================================

INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    first_login,
    study_streak,
    last_study_date,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    lower(v.email),
    NULL,
    v.full_name,
    v.role,
    true,
    0,
    NULL,
    NOW(),
    NOW()
FROM (VALUES
    -- Admins
    ('luan@elevacursos.com.br',           'Luan',                              'admin'),
    ('wesleyandrade.adm@gmail.com',       'Wesley dos Santos Andrade',         'admin'),

    -- Alunos
    ('suporte@4growthbr.com',             '4growthbr',                         'user'),
    ('lucassouza.1000@hotmail.com',       'Lucas Souza',                       'user'),
    ('muniz_sena@hotmail.com',            'Antônio José Muniz de Oliveira',    'user'),
    ('ceicynhaaraujo@hotmail.com',        'Ceicynha Lima',                     'user'),
    ('cicerohenrique10@gmail.com',        'Cícero Henrique',                   'user'),
    ('elevacursos@elevacursoscom.local',   'Eleva Cursos',                      'user'),
    ('snira655@gmail.com',                'Eunira Silva',                      'user'),
    ('fabiogalindo1985@gmail.com',        'Fábio Galindo Cavalcante',          'user'),
    ('gabrielholanda765@gmail.com',       'Gabriel Holanda',                   'user'),
    ('iordanoliveira@gmail.com',          'Iordan de Oliveira',                'user'),
    ('izabellmonteirof@gmail.com',        'Izabel Monteiro',                   'user'),
    ('jailsondesouzaferreira380@gmail.com', 'Jailson de Souza Ferreira',       'user'),
    ('limaj925@gmail.com',                'Jessica Lima',                      'user'),
    ('julianafarias733@hotmail.com',      'Juliana Farias Santana',            'user'),
    ('lenilson@elevacursoscom.local',     'Lenilson',                          'user'),
    ('lidja.m.teixera@hotmail.com',       'Lidja Santos',                      'user'),
    ('luan@elevacursoscom.local',          'Luan Victor',                       'user'),
    ('pekesoh82@azemo.tech',              'LUAN TESTE ELEVA',                  'user'),
    ('lucas.souza1@aracaju.se.gov.br',    'Lucas Souza',                       'user'),
    ('rosacatipao@gmail.com',             'LUIZ EDGAR. ROSA',                  'user'),
    ('msilva27326@gmail.com',             'Mariana Vieira da silva',           'user'),
    ('nattemanuel5@gmail.com',            'Natália Felix Dos Santos',          'user'),
    ('henryffontes@gmail.com',            'Pedro Henrique',                    'user'),
    ('teste@gmail.com',                   'Pedro Henrique',                    'user'),
    ('pdroinho2@gmail.com',               'Pedro Henrique',                    'user'),
    ('pdroinho1@gmail.com',               'Pedro Henrique',                    'user'),
    ('pedroigorcomercial@gmail.com',      'Pedro Igor',                        'user'),
    ('carvalhorafaella03@gmail.com',      'Rafaella Santos de Carvalho Costa', 'user'),
    ('rodrigodalvo@hotmail.com',          'Rodrigo Silva',                     'user'),
    ('samuel_2007_1@hotmail.com',         'Samuel Santos',                     'user'),
    ('fannymoreiraleite@gmail.com',       'STEFANE LEITE',                     'user'),
    ('tacy.lii23@gmail.com',              'Taciana Oliveira',                  'user'),
    ('teste@teste.com.br',                'Teste Compra',                      'user'),
    ('valber@elevacursoscom.local',       'Valber',                            'user')
) AS v(email, full_name, role)
ON CONFLICT (email) DO UPDATE SET
    full_name   = EXCLUDED.full_name,
    role        = EXCLUDED.role,
    first_login = true,
    updated_at  = NOW();

-- ============================================================
-- VERIFICAR
-- ============================================================

SELECT
    email,
    full_name,
    role,
    first_login,
    password_hash IS NULL AS sem_senha
FROM users
WHERE email IN (
    'luan@elevacursos.com.br',
    'wesleyandrade.adm@gmail.com',
    'suporte@4growthbr.com',
    'lucassouza.1000@hotmail.com',
    'muniz_sena@hotmail.com',
    'ceicynhaaraujo@hotmail.com',
    'cicerohenrique10@gmail.com',
    'elevacursos@elevacursoscom.local',
    'snira655@gmail.com',
    'fabiogalindo1985@gmail.com',
    'gabrielholanda765@gmail.com',
    'iordanoliveira@gmail.com',
    'izabellmonteirof@gmail.com',
    'jailsondesouzaferreira380@gmail.com',
    'limaj925@gmail.com',
    'julianafarias733@hotmail.com',
    'lenilson@elevacursoscom.local',
    'lidja.m.teixera@hotmail.com',
    'luan@elevacursoscom.local',
    'pekesoh82@azemo.tech',
    'lucas.souza1@aracaju.se.gov.br',
    'rosacatipao@gmail.com',
    'msilva27326@gmail.com',
    'nattemanuel5@gmail.com',
    'henryffontes@gmail.com',
    'teste@gmail.com',
    'pdroinho2@gmail.com',
    'pdroinho1@gmail.com',
    'pedroigorcomercial@gmail.com',
    'carvalhorafaella03@gmail.com',
    'rodrigodalvo@hotmail.com',
    'samuel_2007_1@hotmail.com',
    'fannymoreiraleite@gmail.com',
    'tacy.lii23@gmail.com',
    'teste@teste.com.br',
    'valber@elevacursoscom.local'
)
ORDER BY full_name;

-- ============================================================
-- RESUMO: 36 usuários (2 admin + 34 alunos)
-- Wesley email: wesleyandrade.adm@gmail.com — ajuste se precisar
-- Rodar após DATABASE.sql ou prisma db push
-- ============================================================

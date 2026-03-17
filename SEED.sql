-- ============================================================
-- SEED.sql — E-Questões
-- Dados de teste para todas as funcionalidades
-- PostgreSQL · pgcrypto (bcrypt nativo — compatível com bcryptjs)
-- ============================================================
--
-- CREDENCIAIS DE ACESSO:
-- ┌──────────────────────────────────────────┬───────────────┬────────────────────┐
-- │ Email                                    │ Senha         │ Perfil             │
-- ├──────────────────────────────────────────┼───────────────┼────────────────────┤
-- │ admin@equestoes.com                      │ Admin@123     │ Admin              │
-- │ professor@equestoes.com                  │ Prof@123      │ Professor          │
-- │ aluno@equestoes.com                      │ Aluno@123     │ Aluno Cascas       │
-- │ aluno.pedrao@equestoes.com               │ Aluno@123     │ Aluno Pedrão       │
-- └──────────────────────────────────────────┴───────────────┴────────────────────┘
--
-- COMO EXECUTAR:
--   psql "sua_connection_string" -f SEED.sql
--   ou via Render Shell: psql $DATABASE_URL -f SEED.sql
-- ============================================================

-- Requer a extensão pgcrypto (já instalada por padrão no Render PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- LIMPAR DADOS EXISTENTES (para re-seed limpo)
-- ─────────────────────────────────────────────────────────────
TRUNCATE TABLE flashcard_reviews  CASCADE;
TRUNCATE TABLE flashcards         CASCADE;
TRUNCATE TABLE question_reports   CASCADE;
TRUNCATE TABLE comments           CASCADE;
TRUNCATE TABLE notebook_questions CASCADE;
TRUNCATE TABLE notebooks          CASCADE;
TRUNCATE TABLE attempts           CASCADE;
TRUNCATE TABLE questions          CASCADE;
TRUNCATE TABLE subscription_history CASCADE;
TRUNCATE TABLE subscriptions      CASCADE;
TRUNCATE TABLE users              CASCADE;

-- ─────────────────────────────────────────────────────────────
-- USUÁRIOS
-- ─────────────────────────────────────────────────────────────

-- IDs fixos para facilitar referências
DO $$
DECLARE
  v_admin_id       UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_professor_id   UUID := 'bbbbbbbb-0000-0000-0000-000000000002';
  v_cascas_id      UUID := 'cccccccc-0000-0000-0000-000000000003';
  v_pedrao_id      UUID := 'dddddddd-0000-0000-0000-000000000004';

  -- Question IDs
  v_q1  UUID := gen_random_uuid();  v_q2  UUID := gen_random_uuid();
  v_q3  UUID := gen_random_uuid();  v_q4  UUID := gen_random_uuid();
  v_q5  UUID := gen_random_uuid();  v_q6  UUID := gen_random_uuid();
  v_q7  UUID := gen_random_uuid();  v_q8  UUID := gen_random_uuid();
  v_q9  UUID := gen_random_uuid();  v_q10 UUID := gen_random_uuid();
  v_q11 UUID := gen_random_uuid();  v_q12 UUID := gen_random_uuid();
  v_q13 UUID := gen_random_uuid();  v_q14 UUID := gen_random_uuid();
  v_q15 UUID := gen_random_uuid();  v_q16 UUID := gen_random_uuid();
  v_q17 UUID := gen_random_uuid();  v_q18 UUID := gen_random_uuid();
  v_q19 UUID := gen_random_uuid();  v_q20 UUID := gen_random_uuid();

  -- Notebook IDs
  v_nb1 UUID := gen_random_uuid();
  v_nb2 UUID := gen_random_uuid();

  -- Flashcard IDs
  v_fc1 UUID := gen_random_uuid();  v_fc2 UUID := gen_random_uuid();
  v_fc3 UUID := gen_random_uuid();  v_fc4 UUID := gen_random_uuid();
  v_fc5 UUID := gen_random_uuid();  v_fc6 UUID := gen_random_uuid();
  v_fc7 UUID := gen_random_uuid();  v_fc8 UUID := gen_random_uuid();

BEGIN

-- ─── USUÁRIOS ─────────────────────────────────────────────────
INSERT INTO users (id, email, password_hash, full_name, role,
  subscription_type, subscription_status, subscription_active,
  membership_status, membership_active, membership_plan,
  first_login, study_streak, last_study_date, updated_at)
VALUES
  -- Admin
  (v_admin_id,
   'admin@equestoes.com',
   crypt('Admin@123', gen_salt('bf', 10)),
   'Administrador E-Questões',
   'admin',
   'Professor', 'active', true,
   'active', true, 'Admin',
   false, 15, CURRENT_DATE::text, NOW()),

  -- Professor
  (v_professor_id,
   'professor@equestoes.com',
   crypt('Prof@123', gen_salt('bf', 10)),
   'Prof. Carlos Mendes',
   'user',
   'Professor', 'active', true,
   'active', true, 'Professor',
   false, 7, CURRENT_DATE::text, NOW()),

  -- Aluno Clube dos Cascas (acesso total + E-Tutory)
  (v_cascas_id,
   'aluno@equestoes.com',
   crypt('Aluno@123', gen_salt('bf', 10)),
   'Ana Paula Ferreira',
   'user',
   'Aluno Clube dos Cascas', 'active', true,
   'active', true, 'Clube dos Cascas',
   false, 12, CURRENT_DATE::text, NOW()),

  -- Aluno Clube do Pedrão (acesso restrito a Português)
  (v_pedrao_id,
   'aluno.pedrao@equestoes.com',
   crypt('Aluno@123', gen_salt('bf', 10)),
   'Bruno Oliveira',
   'user',
   'Aluno Clube do Pedrão', 'active', true,
   'active', true, 'Clube do Pedrão',
   false, 3, (CURRENT_DATE - INTERVAL '1 day')::text, NOW());

RAISE NOTICE '✅ Usuários criados';

-- ─── ASSINATURAS ──────────────────────────────────────────────
INSERT INTO subscriptions (id, user_id, status, subscription_type,
  woo_subscription_id, started_at, expires_at, updated_at)
VALUES
  (gen_random_uuid(), v_cascas_id, 'active', 'Aluno Clube dos Cascas',
   'WC-1001', NOW() - INTERVAL '30 days', NOW() + INTERVAL '335 days', NOW()),

  (gen_random_uuid(), v_pedrao_id, 'active', 'Aluno Clube do Pedrão',
   'WC-1002', NOW() - INTERVAL '15 days', NOW() + INTERVAL '350 days', NOW());

RAISE NOTICE '✅ Assinaturas criadas';

-- ─────────────────────────────────────────────────────────────
-- QUESTÕES
-- ─────────────────────────────────────────────────────────────

-- ── Língua Portuguesa ────────────────────────────────────────
INSERT INTO questions (id, code, text, discipline, difficulty, exam_board, year,
  position, option_a, option_b, option_c, option_d, option_e,
  correct_answer, explanation, question_type, subjects, created_by, updated_at)
VALUES
  (v_q1, 'LP0001',
   'Assinale a alternativa em que o uso da crase está CORRETO:',
   'Língua Portuguesa', 'Médio', 'CESPE', 2024, 'Analista Judiciário',
   'Fui à casa da minha avó.',
   'Refiro-me à pessoas honestas.',
   'Cheguei à duas horas.',
   'Vou à pé ao trabalho.',
   'Assisti à o filme ontem.',
   'A',
   'A alternativa A está correta. Usa-se crase antes de substantivo feminino precedido de preposição "a" + artigo "a". "Fui à casa" = fui + a (prep.) + a (artigo) + casa. B) "pessoas" não admite artigo definido feminino neste contexto. C) "horas" no sentido de tempo decorrido não admite crase. D) Artigo masculino não admite crase. E) Pleonasmo — "ao" já é "a + o".',
   'Múltipla Escolha',
   ARRAY['Crase', 'Regência Verbal'],
   'professor@equestoes.com', NOW()),

  (v_q2, 'LP0002',
   'Qual das alternativas apresenta concordância verbal CORRETA?',
   'Língua Portuguesa', 'Fácil', 'FCC', 2024, 'Técnico Administrativo',
   'Houveram muitos problemas na reunião.',
   'Fazem dois anos que nos conhecemos.',
   'Deve haver soluções para o problema.',
   'Haviam muitas pessoas na fila.',
   'Podem haver dúvidas sobre o assunto.',
   'C',
   'A alternativa C está correta. O verbo "haver" no sentido de "existir" é impessoal e deve ficar na 3ª pessoa do singular. O verbo "dever" concorda com "haver". As demais alternativas erram ao flexionar "haver" no plural.',
   'Múltipla Escolha',
   ARRAY['Concordância Verbal', 'Verbos Impessoais'],
   'professor@equestoes.com', NOW()),

  (v_q3, 'LP0003',
   'Em relação à pontuação, assinale a alternativa INCORRETA:',
   'Língua Portuguesa', 'Difícil', 'VUNESP', 2023, 'Escrevente',
   'O ponto-e-vírgula separa orações de período composto por coordenação.',
   'A vírgula deve ser usada para separar o vocativo.',
   'Os dois-pontos introduzem citação direta ou explicação.',
   'O travessão indica a fala de personagens em discurso direto.',
   'A vírgula separa o sujeito de seu predicado em qualquer situação.',
   'E',
   'A alternativa E está INCORRETA. A vírgula NÃO deve separar o sujeito de seu predicado. Isso constitui erro grave de pontuação. As demais alternativas descrevem usos corretos dos sinais de pontuação.',
   'Múltipla Escolha',
   ARRAY['Pontuação', 'Vírgula'],
   'professor@equestoes.com', NOW()),

  (v_q4, 'LP0004',
   'A respeito das classes de palavras, assinale a alternativa correta sobre os pronomes relativos:',
   'Língua Portuguesa', 'Médio', 'CESPE', 2024, 'Analista Legislativo',
   '"Que" é o pronome relativo de maior abrangência e pode substituir qualquer antecedente.',
   '"Cujo" concorda com o antecedente, concordando em gênero e número.',
   '"Onde" refere-se exclusivamente a lugar com ideia de movimento.',
   '"Quem" pode ser usado para se referir a coisas inanimadas.',
   '"Que" pode ser substituído por "cujo" em qualquer contexto.',
   'A',
   'A alternativa A está correta. O pronome relativo "que" é o de maior abrangência, podendo se referir a pessoas, animais ou coisas, no singular ou plural. "Cujo" concorda com o SUBSEQUENTE (não com o antecedente). "Onde" refere-se a lugar com ideia de permanência. "Quem" refere-se apenas a seres animados.',
   'Múltipla Escolha',
   ARRAY['Pronomes Relativos', 'Classes de Palavras'],
   'professor@equestoes.com', NOW()),

-- ── Matemática e Raciocínio Lógico ───────────────────────────
  (v_q5, 'MAT0001',
   'Em uma loja, um produto custava R$ 200,00 e teve um aumento de 20%. Após uma semana, o novo preço sofreu um desconto de 20%. Qual o preço final?',
   'Matemática e Raciocínio Lógico', 'Médio', 'CESPE', 2024, 'Técnico Bancário',
   'R$ 200,00',
   'R$ 192,00',
   'R$ 208,00',
   'R$ 216,00',
   'R$ 184,00',
   'B',
   'Aumento de 20%: R$ 200,00 × 1,20 = R$ 240,00. Desconto de 20% sobre o novo valor: R$ 240,00 × 0,80 = R$ 192,00. Atenção: aumentar 20% e descontar 20% não resulta no valor original, pois as bases de cálculo são diferentes.',
   'Múltipla Escolha',
   ARRAY['Porcentagem', 'Matemática Básica'],
   'professor@equestoes.com', NOW()),

  (v_q6, 'MAT0002',
   'Se em uma progressão aritmética os termos a₁ = 3 e a₅ = 11, qual é a razão da PA?',
   'Matemática e Raciocínio Lógico', 'Fácil', 'FGV', 2023, 'Analista',
   '1',
   '2',
   '3',
   '4',
   '8',
   'B',
   'Na PA, aₙ = a₁ + (n-1)r. Para a₅: 11 = 3 + (5-1)r → 11 = 3 + 4r → 4r = 8 → r = 2. A razão da PA é 2.',
   'Múltipla Escolha',
   ARRAY['Progressão Aritmética', 'Álgebra'],
   'professor@equestoes.com', NOW()),

  (v_q7, 'MAT0003',
   'Uma urna contém 4 bolas vermelhas e 6 bolas azuis. Retirando-se uma bola ao acaso, qual é a probabilidade de ser vermelha?',
   'Matemática e Raciocínio Lógico', 'Fácil', 'VUNESP', 2024, 'Técnico',
   '2/5',
   '3/5',
   '1/4',
   '1/3',
   '3/4',
   'A',
   'Total de bolas: 4 + 6 = 10. Probabilidade de vermelha: P = 4/10 = 2/5. Logo a resposta é A.',
   'Múltipla Escolha',
   ARRAY['Probabilidade', 'Combinatória'],
   'professor@equestoes.com', NOW()),

-- ── Direito Constitucional ────────────────────────────────────
  (v_q8, 'DC0001',
   'Sobre os direitos e garantias fundamentais previstos na CF/88, é correto afirmar:',
   'Direito Constitucional', 'Médio', 'CESPE', 2024, 'Analista Jurídico',
   'Os direitos fundamentais são absolutos e não admitem restrição.',
   'O habeas corpus protege a liberdade de locomoção ameaçada ou coagida.',
   'O mandado de segurança protege direito líquido e certo contra ato de particular.',
   'O habeas data serve para impugnar decisões judiciais ilegais.',
   'O mandado de injunção tem por objeto tornar efetiva norma constitucional de eficácia plena.',
   'B',
   'O habeas corpus é a ação constitucional que protege a liberdade de locomoção sempre que alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade (CF/88, art. 5º, LXVIII). Os direitos fundamentais não são absolutos. O MS protege contra ato de autoridade pública ou agente no exercício de atribuições do poder público.',
   'Múltipla Escolha',
   ARRAY['Direitos Fundamentais', 'Remédios Constitucionais'],
   'professor@equestoes.com', NOW()),

  (v_q9, 'DC0002',
   'De acordo com a CF/88, o processo de emenda constitucional:',
   'Direito Constitucional', 'Difícil', 'FGV', 2023, 'Defensor Público',
   'Pode ser proposto por qualquer cidadão brasileiro.',
   'Requer aprovação por maioria simples em dois turnos em cada Casa do Congresso.',
   'Não pode ser objeto de deliberação em estado de sítio.',
   'Deve ser promulgado pelo Presidente da República.',
   'Permite a abolição do voto direto mediante PEC aprovada por 2/3.',
   'C',
   'Conforme art. 60, §1º da CF/88, a Constituição não poderá ser emendada na vigência de intervenção federal, de estado de defesa ou de estado de sítio. A PEC exige 3/5 dos membros de cada Casa, em dois turnos. É promulgada pelas Mesas da Câmara e do Senado. O voto direto é cláusula pétrea.',
   'Múltipla Escolha',
   ARRAY['Emenda Constitucional', 'Processo Legislativo'],
   'professor@equestoes.com', NOW()),

  (v_q10, 'DC0003',
   'Em relação à organização do Estado brasileiro, é CORRETO afirmar:',
   'Direito Constitucional', 'Médio', 'CESPE', 2024, 'Auditor Federal',
   'O Brasil adota forma de governo republicana e sistema presidencialista.',
   'O Brasil adota forma de Estado unitária.',
   'A soberania popular é exercida exclusivamente pelo voto.',
   'Os Municípios não integram a Federação brasileira.',
   'O Estado federal brasileiro é de dois níveis: União e Estados.',
   'A',
   'O Brasil adota: forma de governo Republicana (art. 1º), sistema de governo Presidencialista, forma de Estado Federativa (não unitária). A Federação é de três níveis: União, Estados/DF e Municípios. A soberania popular se exerce pelo sufrágio universal, plebiscito, referendo e iniciativa popular.',
   'Múltipla Escolha',
   ARRAY['Organização do Estado', 'Federalismo'],
   'professor@equestoes.com', NOW()),

-- ── Direito Administrativo ────────────────────────────────────
  (v_q11, 'DA0001',
   'Sobre os princípios da Administração Pública, assinale a alternativa CORRETA:',
   'Direito Administrativo', 'Fácil', 'CESPE', 2024, 'Analista Administrativo',
   'O princípio da eficiência foi incluído na CF/88 pela Emenda nº 19/1998.',
   'O princípio da legalidade na Administração Pública é idêntico ao do direito privado.',
   'O princípio da impessoalidade proíbe a publicidade dos atos administrativos.',
   'O princípio da moralidade exige que os atos sejam apenas legais.',
   'O princípio da publicidade garante que todos os atos sejam sigilosos.',
   'A',
   'O princípio da eficiência foi introduzido na CF/88 pelo art. 37, caput, por meio da EC 19/1998 (Reforma Administrativa). Na Adm. Pública, a legalidade é mais restrita: o administrador só pode fazer o que a lei expressamente permite. O princípio da impessoalidade veda promoção pessoal, não a publicidade em si.',
   'Múltipla Escolha',
   ARRAY['Princípios da Administração', 'LIMPE'],
   'professor@equestoes.com', NOW()),

  (v_q12, 'DA0002',
   'O ato administrativo que estabelece regras gerais e abstratas, de caráter normativo, expedido pelo Poder Executivo é denominado:',
   'Direito Administrativo', 'Médio', 'FCC', 2024, 'Agente Fiscal',
   'Portaria',
   'Decreto regulamentador',
   'Resolução',
   'Instrução normativa',
   'Despacho',
   'B',
   'O decreto regulamentador (ou regulamento) é o ato administrativo normativo expedido pelo Chefe do Poder Executivo para dar fiel execução às leis (CF/88, art. 84, IV). É o ato normativo de maior hierarquia expedido pelo Executivo. A portaria é ato interno de gestão. A resolução é ato de órgãos colegiados.',
   'Múltipla Escolha',
   ARRAY['Atos Administrativos', 'Espécies de Atos'],
   'professor@equestoes.com', NOW()),

-- ── Informática ───────────────────────────────────────────────
  (v_q13, 'INF0001',
   'Em relação à segurança da informação, o ataque em que o invasor se posiciona entre duas partes comunicantes para interceptar e modificar dados é chamado de:',
   'Informática', 'Médio', 'CESPE', 2024, 'Técnico em TI',
   'Phishing',
   'Ransomware',
   'Man-in-the-Middle (MitM)',
   'SQL Injection',
   'Brute Force',
   'C',
   'O ataque Man-in-the-Middle (MitM) ocorre quando o atacante se interpõe na comunicação entre duas partes, podendo interceptar, ler e modificar os dados trafegados sem que as partes percebam. Phishing é engenharia social. Ransomware sequestra dados. SQL Injection ataca bancos de dados. Brute Force testa senhas exaustivamente.',
   'Múltipla Escolha',
   ARRAY['Segurança da Informação', 'Ataques Cibernéticos'],
   'professor@equestoes.com', NOW()),

  (v_q14, 'INF0002',
   'Sobre planilhas eletrônicas (Microsoft Excel/LibreOffice Calc), a fórmula que calcula a média aritmética dos valores de A1 até A10 é:',
   'Informática', 'Fácil', 'VUNESP', 2024, 'Assistente Administrativo',
   '=SOMA(A1:A10)/10',
   '=MED(A1:A10)',
   '=MÉDIA(A1:A10)',
   '=AVG(A1:A10)',
   '=MEAN(A1:A10)',
   'C',
   'A função correta para calcular a média em português é =MÉDIA(A1:A10). Embora =SOMA(A1:A10)/10 produza o mesmo resultado, não é a função específica de média. =MED calcula a mediana (valor central). =AVG e =MEAN são funções em inglês (não disponíveis em versão em português).',
   'Múltipla Escolha',
   ARRAY['Excel', 'Planilhas', 'Fórmulas'],
   'professor@equestoes.com', NOW()),

  (v_q15, 'INF0003',
   'Em relação às redes de computadores, o protocolo responsável pela resolução de nomes de domínio em endereços IP é:',
   'Informática', 'Médio', 'FGV', 2023, 'Analista de Suporte',
   'DHCP',
   'FTP',
   'DNS',
   'HTTP',
   'SMTP',
   'C',
   'O DNS (Domain Name System) é o protocolo responsável por traduzir (resolver) nomes de domínio legíveis por humanos (como www.equestoes.com) em endereços IP numéricos. DHCP atribui endereços IP automaticamente. FTP é para transferência de arquivos. HTTP é para navegação web. SMTP é para envio de e-mails.',
   'Múltipla Escolha',
   ARRAY['Redes de Computadores', 'Protocolos'],
   'professor@equestoes.com', NOW()),

-- ── Direito Penal ─────────────────────────────────────────────
  (v_q16, 'DP0001',
   'Segundo o Código Penal brasileiro, o crime é CERTO OU ERRADO: "A tentativa é punida com a mesma pena do crime consumado."',
   'Direito Penal', 'Fácil', 'CESPE', 2024, 'Delegado',
   'Certo',
   'Errado',
   NULL, NULL, NULL,
   'B',
   'ERRADO. Conforme o art. 14, parágrafo único do Código Penal, a tentativa é punida com a pena correspondente ao crime consumado, DIMINUÍDA DE UM A DOIS TERÇOS. Apenas nos crimes em que a lei expressamente determina que a tentativa é punida igualmente ao crime consumado é que as penas se equiparam.',
   'Certo ou Errado',
   ARRAY['Tentativa', 'Teoria do Crime'],
   'professor@equestoes.com', NOW()),

  (v_q17, 'DP0002',
   'Sobre a lei penal no tempo, é correto afirmar que a lei penal mais grave:',
   'Direito Penal', 'Médio', 'FCC', 2023, 'Promotor Substituto',
   'Retroage sempre para punir condutas passadas.',
   'Não retroage, salvo para beneficiar o réu.',
   'Pode retroagir com autorização do juiz.',
   'Retroage apenas nos crimes contra a Administração Pública.',
   'Não tem eficácia temporal definida.',
   'B',
   'Princípio da irretroatividade da lei penal mais gravosa (art. 5º, XL da CF/88): a lei penal não retroagirá, SALVO para beneficiar o réu. Portanto, lei mais grave: não retroage. Lei mais branda (novatio legis in mellius): retroage, inclusive para condenados em cumprimento de pena.',
   'Múltipla Escolha',
   ARRAY['Lei Penal no Tempo', 'Retroatividade'],
   'professor@equestoes.com', NOW()),

-- ── Administração Pública ─────────────────────────────────────
  (v_q18, 'ADM0001',
   'O modelo de administração pública que privilegia a eficiência, orientação para resultados e foco no cidadão-cliente é denominado:',
   'Administração Pública', 'Médio', 'CESPE', 2024, 'Analista de Gestão',
   'Administração Patrimonialista',
   'Administração Burocrática',
   'Administração Gerencial (New Public Management)',
   'Administração Taylorista',
   'Administração Weberiana Clássica',
   'C',
   'A Administração Gerencial (New Public Management) surgiu nos anos 1980 como resposta às falhas do modelo burocrático. Seus pilares são: eficiência, orientação para resultados, avaliação por desempenho, descentralização e foco no cidadão como cliente. No Brasil, a Reforma Gerencial de 1995 (Bresser-Pereira) implementou esse modelo.',
   'Múltipla Escolha',
   ARRAY['Modelos de Administração', 'Reforma Administrativa'],
   'professor@equestoes.com', NOW()),

  (v_q19, 'AFO0001',
   'No orçamento público brasileiro, o princípio que determina que as receitas e despesas devem constar integralmente no orçamento, sem deduções, é o princípio da:',
   'Administração Financeira e Orçamentária', 'Difícil', 'CESPE', 2024, 'Auditor-Fiscal',
   'Unidade',
   'Universalidade',
   'Anualidade',
   'Exclusividade',
   'Não afetação',
   'B',
   'O princípio da universalidade (art. 4º da Lei 4.320/64) determina que o orçamento deve conter todas as receitas e despesas, sem qualquer dedução, e que todas as receitas e despesas devem integrar o orçamento (vedado o orçamento paralelo). O princípio da unidade exige que haja um único orçamento.',
   'Múltipla Escolha',
   ARRAY['Princípios Orçamentários', 'Lei 4.320/64'],
   'professor@equestoes.com', NOW()),

  (v_q20, 'ETI0001',
   'A respeito da Lei nº 8.112/1990, que dispõe sobre o regime jurídico dos servidores públicos federais, é correto afirmar que a posse:',
   'Ética e Legislação', 'Médio', 'CESPE', 2024, 'Técnico Federal',
   'Ocorre com a publicação do ato de nomeação no Diário Oficial.',
   'Deve ocorrer no prazo de 30 dias, contados da publicação do ato de nomeação.',
   'Pode ser adiada indefinidamente por conveniência da administração.',
   'Gera estabilidade ao servidor desde o primeiro dia.',
   'Independe de apresentação de documentos.',
   'B',
   'Conforme art. 13 da Lei 8.112/90, a posse ocorrerá no prazo de 30 (trinta) dias contados da publicação do ato de nomeação. Se o servidor não tomar posse no prazo, o ato de nomeação será tornado sem efeito. A estabilidade é adquirida após 3 anos de efetivo exercício.',
   'Múltipla Escolha',
   ARRAY['Lei 8.112/90', 'Servidor Público'],
   'professor@equestoes.com', NOW());

RAISE NOTICE '✅ 20 questões criadas';

-- ─────────────────────────────────────────────────────────────
-- NOTEBOOKS (Cadernos)
-- ─────────────────────────────────────────────────────────────
INSERT INTO notebooks (id, name, description, color, created_by, updated_at)
VALUES
  (v_nb1,
   'Revisão — Língua Portuguesa',
   'Questões de LP para revisar antes da prova',
   'blue',
   'aluno@equestoes.com', NOW()),

  (v_nb2,
   'Errei e Refiz',
   'Questões que errei na primeira tentativa',
   'red',
   'aluno@equestoes.com', NOW());

-- Adicionar questões aos cadernos
INSERT INTO notebook_questions (notebook_id, question_id, added_at)
VALUES
  (v_nb1, v_q1, NOW() - INTERVAL '5 days'),
  (v_nb1, v_q2, NOW() - INTERVAL '5 days'),
  (v_nb1, v_q3, NOW() - INTERVAL '3 days'),
  (v_nb1, v_q4, NOW() - INTERVAL '1 day'),
  (v_nb2, v_q5, NOW() - INTERVAL '4 days'),
  (v_nb2, v_q8, NOW() - INTERVAL '2 days'),
  (v_nb2, v_q13, NOW() - INTERVAL '1 day');

RAISE NOTICE '✅ Cadernos criados';

-- ─────────────────────────────────────────────────────────────
-- TENTATIVAS (Attempts)
-- ─────────────────────────────────────────────────────────────
INSERT INTO attempts (id, question_id, user_id, chosen_answer, is_correct, answered_at, created_by)
VALUES
  -- Língua Portuguesa
  (gen_random_uuid(), v_q1, v_cascas_id, 'A', true,  NOW() - INTERVAL '10 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q2, v_cascas_id, 'C', true,  NOW() - INTERVAL '10 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q3, v_cascas_id, 'E', true,  NOW() - INTERVAL '9 days',  'aluno@equestoes.com'),
  (gen_random_uuid(), v_q4, v_cascas_id, 'B', false, NOW() - INTERVAL '9 days',  'aluno@equestoes.com'),

  -- Matemática
  (gen_random_uuid(), v_q5, v_cascas_id, 'B', true,  NOW() - INTERVAL '8 days',  'aluno@equestoes.com'),
  (gen_random_uuid(), v_q6, v_cascas_id, 'A', false, NOW() - INTERVAL '8 days',  'aluno@equestoes.com'),
  (gen_random_uuid(), v_q7, v_cascas_id, 'A', true,  NOW() - INTERVAL '7 days',  'aluno@equestoes.com'),

  -- Direito Constitucional
  (gen_random_uuid(), v_q8,  v_cascas_id, 'B', true,  NOW() - INTERVAL '6 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q9,  v_cascas_id, 'A', false, NOW() - INTERVAL '6 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q10, v_cascas_id, 'A', true,  NOW() - INTERVAL '5 days', 'aluno@equestoes.com'),

  -- Direito Administrativo
  (gen_random_uuid(), v_q11, v_cascas_id, 'A', true,  NOW() - INTERVAL '4 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q12, v_cascas_id, 'B', true,  NOW() - INTERVAL '4 days', 'aluno@equestoes.com'),

  -- Informática
  (gen_random_uuid(), v_q13, v_cascas_id, 'A', false, NOW() - INTERVAL '3 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q14, v_cascas_id, 'C', true,  NOW() - INTERVAL '3 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q15, v_cascas_id, 'C', true,  NOW() - INTERVAL '2 days', 'aluno@equestoes.com'),

  -- Direito Penal
  (gen_random_uuid(), v_q16, v_cascas_id, 'B', true,  NOW() - INTERVAL '2 days', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q17, v_cascas_id, 'B', true,  NOW() - INTERVAL '1 day',  'aluno@equestoes.com'),

  -- Hoje
  (gen_random_uuid(), v_q18, v_cascas_id, 'C', true,  NOW() - INTERVAL '2 hours', 'aluno@equestoes.com'),
  (gen_random_uuid(), v_q19, v_cascas_id, 'A', false, NOW() - INTERVAL '1 hour',  'aluno@equestoes.com'),
  (gen_random_uuid(), v_q20, v_cascas_id, 'B', true,  NOW() - INTERVAL '30 minutes', 'aluno@equestoes.com'),

  -- Tentativas do aluno do Pedrão (apenas Língua Portuguesa)
  (gen_random_uuid(), v_q1, v_pedrao_id, 'A', true,  NOW() - INTERVAL '3 days', 'aluno.pedrao@equestoes.com'),
  (gen_random_uuid(), v_q2, v_pedrao_id, 'A', false, NOW() - INTERVAL '3 days', 'aluno.pedrao@equestoes.com'),
  (gen_random_uuid(), v_q3, v_pedrao_id, 'E', true,  NOW() - INTERVAL '2 days', 'aluno.pedrao@equestoes.com');

RAISE NOTICE '✅ Tentativas criadas (20 do aluno Cascas + 3 do aluno Pedrão)';

-- ─────────────────────────────────────────────────────────────
-- COMENTÁRIOS
-- ─────────────────────────────────────────────────────────────
INSERT INTO comments (id, question_id, user_id, text, author_name, author_role)
VALUES
  (gen_random_uuid(), v_q1, v_cascas_id,
   'Ótima questão! A pegadinha da alternativa B é clássica do CESPE — usar crase antes de substantivo que não admite artigo.',
   'Ana Paula Ferreira', 'Aluno Clube dos Cascas'),

  (gen_random_uuid(), v_q1, v_professor_id,
   'Excelente observação, Ana! Lembrem-se: para usar crase, precisamos da preposição "a" + artigo "a" ou pronome demonstrativo "aquele/aquela/aquilo". Testem substituindo pelo masculino — se aparecer "ao", é crase.',
   'Prof. Carlos Mendes', 'Professor'),

  (gen_random_uuid(), v_q5, v_cascas_id,
   'Quase errei essa! É uma armadilha muito comum pensar que 20% de aumento + 20% de desconto resultam no valor original.',
   'Ana Paula Ferreira', 'Aluno Clube dos Cascas'),

  (gen_random_uuid(), v_q8, v_professor_id,
   'Questão muito cobrada em provas de Analista Jurídico. Dominem os remédios constitucionais: HC, MS, MI, HD e AP. Cada um tem seu objeto específico!',
   'Prof. Carlos Mendes', 'Professor'),

  (gen_random_uuid(), v_q13, v_cascas_id,
   'Confundi MitM com Phishing inicialmente. A diferença é que o Phishing engana o usuário para que ele entregue suas credenciais voluntariamente.',
   'Ana Paula Ferreira', 'Aluno Clube dos Cascas');

RAISE NOTICE '✅ Comentários criados';

-- ─────────────────────────────────────────────────────────────
-- REPORTS DE QUESTÕES
-- ─────────────────────────────────────────────────────────────
INSERT INTO question_reports (id, question_id, user_id, reason, status, updated_at)
VALUES
  (gen_random_uuid(), v_q6, v_cascas_id,
   'Acredito que a questão tem um erro no enunciado — faltou especificar se a PA é crescente ou decrescente.',
   'pending', NOW());

RAISE NOTICE '✅ Report de questão criado';

-- ─────────────────────────────────────────────────────────────
-- FLASHCARDS
-- ─────────────────────────────────────────────────────────────

-- Flashcards Globais (criados pelo admin)
INSERT INTO flashcards (id, front, back, discipline, subjects, is_global, created_by, updated_at)
VALUES
  (v_fc1,
   'O que é o princípio da legalidade na Administração Pública?',
   'Na Adm. Pública, o administrador só pode fazer o que a lei expressamente PERMITE (diferente do direito privado, onde tudo que não é proibido é permitido). Base: art. 37, caput da CF/88.',
   'Direito Administrativo',
   ARRAY['Princípios da Administração', 'LIMPE'],
   true, v_admin_id, NOW()),

  (v_fc2,
   'Qual a diferença entre crime doloso e culposo?',
   'DOLOSO: agente quis o resultado (dolo direto) ou assumiu o risco de produzi-lo (dolo eventual). CULPOSO: agente não quis o resultado, mas agiu com imprudência, negligência ou imperícia. CP, art. 18.',
   'Direito Penal',
   ARRAY['Elementos do Crime', 'Culpabilidade'],
   true, v_admin_id, NOW()),

  (v_fc3,
   'O que é crase e quando usar?',
   'Crase é a fusão da preposição "a" com o artigo definido feminino "a" ou com os pronomes demonstrativos "aquele(s)", "aquela(s)", "aquilo". Use quando: há preposição "a" obrigatória + palavra feminina que admite artigo definido "a".',
   'Língua Portuguesa',
   ARRAY['Crase', 'Regência'],
   true, v_admin_id, NOW()),

  (v_fc4,
   'Quais são as cláusulas pétreas da CF/88?',
   'Art. 60, §4º da CF/88 — não podem ser abolidas por emenda: I) forma federativa de Estado; II) voto direto, secreto, universal e periódico; III) separação dos Poderes; IV) direitos e garantias individuais.',
   'Direito Constitucional',
   ARRAY['Emenda Constitucional', 'Cláusulas Pétreas'],
   true, v_admin_id, NOW()),

  (v_fc5,
   'O que é o habeas corpus?',
   'Remédio constitucional (CF/88, art. 5º, LXVIII) que protege a LIBERDADE DE LOCOMOÇÃO. Cabe quando alguém sofrer ou se achar AMEAÇADO de sofrer violência ou coação em sua liberdade de ir, vir e permanecer.',
   'Direito Constitucional',
   ARRAY['Remédios Constitucionais', 'Direitos Fundamentais'],
   true, v_admin_id, NOW()),

  (v_fc6,
   'Qual a fórmula da probabilidade clássica?',
   'P(A) = n(A) / n(Ω), onde: P(A) = probabilidade do evento A, n(A) = número de casos favoráveis, n(Ω) = número total de casos possíveis (espaço amostral). A probabilidade sempre está entre 0 e 1.',
   'Matemática e Raciocínio Lógico',
   ARRAY['Probabilidade', 'Combinatória'],
   true, v_admin_id, NOW()),

-- Flashcards Pessoais da Ana (aluno Cascas)
  (v_fc7,
   'Como identificar o verbo "haver" impessoal?',
   'O verbo "haver" é impessoal (fica no singular) quando tem sentido de EXISTIR ("Havia muitas pessoas") ou OCORRER ("Houve um problema"). Não deve ser flexionado: ERRADO = "Haviam pessoas", CERTO = "Havia pessoas".',
   'Língua Portuguesa',
   ARRAY['Concordância Verbal', 'Verbos Impessoais'],
   false, v_cascas_id, NOW()),

  (v_fc8,
   'Diferença entre Progressão Aritmética (PA) e Geométrica (PG)',
   'PA: cada termo é obtido somando uma RAZÃO (r) constante ao anterior. Fórmula: aₙ = a₁ + (n-1)r. | PG: cada termo é obtido multiplicando o anterior por uma RAZÃO (q) constante. Fórmula: aₙ = a₁ × q^(n-1).',
   'Matemática e Raciocínio Lógico',
   ARRAY['Progressão Aritmética', 'Progressão Geométrica'],
   false, v_cascas_id, NOW());

RAISE NOTICE '✅ Flashcards criados (6 globais + 2 pessoais)';

-- ─────────────────────────────────────────────────────────────
-- REVISÕES DE FLASHCARDS (SM-2 — dados de progresso do aluno)
-- ─────────────────────────────────────────────────────────────
INSERT INTO flashcard_reviews (id, flashcard_id, user_id, quality,
  ease_factor, interval, repetitions, due_date, reviewed_at)
VALUES
  -- fc1: já revisado, fácil — próxima revisão em 6 dias
  (gen_random_uuid(), v_fc1, v_cascas_id, 5,
   2.6, 6, 2,
   (NOW() + INTERVAL '6 days'),
   (NOW() - INTERVAL '1 day')),

  -- fc2: revisado com dificuldade — revisar amanhã
  (gen_random_uuid(), v_fc2, v_cascas_id, 3,
   2.36, 1, 1,
   (NOW() + INTERVAL '1 day'),
   (NOW() - INTERVAL '2 hours')),

  -- fc3: errou — revisar hoje ainda
  (gen_random_uuid(), v_fc3, v_cascas_id, 0,
   2.18, 1, 0,
   NOW(),
   (NOW() - INTERVAL '30 minutes')),

  -- fc4: revisado bem — próxima revisão em 3 dias
  (gen_random_uuid(), v_fc4, v_cascas_id, 4,
   2.5, 3, 1,
   (NOW() + INTERVAL '3 days'),
   (NOW() - INTERVAL '3 days')),

  -- fc7 (pessoal): revisado — próxima revisão amanhã
  (gen_random_uuid(), v_fc7, v_cascas_id, 4,
   2.5, 1, 1,
   (NOW() + INTERVAL '1 day'),
   (NOW() - INTERVAL '1 day'));

RAISE NOTICE '✅ Revisões de flashcards criadas (SM-2)';

RAISE NOTICE '';
RAISE NOTICE '🎉 === SEED CONCLUÍDO COM SUCESSO === 🎉';
RAISE NOTICE '';
RAISE NOTICE '📋 CREDENCIAIS DE ACESSO:';
RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
RAISE NOTICE 'Admin:';
RAISE NOTICE '  Email : admin@equestoes.com';
RAISE NOTICE '  Senha : Admin@123';
RAISE NOTICE '  Acesso: Total (admin + tutor IA + criar questões)';
RAISE NOTICE '';
RAISE NOTICE 'Professor:';
RAISE NOTICE '  Email : professor@equestoes.com';
RAISE NOTICE '  Senha : Prof@123';
RAISE NOTICE '  Acesso: Criar/Revisar questões + E-Tutory';
RAISE NOTICE '';
RAISE NOTICE 'Aluno Cascas (acesso total):';
RAISE NOTICE '  Email : aluno@equestoes.com';
RAISE NOTICE '  Senha : Aluno@123';
RAISE NOTICE '  Acesso: Todas as disciplinas + E-Tutory';
RAISE NOTICE '';
RAISE NOTICE 'Aluno Pedrão (acesso básico):';
RAISE NOTICE '  Email : aluno.pedrao@equestoes.com';
RAISE NOTICE '  Senha : Aluno@123';
RAISE NOTICE '  Acesso: Apenas Língua Portuguesa';
RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
RAISE NOTICE '';
RAISE NOTICE '📊 DADOS CRIADOS:';
RAISE NOTICE '  4 usuários, 2 assinaturas ativas';
RAISE NOTICE '  20 questões (LP, MAT, DC, DA, INF, DP, ADM, AFO, ETI)';
RAISE NOTICE '  2 cadernos com 7 questões adicionadas';
RAISE NOTICE '  23 tentativas de resposta';
RAISE NOTICE '  5 comentários em questões';
RAISE NOTICE '  1 report de questão pendente';
RAISE NOTICE '  8 flashcards (6 globais + 2 pessoais)';
RAISE NOTICE '  5 revisões SM-2 registradas';

END $$;

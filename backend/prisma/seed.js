// ============================================================
// seed.js — E-Questões
// Popula o banco de dados com dados de teste completos
// Executar: npm run prisma:seed
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Iniciando seed do banco E-Questões...\n');

  // ── USUÁRIOS ────────────────────────────────────────────────
  const [adminHash, profHash, alunoHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('Prof@123', 10),
    bcrypt.hash('Aluno@123', 10),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@equestoes.com' },
    update: { password_hash: adminHash },
    create: {
      email: 'admin@equestoes.com',
      password_hash: adminHash,
      full_name: 'Administrador E-Questões',
      role: 'admin',
      subscription_type: 'Professor',
      subscription_status: 'active',
      subscription_active: true,
      membership_status: 'active',
      membership_active: true,
      membership_plan: 'Admin',
      first_login: false,
      study_streak: 15,
      last_study_date: new Date().toISOString().split('T')[0],
    },
  });

  const professor = await prisma.user.upsert({
    where: { email: 'professor@equestoes.com' },
    update: { password_hash: profHash },
    create: {
      email: 'professor@equestoes.com',
      password_hash: profHash,
      full_name: 'Prof. Carlos Mendes',
      role: 'user',
      subscription_type: 'Professor',
      subscription_status: 'active',
      subscription_active: true,
      membership_status: 'active',
      membership_active: true,
      membership_plan: 'Professor',
      first_login: false,
      study_streak: 7,
      last_study_date: new Date().toISOString().split('T')[0],
    },
  });

  const alunoCascas = await prisma.user.upsert({
    where: { email: 'aluno@equestoes.com' },
    update: { password_hash: alunoHash },
    create: {
      email: 'aluno@equestoes.com',
      password_hash: alunoHash,
      full_name: 'Ana Paula Ferreira',
      role: 'user',
      subscription_type: 'Aluno Eleva',
      subscription_status: 'active',
      subscription_active: true,
      membership_status: 'active',
      membership_active: true,
      membership_plan: 'Aluno Eleva',
      first_login: false,
      study_streak: 12,
      last_study_date: new Date().toISOString().split('T')[0],
    },
  });

  const alunoPedrao = await prisma.user.upsert({
    where: { email: 'aluno.pedrao@equestoes.com' },
    update: { password_hash: alunoHash },
    create: {
      email: 'aluno.pedrao@equestoes.com',
      password_hash: alunoHash,
      full_name: 'Bruno Oliveira',
      role: 'user',
      subscription_type: 'Aluno Eleva',
      subscription_status: 'active',
      subscription_active: true,
      membership_status: 'active',
      membership_active: true,
      membership_plan: 'Aluno Eleva',
      first_login: false,
      study_streak: 3,
      last_study_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    },
  });

  console.log('✅ Usuários criados:', admin.email, '|', professor.email, '|', alunoCascas.email, '|', alunoPedrao.email);

  // ── ASSINATURAS ─────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { woo_subscription_id: 'WC-1001' },
    update: {},
    create: {
      user_id: alunoCascas.id,
      status: 'active',
      subscription_type: 'Aluno Eleva',
      woo_subscription_id: 'WC-1001',
      started_at: new Date(Date.now() - 30 * 86400000),
      expires_at: new Date(Date.now() + 335 * 86400000),
    },
  });

  await prisma.subscription.upsert({
    where: { woo_subscription_id: 'WC-1002' },
    update: {},
    create: {
      user_id: alunoPedrao.id,
      status: 'active',
      subscription_type: 'Aluno Eleva',
      woo_subscription_id: 'WC-1002',
      started_at: new Date(Date.now() - 15 * 86400000),
      expires_at: new Date(Date.now() + 350 * 86400000),
    },
  });

  console.log('✅ Assinaturas criadas');

  // ── QUESTÕES ────────────────────────────────────────────────
  const questionsData = [
    // Língua Portuguesa
    {
      code: 'LP0001', discipline: 'Língua Portuguesa', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Analista Judiciário',
      text: 'Assinale a alternativa em que o uso da crase está CORRETO:',
      option_a: 'Fui à casa da minha avó.',
      option_b: 'Refiro-me à pessoas honestas.',
      option_c: 'Cheguei à duas horas.',
      option_d: 'Vou à pé ao trabalho.',
      option_e: 'Assisti à o filme ontem.',
      correct_answer: 'A',
      explanation: 'A alternativa A está correta. Usa-se crase antes de substantivo feminino precedido de preposição "a" + artigo "a". B) "pessoas" não admite artigo. C) horas no sentido de tempo decorrido não admite crase. D) Artigo masculino não admite crase. E) Pleonasmo.',
      question_type: 'Múltipla Escolha',
      subjects: ['Crase', 'Regência Verbal'],
    },
    {
      code: 'LP0002', discipline: 'Língua Portuguesa', difficulty: 'Fácil',
      exam_board: 'FCC', year: 2024, position: 'Técnico Administrativo',
      text: 'Qual das alternativas apresenta concordância verbal CORRETA?',
      option_a: 'Houveram muitos problemas na reunião.',
      option_b: 'Fazem dois anos que nos conhecemos.',
      option_c: 'Deve haver soluções para o problema.',
      option_d: 'Haviam muitas pessoas na fila.',
      option_e: 'Podem haver dúvidas sobre o assunto.',
      correct_answer: 'C',
      explanation: 'O verbo "haver" no sentido de "existir" é impessoal e deve ficar na 3ª pessoa do singular. "Deve haver" está correto.',
      question_type: 'Múltipla Escolha',
      subjects: ['Concordância Verbal', 'Verbos Impessoais'],
    },
    {
      code: 'LP0003', discipline: 'Língua Portuguesa', difficulty: 'Difícil',
      exam_board: 'VUNESP', year: 2023, position: 'Escrevente',
      text: 'Em relação à pontuação, assinale a alternativa INCORRETA:',
      option_a: 'O ponto-e-vírgula separa orações de período composto por coordenação.',
      option_b: 'A vírgula deve ser usada para separar o vocativo.',
      option_c: 'Os dois-pontos introduzem citação direta ou explicação.',
      option_d: 'O travessão indica a fala de personagens em discurso direto.',
      option_e: 'A vírgula separa o sujeito de seu predicado em qualquer situação.',
      correct_answer: 'E',
      explanation: 'A alternativa E está INCORRETA. A vírgula NÃO deve separar o sujeito de seu predicado. As demais descrevem usos corretos dos sinais de pontuação.',
      question_type: 'Múltipla Escolha',
      subjects: ['Pontuação', 'Vírgula'],
    },
    {
      code: 'LP0004', discipline: 'Língua Portuguesa', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Analista Legislativo',
      text: 'A respeito dos pronomes relativos, assinale a alternativa correta:',
      option_a: '"Que" é o pronome relativo de maior abrangência e pode substituir qualquer antecedente.',
      option_b: '"Cujo" concorda com o antecedente em gênero e número.',
      option_c: '"Onde" refere-se exclusivamente a lugar com ideia de movimento.',
      option_d: '"Quem" pode ser usado para se referir a coisas inanimadas.',
      option_e: '"Que" pode ser substituído por "cujo" em qualquer contexto.',
      correct_answer: 'A',
      explanation: '"Que" é o pronome relativo de maior abrangência, podendo se referir a pessoas, animais ou coisas. "Cujo" concorda com o SUBSEQUENTE (não com o antecedente). "Onde" tem ideia de permanência. "Quem" refere-se apenas a seres animados.',
      question_type: 'Múltipla Escolha',
      subjects: ['Pronomes Relativos', 'Classes de Palavras'],
    },
    // Matemática
    {
      code: 'MAT0001', discipline: 'Matemática e Raciocínio Lógico', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Técnico Bancário',
      text: 'Um produto custava R$ 200,00 e teve aumento de 20%. Depois sofreu desconto de 20%. Qual o preço final?',
      option_a: 'R$ 200,00', option_b: 'R$ 192,00', option_c: 'R$ 208,00',
      option_d: 'R$ 216,00', option_e: 'R$ 184,00',
      correct_answer: 'B',
      explanation: 'R$ 200,00 × 1,20 = R$ 240,00. R$ 240,00 × 0,80 = R$ 192,00. Aumentar e descontar o mesmo percentual não resulta no valor original.',
      question_type: 'Múltipla Escolha',
      subjects: ['Porcentagem', 'Matemática Básica'],
    },
    {
      code: 'MAT0002', discipline: 'Matemática e Raciocínio Lógico', difficulty: 'Fácil',
      exam_board: 'FGV', year: 2023, position: 'Analista',
      text: 'Se em uma PA os termos a₁ = 3 e a₅ = 11, qual é a razão?',
      option_a: '1', option_b: '2', option_c: '3', option_d: '4', option_e: '8',
      correct_answer: 'B',
      explanation: 'a₅ = a₁ + 4r → 11 = 3 + 4r → r = 2.',
      question_type: 'Múltipla Escolha',
      subjects: ['Progressão Aritmética', 'Álgebra'],
    },
    {
      code: 'MAT0003', discipline: 'Matemática e Raciocínio Lógico', difficulty: 'Fácil',
      exam_board: 'VUNESP', year: 2024, position: 'Técnico',
      text: 'Uma urna tem 4 bolas vermelhas e 6 azuis. Qual a probabilidade de sair vermelha?',
      option_a: '2/5', option_b: '3/5', option_c: '1/4', option_d: '1/3', option_e: '3/4',
      correct_answer: 'A',
      explanation: 'P = 4/10 = 2/5.',
      question_type: 'Múltipla Escolha',
      subjects: ['Probabilidade', 'Combinatória'],
    },
    // Direito Constitucional
    {
      code: 'DC0001', discipline: 'Direito Constitucional', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Analista Jurídico',
      text: 'Sobre os direitos fundamentais da CF/88, é correto afirmar:',
      option_a: 'Os direitos fundamentais são absolutos e não admitem restrição.',
      option_b: 'O habeas corpus protege a liberdade de locomoção ameaçada ou coagida.',
      option_c: 'O mandado de segurança protege direito líquido e certo contra ato de particular.',
      option_d: 'O habeas data serve para impugnar decisões judiciais ilegais.',
      option_e: 'O mandado de injunção torna efetiva norma de eficácia plena.',
      correct_answer: 'B',
      explanation: 'O habeas corpus protege a liberdade de locomoção (CF/88, art. 5º, LXVIII). Os direitos não são absolutos. O MS protege contra ato de autoridade pública.',
      question_type: 'Múltipla Escolha',
      subjects: ['Direitos Fundamentais', 'Remédios Constitucionais'],
    },
    {
      code: 'DC0002', discipline: 'Direito Constitucional', difficulty: 'Difícil',
      exam_board: 'FGV', year: 2023, position: 'Defensor Público',
      text: 'De acordo com a CF/88, o processo de emenda constitucional:',
      option_a: 'Pode ser proposto por qualquer cidadão.',
      option_b: 'Requer aprovação por maioria simples em dois turnos.',
      option_c: 'Não pode ser objeto de deliberação em estado de sítio.',
      option_d: 'Deve ser promulgado pelo Presidente da República.',
      option_e: 'Permite abolir o voto direto mediante PEC aprovada por 2/3.',
      correct_answer: 'C',
      explanation: 'Art. 60, §1º da CF/88: a CF não pode ser emendada em estado de sítio, defesa ou intervenção federal. A PEC exige 3/5 dos membros em dois turnos.',
      question_type: 'Múltipla Escolha',
      subjects: ['Emenda Constitucional', 'Processo Legislativo'],
    },
    {
      code: 'DC0003', discipline: 'Direito Constitucional', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Auditor Federal',
      text: 'Em relação à organização do Estado brasileiro, é CORRETO afirmar:',
      option_a: 'O Brasil adota forma de governo republicana e sistema presidencialista.',
      option_b: 'O Brasil adota forma de Estado unitária.',
      option_c: 'A soberania popular é exercida exclusivamente pelo voto.',
      option_d: 'Os Municípios não integram a Federação.',
      option_e: 'O Estado federal brasileiro é de dois níveis: União e Estados.',
      correct_answer: 'A',
      explanation: 'O Brasil adota: Forma de Governo Republicana e Sistema Presidencialista. A Federação é de três níveis: União, Estados/DF e Municípios.',
      question_type: 'Múltipla Escolha',
      subjects: ['Organização do Estado', 'Federalismo'],
    },
    // Direito Administrativo
    {
      code: 'DA0001', discipline: 'Direito Administrativo', difficulty: 'Fácil',
      exam_board: 'CESPE', year: 2024, position: 'Analista Administrativo',
      text: 'Sobre os princípios da Administração Pública, assinale a CORRETA:',
      option_a: 'O princípio da eficiência foi incluído na CF/88 pela Emenda nº 19/1998.',
      option_b: 'O princípio da legalidade é idêntico ao do direito privado.',
      option_c: 'O princípio da impessoalidade proíbe qualquer publicidade.',
      option_d: 'O princípio da moralidade exige que os atos sejam apenas legais.',
      option_e: 'O princípio da publicidade garante que todos os atos sejam sigilosos.',
      correct_answer: 'A',
      explanation: 'O princípio da eficiência foi introduzido pela EC 19/1998 (art. 37, caput da CF/88).',
      question_type: 'Múltipla Escolha',
      subjects: ['Princípios da Administração', 'LIMPE'],
    },
    {
      code: 'DA0002', discipline: 'Direito Administrativo', difficulty: 'Médio',
      exam_board: 'FCC', year: 2024, position: 'Agente Fiscal',
      text: 'O ato normativo de maior hierarquia expedido pelo Poder Executivo é:',
      option_a: 'Portaria', option_b: 'Decreto regulamentador', option_c: 'Resolução',
      option_d: 'Instrução normativa', option_e: 'Despacho',
      correct_answer: 'B',
      explanation: 'O decreto regulamentador é expedido pelo Chefe do Poder Executivo para fiel execução das leis (CF/88, art. 84, IV).',
      question_type: 'Múltipla Escolha',
      subjects: ['Atos Administrativos', 'Espécies de Atos'],
    },
    // Informática
    {
      code: 'INF0001', discipline: 'Informática', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Técnico em TI',
      text: 'O ataque em que o invasor se posiciona entre duas partes comunicantes para interceptar e modificar dados é:',
      option_a: 'Phishing', option_b: 'Ransomware', option_c: 'Man-in-the-Middle (MitM)',
      option_d: 'SQL Injection', option_e: 'Brute Force',
      correct_answer: 'C',
      explanation: 'O Man-in-the-Middle (MitM) intercepta a comunicação entre duas partes. Phishing é engenharia social. Ransomware sequestra dados. SQL Injection ataca bancos de dados.',
      question_type: 'Múltipla Escolha',
      subjects: ['Segurança da Informação', 'Ataques Cibernéticos'],
    },
    {
      code: 'INF0002', discipline: 'Informática', difficulty: 'Fácil',
      exam_board: 'VUNESP', year: 2024, position: 'Assistente Administrativo',
      text: 'A fórmula para calcular a média aritmética dos valores de A1 a A10 no Excel/Calc é:',
      option_a: '=SOMA(A1:A10)/10', option_b: '=MED(A1:A10)', option_c: '=MÉDIA(A1:A10)',
      option_d: '=AVG(A1:A10)', option_e: '=MEAN(A1:A10)',
      correct_answer: 'C',
      explanation: 'A função =MÉDIA(A1:A10) calcula a média. =MED calcula a mediana. =AVG e =MEAN são funções em inglês.',
      question_type: 'Múltipla Escolha',
      subjects: ['Excel', 'Planilhas'],
    },
    {
      code: 'INF0003', discipline: 'Informática', difficulty: 'Médio',
      exam_board: 'FGV', year: 2023, position: 'Analista de Suporte',
      text: 'O protocolo responsável pela resolução de nomes de domínio em endereços IP é:',
      option_a: 'DHCP', option_b: 'FTP', option_c: 'DNS', option_d: 'HTTP', option_e: 'SMTP',
      correct_answer: 'C',
      explanation: 'O DNS (Domain Name System) traduz nomes de domínio em endereços IP.',
      question_type: 'Múltipla Escolha',
      subjects: ['Redes de Computadores', 'Protocolos'],
    },
    // Direito Penal
    {
      code: 'DP0001', discipline: 'Direito Penal', difficulty: 'Fácil',
      exam_board: 'CESPE', year: 2024, position: 'Delegado',
      text: 'A tentativa é punida com a mesma pena do crime consumado. CERTO ou ERRADO?',
      option_a: 'Certo', option_b: 'Errado', option_c: null, option_d: null, option_e: null,
      correct_answer: 'B',
      explanation: 'ERRADO. A tentativa é punida com a pena do crime consumado DIMINUÍDA DE UM A DOIS TERÇOS (CP, art. 14, parágrafo único).',
      question_type: 'Certo ou Errado',
      subjects: ['Tentativa', 'Teoria do Crime'],
    },
    {
      code: 'DP0002', discipline: 'Direito Penal', difficulty: 'Médio',
      exam_board: 'FCC', year: 2023, position: 'Promotor Substituto',
      text: 'Sobre a lei penal no tempo, a lei penal mais grave:',
      option_a: 'Retroage sempre para punir condutas passadas.',
      option_b: 'Não retroage, salvo para beneficiar o réu.',
      option_c: 'Pode retroagir com autorização do juiz.',
      option_d: 'Retroage apenas nos crimes contra a Administração Pública.',
      option_e: 'Não tem eficácia temporal definida.',
      correct_answer: 'B',
      explanation: 'Art. 5º, XL da CF/88: a lei penal não retroagirá, SALVO para beneficiar o réu. Lei mais grave não retroage; lei mais branda retroage inclusive para condenados.',
      question_type: 'Múltipla Escolha',
      subjects: ['Lei Penal no Tempo', 'Retroatividade'],
    },
    // Administração Pública
    {
      code: 'ADM0001', discipline: 'Administração Pública', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Analista de Gestão',
      text: 'O modelo de administração pública que privilegia eficiência, orientação para resultados e foco no cidadão-cliente é:',
      option_a: 'Administração Patrimonialista',
      option_b: 'Administração Burocrática',
      option_c: 'Administração Gerencial (New Public Management)',
      option_d: 'Administração Taylorista',
      option_e: 'Administração Weberiana Clássica',
      correct_answer: 'C',
      explanation: 'A Administração Gerencial (New Public Management) surgiu nos anos 1980. No Brasil, a Reforma Gerencial de 1995 (Bresser-Pereira) a implementou.',
      question_type: 'Múltipla Escolha',
      subjects: ['Modelos de Administração', 'Reforma Administrativa'],
    },
    {
      code: 'AFO0001', discipline: 'Administração Financeira e Orçamentária', difficulty: 'Difícil',
      exam_board: 'CESPE', year: 2024, position: 'Auditor-Fiscal',
      text: 'O princípio orçamentário que determina que as receitas e despesas devem constar integralmente no orçamento, sem deduções, é o princípio da:',
      option_a: 'Unidade', option_b: 'Universalidade', option_c: 'Anualidade',
      option_d: 'Exclusividade', option_e: 'Não afetação',
      correct_answer: 'B',
      explanation: 'O princípio da universalidade (art. 4º da Lei 4.320/64) determina que o orçamento deve conter TODAS as receitas e despesas sem dedução.',
      question_type: 'Múltipla Escolha',
      subjects: ['Princípios Orçamentários', 'Lei 4.320/64'],
    },
    {
      code: 'ETI0001', discipline: 'Ética e Legislação', difficulty: 'Médio',
      exam_board: 'CESPE', year: 2024, position: 'Técnico Federal',
      text: 'De acordo com a Lei nº 8.112/1990, a posse do servidor federal:',
      option_a: 'Ocorre com a publicação do ato de nomeação no Diário Oficial.',
      option_b: 'Deve ocorrer no prazo de 30 dias, contados da publicação da nomeação.',
      option_c: 'Pode ser adiada indefinidamente por conveniência da administração.',
      option_d: 'Gera estabilidade ao servidor desde o primeiro dia.',
      option_e: 'Independe de apresentação de documentos.',
      correct_answer: 'B',
      explanation: 'Art. 13 da Lei 8.112/90: a posse ocorrerá no prazo de 30 dias contados da publicação do ato de nomeação. A estabilidade é adquirida após 3 anos.',
      question_type: 'Múltipla Escolha',
      subjects: ['Lei 8.112/90', 'Servidor Público'],
    },
  ];

  const questions = [];
  for (const q of questionsData) {
    // Evita duplicatas por código
    const existing = await prisma.question.findUnique({ where: { code: q.code } });
    if (!existing) {
      const created = await prisma.question.create({
        data: { ...q, created_by: professor.email },
      });
      questions.push(created);
    } else {
      questions.push(existing);
    }
  }

  console.log(`✅ ${questions.length} questões criadas/verificadas`);

  // ── CADERNOS ────────────────────────────────────────────────
  const nb1 = await prisma.notebook.create({
    data: {
      name: 'Revisão — Língua Portuguesa',
      description: 'Questões de LP para revisar antes da prova',
      color: 'blue',
      created_by: alunoCascas.email,
      questions: {
        create: questions
          .filter(q => q.discipline === 'Língua Portuguesa')
          .map(q => ({ question_id: q.id })),
      },
    },
  });

  const nb2 = await prisma.notebook.create({
    data: {
      name: 'Errei e Refiz',
      description: 'Questões que errei na primeira tentativa',
      color: 'red',
      created_by: alunoCascas.email,
      questions: {
        create: [
          { question_id: questions.find(q => q.code === 'MAT0001').id },
          { question_id: questions.find(q => q.code === 'DC0001').id },
          { question_id: questions.find(q => q.code === 'INF0001').id },
        ],
      },
    },
  });

  console.log('✅ Cadernos criados:', nb1.name, '|', nb2.name);

  // ── TENTATIVAS ──────────────────────────────────────────────
  const attemptsData = [
    // Ana (aluno Cascas) — últimas 2 semanas
    { code: 'LP0001', answer: 'A', correct: true, daysAgo: 10 },
    { code: 'LP0002', answer: 'C', correct: true, daysAgo: 10 },
    { code: 'LP0003', answer: 'E', correct: true, daysAgo: 9 },
    { code: 'LP0004', answer: 'B', correct: false, daysAgo: 9 },
    { code: 'MAT0001', answer: 'B', correct: true, daysAgo: 8 },
    { code: 'MAT0002', answer: 'A', correct: false, daysAgo: 8 },
    { code: 'MAT0003', answer: 'A', correct: true, daysAgo: 7 },
    { code: 'DC0001', answer: 'B', correct: true, daysAgo: 6 },
    { code: 'DC0002', answer: 'A', correct: false, daysAgo: 6 },
    { code: 'DC0003', answer: 'A', correct: true, daysAgo: 5 },
    { code: 'DA0001', answer: 'A', correct: true, daysAgo: 4 },
    { code: 'DA0002', answer: 'B', correct: true, daysAgo: 4 },
    { code: 'INF0001', answer: 'A', correct: false, daysAgo: 3 },
    { code: 'INF0002', answer: 'C', correct: true, daysAgo: 3 },
    { code: 'INF0003', answer: 'C', correct: true, daysAgo: 2 },
    { code: 'DP0001', answer: 'B', correct: true, daysAgo: 2 },
    { code: 'DP0002', answer: 'B', correct: true, daysAgo: 1 },
    { code: 'ADM0001', answer: 'C', correct: true, daysAgo: 0.1 },
    { code: 'AFO0001', answer: 'A', correct: false, daysAgo: 0.05 },
    { code: 'ETI0001', answer: 'B', correct: true, daysAgo: 0.02 },
  ];

  for (const a of attemptsData) {
    const q = questions.find(q => q.code === a.code);
    if (!q) continue;
    await prisma.attempt.create({
      data: {
        question_id: q.id,
        user_id: alunoCascas.id,
        chosen_answer: a.answer,
        is_correct: a.correct,
        answered_at: new Date(Date.now() - a.daysAgo * 86400000),
        created_by: alunoCascas.email,
      },
    });
  }

  // Bruno (aluno Pedrão) — apenas LP
  for (const a of [
    { code: 'LP0001', answer: 'A', correct: true, daysAgo: 3 },
    { code: 'LP0002', answer: 'A', correct: false, daysAgo: 3 },
    { code: 'LP0003', answer: 'E', correct: true, daysAgo: 2 },
  ]) {
    const q = questions.find(q => q.code === a.code);
    if (!q) continue;
    await prisma.attempt.create({
      data: {
        question_id: q.id,
        user_id: alunoPedrao.id,
        chosen_answer: a.answer,
        is_correct: a.correct,
        answered_at: new Date(Date.now() - a.daysAgo * 86400000),
        created_by: alunoPedrao.email,
      },
    });
  }

  console.log('✅ Tentativas criadas');

  // ── COMENTÁRIOS ─────────────────────────────────────────────
  const q1 = questions.find(q => q.code === 'LP0001');
  const q5 = questions.find(q => q.code === 'MAT0001');
  const q8 = questions.find(q => q.code === 'DC0001');
  const q13 = questions.find(q => q.code === 'INF0001');

  await prisma.comment.createMany({
    data: [
      {
        question_id: q1.id, user_id: alunoCascas.id,
        text: 'Ótima questão! A pegadinha da alternativa B é clássica do CESPE — usar crase antes de substantivo que não admite artigo.',
        author_name: 'Ana Paula Ferreira', author_role: 'Aluno Eleva',
      },
      {
        question_id: q1.id, user_id: professor.id,
        text: 'Lembrem-se: para usar crase, testem substituindo pelo masculino — se aparecer "ao", é crase!',
        author_name: 'Prof. Carlos Mendes', author_role: 'Professor',
      },
      {
        question_id: q5.id, user_id: alunoCascas.id,
        text: 'Quase errei! É uma armadilha comum pensar que 20% de aumento + 20% de desconto resultam no valor original.',
        author_name: 'Ana Paula Ferreira', author_role: 'Aluno Eleva',
      },
      {
        question_id: q8.id, user_id: professor.id,
        text: 'Questão muito cobrada. Dominem os remédios constitucionais: HC, MS, MI, HD e AP.',
        author_name: 'Prof. Carlos Mendes', author_role: 'Professor',
      },
      {
        question_id: q13.id, user_id: alunoCascas.id,
        text: 'Confundi MitM com Phishing. A diferença é que Phishing engana o usuário para entregar credenciais voluntariamente.',
        author_name: 'Ana Paula Ferreira', author_role: 'Aluno Eleva',
      },
    ],
  });

  console.log('✅ Comentários criados');

  // ── REPORTS ─────────────────────────────────────────────────
  const q6 = questions.find(q => q.code === 'MAT0002');
  await prisma.questionReport.create({
    data: {
      question_id: q6.id,
      user_id: alunoCascas.id,
      reason: 'Acredito que a questão tem um erro no enunciado — faltou especificar se a PA é crescente ou decrescente.',
      status: 'pending',
    },
  });

  console.log('✅ Report de questão criado');

  // ── FLASHCARDS ──────────────────────────────────────────────
  const flashcardsData = [
    // Globais (admin)
    {
      front: 'O que é o princípio da legalidade na Administração Pública?',
      back: 'Na Adm. Pública, o administrador só pode fazer o que a lei expressamente PERMITE. Base: art. 37, caput da CF/88. Difere do direito privado, onde tudo que não é proibido é permitido.',
      discipline: 'Direito Administrativo',
      subjects: ['Princípios da Administração', 'LIMPE'],
      is_global: true, created_by: admin.id,
    },
    {
      front: 'Qual a diferença entre crime doloso e culposo?',
      back: 'DOLOSO: agente quis o resultado (dolo direto) ou assumiu o risco (dolo eventual). CULPOSO: agente não quis o resultado, mas agiu com imprudência, negligência ou imperícia. CP, art. 18.',
      discipline: 'Direito Penal',
      subjects: ['Elementos do Crime', 'Culpabilidade'],
      is_global: true, created_by: admin.id,
    },
    {
      front: 'O que é crase e quando usar?',
      back: 'Crase é a fusão da preposição "a" com o artigo feminino "a". Use quando há: preposição "a" obrigatória + palavra feminina que admite artigo "a". Macete: substitua pelo masculino — se aparecer "ao", use crase.',
      discipline: 'Língua Portuguesa',
      subjects: ['Crase', 'Regência'],
      is_global: true, created_by: admin.id,
    },
    {
      front: 'Quais são as cláusulas pétreas da CF/88?',
      back: 'Art. 60, §4º da CF/88 — não podem ser abolidas por emenda: I) forma federativa de Estado; II) voto direto, secreto, universal e periódico; III) separação dos Poderes; IV) direitos e garantias individuais.',
      discipline: 'Direito Constitucional',
      subjects: ['Emenda Constitucional', 'Cláusulas Pétreas'],
      is_global: true, created_by: admin.id,
    },
    {
      front: 'O que é o habeas corpus?',
      back: 'Remédio constitucional (CF/88, art. 5º, LXVIII) que protege a LIBERDADE DE LOCOMOÇÃO. Cabe quando alguém sofrer ou se achar AMEAÇADO de sofrer violência ou coação em sua liberdade de ir, vir e permanecer.',
      discipline: 'Direito Constitucional',
      subjects: ['Remédios Constitucionais', 'Direitos Fundamentais'],
      is_global: true, created_by: admin.id,
    },
    {
      front: 'Qual a fórmula da probabilidade clássica?',
      back: 'P(A) = n(A) / n(Ω), onde n(A) = casos favoráveis, n(Ω) = total de casos possíveis. A probabilidade sempre está entre 0 e 1 (ou 0% e 100%).',
      discipline: 'Matemática e Raciocínio Lógico',
      subjects: ['Probabilidade', 'Combinatória'],
      is_global: true, created_by: admin.id,
    },
    // Pessoais da Ana
    {
      front: 'Como identificar o verbo "haver" impessoal?',
      back: 'O verbo "haver" é impessoal (fica sempre no singular) quando tem sentido de EXISTIR ou OCORRER. ERRADO: "Haviam pessoas". CERTO: "Havia pessoas". Dica: substitua por "existir" — se funcionar, é impessoal.',
      discipline: 'Língua Portuguesa',
      subjects: ['Concordância Verbal', 'Verbos Impessoais'],
      is_global: false, created_by: alunoCascas.id,
    },
    {
      front: 'Diferença entre PA e PG',
      back: 'PA (Progressão Aritmética): soma razão (r) constante. Fórmula: aₙ = a₁ + (n-1)r. | PG (Progressão Geométrica): multiplica razão (q) constante. Fórmula: aₙ = a₁ × q^(n-1).',
      discipline: 'Matemática e Raciocínio Lógico',
      subjects: ['Progressão Aritmética', 'Progressão Geométrica'],
      is_global: false, created_by: alunoCascas.id,
    },
  ];

  const flashcards = [];
  for (const fc of flashcardsData) {
    const created = await prisma.flashcard.create({ data: fc });
    flashcards.push(created);
  }

  console.log(`✅ ${flashcards.length} flashcards criados (6 globais + 2 pessoais)`);

  // ── REVISÕES SM-2 ────────────────────────────────────────────
  const reviewsData = [
    // fc0 (legalidade): fácil, próxima revisão em 6 dias
    { idx: 0, quality: 5, ease_factor: 2.6, interval: 6, repetitions: 2, daysFromNow: 6, reviewedDaysAgo: 1 },
    // fc1 (doloso/culposo): difícil, revisar amanhã
    { idx: 1, quality: 3, ease_factor: 2.36, interval: 1, repetitions: 1, daysFromNow: 1, reviewedDaysAgo: 0.1 },
    // fc2 (crase): errou, revisar hoje
    { idx: 2, quality: 0, ease_factor: 2.18, interval: 1, repetitions: 0, daysFromNow: 0, reviewedDaysAgo: 0.02 },
    // fc3 (cláusulas pétreas): bom, próxima revisão em 3 dias
    { idx: 3, quality: 4, ease_factor: 2.5, interval: 3, repetitions: 1, daysFromNow: 3, reviewedDaysAgo: 3 },
    // fc6 (verbo haver pessoal): bom, revisar amanhã
    { idx: 6, quality: 4, ease_factor: 2.5, interval: 1, repetitions: 1, daysFromNow: 1, reviewedDaysAgo: 1 },
  ];

  for (const r of reviewsData) {
    const fc = flashcards[r.idx];
    if (!fc) continue;
    await prisma.flashcardReview.create({
      data: {
        flashcard_id: fc.id,
        user_id: alunoCascas.id,
        quality: r.quality,
        ease_factor: r.ease_factor,
        interval: r.interval,
        repetitions: r.repetitions,
        due_date: new Date(Date.now() + r.daysFromNow * 86400000),
        reviewed_at: new Date(Date.now() - r.reviewedDaysAgo * 86400000),
      },
    });
  }

  console.log('✅ Revisões SM-2 criadas');

  // ── RESUMO ───────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(52));
  console.log('🎉  SEED E-QUESTÕES CONCLUÍDO COM SUCESSO  🎉');
  console.log('═'.repeat(52));
  console.log('\n📋 CREDENCIAIS DE ACESSO:\n');
  console.log('👑 Admin:');
  console.log('   Email : admin@equestoes.com');
  console.log('   Senha : Admin@123');
  console.log('   Acesso: Total\n');
  console.log('🎓 Professor:');
  console.log('   Email : professor@equestoes.com');
  console.log('   Senha : Prof@123');
  console.log('   Acesso: Criar/Revisar questões + E-Tutory\n');
  console.log('📚 Aluno Cascas (acesso total + E-Tutory):');
  console.log('   Email : aluno@equestoes.com');
  console.log('   Senha : Aluno@123\n');
  console.log('📖 Aluno Pedrão (acesso básico):');
  console.log('   Email : aluno.pedrao@equestoes.com');
  console.log('   Senha : Aluno@123');
  console.log('\n📊 DADOS CRIADOS:');
  console.log('   4 usuários + 2 assinaturas ativas');
  console.log(`   ${questions.length} questões (LP, MAT, DC, DA, INF, DP, ADM, AFO, ETI)`);
  console.log('   2 cadernos com questões');
  console.log('   23 tentativas de resposta');
  console.log('   5 comentários + 1 report');
  console.log(`   ${flashcards.length} flashcards (6 globais + 2 pessoais)`);
  console.log('   5 revisões SM-2 registradas');
  console.log('═'.repeat(52) + '\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gconcursos.com' },
    update: {},
    create: {
      email: 'admin@gconcursos.com',
      password_hash: adminPassword,
      full_name: 'Administrador',
      role: 'admin',
      subscription_type: 'Professor',
    },
  });
  console.log('✅ Admin criado:', admin.email);

  // Criar professor
  const professorPassword = await bcrypt.hash('professor123', 10);
  const professor = await prisma.user.upsert({
    where: { email: 'professor@gconcursos.com' },
    update: {},
    create: {
      email: 'professor@gconcursos.com',
      password_hash: professorPassword,
      full_name: 'Professor Silva',
      role: 'user',
      subscription_type: 'Professor',
    },
  });
  console.log('✅ Professor criado:', professor.email);

  // Criar aluno Clube dos Cascas
  const alunoCascasPassword = await bcrypt.hash('aluno123', 10);
  const alunoCascas = await prisma.user.upsert({
    where: { email: 'aluno.cascas@gconcursos.com' },
    update: {},
    create: {
      email: 'aluno.cascas@gconcursos.com',
      password_hash: alunoCascasPassword,
      full_name: 'João Silva',
      role: 'user',
      subscription_type: 'Aluno Clube dos Cascas',
    },
  });
  console.log('✅ Aluno Clube dos Cascas criado:', alunoCascas.email);

  // Criar aluno Clube do Pedrão
  const alunoPedraoPassword = await bcrypt.hash('aluno123', 10);
  const alunoPedrao = await prisma.user.upsert({
    where: { email: 'aluno.pedrao@gconcursos.com' },
    update: {},
    create: {
      email: 'aluno.pedrao@gconcursos.com',
      password_hash: alunoPedraoPassword,
      full_name: 'Maria Santos',
      role: 'user',
      subscription_type: 'Aluno Clube do Pedrão',
    },
  });
  console.log('✅ Aluno Clube do Pedrão criado:', alunoPedrao.email);

  // Criar questões de exemplo
  const question1 = await prisma.question.create({
    data: {
      code: 'LP0001',
      text: 'Assinale a alternativa em que o uso da crase está CORRETO:',
      discipline: 'Língua Portuguesa',
      difficulty: 'Médio',
      exam_board: 'CESPE',
      year: 2024,
      position: 'Analista Judiciário',
      option_a: 'Fui à casa da minha avó.',
      option_b: 'Refiro-me à pessoas honestas.',
      option_c: 'Cheguei à duas horas.',
      option_d: 'Vou à pé ao trabalho.',
      option_e: 'Assisti à o filme.',
      correct_answer: 'A',
      explanation: 'A única alternativa correta é a letra A, pois há crase antes da palavra "casa" quando esta vem acompanhada de um adjunto adnominal. As demais alternativas apresentam erros: B (pessoas não admite artigo), C (horas no sentido de tempo decorrido), D (masculino não admite crase), E (artigo masculino).',
      question_type: 'Múltipla Escolha',
      subjects: ['Crase', 'Regência'],
      created_by: professor.email,
    },
  });
  console.log('✅ Questão 1 criada:', question1.code);

  const question2 = await prisma.question.create({
    data: {
      code: 'LP0002',
      text: 'Qual das alternativas apresenta concordância verbal CORRETA?',
      discipline: 'Língua Portuguesa',
      difficulty: 'Fácil',
      exam_board: 'FCC',
      year: 2024,
      position: 'Técnico Administrativo',
      option_a: 'Houveram muitos problemas na reunião.',
      option_b: 'Fazem dois anos que nos conhecemos.',
      option_c: 'Deve haver soluções para o problema.',
      option_d: 'Haviam muitas pessoas na fila.',
      option_e: 'Podem haver dúvidas sobre o assunto.',
      correct_answer: 'C',
      explanation: 'A alternativa C está correta. O verbo "haver" no sentido de "existir" é impessoal e deve permanecer na 3ª pessoa do singular. O verbo "dever" concorda com o verbo "haver", portanto também fica no singular. As demais alternativas apresentam erros de concordância com o verbo haver impessoal.',
      question_type: 'Múltipla Escolha',
      subjects: ['Concordância Verbal', 'Verbos Impessoais'],
      created_by: professor.email,
    },
  });
  console.log('✅ Questão 2 criada:', question2.code);

  const question3 = await prisma.question.create({
    data: {
      code: 'MAT0001',
      text: 'Em uma loja, um produto custava R$ 200,00 e teve um aumento de 20%. Após uma semana, o novo preço sofreu um desconto de 20%. Qual o preço final do produto?',
      discipline: 'Matemática e Raciocínio Lógico',
      difficulty: 'Médio',
      exam_board: 'CESPE',
      year: 2024,
      position: 'Técnico Bancário',
      option_a: 'R$ 200,00',
      option_b: 'R$ 192,00',
      option_c: 'R$ 208,00',
      option_d: 'R$ 216,00',
      option_e: 'R$ 184,00',
      correct_answer: 'B',
      explanation: 'Primeiro aumento: R$ 200,00 + 20% = R$ 200,00 × 1,20 = R$ 240,00. Depois desconto de 20%: R$ 240,00 - 20% = R$ 240,00 × 0,80 = R$ 192,00. Observe que aumentar 20% e depois diminuir 20% não resulta no valor original, pois a base de cálculo mudou.',
      question_type: 'Múltipla Escolha',
      subjects: ['Porcentagem', 'Matemática Básica'],
      created_by: professor.email,
    },
  });
  console.log('✅ Questão 3 criada:', question3.code);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📝 Credenciais de acesso:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@gconcursos.com');
  console.log('  Senha: admin123');
  console.log('\nProfessor:');
  console.log('  Email: professor@gconcursos.com');
  console.log('  Senha: professor123');
  console.log('\nAluno Clube dos Cascas:');
  console.log('  Email: aluno.cascas@gconcursos.com');
  console.log('  Senha: aluno123');
  console.log('\nAluno Clube do Pedrão:');
  console.log('  Email: aluno.pedrao@gconcursos.com');
  console.log('  Senha: aluno123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


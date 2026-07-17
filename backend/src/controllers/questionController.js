import prisma from '../config/database.js';

// Get distinct filter values (disciplines and subjects) from the database
export const getFilters = async (req, res) => {
  try {
    const [disciplineRows, subjectRows, pairRows, examBoardRows, yearRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT DISTINCT discipline
        FROM questions
        WHERE discipline IS NOT NULL AND discipline <> ''
        ORDER BY discipline
      `,
      prisma.$queryRaw`
        SELECT DISTINCT unnest(subjects) AS subject
        FROM questions
        WHERE subjects IS NOT NULL AND array_length(subjects, 1) > 0
        ORDER BY subject
      `,
      prisma.$queryRaw`
        SELECT DISTINCT discipline, unnest(subjects) AS subject
        FROM questions
        WHERE discipline IS NOT NULL AND discipline <> ''
          AND subjects IS NOT NULL AND array_length(subjects, 1) > 0
        ORDER BY discipline, subject
      `,
      prisma.$queryRaw`
        SELECT DISTINCT exam_board
        FROM questions
        WHERE exam_board IS NOT NULL AND exam_board <> ''
        ORDER BY exam_board
      `,
      prisma.$queryRaw`
        SELECT DISTINCT year
        FROM questions
        WHERE year IS NOT NULL
        ORDER BY year DESC
      `,
    ]);

    const disciplines = disciplineRows.map((r) => r.discipline);
    const subjects = subjectRows.map((r) => r.subject).filter(Boolean);
    const exam_boards = examBoardRows.map((r) => r.exam_board).filter(Boolean);
    const years = yearRows.map((r) => String(r.year));

    const subjectsByDiscipline = {};
    for (const row of pairRows) {
      if (!row.discipline || !row.subject) continue;
      if (!subjectsByDiscipline[row.discipline]) {
        subjectsByDiscipline[row.discipline] = [];
      }
      if (!subjectsByDiscipline[row.discipline].includes(row.subject)) {
        subjectsByDiscipline[row.discipline].push(row.subject);
      }
    }

    res.json({ disciplines, subjects, subjectsByDiscipline, exam_boards, years });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Erro ao buscar filtros' });
  }
};

function buildQuestionWhere(req) {
  const {
    discipline,
    difficulty,
    question_type,
    subject,
    status,
    code,
    notebook_ids,
    exam_board,
    year,
  } = req.query;

  const where = {};

  if (discipline) where.discipline = discipline;
  if (difficulty) where.difficulty = difficulty;
  if (question_type) where.question_type = question_type;
  if (subject) where.subjects = { has: subject };
  if (exam_board) where.exam_board = exam_board;
  if (year) {
    const parsedYear = parseInt(year, 10);
    if (!Number.isNaN(parsedYear)) where.year = parsedYear;
  }
  if (code) where.code = { equals: code.trim(), mode: 'insensitive' };

  if (notebook_ids) {
    const ids = notebook_ids.split(',').map((id) => id.trim()).filter(Boolean);
    if (ids.length > 0) where.id = { in: ids };
  }

  const userId = req.user?.id;
  if (status && userId) {
    if (status === 'not_answered') {
      where.attempts = { none: { user_id: userId } };
    } else if (status === 'correct') {
      where.attempts = { some: { user_id: userId, is_correct: true } };
    } else if (status === 'incorrect') {
      where.AND = [
        { attempts: { some: { user_id: userId } } },
        { NOT: { attempts: { some: { user_id: userId, is_correct: true } } } },
      ];
    }
  }

  return where;
}

// List questions with server-side pagination and filters
export const listQuestions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const where = buildQuestionWhere(req);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_date: 'desc' },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      data: questions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('List questions error:', error);
    res.status(500).json({ error: 'Erro ao listar questões' });
  }
};

// Get single question
export const getQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Erro ao buscar questão' });
  }
};

// Get question by code
export const getQuestionByCode = async (req, res) => {
  try {
    const code = req.params.code?.trim();
    if (!code) {
      return res.status(400).json({ error: 'Código da questão é obrigatório' });
    }

    const question = await prisma.question.findFirst({
      where: { code: { equals: code, mode: 'insensitive' } },
    });

    if (!question) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    res.json(question);
  } catch (error) {
    console.error('Get question by code error:', error);
    res.status(500).json({ error: 'Erro ao buscar questão por código' });
  }
};

// Create question
export const createQuestion = async (req, res) => {
  try {
    const {
      text,
      discipline,
      difficulty,
      exam_board,
      year,
      position,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      correct_answer,
      explanation,
      question_type,
      subjects,
      code,
    } = req.body;

    const isCertoErrado = question_type === 'Certo ou Errado';
    const missingBase = !text || !discipline || !difficulty || !option_a || !option_b || !correct_answer || !explanation;
    const missingMultiple = !isCertoErrado && (!option_c || !option_d || !option_e);

    if (missingBase || missingMultiple) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    if (isCertoErrado && !['A', 'B'].includes(correct_answer)) {
      return res.status(400).json({ error: 'Para questões Certo ou Errado, o gabarito deve ser A ou B' });
    }

    let questionCode = code;
    if (!questionCode) {
      const disciplinePrefix = discipline.substring(0, 2).toUpperCase();
      const count = await prisma.question.count();
      questionCode = `${disciplinePrefix}${String(count + 1).padStart(4, '0')}`;
    }

    const question = await prisma.question.create({
      data: {
        code: questionCode,
        text,
        discipline,
        difficulty,
        exam_board,
        year: year ? parseInt(year) : null,
        position,
        option_a,
        option_b,
        option_c: isCertoErrado ? null : option_c,
        option_d: isCertoErrado ? null : option_d,
        option_e: isCertoErrado ? null : option_e,
        correct_answer,
        explanation,
        question_type: question_type || 'Múltipla Escolha',
        subjects: subjects || [],
        created_by: req.user.email,
      },
    });

    res.status(201).json(question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Erro ao criar questão' });
  }
};

// Update question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      text,
      discipline,
      difficulty,
      exam_board,
      year,
      position,
      option_a,
      option_b,
      option_c,
      option_d,
      option_e,
      correct_answer,
      explanation,
      question_type,
      subjects,
    } = req.body;

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (discipline !== undefined) updateData.discipline = discipline;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (exam_board !== undefined) updateData.exam_board = exam_board;
    if (year !== undefined) updateData.year = year ? parseInt(year) : null;
    if (position !== undefined) updateData.position = position;
    if (option_a !== undefined) updateData.option_a = option_a;
    if (option_b !== undefined) updateData.option_b = option_b;
    if (option_c !== undefined) updateData.option_c = option_c;
    if (option_d !== undefined) updateData.option_d = option_d;
    if (option_e !== undefined) updateData.option_e = option_e;
    if (correct_answer !== undefined) updateData.correct_answer = correct_answer;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (question_type !== undefined) updateData.question_type = question_type;
    if (subjects !== undefined) updateData.subjects = subjects;

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    res.json(question);
  } catch (error) {
    console.error('Update question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao atualizar questão' });
  }
};

// Delete question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.question.delete({
      where: { id },
    });

    res.json({ message: 'Questão deletada com sucesso' });
  } catch (error) {
    console.error('Delete question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao deletar questão' });
  }
};

import prisma from '../config/database.js';

// List all questions
export const listQuestions = async (req, res) => {
  try {
    const { discipline, difficulty, question_type, limit, offset } = req.query;

    const where = {};
    if (discipline) where.discipline = discipline;
    if (difficulty) where.difficulty = difficulty;
    if (question_type) where.question_type = question_type;

    const questions = await prisma.question.findMany({
      where,
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
      orderBy: { created_date: 'desc' }
    });

    res.json(questions);
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
      where: { id }
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
      code
    } = req.body;

    // Validate required fields
    // Questões "Certo ou Errado" exigem apenas A e B; as demais exigem A-E
    const isCertoErrado = question_type === 'Certo ou Errado';
    const missingBase = !text || !discipline || !difficulty || !option_a || !option_b || !correct_answer || !explanation;
    const missingMultiple = !isCertoErrado && (!option_c || !option_d || !option_e);

    if (missingBase || missingMultiple) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Para "Certo ou Errado": gabarito só pode ser A ou B
    if (isCertoErrado && !['A', 'B'].includes(correct_answer)) {
      return res.status(400).json({ error: 'Para questões Certo ou Errado, o gabarito deve ser A ou B' });
    }

    // Generate code if not provided
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
        // Questões "Certo ou Errado" não possuem C/D/E
        option_c: isCertoErrado ? null : option_c,
        option_d: isCertoErrado ? null : option_d,
        option_e: isCertoErrado ? null : option_e,
        correct_answer,
        explanation,
        question_type: question_type || 'Múltipla Escolha',
        subjects: subjects || [],
        created_by: req.user.email
      }
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
      subjects
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
      data: updateData
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
      where: { id }
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


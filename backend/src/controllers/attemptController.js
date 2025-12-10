import prisma from '../config/database.js';

// List attempts
export const listAttempts = async (req, res) => {
  try {
    const { order, limit, question_id } = req.query;

    const where = {};
    if (question_id) where.question_id = question_id;

    let orderBy = { created_date: 'desc' };
    if (order === '-created_date') {
      orderBy = { created_date: 'desc' };
    } else if (order === 'created_date') {
      orderBy = { created_date: 'asc' };
    }

    const attempts = await prisma.attempt.findMany({
      where,
      orderBy,
      take: limit ? parseInt(limit) : undefined
    });

    res.json(attempts);
  } catch (error) {
    console.error('List attempts error:', error);
    res.status(500).json({ error: 'Erro ao listar tentativas' });
  }
};

// Create attempt
export const createAttempt = async (req, res) => {
  try {
    const { question_id, chosen_answer, is_correct, answered_at } = req.body;

    // Validate required fields
    if (!question_id || !chosen_answer || is_correct === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const attempt = await prisma.attempt.create({
      data: {
        question_id,
        user_id: req.user.id,
        chosen_answer,
        is_correct,
        answered_at: answered_at ? new Date(answered_at) : new Date(),
        created_by: req.user.email
      }
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({ error: 'Erro ao criar tentativa' });
  }
};

// Get user attempts
export const getUserAttempts = async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const attempts = await prisma.attempt.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    });

    res.json(attempts);
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ error: 'Erro ao buscar tentativas do usuário' });
  }
};


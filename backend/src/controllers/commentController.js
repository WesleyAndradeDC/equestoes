import prisma from '../config/database.js';

// List comments (with filter by question_id)
export const listComments = async (req, res) => {
  try {
    const { question_id, order } = req.query;

    const where = {};
    if (question_id) where.question_id = question_id;

    let orderBy = { created_date: 'desc' };
    if (order === '-created_date') {
      orderBy = { created_date: 'desc' };
    } else if (order === 'created_date') {
      orderBy = { created_date: 'asc' };
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy
    });

    res.json(comments);
  } catch (error) {
    console.error('List comments error:', error);
    res.status(500).json({ error: 'Erro ao listar comentários' });
  }
};

// Create comment
export const createComment = async (req, res) => {
  try {
    const { question_id, text, author_name, author_role } = req.body;

    // Validate required fields
    if (!question_id || !text) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const comment = await prisma.comment.create({
      data: {
        question_id,
        user_id: req.user.id,
        text,
        author_name: author_name || req.user.full_name,
        author_role: author_role || req.user.subscription_type || req.user.role
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Erro ao criar comentário' });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.comment.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comentário não encontrado' });
    }

    // Only owner or admin can delete
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.comment.delete({
      where: { id }
    });

    res.json({ message: 'Comentário deletado com sucesso' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Erro ao deletar comentário' });
  }
};


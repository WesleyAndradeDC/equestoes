import prisma from '../config/database.js';

// List notebooks (with filter by created_by)
export const listNotebooks = async (req, res) => {
  try {
    const { created_by } = req.query;

    const where = {};
    if (created_by) {
      where.created_by = created_by;
    } else {
      // If no filter, return only user's notebooks
      where.created_by = req.user.email;
    }

    const notebooks = await prisma.notebook.findMany({
      where,
      include: {
        questions: {
          include: {
            question: true
          }
        }
      },
      orderBy: { created_date: 'desc' }
    });

    // Transform to match Base44 format (question_ids array)
    const notebooksFormatted = notebooks.map(notebook => ({
      id: notebook.id,
      name: notebook.name,
      description: notebook.description,
      color: notebook.color,
      created_by: notebook.created_by,
      created_date: notebook.created_date,
      updated_at: notebook.updated_at,
      question_ids: notebook.questions.map(q => q.question_id)
    }));

    res.json(notebooksFormatted);
  } catch (error) {
    console.error('List notebooks error:', error);
    res.status(500).json({ error: 'Erro ao listar cadernos' });
  }
};

// Get single notebook
export const getNotebook = async (req, res) => {
  try {
    const { id } = req.params;

    const notebook = await prisma.notebook.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: true
          }
        }
      }
    });

    if (!notebook) {
      return res.status(404).json({ error: 'Caderno não encontrado' });
    }

    // Check ownership
    if (notebook.created_by !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Transform to match Base44 format
    const notebookFormatted = {
      id: notebook.id,
      name: notebook.name,
      description: notebook.description,
      color: notebook.color,
      created_by: notebook.created_by,
      created_date: notebook.created_date,
      updated_at: notebook.updated_at,
      question_ids: notebook.questions.map(q => q.question_id)
    };

    res.json(notebookFormatted);
  } catch (error) {
    console.error('Get notebook error:', error);
    res.status(500).json({ error: 'Erro ao buscar caderno' });
  }
};

// Create notebook
export const createNotebook = async (req, res) => {
  try {
    const { name, description, color, question_ids } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const notebook = await prisma.notebook.create({
      data: {
        name,
        description,
        color: color || 'blue',
        created_by: req.user.email,
        questions: question_ids && question_ids.length > 0 ? {
          create: question_ids.map(qid => ({
            question_id: qid
          }))
        } : undefined
      },
      include: {
        questions: true
      }
    });

    // Transform to match Base44 format
    const notebookFormatted = {
      id: notebook.id,
      name: notebook.name,
      description: notebook.description,
      color: notebook.color,
      created_by: notebook.created_by,
      created_date: notebook.created_date,
      updated_at: notebook.updated_at,
      question_ids: notebook.questions.map(q => q.question_id)
    };

    res.status(201).json(notebookFormatted);
  } catch (error) {
    console.error('Create notebook error:', error);
    res.status(500).json({ error: 'Erro ao criar caderno' });
  }
};

// Update notebook
export const updateNotebook = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, question_ids } = req.body;

    // Check ownership
    const existing = await prisma.notebook.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Caderno não encontrado' });
    }

    if (existing.created_by !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;

    // Update notebook
    const notebook = await prisma.notebook.update({
      where: { id },
      data: updateData
    });

    // Update question associations if provided
    if (question_ids !== undefined) {
      // Delete existing associations
      await prisma.notebookQuestion.deleteMany({
        where: { notebook_id: id }
      });

      // Create new associations
      if (question_ids.length > 0) {
        await prisma.notebookQuestion.createMany({
          data: question_ids.map(qid => ({
            notebook_id: id,
            question_id: qid
          }))
        });
      }
    }

    // Fetch updated notebook with questions
    const updatedNotebook = await prisma.notebook.findUnique({
      where: { id },
      include: {
        questions: true
      }
    });

    // Transform to match Base44 format
    const notebookFormatted = {
      id: updatedNotebook.id,
      name: updatedNotebook.name,
      description: updatedNotebook.description,
      color: updatedNotebook.color,
      created_by: updatedNotebook.created_by,
      created_date: updatedNotebook.created_date,
      updated_at: updatedNotebook.updated_at,
      question_ids: updatedNotebook.questions.map(q => q.question_id)
    };

    res.json(notebookFormatted);
  } catch (error) {
    console.error('Update notebook error:', error);
    res.status(500).json({ error: 'Erro ao atualizar caderno' });
  }
};

// Delete notebook
export const deleteNotebook = async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.notebook.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Caderno não encontrado' });
    }

    if (existing.created_by !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.notebook.delete({
      where: { id }
    });

    res.json({ message: 'Caderno deletado com sucesso' });
  } catch (error) {
    console.error('Delete notebook error:', error);
    res.status(500).json({ error: 'Erro ao deletar caderno' });
  }
};


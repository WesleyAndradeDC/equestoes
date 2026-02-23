import prisma from '../config/database.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports
// Qualquer usuário autenticado pode reportar uma questão
// ─────────────────────────────────────────────────────────────────────────────
export const createReport = async (req, res) => {
  try {
    const { question_id, reason } = req.body;

    if (!question_id || !reason?.trim()) {
      return res.status(400).json({
        error: 'question_id e reason são obrigatórios',
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        error: 'Descreva o problema com pelo menos 10 caracteres',
      });
    }

    // Verificar se a questão existe
    const question = await prisma.question.findUnique({
      where: { id: question_id },
      select: { id: true, code: true, discipline: true },
    });

    if (!question) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    // Verificar se o usuário já tem um report pendente/em revisão para essa questão
    const existing = await prisma.questionReport.findFirst({
      where: {
        question_id,
        user_id: req.user.id,
        status: { in: ['pending', 'reviewing'] },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Você já reportou esta questão e o report ainda está em análise',
      });
    }

    const report = await prisma.questionReport.create({
      data: {
        question_id,
        user_id: req.user.id,
        reason: reason.trim(),
        status: 'pending',
      },
      include: {
        question: { select: { code: true, discipline: true } },
        reporter: { select: { full_name: true } },
      },
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Erro ao criar report' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports
// Somente admin e professor podem listar todos os reports
// Query params:
//   - status: 'pending' | 'reviewing' | 'resolved' | 'dismissed' | 'all'
//   - limit: número (padrão 100)
// ─────────────────────────────────────────────────────────────────────────────
export const listReports = async (req, res) => {
  try {
    const { status = 'pending', limit = 100 } = req.query;

    const where = {};
    if (status !== 'all') {
      where.status = status;
    }

    const reports = await prisma.questionReport.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      include: {
        question: {
          select: {
            id:         true,
            code:       true,
            text:       true,
            discipline: true,
            difficulty: true,
            exam_board: true,
            year:       true,
          },
        },
        reporter: {
          select: { id: true, full_name: true, email: true },
        },
        resolver: {
          select: { id: true, full_name: true },
        },
      },
    });

    res.json(reports);
  } catch (error) {
    console.error('List reports error:', error);
    res.status(500).json({ error: 'Erro ao listar reports' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/counts
// Retorna contagens por status para o badge no painel admin
// ─────────────────────────────────────────────────────────────────────────────
export const getReportCounts = async (req, res) => {
  try {
    const [pending, reviewing, resolved, dismissed] = await Promise.all([
      prisma.questionReport.count({ where: { status: 'pending' } }),
      prisma.questionReport.count({ where: { status: 'reviewing' } }),
      prisma.questionReport.count({ where: { status: 'resolved' } }),
      prisma.questionReport.count({ where: { status: 'dismissed' } }),
    ]);

    res.json({ pending, reviewing, resolved, dismissed, total: pending + reviewing + resolved + dismissed });
  } catch (error) {
    console.error('Get report counts error:', error);
    res.status(500).json({ error: 'Erro ao buscar contagens' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/reports/:id
// Admin ou professor atualiza status e/ou nota do report
// Body: { status, admin_note }
// ─────────────────────────────────────────────────────────────────────────────
export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Status inválido',
        valid: validStatuses,
      });
    }

    const existing = await prisma.questionReport.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Report não encontrado' });
    }

    const isResolving = status === 'resolved' || status === 'dismissed';

    const updated = await prisma.questionReport.update({
      where: { id },
      data: {
        ...(status     && { status }),
        ...(admin_note !== undefined && { admin_note }),
        ...(isResolving && {
          resolved_by: req.user.id,
          resolved_at: new Date(),
        }),
        // Se voltou para pending/reviewing, limpa resolução
        ...(!isResolving && status && {
          resolved_by: null,
          resolved_at: null,
        }),
      },
      include: {
        question: { select: { id: true, code: true, discipline: true } },
        reporter: { select: { full_name: true, email: true } },
        resolver: { select: { full_name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update report error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar report' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reports/:id
// Somente admin pode deletar um report
// ─────────────────────────────────────────────────────────────────────────────
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.questionReport.delete({ where: { id } });

    res.json({ message: 'Report removido com sucesso' });
  } catch (error) {
    console.error('Delete report error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao remover report' });
  }
};

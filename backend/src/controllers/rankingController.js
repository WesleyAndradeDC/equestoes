import prisma from '../config/database.js';

/**
 * GET /api/ranking
 *
 * Retorna o ranking de usuários filtrado pela categoria (subscription_type)
 * do usuário logado. Cada aluno vê apenas o ranking do seu próprio clube.
 * Professores e Admins veem o ranking global de todas as categorias.
 *
 * Query params:
 *  - discipline  : filtra por disciplina (opcional)
 *  - date_filter : 'today' | 'week' | 'month' | 'all' (padrão: 'all')
 */
export const getRanking = async (req, res) => {
  try {
    const { discipline, date_filter = 'all' } = req.query;
    const currentUser = req.user;

    // ── 1. Filtro de data ──────────────────────────────────────────────────────
    let dateThreshold = null;
    const now = new Date();

    if (date_filter === 'today') {
      dateThreshold = new Date(now);
      dateThreshold.setHours(0, 0, 0, 0);
    } else if (date_filter === 'week') {
      dateThreshold = new Date(now);
      dateThreshold.setDate(now.getDate() - 7);
    } else if (date_filter === 'month') {
      dateThreshold = new Date(now);
      dateThreshold.setMonth(now.getMonth() - 1);
    }

    // ── 2. Categoria do usuário ────────────────────────────────────────────────
    // Admin e Professor veem global; alunos veem apenas a própria categoria
    const isPrivileged =
      currentUser.role === 'admin' || currentUser.subscription_type === 'Professor';
    const categoryFilter = isPrivileged ? null : currentUser.subscription_type;

    // ── 3. Construir filtros da query de tentativas ────────────────────────────
    const attemptWhere = {};

    if (dateThreshold) {
      attemptWhere.created_date = { gte: dateThreshold };
    }

    // Filtro por disciplina: precisa ir via relação com Question
    if (discipline && discipline !== 'Todas as Disciplinas') {
      attemptWhere.question = { discipline };
    }

    // Filtro de categoria: apenas tentativas de usuários da mesma categoria
    if (categoryFilter) {
      attemptWhere.user = { subscription_type: categoryFilter };
    }

    // ── 4. Buscar tentativas com dados do usuário ──────────────────────────────
    const attempts = await prisma.attempt.findMany({
      where: attemptWhere,
      select: {
        user_id:    true,
        is_correct: true,
        user: {
          select: {
            id:                true,
            full_name:         true,
            subscription_type: true,
          },
        },
      },
    });

    if (attempts.length === 0) {
      return res.json([]);
    }

    // ── 5. Agregar por usuário ─────────────────────────────────────────────────
    const userScores = {};

    for (const attempt of attempts) {
      const { user_id, is_correct, user } = attempt;

      if (!userScores[user_id]) {
        userScores[user_id] = {
          userId:            user_id,
          name:              user?.full_name || 'Usuário',
          subscription_type: user?.subscription_type || null,
          score:             0,
          correctAnswers:    0,
          totalAttempts:     0,
          isCurrentUser:     user_id === currentUser.id,
        };
      }

      userScores[user_id].totalAttempts += 1;
      if (is_correct) {
        userScores[user_id].score         += 1;
        userScores[user_id].correctAnswers += 1;
      }
    }

    // ── 6. Calcular taxa de acerto, ordenar e numerar posições ─────────────────
    const ranking = Object.values(userScores)
      .map((u) => ({
        ...u,
        accuracy:
          u.totalAttempts > 0
            ? parseFloat(((u.correctAnswers / u.totalAttempts) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, position: index + 1 }));

    res.json(ranking);
  } catch (error) {
    console.error('Get ranking error:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking' });
  }
};

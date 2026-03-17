import prisma from '../config/database.js';

// ──────────────────────────────────────────────────────────────────
// GET /api/flashcards
// Lista flashcards: próprios do usuário + todos os globais
// ──────────────────────────────────────────────────────────────────
export async function listFlashcards(req, res) {
  try {
    const userId = req.user.id;
    const { discipline, subject } = req.query;

    const where = {
      OR: [
        { created_by: userId },
        { is_global: true },
      ],
    };

    if (discipline) {
      where.discipline = discipline;
    }

    if (subject) {
      where.subjects = { has: subject };
    }

    const flashcards = await prisma.flashcard.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        creator: { select: { id: true, full_name: true } },
        reviews: {
          where: { user_id: userId },
          select: { ease_factor: true, interval: true, repetitions: true, due_date: true, reviewed_at: true },
        },
      },
    });

    const result = flashcards.map(card => ({
      ...card,
      user_review: card.reviews[0] || null,
      reviews: undefined,
    }));

    res.json(result);
  } catch (error) {
    console.error('listFlashcards error:', error);
    res.status(500).json({ error: 'Erro ao listar flashcards' });
  }
}

// ──────────────────────────────────────────────────────────────────
// GET /api/flashcards/due
// Retorna flashcards pendentes para revisão hoje (due_date <= now)
// ──────────────────────────────────────────────────────────────────
export async function getDueFlashcards(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Cards que o usuário já iniciou revisão e que estão vencidos
    const reviewedDue = await prisma.flashcardReview.findMany({
      where: {
        user_id: userId,
        due_date: { lte: now },
      },
      include: {
        flashcard: true,
      },
    });

    const dueCards = reviewedDue.map(r => ({
      ...r.flashcard,
      user_review: {
        ease_factor: r.ease_factor,
        interval: r.interval,
        repetitions: r.repetitions,
        due_date: r.due_date,
        reviewed_at: r.reviewed_at,
      },
    }));

    res.json(dueCards);
  } catch (error) {
    console.error('getDueFlashcards error:', error);
    res.status(500).json({ error: 'Erro ao buscar flashcards pendentes' });
  }
}

// ──────────────────────────────────────────────────────────────────
// POST /api/flashcards
// Criar novo flashcard
// ──────────────────────────────────────────────────────────────────
export async function createFlashcard(req, res) {
  try {
    const { front, back, discipline, subjects, is_global } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!front || !back || !discipline) {
      return res.status(400).json({ error: 'front, back e discipline são obrigatórios' });
    }

    // Somente admin pode criar cards globais
    const global = is_global === true && isAdmin;

    const flashcard = await prisma.flashcard.create({
      data: {
        front,
        back,
        discipline,
        subjects: subjects || [],
        is_global: global,
        created_by: userId,
      },
    });

    res.status(201).json(flashcard);
  } catch (error) {
    console.error('createFlashcard error:', error);
    res.status(500).json({ error: 'Erro ao criar flashcard' });
  }
}

// ──────────────────────────────────────────────────────────────────
// PUT /api/flashcards/:id
// Atualizar flashcard (somente dono ou admin)
// ──────────────────────────────────────────────────────────────────
export async function updateFlashcard(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const flashcard = await prisma.flashcard.findUnique({ where: { id } });
    if (!flashcard) return res.status(404).json({ error: 'Flashcard não encontrado' });

    if (flashcard.created_by !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para editar este flashcard' });
    }

    const { front, back, discipline, subjects, is_global } = req.body;

    const updated = await prisma.flashcard.update({
      where: { id },
      data: {
        ...(front !== undefined && { front }),
        ...(back !== undefined && { back }),
        ...(discipline !== undefined && { discipline }),
        ...(subjects !== undefined && { subjects }),
        ...(is_global !== undefined && isAdmin && { is_global }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('updateFlashcard error:', error);
    res.status(500).json({ error: 'Erro ao atualizar flashcard' });
  }
}

// ──────────────────────────────────────────────────────────────────
// DELETE /api/flashcards/:id
// Deletar flashcard (somente dono ou admin)
// ──────────────────────────────────────────────────────────────────
export async function deleteFlashcard(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const flashcard = await prisma.flashcard.findUnique({ where: { id } });
    if (!flashcard) return res.status(404).json({ error: 'Flashcard não encontrado' });

    if (flashcard.created_by !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Sem permissão para deletar este flashcard' });
    }

    await prisma.flashcard.delete({ where: { id } });
    res.json({ message: 'Flashcard removido com sucesso' });
  } catch (error) {
    console.error('deleteFlashcard error:', error);
    res.status(500).json({ error: 'Erro ao deletar flashcard' });
  }
}

// ──────────────────────────────────────────────────────────────────
// POST /api/flashcards/:id/review
// Registrar revisão SM-2 para um card
// ──────────────────────────────────────────────────────────────────
export async function reviewFlashcard(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { quality, ease_factor, interval, repetitions, due_date } = req.body;

    if (quality === undefined || quality === null) {
      return res.status(400).json({ error: 'quality é obrigatório (0-5)' });
    }

    const flashcard = await prisma.flashcard.findUnique({ where: { id } });
    if (!flashcard) return res.status(404).json({ error: 'Flashcard não encontrado' });

    // Upsert: cria ou atualiza o registro de revisão do usuário para este card
    const review = await prisma.flashcardReview.upsert({
      where: {
        flashcard_id_user_id: { flashcard_id: id, user_id: userId },
      },
      update: {
        quality,
        ease_factor: ease_factor ?? 2.5,
        interval: interval ?? 1,
        repetitions: repetitions ?? 0,
        due_date: due_date ? new Date(due_date) : new Date(),
        reviewed_at: new Date(),
      },
      create: {
        flashcard_id: id,
        user_id: userId,
        quality,
        ease_factor: ease_factor ?? 2.5,
        interval: interval ?? 1,
        repetitions: repetitions ?? 0,
        due_date: due_date ? new Date(due_date) : new Date(),
        reviewed_at: new Date(),
      },
    });

    res.json(review);
  } catch (error) {
    console.error('reviewFlashcard error:', error);
    res.status(500).json({ error: 'Erro ao registrar revisão' });
  }
}

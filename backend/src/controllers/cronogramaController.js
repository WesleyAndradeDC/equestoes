import prisma from '../config/database.js';

// ─── UTIL ──────────────────────────────────────────────────────────────────────
const WEEK_MAP = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

/**
 * Gera tarefas diárias para um user_cronogram.
 * Algoritmo:
 *  - Ordena assuntos por dificuldade desc (disciplinas mais difíceis primeiro)
 *  - Distribui N disciplinas/dia
 *  - Alterna tipo humanas/exatas quando possível
 *  - Respeita dias da semana configurados
 */
async function generateDailyTasks(userCronogramId) {
  const uc = await prisma.userCronogram.findUnique({
    where: { id: userCronogramId },
    include: {
      disciplines: {
        orderBy: { difficulty: 'desc' },
        include: {
          subjects: {
            where: { required: true },
            orderBy: { display_order: 'asc' },
          },
        },
      },
    },
  });
  if (!uc) return;

  // Apaga tarefas antigas pendentes
  await prisma.userDailyTask.deleteMany({
    where: { user_cronogram_id: userCronogramId, status: 'pending' },
  });

  const studyDayNums = (uc.study_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map(
    (d) => WEEK_MAP[d] ?? 1
  );
  const disciplinesPerDay = uc.disciplines_per_day || 2;

  // Flatten: subjects grouped by discipline, preserving discipline metadata
  const disciplineQueue = uc.disciplines
    .filter((d) => d.subjects.length > 0)
    .map((d) => ({ ...d, remaining: [...d.subjects] }));

  if (disciplineQueue.length === 0) return;

  let tasksBatch = [];
  let dayNumber = 1;
  let date = new Date(uc.started_at || new Date());

  // Advance to next valid study day
  const nextStudyDate = (from) => {
    const d = new Date(from);
    for (let i = 0; i < 14; i++) {
      if (studyDayNums.includes(d.getDay())) return new Date(d);
      d.setDate(d.getDate() + 1);
    }
    return d;
  };

  date = nextStudyDate(date);

  // Total subjects
  const totalSubjects = disciplineQueue.reduce((s, d) => s + d.remaining.length, 0);
  const maxDays = Math.ceil(totalSubjects / disciplinesPerDay) + 5;

  let globalOrder = 0;
  let subjectsPlaced = 0;

  while (subjectsPlaced < totalSubjects && dayNumber <= maxDays) {
    const dateStr = date.toISOString().slice(0, 10);

    // Pick disciplines for this day (round-robin with difficulty priority)
    const activeDisciplines = disciplineQueue.filter((d) => d.remaining.length > 0);
    if (activeDisciplines.length === 0) break;

    const dayDisciplines = activeDisciplines.slice(0, disciplinesPerDay);

    let orderInDay = 0;
    for (const disc of dayDisciplines) {
      const subject = disc.remaining.shift();
      if (!subject) continue;

      tasksBatch.push({
        user_cronogram_id: userCronogramId,
        subject_id: subject.id,
        discipline_id: disc.id,
        scheduled_date: dateStr,
        day_number: dayNumber,
        display_order: orderInDay++,
        status: 'pending',
      });
      subjectsPlaced++;
    }

    dayNumber++;
    date.setDate(date.getDate() + 1);
    date = nextStudyDate(date);

    // Batch insert every 100
    if (tasksBatch.length >= 100) {
      await prisma.userDailyTask.createMany({ data: tasksBatch });
      tasksBatch = [];
    }
  }

  if (tasksBatch.length > 0) {
    await prisma.userDailyTask.createMany({ data: tasksBatch });
  }

  // Update total_days
  await prisma.userCronogram.update({
    where: { id: userCronogramId },
    data: { total_days: dayNumber - 1 },
  });
}

// ─── CRONOGRAMS (OFICIAIS/ADMIN) ───────────────────────────────────────────────

export const listCronograms = async (req, res) => {
  try {
    const { official, status = 'active', page = 1, limit = 20 } = req.query;
    const where = { status };
    if (official === 'true') where.is_official = true;
    if (official === 'false') where.is_official = false;

    const [items, total] = await Promise.all([
      prisma.cronogram.findMany({
        where,
        orderBy: [{ display_order: 'asc' }, { created_at: 'desc' }],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          disciplines: { include: { subjects: { select: { id: true } } } },
          _count: { select: { user_copies: true } },
        },
      }),
      prisma.cronogram.count({ where }),
    ]);

    res.json({
      data: items.map((c) => ({
        ...c,
        disciplines_count: c.disciplines.length,
        subjects_count: c.disciplines.reduce((s, d) => s + d.subjects.length, 0),
        students_count: c._count.user_copies,
      })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    console.error('listCronograms error:', err);
    res.status(500).json({ error: 'Erro ao listar cronogramas' });
  }
};

export const getCronogram = async (req, res) => {
  try {
    const cronogram = await prisma.cronogram.findUnique({
      where: { id: req.params.id },
      include: {
        disciplines: {
          orderBy: { display_order: 'asc' },
          include: {
            subjects: { orderBy: { display_order: 'asc' } },
          },
        },
        days: {
          orderBy: { day_number: 'asc' },
          include: { tasks: { orderBy: { display_order: 'asc' }, include: { subject: true, discipline: true } } },
        },
      },
    });
    if (!cronogram) return res.status(404).json({ error: 'Cronograma não encontrado' });
    res.json(cronogram);
  } catch (err) {
    console.error('getCronogram error:', err);
    res.status(500).json({ error: 'Erro ao buscar cronograma' });
  }
};

export const createCronogram = async (req, res) => {
  try {
    const {
      title, slug, description, thumbnail_url, contest, exam_board, position,
      category, is_official, is_public, total_days, tags, display_order,
      disciplines = [],
    } = req.body;
    if (!title) return res.status(400).json({ error: 'Título obrigatório' });

    const cronogram = await prisma.cronogram.create({
      data: {
        title, slug, description, thumbnail_url, contest, exam_board, position,
        category, is_official: !!is_official, is_public: is_public !== false,
        total_days, tags: tags || [], display_order: display_order || 0,
        status: 'draft',
        created_by: req.user.id,
        disciplines: {
          create: disciplines.map((d, i) => ({
            name: d.name,
            display_order: d.display_order ?? i,
            color: d.color || 'blue',
            icon: d.icon,
            weight: d.weight ?? 1,
            difficulty: d.difficulty ?? 3,
            required: d.required !== false,
            suggested_hours: d.suggested_hours,
            subjects: {
              create: (d.subjects || []).map((s, j) => ({
                name: s.name,
                description: s.description,
                display_order: s.display_order ?? j,
                weight: s.weight ?? 1,
                suggested_minutes: s.suggested_minutes ?? 60,
                required: s.required !== false,
              })),
            },
          })),
        },
      },
      include: { disciplines: { include: { subjects: true } } },
    });
    res.status(201).json(cronogram);
  } catch (err) {
    console.error('createCronogram error:', err);
    res.status(500).json({ error: 'Erro ao criar cronograma' });
  }
};

export const updateCronogram = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, slug, description, thumbnail_url, contest, exam_board, position,
      category, status, is_official, is_public, total_days, tags, display_order,
    } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (thumbnail_url !== undefined) data.thumbnail_url = thumbnail_url;
    if (contest !== undefined) data.contest = contest;
    if (exam_board !== undefined) data.exam_board = exam_board;
    if (position !== undefined) data.position = position;
    if (category !== undefined) data.category = category;
    if (status !== undefined) data.status = status;
    if (is_official !== undefined) data.is_official = !!is_official;
    if (is_public !== undefined) data.is_public = !!is_public;
    if (total_days !== undefined) data.total_days = total_days;
    if (tags !== undefined) data.tags = tags;
    if (display_order !== undefined) data.display_order = display_order;

    const cronogram = await prisma.cronogram.update({ where: { id }, data });
    res.json(cronogram);
  } catch (err) {
    console.error('updateCronogram error:', err);
    res.status(500).json({ error: 'Erro ao atualizar cronograma' });
  }
};

export const deleteCronogram = async (req, res) => {
  try {
    await prisma.cronogram.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteCronogram error:', err);
    res.status(500).json({ error: 'Erro ao deletar cronograma' });
  }
};

// ─── USER CRONOGRAMS ───────────────────────────────────────────────────────────

export const listUserCronograms = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await prisma.userCronogram.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        disciplines: {
          include: {
            subjects: {
              include: { progress: { where: { user_cronogram_id: { not: undefined } } } },
            },
          },
        },
        _count: { select: { daily_tasks: true } },
      },
    });
    res.json(items);
  } catch (err) {
    console.error('listUserCronograms error:', err);
    res.status(500).json({ error: 'Erro ao listar cronogramas do usuário' });
  }
};

export const getUserCronogram = async (req, res) => {
  try {
    const uc = await prisma.userCronogram.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
      include: {
        disciplines: {
          orderBy: { display_order: 'asc' },
          include: {
            subjects: {
              orderBy: { display_order: 'asc' },
              include: {
                progress: {
                  where: { user_cronogram_id: req.params.id },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    if (!uc) return res.status(404).json({ error: 'Não encontrado' });
    res.json(uc);
  } catch (err) {
    console.error('getUserCronogram error:', err);
    res.status(500).json({ error: 'Erro ao buscar cronograma' });
  }
};

/** Wizard: criar cronograma personalizado */
export const createUserCronogram = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title, contest, disciplines_per_day, study_days, daily_minutes,
      target_date, disciplines = [], type = 'custom', cronogram_id,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Título obrigatório' });

    // Se for oficial, verifica se já possui cópia
    if (cronogram_id) {
      const existing = await prisma.userCronogram.findFirst({
        where: { user_id: userId, cronogram_id },
      });
      if (existing) {
        return res.status(409).json({ error: 'Você já utiliza esse cronograma', id: existing.id });
      }
    }

    // Monta disciplines data
    const disciplinesData = disciplines.map((d, i) => ({
      name: d.name,
      display_order: i,
      color: d.color || 'blue',
      difficulty: d.difficulty ?? 3,
      weight: d.difficulty ?? 3, // peso = dificuldade para distribuição
      source_discipline_id: d.source_discipline_id || null,
      subjects: {
        create: (d.subjects || []).map((s, j) => ({
          name: s.name,
          display_order: j,
          suggested_minutes: s.suggested_minutes ?? 60,
          source_subject_id: s.source_subject_id || null,
        })),
      },
    }));

    const uc = await prisma.userCronogram.create({
      data: {
        user_id: userId,
        cronogram_id: cronogram_id || null,
        title,
        contest,
        type,
        disciplines_per_day: Number(disciplines_per_day) || 2,
        study_days: study_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        daily_minutes: Number(daily_minutes) || 120,
        target_date: target_date || null,
        status: 'active',
        disciplines: { create: disciplinesData },
      },
      include: { disciplines: { include: { subjects: true } } },
    });

    // Criar progresso inicial para cada assunto
    const allSubjects = uc.disciplines.flatMap((d) => d.subjects);
    if (allSubjects.length > 0) {
      await prisma.userSubjectProgress.createMany({
        data: allSubjects.map((s) => ({
          user_cronogram_id: uc.id,
          subject_id: s.id,
          status: 'not_started',
        })),
      });
    }

    // Gerar tarefas diárias
    await generateDailyTasks(uc.id);

    const result = await prisma.userCronogram.findUnique({
      where: { id: uc.id },
      include: {
        disciplines: { include: { subjects: true } },
        _count: { select: { daily_tasks: true } },
      },
    });

    // Incrementar contador do cronograma oficial
    if (cronogram_id) {
      await prisma.cronogram.update({
        where: { id: cronogram_id },
        data: { students_count: { increment: 1 } },
      }).catch(() => {});
    }

    res.status(201).json(result);
  } catch (err) {
    console.error('createUserCronogram error:', err);
    res.status(500).json({ error: 'Erro ao criar cronograma' });
  }
};

/** Copiar cronograma oficial para o usuário */
export const adoptOfficialCronogram = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cronogram_id } = req.params;

    const template = await prisma.cronogram.findUnique({
      where: { id: cronogram_id },
      include: {
        disciplines: {
          include: { subjects: true },
        },
      },
    });
    if (!template) return res.status(404).json({ error: 'Cronograma não encontrado' });

    const existing = await prisma.userCronogram.findFirst({
      where: { user_id: userId, cronogram_id },
    });
    if (existing) {
      return res.status(409).json({ error: 'Você já utiliza esse cronograma', id: existing.id });
    }

    const disciplinesData = template.disciplines.map((d, i) => ({
      name: d.name,
      display_order: d.display_order,
      color: d.color,
      icon: d.icon,
      weight: d.weight,
      difficulty: d.difficulty,
      required: d.required,
      suggested_hours: d.suggested_hours,
      source_discipline_id: d.id,
      subjects: {
        create: d.subjects.map((s) => ({
          name: s.name,
          description: s.description,
          display_order: s.display_order,
          weight: s.weight,
          suggested_minutes: s.suggested_minutes,
          required: s.required,
          source_subject_id: s.id,
        })),
      },
    }));

    const uc = await prisma.userCronogram.create({
      data: {
        user_id: userId,
        cronogram_id,
        title: template.title,
        contest: template.contest,
        type: 'official',
        total_days: template.total_days,
        status: 'active',
        disciplines: { create: disciplinesData },
      },
      include: { disciplines: { include: { subjects: true } } },
    });

    const allSubjects = uc.disciplines.flatMap((d) => d.subjects);
    if (allSubjects.length > 0) {
      await prisma.userSubjectProgress.createMany({
        data: allSubjects.map((s) => ({
          user_cronogram_id: uc.id,
          subject_id: s.id,
          status: 'not_started',
        })),
      });
    }

    await generateDailyTasks(uc.id);
    await prisma.cronogram.update({
      where: { id: cronogram_id },
      data: { students_count: { increment: 1 } },
    }).catch(() => {});

    res.status(201).json(await prisma.userCronogram.findUnique({
      where: { id: uc.id },
      include: { disciplines: { include: { subjects: true } } },
    }));
  } catch (err) {
    console.error('adoptOfficialCronogram error:', err);
    res.status(500).json({ error: 'Erro ao adotar cronograma' });
  }
};

/** Retorna tarefas de um dia específico */
export const getDayTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD, default today

    const targetDate = date || new Date().toISOString().slice(0, 10);

    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
      select: { id: true },
    });
    if (!uc) return res.status(404).json({ error: 'Não encontrado' });

    const tasks = await prisma.userDailyTask.findMany({
      where: { user_cronogram_id: id, scheduled_date: targetDate },
      orderBy: { display_order: 'asc' },
      include: {
        subject: true,
        discipline: { select: { id: true, name: true, color: true, icon: true } },
      },
    });

    // Attach progress
    const subjectIds = tasks.map((t) => t.subject_id).filter(Boolean);
    const progressMap = {};
    if (subjectIds.length > 0) {
      const prog = await prisma.userSubjectProgress.findMany({
        where: { user_cronogram_id: id, subject_id: { in: subjectIds } },
      });
      prog.forEach((p) => { progressMap[p.subject_id] = p.status; });
    }

    res.json(tasks.map((t) => ({
      ...t,
      subject_status: t.subject_id ? progressMap[t.subject_id] || 'not_started' : null,
    })));
  } catch (err) {
    console.error('getDayTasks error:', err);
    res.status(500).json({ error: 'Erro ao buscar tarefas do dia' });
  }
};

/** Atualizar status de tarefa diária */
export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, notes, rescheduled_to } = req.body;

    const task = await prisma.userDailyTask.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const uc = await prisma.userCronogram.findFirst({
      where: { id: task.user_cronogram_id, user_id: req.user.id },
      select: { id: true },
    });
    if (!uc) return res.status(403).json({ error: 'Acesso negado' });

    const data = { status };
    if (notes !== undefined) data.notes = notes;
    if (rescheduled_to !== undefined) data.rescheduled_to = rescheduled_to;
    if (status === 'completed') data.completed_at = new Date();

    const updated = await prisma.userDailyTask.update({ where: { id: taskId }, data });

    // Atualiza progresso do assunto se concluído
    if (status === 'completed' && task.subject_id) {
      await prisma.userSubjectProgress.upsert({
        where: { user_cronogram_id_subject_id: { user_cronogram_id: task.user_cronogram_id, subject_id: task.subject_id } },
        create: { user_cronogram_id: task.user_cronogram_id, subject_id: task.subject_id, status: 'completed', completed_at: new Date() },
        update: { status: 'completed', completed_at: new Date() },
      });
    }

    // Atualiza streak e days_studied
    const today = new Date().toISOString().slice(0, 10);
    const ucFull = await prisma.userCronogram.findUnique({ where: { id: task.user_cronogram_id } });
    if (ucFull.last_study_date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const newStreak = ucFull.last_study_date === yesterdayStr ? ucFull.streak + 1 : 1;
      await prisma.userCronogram.update({
        where: { id: task.user_cronogram_id },
        data: { last_study_date: today, streak: newStreak, days_studied: { increment: 1 } },
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
};

/** Reagendar tarefas pendentes (recalcular cronograma) */
export const recalculate = async (req, res) => {
  try {
    const { id } = req.params;
    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
    });
    if (!uc) return res.status(404).json({ error: 'Não encontrado' });

    await generateDailyTasks(id);
    res.json({ success: true, message: 'Cronograma recalculado' });
  } catch (err) {
    console.error('recalculate error:', err);
    res.status(500).json({ error: 'Erro ao recalcular cronograma' });
  }
};

/** Atualizar status de um assunto (edital verticalizado) */
export const updateSubjectProgress = async (req, res) => {
  try {
    const { id, subjectId } = req.params;
    const { status, notes } = req.body;

    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
      select: { id: true },
    });
    if (!uc) return res.status(403).json({ error: 'Acesso negado' });

    const prog = await prisma.userSubjectProgress.upsert({
      where: { user_cronogram_id_subject_id: { user_cronogram_id: id, subject_id: subjectId } },
      create: { user_cronogram_id: id, subject_id: subjectId, status, notes },
      update: { status, notes, ...(status === 'completed' ? { completed_at: new Date() } : {}) },
    });

    // Marcar tasks do assunto como concluídas também
    if (status === 'completed') {
      await prisma.userDailyTask.updateMany({
        where: { user_cronogram_id: id, subject_id: subjectId, status: 'pending' },
        data: { status: 'completed', completed_at: new Date() },
      });
    }

    res.json(prog);
  } catch (err) {
    console.error('updateSubjectProgress error:', err);
    res.status(500).json({ error: 'Erro ao atualizar progresso' });
  }
};

/** Stats do cronograma do usuário */
export const getUserCronogramStats = async (req, res) => {
  try {
    const { id } = req.params;
    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
      include: {
        disciplines: { include: { subjects: { include: { progress: { where: { user_cronogram_id: id } } } } } },
        daily_tasks: true,
      },
    });
    if (!uc) return res.status(404).json({ error: 'Não encontrado' });

    const allSubjects = uc.disciplines.flatMap((d) => d.subjects);
    const totalSubjects = allSubjects.length;
    const completedSubjects = allSubjects.filter((s) => s.progress[0]?.status === 'completed').length;
    const inProgressSubjects = allSubjects.filter((s) => s.progress[0]?.status === 'in_progress').length;

    const completedTasks = uc.daily_tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = uc.daily_tasks.length;

    const disciplineStats = uc.disciplines.map((d) => {
      const subs = d.subjects;
      const done = subs.filter((s) => s.progress[0]?.status === 'completed').length;
      return {
        id: d.id,
        name: d.name,
        color: d.color,
        total: subs.length,
        completed: done,
        progress_pct: subs.length > 0 ? Math.round((done / subs.length) * 100) : 0,
      };
    });

    res.json({
      total_subjects: totalSubjects,
      completed_subjects: completedSubjects,
      in_progress_subjects: inProgressSubjects,
      pending_subjects: totalSubjects - completedSubjects - inProgressSubjects,
      overall_progress_pct: totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      days_studied: uc.days_studied,
      streak: uc.streak,
      total_days: uc.total_days,
      discipline_stats: disciplineStats,
    });
  } catch (err) {
    console.error('getUserCronogramStats error:', err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

/** Calendar: tasks agrupadas por data */
export const getCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
      select: { id: true },
    });
    if (!uc) return res.status(404).json({ error: 'Não encontrado' });

    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = new Date(y, m, 0);
    const end = endDate.toISOString().slice(0, 10);

    const tasks = await prisma.userDailyTask.findMany({
      where: {
        user_cronogram_id: id,
        scheduled_date: { gte: start, lte: end },
      },
      select: { scheduled_date: true, status: true },
    });

    const byDate = {};
    for (const t of tasks) {
      const d = t.scheduled_date;
      if (!byDate[d]) byDate[d] = { date: d, total: 0, completed: 0, pending: 0, skipped: 0 };
      byDate[d].total++;
      if (t.status === 'completed') byDate[d].completed++;
      else if (t.status === 'pending') byDate[d].pending++;
      else if (t.status === 'skipped') byDate[d].skipped++;
    }

    res.json(Object.values(byDate));
  } catch (err) {
    console.error('getCalendar error:', err);
    res.status(500).json({ error: 'Erro ao buscar calendário' });
  }
};

/** Disciplines disponíveis (da base de questões) para o wizard */
export const getAvailableDisciplines = async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT DISTINCT discipline, array_agg(DISTINCT s) AS subjects
      FROM questions, unnest(subjects) AS s
      WHERE discipline IS NOT NULL AND discipline <> ''
      GROUP BY discipline
      ORDER BY discipline
    `;
    res.json(rows.map((r) => ({ discipline: r.discipline, subjects: r.subjects || [] })));
  } catch (err) {
    console.error('getAvailableDisciplines error:', err);
    res.status(500).json({ error: 'Erro ao buscar disciplinas' });
  }
};

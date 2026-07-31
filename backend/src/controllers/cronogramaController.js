import prisma from '../config/database.js';

// ─── UTIL (fuso America/Sao_Paulo) ─────────────────────────────────────────────
const WEEK_MAP = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
const TZ = 'America/Sao_Paulo';

/** YYYY-MM-DD no fuso de São Paulo */
function dateStrSP(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Soma N dias a um YYYY-MM-DD e devolve YYYY-MM-DD */
function addDaysStr(yyyyMmDd, days) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return dt.toISOString().slice(0, 10);
}

/** YYYY-MM-DD → Date (noon UTC) para usar como valor DateTime @db.Date no Prisma */
function dateStrToDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Date (de coluna @db.Date) → YYYY-MM-DD string */
function dateToStr(date) {
  if (!date) return null;
  if (typeof date === 'string') return date.slice(0, 10);
  return new Date(date).toISOString().slice(0, 10);
}

function weekdayFromDateStr(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

function nextStudyDateStr(fromStr, studyDayNums) {
  let cur = fromStr;
  for (let i = 0; i < 21; i++) {
    if (studyDayNums.includes(weekdayFromDateStr(cur))) return cur;
    cur = addDaysStr(cur, 1);
  }
  return cur;
}

/**
 * Gera tarefas diárias para um user_cronogram.
 * Prioriza disciplinas difíceis, N disciplinas/dia, respeita study_days.
 */
async function generateDailyTasks(userCronogramId) {
  const uc = await prisma.userCronogram.findUnique({
    where: { id: userCronogramId },
    include: {
      disciplines: {
        orderBy: { difficulty: 'desc' },
        include: {
          subjects: { orderBy: { display_order: 'asc' } },
        },
      },
    },
  });
  if (!uc) return { created: 0 };

  await prisma.userDailyTask.deleteMany({
    where: { user_cronogram_id: userCronogramId, status: 'pending' },
  });

  // Não regenera assuntos já concluídos
  const completed = await prisma.userSubjectProgress.findMany({
    where: { user_cronogram_id: userCronogramId, status: 'completed' },
    select: { subject_id: true },
  });
  const completedSet = new Set(completed.map((c) => c.subject_id));

  const studyDayNums = (uc.study_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map(
    (d) => WEEK_MAP[d] ?? 1
  );
  const disciplinesPerDay = Math.max(1, uc.disciplines_per_day || 2);

  const disciplineQueue = uc.disciplines
    .map((d) => ({
      ...d,
      remaining: d.subjects.filter((s) => !completedSet.has(s.id)),
    }))
    .filter((d) => d.remaining.length > 0);

  if (disciplineQueue.length === 0) {
    await prisma.userCronogram.update({
      where: { id: userCronogramId },
      data: { total_days: uc.total_days || 0 },
    });
    return { created: 0 };
  }

  const totalSubjects = disciplineQueue.reduce((s, d) => s + d.remaining.length, 0);
  const maxDays = totalSubjects + 14;
  let tasksBatch = [];
  let dayNumber = 1;
  let subjectsPlaced = 0;
  let dateStr = nextStudyDateStr(dateStrSP(), studyDayNums);
  let cursor = 0; // round-robin entre disciplinas

  while (subjectsPlaced < totalSubjects && dayNumber <= maxDays) {
    const active = disciplineQueue.filter((d) => d.remaining.length > 0);
    if (active.length === 0) break;

    let orderInDay = 0;
    const picked = [];
    // Round-robin a partir do cursor
    for (let n = 0; n < Math.min(disciplinesPerDay, active.length); n++) {
      const idx = (cursor + n) % active.length;
      picked.push(active[idx]);
    }
    cursor = (cursor + 1) % Math.max(active.length, 1);

    for (const disc of picked) {
      const subject = disc.remaining.shift();
      if (!subject) continue;
      tasksBatch.push({
        user_cronogram_id: userCronogramId,
        subject_id: subject.id,
        discipline_id: disc.id,
        scheduled_date: dateStrToDate(dateStr),
        day_number: dayNumber,
        display_order: orderInDay++,
        status: 'pending',
      });
      subjectsPlaced++;
    }

    dayNumber++;
    dateStr = nextStudyDateStr(addDaysStr(dateStr, 1), studyDayNums);

    if (tasksBatch.length >= 100) {
      await prisma.userDailyTask.createMany({ data: tasksBatch });
      tasksBatch = [];
    }
  }

  if (tasksBatch.length > 0) {
    await prisma.userDailyTask.createMany({ data: tasksBatch });
  }

  await prisma.userCronogram.update({
    where: { id: userCronogramId },
    data: { total_days: dayNumber - 1 },
  });

  return { created: subjectsPlaced };
}

// ─── CRONOGRAMS (OFICIAIS/ADMIN) ───────────────────────────────────────────────

export const listCronograms = async (req, res) => {
  try {
    const { official, status, page = 1, limit = 20 } = req.query;
    const where = {};
    // status omitido ou "all" → lista todos (admin); senão filtra
    if (status && status !== 'all') where.status = status;
    if (official === 'true') {
      where.is_official = true;
      // Galeria do aluno: só públicos
      if (req.query.include_private !== 'true') where.is_public = true;
    }
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
      category, is_official, is_public, total_days, tags, display_order, status,
      disciplines = [],
    } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Título obrigatório' });
    }

    const cleanTitle = String(title).trim();
    const autoSlug = (slug && String(slug).trim())
      || cleanTitle
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

    const cronogram = await prisma.cronogram.create({
      data: {
        title: cleanTitle,
        slug: autoSlug || null,
        description: description || null,
        thumbnail_url: thumbnail_url || null,
        contest: contest || null,
        exam_board: exam_board || null,
        position: position || null,
        category: category || null,
        is_official: !!is_official,
        is_public: is_public !== false,
        total_days: total_days ?? null,
        tags: tags || [],
        display_order: display_order || 0,
        status: status || 'active',
        created_by: req.user.id,
        disciplines: {
          create: (disciplines || []).map((d, i) => ({
            name: d.name,
            display_order: d.display_order ?? i,
            color: d.color || 'blue',
            icon: d.icon || null,
            weight: d.weight ?? 1,
            difficulty: d.difficulty ?? 3,
            required: d.required !== false,
            suggested_hours: d.suggested_hours ?? null,
            subjects: {
              create: (d.subjects || []).map((s, j) => ({
                name: typeof s === 'string' ? s : s.name,
                description: typeof s === 'string' ? null : (s.description || null),
                display_order: typeof s === 'string' ? j : (s.display_order ?? j),
                weight: typeof s === 'string' ? 1 : (s.weight ?? 1),
                suggested_minutes: typeof s === 'string' ? 60 : (s.suggested_minutes ?? 60),
                required: typeof s === 'string' ? true : (s.required !== false),
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
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um cronograma com esse slug' });
    }
    res.status(500).json({ error: 'Erro ao criar cronograma', detail: err.message });
  }
};

export const updateCronogram = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, slug, description, thumbnail_url, contest, exam_board, position,
      category, status, is_official, is_public, total_days, tags, display_order,
      disciplines,
    } = req.body;

    const existing = await prisma.cronogram.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: 'Cronograma não encontrado' });

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

    // Troca completa de disciplinas/assuntos quando enviados
    if (Array.isArray(disciplines)) {
      await prisma.cronogramDiscipline.deleteMany({ where: { cronogram_id: id } });
      if (disciplines.length > 0) {
        for (let i = 0; i < disciplines.length; i++) {
          const d = disciplines[i];
          if (!d?.name?.trim()) continue;
          await prisma.cronogramDiscipline.create({
            data: {
              cronogram_id: id,
              name: d.name.trim(),
              display_order: d.display_order ?? i,
              color: d.color || 'blue',
              icon: d.icon || null,
              weight: d.weight ?? 1,
              difficulty: d.difficulty ?? 3,
              required: d.required !== false,
              suggested_hours: d.suggested_hours ?? null,
              subjects: {
                create: (d.subjects || [])
                  .filter((s) => (typeof s === 'string' ? s.trim() : s?.name?.trim()))
                  .map((s, j) => ({
                    name: typeof s === 'string' ? s.trim() : s.name.trim(),
                    description: typeof s === 'string' ? null : (s.description || null),
                    display_order: typeof s === 'string' ? j : (s.display_order ?? j),
                    weight: typeof s === 'string' ? 1 : (s.weight ?? 1),
                    suggested_minutes: typeof s === 'string' ? 60 : (s.suggested_minutes ?? 60),
                    required: typeof s === 'string' ? true : (s.required !== false),
                  })),
              },
            },
          });
        }
      }
    }

    if (Object.keys(data).length > 0) {
      await prisma.cronogram.update({ where: { id }, data });
    }

    const cronogram = await prisma.cronogram.findUnique({
      where: { id },
      include: { disciplines: { include: { subjects: true }, orderBy: { display_order: 'asc' } } },
    });
    res.json(cronogram);
  } catch (err) {
    console.error('updateCronogram error:', err);
    res.status(500).json({ error: 'Erro ao atualizar cronograma', detail: err.message });
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
              include: { progress: true },
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
    if (!Array.isArray(disciplines) || disciplines.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos uma disciplina' });
    }

    const normalized = disciplines.map((d, i) => {
      const subjects = (d.subjects || [])
        .map((s, j) => ({
          name: typeof s === 'string' ? s.trim() : String(s?.name || '').trim(),
          display_order: j,
          suggested_minutes: s?.suggested_minutes ?? 60,
          ...(s?.source_subject_id ? { source_subject_id: s.source_subject_id } : {}),
        }))
        .filter((s) => s.name);
      return {
        name: String(d.name || '').trim(),
        display_order: i,
        color: d.color || 'blue',
        difficulty: Math.min(5, Math.max(1, Number(d.difficulty) || 3)),
        weight: Math.min(5, Math.max(1, Number(d.difficulty) || 3)),
        ...(d.source_discipline_id ? { source_discipline_id: d.source_discipline_id } : {}),
        subjects,
      };
    }).filter((d) => d.name && d.subjects.length > 0);

    if (normalized.length === 0) {
      return res.status(400).json({ error: 'Cada disciplina precisa de ao menos um assunto' });
    }

    if (cronogram_id) {
      const existing = await prisma.userCronogram.findFirst({
        where: { user_id: userId, cronogram_id },
      });
      if (existing) {
        return res.status(409).json({ error: 'Você já utiliza esse cronograma', id: existing.id });
      }
    }

    const uc = await prisma.userCronogram.create({
      data: {
        user_id: userId,
        ...(cronogram_id ? { cronogram_id } : {}),
        title,
        contest: contest || null,
        type: type || 'custom',
        disciplines_per_day: Number(disciplines_per_day) || 2,
        study_days: study_days?.length ? study_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        daily_minutes: Number(daily_minutes) || 120,
        ...(target_date ? { target_date } : {}),
        status: 'active',
        disciplines: {
          create: normalized.map((d) => ({
            name: d.name,
            display_order: d.display_order,
            color: d.color,
            difficulty: d.difficulty,
            weight: d.weight,
            ...(d.source_discipline_id ? { source_discipline_id: d.source_discipline_id } : {}),
            subjects: {
              create: d.subjects.map((s) => ({
                name: s.name,
                display_order: s.display_order,
                suggested_minutes: s.suggested_minutes,
                ...(s.source_subject_id ? { source_subject_id: s.source_subject_id } : {}),
              })),
            },
          })),
        },
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
        skipDuplicates: true,
      });
    }

    try {
      await generateDailyTasks(uc.id);
    } catch (genErr) {
      console.error('generateDailyTasks after create failed:', genErr);
    }

    if (cronogram_id) {
      await prisma.cronogram.update({
        where: { id: cronogram_id },
        data: { students_count: { increment: 1 } },
      }).catch(() => {});
    }

    const result = await prisma.userCronogram.findUnique({
      where: { id: uc.id },
      include: {
        disciplines: { include: { subjects: { include: { progress: true } } } },
        _count: { select: { daily_tasks: true } },
      },
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('createUserCronogram error:', err);
    res.status(500).json({ error: 'Erro ao criar cronograma', detail: err.message });
  }
};

/** Excluir cronograma do usuário */
export const deleteUserCronogram = async (req, res) => {
  try {
    const uc = await prisma.userCronogram.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
      select: { id: true, cronogram_id: true },
    });
    if (!uc) return res.status(404).json({ error: 'Não encontrado' });

    await prisma.userCronogram.delete({ where: { id: uc.id } });

    if (uc.cronogram_id) {
      await prisma.cronogram.update({
        where: { id: uc.cronogram_id },
        data: { students_count: { decrement: 1 } },
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    console.error('deleteUserCronogram error:', err);
    res.status(500).json({ error: 'Erro ao excluir cronograma' });
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

    try {
      await generateDailyTasks(uc.id);
    } catch (genErr) {
      console.error('generateDailyTasks after adopt failed:', genErr);
    }

    await prisma.cronogram.update({
      where: { id: cronogram_id },
      data: { students_count: { increment: 1 } },
    }).catch(() => {});

    res.status(201).json(await prisma.userCronogram.findUnique({
      where: { id: uc.id },
      include: { disciplines: { include: { subjects: { include: { progress: true } } } } },
    }));
  } catch (err) {
    console.error('adoptOfficialCronogram error:', err);
    res.status(500).json({ error: 'Erro ao adotar cronograma', detail: err.message });
  }
};

/** Retorna tarefas de um dia específico */
export const getDayTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD, default today (SP)

    const targetDate = date || dateStrSP();

    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
      select: { id: true },
    });
    if (!uc) return res.status(404).json({ error: 'Não encontrado' });

    const tasks = await prisma.userDailyTask.findMany({
      where: { user_cronogram_id: id, scheduled_date: dateStrToDate(targetDate) },
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
      scheduled_date: dateToStr(t.scheduled_date),
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
    let { id } = req.params; // user_cronogram_id (pode vir só pelo alias legado)
    const { status, notes, rescheduled_to } = req.body;
    const allowed = ['pending', 'completed', 'skipped', 'rescheduled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Alias legado /my/tasks/:taskId — resolve cronogram via task
    if (!id) {
      const bare = await prisma.userDailyTask.findUnique({
        where: { id: taskId },
        select: { user_cronogram_id: true },
      });
      if (!bare) return res.status(404).json({ error: 'Tarefa não encontrada' });
      id = bare.user_cronogram_id;
    }

    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
      select: { id: true, last_study_date: true, streak: true },
    });
    if (!uc) return res.status(403).json({ error: 'Acesso negado' });

    const task = await prisma.userDailyTask.findFirst({
      where: { id: taskId, user_cronogram_id: id },
    });
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const data = { status };
    if (notes !== undefined) data.notes = notes;
    if (rescheduled_to !== undefined) {
      data.rescheduled_to = typeof rescheduled_to === 'string'
        ? rescheduled_to.slice(0, 10)
        : rescheduled_to;
    }
    if (status === 'completed') data.completed_at = new Date();
    else if (status === 'pending') data.completed_at = null;

    const updated = await prisma.userDailyTask.update({ where: { id: taskId }, data });

    // Progresso do assunto + streak (não derruba a resposta se falhar)
    try {
      if (status === 'completed' && task.subject_id) {
        const existingSubjProg = await prisma.userSubjectProgress.findFirst({
          where: { user_cronogram_id: id, subject_id: task.subject_id },
        });
        if (existingSubjProg) {
          await prisma.userSubjectProgress.update({
            where: { id: existingSubjProg.id },
            data: { status: 'completed', completed_at: new Date() },
          });
        } else {
          await prisma.userSubjectProgress.create({
            data: {
              user_cronogram_id: id,
              subject_id: task.subject_id,
              status: 'completed',
              completed_at: new Date(),
            },
          });
        }
      } else if (status === 'pending' && task.subject_id) {
        const existingSubjProg = await prisma.userSubjectProgress.findFirst({
          where: { user_cronogram_id: id, subject_id: task.subject_id },
        });
        if (existingSubjProg && existingSubjProg.status === 'completed') {
          await prisma.userSubjectProgress.update({
            where: { id: existingSubjProg.id },
            data: { status: 'not_started', completed_at: null },
          });
        }
      }

      if (status === 'completed') {
        const today = dateStrSP();
        if (uc.last_study_date !== today) {
          const yesterdayStr = addDaysStr(today, -1);
          const newStreak = uc.last_study_date === yesterdayStr ? (uc.streak || 0) + 1 : 1;
          await prisma.userCronogram.update({
            where: { id },
            data: { last_study_date: today, streak: newStreak, days_studied: { increment: 1 } },
          });
        }
      }
    } catch (sideErr) {
      console.error('updateTaskStatus side-effects error:', sideErr);
    }

    res.json({
      ...updated,
      scheduled_date: dateToStr(updated.scheduled_date),
    });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa', detail: err.message });
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
    const allowed = ['not_started', 'in_progress', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const uc = await prisma.userCronogram.findFirst({
      where: { id, user_id: req.user.id },
      select: { id: true },
    });
    if (!uc) return res.status(403).json({ error: 'Acesso negado' });

    const subject = await prisma.userCronogramSubject.findFirst({
      where: { id: subjectId, discipline: { user_cronogram_id: id } },
      select: { id: true },
    });
    if (!subject) return res.status(404).json({ error: 'Assunto não encontrado' });

    const existingProg = await prisma.userSubjectProgress.findFirst({
      where: { user_cronogram_id: id, subject_id: subjectId },
    });
    const progData = {
      status,
      ...(notes !== undefined ? { notes } : {}),
      completed_at: status === 'completed' ? new Date() : null,
    };
    const prog = existingProg
      ? await prisma.userSubjectProgress.update({ where: { id: existingProg.id }, data: progData })
      : await prisma.userSubjectProgress.create({ data: { user_cronogram_id: id, subject_id: subjectId, ...progData } });

    if (status === 'completed') {
      await prisma.userDailyTask.updateMany({
        where: { user_cronogram_id: id, subject_id: subjectId, status: { in: ['pending', 'skipped'] } },
        data: { status: 'completed', completed_at: new Date() },
      });
    } else if (status === 'not_started') {
      await prisma.userDailyTask.updateMany({
        where: { user_cronogram_id: id, subject_id: subjectId, status: 'completed' },
        data: { status: 'pending', completed_at: null },
      });
    }

    res.json(prog);
  } catch (err) {
    console.error('updateSubjectProgress error:', err);
    res.status(500).json({ error: 'Erro ao atualizar progresso', detail: err.message });
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
    const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
    // Último dia do mês: Date.UTC(y, m, 0) = último dia do mês m
    const lastDay = new Date(Date.UTC(y, m, 0, 12, 0, 0));
    const endStr = lastDay.toISOString().slice(0, 10);

    const tasks = await prisma.userDailyTask.findMany({
      where: {
        user_cronogram_id: id,
        scheduled_date: {
          gte: dateStrToDate(startStr),
          lte: dateStrToDate(endStr),
        },
      },
      select: { scheduled_date: true, status: true },
    });

    const byDate = {};
    for (const t of tasks) {
      const d = dateToStr(t.scheduled_date); // normaliza Date → 'YYYY-MM-DD'
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
      SELECT
        q.discipline,
        COALESCE(
          (
            SELECT array_agg(DISTINCT s ORDER BY s)
            FROM questions q2, unnest(q2.subjects) AS s
            WHERE q2.discipline = q.discipline
              AND s IS NOT NULL AND s <> ''
          ),
          ARRAY[]::text[]
        ) AS subjects
      FROM (
        SELECT DISTINCT discipline
        FROM questions
        WHERE discipline IS NOT NULL AND discipline <> ''
      ) q
      ORDER BY q.discipline
    `;
    res.json(rows.map((r) => ({ discipline: r.discipline, subjects: r.subjects || [] })));
  } catch (err) {
    console.error('getAvailableDisciplines error:', err);
    res.status(500).json({ error: 'Erro ao buscar disciplinas' });
  }
};

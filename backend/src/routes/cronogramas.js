import express from 'express';
import {
  listCronograms, getCronogram, createCronogram, updateCronogram, deleteCronogram,
  listUserCronograms, getUserCronogram, createUserCronogram, adoptOfficialCronogram,
  getDayTasks, updateTaskStatus, recalculate, updateSubjectProgress,
  getUserCronogramStats, getCalendar, getAvailableDisciplines,
} from '../controllers/cronogramaController.js';
import { authenticate, requireActiveSubscription, requireCronogramasBeta } from '../middlewares/auth.js';

const router = express.Router();

// Beta: só emails liberados em requireCronogramasBeta
const guard = [authenticate, requireCronogramasBeta, requireActiveSubscription];
const guardAuth = [authenticate, requireCronogramasBeta];

// ── Oficial / disciplinas ──────────────────────────────────────────────────────
router.get('/official',          ...guard, listCronograms);
router.get('/disciplines',       ...guard, getAvailableDisciplines);

// ── Cronogramas do usuário ─────────────────────────────────────────────────────
router.get('/my',                   ...guard, listUserCronograms);
router.post('/my',                  ...guard, createUserCronogram);
router.get('/my/:id',               ...guard, getUserCronogram);
router.get('/my/:id/tasks',         ...guard, getDayTasks);
router.get('/my/:id/stats',         ...guard, getUserCronogramStats);
router.get('/my/:id/calendar',      ...guard, getCalendar);
router.post('/my/:id/recalculate',  ...guard, recalculate);
router.patch('/my/tasks/:taskId',   ...guard, updateTaskStatus);
router.patch('/my/:id/subjects/:subjectId/progress', ...guard, updateSubjectProgress);

// ── Adotar cronograma oficial ──────────────────────────────────────────────────
router.post('/official/:cronogram_id/adopt', ...guard, adoptOfficialCronogram);

// ── Admin: CRUD cronogramas oficiais ──────────────────────────────────────────
router.get('/',        ...guardAuth, listCronograms);
router.get('/:id',     ...guardAuth, getCronogram);
router.post('/',       ...guardAuth, createCronogram);
router.put('/:id',     ...guardAuth, updateCronogram);
router.delete('/:id',  ...guardAuth, deleteCronogram);

export default router;

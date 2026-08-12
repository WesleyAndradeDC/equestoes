import express from 'express';
import {
  listCronograms, getCronogram, createCronogram, updateCronogram, deleteCronogram,
  listUserCronograms, getUserCronogram, createUserCronogram, deleteUserCronogram,
  adoptOfficialCronogram, getDayTasks, updateTaskStatus, recalculate, updateSubjectProgress,
  getUserCronogramStats, getCalendar, getAvailableDisciplines,
} from '../controllers/cronogramaController.js';
import { authenticate, requireActiveSubscription, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

const guard = [authenticate, requireActiveSubscription];
const guardAdmin = [authenticate, requireAdmin];

// ── Oficial / disciplinas ──────────────────────────────────────────────────────
router.get('/official',          ...guard, listCronograms);
router.get('/disciplines',       ...guard, getAvailableDisciplines);

// ── Cronogramas do usuário ─────────────────────────────────────────────────────
router.get('/my',                   ...guard, listUserCronograms);
router.post('/my',                  ...guard, createUserCronogram);
router.get('/my/:id',               ...guard, getUserCronogram);
router.delete('/my/:id',            ...guard, deleteUserCronogram);
router.get('/my/:id/tasks',         ...guard, getDayTasks);
router.patch('/my/:id/tasks/:taskId', ...guard, updateTaskStatus);
router.patch('/my/tasks/:taskId',   ...guard, updateTaskStatus); // alias legado
router.get('/my/:id/stats',         ...guard, getUserCronogramStats);
router.get('/my/:id/calendar',      ...guard, getCalendar);
router.post('/my/:id/recalculate',  ...guard, recalculate);
router.patch('/my/:id/subjects/:subjectId/progress', ...guard, updateSubjectProgress);

// ── Adotar cronograma oficial ──────────────────────────────────────────────────
router.post('/official/:cronogram_id/adopt', ...guard, adoptOfficialCronogram);

// ── Admin: CRUD cronogramas oficiais ──────────────────────────────────────────
router.get('/',        ...guardAdmin, listCronograms);
router.get('/:id',     ...guardAdmin, getCronogram);
router.post('/',       ...guardAdmin, createCronogram);
router.put('/:id',     ...guardAdmin, updateCronogram);
router.delete('/:id',  ...guardAdmin, deleteCronogram);

export default router;

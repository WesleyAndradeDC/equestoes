import express from 'express';
import {
  listCronograms, getCronogram, createCronogram, updateCronogram, deleteCronogram,
  listUserCronograms, getUserCronogram, createUserCronogram, adoptOfficialCronogram,
  getDayTasks, updateTaskStatus, recalculate, updateSubjectProgress,
  getUserCronogramStats, getCalendar, getAvailableDisciplines,
} from '../controllers/cronogramaController.js';
import { authenticate, requireActiveSubscription } from '../middlewares/auth.js';

const router = express.Router();

// ── Pública (auth obrigatória) ─────────────────────────────────────────────────
router.get('/official',          authenticate, requireActiveSubscription, listCronograms);
router.get('/disciplines',       authenticate, requireActiveSubscription, getAvailableDisciplines);

// ── Cronogramas do usuário ─────────────────────────────────────────────────────
router.get('/my',                   authenticate, requireActiveSubscription, listUserCronograms);
router.post('/my',                  authenticate, requireActiveSubscription, createUserCronogram);
router.get('/my/:id',               authenticate, requireActiveSubscription, getUserCronogram);
router.get('/my/:id/tasks',         authenticate, requireActiveSubscription, getDayTasks);
router.get('/my/:id/stats',         authenticate, requireActiveSubscription, getUserCronogramStats);
router.get('/my/:id/calendar',      authenticate, requireActiveSubscription, getCalendar);
router.post('/my/:id/recalculate',  authenticate, requireActiveSubscription, recalculate);
router.patch('/my/tasks/:taskId',   authenticate, requireActiveSubscription, updateTaskStatus);
router.patch('/my/:id/subjects/:subjectId/progress', authenticate, requireActiveSubscription, updateSubjectProgress);

// ── Adotar cronograma oficial ──────────────────────────────────────────────────
router.post('/official/:cronogram_id/adopt', authenticate, requireActiveSubscription, adoptOfficialCronogram);

// ── Admin: CRUD cronogramas oficiais ──────────────────────────────────────────
router.get('/',        authenticate, listCronograms);
router.get('/:id',     authenticate, getCronogram);
router.post('/',       authenticate, createCronogram);
router.put('/:id',     authenticate, updateCronogram);
router.delete('/:id',  authenticate, deleteCronogram);

export default router;

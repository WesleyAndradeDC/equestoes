import express from 'express';
import {
  createReport,
  listReports,
  getReportCounts,
  updateReport,
  deleteReport,
} from '../controllers/reportController.js';
import { authenticate, requireProfessor, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Qualquer usuário autenticado pode criar um report
router.post('/',        authenticate, createReport);

// Admin e professor: listar e gerenciar reports
router.get('/counts',   authenticate, requireProfessor, getReportCounts);
router.get('/',         authenticate, requireProfessor, listReports);
router.put('/:id',      authenticate, requireProfessor, updateReport);
router.delete('/:id',   authenticate, requireAdmin,     deleteReport);

export default router;

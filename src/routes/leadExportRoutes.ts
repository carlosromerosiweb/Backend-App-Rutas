import { Router } from 'express';
import { exportLeads } from '../controllers/leadExportController';
import { authenticate } from '../middlewares/auth';
import { checkRole } from '../middlewares/roleCheck';

const router = Router();

// Ruta para exportar leads
router.get(
  '/export',
  authenticate,
  checkRole(['Manager', 'Admin']),
  exportLeads
);

export default router; 
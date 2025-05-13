import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';

const router = Router();
const dashboardController = new DashboardController();

// Ruta protegida que requiere autenticación y rol de admin
router.get(
  '/overview',
  authenticate,
  checkRole(['admin']),
  dashboardController.getOverview
);

export default router; 